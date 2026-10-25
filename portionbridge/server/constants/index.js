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
  CANCELLED: 'cancelled',
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
  TEAM_JOIN_REQUEST_RECEIVED: 'team_join_request_received',
  TEAM_JOIN_REQUEST_ACCEPTED: 'team_join_request_accepted',
  TEAM_JOIN_REQUEST_REJECTED: 'team_join_request_rejected',
  TEAM_MEMBER_JOINED: 'team_member_joined',
  TEAM_MEMBER_LEFT: 'team_member_left',
  TEAM_LEADERSHIP_TRANSFERRED: 'team_leadership_transferred',
  TEAM_MEMBER_PROMOTED: 'team_member_promoted',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
  TEAM_ANNOUNCEMENT: 'team_announcement',
  TEAM_DONATION_ASSIGNED: 'team_donation_assigned',
  TEAM_DONATION_COMPLETED: 'team_donation_completed',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  SUPPORT_TICKET_USER_REPLY: 'support_ticket_user_reply',
  SUPPORT_TICKET_REPLY: 'support_ticket_reply',
  SUPPORT_TICKET_STATUS: 'support_ticket_status',
  DISASTER_ALERT: 'disaster_alert',
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
  MAX_LIMIT: 200,
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
  RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RESEND_VERIFICATION_RATE_LIMIT_MAX: 5,

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
  NOTIFICATION_TEMPLATE_CREATED: 'notification_template_created',
  NOTIFICATION_TEMPLATE_DELETED: 'notification_template_deleted',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  SUPPORT_TICKET_UPDATED: 'support_ticket_updated',
  SUPPORT_TICKET_REPLIED: 'support_ticket_replied',

  // --- Disaster Response & Relief (Phase 1) ---
  DISASTER_INCIDENT_REPORTED: 'disaster_incident_reported',
  DISASTER_INCIDENT_UPDATED: 'disaster_incident_updated',
  DISASTER_INCIDENT_STATUS_CHANGED: 'disaster_incident_status_changed',
  RELIEF_REQUEST_CREATED: 'relief_request_created',
  RELIEF_REQUEST_UPDATED: 'relief_request_updated',
  RELIEF_REQUEST_STATUS_CHANGED: 'relief_request_status_changed',
  RELIEF_ITEM_ADDED: 'relief_item_added',
  RELIEF_ITEM_UPDATED: 'relief_item_updated',
  RELIEF_ITEM_REMOVED: 'relief_item_removed',
  RELIEF_PLEDGE_CREATED: 'relief_pledge_created',
  RELIEF_PLEDGE_UPDATED: 'relief_pledge_updated',
  RELIEF_PLEDGE_CANCELLED: 'relief_pledge_cancelled',
  RELIEF_PLEDGE_COLLECTED: 'relief_pledge_collected',
  RELIEF_PLEDGE_DELIVERED: 'relief_pledge_delivered',
  RELIEF_PLEDGE_CLOSED_PARTIAL: 'relief_pledge_closed_partial',

  // --- Disaster Relief Phase 3: volunteer tasks & delivery verification ---
  RELIEF_TASK_ACCEPTED: 'relief_task_accepted',
  RELIEF_TASK_RELEASED: 'relief_task_released',
  RELIEF_TASK_STATUS_UPDATED: 'relief_task_status_updated',
  RELIEF_PICKUP_REPORTED: 'relief_pickup_reported',
  RELIEF_DELIVERY_REPORTED: 'relief_delivery_reported',
  RELIEF_DELIVERY_VERIFIED: 'relief_delivery_verified',
  RELIEF_DELIVERY_REJECTED: 'relief_delivery_rejected',
  RELIEF_PROBLEM_REPORTED: 'relief_problem_reported',
  RELIEF_REPORT_RESOLVED: 'relief_report_resolved',
  RELIEF_PLEDGE_FAILED: 'relief_pledge_failed',

  // --- Disaster Relief Phase 4: nationwide alerts & notifications ---
  DISASTER_ALERT_ISSUED: 'disaster_alert_issued',
  DISASTER_ALERT_AUTO_ISSUED: 'disaster_alert_auto_issued',
  DISASTER_ALERT_UPDATED: 'disaster_alert_updated',
  DISASTER_ALERT_ESCALATED: 'disaster_alert_escalated',
  DISASTER_ALERT_CORRECTED: 'disaster_alert_corrected',
  DISASTER_ALERT_RESOLVED: 'disaster_alert_resolved',
  DISASTER_ALERT_CANCELLED: 'disaster_alert_cancelled',
  DISASTER_ALERT_EVENT_RETRIED: 'disaster_alert_event_retried',
  DISASTER_ALERT_PREFERENCES_UPDATED: 'disaster_alert_preferences_updated',

  // --- Disaster Relief Phase 5: admin operations ---
  OPS_INCIDENT_INFO_REQUESTED: 'ops_incident_info_requested',
  OPS_INCIDENT_MERGED: 'ops_incident_merged',
  OPS_INCIDENT_REOPENED: 'ops_incident_reopened',
  OPS_REQUEST_CORRECTION_REQUESTED: 'ops_request_correction_requested',
  OPS_REQUEST_REASSESSMENT_FLAGGED: 'ops_request_reassessment_flagged',
  OPS_REQUEST_REASSESSMENT_CLEARED: 'ops_request_reassessment_cleared',
  OPS_REQUEST_QUANTITY_CHANGED: 'ops_request_quantity_changed',
  OPS_TASK_ASSIGNED: 'ops_task_assigned',
  OPS_TASK_REASSIGNED: 'ops_task_reassigned',
  OPS_TASK_RELEASED: 'ops_task_released',
  OPS_TASK_CANCELLED: 'ops_task_cancelled',
  OPS_DELIVERY_CORRECTED: 'ops_delivery_corrected',
  OPS_EXPORT_GENERATED: 'ops_export_generated',
};

