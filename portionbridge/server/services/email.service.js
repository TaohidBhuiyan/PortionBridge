const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Email delivery service with production-ready email provider support.
 * 
 * Supports both development (console logging for testing) and production
 * environments with configurable SMTP providers. Uses nodemailer for
 * email delivery and HTML templates for professional formatting.
 */

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_FROM || 'noreply@portionbridge.com',
  fromName: process.env.EMAIL_FROM_NAME || 'PortionBridge',
  supportUrl: process.env.SUPPORT_URL || process.env.CLIENT_URL || 'https://portionbridge.com/support',
};

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isEmailConfigured = EMAIL_CONFIG.host && EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass;

/**
 * Creates a nodemailer transporter based on configuration.
 * Returns null if email is not configured (development mode).
 */
function createTransporter() {
  if (!isEmailConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: {
      user: EMAIL_CONFIG.auth.user,
      pass: EMAIL_CONFIG.auth.pass,
    },
  });
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
 * Sends an email using the configured transporter.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text fallback
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Development mode: log that email would be sent
    if (isDevelopment) {
      console.log(`[Email Service] Email not configured. Would send to: ${to}, Subject: ${subject}`);
      return;
    }
    throw new Error('Email service is not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
  }

  try {
    await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

/**
 * Sends an email verification email to a newly registered user.
 * @param {string} toEmail - Recipient email address
 * @param {string} rawToken - Raw verification token (only used in development logging)
 */
async function sendVerificationEmail(toEmail, rawToken) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
  const html = loadTemplate('email-verification', {
    verificationUrl: verifyUrl,
    supportUrl: EMAIL_CONFIG.supportUrl,
  });

  // Log in development mode only
  logEmailDevelopment('Verify Your PortionBridge Account', toEmail, verifyUrl, rawToken);

  // Send actual email if configured
  await sendEmail({
    to: toEmail,
    subject: 'Verify Your PortionBridge Account',
    html,
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
