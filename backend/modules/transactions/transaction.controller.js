const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

const parseSafeDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  const dateStr = String(dateVal).trim();
  if (dateStr === 'Invalid Date' || dateStr === 'Invalid date' || dateStr === '') return null;
  
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  return null;
};

// @desc    Get all transactions for the current farm with summary
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const farmId = req.headers['x-farm-id'] || req.query.farmId;
    if (!farmId) return res.status(400).json({ message: 'Farm ID is required' });

    const { startDate, endDate, category, type } = req.query;

    const where = { farm_id: farmId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    const transactions = await prisma.transactions.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        users_transactions_created_by_user_idTousers: { select: { name: true } },
      }
    });

    // Calculate Summary
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'INCOME') totalIncome += amt;
      else if (t.type === 'EXPENSE') totalExpense += amt;
    });

    const netBalance = totalIncome - totalExpense;

    res.json({
      summary: { totalIncome, totalExpense, netBalance },
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server Error fetching transactions' });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const farmId = req.headers['x-farm-id'];
    if (!farmId) return res.status(400).json({ message: 'Farm ID is required' });

    const { date, category, type, amount, description, receipt_url } = req.body;

    if (!date || !category || !type || amount === undefined) {
      return res.status(400).json({ message: 'Date, category, type, and amount are required' });
    }

    const transactionDate = parseSafeDate(date) || new Date();

    const transaction = await prisma.transactions.create({
      data: {
        id: uuidv4(),
        farm_id: farmId,
        date: transactionDate,
        category,
        type,
        amount: parseFloat(amount),
        description: description || null,
        receipt_url: receipt_url || null,
        created_by_user_id: req.user.id,
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Server Error adding transaction' });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, type, amount, description, receipt_url } = req.body;

    const existingTransaction = await prisma.transactions.findUnique({ where: { id } });
    if (!existingTransaction) return res.status(404).json({ message: 'Transaction not found' });

    const transactionDate = date ? (parseSafeDate(date) || existingTransaction.date) : existingTransaction.date;

    const transaction = await prisma.transactions.update({
      where: { id },
      data: {
        date: transactionDate,
        category: category || existingTransaction.category,
        type: type || existingTransaction.type,
        amount: amount !== undefined ? parseFloat(amount) : existingTransaction.amount,
        description: description !== undefined ? description : existingTransaction.description,
        receipt_url: receipt_url !== undefined ? receipt_url : existingTransaction.receipt_url,
        updated_by_user_id: req.user.id,
      }
    });

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server Error updating transaction' });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.transactions.findUnique({ where: { id } });
    if (!existingTransaction) return res.status(404).json({ message: 'Transaction not found' });

    await prisma.transactions.delete({ where: { id } });

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server Error deleting transaction' });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
};
