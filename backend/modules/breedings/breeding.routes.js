const express = require('express');
const router = express.Router();
const breedingController = require('./breeding.controller');
const protect = require('../../middleware/auth');

router.use(protect);

router.route('/')
  .get(breedingController.getAllBreedings)
  .post(breedingController.addBreeding);

router.route('/animal/:animalId')
  .get(breedingController.getBreedingsByAnimal);

router.route('/:id')
  .put(breedingController.updateBreeding)
  .delete(breedingController.deleteBreeding);

module.exports = router;
