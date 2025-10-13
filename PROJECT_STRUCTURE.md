# Digital Wardrobe App - Project Structure

> A Pinterest-style social platform for managing and sharing your wardrobe

## 🎯 Development Phases

### **Phase 1: Authentication & Foundation** ✅ (Current MVP)
Focus on core authentication and basic infrastructure.

### **Phase 2: Wardrobe Management**
Add clothing items management.

### **Phase 3: Outfit Builder**
Create outfit combinations.

### **Phase 4: Social Features**
Add feed, likes, and social interactions.

### **Phase 5: Advanced Features**
Search, collections, comments, follows, etc.

---

## 📁 Phase 1: MVP Structure (Authentication Focus)

```
wardrobe-app/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── signup/
│   │   │       │   └── route.ts
│   │   │       ├── login/
│   │   │       │   └── route.ts
│   │   │       ├── logout/
│   │   │       │   └── route.ts
│   │   │       └── me/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── features/
│   │   └── auth/
│   │       ├── components/
│   │       │   ├── LoginForm.tsx
│   │       │   ├── SignupForm.tsx
│   │       │   └── AuthGuard.tsx
│   │       │
│   │       ├── api/
│   │       │   ├── auth.service.ts
│   │       │   └── auth.controller.ts
│   │       │
│   │       ├── hooks/
│   │       │   └── useAuth.ts
│   │       │
│   │       ├── types/
│   │       │   └── auth.types.ts
│   │       │
│   │       └── utils/
│   │           ├── jwt.ts
│   │           └── password.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongodb.ts
│   │   │   └── models/
│   │   │       └── User.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth-middleware.ts
│   │   │   └── error-handler.ts
│   │   │
│   │   └── utils/
│   │       └── cn.ts                    # className utility
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   └── Card.tsx                 # For forms
│   │   │
│   │   └── layouts/
│   │       └── Header.tsx
│   │
│   ├── types/
│   │   └── global.types.ts
│   │
│   └── constants/
│       └── config.ts
│
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📁 Full Application Structure (All Phases)

```
wardrobe-app/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx               # Auth layout (centered, no header)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (main)/
│   │   │   ├── layout.tsx               # Main app layout (with header/sidebar)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── wardrobe/
│   │   │   │   ├── page.tsx             # All clothing items grid
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx         # Add new item
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # View item details
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx     # Edit item
│   │   │   │
│   │   │   ├── outfits/
│   │   │   │   ├── page.tsx             # All outfits
│   │   │   │   ├── builder/
│   │   │   │   │   └── page.tsx         # Create outfit
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # View outfit
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx     # Edit outfit
│   │   │   │
│   │   │   ├── feed/
│   │   │   │   └── page.tsx             # Social feed
│   │   │   │
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx             # All collections
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── explore/
│   │   │   │   └── page.tsx             # Discover outfits
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx             # Current user profile
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx         # Other users' profiles
│   │   │   │
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── me/
│   │   │   │   │   └── route.ts
│   │   │   │   └── refresh/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── [userId]/
│   │   │   │   │   └── route.ts         # GET user profile
│   │   │   │   └── me/
│   │   │   │       └── route.ts         # PATCH update profile
│   │   │   │
│   │   │   ├── wardrobe/
│   │   │   │   ├── route.ts             # GET all, POST new
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts         # GET, PATCH, DELETE
│   │   │   │
│   │   │   ├── outfits/
│   │   │   │   ├── route.ts             # GET all, POST new
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts         # GET, PATCH, DELETE
│   │   │   │
│   │   │   ├── collections/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── items/
│   │   │   │           └── route.ts     # Add/remove items
│   │   │   │
│   │   │   ├── feed/
│   │   │   │   └── route.ts             # GET paginated feed
│   │   │   │
│   │   │   ├── likes/
│   │   │   │   └── [outfitId]/
│   │   │   │       └── route.ts         # POST like, DELETE unlike
│   │   │   │
│   │   │   ├── comments/
│   │   │   │   ├── [outfitId]/
│   │   │   │   │   └── route.ts         # GET comments, POST comment
│   │   │   │   └── [commentId]/
│   │   │   │       └── route.ts         # DELETE comment
│   │   │   │
│   │   │   ├── follows/
│   │   │   │   └── [userId]/
│   │   │   │       └── route.ts         # POST follow, DELETE unfollow
│   │   │   │
│   │   │   ├── search/
│   │   │   │   └── route.ts             # GET search results
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   └── route.ts             # GET notifications
│   │   │   │
│   │   │   └── upload/
│   │   │       └── route.ts             # POST image upload
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Landing page
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── AuthGuard.tsx
│   │   │   │   └── PasswordInput.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.controller.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── jwt.ts
│   │   │       ├── password.ts
│   │   │       └── validation.ts
│   │   │
│   │   ├── wardrobe/
│   │   │   ├── components/
│   │   │   │   ├── ClothingCard.tsx
│   │   │   │   ├── ClothingGrid.tsx
│   │   │   │   ├── ClothingForm.tsx
│   │   │   │   ├── ClothingDetails.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   ├── ColorFilter.tsx
│   │   │   │   └── ImageUpload.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── wardrobe.service.ts
│   │   │   │   └── wardrobe.controller.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useWardrobe.ts
│   │   │   │   ├── useClothingItem.ts
│   │   │   │   └── useUpload.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── wardrobe.types.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── image-helpers.ts
│   │   │       └── filters.ts
│   │   │
│   │   ├── outfits/
│   │   │   ├── components/
│   │   │   │   ├── OutfitCard.tsx
│   │   │   │   ├── OutfitGrid.tsx
│   │   │   │   ├── OutfitBuilder.tsx
│   │   │   │   ├── OutfitCanvas.tsx        # Drag-drop canvas
│   │   │   │   ├── ClothingSelector.tsx
│   │   │   │   └── OutfitPreview.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── outfits.service.ts
│   │   │   │   └── outfits.controller.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useOutfits.ts
│   │   │   │   ├── useOutfitBuilder.ts
│   │   │   │   └── useOutfitDetails.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── outfit.types.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── outfit-validation.ts
│   │   │       └── canvas-helpers.ts
│   │   │
│   │   ├── social/
│   │   │   ├── components/
│   │   │   │   ├── FeedCard.tsx
│   │   │   │   ├── FeedList.tsx
│   │   │   │   ├── LikeButton.tsx
│   │   │   │   ├── CommentSection.tsx
│   │   │   │   ├── CommentForm.tsx
│   │   │   │   └── FollowButton.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── feed.service.ts
│   │   │   │   ├── likes.service.ts
│   │   │   │   ├── comments.service.ts
│   │   │   │   ├── follows.service.ts
│   │   │   │   └── social.controller.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useFeed.ts
│   │   │   │   ├── useLikes.ts
│   │   │   │   ├── useComments.ts
│   │   │   │   └── useFollows.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── social.types.ts
│   │   │
│   │   ├── collections/
│   │   │   ├── components/
│   │   │   │   ├── CollectionCard.tsx
│   │   │   │   ├── CollectionGrid.tsx
│   │   │   │   ├── CollectionForm.tsx
│   │   │   │   └── AddToCollection.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── collections.service.ts
│   │   │   │   └── collections.controller.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   └── useCollections.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── collection.types.ts
│   │   │
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   └── TagCloud.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   └── search.service.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useSearch.ts
│   │   │   │   └── useFilters.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── search.types.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   │   ├── ProfileHeader.tsx
│   │   │   │   ├── ProfileStats.tsx
│   │   │   │   ├── ProfileTabs.tsx
│   │   │   │   └── EditProfileForm.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   └── profile.service.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   └── useProfile.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── profile.types.ts
│   │   │
│   │   └── notifications/
│   │       ├── components/
│   │       │   ├── NotificationBell.tsx
│   │       │   ├── NotificationList.tsx
│   │       │   └── NotificationItem.tsx
│   │       │
│   │       ├── api/
│   │       │   └── notifications.service.ts
│   │       │
│   │       ├── hooks/
│   │       │   └── useNotifications.ts
│   │       │
│   │       └── types/
│   │           └── notification.types.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongodb.ts
│   │   │   └── models/
│   │   │       ├── User.ts
│   │   │       ├── Clothing.ts
│   │   │       ├── Outfit.ts
│   │   │       ├── Collection.ts
│   │   │       ├── Like.ts
│   │   │       ├── Comment.ts
│   │   │       ├── Follow.ts
│   │   │       └── Notification.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── cloudinary.ts            # Or S3/Vercel Blob
│   │   │   └── upload.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth-middleware.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── validations/
│   │   │   ├── auth.schema.ts
│   │   │   ├── wardrobe.schema.ts
│   │   │   ├── outfit.schema.ts
│   │   │   └── user.schema.ts
│   │   │
│   │   └── utils/
│   │       ├── cn.ts                    # className utility (clsx + tailwind-merge)
│   │       ├── format.ts                # Date/text formatting
│   │       ├── api-response.ts          # Consistent API responses
│   │       └── logger.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── Checkbox.tsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── shared/
│   │       ├── ImageWithFallback.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── InfiniteScroll.tsx
│   │
│   ├── hooks/
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── types/
│   │   ├── global.types.ts
│   │   └── api.types.ts
│   │
│   └── constants/
│       ├── config.ts
│       ├── categories.ts
│       ├── colors.ts
│       ├── routes.ts
│       └── messages.ts
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   └── placeholder.png
│   └── icons/
│
├── __tests__/                           # Optional for later
│   ├── components/
│   ├── features/
│   └── utils/
│
├── .env.local
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
├── README.md
└── PROJECT_STRUCTURE.md
```

---

## 🗄️ MongoDB Schema Design

### User Model
```typescript
{
  _id: ObjectId,
  email: string,
  username: string,
  password: string (hashed),
  displayName: string,
  bio: string?,
  avatar: string?,
  followersCount: number,
  followingCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Clothing Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  category: string,
  color: string[],
  brand: string?,
  size: string?,
  season: string[],
  tags: string[],
  imageUrl: string,
  imagePublicId: string,
  notes: string?,
  createdAt: Date,
  updatedAt: Date
}
```

### Outfit Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  description: string?,
  clothingItems: ObjectId[],
  tags: string[],
  season: string?,
  occasion: string?,
  isPublic: boolean,
  likesCount: number,
  commentsCount: number,
  imageUrl: string?,           // Generated preview
  createdAt: Date,
  updatedAt: Date
}
```

