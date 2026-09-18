const { pool } = require('../config/db');
const achievementService = require('../services/achievement.service');

const DONOR_ID = 216;
const ADDRESS_ID = 61;
const SEED_ID = 'seed_donor_216_demo_v1';
const PICKUP_ADDRESS = {
  label: 'home',
  fullAddress: 'Kurmitola, Dhaka',
  division: 'Dhaka',
  district: 'Dhaka',
  area: 'Kurmitola',
  postalCode: '1229',
  latitude: 23.82617977,
  longitude: 90.4155552,
  contactPersonName: 'Taohid',
  contactPhone: '01939954398',
};

const donations = [
  {
    key: 'community-lunch-aug-08',
    title: 'Community Lunch Boxes',
    category: 'food',
    foodType: 'cooked',
    foodName: 'Chicken khichuri with vegetables',
    quantity: 35,
    quantityUnit: 'box',
    numberOfServings: 35,
    description: 'Freshly prepared lunch boxes from a family gathering. Packed separately and ready for pickup this evening.',
    ingredients: 'Rice, lentils, chicken, potato, carrot, spices',
    storageRequirement: 'room_temperature',
    isVegetarian: 'non_vegetarian',
    isHalal: 'yes',
    refrigerationRequired: 'no',
    pickupTime: '2026-08-08 18:30:00',
    pickupDate: '2026-08-08',
    pickupTimeSlot: 'evening',
    expiryDate: '2026-08-09 02:00:00',
    createdAt: '2026-08-08 14:10:00',
    volunteerId: 621,
    completedAt: '2026-08-08 19:05:00',
    rating: [5, 'Mohammad arrived on time and handled the food boxes carefully.'],
  },
  {
    key: 'children-clothes-aug-20',
    title: 'Children\'s Clothes for Relief',
    category: 'clothes',
    clothingCategory: 'others',
    gender: 'unisex',
    ageGroup: 'child',
    itemCondition: 'good',
    quantity: 18,
    quantityUnit: 'piece',
    description: 'Clean children\'s clothes from our family wardrobe, sorted by size and packed in one reusable bag.',
    size: 'free_size',
    color: 'Mixed colours',
    season: 'all_season',
    pickupTime: '2026-08-20 10:30:00',
    pickupDate: '2026-08-20',
    pickupTimeSlot: 'morning',
    createdAt: '2026-08-18 20:25:00',
    volunteerId: 5,
    completedAt: '2026-08-20 11:20:00',
    rating: [4, 'Sabbir communicated clearly and completed the pickup smoothly.'],
  },
  {
    key: 'bakery-surplus-aug-29',
    title: 'Bakery Surplus for Evening Distribution',
    category: 'food',
    foodType: 'packaged',
    foodName: 'Bread, buns and vegetable patties',
    quantity: 24,
    quantityUnit: 'packet',
    numberOfServings: 48,
    description: 'Sealed bakery items left after a small office event. Best distributed the same day.',
    ingredients: 'Wheat flour, vegetables, egg, milk',
    allergens: '["wheat", "egg", "milk"]',
    storageRequirement: 'room_temperature',
    isVegetarian: 'vegetarian',
    isHalal: 'yes',
    refrigerationRequired: 'no',
    pickupTime: '2026-08-29 17:30:00',
    pickupDate: '2026-08-29',
    pickupTimeSlot: 'evening',
    expiryDate: '2026-08-30 02:00:00',
    createdAt: '2026-08-29 12:40:00',
    volunteerId: 6,
    completedAt: '2026-08-29 18:10:00',
    rating: [5, 'Nusrat kept me updated and collected the boxes without delay.'],
  },
  {
    key: 'iftar-packets-sep-07',
    title: 'Iftar Packets from Family Gathering',
    category: 'food',
    foodType: 'cooked',
    foodName: 'Rice, chicken curry and salad packets',
    quantity: 12,
    quantityUnit: 'box',
    numberOfServings: 12,
    description: 'Extra sealed meal packets from a family programme. Please share with people who can use them tonight.',
    ingredients: 'Rice, chicken, vegetables, salad, spices',
    storageRequirement: 'room_temperature',
    isVegetarian: 'non_vegetarian',
    isHalal: 'yes',
    refrigerationRequired: 'no',
    pickupTime: '2026-09-07 19:00:00',
    pickupDate: '2026-09-07',
    pickupTimeSlot: 'evening',
    expiryDate: '2026-09-08 01:00:00',
    createdAt: '2026-09-07 15:05:00',
    volunteerId: 621,
    completedAt: '2026-09-07 19:35:00',
    rating: null,
  },
  {
    key: 'blankets-sep-12',
    title: 'Clean Blankets for Monsoon Nights',
    category: 'clothes',
    clothingCategory: 'blanket',
    gender: 'unisex',
    ageGroup: 'adult',
    itemCondition: 'good',
    quantity: 10,
    quantityUnit: 'piece',
    description: 'Ten freshly washed blankets in good condition. Folded and packed for distribution to families needing extra bedding.',
    size: 'free_size',
    color: 'Mixed colours',
    season: 'rainy',
    pickupTime: '2026-09-12 15:30:00',
    pickupDate: '2026-09-12',
    pickupTimeSlot: 'afternoon',
    createdAt: '2026-09-10 18:45:00',
    volunteerId: 5,
    completedAt: '2026-09-12 16:15:00',
    rating: null,
  },
  {
    key: 'family-meals-sep-21',
    title: 'Family Meal Portions for Pickup',
    category: 'food',
    foodType: 'cooked',
    foodName: 'Vegetable pulao and chicken roast',
    quantity: 20,
    quantityUnit: 'plate',
    numberOfServings: 20,
    description: 'Twenty portions remaining from a weekend family meal. Packed in disposable containers and available from the front gate.',
    ingredients: 'Rice, vegetables, chicken, spices',
    storageRequirement: 'room_temperature',
    isVegetarian: 'non_vegetarian',
    isHalal: 'yes',
    refrigerationRequired: 'no',
    pickupTime: '2026-09-21 18:30:00',
    pickupDate: '2026-09-21',
    pickupTimeSlot: 'evening',
    expiryDate: '2026-09-22 02:00:00',
    createdAt: '2026-09-18 09:15:00',
    volunteerId: 621,
    status: 'scheduled',
    scheduledAt: '2026-09-21 18:30:00',
  },
  {
    key: 'school-uniforms-sep-18',
    title: 'School Uniforms and Stationery',
    category: 'clothes',
    clothingCategory: 'shirt',
    gender: 'unisex',
    ageGroup: 'child',
    itemCondition: 'good',
    quantity: 8,
    quantityUnit: 'piece',
    description: 'Good-condition school shirts and trousers from last year, washed and folded. Suitable for primary-school children.',
    size: 'm',
    color: 'White and navy',
    season: 'all_season',
    pickupTime: '2026-09-24 11:00:00',
    pickupDate: '2026-09-24',
    pickupTimeSlot: 'morning',
    expiryDate: '2026-09-30 23:00:00',
    createdAt: '2026-09-18 10:05:00',
    volunteerId: null,
    status: 'pending',
  },
  {
    key: 'mixed-clothes-cancelled',
    title: 'Mixed Family Clothes Donation',
    category: 'clothes',
    clothingCategory: 'others',
    gender: 'unisex',
    ageGroup: 'adult',
    itemCondition: 'good',
    quantity: 6,
    quantityUnit: 'piece',
    description: 'A small bag of clean clothes that was withdrawn because the items were needed by a relative.',
    size: 'free_size',
    color: 'Mixed colours',
    season: 'all_season',
    pickupTime: '2026-09-03 11:00:00',
    pickupDate: '2026-09-03',
    pickupTimeSlot: 'morning',
    expiryDate: '2026-09-10 23:00:00',
    createdAt: '2026-09-01 17:30:00',
    volunteerId: null,
    status: 'cancelled',
    isDeleted: 1,
  },
];

