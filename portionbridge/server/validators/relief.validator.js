const { body, param, query, header } = require('express-validator');
const { RELIEF } = require('../constants');
const { parseQuantity } = require('../utils/reliefQuantity');

/**
 * Validation rules for the Disaster Relief module. Only whitelisted fields are
 * ever read by the services, so unexpected fields (status, verified, approvedBy…)
 * in a payload are ignored rather than trusted.
 */

const id = (name) => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();
const text = (field, { min = 1, max, required = true } = {}) => {
  let chain = body(field);
  chain = required ? chain.exists({ checkNull: true }).withMessage(`${field} is required`) : chain.optional({ nullable: true });
  return chain.isString().withMessage(`${field} must be text`).trim()
    .isLength({ min: required ? min : 0, max }).withMessage(`${field} must be ${required ? `${min}-` : 'at most '}${max} characters`);
};
const oneOf = (field, values, required = false) => {
  let chain = body(field);
  chain = required ? chain.exists({ checkNull: true }).withMessage(`${field} is required`) : chain.optional();
  return chain.isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`);
};
const quantity = (field, required = true) => {
  let chain = body(field);
  chain = required ? chain.exists({ checkNull: true }).withMessage(`${field} is required`) : chain.optional();
  return chain.custom((v) => parseQuantity(v) !== null)
    .withMessage(`${field} must be a positive number with at most 3 decimals`);
};

const B = RELIEF.BD_BOUNDS;
const coordinateRules = [
  body('latitude').optional({ nullable: true }).isFloat({ min: B.minLat, max: B.maxLat })
    .withMessage('latitude must be within Bangladesh').toFloat(),
  body('longitude').optional({ nullable: true }).isFloat({ min: B.minLng, max: B.maxLng })
    .withMessage('longitude must be within Bangladesh').toFloat(),
];
const requirePairOnCreate = body('latitude').custom((_, { req }) => {
  const hasLat = req.body.latitude !== undefined && req.body.latitude !== null;
  const hasLng = req.body.longitude !== undefined && req.body.longitude !== null;
  return hasLat === hasLng;
}).withMessage('latitude and longitude must be provided together');

const pagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200'),
];

const expiresAtRule = body('expiresAt').optional({ nullable: true })
  .isISO8601().withMessage('expiresAt must be an ISO 8601 date')
  .custom((v) => v === null || new Date(v).getTime() > Date.now()).withMessage('expiresAt must be in the future');

const itemFields = (required) => [
  text('name', { max: 100, required }),
  oneOf('category', RELIEF.ITEM_CATEGORIES, required),
  oneOf('unit', RELIEF.ITEM_UNITS, required),
  quantity('quantity', required),
  oneOf('priority', RELIEF.PRIORITIES),
  text('notes', { max: 500, required: false }),
];

const createIncidentRules = [
  text('title', { min: 5, max: 200 }),
  text('description', { max: 5000, required: false }),
  oneOf('disasterType', RELIEF.DISASTER_TYPES, true),
  oneOf('severity', RELIEF.SEVERITIES),
  oneOf('priority', RELIEF.PRIORITIES),
  oneOf('sourceType', RELIEF.INCIDENT_SOURCE_TYPES),
  text('sourceReference', { max: 500, required: false }),
  text('address', { max: 255, required: false }),
  text('district', { max: 100 }),
  text('affectedArea', { max: 255, required: false }),
  ...coordinateRules,
  requirePairOnCreate,
];

const updateIncidentRules = [
  id('id'),
  text('reason', { max: 500, required: false }),
  text('title', { min: 5, max: 200, required: false }),
  text('description', { max: 5000, required: false }),
  oneOf('disasterType', RELIEF.DISASTER_TYPES),
  oneOf('severity', RELIEF.SEVERITIES),
  oneOf('priority', RELIEF.PRIORITIES),
  oneOf('sourceType', RELIEF.INCIDENT_SOURCE_TYPES),
  text('sourceReference', { max: 500, required: false }),
  text('address', { max: 255, required: false }),
  text('district', { max: 100, required: false }),
  text('affectedArea', { max: 255, required: false }),
  ...coordinateRules,
];

const incidentStatusRules = [
  id('id'),
  oneOf('status', Object.values(RELIEF.INCIDENT_STATUS), true),
  text('notes', { max: 1000, required: false }),
];

const listIncidentRules = [
  ...pagination,
  // one status, or a comma-separated list (e.g. "verified,active") — each entry must be a valid status
  query('status').optional().custom((v) => {
    if (typeof v !== 'string') return false;
    const parts = v.split(',').map((x) => x.trim());
    return parts.length <= 6 && parts.every((x) => Object.values(RELIEF.INCIDENT_STATUS).includes(x));
  }).withMessage('invalid status'),
  query('disasterType').optional().isIn(RELIEF.DISASTER_TYPES).withMessage('invalid disasterType'),
  query('severity').optional().isIn(RELIEF.SEVERITIES).withMessage('invalid severity'),
  query('priority').optional().isIn(RELIEF.PRIORITIES).withMessage('invalid priority'),
  query('district').optional().isString().isLength({ max: 100 }).withMessage('district too long'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search too long'),
  query('sort').optional().isIn(['newest', 'oldest', 'priority', 'severity']).withMessage('invalid sort'),
  query('mine').optional().isIn(['true', 'false']).withMessage('mine must be true or false'),
];

const createRequestRules = [
  id('incidentId'),
  text('title', { min: 5, max: 200 }),
  text('description', { max: 5000, required: false }),
  text('locationName', { max: 200 }),
  text('address', { max: 255, required: false }),
  text('deliveryInstructions', { max: 500, required: false }),
  oneOf('priority', RELIEF.PRIORITIES),
  text('requestingOrganization', { max: 200, required: false }),
  expiresAtRule,
  ...coordinateRules,
  requirePairOnCreate,
  body('items').optional().isArray({ max: 25 }).withMessage('items must be an array of at most 25 entries'),
  // each entry of items[] follows the same rules as a single item
  body('items.*.name').exists().isString().trim().isLength({ min: 1, max: 100 }).withMessage('items[].name must be 1-100 characters'),
  body('items.*.category').isIn(RELIEF.ITEM_CATEGORIES).withMessage('items[].category invalid'),
  body('items.*.unit').isIn(RELIEF.ITEM_UNITS).withMessage('items[].unit invalid'),
  body('items.*.quantity').custom((v) => parseQuantity(v) !== null).withMessage('items[].quantity must be a positive number with at most 3 decimals'),
  body('items.*.priority').optional().isIn(RELIEF.PRIORITIES).withMessage('items[].priority invalid'),
  body('items.*.notes').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('items[].notes too long'),
];

const updateRequestRules = [
  id('id'),
  text('title', { min: 5, max: 200, required: false }),
  text('description', { max: 5000, required: false }),
  text('locationName', { max: 200, required: false }),
  text('address', { max: 255, required: false }),
  text('deliveryInstructions', { max: 500, required: false }),
  oneOf('priority', RELIEF.PRIORITIES),
  text('requestingOrganization', { max: 200, required: false }),
  expiresAtRule,
  ...coordinateRules,
];

const requestStatusRules = [
  id('id'),
  oneOf('status', [RELIEF.REQUEST_STATUS.APPROVED, RELIEF.REQUEST_STATUS.REJECTED, RELIEF.REQUEST_STATUS.CANCELLED, RELIEF.REQUEST_STATUS.EXPIRED], true),
  text('notes', { max: 1000, required: false }),
];

const listRequestRules = [
  ...pagination,
  query('status').optional().isIn(Object.values(RELIEF.REQUEST_STATUS)).withMessage('invalid status'),
  query('priority').optional().isIn(RELIEF.PRIORITIES).withMessage('invalid priority'),
  query('mine').optional().isIn(['true', 'false']).withMessage('mine must be true or false'),
];

const reasonRule = text('reason', { max: 500, required: false });
const addItemRules = [id('id'), ...itemFields(true), reasonRule];
const updateItemRules = [id('id'), id('itemId'), ...itemFields(false), reasonRule];
const removeItemRules = [id('id'), id('itemId'), reasonRule];

const idempotencyHeader = header('idempotency-key').optional()
  .matches(/^[A-Za-z0-9_-]{8,64}$/).withMessage('Idempotency-Key must be 8-64 characters: letters, digits, _ or -');

const PHONE = /^[+]?[\d\s-()]+$/;
const noSavedAddress = (_, { req }) => !(req.body.pickup && req.body.pickup.savedAddressId);
const pickupRules = [
  body('pickup').optional({ nullable: true }).isObject().withMessage('pickup must be an object'),
  body('pickup.savedAddressId').optional().isInt({ min: 1 }).withMessage('savedAddressId must be a positive integer').toInt(),
  body('pickup.pickupDate').if(body('pickup').exists({ checkNull: true }))
    .exists({ checkNull: true }).withMessage('pickup.pickupDate is required').bail()
    .isISO8601({ strict: true }).withMessage('pickup.pickupDate must be a date (YYYY-MM-DD)').bail()
    .custom((v) => { const t = new Date(); t.setHours(0, 0, 0, 0); return new Date(v) >= t; }).withMessage('pickup.pickupDate must be today or later'),
  body('pickup.pickupTimeSlot').if(body('pickup').exists({ checkNull: true }))
    .isIn(['morning', 'afternoon', 'evening']).withMessage('pickup.pickupTimeSlot must be morning, afternoon or evening'),
  body('pickup.contactPhone').optional().isString().trim().isLength({ max: 20 }).matches(PHONE)
    .withMessage('pickup.contactPhone must be a valid phone number (max 20 characters)'),
  body('pickup.additionalNotes').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('pickup.additionalNotes too long'),
  body('pickup.pickupAddress').if(body('pickup').exists({ checkNull: true })).if(noSavedAddress)
    .exists({ checkNull: true }).withMessage('Provide pickup.savedAddressId or pickup.pickupAddress').bail()
    .isObject().withMessage('pickup.pickupAddress must be an object'),
  body('pickup.pickupAddress.fullAddress').if(body('pickup').exists({ checkNull: true })).if(noSavedAddress)
    .isString().trim().isLength({ min: 5, max: 255 }).withMessage('pickup.pickupAddress.fullAddress must be 5-255 characters'),
  body('pickup.pickupAddress.latitude').if(body('pickup').exists({ checkNull: true })).if(noSavedAddress)
    .isFloat({ min: B.minLat, max: B.maxLat }).withMessage('pickup.pickupAddress.latitude must be within Bangladesh').toFloat(),
  body('pickup.pickupAddress.longitude').if(body('pickup').exists({ checkNull: true })).if(noSavedAddress)
    .isFloat({ min: B.minLng, max: B.maxLng }).withMessage('pickup.pickupAddress.longitude must be within Bangladesh').toFloat(),
  ...['district', 'area', 'landmark', 'contactPersonName'].map((f) => body(`pickup.pickupAddress.${f}`).optional({ nullable: true }).isString().isLength({ max: 150 }).withMessage(`pickup.pickupAddress.${f} too long`)),
  body('pickup.pickupAddress.deliveryInstructions').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('pickup.pickupAddress.deliveryInstructions too long'),
];

const createPledgeRules = [
  id('itemId'),
  idempotencyHeader,
  quantity('quantity'),
  text('notes', { max: 500, required: false }),
  body('donationRequestId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('donationRequestId must be a positive integer').toInt(),
  ...pickupRules,
];
const updatePledgeRules = [id('id'), quantity('quantity', false), text('notes', { max: 500, required: false })];
const cancelPledgeRules = [id('id'), text('reason', { max: 255, required: false })];
const quantityActionRules = [id('id'), quantity('quantity')];
const pledgeIdRules = [id('id')];
const listPledgeRules = [
  ...pagination,
  query('status').optional().isIn(Object.values(RELIEF.PLEDGE_STATUS)).withMessage('invalid status'),
];
// ---- volunteer tasks ----
const taskNotes = (required) => (required
  ? body('notes').exists({ checkNull: true }).withMessage('notes are required').bail().isString().trim().isLength({ min: 5, max: 1000 }).withMessage('notes must be 5-1000 characters')
  : body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 1000 }).withMessage('notes must be at most 1000 characters'));
const taskIdRules = [id('id')];
const scheduleTaskRules = [id('id'), body('scheduledAt').isISO8601().withMessage('scheduledAt must be an ISO 8601 date-time').bail()
  .custom((v) => new Date(v).getTime() > Date.now()).withMessage('scheduledAt must be in the future')];
const pickupReportRules = [id('id'), quantity('quantity'), taskNotes(false)];
const deliveryReportRules = [id('id'), quantity('quantity'), taskNotes(false), body('final').optional().isBoolean().withMessage('final must be true or false').toBoolean()];
const issueReportRules = [id('id'), taskNotes(true)];
const releaseTaskRules = [id('id'), body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 255 }).withMessage('reason must be at most 255 characters')];
const listTaskRules = [...pagination, query('group').optional().isIn(['active', 'history', 'all']).withMessage('group must be active, history or all')];

// ---- admin review ----
const reportIdRules = [id('reportId')];
const verifyReportRules = [id('reportId'), body('verifiedQuantity').optional({ nullable: true }).custom((v) => parseQuantity(v) !== null).withMessage('verifiedQuantity must be a positive number with at most 3 decimals'), taskNotes(false)];
const rejectReportRules = [id('reportId'), taskNotes(true)];
const resolveReportRules = [id('reportId'), body('action').isIn(['close', 'reopen', 'fail']).withMessage('action must be close, reopen or fail'), taskNotes(false)];
const listReportRules = [...pagination,
  query('type').optional().isIn(RELIEF.REPORT_TYPES).withMessage('invalid type'),
  query('status').optional().isIn(['recorded', 'pending', 'verified', 'rejected', 'open', 'resolved']).withMessage('invalid status')];
const adminTaskListRules = [...pagination,
  query('attention').optional().isIn(['true', 'false']).withMessage('attention must be true or false'),
  query('status').optional().isIn(Object.values(RELIEF.PLEDGE_STATUS)).withMessage('invalid status'),
  query('requestId').optional().isInt({ min: 1 }).withMessage('requestId must be a positive integer')];

const idRules = [id('id')];
const incidentIdRules = [id('incidentId')];

module.exports = {
  createIncidentRules, updateIncidentRules, incidentStatusRules, listIncidentRules,
  createRequestRules, updateRequestRules, requestStatusRules, listRequestRules,
  addItemRules, updateItemRules, removeItemRules,
  createPledgeRules, updatePledgeRules, cancelPledgeRules, quantityActionRules, pledgeIdRules, listPledgeRules,
  idRules, incidentIdRules, pagination,
  taskIdRules, scheduleTaskRules, pickupReportRules, deliveryReportRules, issueReportRules, releaseTaskRules, listTaskRules,
  reportIdRules, verifyReportRules, rejectReportRules, resolveReportRules, listReportRules, adminTaskListRules,
};
