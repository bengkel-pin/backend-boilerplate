const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

const getPinjaman = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, karyawanId, metodePembayaran } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(metodePembayaran && { metodePembayaran }),
    };

    const [rows, total] = await Promise.all([
      prisma.pinjaman.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { tanggal: 'desc' },
        include: { karyawan: { select: { id: true, nama: true } } },
      }),
      prisma.pinjaman.count({ where }),
    ]);

    const data = rows.map((r) => ({ ...r, jumlah: Number(r.jumlah) }));
    paginate(res, data, total, page, limit, 'Data pinjaman berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getPinjamanByKaryawan = async (req, res, next) => {
  try {
    const rows = await prisma.pinjaman.findMany({
      where: { karyawanId: req.params.karyawanId },
      orderBy: { tanggal: 'desc' },
    });
    const totalPinjaman = rows.reduce((sum, r) => sum + Number(r.jumlah), 0);
    success(res, { totalPinjaman, data: rows.map((r) => ({ ...r, jumlah: Number(r.jumlah) })) }, 'Pinjaman karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createPinjaman = async (req, res, next) => {
  try {
    const { karyawanId, jumlah, alasanPeminjaman, tanggal, metodePembayaran } = req.body;

    const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    const data = await prisma.pinjaman.create({
      data: { karyawanId, jumlah, alasanPeminjaman, tanggal: new Date(tanggal), metodePembayaran },
    });
    success(res, { ...data, jumlah: Number(data.jumlah) }, 'Pinjaman berhasil dicatat', 201);
  } catch (err) {
    next(err);
  }
};

const deletePinjaman = async (req, res, next) => {
  try {
    await prisma.pinjaman.delete({ where: { id: req.params.id } });
    success(res, null, 'Pinjaman berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPinjaman, getPinjamanByKaryawan, createPinjaman, deletePinjaman };
