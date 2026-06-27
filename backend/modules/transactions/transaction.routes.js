const express = require('express');
const router = express.Router();
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require('./transaction.controller');
const auth = require('../../middleware/auth');

router.route('/')
  .get(auth, getTransactions)
  .post(auth, addTransaction);

router.route('/:id')
  .put(auth, updateTransaction)
  .delete(auth, deleteTransaction);

module.exports = router;
