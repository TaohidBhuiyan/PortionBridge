/**
 * Centralized application constants.
 * Nothing here should change per-environment — env-specific values belong in .env.
 */

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

const USER_ROLES = {
  DONOR: 'donor',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
};

const DONATION_CATEGORY = {
  FOOD: 'food',
  CLOTHES: 'clothes',
};

const DONATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  SCHEDULED: 'scheduled',
  ON_THE_WAY: 'on_the_way',
  PICKED_UP: 'picked_up',
  COMPLETED: 'completed',
};

const NOTIFICATION_TYPES = {
  DONATION_CREATED: 'donation_created',
  VOLUNTEER_ASSIGNED: 'volunteer_assigned',
  DONATION_ACCEPTED: 'donation_accepted',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  VOLUNTEER_ON_THE_WAY: 'volunteer_on_the_way',
  PICKUP_COMPLETED: 'pickup_completed',
  DONATION_CANCELLED: 'donation_cancelled',
  ASSIGNMENT_CHANGED: 'assignment_changed',
  NEW_MESSAGE: 'new_message',
  STATUS_UPDATED: 'status_updated',
  RATING_RECEIVED: 'rating_received',
  REPORT_FILED: 'report_filed',
  TEAM_INVITATION_RECEIVED: 'team_invitation_received',
  TEAM_INVITATION_ACCEPTED: 'team_invitation_accepted',
  TEAM_MEMBER_JOINED: 'team_member_joined',
  TEAM_MEMBER_LEFT: 'team_member_left',
  TEAM_LEADERSHIP_TRANSFERRED: 'team_leadership_transferred',
  TEAM_MEMBER_PROMOTED: 'team_member_promoted',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
  TEAM_ANNOUNCEMENT: 'team_announcement',
  TEAM_DONATION_ASSIGNED: 'team_donation_assigned',
  TEAM_DONATION_COMPLETED: 'team_donation_completed',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
};

const REPORT_TARGET_TYPES = {
  USER: 'user',
  DONATION_REQUEST: 'donation_request',
};

const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 300,
};

const AUTH = {
  PUBLIC_REGISTERABLE_ROLES: [USER_ROLES.DONOR, USER_ROLES.VOLUNTEER],

  // --- Refresh token / session cookie ---
  REFRESH_COOKIE_NAME: 'refreshToken',
  REFRESH_TOKEN_EXPIRES_DAYS: 7,

  // --- CSRF (double-submit cookie pattern) ---
  CSRF_COOKIE_NAME: 'csrfToken',
  CSRF_HEADER_NAME: 'x-csrf-token',

  // --- Email verification ---
  EMAIL_VERIFICATION_EXPIRES_HOURS: 24,

  // --- Password reset ---
  RESET_TOKEN_EXPIRES_MINUTES: 15,
  FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  FORGOT_PASSWORD_RATE_LIMIT_MAX: 5,

  // --- Password reuse prevention ---
  PASSWORD_HISTORY_LIMIT: 5,

  // --- Account lockout ---
  ACCOUNT_LOCK_MAX_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION_MINUTES: 15,

  // --- Login/register rate limiting (stricter than the global API limiter) ---
  LOGIN_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  LOGIN_RATE_LIMIT_MAX: 20,
  REGISTER_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000,
  REGISTER_RATE_LIMIT_MAX: 5,
};

const AUDIT_ACTIONS = {
  REGISTER: 'register',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  ACCOUNT_LOCKED: 'account_locked',
  LOGOUT: 'logout',
  LOGOUT_ALL: 'logout_all',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  EMAIL_VERIFIED: 'email_verified',
  EMAIL_VERIFICATION_RESENT: 'email_verification_resent',
  TOKEN_REFRESHED: 'token_refreshed',
  REFRESH_TOKEN_REUSE_DETECTED: 'refresh_token_reuse_detected',

  // --- Module 8: Donation lifecycle ---
  DONATION_CREATED: 'donation_created',
  DONATION_UPDATED: 'donation_updated',
  DONATION_CANCELLED: 'donation_cancelled',

  // --- Module 9: live status flow, ratings, reports ---
  DONATION_ON_THE_WAY: 'donation_on_the_way',
  DONATION_PICKED_UP: 'donation_picked_up',
  DONATION_COMPLETED: 'donation_completed',
  RATING_CREATED: 'rating_created',
  REPORT_FILED: 'report_filed',

  // --- Phase 8: Admin moderation & notifications ---
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned',
  REPORT_INVESTIGATED: 'report_investigated',
  REPORT_RESOLVED: 'report_resolved',
  REPORT_DISMISSED: 'report_dismissed',
  ADMIN_ANNOUNCEMENT_SENT: 'admin_announcement_sent',
};

