const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

// Hitung komponen gaji berdasarkan absensi dan pinjaman dalam periode
const hitungGaji = async (karyawanId, periodeAwal, periodeAkhir) => {
  const start = new Date(periodeAwal);
  const end   = new Date(periodeAkhir);
  // end inclusive: tambah 1 hari agar query <= periodeAkhir
  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const [karyawan, absensiRows, pinjamanRows] = await Promise.all([
    prisma.karyawan.findUnique({ where: { id: karyawanId } }),
    prisma.absensi.findMany({
      where: { karyawanId, tanggal: { gte: start, lt: endExclusive } },
    }),
    prisma.pinjaman.findMany({
      where: { karyawanId, tanggal: { gte: start, lt: endExclusive } },
    }),
  ]);

  if (!karyawan) return null;

  const gajiPokok      = Number(karyawan.gajiPokok);
  const jumlahJamKerja = absensiRows.reduce((sum, a) => sum + (a.jamKerja || 0), 0);
  // 1 hari = 8 jam; parsial proporsional
  const jumlahHariKerja = jumlahJamKerja / 8;

  let total = 0;
  if (karyawan.sistemUpah === 'HARIAN') {
    total = gajiPokok * jumlahHariKerja;
  } else {
    // BULANAN: gaji tetap, tidak dipotong absensi
    total = gajiPokok;
  }

  const pinjaman = pinjamanRows.reduce((sum, p) => sum + Number(p.jumlah), 0);
  const sisa     = total - pinjaman;

  return {
    karyawanId,
    namaKaryawan:    karyawan.nama,
    sistemUpah:      karyawan.sistemUpah,
    gajiPokok,
    jumlahHariKerja: Math.round(jumlahHariKerja * 100) / 100,
    jumlahJamKerja,
    total:           Math.round(total * 100) / 100,
    pinjaman,
    sisa:            Math.round(sisa * 100) / 100,
    detailAbsensi: {
      totalHadir:   absensiRows.filter(a => a.status === 'HADIR').length,
      totalCuti:    absensiRows.filter(a => a.status === 'CUTI').length,
      totalParsial: absensiRows.filter(a => a.status === 'PARSIAL').length,
    },
  };
};

// GET /pembayaran-gaji/preview?karyawanId=&periodeAwal=&periodeAkhir=
const preview = async (req, res, next) => {
  try {
    const { karyawanId, periodeAwal, periodeAkhir } = req.query;
    if (!karyawanId || !periodeAwal || !periodeAkhir) {
      return res.status(400).json({ success: false, message: 'karyawanId, periodeAwal, dan periodeAkhir wajib diisi' });
    }

    const hasil = await hitungGaji(karyawanId, periodeAwal, periodeAkhir);
    if (!hasil) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    success(res, { periodeAwal, periodeAkhir, ...hasil }, 'Kalkulasi gaji berhasil');
  } catch (err) {
    next(err);
  }
};

// POST /pembayaran-gaji — simpan pembayaran
const createPembayaran = async (req, res, next) => {
  try {
    const { karyawanId, periodeAwal, periodeAkhir, metodeBayar, tanggalBayar } = req.body;

    const hasil = await hitungGaji(karyawanId, periodeAwal, periodeAkhir);
    if (!hasil) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    const data = await prisma.pembayaranGaji.create({
      data: {
        periodeAwal:     new Date(periodeAwal),
        periodeAkhir:    new Date(periodeAkhir),
        karyawanId,
        namaKaryawan:    hasil.namaKaryawan,
        gajiPokok:       hasil.gajiPokok,
        jumlahHariKerja: hasil.jumlahHariKerja,
        jumlahJamKerja:  hasil.jumlahJamKerja,
        total:           hasil.total,
        pinjaman:        hasil.pinjaman,
        sisa:            hasil.sisa,
        metodeBayar,
        tanggalBayar:    new Date(tanggalBayar),
      },
    });

    success(res, {
      ...data,
      gajiPokok:       Number(data.gajiPokok),
      jumlahHariKerja: Number(data.jumlahHariKerja),
      total:           Number(data.total),
      pinjaman:        Number(data.pinjaman),
      sisa:            Number(data.sisa),
    }, 'Pembayaran gaji berhasil disimpan', 201);
  } catch (err) {
    next(err);
  }
};

// GET /pembayaran-gaji
const getPembayaran = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, karyawanId, bulan, tahun } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(bulan && tahun && {
        periodeAwal: {
          gte: new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01`),
          lt:  new Date(`${tahun}-${String(parseInt(bulan) + 1).padStart(2, '0')}-01`),
        },
      }),
    };

    const [rows, total] = await Promise.all([
      prisma.pembayaranGaji.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { tanggalBayar: 'desc' },
        include: { karyawan: { select: { id: true, nama: true, sistemUpah: true } } },
      }),
      prisma.pembayaranGaji.count({ where }),
    ]);

    const data = rows.map((r) => ({
      ...r,
      gajiPokok:       Number(r.gajiPokok),
      jumlahHariKerja: Number(r.jumlahHariKerja),
      total:           Number(r.total),
      pinjaman:        Number(r.pinjaman),
      sisa:            Number(r.sisa),
    }));

    paginate(res, data, total, page, limit, 'Data pembayaran gaji berhasil diambil');
  } catch (err) {
    next(err);
  }
};

// GET /pembayaran-gaji/:id
const getPembayaranById = async (req, res, next) => {
  try {
    const row = await prisma.pembayaranGaji.findUnique({
      where: { id: req.params.id },
      include: { karyawan: { select: { id: true, nama: true, sistemUpah: true } } },
    });
    if (!row) return res.status(404).json({ success: false, message: 'Data pembayaran tidak ditemukan' });

    success(res, {
      ...row,
      gajiPokok:       Number(row.gajiPokok),
      jumlahHariKerja: Number(row.jumlahHariKerja),
      total:           Number(row.total),
      pinjaman:        Number(row.pinjaman),
      sisa:            Number(row.sisa),
    }, 'Detail pembayaran gaji berhasil diambil');
  } catch (err) {
    next(err);
  }
};

// DELETE /pembayaran-gaji/:id
const deletePembayaran = async (req, res, next) => {
  try {
    await prisma.pembayaranGaji.delete({ where: { id: req.params.id } });
    success(res, null, 'Data pembayaran gaji berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { preview, createPembayaran, getPembayaran, getPembayaranById, deletePembayaran };
