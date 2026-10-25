require('dotenv').config();

const { pool } = require('../config/db');
const { USER_ROLES, DONATION_CATEGORY, DONATION_STATUS } = require('../constants');
const { hashPassword } = require('../utils/password');
const userModel = require('../models/user.model');
const passwordHistoryModel = require('../models/passwordHistory.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');

// donation_requests.pickup_time is a legacy NOT NULL DATETIME column (the app receives it from the client).
// These seed rows only carry pickup_date + pickup_time_slot, so derive the same clock times the older
// importDummyDonations.js script used for each slot.
const SLOT_CLOCK = { morning: '10:00:00', afternoon: '15:00:00', evening: '19:00:00' };
function withPickupTime(columns, placeholders, values) {
  // is_vegetarian / is_halal / refrigeration_required are ENUM columns ('vegetarian'|'non_vegetarian', 'yes'|'no'),
  // not booleans; rows copied verbatim from the sample data may still carry booleans.
  if (typeof values.is_vegetarian === 'boolean') values.is_vegetarian = values.is_vegetarian ? 'vegetarian' : 'non_vegetarian';
  ['is_halal', 'refrigeration_required'].forEach((k) => {
    if (typeof values[k] === 'boolean') values[k] = values[k] ? 'yes' : 'no';
  });
  if (!columns.includes('pickup_time') && values.pickup_date && SLOT_CLOCK[values.pickup_time_slot]) {
    columns.push('pickup_time');
    placeholders.push(':pickup_time');
    values.pickup_time = `${values.pickup_date} ${SLOT_CLOCK[values.pickup_time_slot]}`;
  }
}

/**
 * Comprehensive seed script that creates:
 * 1. Donor and Volunteer accounts with auto-verification
 * 2. Volunteer profile with dummy data
 * 3. Sample donation requests
 */

const DEMO_USERS = [
  {
    name: 'Taohid Donor',
    email: 'tauhidtbm2@gmail.com',
    password: 'Donor1@Taohid',
    role: USER_ROLES.DONOR,
    phone: '01939954398',
    address: 'Kurmitola, Dhaka',
  },
  {
    name: 'Mintu Volunteer',
    email: 'mintumohammad15678@gmail.com',
    password: 'Volunteer1@Taohid',
    role: USER_ROLES.VOLUNTEER,
    phone: '01700000000',
    address: 'Dhaka, Bangladesh',
  },
];

