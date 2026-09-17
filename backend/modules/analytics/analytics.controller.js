const prisma = require('../../config/prisma');
const { getAnimalAgeInMonths, getKidAgeBucket } = require('../../utils/animalAge');

// @desc    Get Farm Dashboard Analytics
// @route   GET /api/analytics/dashboard
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const farmId = req.farmId;

    const allAnimals = await prisma.animals.findMany({
      where: { farm_id: farmId },
      select: {
        status: true,
        gender: true,
        birth_date: true,
        age_in_months: true,
        is_breeder: true,
        female_condition: true,
        acquisition_method: true,
        death_date: true,
        sold_at: true,
      },
    });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let liveAnimals = 0;
    let male = 0;
    let female = 0;
    let breeders = 0;
    let pregnant = 0;
    let kids0_3 = 0;
    let kids3_6 = 0;
    let kids6_9 = 0;
    let kidsBornThisYear = 0;
    let deadThisYear = 0;
    let soldThisYear = 0;

    allAnimals.forEach((animal) => {
      if (animal.status === 'DEAD') {
        const diedAt = animal.death_date ? new Date(animal.death_date) : null;
        if (diedAt && diedAt >= startOfYear) deadThisYear++;
      }

      if (animal.status === 'SOLD') {
        const soldAt = animal.sold_at ? new Date(animal.sold_at) : null;
        if (soldAt && soldAt >= startOfYear) soldThisYear++;
      }

      if (animal.status !== 'LIVE') return;

      liveAnimals++;

      if (animal.gender === 'MALE') male++;
      if (animal.gender === 'FEMALE') {
        female++;
        if (animal.female_condition === 'PREGNANT') pregnant++;
      }

      if (animal.is_breeder) breeders++;

      if (animal.acquisition_method === 'BORN' && animal.birth_date && new Date(animal.birth_date) >= startOfYear) {
        kidsBornThisYear++;
      }

      const bucket = getKidAgeBucket(getAnimalAgeInMonths(animal, now));
      if (bucket === '0-3') kids0_3++;
      else if (bucket === '3-6') kids3_6++;
      else if (bucket === '6-9') kids6_9++;
    });

    res.json({
      metrics: {
        liveAnimals,
        male,
        female,
        breeders,
        pregnant,
        kids0_3,
        kids3_6,
        kids6_9,
        kidsBornThisYear,
        deadThisYear,
        soldThisYear,
        // keep old keys so older app builds do not crash
        totalAnimals: liveAnimals,
        breedingDoes: breeders,
        kidsBorn: kidsBornThisYear,
        mortalityRate: String(deadThisYear),
      },
      composition: {
        bucks: male,
        does: female,
        kids: kids0_3 + kids3_6 + kids6_9,
      },
    });
  } catch (err) {
    console.error('ANALYTICS ERROR:', err);
    res.status(500).json({ message: 'Server Error fetching analytics' });
  }
};
