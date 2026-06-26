# Implementation Plan - Complete CryptWill Website

This plan details the steps required to complete the CryptWill web application, including adding the 5-step onboarding flow for owners, fixing routing/method mismatches, setting up default database configurations, and establishing a verified build.

## User Review Required

> [!IMPORTANT]
> - **Demo Mode Wallet & Payment Bypass**: For smooth verification, the onboarding flow will include:
>   - **Freighter Wallet Backup**: A "Generate Demo Wallet" option in case the Freighter extension is missing in the browser environment.
>   - **Razorpay Payment Bypass**: A "Mock Payment" option for the PRO subscription step to bypass payment gateway keys.
> - **Database Setup**: We will initialize a local PostgreSQL database or configure Prisma schema to connect successfully.

## Open Questions

None at this stage. All requirements map to the PRD specifications.

## Proposed Changes

### Frontend Configurations & Routing

#### [MODIFY] [App.jsx](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/src/App.jsx)
- Import `Onboarding` and `Landing` pages.
- Add `/onboarding` route and protect it with `ProtectedRouteOnboarding` wrapper.
- Map `/` to `<Landing />`.
- Update `ProtectedRoute` to redirect non-onboarded owners to `/onboarding`.

#### [MODIFY] [Login.jsx](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/src/pages/auth/Login.jsx)
- Update login redirection to check `user.isOnboarded` and route to `/onboarding` instead of always `/app` if onboarding is incomplete.

#### [MODIFY] [VerifyOtp.jsx](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/src/pages/auth/VerifyOtp.jsx)
- Update OTP verification success to fetch user profile `/user/profile` and navigate to `/onboarding` if they haven't finished onboarding.

#### [MODIFY] [InstantCheckin.jsx](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/src/pages/public/InstantCheckin.jsx)
- Change checkin API call from `api.post` to `api.get` to match the backend route definition (`router.get('/instant/:token')`).

---

### Onboarding View Creation

#### [NEW] [Onboarding.jsx](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/src/pages/owner/Onboarding.jsx)
- Implement a 5-step animated onboarding wizard:
  - **Step 1**: Personal details form (Date of Birth, Country, Phone Number) using `api.put('/user/profile')`.
  - **Step 2**: KYC Document upload using `api.post('/user/kyc')`. Includes client-side AES-256 encryption using a derived key from the user's email before uploading.
  - **Step 3**: Bank estate declaration form using `api.post('/user/bank-declaration')`.
  - **Step 4**: Subscription Plan card selector (FREE vs PRO). PRO cards will include a simulation mode option.
  - **Step 5**: Freighter Wallet connection using `@stellar/freighter-api` with a manual paste fallback and a mock key generator. Calls `api.post('/user/onboarding-complete')` upon success.

---

### Backend Router Updates

#### [MODIFY] [rulebook.routes.js](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-backend/src/routes/rulebook.routes.js)
- Add `router.put('/', rulebookController.saveRules);` to support the frontend PUT requests sent to `/api/rulebook`.

#### [NEW] [.env](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-backend/.env)
- Generate a `.env` file based on `.env.example`, mapping pool wallet credentials.

#### [NEW] [.env](file:///c:/Users/gracy/.vscode/CryptWill/cryptwill-frontend/.env)
- Create a frontend `.env` mapping `VITE_API_URL=http://localhost:5000/api`.

---

## Verification Plan

### Automated Verification
- Run `npm run build` on the frontend to ensure all pages compile successfully.
- Start the backend server `node src/index.js` and verify it boots up without configuration errors.

### Manual Verification
- Walk through the user registration, OTP entry, 5-step onboarding flow, and dashboard landing to verify all pages work coherently.
