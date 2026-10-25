const { body, param, query } = require('express-validator');
const { RELIEF } = require('../constants');

const A = RELIEF.ALERT;
const idParam = (name) => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();

const districtsRule = body('districts').optional()
  .isArray({ max: 64 }).withMessage('districts must be a list of at most 64 districts');
const districtItemRule = body('districts.*').isString().isLength({ min: 1, max: 100 }).withMessage('each district must be text');

const severityRule = (required = false) => {
  const c = body('severity');
  return (required ? c.exists({ checkNull: true }).withMessage('severity is required') : c.optional())
    .isIn(A.SEVERITY_ORDER).withMessage(`severity must be one of: ${A.SEVERITY_ORDER.join(', ')}`);
};
const scopeRule = (required = false) => {
  const c = body('scope');
  return (required ? c.exists({ checkNull: true }).withMessage('scope is required') : c.optional())
    .isIn(A.SCOPES).withMessage(`scope must be one of: ${A.SCOPES.join(', ')}`);
};
const radiusRule = body('radiusKm').optional({ nullable: true })
  .isInt({ min: 1, max: A.MAX_RADIUS_KM }).withMessage(`radiusKm must be 1-${A.MAX_RADIUS_KM}`).toInt();
const noteRule = (field, { required = false, min = 1, max = 300 } = {}) => {
  const c = body(field);
  return (required ? c.exists({ checkNull: true }).withMessage(`${field} is required`) : c.optional({ nullable: true }))
    .isString().withMessage(`${field} must be text`).trim()
    .isLength({ min: required ? min : 0, max }).withMessage(`${field} must be ${required ? `${min}-` : 'at most '}${max} characters`);
};

const previewRules = [
  body('incidentId').isInt({ min: 1 }).withMessage('incidentId is required').toInt(),
  scopeRule(), severityRule(), districtsRule, districtItemRule, radiusRule,
];
const issueRules = [
  body('incidentId').isInt({ min: 1 }).withMessage('incidentId is required').toInt(),
  scopeRule(true), severityRule(), districtsRule, districtItemRule, radiusRule, noteRule('note'),
];
const updateRules = [
  idParam('id'), scopeRule(), severityRule(), districtsRule, districtItemRule, radiusRule, noteRule('note'),
  body('requestKey').optional().isString().matches(/^[A-Za-z0-9_-]{1,60}$/).withMessage('requestKey must be 1-60 letters, digits, - or _'),
];
const correctionRules = [idParam('id'), noteRule('note', { required: true, min: 5, max: 300 })];
const resolveRules = [idParam('id'), noteRule('note')];
const cancelRules = [idParam('id'), noteRule('reason', { required: true, min: 5, max: 500 })];
const idRules = [idParam('id')];
const retryRules = [idParam('id'), idParam('eventId')];

const listRules = [
  query('status').optional().isIn(Object.values(A.STATUS)).withMessage('invalid status'),
  query('scope').optional().isIn(A.SCOPES).withMessage('invalid scope'),
  query('severity').optional().isIn(A.SEVERITY_ORDER).withMessage('invalid severity'),
  query('incidentId').optional().isInt({ min: 1 }).withMessage('incidentId must be a positive integer'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
];
const activeRules = [query('incidentId').optional().isInt({ min: 1 }).withMessage('incidentId must be a positive integer')];

const B = RELIEF.BD_BOUNDS;
const preferenceRules = [
  body('nearbyEnabled').optional().isBoolean({ strict: true }).withMessage('nearbyEnabled must be true or false'),
  body('nationwideEnabled').optional().isBoolean({ strict: true }).withMessage('nationwideEnabled must be true or false'),
  body('inAppEnabled').optional().isBoolean({ strict: true }).withMessage('inAppEnabled must be true or false'),
  body('minSeverity').optional().isIn(A.SEVERITY_ORDER).withMessage(`minSeverity must be one of: ${A.SEVERITY_ORDER.join(', ')}`),
  body('radiusKm').optional({ nullable: true }).isInt({ min: 1, max: A.MAX_RADIUS_KM }).withMessage(`radiusKm must be 1-${A.MAX_RADIUS_KM}`).toInt(),
  body('centerLatitude').optional({ nullable: true }).isFloat({ min: B.minLat, max: B.maxLat }).withMessage('centerLatitude must be within Bangladesh').toFloat(),
  body('centerLongitude').optional({ nullable: true }).isFloat({ min: B.minLng, max: B.maxLng }).withMessage('centerLongitude must be within Bangladesh').toFloat(),
  body('districts').optional().isArray({ max: 64 }).withMessage('districts must be a list of at most 64 districts'),
  body('districts.*').isString().isLength({ min: 1, max: 100 }).withMessage('each district must be text'),
  body('categories').optional().isArray({ max: 8 }).withMessage('categories must be a list'),
  body('categories.*').isIn(RELIEF.DISASTER_TYPES).withMessage('unknown category'),
];

module.exports = {
  previewRules, issueRules, updateRules, correctionRules, resolveRules, cancelRules, idRules, retryRules,
  listRules, activeRules, preferenceRules,
};
