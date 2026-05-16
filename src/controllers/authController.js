const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user;

    success(res, { user: userWithoutPassword, accessToken, refreshToken }, 'Login berhasil');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token diperlukan' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    success(res, { accessToken, refreshToken: newRefreshToken }, 'Token diperbarui');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    success(res, userWithoutPassword, 'Data profil berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password lama tidak sesuai' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    success(res, null, 'Password berhasil diubah');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, getMe, changePassword };
