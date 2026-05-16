const prisma = require('../config/database');
const { generateKaryawanId } = require('../utils/karyawanId');
const { success, paginate } = require('../utils/response');

// Hitung field computed (status, departemen, hutang) untuk satu karyawan
const computeFields = async (karyawanId) => {
  const [latestRiwayat, hutangAgg] = await Promise.all([
    prisma.riwayatKerja.findFirst({
      where: { karyawanId },
      orderBy: { tanggalMulai: 'desc' },
    }),
    prisma.hutangKaryawan.groupBy({
      by: ['jenis'],
      where: { karyawanId },
      _sum: { jumlah: true },
    }),
  ]);

  const statusBekerja = latestRiwayat && !latestRiwayat.tanggalKeluar ? 'AKTIF' : 'NON_AKTIF';
  const departemen = latestRiwayat && !latestRiwayat.tanggalKeluar ? latestRiwayat.departemen : null;

  const totalHutang = Number(hutangAgg.find((h) => h.jenis === 'HUTANG')?._sum.jumlah ?? 0);
  const totalBayar = Number(hutangAgg.find((h) => h.jenis === 'BAYAR')?._sum.jumlah ?? 0);
  const sisaHutang = totalHutang - totalBayar;

  return { statusBekerja, departemen, hutang: sisaHutang < 0 ? 0 : sisaHutang };
};

const getKaryawan = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status, departemen, sistemUpah } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        search ? { OR: [{ nama: { contains: search, mode: 'insensitive' } }, { id: { contains: search, mode: 'insensitive' } }] } : {},
        sistemUpah ? { sistemUpah } : {},
      ],
    };

    const [rows, total] = await Promise.all([
      prisma.karyawan.findMany({ where, skip, take: parseInt(limit), orderBy: { id: 'asc' } }),
      prisma.karyawan.count({ where }),
    ]);

    const data = await Promise.all(
      rows.map(async (k) => {
        const computed = await computeFields(k.id);
        return { ...k, gajiPokok: Number(k.gajiPokok), ...computed };
      })
    );

    // Filter status & departemen di level aplikasi (computed field)
    const filtered = data.filter((k) => {
      if (status && k.statusBekerja !== status) return false;
      if (departemen && k.departemen !== departemen) return false;
      return true;
    });

    paginate(res, filtered, total, page, limit, 'Data karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getKaryawanById = async (req, res, next) => {
  try {
    const karyawan = await prisma.karyawan.findUnique({ where: { id: req.params.id } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    const computed = await computeFields(karyawan.id);
    success(res, { ...karyawan, gajiPokok: Number(karyawan.gajiPokok), ...computed }, 'Detail karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createKaryawan = async (req, res, next) => {
  try {
    const { nama, jenisKelamin, jabatan, nomorHp, noRekening, alamat, sistemUpah, gajiPokok } = req.body;

    const karyawan = await prisma.$transaction(async (tx) => {
      const id = await generateKaryawanId(tx);
      return tx.karyawan.create({ data: { id, nama, jenisKelamin, jabatan, nomorHp, noRekening, alamat, sistemUpah, gajiPokok } });
    });

    success(res, { ...karyawan, gajiPokok: Number(karyawan.gajiPokok) }, 'Karyawan berhasil ditambahkan', 201);
  } catch (err) {
    next(err);
  }
};

const updateKaryawan = async (req, res, next) => {
  try {
    const { nama, jenisKelamin, jabatan, nomorHp, noRekening, alamat, sistemUpah, gajiPokok } = req.body;
    const karyawan = await prisma.karyawan.update({
      where: { id: req.params.id },
      data: { nama, jenisKelamin, jabatan, nomorHp, noRekening, alamat, sistemUpah, gajiPokok },
    });
    success(res, { ...karyawan, gajiPokok: Number(karyawan.gajiPokok) }, 'Data karyawan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const deleteKaryawan = async (req, res, next) => {
  try {
    await prisma.karyawan.delete({ where: { id: req.params.id } });
    success(res, null, 'Karyawan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getKaryawan, getKaryawanById, createKaryawan, updateKaryawan, deleteKaryawan };
