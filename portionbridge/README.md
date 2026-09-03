# PortionBridge

Food & Clothes Donation Coordination Platform connecting donors with volunteers to reduce food waste and help those in need.

## Overview

PortionBridge is a web-based platform that enables:
- Donors to list food and clothing donations
- Volunteers to browse and accept donation requests
- Real-time tracking of donation status
- Efficient coordination between donors and volunteers

## Project Status

**Phase 1:** Landing Page - Completed
**Phase 2:** Authentication System - Completed
**Phase 3:** Dashboard Foundation - Completed
**Phase 4:** Donor Module - Completed
  - Donor Dashboard Overview
  - Donation Backend Audit
  - Donation Form UI
  - Donation Form Backend Integration
  - My Donations Module
  - Donation Details & Tracking Hub

**Phase 5:** Volunteer Module - Completed
**Phase 6:** Admin Module - Completed
**Phase 7:** Real-time Features - Completed
  - Socket.IO chat and notifications
  - Live donation status tracking
  - Team collaboration (announcements, invitations, member assignment)
  - Platform analytics and reporting (Admin)

## Features

### For Donors
- Multi-step donation form for food and items
- Image upload with cover image selection
- Donation management with search and filters
- Status tracking through visual timeline
- Volunteer information display
- Activity history

### For Volunteers
- Browse available donations
- Accept donation requests
- Schedule pickups
- Update donation status
- Team collaboration (announcements, member assignment, team-accepted donations)

### For Admins
- User management
- Donation oversight
- Volunteer & team management
- Reports and moderation
- Audit logs
- Platform analytics

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Lucide Icons
- Axios for API calls
- Socket.io-client for real-time features

**Backend:**
- Node.js with Express.js
- MySQL database with mysql2
- Socket.io for WebSocket communication
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- express-validator for input validation
- Swagger UI for API documentation

## Project Structure

```
portionbridge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/      # React Context providers
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── utils/        # Utility functions
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

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (via XAMPP or standalone)
- Git

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=portionbridge
JWT_SECRET=your_jwt_secret_here
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### Database Setup

1. Start MySQL via XAMPP
2. Import the schema:
```bash
mysql -u root -p portionbridge < database/portionbridge_schema.sql
```

3. Run migrations in order from `database/migrations/`

## API Documentation

When running in development mode, API documentation is available at:
- Swagger UI: `http://localhost:5000/api-docs`
- Socket.IO Events: See `server/docs/socketEvents.md`

## Environment Variables

### Backend (.env)
```env
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
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Production Deployment

### Environment
Set `NODE_ENV=production` to:
- Disable Swagger UI
- Disable detailed error logging
- Enforce HTTPS-only CORS origins

### CORS Configuration
Production origins come only from `CLIENT_URL` (must be `https://`) plus optional `ALLOWED_ORIGINS`

### Reverse Proxy
If behind a load balancer, set `TRUST_PROXY` to the number of proxy hops

### Rate Limiting
Current implementation is process-local (in-memory). For horizontal scaling, implement a shared store like Redis

## Contributing

This project is actively being developed. Contributions are welcome after completion of initial phases.

## License

MIT License - See LICENSE file for details