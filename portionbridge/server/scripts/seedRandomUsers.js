require('dotenv').config();

const { pool } = require('../config/db');
const { USER_ROLES, DONATION_CATEGORY, DONATION_STATUS } = require('../constants');
const { hashPassword } = require('../utils/password');
const userModel = require('../models/user.model');
const passwordHistoryModel = require('../models/passwordHistory.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');

/**
 * Seed script to create random donors and volunteers with diverse dummy data
 */

const RANDOM_USERS = [
  // Donors
  {
    name: 'Rahim Ahmed',
    email: 'rahim.ahmed@gmail.com',
    password: 'Donor2@Rahim',
    role: USER_ROLES.DONOR,
    phone: '01812345678',
    address: 'Dhanmondi, Dhaka',
  },
  {
    name: 'Fatima Begum',
    email: 'fatima.begum@yahoo.com',
    password: 'Donor3@Fatima',
    role: USER_ROLES.DONOR,
    phone: '01687654321',
    address: 'Gulshan, Dhaka',
  },
  {
    name: 'Karim Uddin',
    email: 'karim.uddin@hotmail.com',
    password: 'Donor4@Karim',
    role: USER_ROLES.DONOR,
    phone: '01523456789',
    address: 'Mirpur, Dhaka',
  },
  {
    name: 'Ayesha Khan',
    email: 'ayesha.khan@gmail.com',
    password: 'Donor5@Ayesha',
    role: USER_ROLES.DONOR,
    phone: '01734567890',
    address: 'Uttara, Dhaka',
  },
  {
    name: 'Jamal Hossain',
    email: 'jamal.hossain@yahoo.com',
    password: 'Donor6@Jamal',
    role: USER_ROLES.DONOR,
    phone: '01945678901',
    address: 'Mohammadpur, Dhaka',
  },
  // Volunteers
  {
    name: 'Salim Rahman',
    email: 'salim.rahman@gmail.com',
    password: 'Volunteer2@Salim',
    role: USER_ROLES.VOLUNTEER,
    phone: '01856789012',
    address: 'Bashundhara, Dhaka',
  },
  {
    name: 'Nasreen Akter',
    email: 'nasreen.akter@yahoo.com',
    password: 'Volunteer3@Nasreen',
    role: USER_ROLES.VOLUNTEER,
    phone: '01667890123',
    address: 'Banani, Dhaka',
  },
  {
    name: 'Rafiq Islam',
    email: 'rafiq.islam@hotmail.com',
    password: 'Volunteer4@Rafiq',
    role: USER_ROLES.VOLUNTEER,
    phone: '01578901234',
    address: 'Paltan, Dhaka',
  },
  {
    name: 'Sultana Parvin',
    email: 'sultana.parvin@gmail.com',
    password: 'Volunteer5@Sultana',
    role: USER_ROLES.VOLUNTEER,
    phone: '01789012345',
    address: 'Motijheel, Dhaka',
  },
  {
    name: 'Habibur Rahman',
    email: 'habib.rahman@yahoo.com',
    password: 'Volunteer6@Habib',
    role: USER_ROLES.VOLUNTEER,
    phone: '01990123456',
    address: 'Siddiqueganj, Dhaka',
  },
];

