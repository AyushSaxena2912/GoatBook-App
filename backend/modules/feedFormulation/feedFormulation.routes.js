const express = require('express');
const router = express.Router();
const { createFormulation, getAllFormulations, getFormulationById, updateFormulation, patchFormulation, deleteFormulation } = require('./feedFormulation.controller');
const auth = require('../../middleware/auth');

router.use(auth);

router.route('/').post(createFormulation);
router.route('/').get(getAllFormulations);
router.route('/:id').get(getFormulationById);
router.route('/:id').put(updateFormulation);
router.route('/:id').patch(patchFormulation);
router.route('/:id').delete(deleteFormulation);
module.exports = router;
