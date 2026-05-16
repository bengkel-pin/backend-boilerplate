const express = require('express');
const router = express.Router();
const { getKaryawan, getKaryawanById, createKaryawan, updateKaryawan, deleteKaryawan } = require('../controllers/karyawanController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getKaryawan);
router.get('/:id', getKaryawanById);
router.post('/', authorize('ADMIN', 'MANAGER'), createKaryawan);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateKaryawan);
router.delete('/:id', authorize('ADMIN'), deleteKaryawan);

module.exports = router;
