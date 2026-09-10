/**
 * Geocoding Utility for PortionBridge
 * Interfaces with OpenStreetMap Nominatim API for forward search and reverse geocoding,
 * with specialized parsing for Bangladeshi administrative divisions (Area, Thana/Upazila, District, Division).
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function cleanDivision(name = '') {
  return String(name).replace(/\s*division$/i, '').trim();
}

function cleanDistrict(name = '') {
  return String(name).replace(/\s*district$/i, '').trim();
}

/**
 * Reverse geocodes coordinates (lat, lng) to address components.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{
 *   area: string,
 *   thana: string,
 *   district: string,
 *   division: string,
 *   postalCode: string,
 *   road: string,
 *   building: string,
 *   displayName: string
 * } | null>}
 */
export async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const addr = data.address || {};

    const rawArea = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.city_district || addr.road || '';
    const rawThana = addr.subdistrict || addr.city_district || addr.county || addr.suburb || '';
    const district = cleanDistrict(addr.state_district || addr.district || addr.city || '');
    const division = cleanDivision(addr.state || '');
    const postalCode = addr.postcode || '';
    const road = addr.road || '';
    const building = addr.building || addr.house_number || '';

    // Area can combine sub-locality if helpful
    const area = rawArea || rawThana || district;
    const thana = rawThana || rawArea;

    return {
      area,
      thana,
      district: district || division,
      division: division || district,
      postalCode,
      road,
      building,
      displayName: data.display_name || '',
    };
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return null;
  }
}

/**
 * Forward geocodes a query string to candidate location suggestions in Bangladesh.
 * @param {string} query
 * @returns {Promise<Array<{
 *   lat: number,
 *   lng: number,
 *   displayName: string,
 *   area: string,
 *   thana: string,
 *   district: string,
 *   division: string,
 *   postalCode: string
 * }>>}
 */
export async function searchAddressNominatim(query) {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&countrycodes=bd&limit=5&accept-language=en&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const addr = item.address || {};
      const rawArea = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.city_district || addr.road || '';
      const rawThana = addr.subdistrict || addr.city_district || addr.county || '';
      const district = cleanDistrict(addr.state_district || addr.district || addr.city || '');
      const division = cleanDivision(addr.state || '');

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        area: rawArea || rawThana || district,
        thana: rawThana || rawArea,
        district: district || division,
        division: division || district,
        postalCode: addr.postcode || '',
        road: addr.road || '',
      };
    });
  } catch (err) {
    console.warn('Address search failed:', err);
    return [];
  }
}
