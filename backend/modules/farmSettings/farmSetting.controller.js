const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

const mapSettings = (s) => ({
  id: s.id,
  farmId: s.farm_id,
  units: {
    weight: s.weight_unit,
    height: s.height_unit,
    milk: s.milk_unit
  },
  animalTypes: {
    goat: {
      allowed: s.goat_allowed,
      gestationPeriodDays: s.goat_gestation_period_days,
      femaleKidEmptyMonths: s.goat_female_kid_empty_months,
      adultFemaleEmptyMonths: s.goat_adult_female_empty_months
    },
    sheep: {
      allowed: s.sheep_allowed,
      gestationPeriodDays: s.sheep_gestation_period_days,
      femaleKidEmptyMonths: s.sheep_female_kid_empty_months,
      adultFemaleEmptyMonths: s.sheep_adult_female_empty_months
    }
  },
  updatedAt: s.updated_at
});

// @desc    Get (or lazily create with defaults) the farm's operational settings
// @route   GET /api/farm-settings
exports.getFarmSettings = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    let settings = await prisma.farm_settings.findUnique({ where: { farm_id: req.farmId } });

    if (!settings) {
      const now = new Date();
      settings = await prisma.farm_settings.create({
        data: {
          id: uuidv4(),
          farm_id: req.farmId,
          created_by_user_id: req.user.id,
          created_at: now,
          updated_at: now
        }
      });
    }

    res.json(mapSettings(settings));
  } catch (err) {
    console.error('GET FARM SETTINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update the farm's operational settings (units + per-species breeding config)
// @route   PUT /api/farm-settings
exports.updateFarmSettings = async (req, res) => {
  const { units, animalTypes } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    if (req.employee.employee_type !== 'OWNER') {
      return res.status(403).json({ message: 'Access Denied: Only farm owners can modify farm settings' });
    }

    const goat = animalTypes?.goat || {};
    const sheep = animalTypes?.sheep || {};

    if (animalTypes && goat.allowed === false && sheep.allowed === false) {
      return res.status(400).json({ message: 'At least one animal type must remain allowed' });
    }

    const existing = await prisma.farm_settings.findUnique({ where: { farm_id: req.farmId } });

    const data = {
      weight_unit: units?.weight ?? existing?.weight_unit ?? 'KG',
      height_unit: units?.height ?? existing?.height_unit ?? 'IN',
      milk_unit: units?.milk ?? existing?.milk_unit ?? 'LTR',
      goat_allowed: goat.allowed ?? existing?.goat_allowed ?? true,
      goat_gestation_period_days: goat.gestationPeriodDays ?? existing?.goat_gestation_period_days ?? 150,
      goat_female_kid_empty_months: goat.femaleKidEmptyMonths ?? existing?.goat_female_kid_empty_months ?? 7,
      goat_adult_female_empty_months: goat.adultFemaleEmptyMonths ?? existing?.goat_adult_female_empty_months ?? 5,
      sheep_allowed: sheep.allowed ?? existing?.sheep_allowed ?? true,
      sheep_gestation_period_days: sheep.gestationPeriodDays ?? existing?.sheep_gestation_period_days ?? 150,
      sheep_female_kid_empty_months: sheep.femaleKidEmptyMonths ?? existing?.sheep_female_kid_empty_months ?? 7,
      sheep_adult_female_empty_months: sheep.adultFemaleEmptyMonths ?? existing?.sheep_adult_female_empty_months ?? 5,
      updated_by_user_id: req.user.id,
      updated_at: new Date()
    };

    const settings = await prisma.farm_settings.upsert({
      where: { farm_id: req.farmId },
      update: data,
      create: {
        id: uuidv4(),
        farm_id: req.farmId,
        ...data,
        created_by_user_id: req.user.id,
        created_at: new Date()
      }
    });

    res.json(mapSettings(settings));
  } catch (err) {
    console.error('UPDATE FARM SETTINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
