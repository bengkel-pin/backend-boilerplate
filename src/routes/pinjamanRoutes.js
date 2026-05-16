const express = require('express');
const router = express.Router();
const { getPinjaman, getPinjamanByKaryawan, createPinjaman, deletePinjaman } = require('../controllers/pinjamanController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getPinjaman);
router.get('/karyawan/:karyawanId', getPinjamanByKaryawan);
router.post('/', authorize('ADMIN', 'MANAGER'), createPinjaman);
router.delete('/:id', authorize('ADMIN'), deletePinjaman);

module.exports = router;
