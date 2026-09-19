const express = require('express');
const router = express.Router();
const farmSettingController = require('./farmSetting.controller');
const auth = require('../../middleware/auth');

router.get('/', auth, farmSettingController.getFarmSettings);
router.put('/', auth, farmSettingController.updateFarmSettings);

module.exports = router;
