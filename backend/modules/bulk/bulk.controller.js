const bulkAnimalsController = require('./bulkAnimals.controller');
const bulkBreedingController = require('./bulkBreeding.controller');
const bulkMatingController = require('./bulkMating.controller');
const bulkWeightController = require('./bulkWeight.controller');
const bulkVaccinationController = require('./bulkVaccination.controller');
const bulkTreatmentController = require('./bulkTreatment.controller');

module.exports = {
  ...bulkAnimalsController,
  ...bulkBreedingController,
  ...bulkMatingController,
  ...bulkWeightController,
  ...bulkVaccinationController,
  ...bulkTreatmentController
};
