const prisma = require('../config/database');
const { success } = require('../utils/response');

const getRiwayatByKaryawan = async (req, res, next) => {
  try {
    const { karyawanId } = req.params;
    const data = await prisma.riwayatKerja.findMany({
      where: { karyawanId },
      orderBy: { tanggalMulai: 'desc' },
    });
    success(res, data, 'Riwayat kerja berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createRiwayat = async (req, res, next) => {
  try {
    const { karyawanId, tanggalMulai, departemen } = req.body;

    const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    // Pastikan tidak ada riwayat aktif (tanggalKeluar null) sebelum menambah yang baru
    const activeRiwayat = await prisma.riwayatKerja.findFirst({
      where: { karyawanId, tanggalKeluar: null },
    });
    if (activeRiwayat) {
      return res.status(400).json({
        success: false,
        message: 'Karyawan masih memiliki riwayat aktif. Catat tanggal keluar terlebih dahulu sebelum menambah riwayat baru.',
      });
    }

    const data = await prisma.riwayatKerja.create({ data: { karyawanId, tanggalMulai, departemen } });
    success(res, data, 'Riwayat kerja berhasil ditambahkan', 201);
  } catch (err) {
    next(err);
  }
};

const updateRiwayat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tanggalMulai, tanggalKeluar, departemen } = req.body;

    const existing = await prisma.riwayatKerja.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Riwayat tidak ditemukan' });

    if (tanggalKeluar && new Date(tanggalKeluar) < new Date(existing.tanggalMulai)) {
      return res.status(400).json({ success: false, message: 'Tanggal keluar tidak boleh sebelum tanggal mulai' });
    }

    const data = await prisma.riwayatKerja.update({
      where: { id },
      data: {
        ...(tanggalMulai && { tanggalMulai }),
        ...(tanggalKeluar !== undefined && { tanggalKeluar: tanggalKeluar || null }),
        ...(departemen && { departemen }),
      },
    });
    success(res, data, 'Riwayat kerja berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const deleteRiwayat = async (req, res, next) => {
  try {
    await prisma.riwayatKerja.delete({ where: { id: req.params.id } });
    success(res, null, 'Riwayat kerja berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getRiwayatByKaryawan, createRiwayat, updateRiwayat, deleteRiwayat };
