# Phase 1: Authentication & Foundation 🔐

> **Goal**: Build a solid authentication system with user signup, login, and protected routes.

---

## 📋 Current Status

### ✅ Already Set Up

- [x] Next.js 15.5.4 with App Router
- [x] TypeScript
- [x] Tailwind CSS v4
- [x] Dependencies installed:
  - `mongoose` (8.19.1)
  - `bcrypt` (6.0.0)
  - `jsonwebtoken` (9.0.2)
  - `zod` (4.1.12)
  - `clsx` (2.1.1)
  - `tailwind-merge` (3.3.1)
  - `lucide-react` (0.545.0) - for icons
  - `class-variance-authority` (0.7.1) - for component variants
  - `pino` + `pino-pretty` - for logging

### 🚧 To Build (Phase 1 Scope)

Everything below needs to be implemented.

---

## 📁 Phase 1 File Structure

```
wardrobe-app/
│
├── src/
│   ├── app/
│   │   ├── (auth)/                      # Auth route group (no header)
│   │   │   ├── layout.tsx               # ⬜ Centered layout for auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx             # ⬜ Login page
│   │   │   └── signup/
│   │   │       └── page.tsx             # ⬜ Signup page
│   │   │
│   │   ├── (main)/                      # Main app route group (with header)
│   │   │   ├── layout.tsx               # ⬜ Main layout with header
│   │   │   └── dashboard/
│   │   │       └── page.tsx             # ⬜ Protected dashboard
│   │   │
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── signup/
│   │   │       │   └── route.ts         # ⬜ POST /api/auth/signup
│   │   │       ├── login/
│   │   │       │   └── route.ts         # ⬜ POST /api/auth/login
│   │   │       ├── logout/
│   │   │       │   └── route.ts         # ⬜ POST /api/auth/logout
│   │   │       └── me/
│   │   │           └── route.ts         # ⬜ GET /api/auth/me
│   │   │
│   │   ├── layout.tsx                   # ✅ Root layout (already exists)
│   │   └── page.tsx                     # (⬜) Landing page (update)
│   │
│   ├── features/
│   │   └── auth/
│   │       ├── components/
│   │       │   ├── LoginForm.tsx        # ⬜ Login form component
│   │       │   ├── SignupForm.tsx       # ⬜ Signup form component
│   │       │   └── AuthGuard.tsx        # ⬜ Protected route wrapper
│   │       │
│   │       ├── hooks/
│   │       │   └── useAuth.ts           # ⬜ Auth hook
│   │       │
│   │       ├── types/
│   │       │   └── auth.types.ts        # ⬜ Auth TypeScript types
│   │       │
│   │       └── utils/
│   │           ├── jwt.ts               # ⬜ JWT sign/verify functions
│   │           └── password.ts          # ⬜ Password hash/compare
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongodb.ts               # ⬜ MongoDB connection
│   │   │   └── models/
│   │   │       └── User.ts              # ⬜ User Mongoose model
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth-middleware.ts       # ⬜ JWT verification middleware
│   │   │   └── error-handler.ts         # ⬜ API error handler
│   │   │
│   │   ├── validations/
│   │   │   └── auth.schema.ts           # ⬜ Zod validation schemas
│   │   │
│   │   └── utils/
│   │       ├── cn.ts                    # ⬜ className utility
│   │       ├── api-response.ts          # ⬜ Standard API responses
│   │       └── logger.ts                # ⬜ Pino logger setup
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx               # ⬜ Button component
│   │   │   ├── Input.tsx                # ⬜ Input component
│   │   │   ├── Label.tsx                # ⬜ Label component
│   │   │   └── Card.tsx                 # ⬜ Card component
│   │   │
│   │   └── layouts/
│   │       └── Header.tsx               # ⬜ App header/navbar
│   │
│   ├── types/
│   │   └── global.types.ts              # ⬜ Global TypeScript types
│   │
│   └── constants/
│       └── config.ts                    # ⬜ App configuration
│
├── .env.local                           # ⬜ Local environment variables
├── .env.example                         # ⬜ Example environment variables
└── README.md                            # ⬜ Update with setup instructions
```

**Legend**: ✅ Done | ⬜ To Do

---

## 🗂️ Implementation Checklist

### 1️⃣ Foundation Setup

