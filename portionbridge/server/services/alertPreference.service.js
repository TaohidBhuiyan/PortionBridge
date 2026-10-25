const preferenceModel = require('../models/alertPreference.model');
const auditService = require('./audit.service');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { canonicalDistrict } = require('../config/bdDistricts');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF } = require('../constants');

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/**
 * What the user can and cannot switch off — returned with the preferences so the UI never
 * has to hard-code policy. Optional personalisation vs. the mandatory critical-alert rule.
 */
const POLICY = Object.freeze({
  criticalNationwideMandatory: true,
  mandatoryDescription:
    'Critical-emergency alerts that an administrator classifies as nationwide are always delivered to your in-app inbox, whatever the settings below.',
  channels: { inApp: true, email: false, sms: false, push: false },
  channelsNote: 'Only in-app notifications are available. Email, SMS and push alerts are not configured.',
});

async function getPreferences(userId) {
  const stored = await preferenceModel.findByUserId(userId);
  return { preferences: stored || { ...preferenceModel.DEFAULTS, isDefault: true }, policy: POLICY };
}

function sanitize(input, current) {
  const next = { ...current };
  ['nearbyEnabled', 'nationwideEnabled', 'inAppEnabled'].forEach((k) => {
    if (input[k] !== undefined) next[k] = Boolean(input[k]);
  });
  if (input.minSeverity !== undefined) next.minSeverity = input.minSeverity;
  if (input.radiusKm !== undefined) next.radiusKm = input.radiusKm === null ? null : Number(input.radiusKm);

  if (input.centerLatitude !== undefined || input.centerLongitude !== undefined) {
    const lat = input.centerLatitude === undefined ? current.centerLatitude : input.centerLatitude;
    const lng = input.centerLongitude === undefined ? current.centerLongitude : input.centerLongitude;
    if ((lat === null) !== (lng === null)) {
      throw new AppError('centerLatitude and centerLongitude must be provided together.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    // Stored COARSE (2 decimals, ~1.1 km): a neighbourhood, never an exact address.
    next.centerLatitude = lat === null ? null : round2(lat);
    next.centerLongitude = lng === null ? null : round2(lng);
  }

  if (input.districts !== undefined) {
    const out = [];
    input.districts.forEach((d) => {
      const c = canonicalDistrict(d);
      if (!c) throw new AppError(`Unknown district: ${String(d).slice(0, 60)}.`, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'UNKNOWN_DISTRICT');
      if (!out.includes(c)) out.push(c);
    });
    next.districts = out;
  }
  if (input.categories !== undefined) {
    input.categories.forEach((c) => {
      if (!RELIEF.DISASTER_TYPES.includes(c)) throw new AppError(`Unknown category: ${String(c).slice(0, 40)}.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });
    next.categories = [...new Set(input.categories)];
  }
  return next;
}

async function updatePreferences(userId, input, ctx = {}) {
  const current = (await preferenceModel.findByUserId(userId)) || { ...preferenceModel.DEFAULTS };
  const next = sanitize(input, current);
  await runInTransaction((connection) => preferenceModel.saveAll(userId, next, connection));
  await auditService.record({
    userId, action: AUDIT_ACTIONS.DISASTER_ALERT_PREFERENCES_UPDATED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    // never log coordinates
    metadata: { nearbyEnabled: next.nearbyEnabled, nationwideEnabled: next.nationwideEnabled, districts: next.districts.length, categories: next.categories.length, hasCenter: next.centerLatitude !== null },
  });
  return getPreferences(userId);
}

module.exports = { getPreferences, updatePreferences, POLICY };
