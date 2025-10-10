# Mobile Authentication Setup - Environment Variables

## Required Firebase Environment Variables

Add these to your `.env.local` file:

```env
# Firebase Configuration for Mobile OTP
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

## Firebase Setup Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication
4. Enable Phone authentication provider
5. Configure authorized domains (add your domain)
6. Get the configuration values from Project Settings > General > Your apps
7. Add the values to your `.env.local` file

## Database Migration

Run your database migration to add the new mobile fields:

```sql
-- Add mobile and isMobileVerified columns to users table
ALTER TABLE users ADD COLUMN mobile VARCHAR(15) UNIQUE;
ALTER TABLE users ADD COLUMN is_mobile_verified BOOLEAN DEFAULT FALSE;
```

## Complete User Flow

### 1. Signup Flow
- User enters email, password, and **optionally** mobile number
- Mobile number is stored in database but **not verified** during signup
- User receives email OTP for email verification
- After email verification, user is signed in

### 2. Post-Signin Flow
- System checks if user has mobile number and if it's verified
- If user has mobile but not verified → redirect to `/mobile-auth`
- If user has no mobile → redirect to `/mobile-auth` (optional verification)
- If mobile is already verified → redirect to `/dashboard`

### 3. Mobile Verification Page (`/mobile-auth`)
- **Standalone verification page** - completely separate from signup
- Handles two scenarios:
  - **New mobile**: User can enter a new mobile number
  - **Existing mobile**: Pre-fills if user has unverified mobile in database
- Firebase OTP verification with full error handling
- Updates database with verified mobile number
- Redirects to dashboard after successful verification

### 4. Protected Routes
- Middleware checks mobile verification status
- Users with mobile numbers must have them verified to access protected content
- Automatic redirection to mobile verification if needed

## API Endpoints

- `POST /api/auth/mobile-exists` - Check if mobile number exists
- `POST /api/auth/update-mobile` - Update user's mobile number after Firebase verification
- `GET /api/auth/check-mobile-status` - Check if user needs mobile verification

## Key Components

- `MobileOtpAuth` - **Standalone** mobile verification component
- `MobileVerificationChecker` - Middleware for protected routes
- Mobile auth page at `/mobile-auth` - **Independent verification page**

## Important Notes

- ✅ **Signup and mobile verification are completely separated**
- ✅ **Mobile verification happens on dedicated `/mobile-auth` page**
- ✅ **Users can skip mobile during signup**
- ✅ **Existing users can add mobile numbers anytime**
- ✅ **Firebase handles OTP sending and verification**
- ✅ **Full error handling and validation**