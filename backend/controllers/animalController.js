const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Utility to log errors to a temporary file for debugging
const logError = (error, context) => {
  const logMsg = `\n--- ERROR [${new Date().toISOString()}] ---\nContext: ${context}\nMessage: ${error.message}\nStack: ${error.stack}\n`;
  fs.appendFileSync('/tmp/animal_errors.log', logMsg);
};

// @desc    Get all animals for the current farm
// @route   GET /api/animals
exports.getAnimals = async (req, res) => {
  try {
    // 1. Ensure a farm context exists (provided by auth middleware)
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // 2. Fetch animals linked to this farm with breed and location details
    const animals = await prisma.animals.findMany({
      where: { farm_id: req.farmId },
      include: {
        breeds: { select: { name: true, animal_type: true } },
        locations: { select: { name: true, code: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // 3. Transform database (snake_case) to API standard (camelCase)
    const mapped = animals.map(a => ({
      id: a.id,
      tagNumber: a.tag_number,
      color: a.color,
      breedId: a.breed_id,
      locationId: a.location_id,
      farmId: a.farm_id,
      gender: a.gender,
      birthDate: a.birth_date,
      birthWeight: a.birth_weight,
      animalType: a.animal_type,
      isBreeder: a.is_breeder,
      isQurbani: a.is_qurbani,
      batchNo: a.batch_no,
      motherTagId: a.mother_tag_id,
      fatherTagId: a.father_tag_id,
      acquisitionMethod: a.acquisition_method,
      purchaseDate: a.purchase_date,
      purchasePrice: a.purchase_price,
      ageInMonths: a.age_in_months,
      femaleCondition: a.female_condition,
      birthType: a.birth_type,
      status: a.status,
      isReadyForSale: a.is_ready_for_sale,
      salePrice: a.sale_price,
      currentWeight: a.current_weight,
      remark: a.remark,
      createdByUserId: a.created_by_user_id,
      updatedByUserId: a.updated_by_user_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      Breed: a.breeds ? { name: a.breeds.name, animalType: a.breeds.animal_type } : null,
      Location: a.locations ? { name: a.locations.name, code: a.locations.code } : null
    }));

    res.json(mapped);
  } catch (err) {
    console.error('FETCH ANIMALS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Add a new animal to the farm inventory
// @route   POST /api/animals
exports.addAnimal = async (req, res) => {
  const { 
    tagNumber, breedId, gender, color, birthDate, birthWeight, locationId,
    isBreeder, isQurbani, batchNo, acquisitionMethod,
    purchaseDate, purchasePrice, ageInMonths, femaleCondition,
    birthType, motherTagId, fatherTagId, remark,
    status, isReadyForSale, currentWeight, salePrice 
  } = req.body;
  
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // 1. Security Check: Verify breed is either farm-specific or global
    const breed = await prisma.breeds.findFirst({ 
      where: { 
        id: breedId,
        OR: [{ farm_id: req.farmId }, { is_default: true }]
      } 
    });
    if (!breed) return res.status(400).json({ message: 'Invalid breed selected' });

    // 2. Uniqueness: Tag number must be unique within the same farm
    if (tagNumber) {
        const existingTag = await prisma.animals.findFirst({ 
          where: { tag_number: tagNumber, farm_id: req.farmId } 
        });
        if (existingTag) return res.status(400).json({ message: 'Tag Number already exists in your farm' });
    }

    // 3. Pedigree check: Prevent animal being its own parent
    if (acquisitionMethod === 'BORN') {
        if (motherTagId && motherTagId === tagNumber) return res.status(400).json({ message: 'Mother cannot be the same as animal' });
        if (fatherTagId && fatherTagId === tagNumber) return res.status(400).json({ message: 'Father cannot be the same as animal' });
    }

    // 4. Location check: Verify the shed/location belongs to this user
    if (locationId) {
        const location = await prisma.locations.findFirst({ where: { id: locationId, farm_id: req.farmId } });
        if (!location) return res.status(400).json({ message: 'Invalid location selected' });
    }

    // Business Logic: Only males can be marked as Breeder or Qurbani
    const finalIsBreeder = gender === 'MALE' ? (isBreeder || false) : false;
    const finalIsQurbani = gender === 'MALE' ? (!finalIsBreeder && isQurbani || false) : false;

    const now = new Date();
    // 5. Create the database record
    const animal = await prisma.animals.create({
      data: {
        id: uuidv4(),
        tag_number: tagNumber,
        breed_id: breedId,
        gender,
        color,
        birth_date: birthDate ? new Date(birthDate) : null,
        birth_weight: birthWeight || null,
        location_id: locationId || null,
        farm_id: req.farmId,
        created_by_user_id: req.user.id,
        is_breeder: finalIsBreeder,
        is_qurbani: finalIsQurbani,
        batch_no: batchNo,
        acquisition_method: acquisitionMethod || 'BORN',
        purchase_date: acquisitionMethod === 'PURCHASED' && purchaseDate ? new Date(purchaseDate) : null,
        purchase_price: acquisitionMethod === 'PURCHASED' ? purchasePrice : null,
        age_in_months: acquisitionMethod === 'PURCHASED' ? ageInMonths : null,
        female_condition: gender === 'FEMALE' && acquisitionMethod === 'PURCHASED' ? femaleCondition : null,
        birth_type: birthType || null,
        mother_tag_id: acquisitionMethod === 'BORN' ? motherTagId : null,
        father_tag_id: acquisitionMethod === 'BORN' ? fatherTagId : null,
        status: status || 'LIVE',
        is_ready_for_sale: isReadyForSale || false,
        current_weight: isReadyForSale ? currentWeight : null,
        sale_price: isReadyForSale ? salePrice : null,
        remark,
        created_at: now,
        updated_at: now
      }
    });

    res.status(201).json({ id: animal.id, tagNumber: animal.tag_number });
  } catch (err) {
    logError(err, 'addAnimal');
    console.error('ADD ANIMAL ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get comprehensive details for a specific animal
// @route   GET /api/animals/:id
exports.getAnimal = async (req, res) => {
  try {
    const animal = await prisma.animals.findFirst({
      where: { id: req.params.id, farm_id: req.farmId },
      include: {
        breeds: true,
        locations: true
      }
    });

    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // Output mapped to frontend expected format
    res.json({
      id: animal.id,
      tagNumber: animal.tag_number,
      color: animal.color,
      breedId: animal.breed_id,
      locationId: animal.location_id,
      gender: animal.gender,
      birthDate: animal.birth_date,
      birthWeight: animal.birth_weight,
      isBreeder: animal.is_breeder,
      isQurbani: animal.is_qurbani,
      motherTagId: animal.mother_tag_id,
      fatherTagId: animal.father_tag_id,
      acquisitionMethod: animal.acquisition_method,
      status: animal.status,
      isReadyForSale: animal.is_ready_for_sale,
      remark: animal.remark,
      Breed: animal.breeds,
      Location: animal.locations
    });
  } catch (err) {
    console.error('FETCH ANIMAL ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update animal attributes
// @route   PUT /api/animals/:id
exports.updateAnimal = async (req, res) => {
  const { 
    tagNumber, breedId, gender, color, birthDate, birthWeight, locationId,
    isBreeder, isQurbani, batchNo, acquisitionMethod,
    purchaseDate, purchasePrice, ageInMonths, femaleCondition,
    birthType, motherTagId, fatherTagId, remark,
    status, isReadyForSale, currentWeight, salePrice 
  } = req.body;
  
  try {
    // 1. Verify existence and ownership
    const animal = await prisma.animals.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // 2. Uniqueness check if tag is changing
    if (tagNumber && tagNumber !== animal.tag_number) {
        const existingTag = await prisma.animals.findFirst({ 
          where: { tag_number: tagNumber, farm_id: req.farmId } 
        });
        if (existingTag) return res.status(400).json({ message: 'Tag Number already exists' });
    }

    const currentAcqMethod = acquisitionMethod || animal.acquisition_method;
    const finalIsBreeder = gender === 'MALE' ? (isBreeder || false) : false;
    const finalIsQurbani = gender === 'MALE' ? (!finalIsBreeder && isQurbani || false) : false;

    // 3. Commit updates to database
    const updated = await prisma.animals.update({
      where: { id: req.params.id },
      data: {
        tag_number: tagNumber,
        breed_id: breedId,
        gender,
        color,
        birth_date: birthDate ? new Date(birthDate) : null,
        birth_weight: birthWeight,
        location_id: locationId || null,
        is_breeder: finalIsBreeder,
        is_qurbani: finalIsQurbani,
        batch_no: batchNo,
        acquisition_method: currentAcqMethod,
        purchase_date: currentAcqMethod === 'PURCHASED' && purchaseDate ? new Date(purchaseDate) : null,
        purchase_price: currentAcqMethod === 'PURCHASED' ? purchasePrice : null,
        age_in_months: currentAcqMethod === 'PURCHASED' ? ageInMonths : null,
        female_condition: gender === 'FEMALE' && currentAcqMethod === 'PURCHASED' ? femaleCondition : null,
        birth_type: birthType || null,
        mother_tag_id: currentAcqMethod === 'BORN' ? motherTagId : null,
        father_tag_id: currentAcqMethod === 'BORN' ? fatherTagId : null,
        status: status || animal.status,
        is_ready_for_sale: isReadyForSale !== undefined ? isReadyForSale : animal.is_ready_for_sale,
        current_weight: isReadyForSale ? currentWeight : null,
        sale_price: isReadyForSale ? salePrice : null,
        remark,
        updated_by_user_id: req.user.id,
        updated_at: new Date()
      }
    });

    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error('UPDATE ANIMAL ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Safely remove animal from inventory
// @route   DELETE /api/animals/:id
exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await prisma.animals.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    // Integrity Check: Prevent deletion if this animal is registered as a parent (mother/father) elsewhere
    const parentCheck = await prisma.animals.findFirst({
      where: {
        farm_id: req.farmId,
        OR: [
          { mother_tag_id: animal.tag_number },
          { father_tag_id: animal.tag_number }
        ]
      }
    });

    if (parentCheck) {
      return res.status(400).json({ 
        message: `Cannot delete animal ${animal.tag_number} because it is a parent to other livestock.` 
      });
    }

    await prisma.animals.delete({ where: { id: req.params.id } });
    res.json({ message: 'Animal removed successfully' });
  } catch (err) {
    console.error('DELETE ANIMAL ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Check if a tag exists in the farm
// @route   GET /api/animals/check-tag/:tagNumber
exports.checkTagExists = async (req, res) => {
  try {
    const animal = await prisma.animals.findFirst({
      where: { 
        tag_number: req.params.tagNumber, 
        farm_id: req.farmId 
      },
      select: {
        id: true,
        tag_number: true,
        gender: true,
        breeds: { select: { name: true } }
      }
    });

    if (!animal) {
      return res.status(404).json({ message: 'Tag ID not found in your farm' });
    }

    res.json(animal);
  } catch (err) {
    console.error('CHECK TAG ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Replace an existing Tag ID with a new one
// @route   POST /api/animals/replace-tag
exports.replaceTag = async (req, res) => {
  const { oldTagNumber, newTagNumber } = req.body;

  if (!oldTagNumber || !newTagNumber) {
    return res.status(400).json({ message: 'Both old and new tags are required' });
  }

  try {
    // 1. Verify old tag exists
    const animal = await prisma.animals.findFirst({
      where: { tag_number: oldTagNumber, farm_id: req.farmId }
    });
    if (!animal) return res.status(404).json({ message: 'Existing Tag ID not found' });

    // 2. Verify new tag is unique
    const existingNewTag = await prisma.animals.findFirst({
      where: { tag_number: newTagNumber, farm_id: req.farmId }
    });
    if (existingNewTag) return res.status(400).json({ message: 'New Tag ID already exists in your farm' });

    // 3. Perform transactional update
    await prisma.$transaction([
      // Update the animal itself
      prisma.animals.update({
        where: { id: animal.id },
        data: { tag_number: newTagNumber, updated_at: new Date() }
      }),
      // Update parentage in other records
      prisma.animals.updateMany({
        where: { mother_tag_id: oldTagNumber, farm_id: req.farmId },
        data: { mother_tag_id: newTagNumber }
      }),
      prisma.animals.updateMany({
        where: { father_tag_id: oldTagNumber, farm_id: req.farmId },
        data: { father_tag_id: newTagNumber }
      }),
      // Update weight records
      prisma.weights.updateMany({
        where: { tag_number: oldTagNumber, farm_id: req.farmId },
        data: { tag_number: newTagNumber }
      }),
      // Update transaction records
      prisma.animal_transactions.updateMany({
        where: { tag_number: oldTagNumber, animal_id: animal.id },
        data: { tag_number: newTagNumber }
      })
    ]);

    res.json({ message: `Successfully replaced tag ${oldTagNumber} with ${newTagNumber}` });
  } catch (err) {
    console.error('REPLACE TAG ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
