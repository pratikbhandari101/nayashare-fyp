# NayaShare Startup Investment Platform MVP

A simplified Republic-style MVP where founders list startups and users invest through a wallet and token system. The app uses React, Express, MongoDB, Mongoose, JWT authentication, and eSewa sandbox integration.

## Features

- Register, email verification, login, logout, Google login, and persisted JWT sessions
- Roles for investors and startup founders
- Founders can create, edit, and delete startup profiles
- Public startup marketplace with search and funding filters
- Wallet top-ups through eSewa sandbox in developer mode
- 1 token = NPR 100 with wallet-based investing
- Investor dashboard for investment history
- Founder dashboard for startup funding progress
- Admin panel for startup approval and rejection
- REST API with validation and centralized error handling
- Responsive React UI styled with Tailwind CSS

## Project Structure

```text
client/     React + Vite frontend
server/     Express + Mongoose API
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Configure the backend:

```bash
cp server/.env.example server/.env
```

Update `server/.env` if your MongoDB URI, JWT secret, email credentials, or Google client ID should differ.

3. Configure the frontend:

```bash
cp client/.env.example client/.env
```

4. Start MongoDB locally, or point `MONGO_URI` at MongoDB Atlas.

5. Run the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:5000`.

## Email Verification Setup

NayaShare sends a 6-digit OTP after local registration. For Gmail SMTP:

1. Enable 2-step verification on the Gmail account.
2. Create an app password in your Google account security settings.
3. Set these values in `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="NayaShare <your-gmail-address@gmail.com>"
```

In development, if SMTP is not configured, the backend logs the OTP to the server console and returns it in the API response for testing. Do not rely on that behavior in production.

## Google OAuth Setup

1. Create an OAuth 2.0 Web Client in Google Cloud Console.
2. Add `http://localhost:5173` to authorized JavaScript origins for local development.
3. Add the same client ID to both env files:

```env
# server/.env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# client/.env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Google users are automatically marked as email verified after the backend validates the Google ID token. Profile images are stored locally in `server/uploads` and served from `/uploads`.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/send-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/google`
- `POST /api/auth/google-register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/profile-image`

### Startups

- `GET /api/startups`
- `GET /api/startups/:id`
- `GET /api/startups/founder/mine`
- `POST /api/startups`
- `PUT /api/startups/:id`
- `DELETE /api/startups/:id`

Public startup browsing only includes records with `status: "approved"`. New founder submissions are created with `status: "pending"` until an admin reviews them.

### Admin

- `POST /api/admin/login`
- `GET /api/admin/startups`
- `PUT /api/admin/startups/:id/approve`
- `PUT /api/admin/startups/:id/reject`
- `PUT /api/admin/change-password`

### Investments

- `POST /api/investments`
- `GET /api/investments/me`
- `GET /api/investments/startup/:startupId`

### Payments

- `POST /api/payments/esewa/initiate`
- `GET /api/payments/esewa/success`
- `GET /api/payments/esewa/failure`

## Notes

The wallet and payment flow use eSewa sandbox credentials in developer mode only. No real money is processed by this MVP.

Admin accounts are not created from the frontend. Create them manually in MongoDB with `role: "admin"` and a valid hashed password.
