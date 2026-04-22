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
client/     React + Vite frontend
server/     Express + Mongoose API
