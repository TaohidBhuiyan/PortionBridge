require('dotenv').config();

const { pool } = require('../config/db');
const { DONATION_CATEGORY, DONATION_STATUS } = require('../constants');

// donation_requests.pickup_time is a legacy NOT NULL DATETIME column (the app receives it from the client).
// These seed rows only carry pickup_date + pickup_time_slot, so derive the same clock times the older
// importDummyDonations.js script used for each slot.
const SLOT_CLOCK = { morning: '10:00:00', afternoon: '15:00:00', evening: '19:00:00' };
function withPickupTime(columns, placeholders, values) {
  if (!columns.includes('pickup_time') && values.pickup_date && SLOT_CLOCK[values.pickup_time_slot]) {
    columns.push('pickup_time');
    placeholders.push(':pickup_time');
    values.pickup_time = `${values.pickup_date} ${SLOT_CLOCK[values.pickup_time_slot]}`;
  }
}

/**
 * The sample rows name their donor (previously a hard-coded numeric id that only matched the author's database and
 * could attach a donation to the wrong person elsewhere). The donor is looked up by name; the accounts come from
 * seedDemoUsers.js / seedRandomUsers.js.
 */
async function findDonorIdByName(name) {
  const [rows] = await pool.query("SELECT id FROM users WHERE name = ? AND role = 'donor' AND is_deleted = 0 ORDER BY id LIMIT 1", [name]);
  if (!rows.length) throw new Error(`donor account "${name}" not found (run seedDemoUsers.js / seedRandomUsers.js first)`);
  return rows[0].id;
}

/**
 * Seed script to create nearby opportunities for volunteer discovery
 * These donations have proper pickup_address_details with coordinates for distance calculation
 */

