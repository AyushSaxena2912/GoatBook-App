const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get financial history/transactions for a specific animal
// @route   GET /api/animal-transactions/:animalId
exports.getTransactions = async (req, res) => {
  try {
    const { animalId } = req.params;
    // Fetch all transaction records linked to this animal, ordered by date
    const transactions = await prisma.animal_transactions.findMany({
      where: { animal_id: animalId },
      orderBy: { created_at: 'desc' }
    });

    // Transform database records (snake_case) to API standard (camelCase)
    res.json(transactions.map(t => ({
      id: t.id,
      animalId: t.animal_id,
      tagNumber: t.tag_number,
      teethStage: t.teeth_stage,
      purchaseWeight: t.purchase_weight,
      purchaseRate: t.purchase_rate,
      purchaseDate: t.purchase_date,
      landingCost: t.landing_cost,
      weightDifference: t.weight_difference,
      saleDate: t.sale_date,
      saleRate: t.sale_rate,
      saleWeight: t.sale_weight,
      stayDays: t.stay_days,
      perDayExpense: t.per_day_expense,
      totalExpense: t.total_expense,
      costOfGoat: t.cost_of_goat,
      salePrice: t.sale_price,
      discount: t.discount,
      netSalePrice: t.net_sale_price,
      profitLoss: t.profit_loss,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    })));
  } catch (err) {
    console.error('GET TRANSACTIONS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Record a new buy/sell transaction for an animal
// @route   POST /api/animal-transactions
exports.createTransaction = async (req, res) => {
  const { 
    animalId, tagNumber, teethStage, purchaseWeight, purchaseRate, purchaseDate, 
    landingCost, weightDifference, saleDate, saleRate, saleWeight, stayDays, 
    perDayExpense, totalExpense, costOfGoat, salePrice, discount, netSalePrice, profitLoss 
  } = req.body;

  try {
    // 1. Verify the animal exists before creating a transaction
    const animal = await prisma.animals.findUnique({ where: { id: animalId } });
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // 2. Create the transaction record (linking to animal_id)
    const transaction = await prisma.animal_transactions.create({
      data: {
        id: uuidv4(),
        animal_id: animalId,
        tag_number: tagNumber || animal.tag_number, // Default to animal's current tag if not provided
        teeth_stage: teethStage,
        purchase_weight: purchaseWeight,
        purchase_rate: purchaseRate,
        purchase_date: purchaseDate ? new Date(purchaseDate) : null,
        landing_cost: landingCost,
        weight_difference: weightDifference,
        sale_date: saleDate ? new Date(saleDate) : null,
        sale_rate: saleRate,
        sale_weight: saleWeight,
        stay_days: stayDays,
        per_day_expense: perDayExpense,
        total_expense: totalExpense,
        cost_of_goat: costOfGoat,
        sale_price: salePrice,
        discount: discount,
        net_sale_price: netSalePrice,
        profit_loss: profitLoss
      }
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('CREATE TRANSACTION ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
