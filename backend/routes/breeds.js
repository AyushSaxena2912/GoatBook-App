const express = require('express');
const router = express.Router();
const breedController = require('../controllers/breedController');
const auth = require('../middleware/auth');

router.post('/bulk-delete', auth, breedController.bulkDeleteBreeds);
router.get('/', auth, breedController.getBreeds);
router.post('/', auth, breedController.addBreed);
router.put('/:id', auth, breedController.updateBreed);
router.delete('/:id', auth, breedController.deleteBreed);
router.get('/:id/stats', auth, breedController.getBreedStats);

module.exports = router;
