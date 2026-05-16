const express = require('express');
const router = express.Router();
const { getHutang, getHutangByKaryawan, createHutang, deleteHutang } = require('../controllers/hutangController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getHutang);
router.get('/karyawan/:karyawanId', getHutangByKaryawan);
router.post('/', authorize('ADMIN', 'MANAGER'), createHutang);
router.delete('/:id', authorize('ADMIN'), deleteHutang);

module.exports = router;
