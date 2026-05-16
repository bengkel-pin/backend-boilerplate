const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {},
        role ? { role } : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    paginate(res, users, total, page, limit, 'Data user berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    success(res, user, 'Data user berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    success(res, user, 'User berhasil dibuat', 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(email && { email }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, updatedAt: true },
    });
    success(res, user, 'User berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    success(res, null, 'User berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
