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

// ANIMALS BULK ROUTES
router.get('/animals/template', auth, bulkController.downloadAnimalTemplate);
router.get('/animals/export', auth, bulkController.exportAnimals);
router.post('/animals/validate', auth, upload.single('file'), bulkController.validateAnimalsImport);
router.post('/animals/import', auth, upload.single('file'), bulkController.importAnimals);

// BREEDING BULK ROUTES
router.get('/breeding/template', auth, bulkController.downloadBreedingTemplate);
router.get('/breeding/export', auth, bulkController.exportBreedings);
router.post('/breeding/validate', auth, upload.single('file'), bulkController.validateBreedingsImport);
router.post('/breeding/import', auth, upload.single('file'), bulkController.importBreedings);

// MATING BULK ROUTES
router.get('/mating/template', auth, bulkController.downloadMatingTemplate);
router.get('/mating/export', auth, bulkController.exportMatings);
router.post('/mating/validate', auth, upload.single('file'), bulkController.validateMatingsImport);
router.post('/mating/import', auth, upload.single('file'), bulkController.importMatings);

// WEIGHT BULK ROUTES
router.get('/weight/template', auth, bulkController.downloadWeightTemplate);
router.get('/weight/export', auth, bulkController.exportWeights);
router.post('/weight/validate', auth, upload.single('file'), bulkController.validateWeightsImport);
router.post('/weight/import', auth, upload.single('file'), bulkController.importWeights);

// VACCINATION BULK ROUTES
router.get('/vaccination/template', auth, bulkController.downloadVaccinationTemplate);
router.get('/vaccination/export', auth, bulkController.exportVaccinations);
router.post('/vaccination/validate', auth, upload.single('file'), bulkController.validateVaccinationsImport);
router.post('/vaccination/import', auth, upload.single('file'), bulkController.importVaccinations);

module.exports = router;
