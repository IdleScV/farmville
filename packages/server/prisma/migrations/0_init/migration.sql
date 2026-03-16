-- Drop legacy schema if it exists
DROP TABLE IF EXISTS "plots" CASCADE;
DROP TABLE IF EXISTS "crop_types" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 150,
    "toolBelt" JSONB NOT NULL DEFAULT '{"water":2,"fertilizer":2}',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "cropType" TEXT,
    "plantedAt" TIMESTAMP(3),
    "harvestAt" TIMESTAMP(3),
    "fertBoosted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_userId_x_y_key" ON "Plot"("userId", "x", "y");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
