/**
 * Maps a disaster-relief item onto the existing donation_requests columns so a pledge
 * can ride the existing pickup lifecycle. The donation row is a LOGISTICS record
 * (who collects what, where, when); the authoritative relief quantities and statuses
 * stay on relief_pledges. donation_requests only knows food/clothes and whole numbers,
 * so:
 *   - drinking_water / dry_food / ready_to_eat_food -> category 'food'
 *   - clothing / blanket / hygiene_kit / other      -> category 'clothes'
 *     (clothing_category 'others', or 'blanket'); the title and description spell out
 *     what the item really is
 *   - quantity is the pledged quantity rounded UP to a whole number (e.g. 2.5 kg -> 3)
 *   - unit 'set' is stored as 'piece'
 */
const SLOT_TIME = { morning: '09:00:00', afternoon: '14:00:00', evening: '18:00:00' };

const FOOD_CATEGORIES = new Set(['drinking_water', 'dry_food', 'ready_to_eat_food']);

function buildReliefDonationPayload({ donorId, item, request, incident, quantityMilli, address, pickup }) {
  const isFood = FOOD_CATEGORIES.has(item.item_category);
  const quantity = Math.max(1, Math.ceil(quantityMilli / 1000));
  const unit = item.unit === 'set' ? 'piece' : item.unit;
  const place = [incident.title, incident.district].filter(Boolean).join(' — ');

  return {
    donorId,
    title: `Relief: ${item.item_name} for ${request.title}`.slice(0, 200),
    category: isFood ? 'food' : 'clothes',
    quantity,
    quantityUnit: unit,
    pickupLocation: address.pickupLocation,
    pickupTime: `${pickup.pickupDate} ${SLOT_TIME[pickup.pickupTimeSlot] || '09:00:00'}`,
    pickupDate: pickup.pickupDate,
    pickupTimeSlot: pickup.pickupTimeSlot,
    contactPhone: address.contactPhone,
    description: `Disaster relief pledge for "${place}". Deliver ${item.item_name} to: ${request.location_name}.`.slice(0, 500),
    // category-specific fields (required by the donation model for each category)
    foodType: isFood ? (item.item_category === 'ready_to_eat_food' ? 'cooked' : 'packaged') : undefined,
    foodName: isFood ? item.item_name.slice(0, 200) : undefined,
    clothingCategory: isFood ? undefined : (item.item_category === 'blanket' ? 'blanket' : 'others'),
    gender: isFood ? undefined : 'unisex',
    ageGroup: isFood ? undefined : 'adult',
    itemCondition: isFood ? undefined : 'good',
    additionalNotes: pickup.additionalNotes || null,
    savedAddressId: address.savedAddressId,
    pickupAddressDetails: address.pickupAddressDetails,
    assignmentMode: 'individual',
  };
}

module.exports = { buildReliefDonationPayload, SLOT_TIME };
