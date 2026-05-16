const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

// Normalisasi jam kerja dari status
const resolveJamKerja = (status, jamKerja) => {
  if (status === 'HADIR') return 8;
  if (status === 'CUTI') return 0;
  return jamKerja; // PARSIAL: 1-7
};

const getAbsensi = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, karyawanId, bulan, tahun, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(status && { status }),
      ...(bulan && tahun && {
        tanggal: {
          gte: new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01`),
          lt: new Date(`${tahun}-${String(parseInt(bulan) + 1).padStart(2, '0')}-01`),
        },
      }),
    };

    const [rows, total] = await Promise.all([
      prisma.absensi.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { tanggal: 'desc' },
        include: { karyawan: { select: { id: true, nama: true } } },
      }),
      prisma.absensi.count({ where }),
    ]);

    paginate(res, rows, total, page, limit, 'Data absensi berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createAbsensi = async (req, res, next) => {
  try {
    const { karyawanId, tanggal, status, jamKerja, alasanKetidakhadiran, telatMenit } = req.body;

    if (status === 'PARSIAL' && (!jamKerja || jamKerja < 1 || jamKerja > 7)) {
      return res.status(400).json({ success: false, message: 'Jam kerja wajib diisi 1–7 untuk status PARSIAL' });
    }

    const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    const data = await prisma.absensi.create({
      data: {
        karyawanId,
        tanggal: new Date(tanggal),
        status,
        jamKerja: resolveJamKerja(status, jamKerja),
        alasanKetidakhadiran: status !== 'HADIR' ? alasanKetidakhadiran : null,
        telatMenit: status === 'HADIR' || status === 'PARSIAL' ? telatMenit : null,
      },
    });
    success(res, data, 'Absensi berhasil dicatat', 201);
  } catch (err) {
    next(err);
  }
};

const updateAbsensi = async (req, res, next) => {
  try {
    const { status, jamKerja, alasanKetidakhadiran, telatMenit } = req.body;

    if (status === 'PARSIAL' && (!jamKerja || jamKerja < 1 || jamKerja > 7)) {
      return res.status(400).json({ success: false, message: 'Jam kerja wajib diisi 1–7 untuk status PARSIAL' });
    }

    const existing = await prisma.absensi.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data absensi tidak ditemukan' });

    const data = await prisma.absensi.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status, jamKerja: resolveJamKerja(status, jamKerja) }),
        alasanKetidakhadiran: status === 'HADIR' ? null : alasanKetidakhadiran,
        ...(telatMenit !== undefined && { telatMenit }),
      },
    });
    success(res, data, 'Absensi berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const deleteAbsensi = async (req, res, next) => {
  try {
    await prisma.absensi.delete({ where: { id: req.params.id } });
    success(res, null, 'Absensi berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

// Rekap absensi per karyawan dalam satu bulan
const getRekapAbsensi = async (req, res, next) => {
  try {
    const { karyawanId } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({ success: false, message: 'Parameter bulan dan tahun wajib diisi' });
    }

    const startDate = new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01`);
    const endDate = new Date(`${tahun}-${String(parseInt(bulan) + 1).padStart(2, '0')}-01`);

    const rows = await prisma.absensi.findMany({
      where: { karyawanId, tanggal: { gte: startDate, lt: endDate } },
      orderBy: { tanggal: 'asc' },
    });

    const rekap = {
      totalHadir: rows.filter((r) => r.status === 'HADIR').length,
      totalCuti: rows.filter((r) => r.status === 'CUTI').length,
      totalParsial: rows.filter((r) => r.status === 'PARSIAL').length,
      totalJamKerja: rows.reduce((sum, r) => sum + (r.jamKerja || 0), 0),
      totalTelatMenit: rows.reduce((sum, r) => sum + (r.telatMenit || 0), 0),
      detail: rows,
    };

    success(res, rekap, 'Rekap absensi berhasil diambil');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAbsensi, createAbsensi, updateAbsensi, deleteAbsensi, getRekapAbsensi };
