-- CreateTable
CREATE TABLE "DesignSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "designUrl" TEXT NOT NULL,
    "garment" TEXT,
    "colors" TEXT,
    "note" TEXT,
    "customerName" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',

    CONSTRAINT "DesignSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignSubmission_status_createdAt_idx" ON "DesignSubmission"("status", "createdAt");