const NEARBY_DONATIONS = [
  {
    donor_name: 'Rahim Ahmed',
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Bakery Items',
    food_type: 'packaged',
    food_name: 'Bread and Buns',
    quantity: 40,
    quantity_unit: 'piece',
    number_of_servings: 80,
    pickup_location: 'Dhanmondi, Dhaka - Road 27, House 15',
    pickup_address_details: {
      address: 'Dhanmondi, Dhaka - Road 27, House 15',
      latitude: 23.7465,
      longitude: 90.3775,
    },
    pickup_date: '2026-09-29',
    pickup_time_slot: 'morning',
    expiry_date: '2026-09-30',
    contact_phone: '01812345678',
    description: 'Fresh bakery items from local shop. Good for distribution.',
    ingredients: 'Flour, yeast, sugar, eggs',
    allergens: 'eggs',
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Fatima Begum',
    category: DONATION_CATEGORY.FOOD,
    title: 'Cooked Vegetables',
    food_type: 'cooked',
    food_name: 'Mixed Vegetable Curry',
    quantity: 15,
    quantity_unit: 'kg',
    number_of_servings: 45,
    pickup_location: 'Gulshan, Dhaka - Avenue 5, House 10',
    pickup_address_details: {
      address: 'Gulshan, Dhaka - Avenue 5, House 10',
      latitude: 23.7925,
      longitude: 90.4035,
    },
    pickup_date: '2026-09-29',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-09-29',
    contact_phone: '01687654321',
    description: 'Freshly cooked mixed vegetable curry. Ready to serve.',
    ingredients: 'Carrots, beans, potatoes, spices',
    allergens: null,
    storage_requirement: 'refrigerated',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: true,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Karim Uddin',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Summer T-Shirts',
    clothing_category: 't_shirt',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'like_new',
    quantity: 25,
    quantity_unit: 'piece',
    pickup_location: 'Mirpur, Dhaka - Section 10, Road 5',
    pickup_address_details: {
      address: 'Mirpur, Dhaka - Section 10, Road 5',
      latitude: 23.8225,
      longitude: 90.3655,
    },
    pickup_date: '2026-09-30',
    pickup_time_slot: 'evening',
    expiry_date: '2026-11-30',
    contact_phone: '01523456789',
    description: 'Collection of summer t-shirts in various colors and sizes.',
    size: 'M',
    season: 'summer',
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Ayesha Khan',
    category: DONATION_CATEGORY.FOOD,
    title: 'Rice and Dal',
    food_type: 'cooked',
    food_name: 'Traditional Rice and Lentils',
    quantity: 20,
    quantity_unit: 'kg',
    number_of_servings: 60,
    pickup_location: 'Uttara, Dhaka - Sector 7, House 20',
    pickup_address_details: {
      address: 'Uttara, Dhaka - Sector 7, House 20',
      latitude: 23.8735,
      longitude: 90.3925,
    },
    pickup_date: '2026-09-30',
    pickup_time_slot: 'morning',
    expiry_date: '2026-09-30',
    contact_phone: '01734567890',
    description: 'Traditional Bengali rice and lentils. Nutritious and filling.',
    ingredients: 'Rice, lentils, onions, garlic, spices',
    allergens: null,
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Jamal Hossain',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Kids Winter Wear',
    clothing_category: 'jacket',
    gender: 'unisex',
    age_group: 'child',
    item_condition: 'good',
    quantity: 18,
    quantity_unit: 'piece',
    pickup_location: 'Mohammadpur, Dhaka - Geneva Camp, Block A',
    pickup_address_details: {
      address: 'Mohammadpur, Dhaka - Geneva Camp, Block A',
      latitude: 23.7525,
      longitude: 90.3625,
    },
    pickup_date: '2026-10-01',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-12-31',
    contact_phone: '01945678901',
    description: 'Warm winter jackets for children. Various sizes available.',
    size: 'S',
    season: 'winter',
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Taohid Donor',
    category: DONATION_CATEGORY.FOOD,
    title: 'Beverage Packets',
    food_type: 'packaged',
    food_name: 'Juice Boxes',
    quantity: 100,
    quantity_unit: 'piece',
    number_of_servings: 100,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_address_details: {
      address: 'Kurmitola, Dhaka - House 12, Road 5',
      latitude: 23.8103,
      longitude: 90.4125,
    },
    pickup_date: '2026-10-02',
    pickup_time_slot: 'morning',
    expiry_date: '2026-10-15',
    contact_phone: '01939954398',
    description: 'Packaged juice boxes with good shelf life. Perfect for distribution.',
    ingredients: 'Fruit juice concentrate, water, sugar',
    allergens: null,
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Rahim Ahmed',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Adult Jeans Collection',
    clothing_category: 'jeans',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'good',
    quantity: 12,
    quantity_unit: 'piece',
    pickup_location: 'Dhanmondi, Dhaka - Road 27, Market Area',
    pickup_address_details: {
      address: 'Dhanmondi, Dhaka - Road 27, Market Area',
      latitude: 23.7485,
      longitude: 90.3795,
    },
    pickup_date: '2026-10-03',
    pickup_time_slot: 'evening',
    expiry_date: '2026-12-31',
    contact_phone: '01812345678',
    description: 'Gently used jeans in various sizes. Good condition.',
    size: 'L',
    season: 'all_season',
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Fatima Begum',
    category: DONATION_CATEGORY.FOOD,
    title: 'Packaged Snacks',
    food_type: 'packaged',
    food_name: 'Biscuits and Cookies',
    quantity: 50,
    quantity_unit: 'packet',
    number_of_servings: 200,
    pickup_location: 'Gulshan, Dhaka - Avenue 5, Shopping Complex',
    pickup_address_details: {
      address: 'Gulshan, Dhaka - Avenue 5, Shopping Complex',
      latitude: 23.7945,
      longitude: 90.4055,
    },
    pickup_date: '2026-10-04',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-11-30',
    contact_phone: '01687654321',
    description: 'Assorted biscuits and cookies. Good for community distribution.',
    ingredients: 'Wheat flour, sugar, butter, chocolate chips',
    allergens: 'wheat',
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Karim Uddin',
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Fish Curry',
    food_type: 'cooked',
    food_name: 'Traditional Fish Curry',
    quantity: 12,
    quantity_unit: 'kg',
    number_of_servings: 36,
    pickup_location: 'Mirpur, Dhaka - Section 10, Local Market',
    pickup_address_details: {
      address: 'Mirpur, Dhaka - Section 10, Local Market',
      latitude: 23.8245,
      longitude: 90.3675,
    },
    pickup_date: '2026-10-05',
    pickup_time_slot: 'evening',
    expiry_date: '2026-10-05',
    contact_phone: '01523456789',
    description: 'Freshly prepared traditional fish curry.',
    ingredients: 'Fish, onions, garlic, ginger, spices, oil',
    allergens: 'fish',
    storage_requirement: 'refrigerated',
    is_vegetarian: false,
    is_halal: true,
    refrigeration_required: true,
    status: DONATION_STATUS.PENDING,
  },
  {
    donor_name: 'Ayesha Khan',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Babies Clothing Set',
    clothing_category: 'others',
    gender: 'unisex',
    age_group: 'baby',
    item_condition: 'like_new',
    quantity: 30,
    quantity_unit: 'piece',
    pickup_location: 'Uttara, Dhaka - Sector 7, Residential Area',
    pickup_address_details: {
      address: 'Uttara, Dhaka - Sector 7, Residential Area',
      latitude: 23.8755,
      longitude: 90.3945,
    },
    pickup_date: '2026-10-06',
    pickup_time_slot: 'morning',
    expiry_date: '2026-12-31',
    contact_phone: '01734567890',
    description: 'Gentle used baby clothes including onesies, bibs, and small outfits.',
    size: 'free_size',
    season: 'all_season',
    status: DONATION_STATUS.PENDING,
  },
];

