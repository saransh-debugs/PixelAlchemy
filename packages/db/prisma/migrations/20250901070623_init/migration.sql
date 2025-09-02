-- CreateEnum
CREATE TYPE "public"."ModelTrainingStatusEnum" AS ENUM ('Pending', 'Generated', 'Failed');

-- CreateEnum
CREATE TYPE "public"."OutputImagesEnum" AS ENUM ('Pending', 'Generated', 'Failed');

-- CreateEnum
CREATE TYPE "public"."ModelTypeEnum" AS ENUM ('Man', 'Woman', 'Other');

-- CreateEnum
CREATE TYPE "public"."EthenecityEnum" AS ENUM ('White', 'Black', 'Asian_American', 'East_Asian', 'South_East_Asian', 'South_Asian', 'Middle_Eastern', 'Pacific', 'Hispanic');

-- CreateEnum
CREATE TYPE "public"."EyeColorEnum" AS ENUM ('Brown', 'Blue', 'Hazel', 'Gray');

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('basic', 'premium');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ModelTypeEnum" NOT NULL,
    "age" INTEGER NOT NULL,
    "ethinicity" "public"."EthenecityEnum" NOT NULL,
    "eyeColor" "public"."EyeColorEnum" NOT NULL,
    "bald" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "triggerWord" TEXT,
    "tensorPath" TEXT,
    "thumbnail" TEXT,
    "trainingStatus" "public"."ModelTrainingStatusEnum" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "falAiRequestId" TEXT,
    "zipUrl" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutputImages" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "falAiRequestId" TEXT,
    "status" "public"."OutputImagesEnum" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutputImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl1" TEXT NOT NULL DEFAULT '',
    "imageUrl2" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackPrompts" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "packId" TEXT NOT NULL,

    CONSTRAINT "PackPrompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."PlanType" NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "plan" "public"."PlanType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Model_falAiRequestId_idx" ON "public"."Model"("falAiRequestId");

-- CreateIndex
CREATE INDEX "OutputImages_falAiRequestId_idx" ON "public"."OutputImages"("falAiRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredit_userId_key" ON "public"."UserCredit"("userId");

-- CreateIndex
CREATE INDEX "UserCredit_userId_idx" ON "public"."UserCredit"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "public"."Transaction"("userId");

-- AddForeignKey
ALTER TABLE "public"."OutputImages" ADD CONSTRAINT "OutputImages_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackPrompts" ADD CONSTRAINT "PackPrompts_packId_fkey" FOREIGN KEY ("packId") REFERENCES "public"."Packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
