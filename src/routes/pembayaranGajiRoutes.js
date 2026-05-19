const express = require('express');
const router = express.Router();
const { preview, createPembayaran, getPembayaran, getPembayaranById, deletePembayaran } = require('../controllers/pembayaranGajiController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/preview', authorize('ADMIN', 'MANAGER'), preview);
router.get('/', authorize('ADMIN', 'MANAGER'), getPembayaran);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getPembayaranById);
router.post('/', authorize('ADMIN', 'MANAGER'), createPembayaran);
router.delete('/:id', authorize('ADMIN'), deletePembayaran);

module.exports = router;
