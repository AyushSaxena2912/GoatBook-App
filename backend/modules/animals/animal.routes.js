const express = require('express');
const router = express.Router();
const animalController = require('./animal.controller');
const auth = require('../../middleware/auth');

router.get('/', auth, animalController.getAnimals);
router.post('/', auth, animalController.addAnimal);
router.get('/check-tag/:tagNumber', auth, animalController.checkTagExists);
router.post('/replace-tag', auth, animalController.replaceTag);
router.put('/bulk-location', auth, animalController.updateBulkLocation);
router.delete('/bulk', auth, animalController.deleteAnimalsBulk);
router.get('/:id', auth, animalController.getAnimal);
router.put('/:id', auth, animalController.updateAnimal);
router.delete('/:id', auth, animalController.deleteAnimal);

module.exports = router;
