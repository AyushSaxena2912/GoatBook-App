const express = require('express');
const router = express.Router();
const matingController = require('../controllers/matingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(matingController.addMating);

router.route('/animal/:animalId')
  .get(matingController.getMatingsByAnimal);

router.route('/:id')
  .put(matingController.updateMating)
  .delete(matingController.deleteMating);

module.exports = router;
