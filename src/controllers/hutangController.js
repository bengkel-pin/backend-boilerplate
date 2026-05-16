const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

const getSaldoHutang = async (karyawanId) => {
  const agg = await prisma.hutangKaryawan.groupBy({
    by: ['jenis'],
    where: { karyawanId },
    _sum: { jumlah: true },
  });
  const totalHutang = Number(agg.find((h) => h.jenis === 'HUTANG')?._sum.jumlah ?? 0);
  const totalBayar = Number(agg.find((h) => h.jenis === 'BAYAR')?._sum.jumlah ?? 0);
  return { totalHutang, totalBayar, saldo: totalHutang - totalBayar };
};

const getHutang = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, karyawanId, jenis } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(karyawanId && { karyawanId }),
      ...(jenis && { jenis }),
    };

    const [rows, total] = await Promise.all([
      prisma.hutangKaryawan.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { tanggal: 'desc' },
        include: { karyawan: { select: { id: true, nama: true } } },
      }),
      prisma.hutangKaryawan.count({ where }),
    ]);

    const data = rows.map((r) => ({ ...r, jumlah: Number(r.jumlah) }));
    paginate(res, data, total, page, limit, 'Data hutang berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getHutangByKaryawan = async (req, res, next) => {
  try {
    const { karyawanId } = req.params;

    const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId }, select: { id: true, nama: true } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    const [rows, saldo] = await Promise.all([
      prisma.hutangKaryawan.findMany({ where: { karyawanId }, orderBy: { tanggal: 'desc' } }),
      getSaldoHutang(karyawanId),
    ]);

    success(res, {
      karyawan,
      ...saldo,
      riwayat: rows.map((r) => ({ ...r, jumlah: Number(r.jumlah) })),
    }, 'Data hutang karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createHutang = async (req, res, next) => {
  try {
    const { tanggal, karyawanId, jenis, jumlah, keterangan, refNoNota } = req.body;

    const karyawan = await prisma.karyawan.findUnique({ where: { id: karyawanId } });
    if (!karyawan) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });

    // Validasi: saldo tidak boleh negatif saat membayar lebih dari hutang
    if (jenis === 'BAYAR') {
      const saldo = await getSaldoHutang(karyawanId);
      if (Number(jumlah) > saldo.saldo) {
        return res.status(400).json({
          success: false,
          message: `Jumlah bayar (${jumlah}) melebihi sisa hutang (${saldo.saldo})`,
        });
      }
    }

    const data = await prisma.hutangKaryawan.create({
      data: { tanggal: new Date(tanggal), karyawanId, jenis, jumlah, keterangan, refNoNota },
    });
    success(res, { ...data, jumlah: Number(data.jumlah) }, `${jenis === 'HUTANG' ? 'Hutang' : 'Pembayaran hutang'} berhasil dicatat`, 201);
  } catch (err) {
    next(err);
  }
};

const deleteHutang = async (req, res, next) => {
  try {
    await prisma.hutangKaryawan.delete({ where: { id: req.params.id } });
    success(res, null, 'Data hutang berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getHutang, getHutangByKaryawan, createHutang, deleteHutang };
