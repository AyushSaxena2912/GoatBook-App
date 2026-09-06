const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../../middleware/auth');

const bulkAnimalsController = require('./bulkAnimals.controller');
const bulkBreedingController = require('./bulkBreeding.controller');
const bulkMatingController = require('./bulkMating.controller');
const bulkWeightController = require('./bulkWeight.controller');
const bulkVaccinationController = require('./bulkVaccination.controller');

// Multer in-memory storage for handling uploaded Excel files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

// ANIMALS BULK ROUTES
router.get('/animals/template', auth, bulkAnimalsController.downloadAnimalTemplate);
router.get('/animals/export', auth, bulkAnimalsController.exportAnimals);
router.post('/animals/validate', auth, upload.single('file'), bulkAnimalsController.validateAnimalsImport);
router.post('/animals/import', auth, upload.single('file'), bulkAnimalsController.importAnimals);

// BREEDING BULK ROUTES
router.get('/breeding/template', auth, bulkBreedingController.downloadBreedingTemplate);
router.get('/breeding/export', auth, bulkBreedingController.exportBreedings);
router.post('/breeding/validate', auth, upload.single('file'), bulkBreedingController.validateBreedingsImport);
router.post('/breeding/import', auth, upload.single('file'), bulkBreedingController.importBreedings);

// MATING BULK ROUTES
router.get('/mating/template', auth, bulkMatingController.downloadMatingTemplate);
router.get('/mating/export', auth, bulkMatingController.exportMatings);
router.post('/mating/validate', auth, upload.single('file'), bulkMatingController.validateMatingsImport);
router.post('/mating/import', auth, upload.single('file'), bulkMatingController.importMatings);

// WEIGHT BULK ROUTES
router.get('/weight/template', auth, bulkWeightController.downloadWeightTemplate);
router.get('/weight/export', auth, bulkWeightController.exportWeights);
router.post('/weight/validate', auth, upload.single('file'), bulkWeightController.validateWeightsImport);
router.post('/weight/import', auth, upload.single('file'), bulkWeightController.importWeights);

// VACCINATION BULK ROUTES
router.get('/vaccination/template', auth, bulkVaccinationController.downloadVaccinationTemplate);
router.get('/vaccination/export', auth, bulkVaccinationController.exportVaccinations);
router.post('/vaccination/validate', auth, upload.single('file'), bulkVaccinationController.validateVaccinationsImport);
router.post('/vaccination/import', auth, upload.single('file'), bulkVaccinationController.importVaccinations);

module.exports = router;
