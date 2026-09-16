const express = require('express');
const router = express.Router();
const treatmentController = require('./treatment.controller');
const auth = require('../../middleware/auth');

router.get('/', auth, treatmentController.getAllTreatments);
router.get('/animal/:animalId', auth, treatmentController.getTreatmentsByAnimal);
router.post('/', auth, treatmentController.addTreatment);
router.put('/:id', auth, treatmentController.updateTreatment);
router.delete('/:id', auth, treatmentController.deleteTreatment);

module.exports = router;
