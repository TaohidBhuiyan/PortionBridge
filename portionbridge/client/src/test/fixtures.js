// Test-only sample objects shaped like the Phase 1 API responses. Never imported by app code.
export const incident = (over = {}) => ({
  id: 1, title: 'Test flood', description: 'Water is rising', disasterType: 'flood', severity: 'high',
  priority: 'normal', latitude: 24.91, longitude: 91.83, coordinatesApproximate: true, district: 'Sylhet',
  affectedArea: 'Companiganj', status: 'verified', isVerified: true, sourceType: 'admin_entry',
  verifiedAt: '2026-10-10T08:00:00.000Z', resolvedAt: null, createdAt: '2026-10-09T08:00:00.000Z', updatedAt: '2026-10-10T09:00:00.000Z',
  ...over,
});

export const quantities = (over = {}) => ({
  requested: 1000, activePledged: 300, collected: 200, delivered: 150, committed: 450,
  remainingToPledge: 550, remainingUnfulfilled: 850, collectedAwaitingDelivery: 50, fulfillmentStage: 'partially_delivered', ...over,
});

export const item = (over = {}) => ({
  id: 11, requestId: 5, name: 'Drinking water', category: 'drinking_water', unit: 'liter', priority: 'urgent',
  status: 'active', notes: null, quantities: quantities(), ...over,
});

export const request = (over = {}) => ({
  id: 5, incidentId: 1, title: 'Shelter supplies', description: null, locationName: 'Govt Primary School',
  latitude: 24.9, longitude: 91.83, coordinatesApproximate: true, priority: 'high', status: 'approved',
  requestingOrganization: null, expiresAt: null, isExpired: false, approvedAt: null, closedAt: null,
  createdAt: '2026-10-09T10:00:00.000Z', updatedAt: '2026-10-11T10:00:00.000Z',
  items: [item()], summary: { totalItems: 1, fulfilledItems: 0, fullyPledgedItems: 0, partiallyPledgedItems: 0, partiallyDeliveredItems: 1, openItems: 0, isFullyFulfilled: false },
  ...over,
});

export const listResponse = (incidents, meta = {}) => ({
  success: true, message: 'ok', data: { incidents },
  meta: { page: 1, limit: 25, totalItems: incidents.length, totalPages: 1, ...meta },
});

// ---- Phase 3 fixtures (pledges, tasks, reports) ----
export const pledge = (over = {}) => ({
  id: 41, itemId: 11, requestId: 5, itemName: 'Dry food', itemCategory: 'dry_food', unit: 'packet', requestTitle: 'Shelter supplies',
  quantityPledged: 100, quantityCollected: 0, quantityDelivered: 0, quantityPendingVerification: 0, status: 'pledged',
  donationRequestId: 77, notes: null, createdAt: '2026-10-12T08:00:00.000Z', updatedAt: '2026-10-12T08:00:00.000Z',
  tracking: {
    donationId: 77, taskStatus: 'available', donationStatus: 'pending', pickup: { date: '2026-10-20', timeSlot: 'morning', address: 'House 5, Road 3, Gulshan' },
    destination: { name: 'Govt School Shelter' }, volunteerName: null, scheduledAt: null, hasOpenIssue: false,
    quantity: { pledged: 100, collected: 0, delivered: 0, pendingVerification: 0 },
  },
  ...over,
});

export const task = (over = {}) => ({
  pledgeId: 41, taskStatus: 'available', pledgeStatus: 'pledged', hasOpenIssue: false, needsAttention: false,
  incident: { id: 1, title: 'Test flood', district: 'Sylhet', disasterType: 'flood', severity: 'high' },
  request: { id: 5, title: 'Shelter supplies', priority: 'urgent', locationName: 'Govt School Shelter' },
  item: { id: 11, name: 'Dry food', category: 'dry_food', unit: 'packet' },
  quantity: { pledged: 100, collected: 0, delivered: 0, pendingVerification: 0 },
  pickup: { date: '2026-10-20', timeSlot: 'morning', area: 'Gulshan, Dhaka' },
  donationId: 77, pledgedAt: '2026-10-12T08:00:00.000Z', distanceKm: 3.2,
  ...over,
});

export const assignedTask = (over = {}) => task({
  taskStatus: 'accepted', requested: 500,
  pickup: { date: '2026-10-20', timeSlot: 'morning', area: 'Gulshan, Dhaka', address: 'House 5, Road 3, Gulshan, Dhaka', landmark: 'Near the mosque', instructions: 'Ring twice', contactName: 'Donor Contact', contactPhone: '+8801711111111', latitude: 23.81, longitude: 90.41 },
  dropoff: { name: 'Govt School Shelter', address: 'Dropoff Road 9', instructions: 'Ask for the shelter manager', latitude: 24.9, longitude: 91.8 },
  donor: { name: 'Donor Name' }, assignedTo: { volunteerId: 3, volunteerName: 'Vol One', memberId: null, memberName: null },
  scheduledAt: null, acceptedAt: '2026-10-12T09:00:00.000Z', collectedAt: null, deliveredAt: null, completedAt: null,
  ...over,
});

export const report = (over = {}) => ({
  id: 301, type: 'delivery', status: 'pending', quantity: 100, verifiedQuantity: null, isFinal: true, createdAt: '2026-10-13T10:00:00.000Z',
  notes: 'Handed to the shelter manager', reporterName: 'Vol One', reviewNotes: null, reviewerName: null, reviewedAt: null,
  pledgeId: 41, pledgeStatus: 'collected', donationId: 77,
  incident: { id: 1, title: 'Test flood', district: 'Sylhet' }, request: { id: 5, title: 'Shelter supplies' },
  item: { id: 11, name: 'Dry food', unit: 'packet' }, donorName: 'Donor Name',
  pledge: { pledged: 100, collected: 100, delivered: 0, pendingVerification: 100 },
  ...over,
});