function pickupDetails() {
  return JSON.stringify(PICKUP_ADDRESS);
}

async function assertReferenceData(connection) {
  const [donors] = await connection.query(
    `SELECT id FROM users WHERE id = :id AND name = 'Taohid' AND email = 'tauhidtbm2@gmail.com' AND role = 'donor' AND is_deleted = 0`,
    { id: DONOR_ID }
  );
  if (donors.length !== 1) throw new Error('Donor 216 identity did not match; no data was written.');

  const [addresses] = await connection.query(
    `SELECT id FROM saved_addresses WHERE id = :addressId AND user_id = :donorId AND area = 'Kurmitola' AND district = 'Dhaka'`,
    { addressId: ADDRESS_ID, donorId: DONOR_ID }
  );
  if (addresses.length !== 1) throw new Error('Donor 216 saved address 61 did not match; no data was written.');

  const [volunteers] = await connection.query(
    `SELECT id FROM users WHERE id IN (5, 6, 621) AND role = 'volunteer' AND is_deleted = 0`
  );
  if (volunteers.length !== 3) throw new Error('One or more existing volunteer references are unavailable.');
}

async function insertDonation(connection, donation) {
  const [result] = await connection.query(
    `INSERT INTO donation_requests (
       donor_id, volunteer_id, title, category, food_type, food_name, quantity,
       quantity_unit, number_of_servings, pickup_location, pickup_time, pickup_date,
       pickup_time_slot, expiry_date, contact_phone, description, ingredients,
       allergens, storage_requirement, is_vegetarian, is_halal, refrigeration_required,
       clothing_category, gender, age_group, item_condition, size, color, season,
       saved_address_id, pickup_address_details, scheduled_at, completed_at, status,
       is_deleted, deleted_at, created_at, updated_at
     ) VALUES (
       :donorId, :volunteerId, :title, :category, :foodType, :foodName, :quantity,
       :quantityUnit, :numberOfServings, :pickupLocation, :pickupTime, :pickupDate,
       :pickupTimeSlot, :expiryDate, :contactPhone, :description, :ingredients,
       :allergens, :storageRequirement, :isVegetarian, :isHalal, :refrigerationRequired,
       :clothingCategory, :gender, :ageGroup, :itemCondition, :size, :color, :season,
       :addressId, :pickupAddressDetails, :scheduledAt, :completedAt, :status,
       :isDeleted, :deletedAt, :createdAt, :createdAt
     )`,
    {
      donorId: DONOR_ID,
      volunteerId: donation.status === 'pending' || donation.status === 'cancelled' ? null : donation.volunteerId,
      title: donation.title,
      category: donation.category,
      foodType: donation.foodType || null,
      foodName: donation.foodName || null,
      quantity: donation.quantity,
      quantityUnit: donation.quantityUnit,
      numberOfServings: donation.numberOfServings || null,
      pickupLocation: PICKUP_ADDRESS.fullAddress,
      pickupTime: donation.pickupTime,
      pickupDate: donation.pickupDate,
      pickupTimeSlot: donation.pickupTimeSlot,
      expiryDate: donation.expiryDate || null,
      contactPhone: PICKUP_ADDRESS.contactPhone,
      description: donation.description,
      ingredients: donation.ingredients || null,
      allergens: donation.allergens ? JSON.stringify(JSON.parse(donation.allergens)) : null,
      storageRequirement: donation.storageRequirement || null,
      isVegetarian: donation.isVegetarian || null,
      isHalal: donation.isHalal || null,
      refrigerationRequired: donation.refrigerationRequired || null,
      clothingCategory: donation.clothingCategory || null,
      gender: donation.gender || null,
      ageGroup: donation.ageGroup || null,
      itemCondition: donation.itemCondition || null,
      size: donation.size || null,
      color: donation.color || null,
      season: donation.season || null,
      addressId: ADDRESS_ID,
      pickupAddressDetails: pickupDetails(),
      scheduledAt: donation.scheduledAt || null,
      completedAt: donation.completedAt || null,
      status: 'pending',
      isDeleted: donation.isDeleted || 0,
      deletedAt: donation.isDeleted ? '2026-09-03 10:00:00' : null,
      createdAt: donation.createdAt,
    }
  );

  const donationId = result.insertId;
  if (donation.status === 'cancelled') {
    await connection.query(
      `UPDATE donation_requests SET status = 'cancelled', is_deleted = 1, deleted_at = :deletedAt WHERE id = :id`,
      { id: donationId, deletedAt: '2026-09-03 10:00:00' }
    );
  } else if (donation.status === 'scheduled') {
    await connection.query(
      `UPDATE donation_requests SET accepted_at = :acceptedAt, status = 'accepted' WHERE id = :id`,
      { id: donationId, acceptedAt: '2026-09-18 09:45:00' }
    );
    await connection.query(
      `UPDATE donation_requests SET scheduled_at = :scheduledAt, status = 'scheduled' WHERE id = :id`,
      { id: donationId, scheduledAt: donation.scheduledAt }
    );
  } else if (donation.volunteerId) {
    await connection.query(
      `UPDATE donation_requests SET volunteer_id = :volunteerId, accepted_at = :acceptedAt, status = 'accepted' WHERE id = :id`,
      { id: donationId, volunteerId: donation.volunteerId, acceptedAt: `${donation.createdAt.slice(0, 10)} 15:00:00` }
    );
    await connection.query(
      `UPDATE donation_requests SET scheduled_at = :scheduledAt, status = 'scheduled' WHERE id = :id`,
      { id: donationId, scheduledAt: `${donation.pickupDate} ${donation.pickupTime.slice(11, 19)}` }
    );
    await connection.query(`UPDATE donation_requests SET status = 'on_the_way' WHERE id = :id`, { id: donationId });
    await connection.query(`UPDATE donation_requests SET status = 'picked_up' WHERE id = :id`, { id: donationId });
    await connection.query(
      `UPDATE donation_requests SET completed_at = :completedAt, status = 'completed' WHERE id = :id`,
      { id: donationId, completedAt: donation.completedAt }
    );
  }

  await connection.query(
    `UPDATE donation_requests SET created_at = :createdAt, updated_at = :createdAt WHERE id = :id`,
    { id: donationId, createdAt: donation.createdAt }
  );
  return donationId;
}

