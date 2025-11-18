# Environment Setup Guide

This document explains how to configure environment variables for the MAGSASA-CARD ERP system.

---

## Required Environment Variables

### 1. Database Configuration

**DATABASE_URL**
- **Description**: MySQL database connection string
- **Format**: `mysql://username:password@host:port/database`
- **Example**: `mysql://root:password123@localhost:3306/magsasa_card`
- **Required**: Yes
- **How to get**: Set up a MySQL database and create connection string

### 2. Google AI Studio (KaAni Chatbot)

**GOOGLE_AI_STUDIO_API_KEY**
- **Description**: API key for Google Gemini AI (powers KaAni chatbot)
- **Format**: String (e.g., `AIzaSy...`)
- **Example**: `AIzaSyCJDqYPfJZ5Azfv28TCL9R3__--1LilOO0`
- **Required**: Yes (for KaAni AI features)
- **How to get**: 
  1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Sign in with Google account
  3. Click "Get API Key"
  4. Copy the generated key

### 3. JWT Authentication

**JWT_SECRET**
- **Description**: Secret key for signing JWT tokens
- **Format**: Random string (32+ characters recommended)
- **Example**: `your_super_secret_jwt_key_here_32chars`
- **Required**: Yes
- **How to get**: Generate a random string
  ```bash
  # Using OpenSSL
  openssl rand -base64 32
  
  # Using Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

---

## Optional Environment Variables (Manus Platform)

These variables are automatically provided when deploying on Manus platform. Only configure manually if deploying elsewhere.

### Built-in Forge API

**BUILT_IN_FORGE_API_URL**
- Default: `https://forge-api.manus.im`
- Used for S3 storage, LLM services

**BUILT_IN_FORGE_API_KEY**
- Server-side API key for Forge services

**VITE_FRONTEND_FORGE_API_KEY**
- Frontend API key for Forge services

**VITE_FRONTEND_FORGE_API_URL**
- Frontend Forge API endpoint

### OAuth Configuration

**OAUTH_SERVER_URL**
- OAuth backend server URL

**VITE_OAUTH_PORTAL_URL**
- OAuth login portal URL

**VITE_APP_ID**
- Manus application ID

**OWNER_OPEN_ID**
- Owner's OpenID

**OWNER_NAME**
- Owner's display name

### Analytics

**VITE_ANALYTICS_ENDPOINT**
- Analytics API endpoint

**VITE_ANALYTICS_WEBSITE_ID**
- Website tracking ID

### Application Settings

**VITE_APP_TITLE**
- Application title (default: "MAGSASA-CARD")
- **Note**: Configure via website settings GUI in Manus platform

**VITE_APP_LOGO**
- Application logo path (default: "/logo.png")
- **Note**: Configure via website settings GUI in Manus platform

---

## Setup Instructions

### For Manus Platform Deployment

1. **Database**: Already configured automatically
2. **Google AI Studio**: Add via Manus secrets management
   - Go to Settings → Secrets
   - Add `GOOGLE_AI_STUDIO_API_KEY`
3. **JWT Secret**: Already configured automatically
4. **Other variables**: Automatically injected by platform

### For Local Development

1. **Create `.env` file** in project root:
   ```bash
   touch .env
   ```

2. **Add required variables**:
   ```bash
   DATABASE_URL=mysql://user:password@localhost:3306/magsasa_card
   GOOGLE_AI_STUDIO_API_KEY=your_key_here
   JWT_SECRET=your_secret_here
   VITE_APP_TITLE=MAGSASA-CARD
   VITE_APP_LOGO=/logo.png
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Set up database**:
   ```bash
   pnpm db:push
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

### For External Deployment (AWS, Vercel, etc.)

1. **Set environment variables** in your hosting platform's dashboard
2. **Required minimum**:
   - `DATABASE_URL`
   - `GOOGLE_AI_STUDIO_API_KEY`
   - `JWT_SECRET`
3. **Optional** (if not using Manus services):
   - Configure your own S3 storage
   - Configure your own OAuth provider
   - Set up analytics separately

---

## Security Best Practices

### ✅ DO:
- Use strong random strings for `JWT_SECRET` (32+ characters)
- Store secrets in environment variables, never in code
- Use different secrets for development and production
- Rotate API keys regularly
- Enable SSL/TLS for database connections in production
- Use connection pooling (already configured in `server/db.ts`)

### ❌ DON'T:
- Commit `.env` file to version control (already in `.gitignore`)
- Share API keys in public channels
- Use default or weak secrets in production
- Expose secrets in client-side code
- Hardcode credentials in source files

---

## Troubleshooting

### Database Connection Issues

**Error**: `Can't add new command when connection is in closed state`
- **Solution**: Check `DATABASE_URL` format and credentials
- **Check**: Database server is running and accessible
- **Note**: Connection pooling with retry logic is already implemented

### KaAni AI Not Working

**Error**: `API key not valid`
- **Solution**: Verify `GOOGLE_AI_STUDIO_API_KEY` is correct
- **Check**: API key has not expired or been revoked
- **Test**: Try key in Google AI Studio playground

### Authentication Errors

**Error**: `Invalid token`
- **Solution**: Check `JWT_SECRET` is set and consistent
- **Check**: Secret is the same across all server instances
- **Note**: Changing secret will invalidate all existing sessions

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | MySQL connection string |
| `GOOGLE_AI_STUDIO_API_KEY` | ✅ Yes | - | Google Gemini API key |
| `JWT_SECRET` | ✅ Yes | - | JWT signing secret |
| `VITE_APP_TITLE` | ❌ No | "MAGSASA-CARD" | App title |
| `VITE_APP_LOGO` | ❌ No | "/logo.png" | App logo path |
| `BUILT_IN_FORGE_API_URL` | ❌ No | Auto | Forge API URL |
| `BUILT_IN_FORGE_API_KEY` | ❌ No | Auto | Forge API key |
| `OAUTH_SERVER_URL` | ❌ No | Auto | OAuth server URL |
| `VITE_OAUTH_PORTAL_URL` | ❌ No | Auto | OAuth portal URL |

---

## Getting Help

If you encounter issues with environment configuration:

1. Check this guide thoroughly
2. Verify all required variables are set
3. Check logs for specific error messages
4. Review [README.md](./README.md) for additional context
5. Open an issue on GitHub with error details

---

**Last Updated**: November 2025
