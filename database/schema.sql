-- SQL Schema for Real Estate Platform
-- PostgreSQL Database

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "SavedListing" CASCADE;
DROP TABLE IF EXISTS "Listing" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS "ListingStatus" CASCADE;
DROP TYPE IF EXISTS "ListingCategory" CASCADE;
DROP TYPE IF EXISTS "ListingType" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('USER', 'OWNER', 'ADMIN');
CREATE TYPE "ListingType" AS ENUM ('RENT', 'SALE');
CREATE TYPE "ListingCategory" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL');
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- Table: User (Користувачі)
CREATE TABLE "User" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    email         TEXT NOT NULL UNIQUE,
    password      TEXT NOT NULL,
    name          TEXT,
    phone         TEXT,
    avatar        TEXT,
    role          "UserRole" NOT NULL DEFAULT 'USER',
    "ownerVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: Listing (Оголошення нерухомості)
CREATE TABLE "Listing" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    type          "ListingType" NOT NULL,
    category      "ListingCategory" NOT NULL,
    price         DOUBLE PRECISION NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'UAH',
    address       TEXT NOT NULL,
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    area          DOUBLE PRECISION,
    rooms         INTEGER,
    images        TEXT[] DEFAULT ARRAY[]::TEXT[],
    amenities     TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availableFrom" TIMESTAMP,
    "availableTo"   TIMESTAMP,
    status        "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    views         INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "ownerId"     TEXT NOT NULL,
    
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Table: SavedListing (Улюблені оголошення)
CREATE TABLE "SavedListing" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId"      TEXT NOT NULL,
    "listingId"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") 
        REFERENCES "Listing"(id) ON DELETE CASCADE,
    CONSTRAINT "SavedListing_userId_listingId_key" UNIQUE ("userId", "listingId")
);

-- Table: Message (Повідомлення між користувачами)
CREATE TABLE "Message" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    subject       TEXT NOT NULL,
    content       TEXT NOT NULL,
    read          BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "senderId"    TEXT NOT NULL,
    "receiverId"  TEXT NOT NULL,
    "listingId"   TEXT,
    
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") 
        REFERENCES "Listing"(id) ON DELETE SET NULL
);

-- Table: Review (Відгуки та рейтинги)
CREATE TABLE "Review" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    rating        INTEGER NOT NULL, -- 1-5
    comment       TEXT,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "userId"      TEXT NOT NULL,
    "listingId"   TEXT NOT NULL,
    
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") 
        REFERENCES "Listing"(id) ON DELETE CASCADE,
    CONSTRAINT "Review_userId_listingId_key" UNIQUE ("userId", "listingId"),
    CONSTRAINT "Review_rating_check" CHECK (rating >= 1 AND rating <= 5)
);

-- Indexes for User table
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);

-- Indexes for Listing table
CREATE INDEX IF NOT EXISTS "Listing_status_idx" ON "Listing"(status);
CREATE INDEX IF NOT EXISTS "Listing_type_idx" ON "Listing"(type);
CREATE INDEX IF NOT EXISTS "Listing_category_idx" ON "Listing"(category);
CREATE INDEX IF NOT EXISTS "Listing_location_idx" ON "Listing"(latitude, longitude);
CREATE INDEX IF NOT EXISTS "Listing_ownerId_idx" ON "Listing"("ownerId");

-- Indexes for SavedListing table
CREATE INDEX IF NOT EXISTS "SavedListing_userId_idx" ON "SavedListing"("userId");
CREATE INDEX IF NOT EXISTS "SavedListing_listingId_idx" ON "SavedListing"("listingId");

-- Indexes for Message table
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "Message_receiverId_idx" ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS "Message_listingId_idx" ON "Message"("listingId");

-- Indexes for Review table
CREATE INDEX IF NOT EXISTS "Review_listingId_idx" ON "Review"("listingId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_updated_at BEFORE UPDATE ON "Listing"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_updated_at BEFORE UPDATE ON "Review"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE "User" IS 'Користувачі системи (USER, OWNER, ADMIN)';
COMMENT ON TABLE "Listing" IS 'Оголошення нерухомості (оренда/продаж)';
COMMENT ON TABLE "SavedListing" IS 'Улюблені оголошення користувачів';
COMMENT ON TABLE "Message" IS 'Повідомлення між користувачами';
COMMENT ON TABLE "Review" IS 'Відгуки та рейтинги на оголошення';

COMMENT ON COLUMN "User".role IS 'Роль користувача: USER, OWNER, ADMIN';
COMMENT ON COLUMN "User"."ownerVerified" IS 'Чи підтверджено власника адміністратором';
COMMENT ON COLUMN "Listing".type IS 'Тип оголошення: RENT (оренда) або SALE (продаж)';
COMMENT ON COLUMN "Listing".category IS 'Категорія: APARTMENT, HOUSE, COMMERCIAL';
COMMENT ON COLUMN "Listing".status IS 'Статус: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED';
COMMENT ON COLUMN "Review".rating IS 'Рейтинг від 1 до 5';

