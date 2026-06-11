const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const auth = require('../../middleware/auth');

router.get('/:animalId', auth, transactionController.getTransactions);
router.post('/', auth, transactionController.createTransaction);

module.exports = router;