const SUPPORT_TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  AWAITING_USER: 'awaiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const SUPPORT_CATEGORIES = {
  ACCOUNT: 'account',
  DONATION: 'donation',
  PICKUP: 'pickup',
  TECHNICAL: 'technical',
  SAFETY: 'safety',
  FEEDBACK: 'feedback',
  OTHER: 'other',
};

const SUPPORT_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
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

// --- Disaster Response & Relief (Phase 1) ---
// Values mirror the ENUMs in migration_029_disaster_relief_foundation.sql.
const RELIEF = {
  DISASTER_TYPES: ['flood', 'flash_flood', 'fire', 'building_collapse', 'earthquake', 'cyclone', 'storm', 'other'],
  SEVERITIES: ['low', 'moderate', 'high', 'critical'],
  PRIORITIES: ['low', 'normal', 'high', 'urgent'],
  INCIDENT_SOURCE_TYPES: ['user_report', 'admin_entry', 'official_source', 'media', 'other'],
  INCIDENT_STATUS: {
    REPORTED: 'reported',
    UNDER_REVIEW: 'under_review',
    VERIFIED: 'verified',
    ACTIVE: 'active',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
    MERGED: 'merged', // Phase 5: duplicate folded into another incident (terminal; record kept)
  },
  // Incident states visible to the public. Everything else is moderation-only.
  PUBLIC_INCIDENT_STATUSES: ['verified', 'active', 'resolved'],
  // Incident states in which new relief requests / pledges are allowed.
  OPEN_INCIDENT_STATUSES: ['verified', 'active'],
  REQUEST_STATUS: {
    PENDING_REVIEW: 'pending_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
  },
  PUBLIC_REQUEST_STATUSES: ['approved', 'completed'],
  ITEM_CATEGORIES: ['drinking_water', 'dry_food', 'ready_to_eat_food', 'clothing', 'blanket', 'hygiene_kit', 'other'],
  ITEM_UNITS: ['piece', 'packet', 'box', 'set', 'kg', 'liter'],
  // Only these units may carry fractional quantities; all others are whole numbers.
  FRACTIONAL_UNITS: ['kg', 'liter'],
  PLEDGE_STATUS: {
    PLEDGED: 'pledged',
    COLLECTED: 'collected',
    DELIVERED: 'delivered',
    PARTIALLY_FULFILLED: 'partially_fulfilled',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
  },
  REPORT_TYPES: ['pickup', 'delivery', 'failed_delivery', 'problem', 'release'],
  QUANTITY_SCALE: 1000, // DECIMAL(12,3) -> integer milli-units for exact arithmetic
  MAX_QUANTITY: 999999999.999,
  // Public coordinates are rounded to this many decimals (~1.1 km) — see disasterRelief serializers.
  PUBLIC_COORD_DECIMALS: 2,
  // Generous bounding box around Bangladesh for API-level sanity validation.
  BD_BOUNDS: { minLat: 20.0, maxLat: 27.0, minLng: 87.5, maxLng: 93.0 },
  // Phase 4 — alerts REUSE the incident severity enum (low < moderate < high < critical);
  // the labels are display wording only, not a second severity model.
  ALERT: {
    SCOPES: ['local', 'regional', 'nationwide'],
    STATUS: { ACTIVE: 'active', RESOLVED: 'resolved', CANCELLED: 'cancelled' },
    EVENT_TYPES: ['issued', 'updated', 'escalated', 'area_expanded', 'relief_update', 'correction', 'resolved', 'cancelled'],
    SEVERITY_ORDER: ['low', 'moderate', 'high', 'critical'],
    SEVERITY_LABELS: { low: 'Information', moderate: 'Warning', high: 'High priority', critical: 'Critical emergency' },
    DEFAULT_RADIUS_KM: 25,
    MAX_RADIUS_KM: 500,
  },
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
  SUPPORT_TICKET_STATUSES,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  RELIEF,
};
