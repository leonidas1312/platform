# GitHub OAuth Setup for Rastion Platform

This guide explains how to set up GitHub OAuth authentication for the Rastion platform.

## Overview

The GitHub OAuth integration allows users to sign in to Rastion using their GitHub accounts. When a user signs in with GitHub:

1. They are redirected to GitHub for authorization
2. GitHub redirects back with an authorization code
3. The backend exchanges the code for an access token
4. User profile is fetched from GitHub
5. A corresponding Gitea user is created (if needed)
6. A Gitea access token is generated for platform access
7. User is logged in and redirected to their profile

## Prerequisites

- GitHub account with access to create OAuth Apps
- Rastion platform backend and frontend running
- Gitea instance configured and running

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `Rastion Platform` (or your preferred name)
   - **Homepage URL**: 
     - Development: `http://localhost:8080`
     - Production: `https://rastion.com`
   - **Application description**: `OAuth integration for Rastion optimization platform`
   - **Authorization callback URL**:
     - Development: `http://localhost:4000/api/auth/github/callback`
     - Production: `https://rastion.com/api/auth/github/callback`

4. Click "Register application"
5. Note down the **Client ID** and generate a **Client Secret**

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd backend/backend-server
   cp .env.example .env
   ```

2. Edit the `.env` file and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
   GITHUB_REDIRECT_URI=http://localhost:4000/api/auth/github/callback
   ```

   For production, use:
   ```env
   GITHUB_REDIRECT_URI=https://rastion.com/api/auth/github/callback
   ```

## Step 3: Run Database Migration

The GitHub OAuth integration requires additional database fields. Run the migration:

```bash
cd backend/backend-server
npx knex migrate:latest --knexfile DB_postgres/knexfile.js
```

This will add the following fields to the `users` table:
- `github_id` - GitHub user ID
- `github_username` - GitHub username
- `github_access_token` - GitHub access token
- `created_at` and `updated_at` timestamps

## Step 4: Restart the Backend

Restart the backend server to load the new environment variables:

```bash
cd backend/backend-server
npm start
```

## Step 5: Test the Integration

1. Navigate to the login page: `http://localhost:8080/auth`
2. Click "Sign in with GitHub"
3. Authorize the application on GitHub
4. You should be redirected back and logged in

## Security Considerations

1. **Environment Variables**: Never commit your `.env` file with real credentials
2. **HTTPS in Production**: Always use HTTPS for the callback URL in production
3. **Token Storage**: GitHub access tokens are stored securely in the database
4. **Session Management**: Sessions use HTTP-only cookies for security

## Troubleshooting

### Common Issues

1. **"OAuth callback processing failed"**
   - Check that your GitHub OAuth app callback URL matches the `GITHUB_REDIRECT_URI`
   - Verify that the GitHub Client ID and Secret are correct

2. **"Failed to create user account"**
   - Check that the Gitea admin token is valid
   - Verify that the Gitea instance is accessible from the backend

3. **"Authentication error: oauth_error"**
   - User denied authorization on GitHub
   - Check GitHub OAuth app configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check the backend logs for detailed error messages.

## API Endpoints

The GitHub OAuth integration adds these endpoints:

- `GET /api/auth/github` - Initiates GitHub OAuth flow
- `GET /api/auth/github/callback` - Handles OAuth callback

## Database Schema

New fields added to the `users` table:

```sql
ALTER TABLE users ADD COLUMN github_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN github_username VARCHAR(255);
ALTER TABLE users ADD COLUMN github_access_token TEXT;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

## Frontend Integration

The login page (`frontend_v1/src/pages/AuthPage.tsx`) now includes:
- "Sign in with GitHub" button
- Error handling for OAuth failures
- Automatic redirect after successful authentication

## Production Deployment

For production deployment:

1. Update GitHub OAuth app with production URLs
2. Set production environment variables
3. Ensure HTTPS is configured
4. Update CORS settings if needed
5. Run database migrations on production database

## Support

If you encounter issues with the GitHub OAuth integration, please check:
1. GitHub OAuth app configuration
2. Environment variables
3. Database migration status
4. Backend logs for error details