const SAMPLE_DONATIONS = [
  {
    donor_name: 'Rahim Ahmed',
    category: DONATION_CATEGORY.FOOD,
    title: 'Extra Biriyani from Event',
    food_type: 'cooked',
    food_name: 'Chicken Biriyani',
    quantity: 25,
    quantity_unit: 'kg',
    number_of_servings: 100,
    pickup_location: 'Dhanmondi, Dhaka - Road 27',
    pickup_date: '2026-10-06',
    pickup_time_slot: 'evening',
    expiry_date: '2026-10-06',
    contact_phone: '01812345678',
    description: 'Extra chicken biriyani from a corporate event. Fresh and ready to serve.',
    ingredients: 'Rice, chicken, spices, yogurt, oil',
    allergens: null,
    storage_requirement: 'room_temperature',
    is_vegetarian: false,
    is_halal: true,
    refrigeration_required: false,
  },
  {
    donor_name: 'Fatima Begum',
    category: DONATION_CATEGORY.FOOD,
    title: 'Homemade Sweets',
    food_type: 'packaged',
    food_name: 'Roshogolla and Sandesh',
    quantity: 50,
    quantity_unit: 'piece',
    number_of_servings: 25,
    pickup_location: 'Gulshan, Dhaka - Avenue 5',
    pickup_date: '2026-10-07',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-10-10',
    contact_phone: '01687654321',
    description: 'Fresh homemade Bengali sweets. Perfect for distribution.',
    ingredients: 'Milk, sugar, flour, cheese',
    allergens: 'milk',
    storage_requirement: 'refrigerated',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: true,
  },
  {
    donor_name: 'Karim Uddin',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Winter Blankets',
    clothing_category: 'blanket',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'good',
    quantity: 15,
    quantity_unit: 'piece',
    pickup_location: 'Mirpur, Dhaka - Section 10',
    pickup_date: '2026-10-08',
    pickup_time_slot: 'morning',
    expiry_date: '2026-11-30',
    contact_phone: '01523456789',
    description: 'Warm winter blankets in good condition. Perfect for cold weather.',
    size: 'free_size',
    season: 'winter',
  },
  {
    donor_name: 'Ayesha Khan',
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Fruits',
    food_type: 'raw',
    food_name: 'Mixed Fruits',
    quantity: 30,
    quantity_unit: 'kg',
    number_of_servings: 120,
    pickup_location: 'Uttara, Dhaka - Sector 7',
    pickup_date: '2026-10-09',
    pickup_time_slot: 'morning',
    expiry_date: '2026-10-12',
    contact_phone: '01734567890',
    description: 'Fresh seasonal fruits including apples, bananas, and oranges.',
    ingredients: 'Apples, bananas, oranges',
    allergens: null,
    storage_requirement: 'refrigerated',
    is_vegetarian: true,
    is_halal: true,
    refrigeration_required: true,
  },
  {
    donor_name: 'Jamal Hossain',
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Children School Uniforms',
    clothing_category: 'pants',
    gender: 'unisex',
    age_group: 'child',
    item_condition: 'like_new',
    quantity: 20,
    quantity_unit: 'piece',
    pickup_location: 'Mohammadpur, Dhaka - Geneva Camp',
    pickup_date: '2026-10-10',
    pickup_time_slot: 'afternoon',
    expiry_date: '2026-12-31',
    contact_phone: '01945678901',
    description: 'Gently used school uniforms for children. Various sizes available.',
    size: 'M',
    season: 'all_season',
  },
];

const VOLUNTEER_PROFILES = [
  {
    volunteer_name: 'Salim Rahman',
    vehicle_type: 'car',
    availability: ['morning', 'afternoon', 'evening'],
    service_areas: [
      { area: 'Bashundhara', coordinates: { lat: 23.8123, lng: 90.4234 } },
      { area: 'Gulshan', coordinates: { lat: 23.7823, lng: 90.4034 } },
      { area: 'Banani', coordinates: { lat: 23.7923, lng: 90.4134 } },
    ],
    latitude: 23.8123,
    longitude: 90.4234,
    base_address: 'Bashundhara, Dhaka',
    coverage_radius: 8,
  },
  {
    volunteer_name: 'Nasreen Akter',
    vehicle_type: 'bicycle',
    availability: ['afternoon', 'evening'],
    service_areas: [
      { area: 'Gulshan', coordinates: { lat: 23.7823, lng: 90.4034 } },
      { area: 'Banani', coordinates: { lat: 23.7923, lng: 90.4134 } },
    ],
    latitude: 23.7823,
    longitude: 90.4034,
    base_address: 'Gulshan, Dhaka',
    coverage_radius: 3,
  },
  {
    volunteer_name: 'Rafiq Islam',
    vehicle_type: 'motorcycle',
    availability: ['morning', 'evening'],
    service_areas: [
      { area: 'Paltan', coordinates: { lat: 23.7323, lng: 90.3934 } },
      { area: 'Motijheel', coordinates: { lat: 23.7423, lng: 90.4034 } },
      { area: 'Siddiqueganj', coordinates: { lat: 23.7523, lng: 90.4134 } },
    ],
    latitude: 23.7323,
    longitude: 90.3934,
    base_address: 'Paltan, Dhaka',
    coverage_radius: 6,
  },
  {
    volunteer_name: 'Sultana Parvin',
    vehicle_type: 'walking',
    availability: ['morning', 'afternoon'],
    service_areas: [
      { area: 'Motijheel', coordinates: { lat: 23.7423, lng: 90.4034 } },
    ],
    latitude: 23.7423,
    longitude: 90.4034,
    base_address: 'Motijheel, Dhaka',
    coverage_radius: 2,
  },
  {
    volunteer_name: 'Habibur Rahman',
    vehicle_type: 'motorcycle',
    availability: ['morning', 'afternoon', 'evening', 'night'],
    service_areas: [
      { area: 'Siddiqueganj', coordinates: { lat: 23.7523, lng: 90.4134 } },
      { area: 'Paltan', coordinates: { lat: 23.7323, lng: 90.3934 } },
      { area: 'Motijheel', coordinates: { lat: 23.7423, lng: 90.4034 } },
      { area: 'Gulshan', coordinates: { lat: 23.7823, lng: 90.4034 } },
    ],
    latitude: 23.7523,
    longitude: 90.4134,
    base_address: 'Siddiqueganj, Dhaka',
    coverage_radius: 10,
  },
];

