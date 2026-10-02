const { pool } = require('./portionbridge/server/config/db');

async function seedDonations() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const donorId = 9; // Taohid Donor
    const volunteerId = 10; // Mintu Volunteer
    const donorPhone = '01939954398';
    const pickupLocation = 'House 14, Road 4, Kurmitola, Dhaka';
    const savedAddressId = 16;
    const addressDetails = JSON.stringify({
      full_address: 'House 14, Road 4, Kurmitola, Dhaka',
      area: 'Kurmitola',
      district: 'Dhaka',
      division: 'Dhaka',
      postal_code: '1229',
      contact_person_name: 'Taohid Bhuiyan',
      contact_phone: '01939954398'
    });

    const donations = [
      {
        title: 'Fresh Cooked Kacchi Biryani & Borhani',
        category: 'food',
        food_type: 'cooked',
        food_name: 'Mutton Kacchi Biryani',
        quantity: 35,
        quantity_unit: 'box',
        number_of_servings: 35,
        description: '35 individual airtight lunch boxes of hot, flavorful wedding mutton kacchi biryani with boiled eggs, borhani, and fresh salad.',
        ingredients: 'Mutton, Chinigura Rice, Ghee, Spices, Potatoes, Eggs, Yogurt',
        allergens: JSON.stringify(['dairy', 'eggs']),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'non_vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        photo: 'donations/biryani_food.jpg',
        images: JSON.stringify(['donations/biryani_food.jpg']),
        additional_notes: 'Food is prepared fresh and packaged hygienically. Please distribute as soon as possible.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() - 3 * 86400000),
        pickup_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'afternoon',
        contact_phone: donorPhone,
        status: 'completed',
        volunteer_id: volunteerId,
        accepted_at: new Date(Date.now() - 3 * 86400000 + 3600000),
        scheduled_at: new Date(Date.now() - 3 * 86400000 + 7200000),
        completed_at: new Date(Date.now() - 3 * 86400000 + 14400000),
        chat: [
          { sender_id: 10, message: 'Assalamu Alaikum Taohid bhai, ami donation ti accept korechi. Duupure 2:30 tay pickup korte ashbo.' },
          { sender_id: 9, message: 'Walaikum Assalam Mintu bhai, shob lunch box ready ache. Gate e ese call diben.' },
          { sender_id: 10, message: 'Ami Kurmitola pouchacche, 5 min lagbe.' },
          { sender_id: 10, message: 'Alhamdulillah, food packet gula shundorbhabe sthaniyo ashroykendro-te distribute kora hoyeche!' },
          { sender_id: 9, message: 'Onek dhonnobad Mintu bhai, apnar volunteer service oshadharon chilo!' }
        ],
        ratings: [
          { rated_by: 9, rated_user: 10, stars: 5, comment: 'Mintu bhai was very punctual, polite, and handled food distribution seamlessly!' },
          { rated_by: 10, rated_user: 9, stars: 5, comment: 'Donor Taohid bhai packed everything perfectly and cooperated throughout the pickup.' }
        ]
      },
      {
        title: 'Warm Winter Jackets & Hoodies',
        category: 'clothes',
        clothing_category: 'jacket',
        gender: 'unisex',
        age_group: 'teen',
        item_condition: 'like_new',
        brand: 'Various',
        size: 'l',
        color: 'Assorted (Black, Navy, Grey)',
        season: 'winter',
        quantity: 20,
        quantity_unit: 'piece',
        description: '20 clean, sanitized and freshly washed winter jackets, hoodies, and fleece windbreakers suitable for teens and young adults.',
        photo: 'donations/winter_clothes.jpg',
        images: JSON.stringify(['donations/winter_clothes.jpg']),
        additional_notes: 'All zippers and buttons are intact. Packed in clean transparent bags.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() - 1 * 86400000),
        pickup_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'morning',
        contact_phone: donorPhone,
        status: 'picked_up',
        volunteer_id: volunteerId,
        accepted_at: new Date(Date.now() - 1 * 86400000 + 3600000),
        scheduled_at: new Date(Date.now() - 1 * 86400000 + 7200000),
        completed_at: null,
        chat: [
          { sender_id: 10, message: 'Taohid bhai, winter jacket gulo collect korechi. Ekhon distribution point e niye jacchi.' },
          { sender_id: 9, message: 'Shundor! Sheet er shomoy bachha der onek upokar hobe.' }
        ]
      },
      {
        title: 'Fresh Bakery Bread, Rolls & Sweet Buns',
        category: 'food',
        food_type: 'packaged',
        food_name: 'Bakery Sandwich Bread & Buns',
        quantity: 45,
        quantity_unit: 'packet',
        number_of_servings: 45,
        description: '45 packets of fresh bakery sandwich loaves, butter sweet buns, and dinner rolls, prepared today morning.',
        ingredients: 'Flour, Yeast, Sugar, Butter, Milk',
        allergens: JSON.stringify(['gluten', 'dairy']),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        photo: 'donations/bakery_bread.jpg',
        images: JSON.stringify(['donations/bakery_bread.jpg']),
        additional_notes: 'All items are factory sealed in food-grade packaging.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(),
        pickup_date: new Date().toISOString().split('T')[0],
        pickup_time_slot: 'evening',
        contact_phone: donorPhone,
        status: 'on_the_way',
        volunteer_id: volunteerId,
        accepted_at: new Date(Date.now() - 7200000),
        scheduled_at: new Date(Date.now() - 3600000),
        completed_at: null,
        chat: [
          { sender_id: 10, message: 'Taohid bhai, ami r 10-15 minute er moddhe pickup location e pouchabo.' },
          { sender_id: 9, message: 'Ji Mintu bhai, shob packet ready ache, ami wait korchi.' }
        ]
      },
      {
        title: 'Children Cotton T-Shirts & Pants Bundle',
        category: 'clothes',
        clothing_category: 'shirt',
        gender: 'unisex',
        age_group: 'child',
        item_condition: 'good',
        brand: 'Kids Wear',
        size: 'm',
        color: 'Multicolor',
        season: 'all_season',
        quantity: 30,
        quantity_unit: 'piece',
        description: '30 pieces of neatly folded and clean children cotton t-shirts, polo shirts, and casual pants suitable for kids aged 5 to 11.',
        photo: 'donations/kids_clothes.jpg',
        images: JSON.stringify(['donations/kids_clothes.jpg']),
        additional_notes: 'Separated by size and ready for collection.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() + 86400000),
        pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'morning',
        contact_phone: donorPhone,
        status: 'accepted',
        volunteer_id: volunteerId,
        accepted_at: new Date(),
        scheduled_at: new Date(Date.now() + 86400000),
        completed_at: null,
        chat: [
          { sender_id: 10, message: 'Taohid bhai, ami kal sokale 10 tay pickup korte ashbo InshaAllah.' },
          { sender_id: 9, message: 'InshaAllah Mintu bhai, dekha hobe.' }
        ]
      },
      {
        title: 'Seasonal Fresh Fruits & Juice Boxes',
        category: 'food',
        food_type: 'raw',
        food_name: 'Apples, Bananas & Orange Juice',
        quantity: 40,
        quantity_unit: 'box',
        number_of_servings: 40,
        description: '40 boxes filled with fresh ripe apples, bananas, Malta oranges and packaged 100% fruit juices.',
        ingredients: 'Fresh Whole Fruits, Pure Juice',
        allergens: JSON.stringify([]),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        photo: 'donations/fresh_fruits.jpg',
        images: JSON.stringify(['donations/fresh_fruits.jpg']),
        additional_notes: 'Keep in shade, perfect for immediate distribution.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() - 5 * 86400000),
        pickup_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'morning',
        contact_phone: donorPhone,
        status: 'completed',
        volunteer_id: volunteerId,
        accepted_at: new Date(Date.now() - 5 * 86400000 + 3600000),
        scheduled_at: new Date(Date.now() - 5 * 86400000 + 7200000),
        completed_at: new Date(Date.now() - 5 * 86400000 + 12000000),
        chat: [
          { sender_id: 9, message: 'Mintu bhai, fruit boxes ready.' },
          { sender_id: 10, message: 'Got it, successfully delivered to daycare!' }
        ],
        ratings: [
          { rated_by: 9, rated_user: 10, stars: 5, comment: 'Great job by Mintu! Handled delicate fruits with care.' },
          { rated_by: 10, rated_user: 9, stars: 5, comment: 'Fresh and high-grade fruits, very neatly packaged.' }
        ]
      },
      {
        title: 'Festive Cotton & Georgette Sarees',
        category: 'clothes',
        clothing_category: 'saree',
        gender: 'female',
        age_group: 'adult',
        item_condition: 'like_new',
        brand: 'Traditional',
        size: 'free_size',
        color: 'Red, Blue & Gold',
        season: 'all_season',
        quantity: 12,
        quantity_unit: 'piece',
        description: '12 traditional Bengali cotton and georgette sarees with matching blouses in excellent, like-new condition.',
        photo: 'donations/sarees_clothing.jpg',
        images: JSON.stringify(['donations/sarees_clothing.jpg']),
        additional_notes: 'Neatly washed and ironed, ready for direct wear.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() + 2 * 86400000),
        pickup_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'afternoon',
        contact_phone: donorPhone,
        status: 'pending',
        volunteer_id: null,
        accepted_at: null,
        scheduled_at: null,
        completed_at: null
      },
      {
        title: 'Hot Khichuri, Egg Curry & Pickles',
        category: 'food',
        food_type: 'cooked',
        food_name: 'Bhuna Khichuri & Egg Curry',
        quantity: 25,
        quantity_unit: 'plate',
        number_of_servings: 25,
        description: '25 hot containers of savory aromatic Bhuna Khichuri with roasted eggs and mango pickle, cooked in hygienic home setting.',
        ingredients: 'Rice, Lentils, Eggs, Spices, Mustard Oil',
        allergens: JSON.stringify(['eggs']),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'non_vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        photo: 'donations/khichuri_food.jpg',
        images: JSON.stringify(['donations/khichuri_food.jpg']),
        additional_notes: 'Hot and ready to eat immediately.',
        pickup_location: pickupLocation,
        saved_address_id: savedAddressId,
        pickup_address_details: addressDetails,
        pickup_time: new Date(Date.now() + 1 * 86400000),
        pickup_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
        pickup_time_slot: 'evening',
        contact_phone: donorPhone,
        status: 'pending',
        volunteer_id: null,
        accepted_at: null,
        scheduled_at: null,
        completed_at: null
      }
    ];

    for (const item of donations) {
      const [res] = await connection.query(
        `INSERT INTO donation_requests (
          title, donor_id, volunteer_id, assignment_mode, category,
          food_type, food_name, quantity, quantity_unit, number_of_servings,
          description, ingredients, allergens, storage_requirement,
          is_vegetarian, is_halal, refrigeration_required,
          clothing_category, gender, age_group, item_condition, brand, size, color, season,
          photo, images, additional_notes, pickup_location, saved_address_id, pickup_address_details,
          pickup_time, pickup_date, pickup_time_slot, contact_phone,
          scheduled_at, accepted_at, completed_at, status
        ) VALUES (
          ?, ?, ?, 'individual', ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          item.title, donorId, item.volunteer_id, item.category,
          item.food_type || null, item.food_name || null, item.quantity, item.quantity_unit, item.number_of_servings || null,
          item.description, item.ingredients || null, item.allergens || null, item.storage_requirement || null,
          item.is_vegetarian || null, item.is_halal || null, item.refrigeration_required || null,
          item.clothing_category || null, item.gender || null, item.age_group || null, item.item_condition || null, item.brand || null, item.size || null, item.color || null, item.season || null,
          item.photo, item.images, item.additional_notes, item.pickup_location, item.saved_address_id, item.pickup_address_details,
          item.pickup_time, item.pickup_date, item.pickup_time_slot, item.contact_phone,
          item.scheduled_at, item.accepted_at, item.completed_at, item.status
        ]
      );

      const donationId = res.insertId;
      console.log('Inserted donation ID:', donationId, item.title, '(' + item.status + ')');

      // Status history
      const statuses = ['pending'];
      if (item.status === 'accepted') statuses.push('accepted');
      if (item.status === 'scheduled') statuses.push('accepted', 'scheduled');
      if (item.status === 'on_the_way') statuses.push('accepted', 'scheduled', 'on_the_way');
      if (item.status === 'picked_up') statuses.push('accepted', 'scheduled', 'on_the_way', 'picked_up');
      if (item.status === 'completed') statuses.push('accepted', 'scheduled', 'on_the_way', 'picked_up', 'completed');

      let prevStatus = null;
      for (const st of statuses) {
        await connection.query(
          `INSERT INTO donation_status_history (donation_request_id, changed_by, old_status, new_status) VALUES (?, ?, ?, ?)`,
          [donationId, st === 'pending' ? donorId : volunteerId, prevStatus, st]
        );
        prevStatus = st;
      }

      // Chat messages
      if (item.chat && item.chat.length > 0) {
        for (const msg of item.chat) {
          await connection.query(
            `INSERT INTO chat_messages (donation_request_id, sender_id, message, is_read) VALUES (?, ?, ?, 1)`,
            [donationId, msg.sender_id, msg.message]
          );
        }
      }

      // Ratings
      if (item.ratings && item.ratings.length > 0) {
        for (const r of item.ratings) {
          await connection.query(
            `INSERT INTO ratings (donation_request_id, rated_by, rated_user, stars, comment) VALUES (?, ?, ?, ?, ?)`,
            [donationId, r.rated_by, r.rated_user, r.stars, r.comment]
          );
        }
      }
    }

    await connection.commit();
    console.log('Successfully imported all dummy donation data with pictures!');
  } catch (error) {
    await connection.rollback();
    console.error('Error importing dummy data:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDonations();
