/**
 * The 64 administrative districts of Bangladesh — static geographic REFERENCE data
 * used to validate and normalise alert targeting and alert preferences. It is not
 * disaster data. Spellings mirror client/src/utils/bdDistricts.js; matching against
 * stored incident districts is case-insensitive (the columns are *_general_ci), so
 * an incident entered with an alternative spelling (e.g. "Chittagong") will not match
 * a "Chattogram" target — admins should use the canonical spelling.
 */
const BD_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chapainawabganj', 'Chattogram', 'Chuadanga', "Cox's Bazar", 'Cumilla', 'Dhaka', 'Dinajpur', 'Faridpur',
  'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokathi',
  'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur',
  'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh',
  'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali',
  'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon',
];

const BY_LOWER = new Map(BD_DISTRICTS.map((d) => [d.toLowerCase(), d]));

/** Returns the canonical spelling for a district name, or null when it is not a known district. */
function canonicalDistrict(name) {
  if (typeof name !== 'string') return null;
  return BY_LOWER.get(name.trim().toLowerCase().replace(/\s+/g, ' ')) || null;
}

module.exports = { BD_DISTRICTS, canonicalDistrict };
