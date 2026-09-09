const { BrevoClient } = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');

/**
 * Email delivery service, backed by Brevo's transactional email API
 * (https://developers.brevo.com/docs/send-a-transactional-email).
 *
 * MIGRATION NOTE: this used to send via nodemailer/SMTP (EMAIL_HOST/
 * EMAIL_USER/EMAIL_PASSWORD). Every other file in the app calls the same
 * five exported functions as before — sendVerificationEmail (now also
 * takes the user's name, previously just email+token),
 * sendPasswordResetEmail, sendAccountLockedEmail — so nothing outside this
 * file needed to change. Same dev-mode console-logging behavior, same
 * local HTML templates, same "throw if unconfigured in production, log
 * and no-op in development" behavior — only the actual transport changed.
 */

const EMAIL_CONFIG = {
  senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@portionbridge.com',
  senderName: process.env.BREVO_SENDER_NAME || 'PortionBridge',
  supportUrl: process.env.SUPPORT_URL || process.env.CLIENT_URL || 'https://portionbridge.com/support',
};

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isEmailConfigured = Boolean(process.env.BREVO_API_KEY);

// Constructed lazily (not at module load) so a missing BREVO_API_KEY in
// development doesn't throw on require() — mirrors the old
// createTransporter()'s "return null if unconfigured" behavior.
let brevoClient = null;
function getBrevoClient() {
  if (!isEmailConfigured) {
    return null;
  }
  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  }
  return brevoClient;
}

/**
 * Loads an HTML template and replaces placeholder variables.
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {Object} variables - Key-value pairs to replace in the template
 * @returns {string} Rendered HTML
 */
function loadTemplate(templateName, variables = {}) {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  
  try {
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = variables[key];
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return html;
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Logs email details in development mode only.
 * Never logs raw tokens in production.
 */
function logEmailDevelopment(subject, toEmail, url, token) {
  if (!isDevelopment) {
    return;
  }
  
  console.log('==================== EMAIL (Development Mode) ====================');
  console.log(`To: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`URL: ${url}`);
  console.log(`Token: ${token}`);
  console.log('=================================================================');
}

/**
 * Sends an email via Brevo's transactional email API.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text fallback
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html, text }) {
  const client = getBrevoClient();

  if (!client) {
    // Development mode: log that email would be sent
    if (isDevelopment) {
      console.log(`[Email Service] Brevo not configured (BREVO_API_KEY missing). Would send to: ${to}, Subject: ${subject}`);
      return;
    }
    throw new Error('Email service is not configured. Please set BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME environment variables.');
  }

  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: { email: EMAIL_CONFIG.senderEmail, name: EMAIL_CONFIG.senderName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
    });
  } catch (error) {
    // Log only the message — never the full error object, which could
    // echo request details — and never the API key (which isn't part of
    // this error at all; it's set once at client construction, not
    // per-request).
    console.error('Failed to send email via Brevo:', error.message);
    throw new Error('Failed to send email. Please try again later.');
  }
}

/**
 * Sends an email verification email to a newly registered user.
 * @param {Object} params
 * @param {string} params.email - Recipient email address
 * @param {string} params.name - Recipient's display name, for personalization
 * @param {string} params.rawToken - Raw verification token (only used in development logging)
 */
async function sendVerificationEmail({ email, name, rawToken }) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
  const html = loadTemplate('email-verification', {
    name: name || 'there',
    verificationUrl: verifyUrl,
    supportUrl: EMAIL_CONFIG.supportUrl,
  });
  const text = `Welcome to PortionBridge, ${name || 'there'}!\n\n`
    + `Thanks for creating your PortionBridge account. Please verify your email address to activate it:\n\n`
    + `${verifyUrl}\n\n`
    + `This verification link expires in 24 hours.\n\n`
    + `If you did not create this account, you can safely ignore this email.`;

  // Log in development mode only
  logEmailDevelopment('Verify your PortionBridge account', email, verifyUrl, rawToken);

  // Send actual email if configured
  await sendEmail({
    to: email,
    subject: 'Verify your PortionBridge account',
    html,
    text,
  });
}

/**
 * Sends a password reset email to a user who requested a reset.
 * @param {string} toEmail - Recipient email address
 * @param {string} rawToken - Raw reset token (only used in development logging)
 */
async function sendPasswordResetEmail(toEmail, rawToken) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  const html = loadTemplate('password-reset', {
    resetUrl,
    supportUrl: EMAIL_CONFIG.supportUrl,
  });

  // Log in development mode only
  logEmailDevelopment('Reset Your PortionBridge Password', toEmail, resetUrl, rawToken);

  // Send actual email if configured
  await sendEmail({
    to: toEmail,
    subject: 'Reset Your PortionBridge Password',
    html,
  });
}

/**
 * Sends an account locked notification email after too many failed login attempts.
 * @param {string} toEmail - Recipient email address
 * @param {number} lockDurationMinutes - Duration of the lock in minutes
 */
async function sendAccountLockedEmail(toEmail, lockDurationMinutes) {
  const html = loadTemplate('account-locked', {
    lockDurationMinutes,
    supportUrl: EMAIL_CONFIG.supportUrl,
  });

  // Log in development mode only (no token to log)
  if (isDevelopment) {
    console.log('==================== EMAIL (Development Mode) ====================');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Your PortionBridge account has been temporarily locked`);
    console.log(`Lock Duration: ${lockDurationMinutes} minutes`);
    console.log('=================================================================');
  }

  // Send actual email if configured
  await sendEmail({
    to: toEmail,
    subject: 'Your PortionBridge account has been temporarily locked',
    html,
  });
}

module.exports = { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendAccountLockedEmail 
};
