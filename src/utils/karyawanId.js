const prisma = require('../config/database');

// Generate ID format KRY001, KRY002, ...
// Dibungkus dalam transaksi agar aman dari race condition
const generateKaryawanId = async (tx) => {
  const db = tx || prisma;
  const last = await db.karyawan.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const lastNum = last ? parseInt(last.id.replace('KRY', ''), 10) : 0;
  return `KRY${String(lastNum + 1).padStart(3, '0')}`;
};

module.exports = { generateKaryawanId };
