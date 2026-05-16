const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikasi)' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} tidak ditemukan` });
};

module.exports = { errorHandler, notFound };
