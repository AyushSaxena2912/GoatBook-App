const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const auth = require('../middleware/auth');

router.get('/', auth, animalController.getAnimals);
router.post('/', auth, animalController.addAnimal);
router.get('/:id', auth, animalController.getAnimal);
router.get('/check-tag/:tagNumber', auth, animalController.checkTagExists);
router.post('/replace-tag', auth, animalController.replaceTag);
router.put('/:id', auth, animalController.updateAnimal);
router.delete('/:id', auth, animalController.deleteAnimal);

module.exports = router;
