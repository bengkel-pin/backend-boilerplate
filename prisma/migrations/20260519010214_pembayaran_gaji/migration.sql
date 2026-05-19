-- CreateTable
CREATE TABLE "pembayaran_gaji" (
    "id" TEXT NOT NULL,
    "periodeAwal" DATE NOT NULL,
    "periodeAkhir" DATE NOT NULL,
    "karyawanId" TEXT NOT NULL,
    "namaKaryawan" TEXT NOT NULL,
    "gajiPokok" DECIMAL(15,2) NOT NULL,
    "jumlahHariKerja" DECIMAL(6,2) NOT NULL,
    "jumlahJamKerja" INTEGER NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "pinjaman" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sisa" DECIMAL(15,2) NOT NULL,
    "metodeBayar" "MetodePembayaran" NOT NULL,
    "tanggalBayar" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembayaran_gaji_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pembayaran_gaji" ADD CONSTRAINT "pembayaran_gaji_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
