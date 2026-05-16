const express = require('express');
const router = express.Router();
const { getRiwayatByKaryawan, createRiwayat, updateRiwayat, deleteRiwayat } = require('../controllers/riwayatKerjaController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/karyawan/:karyawanId', getRiwayatByKaryawan);
router.post('/', authorize('ADMIN', 'MANAGER'), createRiwayat);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateRiwayat);
router.delete('/:id', authorize('ADMIN'), deleteRiwayat);

module.exports = router;
