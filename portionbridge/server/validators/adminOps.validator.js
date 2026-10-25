const { body, param, query } = require('express-validator');
const { RELIEF } = require('../constants');
const { DIVISIONS } = require('../config/bdDivisions');
const { canonicalDistrict } = require('../config/bdDistricts');
const { DATASETS } = require('../services/adminOpsReports.service');

const idParam = (name) => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();
const isoDate = (name) => query(name).optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(`${name} must be YYYY-MM-DD`)
  .custom((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`))).withMessage(`${name} is not a valid date`);

const INCIDENT_STATUSES = Object.values(RELIEF.INCIDENT_STATUS);
const REQUEST_STATUSES = Object.values(RELIEF.REQUEST_STATUS);

const filterRules = [
  query('disasterType').optional().isIn(RELIEF.DISASTER_TYPES).withMessage('invalid disasterType'),
  query('status').optional().isIn(INCIDENT_STATUSES).withMessage('invalid status'),
  query('severity').optional().isIn(RELIEF.SEVERITIES).withMessage('invalid severity'),
  query('verificationStatus').optional().isIn(['unverified', 'verified', 'rejected']).withMessage('invalid verificationStatus'),
  query('division').optional().isIn(Object.keys(DIVISIONS)).withMessage('invalid division'),
  query('district').optional().custom((v) => Boolean(canonicalDistrict(v))).withMessage('unknown district'),
  query('requestStatus').optional().isIn(REQUEST_STATUSES).withMessage('invalid requestStatus'),
  query('incidentId').optional().isInt({ min: 1 }).withMessage('incidentId must be a positive integer'),
  isoDate('from'), isoDate('to'),
  query('to').optional().custom((to, { req }) => !req.query.from || to >= req.query.from).withMessage('to must not be before from'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
];

const listRules = [
  ...filterRules,
  query('view').optional().isIn(['all', 'active', 'unassigned', 'delayed', 'failed', 'attention']).withMessage('invalid view'),
  query('type').optional().isIn(['open_issue', 'pending_verification', 'discrepancy']).withMessage('invalid type'),
  query('queue').optional().isIn(['awaiting', 'open', 'critical']).withMessage('invalid queue'),
  query('unfulfilled').optional().isIn(['true', 'false']).withMessage('unfulfilled must be true or false'),
  query('needsReassessment').optional().isIn(['true', 'false']).withMessage('needsReassessment must be true or false'),
  query('fulfillment').optional().isIn(['open', 'partial', 'fulfilled']).withMessage('invalid fulfillment'),
  query('search').optional().isString().isLength({ max: 60 }).withMessage('search is too long'),
  query('pledgeId').optional().isInt({ min: 1 }).withMessage('pledgeId must be a positive integer'),
];
const reportRules = [...filterRules, query('granularity').optional().isIn(['day', 'week', 'month']).withMessage('invalid granularity')];
const exportRules = [...filterRules, query('dataset').isIn(DATASETS).withMessage(`dataset must be one of: ${DATASETS.join(', ')}`)];

const text = (field, { min = 5, max = 500, required = true } = {}) => {
  const c = body(field);
  return (required ? c.exists({ checkNull: true }).withMessage(`${field} is required`) : c.optional({ nullable: true }))
    .isString().withMessage(`${field} must be text`).trim().isLength({ min: required ? min : 0, max }).withMessage(`${field} must be ${required ? `${min}-` : 'at most '}${max} characters`);
};

const idRules = [idParam('id')];
const infoRules = [idParam('id'), text('note')];
const mergeRules = [idParam('id'), body('targetIncidentId').isInt({ min: 1 }).withMessage('targetIncidentId is required').toInt(), text('reason')];
const reasonRules = [idParam('id'), text('reason')];
const noteRules = [idParam('id'), text('note')];
const optionalNoteRules = [idParam('id'), text('note', { required: false, max: 300 })];
const pledgeRules = [idParam('pledgeId')];
const assignRules = [idParam('pledgeId'), body('volunteerId').isInt({ min: 1 }).withMessage('volunteerId is required').toInt(), text('reason')];
const pledgeReasonRules = [idParam('pledgeId'), text('reason')];
const correctRules = [
  idParam('reportId'),
  body('verifiedQuantity').exists({ checkNull: true }).withMessage('verifiedQuantity is required'),
  text('reason'),
];

module.exports = {
  filterRules, listRules, reportRules, exportRules, idRules, infoRules, mergeRules, reasonRules, noteRules, optionalNoteRules,
  pledgeRules, assignRules, pledgeReasonRules, correctRules,
};
