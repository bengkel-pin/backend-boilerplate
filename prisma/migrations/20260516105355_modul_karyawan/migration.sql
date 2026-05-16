-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "SistemUpah" AS ENUM ('HARIAN', 'BULANAN');

-- CreateEnum
CREATE TYPE "Departemen" AS ENUM ('TOKO', 'PROYEK');

-- CreateEnum
CREATE TYPE "StatusAbsensi" AS ENUM ('HADIR', 'CUTI', 'PARSIAL');

-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('TUNAI', 'TRANSFER');

-- CreateEnum
CREATE TYPE "JenisHutang" AS ENUM ('HUTANG', 'BAYAR');

-- CreateTable
CREATE TABLE "karyawan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisKelamin" "JenisKelamin" NOT NULL,
    "jabatan" TEXT,
    "nomorHp" TEXT,
    "noRekening" TEXT,
    "alamat" TEXT,
    "sistemUpah" "SistemUpah" NOT NULL,
    "gajiPokok" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_kerja" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "tanggalMulai" DATE NOT NULL,
    "tanggalKeluar" DATE,
    "departemen" "Departemen" NOT NULL,

    CONSTRAINT "riwayat_kerja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusAbsensi" NOT NULL,
    "jamKerja" INTEGER,
    "alasanKetidakhadiran" TEXT,
    "telatMenit" INTEGER,

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinjaman" (
    "id" TEXT NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "alasanPeminjaman" TEXT,
    "tanggal" DATE NOT NULL,
    "metodePembayaran" "MetodePembayaran" NOT NULL,

    CONSTRAINT "pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hutang_karyawan" (
    "id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "jenis" "JenisHutang" NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "keterangan" TEXT,
    "refNoNota" TEXT,

    CONSTRAINT "hutang_karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "absensi_karyawanId_tanggal_key" ON "absensi"("karyawanId", "tanggal");

-- AddForeignKey
ALTER TABLE "riwayat_kerja" ADD CONSTRAINT "riwayat_kerja_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinjaman" ADD CONSTRAINT "pinjaman_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang_karyawan" ADD CONSTRAINT "hutang_karyawan_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
