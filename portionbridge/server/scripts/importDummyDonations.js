require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../config/db');

async function main() {
  try {
    console.log('[Import] Fetching donor user...');
    const [donors] = await pool.query("SELECT id, name, email FROM users WHERE role = 'donor' LIMIT 5");
    
    let donorId;
    if (donors.length > 0) {
      donorId = donors[0].id;
      console.log(`Using donor: ${donors[0].name} (ID: ${donorId})`);
    } else {
      const [allUsers] = await pool.query("SELECT id, name, email, role FROM users LIMIT 1");
      donorId = allUsers[0].id;
      console.log(`Using user ID: ${donorId}`);
    }

    // Clean up any incomplete test insert
    await pool.query("DELETE FROM donation_requests WHERE title = 'Excess Kacchi Biryani from Wedding'");

    const dummyDonations = [
      {
        title: 'Excess Kacchi Biryani from Wedding',
        category: 'food',
        food_type: 'cooked',
        food_name: 'Mutton Kacchi Biryani & Borhani',
        quantity: 40,
        quantity_unit: 'box',
        number_of_servings: 80,
        pickup_location: 'Road 27, House 15, Dhanmondi, Dhaka',
        pickup_address_details: JSON.stringify({
          address: 'Road 27, House 15, Dhanmondi, Dhaka',
          latitude: 23.7465,
          longitude: 90.3775,
        }),
        pickup_time: '2026-10-03 19:00:00',
        pickup_date: '2026-10-03',
        pickup_time_slot: 'evening',
        expiry_date: '2026-10-03 23:59:00',
        contact_phone: '01711223344',
        description: 'Extra cooked mutton biryani from a wedding reception. Fresh, hot and cleanly packed in individual food boxes.',
        ingredients: 'Basmati rice, mutton, potatoes, ghee, aromatic spices',
        allergens: JSON.stringify([]),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'non_vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'
        ]),
        status: 'pending',
      },
      {
        title: 'Fresh Bakery Items and Bread',
        category: 'food',
        food_type: 'packaged',
        food_name: 'Bread, Buns & Pastries',
        quantity: 50,
        quantity_unit: 'piece',
        number_of_servings: 50,
        pickup_location: 'Circle 2, Gulshan, Dhaka',
        pickup_address_details: JSON.stringify({
          address: 'Circle 2, Gulshan, Dhaka',
          latitude: 23.7925,
          longitude: 90.4035,
        }),
        pickup_time: '2026-10-03 10:00:00',
        pickup_date: '2026-10-03',
        pickup_time_slot: 'morning',
        expiry_date: '2026-10-06 20:00:00',
        contact_phone: '01819283746',
        description: 'Unsold fresh bakery packets from daily batch. Completely sealed, hygienic, and ready for distribution.',
        ingredients: 'Wheat flour, yeast, sugar, milk, eggs',
        allergens: JSON.stringify(['wheat', 'milk', 'egg']),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'
        ]),
        status: 'pending',
      },
      {
        title: 'Surplus Fresh Vegetables',
        category: 'food',
        food_type: 'raw',
        food_name: 'Potatoes, Tomatoes, Onions & Pumpkin',
        quantity: 35,
        quantity_unit: 'kg',
        number_of_servings: 70,
        pickup_location: 'Karwan Bazar, Tejgaon, Dhaka',
        pickup_address_details: JSON.stringify({
          address: 'Karwan Bazar, Tejgaon, Dhaka',
          latitude: 23.7533,
          longitude: 90.3938,
        }),
        pickup_time: '2026-10-03 15:30:00',
        pickup_date: '2026-10-03',
        pickup_time_slot: 'afternoon',
        expiry_date: '2026-10-08 18:00:00',
        contact_phone: '01912345678',
        description: 'Fresh surplus raw vegetables from wholesale market, ideal for community kitchens and shelters.',
        ingredients: null,
        allergens: JSON.stringify([]),
        storage_requirement: 'room_temperature',
        is_vegetarian: 'vegetarian',
        is_halal: 'yes',
        refrigeration_required: 'no',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
        ]),
        status: 'pending',
      },
      {
        title: 'Warm Winter Jackets & Hoodies',
        category: 'clothes',
        clothing_category: 'jacket',
        gender: 'unisex',
        age_group: 'adult',
        item_condition: 'good',
        quantity: 25,
        quantity_unit: 'piece',
        size: 'l',
        season: 'winter',
        pickup_location: 'Block C, Mirpur-10, Dhaka',
        pickup_address_details: JSON.stringify({
          address: 'Block C, Mirpur-10, Dhaka',
          latitude: 23.8069,
          longitude: 90.3687,
        }),
        pickup_time: '2026-10-04 10:00:00',
        pickup_date: '2026-10-04',
        pickup_time_slot: 'morning',
        expiry_date: '2026-10-20 23:59:00',
        contact_phone: '01623456789',
        description: 'Gently used warm winter jackets and hoodies. Washed, cleaned, sorted and ready to wear.',
        allergens: null,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
        ]),
        status: 'pending',
      },
      {
        title: 'Children Clothes & Blankets',
        category: 'clothes',
        clothing_category: 'shirt',
        gender: 'unisex',
        age_group: 'child',
        item_condition: 'good',
        quantity: 30,
        quantity_unit: 'piece',
        size: 'm',
        season: 'all_season',
        pickup_location: 'Sector 7, Uttara, Dhaka',
        pickup_address_details: JSON.stringify({
          address: 'Sector 7, Uttara, Dhaka',
          latitude: 23.8706,
          longitude: 90.3984,
        }),
        pickup_time: '2026-10-04 14:00:00',
        pickup_date: '2026-10-04',
        pickup_time_slot: 'afternoon',
        expiry_date: '2026-10-25 23:59:00',
        contact_phone: '01512345678',
        description: 'Assorted children clothing and baby blankets in very good condition.',
        allergens: null,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80'
        ]),
        status: 'pending',
      },
    ];

    console.log(`[Import] Inserting ${dummyDonations.length} donation requests...`);

    for (const item of dummyDonations) {
      const sql = `
        INSERT INTO donation_requests (
          donor_id, title, category, food_type, food_name, quantity, quantity_unit,
          number_of_servings, pickup_location, pickup_address_details, pickup_time, pickup_date,
          pickup_time_slot, expiry_date, contact_phone, description, ingredients,
          allergens, storage_requirement, is_vegetarian, is_halal, refrigeration_required,
          clothing_category, gender, age_group, item_condition, size, season, images, status
        ) VALUES (
          :donor_id, :title, :category, :food_type, :food_name, :quantity, :quantity_unit,
          :number_of_servings, :pickup_location, :pickup_address_details, :pickup_time, :pickup_date,
          :pickup_time_slot, :expiry_date, :contact_phone, :description, :ingredients,
          :allergens, :storage_requirement, :is_vegetarian, :is_halal, :refrigeration_required,
          :clothing_category, :gender, :age_group, :item_condition, :size, :season, :images, :status
        )
      `;

      const params = {
        donor_id: donorId,
        title: item.title,
        category: item.category,
        food_type: item.food_type || null,
        food_name: item.food_name || null,
        quantity: item.quantity,
        quantity_unit: item.quantity_unit,
        number_of_servings: item.number_of_servings || null,
        pickup_location: item.pickup_location,
        pickup_address_details: item.pickup_address_details || null,
        pickup_time: item.pickup_time,
        pickup_date: item.pickup_date,
        pickup_time_slot: item.pickup_time_slot,
        expiry_date: item.expiry_date,
        contact_phone: item.contact_phone,
        description: item.description,
        ingredients: item.ingredients || null,
        allergens: item.allergens || null,
        storage_requirement: item.storage_requirement || null,
        is_vegetarian: item.is_vegetarian || null,
        is_halal: item.is_halal || null,
        refrigeration_required: item.refrigeration_required || null,
        clothing_category: item.clothing_category || null,
        gender: item.gender || null,
        age_group: item.age_group || null,
        item_condition: item.item_condition || null,
        size: item.size || null,
        season: item.season || null,
        images: item.images || null,
        status: item.status,
      };

      const [res] = await pool.query(sql, params);
      console.log(`✓ Successfully imported: "${item.title}" (ID: ${res.insertId})`);
    }

    console.log('\n[Import] All 5 dummy donation requests with images were successfully imported to MySQL database!');
  } catch (err) {
    console.error('[Import] Error:', err);
  } finally {
    await pool.end();
  }
}

main();
