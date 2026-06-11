const express = require('express');
const router = express.Router();
const weightController = require('./weight.controller');
const auth = require('../../middleware/auth');

router.get('/', auth, weightController.getWeights);
router.post('/', auth, weightController.addWeight);
router.put('/:id', auth, weightController.updateWeight);
router.delete('/:id', auth, weightController.deleteWeight);

module.exports = router;
