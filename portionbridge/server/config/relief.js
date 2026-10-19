/**
 * Disaster-relief runtime policy.
 *
 * RELIEF_REQUIRE_DELIVERY_VERIFICATION (default: true)
 *   true  -> a volunteer's delivery report is stored as PENDING and only an
 *            administrator's verification moves it into the verified delivered
 *            totals (and completes the linked donation).
 *   false -> volunteer delivery reports are applied immediately (recorded as
 *            verified by the system). Use only when admins cannot review reports.
 * Read on every call so tests and operators can change it without a rebuild.
 */
function requireDeliveryVerification() {
  const raw = String(process.env.RELIEF_REQUIRE_DELIVERY_VERIFICATION ?? 'true').trim().toLowerCase();
  return !['false', '0', 'no', 'off'].includes(raw);
}

module.exports = { requireDeliveryVerification };
