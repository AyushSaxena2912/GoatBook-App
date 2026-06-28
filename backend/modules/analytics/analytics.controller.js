const prisma = require('../../config/prisma');

// @desc    Get Farm Dashboard Analytics
// @route   GET /api/analytics/dashboard
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const farmId = req.farmId;

    // Fetch all animals for this farm to calculate metrics in memory (fast enough for typical farm sizes, and easier to calculate age-based metrics)
    const allAnimals = await prisma.animals.findMany({
      where: { farm_id: farmId },
      select: {
        id: true,
        status: true,
        gender: true,
        birth_date: true,
        is_breeder: true,
        acquisition_method: true,
      }
    });

    let totalAnimals = 0;
    let breedingDoes = 0;
    let kidsBorn = 0;
    let totalDead = 0;

    let bucksCount = 0;
    let doesCount = 0;
    let kidsCount = 0;

    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    allAnimals.forEach(animal => {
      // Mortality
      if (animal.status === 'DEAD') {
        totalDead++;
      }

      // Total Animals (all statuses — complete farm record)
      totalAnimals++;

      // Live animal stats
      if (animal.status === 'LIVE') {

        // Kids Born (This Year)
        if (animal.acquisition_method === 'BORN' && animal.birth_date && new Date(animal.birth_date) >= startOfYear) {
          kidsBorn++;
        }

        // Determine age
        let isKid = false;
        if (animal.birth_date) {
          const birthDate = new Date(animal.birth_date);
          if (birthDate > sixMonthsAgo) {
            isKid = true;
          }
        }

        if (isKid) {
          kidsCount++;
        } else if (animal.gender === 'FEMALE') {
          doesCount++;
          if (animal.is_breeder) breedingDoes++;
        } else if (animal.gender === 'MALE') {
          bucksCount++;
        }
      }
    });

    const mortalityRate = (totalDead > 0 || totalAnimals > 0) 
      ? ((totalDead / (totalAnimals + totalDead)) * 100).toFixed(1) 
      : 0;

    // If dates are missing, fallback for does/bucks
    if (kidsCount === 0) {
        doesCount = allAnimals.filter(a => a.status === 'LIVE' && a.gender === 'FEMALE').length;
        bucksCount = allAnimals.filter(a => a.status === 'LIVE' && a.gender === 'MALE').length;
    }

    res.json({
      metrics: {
        totalAnimals,
        breedingDoes,
        kidsBorn,
        mortalityRate: `${mortalityRate}%`,
      },
      composition: {
        bucks: bucksCount,
        does: doesCount,
        kids: kidsCount,
      }
    });

  } catch (err) {
    console.error('ANALYTICS ERROR:', err);
    res.status(500).json({ message: 'Server Error fetching analytics' });
  }
};
