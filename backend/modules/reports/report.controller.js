const prisma = require('../../config/prisma');
const { getAnimalAgeInMonths, getKidAgeBucket } = require('../../utils/animalAge');

// @desc    Generate a high-level inventory summary for the farm dashboard
// @route   GET /api/reports/overall
exports.getOverallReport = async (req, res) => {
  try {
    const farmId = req.farmId;
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    // 1. Fetch all animals currently alive in the farm
    const animals = await prisma.animals.findMany({
      where: { farm_id: farmId, status: 'LIVE' },
      select: { gender: true, birth_date: true, age_in_months: true, is_breeder: true, female_condition: true }
    });

    const now = new Date();
    
    // 2. Initial state for the statistics aggregator
    const stats = {
      total: animals.length,
      male: 0,
      female: 0,
      breeder: 0,
      pregnant: 0,
      kids0_3: 0,   // Kids aged 0-3 months
      kids3_6: 0,   // Kids aged 3-6 months
      kids6_9: 0    // Kids aged 6-9 months
    };

    // 3. Process each animal to calculate aggregate counts
    animals.forEach(animal => {
      // Categorize by Gender & Condition
      if (animal.gender === 'MALE') stats.male++;
      if (animal.gender === 'FEMALE') {
        stats.female++;
        if (animal.female_condition === 'PREGNANT') stats.pregnant++;
      }
      
      // Categorize by functional role
      if (animal.is_breeder) stats.breeder++;

      const bucket = getKidAgeBucket(getAnimalAgeInMonths(animal, now));
      if (bucket === '0-3') stats.kids0_3++;
      else if (bucket === '3-6') stats.kids3_6++;
      else if (bucket === '6-9') stats.kids6_9++;
    });

    res.json(stats);
  } catch (err) {
    console.error('REPORT ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
