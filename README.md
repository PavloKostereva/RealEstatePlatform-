# Real Estate Platform

A comprehensive web platform for real estate rental and sales, built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

## Overview

This platform provides a complete solution for managing real estate listings, user interactions, and administrative operations. It features a modern, responsive interface with real-time capabilities for messaging and support communication.

## Features

### User Features

- **Authentication and Registration**: Secure user authentication system with role-based access control
- **User Profile Management**: Edit profile information, avatar, and role settings
- **Listing Management**: Create, edit, and delete property listings with image uploads
- **Advanced Search**: Filter listings by type, category, price range, area, and number of rooms
- **Interactive Map**: Map view with clustering of property listings using Mapbox GL JS
- **Saved Listings**: Save favorite properties to a personal wishlist
- **User Messaging**: Direct messaging system between users
- **Reviews and Ratings**: Submit and view reviews for properties
- **Support Chat**: Real-time support chat with administrators

### Administrator Features

- **Dashboard Analytics**: Platform statistics with visual charts and graphs
- **User Management**: View, manage, and verify user accounts
- **Listing Moderation**: Review, approve, or reject property listings
- **Owner Verification**: Verify and approve owner role requests
- **Support Management**: Manage support conversations with users through an integrated chat interface
- **IBAN Management**: View and export IBAN submissions with date filtering

## Technology Stack

- **Frontend Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with session management
- **Real-time Communication**: Supabase Realtime for live updates
- **Maps Integration**: Mapbox GL JS for interactive mapping
- **Data Visualization**: Recharts for analytics charts
- **File Upload**: Built-in Next.js API routes with file system storage

## Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- npm or pnpm package manager

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Kursova
```

### Step 2: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/real_estate?schema=public"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token-here

# Supabase (for real-time features)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 4: Set Up the Database

Generate Prisma Client and apply migrations:

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate

# Or use db:push for development
npm run db:push
```

### Step 5: Set Up Supabase Tables (for Chat)

If using the support chat feature, execute the following SQL in your Supabase SQL Editor:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_id UUID,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
```

### Step 6: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Kursova/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   ├── chat/         # Chat and messaging endpoints
│   │   ├── listings/     # Listing management endpoints
│   │   └── users/         # User management endpoints
│   ├── [locale]/          # Internationalized routes
│   │   ├── admin/        # Admin dashboard
│   │   ├── profile/       # User profile pages
│   │   ├── listings/     # Listing pages
│   │   └── map/          # Map view
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/            # Admin panel components
│   ├── layout/            # Navigation, footer
│   ├── listings/         # Listing components
│   ├── map/              # Map components
│   ├── profile/          # Profile components
│   └── search/           # Search components
├── lib/                   # Utilities and configuration
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma Client instance
│   └── supabase.ts       # Supabase client configuration
├── prisma/                # Prisma schema
│   └── schema.prisma     # Database models
├── utils/                 # Utility functions
│   └── supabase/         # Supabase client utilities
└── public/                # Static files
    └── uploads/          # Uploaded images
```

## Database Models

- **User**: System users with roles (USER, OWNER, ADMIN)
- **Listing**: Property listings with full details
- **SavedListing**: User saved/favorite listings
- **Message**: Direct messages between users
- **Review**: Property reviews and ratings
- **Conversation**: Support chat conversations (Supabase)
- **Message** (Chat): Support chat messages (Supabase)

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth authentication endpoints

### Listings

- `GET /api/listings` - Get listings with filters (type, category, price, area, rooms)
- `GET /api/listings/[id]` - Get listing details
- `POST /api/listings` - Create new listing
- `PUT /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### User Profile

- `GET /api/users/[id]` - Get user information
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/[id]/verify-owner` - Verify owner role (admin only)

### Saved Listings

- `GET /api/saved` - Get saved listings
- `POST /api/saved/[id]` - Save listing to favorites
- `DELETE /api/saved/[id]` - Remove from saved listings

### Messaging

- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `PUT /api/messages/[id]` - Update message

### Support Chat

- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/messages` - Get messages for conversation
- `POST /api/chat/messages` - Send message
- `PATCH /api/chat/conversations/[id]` - Update conversation status

### Reviews

- `POST /api/reviews` - Create or update review

### Administration

- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/listings` - Get all listings
- `POST /api/admin/listings/[id]/approve` - Approve listing
- `POST /api/admin/listings/[id]/reject` - Reject listing
- `DELETE /api/admin/listings/[id]` - Delete listing (admin)

### File Upload

- `POST /api/upload` - Upload images

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio
```

## Testing

```bash
# Run tests (if configured)
npm test
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in project settings
3. Run database migrations
4. Deploy

### Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

Ensure all environment variables are properly configured in your deployment platform.

## License

MIT

## Author

Kostereva Pavlo
