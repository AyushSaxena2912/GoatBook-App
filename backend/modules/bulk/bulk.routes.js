const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkController = require('./bulk.controller');
const auth = require('../../middleware/auth');

// Multer in-memory storage for handling uploaded Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

// Download template for bulk animal import
router.get('/animals/template', auth, bulkController.downloadAnimalTemplate);

// Export farm animals to Excel
router.get('/animals/export', auth, bulkController.exportAnimals);

// Dry-run validate Excel file (returns errors without inserting)
router.post('/animals/validate', auth, upload.single('file'), bulkController.validateAnimalsImport);

// Bulk Import animals from Excel into database
router.post('/animals/import', auth, upload.single('file'), bulkController.importAnimals);

module.exports = router;