#### Environment Configuration
- [x] Create `.env.example` ✅
- [x] Create `.env.local` with actual values ✅
- [x] Add `.env.local` to `.gitignore` ✅

#### Database Setup
- [x] Create `src/lib/db/mongoose.ts` - MongoDB connection singleton ✅ IMPROVED
- [x] Create `src/lib/db/models/User.ts` - User Mongoose schema ✅ IMPROVED
- [x] Test database connection - `npm run test:db` ✅

### 2️⃣ Core Utilities

#### Helper Functions
- [x] Create `src/lib/utils/cn.ts` - Tailwind className merger ✅
- [x] Create `src/lib/utils/api-response.ts` - Standardized API responses ✅
- [x] Create `src/lib/logger.ts` - Pino logger configuration ✅ IMPROVED

#### Auth Utilities
- [ ] Create `src/features/auth/utils/jwt.ts` - Sign & verify tokens 🔥 NEXT
- [ ] Create `src/lib/validations/auth.schema.ts` - Zod schemas for signup/login 🔥 NEXT
- [ ] ~~Create `src/features/auth/utils/password.ts`~~ - SKIP (User model handles this)

#### Middleware
- [ ] Create `src/lib/middleware/auth-middleware.ts` - Verify JWT from cookies/headers
- [ ] Create `src/lib/middleware/error-handler.ts` - Catch & format errors (optional)

### 3️⃣ UI Components

- [ ] Create `src/components/ui/Button.tsx` - Reusable button with variants
- [ ] Create `src/components/ui/Input.tsx` - Form input field
- [ ] Create `src/components/ui/Label.tsx` - Form label
- [ ] Create `src/components/ui/Card.tsx` - Card container for forms
- [ ] Create `src/components/layouts/Header.tsx` - App navigation header

### 4️⃣ API Routes

- [ ] Create `src/app/api/auth/signup/route.ts`:
  - Validate input with Zod
  - Check if user exists
  - Hash password
  - Create user in DB
  - Generate JWT
  - Set httpOnly cookie
  - Return user data

- [ ] Create `src/app/api/auth/login/route.ts`:
  - Validate input
  - Find user by email
  - Verify password
  - Generate JWT
  - Set httpOnly cookie
  - Return user data

- [ ] Create `src/app/api/auth/logout/route.ts`:
  - Clear auth cookie
  - Return success

- [ ] Create `src/app/api/auth/me/route.ts`:
  - Use auth middleware
  - Get current user from token
  - Return user data

### 5️⃣ Auth Feature

#### Types
- [ ] Create `src/features/auth/types/auth.types.ts`:
  - `User`, `LoginCredentials`, `SignupData`, etc.

#### Components
- [ ] Create `src/features/auth/components/LoginForm.tsx`:
  - Email & password inputs
  - Form validation
  - Submit to `/api/auth/login`
  - Handle errors
  - Redirect on success

- [ ] Create `src/features/auth/components/SignupForm.tsx`:
  - Email, username, password inputs
  - Form validation
  - Submit to `/api/auth/signup`
  - Handle errors
  - Redirect on success

- [ ] Create `src/features/auth/components/AuthGuard.tsx`:
  - Check if user is authenticated
  - Redirect to login if not
  - Show loading state

#### Hooks
- [ ] Create `src/features/auth/hooks/useAuth.ts`:
  - `login()` function
  - `signup()` function
  - `logout()` function
  - `user` state
  - `isLoading` state
  - `isAuthenticated` computed value

### 6️⃣ Pages

#### Auth Pages
- [ ] Create `src/app/(auth)/layout.tsx`:
  - Centered layout
  - No header
  - Clean auth UI

- [ ] Create `src/app/(auth)/login/page.tsx`:
  - Use `LoginForm` component
  - Link to signup page

- [ ] Create `src/app/(auth)/signup/page.tsx`:
  - Use `SignupForm` component
  - Link to login page

#### Main Pages
- [ ] Create `src/app/(main)/layout.tsx`:
  - Include `Header` component
  - Wrap with `AuthGuard`

- [ ] Create `src/app/(main)/dashboard/page.tsx`:
  - Display current user info
  - Welcome message
  - Protected content

- [ ] Update `src/app/page.tsx`:
  - Landing page
  - CTA to signup/login
  - Redirect to dashboard if authenticated