// --- Donation Form Enums ---

const FOOD_TYPE = {
  COOKED: 'cooked',
  RAW: 'raw',
  PACKAGED: 'packaged',
};

const QUANTITY_UNIT = {
  PLATE: 'plate',
  BOX: 'box',
  PACKET: 'packet',
  PIECE: 'piece',
  KG: 'kg',
  GRAM: 'gram',
  LITER: 'liter',
};

const STORAGE_REQUIREMENT = {
  ROOM_TEMPERATURE: 'room_temperature',
  REFRIGERATED: 'refrigerated',
  FROZEN: 'frozen',
};

const VEGETARIAN = {
  VEGETARIAN: 'vegetarian',
  NON_VEGETARIAN: 'non_vegetarian',
};

const HALAL = {
  YES: 'yes',
  NO: 'no',
};

const REFRIGERATION_REQUIRED = {
  YES: 'yes',
  NO: 'no',
};

const ALLERGENS = {
  MILK: 'milk',
  EGG: 'egg',
  NUTS: 'nuts',
  SOY: 'soy',
  WHEAT: 'wheat',
  FISH: 'fish',
  SHELLFISH: 'shellfish',
};

const CLOTHING_CATEGORY = {
  SHIRT: 'shirt',
  T_SHIRT: 't_shirt',
  PANTS: 'pants',
  JEANS: 'jeans',
  JACKET: 'jacket',
  SWEATER: 'sweater',
  SAREE: 'saree',
  SALWAR_KAMEEZ: 'salwar_kameez',
  HIJAB: 'hijab',
  SHOES: 'shoes',
  BLANKET: 'blanket',
  OTHERS: 'others',
};

const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  UNISEX: 'unisex',
};

const AGE_GROUP = {
  BABY: 'baby',
  CHILD: 'child',
  TEEN: 'teen',
  ADULT: 'adult',
  SENIOR: 'senior',
};

const CONDITION = {
  NEW: 'new',
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair',
};

const SIZE = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl',
  XXL: 'xxl',
  FREE_SIZE: 'free_size',
};

const SEASON = {
  SUMMER: 'summer',
  WINTER: 'winter',
  RAINY: 'rainy',
  ALL_SEASON: 'all_season',
};

const ADDRESS_LABEL = {
  HOME: 'home',
  OFFICE: 'office',
  OTHER: 'other',
  CUSTOM: 'custom',
};

const TIME_SLOT = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

const VEHICLE_TYPE = {
  WALKING: 'walking',
  BICYCLE: 'bicycle',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
};

const AVAILABILITY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

const CONTACT_METHOD = {
  EMAIL: 'email',
  PHONE: 'phone',
  BOTH: 'both',
};

const TEAM_MEMBER_ROLE = {
  LEADER: 'leader',
  MEMBER: 'member',
};

const TEAM_INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
};

const ASSIGNMENT_MODE = {
  INDIVIDUAL: 'individual',
  TEAM: 'team',
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  DONATION_CATEGORY,
  DONATION_STATUS,
  NOTIFICATION_TYPES,
  REPORT_TARGET_TYPES,
  REPORT_STATUS,
  PAGINATION_DEFAULTS,
  UPLOAD_LIMITS,
  RATE_LIMIT,
  AUTH,
  AUDIT_ACTIONS,
  FOOD_TYPE,
  QUANTITY_UNIT,
  STORAGE_REQUIREMENT,
  VEGETARIAN,
  HALAL,
  REFRIGERATION_REQUIRED,
  ALLERGENS,
  CLOTHING_CATEGORY,
  GENDER,
  AGE_GROUP,
  CONDITION,
  SIZE,
  SEASON,
  ADDRESS_LABEL,
  TIME_SLOT,
  VEHICLE_TYPE,
  AVAILABILITY,
  CONTACT_METHOD,
  TEAM_MEMBER_ROLE,
  TEAM_INVITATION_STATUS,
  ASSIGNMENT_MODE,
};
