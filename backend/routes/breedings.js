const express = require('express');
const router = express.Router();
const breedingController = require('../controllers/breedingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(breedingController.addBreeding);

router.route('/animal/:animalId')
  .get(breedingController.getBreedingsByAnimal);

router.route('/:id')
  .delete(breedingController.deleteBreeding);

module.exports = router;
