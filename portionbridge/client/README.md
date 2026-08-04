# PortionBridge - Frontend

React frontend for the PortionBridge Food & Clothes Donation Coordination Platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Icon library
- **Axios** - HTTP client for API calls
- **Socket.io-client** - Real-time communication

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Common UI components (Modal, Button, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   │   ├── donor/      # Donor dashboard components
│   │   ├── volunteer/  # Volunteer dashboard components
│   │   └── admin/      # Admin dashboard components
│   └── donation/       # Donation form and management components
├── context/            # React Context providers
│   ├── AuthContext.jsx # Authentication state
│   └── SocketContext.jsx # WebSocket connection
├── pages/              # Page components
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DonationFormPage.jsx
│   ├── MyDonationsPage.jsx
│   ├── DonationDetailsPage.jsx
│   └── [Dashboard pages]
├── services/           # API service layer
│   └── donationApi.js  # Donation-related API calls
├── utils/              # Utility functions
└── index.css           # Global styles
```

## Features Implemented

### Authentication
- Login with email/password
- Registration with profile photo
- Password reset flow
- JWT token management
- Protected routes

### Donor Module
- Multi-step donation form (5 steps)
- Food and clothing categories
- Image upload with progress tracking
- Local storage draft management
- Donation management (card/table views)
- Search, filter, and sort
- Status tracking timeline
- Volunteer information display
- Activity history

### Dashboard
- Donor dashboard with statistics
- Quick actions navigation
- Responsive layout
- Dark mode support

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Development

The development server runs on `http://localhost:5173`

Hot Module Replacement (HMR) is enabled for fast development.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## ESLint

This project uses ESLint for code quality. Run `npm run lint` to check for issues.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
