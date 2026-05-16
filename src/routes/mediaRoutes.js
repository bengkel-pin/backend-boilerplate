const express = require('express');
const router = express.Router();
const { uploadFile, getMedia, deleteMedia } = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getMedia);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteMedia);

module.exports = router;