async function seedNearbyOpportunities() {
  console.log('[SeedNearbyOpportunities] Creating nearby opportunities with coordinates...');
  
  for (const donation of NEARBY_DONATIONS) {
    try {
      const columns = [];
      const values = {};
      const placeholders = [];
      const donorId = await findDonorIdByName(donation.donor_name);
      
      if (donation.category === DONATION_CATEGORY.FOOD) {
        columns.push('donor_id', 'category', 'title', 'food_type', 'food_name', 'quantity', 
                     'quantity_unit', 'number_of_servings', 'pickup_location', 'pickup_address_details',
                     'pickup_date', 'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 
                     'ingredients', 'allergens', 'storage_requirement', 'is_vegetarian', 
                     'is_halal', 'refrigeration_required', 'status');
        
        Object.keys(donation).forEach(key => {
          if (key !== 'category' && key !== 'food_type' && key !== 'food_name' && key !== 'clothing_category' &&
              key !== 'gender' && key !== 'age_group' && key !== 'item_condition' && key !== 'size' && key !== 'season') {
            values[key] = donation[key];
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
          }
        });
        
        values.donor_id = donorId;
        values.category = donation.category;
        values.food_type = donation.food_type;
        values.food_name = donation.food_name;
        values.allergens = donation.allergens ? JSON.stringify([donation.allergens]) : null;
        values.storage_requirement = donation.storage_requirement;
        values.is_vegetarian = donation.is_vegetarian ? 'vegetarian' : 'non_vegetarian';
        values.is_halal = donation.is_halal ? 'yes' : 'no';
        values.refrigeration_required = donation.refrigeration_required ? 'yes' : 'no';
        
        placeholders.push(':donor_id', ':category', ':title', ':food_type', ':food_name', ':quantity',
                        ':quantity_unit', ':number_of_servings', ':pickup_location', ':pickup_address_details',
                        ':pickup_date', ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description',
                        ':ingredients', ':allergens', ':storage_requirement', ':is_vegetarian',
                        ':is_halal', ':refrigeration_required', ':status');
      } else if (donation.category === DONATION_CATEGORY.CLOTHES) {
        columns.push('donor_id', 'category', 'title', 'clothing_category', 'gender', 'age_group',
                     'item_condition', 'quantity', 'quantity_unit', 'pickup_location', 'pickup_address_details',
                     'pickup_date', 'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 'size', 'season', 
                     'status');
        
        Object.keys(donation).forEach(key => {
          if (key !== 'category' && key !== 'food_type' && key !== 'food_name' && key !== 'clothing_category' &&
              key !== 'gender' && key !== 'age_group' && key !== 'item_condition' && key !== 'size' && key !== 'season') {
            values[key] = donation[key];
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
          }
        });
        
        values.donor_id = donorId;
        values.category = donation.category;
        values.clothing_category = donation.clothing_category;
        values.gender = donation.gender;
        values.age_group = donation.age_group;
        values.item_condition = donation.item_condition;
        values.size = donation.size;
        values.season = donation.season;
        
        placeholders.push(':donor_id', ':category', ':title', ':clothing_category', ':gender', ':age_group',
                        ':item_condition', ':quantity', ':quantity_unit', ':pickup_location', ':pickup_address_details',
                        ':pickup_date', ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description', ':size', ':season',
                        ':status');
      }
      
      withPickupTime(columns, placeholders, values);
      const sql = `INSERT INTO donation_requests (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result] = await pool.query(sql, values);
      
      console.log(`[SeedNearbyOpportunities] Created nearby opportunity: ${donation.title} (ID: ${result.insertId})`);
      
    } catch (error) {
      console.error(`[SeedNearbyOpportunities] Failed to create donation "${donation.title}":`, error.message);
    }
  }
}

async function seedNearbyData() {
  try {
    console.log('[SeedNearbyOpportunities] Starting nearby opportunities seeding...');
    
    await seedNearbyOpportunities();
    
    console.log('[SeedNearbyOpportunities] Nearby opportunities seeding completed successfully!');
  } catch (error) {
    console.error('[SeedNearbyOpportunities] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedNearbyData();
