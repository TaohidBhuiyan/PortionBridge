# PortionBridge - Backend

Express.js backend for the PortionBridge Food & Clothes Donation Coordination Platform.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (via mysql2)
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **express-validator** - Request validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger
- **compression** - Response compression

## Project Structure

```
server/
├── config/              # Configuration files
│   ├── cors.js         # CORS configuration
│   ├── database.js     # Database connection
│   ├── environment.js  # Environment variable validation
│   └── uploadConfig.js # Multer upload configuration
├── constants/           # Application constants
│   └── index.js        # All enums and constants
├── controllers/        # Route controllers
│   ├── auth.controller.js
│   ├── donation.controller.js
│   ├── profile.controller.js
│   ├── upload.controller.js
│   └── [other controllers]
├── docs/               # API documentation
│   ├── openapi.js      # Swagger/OpenAPI specification
│   └── socketEvents.md # Socket.IO event documentation
├── middleware/         # Express middleware
│   ├── auth.middleware.js
│   ├── rateLimiter.js
│   ├── upload.middleware.js
│   └── [other middleware]
├── models/             # Database models
│   ├── user.model.js
│   ├── donation.model.js
│   ├── rating.model.js
│   └── [other models]
├── routes/             # API route definitions
│   ├── v1/
│   │   ├── index.js    # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── donation.routes.js
│   │   ├── profile.routes.js
│   │   └── [other routes]
├── services/           # Business logic
│   ├── auth.service.js
│   ├── donation.service.js
│   ├── profile.service.js
│   └── [other services]
├── sockets/            # Socket.IO handlers
│   ├── auth.handler.js
│   ├── donation.handler.js
│   └── [other handlers]
├── utils/              # Utility functions
│   ├── auditLogger.js
│   ├── emailTemplates.js
│   └── [other utilities]
├── validators/         # Request validation rules
│   ├── auth.validator.js
│   ├── donation.validator.js
│   └── [other validators]
├── templates/          # Email templates
│   ├── welcome.html
│   └── [other templates]
├── uploads/            # Upload directory (created at runtime)
├── app.js              # Express app configuration
├── server.js           # Server entry point
└── package.json        # Dependencies
```

## Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm start          # Start production server
npm run lint       # Run ESLint
```

## Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=portionbridge

# JWT
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@portionbridge.com

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Trust Proxy (if behind load balancer)
TRUST_PROXY=
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/verify-email` - Verify email address

### Donations (Donor)
- `POST /api/v1/donations` - Create donation
- `GET /api/v1/donations/my-history` - Get donor's donation history
- `GET /api/v1/donations/my-history/summary` - Get donor statistics
- `DELETE /api/v1/donations/:id` - Cancel donation
- `GET /api/v1/donations/:id` - Get donation details

### Donations (Volunteer)
- `GET /api/v1/donations/browse` - Browse available donations
- `POST /api/v1/donations/:id/accept` - Accept donation
- `POST /api/v1/donations/:id/schedule` - Schedule pickup
- `POST /api/v1/donations/:id/on-the-way` - Mark as on the way
- `POST /api/v1/donations/:id/picked-up` - Mark as picked up
- `POST /api/v1/donations/:id/complete` - Complete donation
- `GET /api/v1/donations/assigned-history` - Get assigned donations
- `GET /api/v1/donations/assigned-history/summary` - Get volunteer statistics

### Profile
- `GET /api/v1/profile` - Get complete profile
- `PATCH /api/v1/profile` - Update profile
- `POST /api/v1/profile/change-password` - Change password
- `POST /api/v1/profile/update-email` - Update email
- `POST /api/v1/profile/update-phone` - Update phone
- `PATCH /api/v1/profile/preferences` - Update donor preferences
- `PATCH /api/v1/profile/volunteer` - Update volunteer profile
- `GET /api/v1/profile/notifications` - Get notification settings
- `PATCH /api/v1/profile/notifications` - Update notification settings

### Uploads
- `POST /api/v1/uploads/donation/:id/image` - Upload donation image
- `POST /api/v1/uploads/profile/photo` - Upload profile photo

### Master Data
- `GET /api/v1/master/all` - Get all master data
- `GET /api/v1/master/donation-types` - Get donation types
- `GET /api/v1/master/food-types` - Get food types
- `GET /api/v1/master/quantity-units` - Get quantity units
- [Other master data endpoints]

## Socket.IO Events

### Connection
- `connection` - Client connects
- `disconnect` - Client disconnects

### Authentication
- `authenticate` - Client sends JWT token
- `authenticated` - Server confirms authentication

### Donations
- `donation:created` - New donation created
- `donation:accepted` - Donation accepted by volunteer
- `donation:scheduled` - Pickup scheduled
- `donation:on-the-way` - Volunteer on the way
- `donation:picked-up` - Donation picked up
- `donation:completed` - Donation completed
- `donation:cancelled` - Donation cancelled

See `docs/socketEvents.md` for complete event documentation.

## Security Features

- **JWT Authentication** - Token-based authentication with refresh tokens
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Process-local rate limiting per IP
- **CORS** - Configurable CORS policy
- **Helmet** - Security headers
- **Input Validation** - express-validator for all inputs
- **SQL Injection Prevention** - Parameterized queries
- **XSS Prevention** - Input sanitization
- **Audit Logging** - All sensitive actions logged

## Database

### Connection
The server uses a connection pool managed by mysql2. Connection details are configured via environment variables.

### Migrations
Database migrations are located in the `database/` directory at the project root. Run them in order:
1. `portionbridge_schema.sql` - Base schema
2. `migration_002_*.sql` through `migration_011_*.sql` - Feature migrations

### Models
Models use raw SQL queries with parameterized statements. Each model file contains:
- CRUD operations
- Transaction-safe operations
- Dynamic WHERE clause builders
- Pagination support

## File Uploads

- **Directory:** `uploads/` (created at runtime)
- **Max Size:** 5MB per file
- **Allowed Types:** JPEG, PNG, WebP
- **Storage:** Local filesystem (can be extended to S3/cloud storage)

## API Documentation

### Swagger UI
When `NODE_ENV !== 'production'`, Swagger UI is available at:
```
http://localhost:5000/api-docs
```

The OpenAPI specification is hand-written in `docs/openapi.js` and should be updated when API changes are made.

### Socket.IO Documentation
See `docs/socketEvents.md` for complete Socket.IO event documentation.

## Development

The development server runs on `http://localhost:5000` with:
- Hot reload via nodemon
- Detailed HTTP logging (morgan)
- Swagger UI available
- Error stack traces in responses

## Production

### Environment
Set `NODE_ENV=production` to:
- Disable Swagger UI
- Disable detailed error logging
- Enforce HTTPS-only CORS origins
- Enable production-specific optimizations

### Reverse Proxy
If behind a load balancer, set `TRUST_PROXY` to the number of proxy hops.

### Rate Limiting
Current implementation is process-local (in-memory). For horizontal scaling, implement a shared store like Redis.

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors */ }
}
```

Custom errors extend `AppError` class with proper HTTP status codes.

## Logging

- **HTTP Requests:** morgan (dev mode only)
- **Audit Logs:** Sensitive actions logged to database
- **Error Logs:** Console with stack traces (dev mode only)

## Testing

To test the API:
1. Start the server: `npm run dev`
2. Use Swagger UI at `/api-docs`
3. Or use curl/Postman with JWT tokens

## Contributing

Follow the existing code patterns:
- MVC architecture
- Async/await for async operations
- Transaction-safe database operations
- Consistent error handling
- Update documentation when adding features

## License

MIT License - See LICENSE file in project root
