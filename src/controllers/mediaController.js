const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { success, paginate } = require('../utils/response');

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    const media = await prisma.media.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path.replace(/\\/g, '/'),
        uploadedById: req.user.id,
      },
    });

    success(res, media, 'File berhasil diupload', 201);
  } catch (err) {
    next(err);
  }
};

const getMedia = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = type === 'image'
      ? { mimetype: { startsWith: 'image/' } }
      : type === 'document'
      ? { NOT: { mimetype: { startsWith: 'image/' } } }
      : {};

    const [media, total] = await Promise.all([
      prisma.media.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.media.count({ where }),
    ]);

    paginate(res, media, total, page, limit, 'Data media berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) return res.status(404).json({ success: false, message: 'Media tidak ditemukan' });

    if (fs.existsSync(media.path)) fs.unlinkSync(media.path);
    await prisma.media.delete({ where: { id: req.params.id } });

    success(res, null, 'Media berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile, getMedia, deleteMedia };
