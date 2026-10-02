require('dotenv').config();

const { pool } = require('../config/db');
const { DONATION_CATEGORY, DONATION_STATUS } = require('../constants');

/**
 * Seed script to create nearby opportunities for volunteer discovery
 * These donations have proper pickup_address_details with coordinates for distance calculation
 */

const NEARBY_DONATIONS = [
  {
    donor_id: 11, // Rahim Ahmed
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Bakery Items',
    food_type: 'packaged',
    food_name: 'Bread and Buns',
    quantity: 40,
    quantity_unit: 'piece',
    number_of_servings: 80,
    pickup_location: 'Dhanmondi, Dhaka - Road 27, House 15',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Dhanmondi, Dhaka - Road 27, House 15',
      latitude: 23.7465,
      longitude: 90.3775,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Dhanmondi, Dhaka - Road 27, House 15',
      latitude: 23.7465,
      longitude: 90.3775,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 12, // Fatima Begum
    category: DONATION_CATEGORY.FOOD,
    title: 'Cooked Vegetables',
    food_type: 'cooked',
    food_name: 'Mixed Vegetable Curry',
    quantity: 15,
    quantity_unit: 'kg',
    number_of_servings: 45,
    pickup_location: 'Gulshan, Dhaka - Avenue 5, House 10',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Gulshan, Dhaka - Avenue 5, House 10',
      latitude: 23.7925,
      longitude: 90.4035,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Gulshan, Dhaka - Avenue 5, House 10',
      latitude: 23.7925,
      longitude: 90.4035,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 13, // Karim Uddin
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Summer T-Shirts',
    clothing_category: 't_shirt',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'like_new',
    quantity: 25,
    quantity_unit: 'piece',
    pickup_location: 'Mirpur, Dhaka - Section 10, Road 5',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Mirpur, Dhaka - Section 10, Road 5',
      latitude: 23.8225,
      longitude: 90.3655,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Mirpur, Dhaka - Section 10, Road 5',
      latitude: 23.8225,
      longitude: 90.3655,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 14, // Ayesha Khan
    category: DONATION_CATEGORY.FOOD,
    title: 'Rice and Dal',
    food_type: 'cooked',
    food_name: 'Traditional Rice and Lentils',
    quantity: 20,
    quantity_unit: 'kg',
    number_of_servings: 60,
    pickup_location: 'Uttara, Dhaka - Sector 7, House 20',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Uttara, Dhaka - Sector 7, House 20',
      latitude: 23.8735,
      longitude: 90.3925,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Uttara, Dhaka - Sector 7, House 20',
      latitude: 23.8735,
      longitude: 90.3925,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 15, // Jamal Hossain
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Kids Winter Wear',
    clothing_category: 'jacket',
    gender: 'unisex',
    age_group: 'child',
    item_condition: 'good',
    quantity: 18,
    quantity_unit: 'piece',
    pickup_location: 'Mohammadpur, Dhaka - Geneva Camp, Block A',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Mohammadpur, Dhaka - Geneva Camp, Block A',
      latitude: 23.7525,
      longitude: 90.3625,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Mohammadpur, Dhaka - Geneva Camp, Block A',
      latitude: 23.7525,
      longitude: 90.3625,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 9, // Taohid Donor
    category: DONATION_CATEGORY.FOOD,
    title: 'Beverage Packets',
    food_type: 'packaged',
    food_name: 'Juice Boxes',
    quantity: 100,
    quantity_unit: 'piece',
    number_of_servings: 100,
    pickup_location: 'Kurmitola, Dhaka - House 12, Road 5',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Kurmitola, Dhaka - House 12, Road 5',
      latitude: 23.8103,
      longitude: 90.4125,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Kurmitola, Dhaka - House 12, Road 5',
      latitude: 23.8103,
      longitude: 90.4125,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 11, // Rahim Ahmed
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Adult Jeans Collection',
    clothing_category: 'jeans',
    gender: 'unisex',
    age_group: 'adult',
    item_condition: 'good',
    quantity: 12,
    quantity_unit: 'piece',
    pickup_location: 'Dhanmondi, Dhaka - Road 27, Market Area',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Dhanmondi, Dhaka - Road 27, Market Area',
      latitude: 23.7485,
      longitude: 90.3795,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Dhanmondi, Dhaka - Road 27, Market Area',
      latitude: 23.7485,
      longitude: 90.3795,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 12, // Fatima Begum
    category: DONATION_CATEGORY.FOOD,
    title: 'Packaged Snacks',
    food_type: 'packaged',
    food_name: 'Biscuits and Cookies',
    quantity: 50,
    quantity_unit: 'packet',
    number_of_servings: 200,
    pickup_location: 'Gulshan, Dhaka - Avenue 5, Shopping Complex',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Gulshan, Dhaka - Avenue 5, Shopping Complex',
      latitude: 23.7945,
      longitude: 90.4055,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Gulshan, Dhaka - Avenue 5, Shopping Complex',
      latitude: 23.7945,
      longitude: 90.4055,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 13, // Karim Uddin
    category: DONATION_CATEGORY.FOOD,
    title: 'Fresh Fish Curry',
    food_type: 'cooked',
    food_name: 'Traditional Fish Curry',
    quantity: 12,
    quantity_unit: 'kg',
    number_of_servings: 36,
    pickup_location: 'Mirpur, Dhaka - Section 10, Local Market',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Mirpur, Dhaka - Section 10, Local Market',
      latitude: 23.8245,
      longitude: 90.3675,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Mirpur, Dhaka - Section 10, Local Market',
      latitude: 23.8245,
      longitude: 90.3675,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
    donor_id: 14, // Ayesha Khan
    category: DONATION_CATEGORY.CLOTHES,
    title: 'Babies Clothing Set',
    clothing_category: 'other',
    gender: 'unisex',
    age_group: 'baby',
    item_condition: 'like_new',
    quantity: 30,
    quantity_unit: 'piece',
    pickup_location: 'Uttara, Dhaka - Sector 7, Residential Area',
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: JSON.stringify({
      address: 'Uttara, Dhaka - Sector 7, Residential Area',
      latitude: 23.8755,
      longitude: 90.3945,
    }),
=======
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
    pickup_address_details: {
      address: 'Uttara, Dhaka - Sector 7, Residential Area',
      latitude: 23.8755,
      longitude: 90.3945,
    },
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
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
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
<<<<<<< C:/Users/HP/Desktop/PortionBridge/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
=======
            if (key === 'pickup_address_details' && typeof donation[key] === 'object') {
              values[key] = JSON.stringify(donation[key]);
            }
>>>>>>> c:/Users/HP/.windsurf/worktrees/PortionBridge/PortionBridge-gilded-pascal/portionbridge/server/scripts/seedNearbyOpportunities.js
          }
        });
        
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