const SAMPLE_DONATIONS = [
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.FOOD,
    title: 'Excess Rice from Wedding',
    food_type: 'cooked',
    food_name: 'Biryani Rice',
    quantity: 15,
    quantity_unit: 'kg',
    number_of_servings: 50,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-09-29',
    pickup_time_slot: 'evening',
    expiry_date: '2026-09-29',
    contact_phone: '01939954398',
    description: 'Extra cooked rice from a wedding ceremony. Still fresh and properly stored.',
    ingredients: 'Rice, spices, oil',
    allergens: null,
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.FOOD,
    title: 'Packaged Bread',
    food_type: 'packaged',
    food_name: 'Sliced Bread',
    quantity: 20,
    quantity_unit: 'packet',
    number_of_servings: 100,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-09-30',
    pickup_time_slot: 'morning',
    expiry_date: '2026-10-05',
    contact_phone: '01939954398',
    description: 'Brand new packaged bread with expiry date of Oct 5. Good for distribution.',
    ingredients: 'Wheat flour, yeast, salt, sugar',
    allergens: 'wheat',
    storage_requirement: 'room_temperature',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: false,
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Winter Clothes Donation',
    clothing_category: 'jacket',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'good',
    quantity: 10,
    quantity_unit: 'piece',
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-09-30',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-10-15',
    contact_phone: '01939954398',
    description: 'Gently used winter jackets in good condition. Clean and ready to wear.',
    size: 'L',
    season: 'winter',
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Vegetables from Garden',
    food_type: 'raw',
    food_name: 'Mixed Vegetables',
    quantity: 25,
    quantity_unit: 'kg',
    number_of_servings: 80,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-10-01',
    pickup_time_slot: 'morning',
    expiry_date: '2026-10-03',
    contact_phone: '01939954398',
    description: 'Fresh vegetables from home garden including tomatoes, cucumbers, and leafy greens.',
    ingredients: 'Tomatoes, cucumbers, spinach, carrots',
    allergens: null,
    storage_requirement: 'refrigerated',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: true,
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.FOOD,
    title: 'Cooked Curry for Distribution',
    food_type: 'cooked',
    food_name: 'Chicken Curry',
    quantity: 10,
    quantity_unit: 'kg',
    number_of_servings: 40,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-10-02',
    pickup_time_slot: 'evening',
    expiry_date: '2026-10-02',
    contact_phone: '01939954398',
    description: 'Freshly cooked chicken curry prepared for community distribution.',
    ingredients: 'Chicken, onions, garlic, ginger, spices, oil',
    allergens: null,
    storage_requirement: 'refrigerated',
    is_vegetarian: false,
    is_halal: true,
    refrigeration_required: true,
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Childrens Clothes Bundle',
    clothing_category: 't_shirt',
    gender: 'unisex',
    age_group: 'child',
    item_condition: 'like_new',
    quantity: 15,
    quantity_unit: 'piece',
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-10-03',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-10-20',
    contact_phone: '01939954398',
    description: 'Collection of gently used childrens t-shirts in various colors and sizes.',
    size: 'M',
    season: 'all_season',
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Sarees for Donation',
    clothing_category: 'saree',
    gender: 'female',
    age_group: 'adult',
    item_condition: 'good',
    quantity: 8,
    quantity_unit: 'piece',
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-10-04',
    pickup_time_slot: 'morning',
    expiry_date: '2026-11-01',
    contact_phone: '01939954398',
    description: 'Traditional sarees in good condition, suitable for adult women.',
    size: 'free_size',
    season: 'all_season',
  },
  {
    donor_email: 'tauhidtbm2@gmail.com',
    category: DONATION_CATEGORY.FOOD,
    title: 'Milk Packets',
    food_type: 'packaged',
    food_name: 'Fresh Milk',
    quantity: 30,
    quantity_unit: 'liter',
    number_of_servings: 60,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
    pickup_date: '2026-10-05',
    pickup_time_slot: 'morning',
    expiry_date: '2026-10-07',
    contact_phone: '01939954398',
    description: 'Fresh milk packets with expiry date of Oct 7. Perfect for distribution to families.',
    ingredients: 'Fresh milk',
    allergens: 'milk',
    storage_requirement: 'refrigerated',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: true,
  },
];

async function seedUsers() {
  console.log('[SeedDummyData] Starting user creation...');
  
  const userIds = {};
  
  for (const demoUser of DEMO_USERS) {
    const existing = await userModel.findByEmail(demoUser.email);
    
    if (existing) {
      console.log(`[SeedDummyData] ${demoUser.email} already exists (id=${existing.id}, role=${existing.role}); skipping.`);
      userIds[demoUser.email] = existing.id;
      continue;
    }
    
    const hashedPassword = await hashPassword(demoUser.password);
    
    const newUserId = await userModel.createUser({
      name: demoUser.name,
      email: demoUser.email,
      hashedPassword,
      role: demoUser.role,
      phone: demoUser.phone,
      address: demoUser.address,
      profilePhotoPath: null,
      provider: null,
      googleId: null,
      profilePicture: null,
      emailVerified: true, // Auto-verify for demo
      phoneVerified: false,
    });
    
    await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);
    
    console.log(`[SeedDummyData] Created ${demoUser.role} account (id=${newUserId}): ${demoUser.email}`);
    userIds[demoUser.email] = newUserId;
  }
  
  return userIds;
}

