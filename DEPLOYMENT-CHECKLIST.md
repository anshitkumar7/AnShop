# AnShop Deployment Checklist (Simple)

Use this file step-by-step.

## Before Deploy

- [ ] 1. Rotate secrets
  - Change MongoDB password.
  - Change JWT_SECRET.
  - Replace Firebase private key.
  - Reason: old values were used in local files, so rotate for safety.

- [ ] 2. Verify secret files are not committed
  - Backend now ignores `.env.*` and Firebase service account JSON in git.
  - File updated: `anshop-backend/.gitignore`.

- [ ] 3. Set backend production environment variables in hosting dashboard
  - `NODE_ENV=production`
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `CORS_ORIGIN=https://your-frontend-domain.com`

- [ ] 4. Set MongoDB Atlas access
  - Add backend server IP/domain to Network Access.
  - Confirm production DB user has correct password.

- [ ] 5. Configure Firebase/Google auth
  - Add your frontend production domain in Firebase authorized domains.
  - Confirm Google OAuth client matches your frontend domain.

- [ ] 6. Deploy backend
  - Folder: `anshop-backend`
  - Start command: `npm start`
  - Health URL to test: `/health`

- [ ] 7. Deploy frontend
  - Folder: `anshop-frontend` (static hosting)
  - If backend is on another domain, set:
    - `window.__ANSHOP_API_ORIGIN__ = "https://your-backend-domain.com"`
  - If backend is same domain with proxy, keep default.

## After Deploy (Testing)

- [ ] 1. Open backend health URL
  - Should return JSON status ok.

- [ ] 2. Test auth
  - Signup with email/password
  - Login with email/password
  - Google login

- [ ] 3. Test shopping flow
  - Product list and product details
  - Add/remove cart items
  - Checkout and place order
  - View My Orders
  - Wishlist add/remove

- [ ] 4. Test CORS and images
  - No CORS error in browser console.
  - Product images load correctly.

- [ ] 5. Final safety check
  - Keep localhost out of production `CORS_ORIGIN` unless needed.
  - Keep `ALLOW_WITHOUT_DB=false` in production.

## What was already done for you in code

- Added stronger ignore rules for secrets in `anshop-backend/.gitignore`.
- Added backend health endpoint `GET /health` in `anshop-backend/server.js`.
- Updated frontend API config fallback logic in `anshop-frontend/api-config.js`:
  - localhost => backend defaults to `http://localhost:5000`
  - production => defaults to current domain unless override is set.