### 7️⃣ Global Config

- [ ] Create `src/types/global.types.ts` - Global types
- [ ] Create `src/constants/config.ts` - App-wide constants

### 8️⃣ Testing

- [ ] Test signup flow (new user)
- [ ] Test login flow (existing user)
- [ ] Test wrong password
- [ ] Test duplicate email
- [ ] Test protected dashboard (logged in)
- [ ] Test protected dashboard (logged out → redirect)
- [ ] Test logout
- [ ] Test session persistence (refresh page)

---

## 🔐 User Model Schema

```typescript
// src/lib/db/models/User.ts
import mongoose from 'mongoose';

interface IUser {
  email: string;
  username: string;
  password: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
```

---

## 🔑 Authentication Flow

### Signup Flow

```
1. User fills signup form (email, username, password, displayName)
2. Client sends POST to /api/auth/signup
3. Server validates input with Zod
4. Server checks if email/username already exists
5. Server hashes password with bcrypt
6. Server creates user in MongoDB
7. Server generates JWT token
8. Server sets httpOnly cookie with token
9. Server returns user data (without password)
10. Client redirects to dashboard
```

### Login Flow

```
1. User fills login form (email, password)
2. Client sends POST to /api/auth/login
3. Server validates input
4. Server finds user by email
5. Server compares password with bcrypt
6. Server generates JWT token
7. Server sets httpOnly cookie with token
8. Server returns user data (without password)
9. Client redirects to dashboard
```

### Protected Route Flow

```
1. User navigates to /dashboard
2. AuthGuard checks for auth cookie
3. If no cookie, redirect to /login
4. If cookie exists, verify JWT
5. If valid, fetch user data from /api/auth/me
6. If invalid, redirect to /login
7. If valid, show dashboard content
```

### Logout Flow

```
1. User clicks logout button
2. Client sends POST to /api/auth/logout
3. Server clears auth cookie
4. Client clears user state
5. Client redirects to landing page
```

---

## 🛡️ Security Best Practices

### Passwords
- ✅ Minimum 8 characters
- ✅ Hashed with bcrypt (salt rounds: 10)
- ✅ Never return password in API responses

### JWT
- ✅ Stored in httpOnly cookies (not localStorage)
- ✅ Expires in 7 days
- ✅ Signed with secret from environment variable
- ✅ Verified on every protected route

### Validation
- ✅ All inputs validated with Zod on server
- ✅ Email format validation
- ✅ Username: 3-30 characters, alphanumeric
- ✅ Sanitize user inputs

### API
- ✅ Consistent error responses
- ✅ No sensitive data in error messages
- ✅ Rate limiting (for later phases)

---

## 📚 Key Code Snippets

### JWT Utilities

```typescript
// src/features/auth/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};
```

### Password Utilities

```typescript
// src/features/auth/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Zod Validation

```typescript
// src/lib/validations/auth.schema.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

### API Response Helper

```typescript
// src/lib/utils/api-response.ts
import { NextResponse } from 'next/server';

export const apiSuccess = <T>(data: T, message?: string, status = 200) => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
};

export const apiError = (message: string, status = 400, errors?: any) => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
    },
    { status }
  );
};
```

### CN Utility

```typescript
// src/lib/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🎯 Success Criteria

Phase 1 is complete when:

- ✅ User can sign up with email, username, password
- ✅ User can log in with email and password
- ✅ User can log out
- ✅ Dashboard is protected (requires authentication)
- ✅ Session persists on page refresh
- ✅ JWT stored in httpOnly cookies
- ✅ All inputs validated on server
- ✅ Proper error handling and user feedback
- ✅ Clean, reusable UI components
- ✅ TypeScript types for all data

---

## 🚀 Next Steps (Phase 2)

After Phase 1 is complete:

1. Add profile settings page
2. Add wardrobe management (CRUD for clothing items)
3. Image upload functionality
4. Category and color filters

---

## 💡 Tips

- **Start small**: Build one feature at a time
- **Test as you go**: Don't write everything before testing
- **Use the logger**: Pino is already set up, use it for debugging
- **Check the types**: TypeScript will catch many errors early
- **Follow the structure**: Keep files organized in the right folders

---

**Ready to build? Start with the foundation setup! 🏗️**
