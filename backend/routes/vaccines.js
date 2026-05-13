const express = require('express');
const router = express.Router();
const vaccineController = require('../controllers/vaccineController');
const auth = require('../middleware/auth');

// --- Vaccine Definitions ---
router.get('/', auth, vaccineController.getVaccines);
router.get('/upcoming', auth, vaccineController.getUpcomingBoosters);
router.post('/', auth, vaccineController.createVaccine);
router.put('/:id', auth, vaccineController.updateVaccine);
router.delete('/:id', auth, vaccineController.deleteVaccine);

// --- Vaccination Records ---
router.get('/records', auth, vaccineController.getVaccinationRecords);
router.post('/records', auth, vaccineController.createVaccinationRecord);
router.put('/records/:id', auth, vaccineController.updateVaccinationRecord);
router.delete('/records/:id', auth, vaccineController.deleteVaccinationRecord);
router.get('/schedules', auth, vaccineController.getVaccinationSchedules);

module.exports = router;