async function seedVolunteerProfile(volunteerId) {
  console.log('[SeedDummyData] Creating volunteer profile...');
  
  const existing = await volunteerProfileModel.findByUserId(volunteerId);
  
  if (existing) {
    console.log(`[SeedDummyData] Volunteer profile already exists for user ${volunteerId}; skipping.`);
    return;
  }
  
  await volunteerProfileModel.upsert({
    userId: volunteerId,
    vehicleType: 'motorcycle',
    availability: ['morning', 'afternoon', 'evening'],
    serviceAreas: [
      { area: 'Dhaka', coordinates: { lat: 23.8103, lng: 90.4125 } },
      { area: 'Mirpur', coordinates: { lat: 23.8223, lng: 90.3654 } },
      { area: 'Uttara', coordinates: { lat: 23.8737, lng: 90.3928 } },
    ],
  });
  
  await volunteerProfileModel.upsertLocation({
    userId: volunteerId,
    latitude: 23.8103,
    longitude: 90.4125,
    coverageRadius: 5,
    baseAddress: 'Dhaka, Bangladesh',
  });
  
  console.log(`[SeedDummyData] Created volunteer profile for user ${volunteerId}`);
}

async function seedDonations(userIds) {
  console.log('[SeedDummyData] Creating sample donations...');
  
  for (const donation of SAMPLE_DONATIONS) {
    const donorId = userIds[donation.donor_email];
    
    if (!donorId) {
      console.log(`[SeedDummyData] Donor not found for ${donation.donor_email}; skipping donation.`);
      continue;
    }
    
    try {
      const columns = [];
      const values = {};
      const placeholders = [];
      
      // Build dynamic INSERT based on category
      if (donation.category === DONATION_CATEGORY.FOOD) {
        columns.push('donor_id', 'category', 'title', 'food_type', 'food_name', 'quantity', 
                     'quantity_unit', 'number_of_servings', 'pickup_location', 'pickup_date', 
                     'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 
                     'ingredients', 'allergens', 'storage_requirement', 'is_vegetarian', 
                     'is_halal', 'refrigeration_required', 'status');
        
        values.donorId = donorId;
        values.category = donation.category;
        values.title = donation.title;
        values.food_type = donation.food_type;
        values.food_name = donation.food_name;
        values.quantity = donation.quantity;
        values.quantity_unit = donation.quantity_unit;
        values.number_of_servings = donation.number_of_servings;
        values.pickup_location = donation.pickup_location;
        values.pickup_date = donation.pickup_date;
        values.pickup_time_slot = donation.pickup_time_slot;
        values.expiry_date = donation.expiry_date;
        values.contact_phone = donation.contact_phone;
        values.description = donation.description;
        values.ingredients = donation.ingredients;
        values.allergens = donation.allergens ? JSON.stringify([donation.allergens]) : null;
        values.storage_requirement = donation.storage_requirement;
        values.is_vegetarian = donation.is_vegetarian ? 'vegetarian' : 'non_vegetarian';
        values.is_halal = donation.is_halal ? 'yes' : 'no';
        values.refrigeration_required = donation.refrigeration_required ? 'yes' : 'no';
        values.status = DONATION_STATUS.PENDING;
        
        placeholders.push(':donorId', ':category', ':title', ':food_type', ':food_name', ':quantity',
                        ':quantity_unit', ':number_of_servings', ':pickup_location', ':pickup_date',
                        ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description',
                        ':ingredients', ':allergens', ':storage_requirement', ':is_vegetarian',
                        ':is_halal', ':refrigeration_required', ':status');
      } else if (donation.category === DONATION_CATEGORY.CLOTHES) {
        columns.push('donor_id', 'category', 'title', 'clothing_category', 'gender', 'age_group',
                     'item_condition', 'quantity', 'quantity_unit', 'pickup_location', 'pickup_date',
                     'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 'size', 'season', 'status');
        
        values.donorId = donorId;
        values.category = donation.category;
        values.title = donation.title;
        values.clothing_category = donation.clothing_category;
        values.gender = donation.gender;
        values.age_group = donation.age_group;
        values.item_condition = donation.item_condition;
        values.quantity = donation.quantity;
        values.quantity_unit = donation.quantity_unit;
        values.pickup_location = donation.pickup_location;
        values.pickup_date = donation.pickup_date;
        values.pickup_time_slot = donation.pickup_time_slot;
        values.expiry_date = donation.expiry_date;
        values.contact_phone = donation.contact_phone;
        values.description = donation.description;
        values.size = donation.size;
        values.season = donation.season;
        values.status = DONATION_STATUS.PENDING;
        
        placeholders.push(':donorId', ':category', ':title', ':clothing_category', ':gender', ':age_group',
                        ':item_condition', ':quantity', ':quantity_unit', ':pickup_location', ':pickup_date',
                        ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description', ':size', ':season', ':status');
      }
      
      withPickupTime(columns, placeholders, values);
      const sql = `INSERT INTO donation_requests (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await pool.query(sql, values);
      
      console.log(`[SeedDummyData] Created donation: ${donation.title}`);
    } catch (error) {
      console.error(`[SeedDummyData] Failed to create donation "${donation.title}":`, error.message);
    }
  }
}

async function seedVolunteerActivity(volunteerId, donorId) {
  console.log('[SeedDummyData] Creating volunteer activity data...');
  
  try {
    // Create some completed donations for the volunteer
    const completedDonations = [
      {
        donor_id: donorId,
        volunteer_id: volunteerId,
        category: DONATION_CATEGORY.FOOD,
        title: 'Completed Food Donation 1',
        food_type: 'cooked',
        food_name: 'Rice and Curry',
        quantity: 10,
        quantity_unit: 'kg',
        number_of_servings: 30,
        pickup_location: 'Mirpur, Dhaka',
        pickup_date: '2026-09-20',
        pickup_time_slot: 'evening',
        expiry_date: '2026-09-20',
        contact_phone: '01939954398',
        description: 'Previously completed donation',
        ingredients: 'Rice, lentils, spices',
        allergens: null,
        storage_requirement: 'room_temperature',
        is_vegetarian: true,
        is_halal: true,
        refrigeration_required: false,
        status: DONATION_STATUS.COMPLETED,
        accepted_at: '2026-09-20 10:00:00',
        completed_at: '2026-09-20 18:00:00',
      },
      {
        donor_id: donorId,
        volunteer_id: volunteerId,
        category: DONATION_CATEGORY.CLOTHES,
        title: 'Completed Clothes Donation',
        clothing_category: 'shirt',
        gender: 'male',
        age_group: 'adult',
        item_condition: 'good',
        quantity: 5,
        quantity_unit: 'piece',
        pickup_location: 'Uttara, Dhaka',
        pickup_date: '2026-09-25',
        pickup_time_slot: 'afternoon',
        expiry_date: '2026-10-10',
        contact_phone: '01939954398',
        description: 'Previously completed clothes donation',
        size: 'L',
        season: 'all_season',
        status: DONATION_STATUS.COMPLETED,
        accepted_at: '2026-09-25 09:00:00',
        completed_at: '2026-09-25 14:00:00',
      },
    ];
    
    for (const donation of completedDonations) {
      try {
        const columns = [];
        const values = {};
        const placeholders = [];
        
        if (donation.category === DONATION_CATEGORY.FOOD) {
          columns.push('donor_id', 'volunteer_id', 'category', 'title', 'food_type', 'food_name', 'quantity', 
                       'quantity_unit', 'number_of_servings', 'pickup_location', 'pickup_date', 
                       'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 
                       'ingredients', 'allergens', 'storage_requirement', 'is_vegetarian', 
                       'is_halal', 'refrigeration_required', 'status', 'accepted_at', 'completed_at');
          
          Object.keys(donation).forEach(key => {
            if (key !== 'category' && key !== 'food_type' && key !== 'food_name' && key !== 'clothing_category' &&
                key !== 'gender' && key !== 'age_group' && key !== 'item_condition' && key !== 'size' && key !== 'season') {
              values[key] = donation[key];
            }
          });
          
          values.category = donation.category;
          values.food_type = donation.food_type;
          values.food_name = donation.food_name;
          values.allergens = donation.allergens ? JSON.stringify([donation.allergens]) : null;
          values.storage_requirement = donation.storage_requirement;
          values.is_vegetarian = donation.is_vegetarian ? 'vegetarian' : 'non_vegetarian';
          values.is_halal = donation.is_halal ? 'yes' : 'no';
          values.refrigeration_required = donation.refrigeration_required ? 'yes' : 'no';
          
          placeholders.push(':donor_id', ':volunteer_id', ':category', ':title', ':food_type', ':food_name', ':quantity',
                          ':quantity_unit', ':number_of_servings', ':pickup_location', ':pickup_date',
                          ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description',
                          ':ingredients', ':allergens', ':storage_requirement', ':is_vegetarian',
                          ':is_halal', ':refrigeration_required', ':status', ':accepted_at', ':completed_at');
        } else if (donation.category === DONATION_CATEGORY.CLOTHES) {
          columns.push('donor_id', 'volunteer_id', 'category', 'title', 'clothing_category', 'gender', 'age_group',
                       'item_condition', 'quantity', 'quantity_unit', 'pickup_location', 'pickup_date',
                       'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 'size', 'season', 
                       'status', 'accepted_at', 'completed_at');
          
          Object.keys(donation).forEach(key => {
            if (key !== 'category' && key !== 'food_type' && key !== 'food_name' && key !== 'clothing_category' &&
                key !== 'gender' && key !== 'age_group' && key !== 'item_condition' && key !== 'size' && key !== 'season') {
              values[key] = donation[key];
            }
          });
          
          values.category = donation.category;
          values.clothing_category = donation.clothing_category;
          values.gender = donation.gender;
          values.age_group = donation.age_group;
          values.item_condition = donation.item_condition;
          values.size = donation.size;
          values.season = donation.season;
          
          placeholders.push(':donor_id', ':volunteer_id', ':category', ':title', ':clothing_category', ':gender', ':age_group',
                          ':item_condition', ':quantity', ':quantity_unit', ':pickup_location', ':pickup_date',
                          ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description', ':size', ':season',
                          ':status', ':accepted_at', ':completed_at');
        }
        
        withPickupTime(columns, placeholders, values);
        const sql = `INSERT INTO donation_requests (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const [result] = await pool.query(sql, values);
        
        const donationId = result.insertId;
        console.log(`[SeedDummyData] Created completed donation: ${donation.title} (ID: ${donationId})`);
        
        // Add ratings for completed donations
        await pool.query(
          `INSERT INTO ratings (donation_request_id, rated_by, rated_user, stars, comment) VALUES (?, ?, ?, ?, ?)`,
          [donationId, donorId, volunteerId, 5, 'Excellent service! Very punctual and professional.']
        );
        console.log(`[SeedDummyData] Added rating for donation ${donationId}`);
        
      } catch (error) {
        console.error(`[SeedDummyData] Failed to create completed donation "${donation.title}":`, error.message);
      }
    }
    
    console.log('[SeedDummyData] Volunteer activity data created successfully!');
  } catch (error) {
    console.error('[SeedDummyData] Failed to create volunteer activity:', error.message);
  }
}

async function seedDummyData() {
  try {
    const userIds = await seedUsers();
    
    // Create volunteer profile for the volunteer
    const donorId = userIds['tauhidtbm2@gmail.com'];
    
    const volunteerId = userIds['mintumohammad15678@gmail.com'];
    if (volunteerId) {
      await seedVolunteerProfile(volunteerId);
    }
    
    // Create sample donations
    await seedDonations(userIds);
    
    // Create volunteer activity data (completed donations and ratings)
    if (volunteerId && donorId) {
      await seedVolunteerActivity(volunteerId, donorId);
    }
    
    console.log('[SeedDummyData] Dummy data seeding completed successfully!');
  } catch (error) {
    console.error('[SeedDummyData] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedDummyData();
