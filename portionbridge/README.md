# PortionBridge

Food & Clothes Donation Coordination Platform.

## Project Status

✅ **Phase 1:** Landing Page - Completed  
✅ **Phase 2:** Authentication System - Completed  
✅ **Phase 3:** Dashboard Foundation - Completed  
✅ **Phase 4:** Donor Module - Completed  
  - Donor Dashboard Overview  
  - Donation Backend Audit  
  - Donation Form UI  
  - Donation Form Backend Integration  
  - My Donations Module  
  - Donation Details & Tracking Hub  

🚧 **Phase 5:** Volunteer Module - In Progress  
⏳ **Phase 6:** Admin Module - Pending  
⏳ **Phase 7:** Real-time Features - Pending  

## Features

### For Donors
- **Multi-step Donation Form** - Create food and clothing donations with detailed information
- **Image Upload** - Upload multiple images with cover image selection
- **Donation Management** - View, search, filter, and manage all donations
- **Status Tracking** - Track donation status through visual timeline
- **Volunteer Information** - View assigned volunteer details
- **Activity History** - Complete timeline of donation activities

### For Volunteers
- Browse available donations
- Accept donations
- Schedule pickups
- Update donation status
- Team collaboration (coming soon)

### For Admins
- User management
- Donation oversight
- Platform analytics (coming soon)

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express.js
- **Database:** MySQL (via XAMPP), raw SQL with mysql2
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt
- **File Uploads:** Multer
- **Validation:** express-validator
- **API Documentation:** Swagger UI

## Project Structure

```
portionbridge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── common/   # Common UI components
│   │   │   ├── dashboard/ # Dashboard-specific components
│   │   │   └── donation/  # Donation form components
│   │   ├── context/      # React Context (Auth, Socket)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/                # Express backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── docs/            # API documentation
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── validators/      # Request validators
├── database/            # SQL migrations and schema
└── docs/               # Project documentation
```

## Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL (via XAMPP or standalone)
- Git

### Backend Setup
```bash
cd server
npm install
cp .env.example .env   # Configure your environment variables
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend will run on `http://localhost:5173`

### Database Setup
1. Start MySQL via XAMPP
2. Import the schema from `database/portionbridge_schema.sql`
3. Run migrations in order from `database/migrations/`

## API Documentation

- **Swagger UI:** `GET /api-docs` (available when `NODE_ENV !== 'production'`)
- **Socket.IO Events:** `server/docs/socketEvents.md`
- Both are hand-written from actual implementation - update them if code changes

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=portionbridge
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Production Notes

- **CORS:** Production origins come only from `CLIENT_URL` (must be `https://`) plus optional `ALLOWED_ORIGINS`
- **Reverse Proxy:** Set `TRUST_PROXY` if behind a load balancer
- **Rate Limiting:** Process-local (in-memory) - not suitable for horizontal scaling without Redis
- **Environment Validation:** Server refuses to start if required env vars are missing

## Recent Implementation Details

### Donation Form (Phase 4.2)
- Multi-step form with 5 steps
- Food and clothing category support
- Image upload with progress tracking
- Local storage draft management
- Backend validation integration
- Success/error handling

### My Donations Module (Phase 4.3)
- Card and table view modes
- Search, filter, and sort functionality
- Pagination support
- Statistics dashboard
- Cancel donation functionality
- View mode persistence

### Donation Details & Tracking Hub (Phase 4.4)
- Complete donation details display
- Status timeline visualization
- Image gallery with fullscreen preview
- Volunteer information card
- Activity history timeline
- Pickup information with map placeholder
- Future-ready for live tracking and chat

## Contributing

This project is actively being developed. Contributions are welcome after completion of initial phases.

## License

MIT License - See LICENSE file for details