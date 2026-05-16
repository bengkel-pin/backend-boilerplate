const express = require('express');
const router = express.Router();
const { getAbsensi, createAbsensi, updateAbsensi, deleteAbsensi, getRekapAbsensi } = require('../controllers/absensiController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAbsensi);
router.get('/rekap/:karyawanId', getRekapAbsensi);
router.post('/', authorize('ADMIN', 'MANAGER'), createAbsensi);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateAbsensi);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteAbsensi);

module.exports = router;
