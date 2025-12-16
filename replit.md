# Be Smart Online Tutorials - Replit Documentation

## Overview

Be Smart Online Tutorials is a web application for a local tutoring service based in Cape Town, South Africa. The platform provides information about tutoring services across multiple subjects (Maths, Physical Sciences, English, Life Sciences, etc.) and includes a contact form for prospective students and parents to reach out.

This is a full-stack TypeScript application built as a single-page application (SPA) with a focus on accessibility, modern design, and user-friendly interactions for the local community.

## User Preferences

Preferred communication style: Simple, everyday language.

## Pending Features / Notes

### Email Notifications (Not Yet Configured)
- **Status:** Email integration (Resend) was offered but declined by user
- **Goal:** Send booking notifications to onlinepresenceimpact@gmail.com when students complete bookings
- **Alternative:** If user wants email notifications in the future, they can either:
  1. Set up the Resend integration through Replit's integration system
  2. Provide a Resend API key or other email service credentials to store as secrets
- **Implementation location:** Would be added to `/api/booking-payments/complete` endpoint in `server/routes.ts`

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing (replacing heavier alternatives like React Router)

**UI Component System:**
- shadcn/ui components built on Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Custom design system following brand colors: Professional Blue (#0a4191), Vibrant Yellow (#f9a825), and Warm Orange (#c97700)
- Typography uses Inter for UI and Poppins for headings (Google Fonts)

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- React Context API for authentication state (AuthContext)
- Local component state with React hooks

**Page Structure:**
The application follows a single-page architecture with all sections on the home page:
- Header with navigation and Google Sign-In
- Hero section with gradient background
- Subjects showcase section
- About section highlighting mission and values
- Contact form section
- Footer with links and contact information

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- Separate entry points for development (`index-dev.ts`) and production (`index-prod.ts`)
- Custom middleware for JSON parsing with raw body capture for webhook support

**Development vs Production:**
- Development mode uses Vite middleware for SSR and HMR
- Production mode serves pre-built static assets from `dist/public`
- Custom logging middleware for API request tracking

**Production Deployment Configuration:**
- Server binds to `0.0.0.0:5000` (required for Replit Autoscale deployments)
- Health check endpoint available at `/health` for deployment monitoring
- Multiple path resolution strategies for `dist/public` directory to ensure compatibility
- Comprehensive error handling and logging in `server/index-prod.ts`
- Promise-based server initialization with error event handling
- Build command: `npm run build` (builds client + bundles server)
- Start command: `npm start` (runs bundled production server from `dist/index.js`)

**API Endpoints:**
- `POST /api/contact` - Submit contact form with Zod validation
- `GET /api/contact/submissions` - Retrieve all submissions (admin/debugging)

**Data Validation:**
- Zod schemas for runtime type validation on API requests
- Integration with Drizzle ORM schema through `drizzle-zod`
- Custom error handling with user-friendly validation messages via `zod-validation-error`

### Data Storage

**Current Implementation:**
- In-memory storage (`MemStorage` class) for contact form submissions
- Simple key-value Map structure with UUID-based IDs
- Submissions stored with timestamp for chronological ordering

**Database Schema (PostgreSQL via Drizzle ORM):**
The application is configured for PostgreSQL but currently uses in-memory storage:

- **users table:** For Supabase authentication integration
  - Fields: id (UUID), email (unique), name
  
- **contact_submissions table:** For contact form data
  - Fields: id (UUID), name, email, subject, message, createdAt (timestamp)

**Migration Strategy:**
- Drizzle Kit configured for PostgreSQL migrations
- Schema defined in `shared/schema.ts` for type sharing between client and server
- Connection via environment variable `DATABASE_URL`

### Authentication & Authorization

**Multi-Role Authentication System:**

1. **Students (Google OAuth via Supabase)**
   - Users click "Student Login" → "Continue with Google" 
   - Supabase handles OAuth flow with Google provider
   - Session state synced via `onAuthStateChange` listener
   - Students can browse tutors and book sessions

2. **Tutors (Email/Password via Supabase)**
   - Strong password requirements: 8-20 characters, uppercase, lowercase, number, special character
   - Tutor registration creates both Supabase auth user and tutor profile in database
   - Password reset functionality via Supabase
   - Tutors must be approved by admin before appearing on the public site

3. **Admin (Server-Side Token Authentication)**
   - Fixed credentials validated server-side (default: Lisa98/Lisa98*#2025)
   - Server issues session token stored in sessionStorage
   - Admin token required in `x-admin-token` header for admin operations
   - Can approve/block tutors, view bookings, and manage pricing

**Protected Routes:**
- `/tutor-dashboard` - Tutor profile management, availability, bookings
- `/admin` - Admin dashboard for managing tutors and bookings

### Tutor Management System

**Tutor Profiles:**
- fullName, email, bio, subjects (array), hourlyRate
- photoUrl, googleMeetUrl for video sessions
- isApproved (default false), isBlocked (default false)

**Availability System:**
- Tutors set available time slots (day, date, startTime, endTime)
- Slots marked as booked after successful payment

### Payment Integration (Yoco) - Pay-First Flow

**Yoco Fixed Payment Links:**
- Uses pre-configured Yoco payment links (not dynamic checkout API)
- Pricing by subject and duration:
  - General Tutoring: R200 (1 hour), R400 (2 hours)
  - Physics: R250 (1 hour), R500 (2 hours)

**Secure Pay-First Flow:**
1. Student selects tutor, subject, and duration in BookingModal
2. Frontend calls `POST /api/booking/create-token` to get server-issued token
3. Server validates subject/hours/amount against allowed pricing configuration
4. Token stored with booking details server-side (expires after 30 minutes)
5. Student redirected to fixed Yoco payment link
6. After payment, student returns to `/payment/success`
7. Student enters contact details (name, email, phone)
8. Frontend calls `POST /api/booking-payments/complete` with token
9. Server validates token, checks availability still unbooked, creates booking
10. Token deleted (one-time use), Google Meet link revealed

**Security Features:**
- Server-side token validation prevents unauthorized booking creation
- Tokens are one-time use (deleted after successful booking)
- Tokens expire after 30 minutes
- Amount/subject/hours validated against fixed pricing server-side
- Availability re-checked before completing booking to prevent double-booking

**Payment Callback URLs:**
- `/payment/success` - Collects student details and completes booking
- `/payment/failure` - Failure page with retry option
- `/payment/cancel` - Cancellation page

**API Endpoints:**
- `POST /api/booking/create-token` - Creates booking token before payment
- `POST /api/booking-payments/complete` - Completes booking after payment with token validation

### External Dependencies

**Third-Party Services:**

1. **Supabase** (`@supabase/supabase-js`)
   - Purpose: Authentication provider (Google OAuth)
   - Configuration: Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
   - Fallback: Creates dummy client if credentials missing

2. **Neon Database** (`@neondatabase/serverless`)
   - Purpose: Serverless PostgreSQL database
   - Configuration: `DATABASE_URL` environment variable
   - Status: Configured but not actively used (in-memory storage currently active)

**UI Libraries:**

1. **Radix UI** (Multiple packages)
   - Purpose: Accessible, unstyled component primitives
   - Components used: Dialog, Dropdown Menu, Avatar, Toast, Tooltip, and many others
   - Choice rationale: Best-in-class accessibility with full keyboard navigation and ARIA support

2. **Tailwind CSS**
   - Purpose: Utility-first CSS framework
   - Customization: Extended with brand colors and custom design tokens
   - Configuration: Custom border radius, spacing, and color variables

**Developer Tools:**

1. **Replit Plugins:**
   - `@replit/vite-plugin-runtime-error-modal`: Development error overlay
   - `@replit/vite-plugin-cartographer`: Code navigation
   - `@replit/vite-plugin-dev-banner`: Development banner
   - Only loaded in development mode within Replit environment

**Form Handling:**

1. **React Hook Form** (`react-hook-form`)
   - Purpose: Form state management with minimal re-renders
   - Integration: Used with `@hookform/resolvers` for Zod schema validation

2. **date-fns**
   - Purpose: Date formatting and manipulation utilities
   - Use case: Timestamp formatting for contact submissions

**Development Dependencies:**

- TypeScript for type safety across frontend and backend
- ESBuild for production bundling
- PostCSS with Autoprefixer for CSS processing
- Drizzle Kit for database migrations