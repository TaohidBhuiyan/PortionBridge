require('dotenv').config();

const { pool } = require('../config/db');
const { DONATION_STATUS } = require('../constants');

/**
 * Seed script to create interactions between donor Taohid (ID: 9) and volunteer Mintu (ID: 10)
 * This creates accepted donations, chat messages, and shows the connection between them
 */

const DONOR_ID = 9;  // Taohid
const VOLUNTEER_ID = 10;  // Mintu

async function seedAcceptedDonations() {
  console.log('[SeedUserInteractions] Creating accepted donations between users...');
  
  const acceptedDonations = [
    {
      donor_id: DONOR_ID,
      volunteer_id: VOLUNTEER_ID,
      category: 'food',
      title: 'Rice and Lentils Distribution',
      food_type: 'cooked',
      food_name: 'Rice and Dal',
      quantity: 20,
      quantity_unit: 'kg',
      number_of_servings: 60,
      pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
      pickup_date: '2026-09-28',
      pickup_time_slot: 'evening',
      expiry_date: '2026-09-28',
      contact_phone: '01939954398',
      description: 'Cooked rice and lentils ready for pickup',
      ingredients: 'Rice, lentils, onions, spices',
      allergens: null,
      storage_requirement: 'room_temperature',
      is_vegetarian: true,
      is_halal: true,
      refrigeration_required: false,
      status: DONATION_STATUS.ACCEPTED,
      accepted_at: '2026-09-28 14:30:00',
    },
    {
      donor_id: DONOR_ID,
      volunteer_id: VOLUNTEER_ID,
      category: 'clothes',
      title: 'Summer Clothes Collection',
      clothing_category: 't_shirt',
      gender: 'unisex',
      age_group: 'adult',
      item_condition: 'good',
      quantity: 12,
      quantity_unit: 'piece',
      pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
      pickup_date: '2026-09-29',
      pickup_time_slot: 'morning',
      expiry_date: '2026-10-15',
      contact_phone: '01939954398',
      description: 'Collection of summer t-shirts in various sizes',
      size: 'M',
      season: 'summer',
      status: DONATION_STATUS.ACCEPTED,
      accepted_at: '2026-09-28 16:45:00',
    },
  ];
  
  const donationIds = [];
  
  for (const donation of acceptedDonations) {
    try {
      const columns = [];
      const values = {};
      const placeholders = [];
      
      if (donation.category === 'food') {
        columns.push('donor_id', 'volunteer_id', 'category', 'title', 'food_type', 'food_name', 'quantity', 
                     'quantity_unit', 'number_of_servings', 'pickup_location', 'pickup_date', 
                     'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 
                     'ingredients', 'allergens', 'storage_requirement', 'is_vegetarian', 
                     'is_halal', 'refrigeration_required', 'status', 'accepted_at');
        
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
        values.is_vegetarian = donation.is_vegetarian ? 1 : 0;
        values.is_halal = donation.is_halal ? 1 : 0;
        values.refrigeration_required = donation.refrigeration_required ? 1 : 0;
        
        placeholders.push(':donor_id', ':volunteer_id', ':category', ':title', ':food_type', ':food_name', ':quantity',
                        ':quantity_unit', ':number_of_servings', ':pickup_location', ':pickup_date',
                        ':pickup_time_slot', ':expiry_date', ':contact_phone', ':description',
                        ':ingredients', ':allergens', ':storage_requirement', ':is_vegetarian',
                        ':is_halal', ':refrigeration_required', ':status', ':accepted_at');
      } else if (donation.category === 'clothes') {
        columns.push('donor_id', 'volunteer_id', 'category', 'title', 'clothing_category', 'gender', 'age_group',
                     'item_condition', 'quantity', 'quantity_unit', 'pickup_location', 'pickup_date',
                     'pickup_time_slot', 'expiry_date', 'contact_phone', 'description', 'size', 'season', 
                     'status', 'accepted_at');
        
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
                        ':status', ':accepted_at');
      }
      
      const sql = `INSERT INTO donation_requests (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result] = await pool.query(sql, values);
      
      donationIds.push(result.insertId);
      console.log(`[SeedUserInteractions] Created accepted donation: ${donation.title} (ID: ${result.insertId})`);
      
    } catch (error) {
      console.error(`[SeedUserInteractions] Failed to create accepted donation "${donation.title}":`, error.message);
    }
  }
  
  return donationIds;
}

async function seedChatMessages(donationIds) {
  console.log('[SeedUserInteractions] Creating chat messages between users...');
  
  const chatMessages = [
    // For first donation (Rice and Lentils)
    {
      donation_request_id: donationIds[0],
      sender_id: VOLUNTEER_ID,
      message: 'Hello! I have accepted your donation request. I can pick it up this evening around 6 PM. Does that work for you?',
    },
    {
      donation_request_id: donationIds[0],
      sender_id: DONOR_ID,
      message: 'That sounds perfect! I will have everything ready by 5:30 PM. My address is Kurmitola, Dhaka - House 12, Road 5.',
    },
    {
      donation_request_id: donationIds[0],
      sender_id: VOLUNTEER_ID,
      message: 'Great! I have your location. I will call you when I am nearby. Thank you for the donation!',
    },
    {
      donation_request_id: donationIds[0],
      sender_id: DONOR_ID,
      message: 'You are welcome! Looking forward to your arrival.',
    },
    // For second donation (Summer Clothes)
    {
      donation_request_id: donationIds[1],
      sender_id: VOLUNTEER_ID,
      message: 'Hi! I can pick up the summer clothes tomorrow morning. Around 10 AM would be convenient.',
    },
    {
      donation_request_id: donationIds[1],
      sender_id: DONOR_ID,
      message: '10 AM works perfectly! The clothes are already packed and ready. Thank you for accepting.',
    },
    {
      donation_request_id: donationIds[1],
      sender_id: VOLUNTEER_ID,
      message: 'No problem! Happy to help. See you tomorrow morning.',
    },
  ];
  
  for (const chat of chatMessages) {
    try {
      await pool.query(
        `INSERT INTO chat_messages (donation_request_id, sender_id, message, is_read) VALUES (?, ?, ?, ?)`,
        [chat.donation_request_id, chat.sender_id, chat.message, 0]
      );
      console.log(`[SeedUserInteractions] Created chat message for donation ${chat.donation_request_id}`);
    } catch (error) {
      console.error(`[SeedUserInteractions] Failed to create chat message:`, error.message);
    }
  }
}

async function seedNotifications(donationIds) {
  console.log('[SeedUserInteractions] Creating notifications between users...');
  
  const notifications = [
    {
      user_id: DONOR_ID,
      type: 'donation_accepted',
      title: 'Donation Accepted',
      message: 'Mintu Volunteer has accepted your donation request "Rice and Lentils Distribution"',
      related_id: donationIds[0],
    },
    {
      user_id: DONOR_ID,
      type: 'donation_accepted',
      title: 'Donation Accepted',
      message: 'Mintu Volunteer has accepted your donation request "Summer Clothes Collection"',
      related_id: donationIds[1],
    },
    {
      user_id: VOLUNTEER_ID,
      type: 'new_message',
      title: 'New Message',
      message: 'Taohid Donor sent you a message regarding "Rice and Lentils Distribution"',
      related_id: donationIds[0],
    },
    {
      user_id: DONOR_ID,
      type: 'new_message',
      title: 'New Message',
      message: 'Mintu Volunteer sent you a message regarding "Rice and Lentils Distribution"',
      related_id: donationIds[0],
    },
  ];
  
  for (const notification of notifications) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, is_read) VALUES (?, ?, ?, ?, ?, ?)`,
        [notification.user_id, notification.type, notification.title, notification.message, notification.related_id, 0]
      );
      console.log(`[SeedUserInteractions] Created notification for user ${notification.user_id}`);
    } catch (error) {
      console.error(`[SeedUserInteractions] Failed to create notification:`, error.message);
    }
  }
}

async function seedUserInteractions() {
  try {
    console.log('[SeedUserInteractions] Starting user interaction seeding...');
    
    const donationIds = await seedAcceptedDonations();
    
    if (donationIds.length > 0) {
      await seedChatMessages(donationIds);
      await seedNotifications(donationIds);
    }
    
    console.log('[SeedUserInteractions] User interaction seeding completed successfully!');
  } catch (error) {
    console.error('[SeedUserInteractions] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedUserInteractions();
