const express = require('express');
const router = express.Router();
const { getFarmDetails, updateFarmDetails } = require('./farm.controller');
const auth = require('../../middleware/auth');

router.get('/current', auth, getFarmDetails);
router.put('/current', auth, updateFarmDetails);

module.exports = router;
