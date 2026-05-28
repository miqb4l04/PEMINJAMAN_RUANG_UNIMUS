-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MAHASISWA', 'ADMIN_RT', 'KEPALA_RT', 'GUEST');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('MENUNGGU_RT', 'MENUNGGU_KEPALA', 'DISETUJUI', 'DITOLAK_RT', 'DITOLAK_KEPALA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MAHASISWA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gedung" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,

    CONSTRAINT "Gedung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruang" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "gedungId" INTEGER NOT NULL,
    "lantai" INTEGER NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "fasilitas" TEXT,

    CONSTRAINT "Ruang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ruangId" INTEGER NOT NULL,
    "tanggal" TEXT NOT NULL,
    "waktuMulai" TEXT NOT NULL,
    "waktuSelesai" TEXT NOT NULL,
    "keperluan" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'MENUNGGU_RT',
    "catatanPenolakan" TEXT,
    "catatanPeralihan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Gedung_kode_key" ON "Gedung"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Ruang_kode_key" ON "Ruang"("kode");

-- AddForeignKey
ALTER TABLE "Ruang" ADD CONSTRAINT "Ruang_gedungId_fkey" FOREIGN KEY ("gedungId") REFERENCES "Gedung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ruangId_fkey" FOREIGN KEY ("ruangId") REFERENCES "Ruang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
