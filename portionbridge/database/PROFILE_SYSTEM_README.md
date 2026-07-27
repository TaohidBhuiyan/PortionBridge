# PortionBridge Profile System Documentation

## Overview

The Profile System provides a complete, scalable profile management solution for Donors, Volunteers, and Admins. It follows the existing MVC architecture and coding conventions of the PortionBridge project.

## Database Setup

### Step 1: Run the Migration SQL

Execute the SQL migration file to create the new tables and add missing columns:

```bash
mysql -u your_username -p portionbridge < database/profile_system_tables.sql
```

Or run it directly in your MySQL client:

```sql
source database/profile_system_tables.sql
```

### New Tables Created

1. **user_preferences** - Stores donor preferences (pickup time slot, contact method)
2. **notification_settings** - Stores notification preferences for all user types
3. **volunteer_profiles** - Stores volunteer-specific information (vehicle type, availability, service areas)

### Columns Added to users Table

- `date_of_birth` (DATE, nullable) - User's date of birth
- `gender` (ENUM: male, female, unisex, nullable) - User's gender
- `phone_verified` (TINYINT, default 0) - Phone verification status

## API Endpoints

All profile endpoints are protected by JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Common Profile Operations (All Users)

#### Get Complete Profile
```http
GET /api/v1/profile
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "user": { /* user object */ },
    "preferences": { /* donor preferences or null */ },
    "volunteerProfile": { /* volunteer profile or null */ },
    "notificationSettings": { /* notification settings or null */ }
  }
}
```

#### Update Profile Information
```http
PATCH /api/v1/profile
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

#### Change Password
```http
POST /api/v1/profile/change-password
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Note:** This will revoke all active sessions and require re-login.

#### Update Email
```http
POST /api/v1/profile/update-email
Content-Type: application/json

{
  "newEmail": "newemail@example.com",
  "password": "CurrentPassword123!"
}
```

**Note:** Email verification status will be reset to unverified.

#### Update Phone
```http
POST /api/v1/profile/update-phone
Content-Type: application/json

{
  "newPhone": "+1234567890",
  "password": "CurrentPassword123!"
}
```

**Note:** Phone verification status will be reset to unverified.

### Donor-Specific Operations

#### Update Preferences
```http
PATCH /api/v1/profile/preferences
Content-Type: application/json

{
  "preferredPickupTimeSlot": "morning",
  "preferredContactMethod": "email"
}
```

**Allowed values:**
- `preferredPickupTimeSlot`: morning, afternoon, evening, night
- `preferredContactMethod`: email, phone, both

#### Get Donation Statistics
```http
GET /api/v1/profile/donor/statistics
```

**Response:**
```json
{
  "success": true,
  "message": "Donation statistics retrieved successfully.",
  "data": {
    "statistics": {
      "totalDonations": 10,
      "foodDonations": 7,
      "clothingDonations": 3,
      "completedDonations": 8,
      "pendingDonations": 1,
      "cancelledDonations": 1,
      "totalSuccessfulPickups": 8
    }
  }
}
```

### Volunteer-Specific Operations

#### Update Volunteer Profile
```http
PATCH /api/v1/profile/volunteer
Content-Type: application/json

{
  "vehicleType": "motorcycle",
  "availability": ["morning", "afternoon"],
  "serviceAreas": [
    {
      "division": "Dhaka",
      "district": "Dhaka",
      "area": "Gulshan"
    }
  ]
}
```

**Allowed values:**
- `vehicleType`: walking, bicycle, motorcycle, car
- `availability`: Array of morning, afternoon, evening, night

#### Get Volunteer Statistics
```http
GET /api/v1/profile/volunteer/statistics
```

**Response:**
```json
{
  "success": true,
  "message": "Volunteer statistics retrieved successfully.",
  "data": {
    "statistics": {
      "acceptedDonations": 15,
      "completedPickups": 12,
      "cancelledPickups": 2,
      "averageRating": 4.5,
      "totalRatings": 8,
      "completionRate": 80.0
    }
  }
}
```

### Notification Settings (All Users)

#### Get Notification Settings
```http
GET /api/v1/profile/notifications
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings retrieved successfully.",
  "data": {
    "notificationSettings": {
      "email_notifications": 1,
      "sms_notifications": 0,
      "push_notifications": 1,
      "donation_updates": 1,
      "pickup_updates": 1,
      "chat_notifications": 1
    }
  }
}
```

#### Update Notification Settings
```http
PATCH /api/v1/profile/notifications
Content-Type: application/json

{
  "emailNotifications": true,
  "smsNotifications": false,
  "pushNotifications": true,
  "donationUpdates": true,
  "pickupUpdates": true,
  "chatNotifications": true
}
```

## Validation Rules

### Profile Updates
- **name**: 2-100 characters, required if provided
- **phone**: 7-20 characters, optional
- **address**: Max 255 characters, optional
- **dateOfBirth**: Valid ISO 8601 date, age must be 13-120 years
- **gender**: male, female, unisex

### Password Change
- **currentPassword**: Required
- **newPassword**: 8-64 characters, must contain uppercase, lowercase, number, and special character
- **confirmPassword**: Must match newPassword
- Password cannot be reused from last 5 passwords

### Email/Phone Update
- **newEmail**: Valid email format, must not be in use by another account
- **newPhone**: 7-20 characters
- **password**: Current password required for verification

## Architecture

### Models
- `user.model.js` - Extended with profile update methods
- `userPreferences.model.js` - Donor preferences CRUD
- `notificationSettings.model.js` - Notification settings CRUD
- `volunteerProfile.model.js` - Volunteer profile CRUD
- `donation.model.js` - Extended with statistics query methods
- `rating.model.js` - Extended with user rating query method

### Services
- `profile.service.js` - Business logic for all profile operations

### Controllers
- `profile.controller.js` - Request handlers for profile endpoints

### Validators
- `profile.validator.js` - Input validation for all profile endpoints

### Routes
- `profile.routes.js` - Route definitions for profile endpoints

## Features

### Security
- JWT authentication required for all endpoints
- Password verification for sensitive operations (email/phone change, password change)
- Password reuse prevention (last 5 passwords)
- Session revocation on password change
- Audit logging for all profile changes

### Statistics
- Donor statistics calculated dynamically from donation data
- Volunteer statistics calculated dynamically from donation and rating data
- No redundant data storage

### Data Integrity
- Foreign key constraints with CASCADE delete
- Unique constraints on user-specific tables
- Transaction-safe operations where needed

### Scalability
- Modular architecture following existing patterns
- Clean separation of concerns (MVC)
- Reusable components
- Frontend-friendly API responses

## Testing

To test the profile system:

1. Run the database migration
2. Start the server
3. Register/login as a donor, volunteer, or admin
4. Use the access token to test profile endpoints

Example cURL commands:

```bash
# Get profile
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/profile

# Update profile
curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}' http://localhost:3000/api/v1/profile

# Change password
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"currentPassword":"old","newPassword":"new123!","confirmPassword":"new123!"}' \
  http://localhost:3000/api/v1/profile/change-password
```

## Notes

- Profile picture upload is handled by the existing upload controller
- Saved addresses are managed by the existing saved address controller
- The profile system integrates seamlessly with existing functionality
- All statistics are generated dynamically to avoid data duplication
- The system is designed to be easily extended for future requirements