async function seedRandomUsers() {
  console.log('[SeedRandomUsers] Starting random user creation...');
  
  const userIds = {};
  
  for (const user of RANDOM_USERS) {
    const existing = await userModel.findByEmail(user.email);
    
    if (existing) {
      console.log(`[SeedRandomUsers] ${user.email} already exists (id=${existing.id}, role=${existing.role}); skipping.`);
      userIds[user.email] = existing.id;
      continue;
    }
    
    const hashedPassword = await hashPassword(user.password);
    
    const newUserId = await userModel.createUser({
      name: user.name,
      email: user.email,
      hashedPassword,
      role: user.role,
      phone: user.phone,
      address: user.address,
      profilePhotoPath: null,
      provider: null,
      googleId: null,
      profilePicture: null,
      emailVerified: true,
      phoneVerified: false,
    });
    
    await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);
    
    console.log(`[SeedRandomUsers] Created ${user.role} account (id=${newUserId}): ${user.email}`);
    userIds[user.email] = newUserId;
  }
  
  return userIds;
}

async function seedVolunteerProfiles(userIds) {
  console.log('[SeedRandomUsers] Creating volunteer profiles...');
  
  for (const profile of VOLUNTEER_PROFILES) {
    const volunteerEmail = RANDOM_USERS.find(u => u.name === profile.volunteer_name)?.email;
    
    if (!volunteerEmail) {
      console.log(`[SeedRandomUsers] Volunteer not found for ${profile.volunteer_name}; skipping.`);
      continue;
    }
    
    const volunteerId = userIds[volunteerEmail];
    
    if (!volunteerId) {
      console.log(`[SeedRandomUsers] Volunteer ID not found for ${volunteerEmail}; skipping.`);
      continue;
    }
    
    const existing = await volunteerProfileModel.findByUserId(volunteerId);
    
    if (existing) {
      console.log(`[SeedRandomUsers] Volunteer profile already exists for ${profile.volunteer_name}; skipping.`);
      continue;
    }
    
    await volunteerProfileModel.upsert({
      userId: volunteerId,
      vehicleType: profile.vehicle_type,
      availability: profile.availability,
      serviceAreas: profile.service_areas,
    });
    
    await volunteerProfileModel.upsertLocation({
      userId: volunteerId,
      latitude: profile.latitude,
      longitude: profile.longitude,
      coverageRadius: profile.coverage_radius,
      baseAddress: profile.base_address,
    });
    
    console.log(`[SeedRandomUsers] Created volunteer profile for ${profile.volunteer_name}`);
  }
}

async function seedDonations(userIds) {
  console.log('[SeedRandomUsers] Creating sample donations...');
  
  for (const donation of SAMPLE_DONATIONS) {
    const donorEmail = RANDOM_USERS.find(u => u.name === donation.donor_name)?.email;
    
    if (!donorEmail) {
      console.log(`[SeedRandomUsers] Donor not found for ${donation.donor_name}; skipping donation.`);
      continue;
    }
    
    const donorId = userIds[donorEmail];
    
    if (!donorId) {
      console.log(`[SeedRandomUsers] Donor ID not found for ${donorEmail}; skipping donation.`);
      continue;
    }
    
    try {
      const columns = [];
      const values = {};
      const placeholders = [];
      
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
        values.is_vegetarian = donation.is_vegetarian ? 1 : 0;
        values.is_halal = donation.is_halal ? 1 : 0;
        values.refrigeration_required = donation.refrigeration_required ? 1 : 0;
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
      
      const sql = `INSERT INTO donation_requests (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await pool.query(sql, values);
      
      console.log(`[SeedRandomUsers] Created donation: ${donation.title}`);
    } catch (error) {
      console.error(`[SeedRandomUsers] Failed to create donation "${donation.title}":`, error.message);
    }
  }
}

async function seedRandomData() {
  try {
    console.log('[SeedRandomUsers] Starting random data seeding...');
    
    const userIds = await seedRandomUsers();
    await seedVolunteerProfiles(userIds);
    await seedDonations(userIds);
    
    console.log('[SeedRandomUsers] Random data seeding completed successfully!');
  } catch (error) {
    console.error('[SeedRandomUsers] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedRandomData();
