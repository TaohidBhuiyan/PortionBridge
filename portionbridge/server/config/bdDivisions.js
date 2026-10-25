/**
 * Static reference data: the 8 administrative divisions of Bangladesh and the districts
 * each contains. Incidents and users store only a DISTRICT; the division is derived here
 * so the admin dashboard can filter/group by division. There is no upazila column anywhere
 * in the data model, so upazila filtering is not available (the API says so).
 */
const DIVISIONS = {
  Barishal: ['Barguna', 'Barishal', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'],
  Chattogram: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  Dhaka: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  Khulna: ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  Rajshahi: ['Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  Rangpur: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

const DISTRICT_TO_DIVISION = new Map();
Object.entries(DIVISIONS).forEach(([division, districts]) => districts.forEach((d) => DISTRICT_TO_DIVISION.set(d.toLowerCase(), division)));

const divisionOf = (district) => (typeof district === 'string' ? DISTRICT_TO_DIVISION.get(district.trim().toLowerCase()) || null : null);
const districtsOfDivision = (division) => {
  const key = Object.keys(DIVISIONS).find((d) => d.toLowerCase() === String(division).trim().toLowerCase());
  return key ? DIVISIONS[key] : null;
};

module.exports = { DIVISIONS, divisionOf, districtsOfDivision };