async function addDemoNotifications(connection, donationIds) {
  const notifications = [];
  for (const donation of donations) {
    const id = donationIds[donation.key];
    if (donation.status === 'cancelled') {
      notifications.push([DONOR_ID, 'donation_cancelled', 'Donation withdrawn', `Your donation request #${id} was withdrawn before pickup.`, id, 0, '2026-09-03 10:05:00']);
      continue;
    }
    if (donation.volunteerId) {
      notifications.push([DONOR_ID, 'volunteer_assigned', 'Volunteer assigned', `${donation.volunteerId === 621 ? 'Mohammad' : donation.volunteerId === 5 ? 'Sabbir Hossain' : 'Nusrat Jahan'} is handling donation request #${id}.`, id, donation.status === 'scheduled' ? 1 : 0, donation.createdAt]);
      if (donation.status === 'scheduled') {
        notifications.push([DONOR_ID, 'status_updated', 'Pickup scheduled', `A pickup has been scheduled for your donation request #${id}.`, id, 0, '2026-09-18 09:50:00']);
      }
    }
    if (donation.completedAt) {
      notifications.push([DONOR_ID, 'status_updated', 'Pickup completed', `Donation request #${id} was picked up successfully.`, id, 1, donation.completedAt]);
    }
  }
  for (const [userId, type, title, message, relatedId, isRead, createdAt] of notifications) {
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at) VALUES (:userId, :type, :title, :message, :relatedId, :isRead, :createdAt)`,
      { userId, type, title, message, relatedId, isRead, createdAt }
    );
  }
  return notifications.length;
}

async function addChatAndRatings(connection, donationIds) {
  const chats = [
    [donationIds['community-lunch-aug-08'], DONOR_ID, 'The lunch boxes are packed and ready at the Kurmitola gate.', '2026-08-08 18:05:00'],
    [donationIds['community-lunch-aug-08'], 621, 'I am nearby and will be there in about ten minutes.', '2026-08-08 18:12:00'],
    [donationIds['family-meals-sep-21'], DONOR_ID, 'The meal portions will be ready at the front gate from 6:15 PM.', '2026-09-18 09:20:00'],
    [donationIds['family-meals-sep-21'], 621, 'Thank you, I have noted the 6:30 PM pickup.', '2026-09-18 09:28:00'],
  ];
  for (const [donationRequestId, senderId, message, createdAt] of chats) {
    await connection.query(
      `INSERT INTO chat_messages (donation_request_id, sender_id, message, is_read, created_at) VALUES (:donationRequestId, :senderId, :message, :isRead, :createdAt)`,
      { donationRequestId, senderId, message, isRead: senderId === DONOR_ID ? 1 : 0, createdAt }
    );
  }

  let ratingsAdded = 0;
  for (const donation of donations.filter((item) => item.rating)) {
    await connection.query(
      `INSERT INTO ratings (donation_request_id, rated_by, rated_user, stars, comment, created_at) VALUES (:donationId, :ratedBy, :ratedUser, :stars, :comment, :createdAt)`,
      {
        donationId: donationIds[donation.key],
        ratedBy: DONOR_ID,
        ratedUser: donation.volunteerId,
        stars: donation.rating[0],
        comment: donation.rating[1],
        createdAt: donation.completedAt,
      }
    );
    ratingsAdded += 1;
  }
  return { chatsAdded: chats.length, ratingsAdded };
}

async function seed() {
  const connection = await pool.getConnection();
  try {
    const [marker] = await connection.query('SELECT id FROM schema_migrations WHERE id = :seedId LIMIT 1', { seedId: SEED_ID });
    if (marker.length) {
      await connection.beginTransaction();
      const [scheduledDonation] = await connection.query(
        `SELECT id, created_at FROM donation_requests
         WHERE donor_id = :donorId AND title = 'Family Meal Portions for Pickup'
         LIMIT 1`,
        { donorId: DONOR_ID }
      );
      if (scheduledDonation.length) {
        await connection.query(`DELETE FROM donation_status_history WHERE donation_request_id = :donationId`, { donationId: scheduledDonation[0].id });
        await connection.query(
          `INSERT INTO donation_status_history (donation_request_id, changed_by, old_status, new_status, changed_at)
           VALUES (:donationId, :changedBy, NULL, 'pending', :changedAt),
                  (:donationId, :changedBy, 'pending', 'accepted', :acceptedAt),
                  (:donationId, :changedBy, 'accepted', 'scheduled', :scheduledAt)`,
          {
            donationId: scheduledDonation[0].id,
            changedBy: DONOR_ID,
            changedAt: scheduledDonation[0].created_at,
            acceptedAt: '2026-09-18 09:45:00',
            scheduledAt: '2026-09-18 09:50:00',
          }
        );
      }
      await connection.commit();
      console.log(`[Seed] ${SEED_ID} already applied; verified without adding duplicates.`);
      return;
    }

    await connection.beginTransaction();
    await assertReferenceData(connection);

    const donationIds = {};
    for (const donation of donations) {
      donationIds[donation.key] = await insertDonation(connection, donation);
    }

    const notificationsAdded = await addDemoNotifications(connection, donationIds);
    const { chatsAdded, ratingsAdded } = await addChatAndRatings(connection, donationIds);

    await connection.query('INSERT INTO schema_migrations (id) VALUES (:seedId)', { seedId: SEED_ID });
    await connection.commit();
    await achievementService.checkAndUnlockAchievements(DONOR_ID, 'donor');

    console.log(JSON.stringify({
      seedId: SEED_ID,
      donorId: DONOR_ID,
      addressId: ADDRESS_ID,
      donationIds,
      donationsAdded: donations.length,
      volunteerConnections: donations.filter((item) => item.volunteerId).length,
      pickupRecords: donations.filter((item) => item.volunteerId).length,
      ratingsAdded,
      notificationsAdded,
      messagesAdded: chatsAdded,
    }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('[Seed] Failed:', error.message);
  process.exit(1);
});