### Collection Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  description: string?,
  outfitIds: ObjectId[],
  isPublic: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Like Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  outfitId: ObjectId,
  createdAt: Date
}
// Compound index on [userId, outfitId]
```

### Comment Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  outfitId: ObjectId,
  text: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Follow Model
```typescript
{
  _id: ObjectId,
  followerId: ObjectId,      // User who follows
  followingId: ObjectId,     // User being followed
  createdAt: Date
}
// Compound index on [followerId, followingId]
```

### Notification Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId,          // Recipient
  actorId: ObjectId,         // Who triggered it
  type: 'like' | 'comment' | 'follow',
  outfitId: ObjectId?,
  isRead: boolean,
  createdAt: Date
}
```

---

## 🔐 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Storage (Choose one)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Or AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Or Vercel Blob
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Key Dependencies

### Core (All Phases)
```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "mongoose": "^8.x",
    "bcrypt": "^6.x",
    "jsonwebtoken": "^9.0.2",
    "zod": "^4.x",
    "clsx": "^2.x",
    "tailwind-merge": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x",
    "@types/bcrypt": "^6.x",
    "@types/jsonwebtoken": "^9.0.x",
    "tailwindcss": "^4.x"
  }
}
```

---

## 🎨 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Styling**: Tailwind CSS
- **Authentication**: JWT
- **Image Storage**: Cloudinary / AWS S3 / Vercel Blob
- **State Management**: React hooks + Context (or Zustand for later)
- **Validation**: Zod
- **UI Components**: Custom + shadcn/ui (optional)

---

## � Development Workflow

1. **Phase 1**: Authentication & Foundation - Get authentication working perfectly
2. **Phase 2**: Wardrobe Management - Add clothing items CRUD operations
3. **Phase 3**: Outfit Builder - Create outfit combinations
4. **Phase 4**: Social Features - Implement feed, likes, and social interactions
5. **Phase 5**: Advanced Features - Search, collections, comments, follows, etc.

**📌 See `PHASE_1.md` for detailed Phase 1 implementation guide.**

---

## 📚 Useful Resources

- [Next.js App Router Docs](https://nextjs.org/docs)
- [MongoDB + Next.js Tutorial](https://www.mongodb.com/developer/languages/javascript/nextjs-with-mongodb/)
- [JWT Best Practices](https://www.npmjs.com/package/jsonwebtoken)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)

---

**Good luck with your MVP!** 🎉
