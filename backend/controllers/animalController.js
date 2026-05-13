const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { deleteImage } = require('../utils/cloudinary');

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
      animalType: a.animal_type ? a.animal_type.charAt(0).toUpperCase() + a.animal_type.slice(1).toLowerCase() : 'Goat',
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
      matingDate: a.mating_date,
      expectedDeliveryDate: a.expected_delivery_date,
      birthType: a.birth_type,
      status: a.status,
      isReadyForSale: a.is_ready_for_sale,
      salePrice: a.sale_price,
      currentWeight: a.current_weight,
      remark: a.remark,
      imageUrl: a.image_url,
      teethStage: a.teeth_stage,
      purchaseWeight: a.purchase_weight,
      landingCost: a.landing_cost,
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
    matingDate, expectedDeliveryDate,
    birthType, motherTagId, fatherTagId, remark,
    status, isReadyForSale, currentWeight, salePrice, imageUrl,
    teethStage, purchaseWeight, landingCost,
    deathDate, deathReason,
    soldAt, soldRemark
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
        gender: gender?.toUpperCase(),
        color,
        birth_date: birthDate ? new Date(birthDate) : null,
        birth_weight: birthWeight || null,
        location_id: locationId || null,
        farm_id: req.farmId,
        created_by_user_id: req.user.id,
        is_breeder: finalIsBreeder,
        is_qurbani: finalIsQurbani,
        batch_no: batchNo,
        acquisition_method: acquisitionMethod?.toUpperCase() || 'BORN',
        purchase_date: (acquisitionMethod?.toUpperCase() === 'PURCHASED') && purchaseDate ? new Date(purchaseDate) : null,
        purchase_price: (acquisitionMethod?.toUpperCase() === 'PURCHASED') ? purchasePrice : null,
        purchase_weight: (acquisitionMethod?.toUpperCase() === 'PURCHASED') ? purchaseWeight : null,
        landing_cost: (acquisitionMethod?.toUpperCase() === 'PURCHASED') ? landingCost : null,
        age_in_months: (acquisitionMethod?.toUpperCase() === 'PURCHASED') ? ageInMonths : null,
        teeth_stage: (acquisitionMethod?.toUpperCase() === 'PURCHASED' || acquisitionMethod?.toUpperCase() === 'BORN') ? teethStage : null,
        female_condition: gender?.toUpperCase() === 'FEMALE' ? femaleCondition : null,
        mating_date: (gender?.toUpperCase() === 'FEMALE' && femaleCondition === 'MATED' && matingDate) ? new Date(matingDate) : null,
        expected_delivery_date: (gender?.toUpperCase() === 'FEMALE' && femaleCondition === 'PREGNANT' && expectedDeliveryDate) ? new Date(expectedDeliveryDate) : null,
        birth_type: birthType || null,
        mother_tag_id: (acquisitionMethod?.toUpperCase() === 'BORN') ? motherTagId : null,
        father_tag_id: (acquisitionMethod?.toUpperCase() === 'BORN') ? fatherTagId : null,
        status: status?.toUpperCase() || 'LIVE',
        death_date: deathDate ? new Date(deathDate) : null,
        death_reason: deathReason || null,
        sold_at: soldAt ? new Date(soldAt) : null,
        sold_remark: soldRemark || null,
        is_ready_for_sale: isReadyForSale || false,
        current_weight: isReadyForSale ? currentWeight : null,
        sale_price: isReadyForSale ? salePrice : null,
        remark,
        image_url: imageUrl || null,
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
      femaleCondition: animal.female_condition,
      matingDate: animal.mating_date,
      expectedDeliveryDate: animal.expected_delivery_date,
      status: animal.status,
      deathDate: animal.death_date,
      deathReason: animal.death_reason,
      soldAt: animal.sold_at,
      soldRemark: animal.sold_remark,
      isReadyForSale: animal.is_ready_for_sale,
      teethStage: animal.teeth_stage,
      purchaseWeight: animal.purchase_weight,
      landingCost: animal.landing_cost,
      remark: animal.remark,
      imageUrl: animal.image_url,
      Breed: animal.breeds,
      Location: animal.locations,
      animalType: animal.animal_type ? animal.animal_type.charAt(0).toUpperCase() + animal.animal_type.slice(1).toLowerCase() : 'Goat',
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
    matingDate, expectedDeliveryDate,
    birthType, motherTagId, fatherTagId, remark,
    status, isReadyForSale, currentWeight, salePrice, imageUrl,
    teethStage, purchaseWeight, landingCost,
    deathDate, deathReason,
    soldAt, soldRemark
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

    const currentAcqMethod = (acquisitionMethod?.toUpperCase() || animal.acquisition_method)?.toUpperCase();
    const finalIsBreeder = gender?.toUpperCase() === 'MALE' ? (isBreeder || false) : false;
    const finalIsQurbani = gender?.toUpperCase() === 'MALE' ? (!finalIsBreeder && isQurbani || false) : false;

    // 3. Commit updates to database
    const updated = await prisma.animals.update({
      where: { id: req.params.id },
      data: {
        tag_number: tagNumber,
        breed_id: breedId,
        gender: gender?.toUpperCase(),
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
        purchase_weight: currentAcqMethod === 'PURCHASED' ? purchaseWeight : null,
        landing_cost: currentAcqMethod === 'PURCHASED' ? landingCost : null,
        age_in_months: currentAcqMethod === 'PURCHASED' ? ageInMonths : null,
        teeth_stage: (currentAcqMethod === 'PURCHASED' || currentAcqMethod === 'BORN') ? teethStage : null,
        female_condition: gender?.toUpperCase() === 'FEMALE' ? femaleCondition : null,
        mating_date: (gender?.toUpperCase() === 'FEMALE' && femaleCondition === 'MATED' && matingDate) ? new Date(matingDate) : (femaleCondition !== 'MATED' ? null : undefined),
        expected_delivery_date: (gender?.toUpperCase() === 'FEMALE' && femaleCondition === 'PREGNANT' && expectedDeliveryDate) ? new Date(expectedDeliveryDate) : (femaleCondition !== 'PREGNANT' ? null : undefined),
        birth_type: birthType || null,
        mother_tag_id: currentAcqMethod === 'BORN' ? motherTagId : null,
        father_tag_id: currentAcqMethod === 'BORN' ? fatherTagId : null,
        status: status?.toUpperCase() || animal.status,
        death_date: deathDate ? new Date(deathDate) : (status?.toUpperCase() === 'LIVE' ? null : animal.death_date),
        death_reason: deathReason !== undefined ? deathReason : (status?.toUpperCase() === 'LIVE' ? null : animal.death_reason),
        sold_at: soldAt ? new Date(soldAt) : (status?.toUpperCase() === 'LIVE' ? null : animal.sold_at),
        sold_remark: soldRemark !== undefined ? soldRemark : (status?.toUpperCase() === 'LIVE' ? null : animal.sold_remark),
        is_ready_for_sale: isReadyForSale !== undefined ? isReadyForSale : animal.is_ready_for_sale,
        current_weight: isReadyForSale ? currentWeight : null,
        sale_price: isReadyForSale ? salePrice : null,
        remark,
        image_url: imageUrl !== undefined ? imageUrl : animal.image_url,
        updated_by_user_id: req.user.id,
        updated_at: new Date()
      }
    });

    // Cleanup Cloudinary image if it was replaced or removed
    if (imageUrl !== undefined && imageUrl !== animal.image_url) {
        if (animal.image_url) {
            // Don't await to avoid slowing down the response, but log errors
            deleteImage(animal.image_url).catch(err => console.error('Cloudinary Update Cleanup Error:', err));
        }
    }

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
    
    // Cleanup Cloudinary image if exists
    if (animal.image_url) {
        deleteImage(animal.image_url).catch(err => console.error('Cloudinary Delete Cleanup Error:', err));
    }

    res.json({ message: 'Animal removed successfully' });
  } catch (err) {
    console.error('DELETE ANIMAL ERROR:', err);
    res.status(500).json({ message: 'Animal API Error (Single)', error: err.message, code: err.code });
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
      include: {
        breeds: { select: { name: true } },
        locations: { select: { name: true } }
      }
    });

    if (!animal) {
      return res.status(404).json({ message: 'Tag ID not found in your farm' });
    }

    // Map to frontend standard
    res.json({
      id: animal.id,
      tagNumber: animal.tag_number,
      gender: animal.gender,
      animalType: animal.animal_type ? animal.animal_type.charAt(0).toUpperCase() + animal.animal_type.slice(1).toLowerCase() : 'Goat',
      breedName: animal.breeds?.name || 'Unknown Breed',
      currentLocationName: animal.locations?.name || 'Unassigned',
      ageInMonths: animal.age_in_months || 0
    });
  } catch (err) {
    console.error('CHECK TAG ERROR:', err);
    res.status(500).json({ message: 'Animal API Error: Check Tag', error: err.message, code: err.code });
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
    res.status(500).json({ message: 'Animal API Error: Replace Tag', error: err.message, code: err.code });
  }
};

// @desc    Update location for multiple animals
// @route   PUT /api/animals/bulk-location
exports.updateBulkLocation = async (req, res) => {
  const { animalIds, locationId, remark } = req.body;

  if (!Array.isArray(animalIds) || animalIds.length === 0) {
    return res.status(400).json({ message: 'Please select at least one animal' });
  }

  try {
    // 1. Verify location exists and belongs to farm
    if (locationId) {
      const location = await prisma.locations.findFirst({
        where: { id: locationId, farm_id: req.farmId }
      });
      if (!location) return res.status(400).json({ message: 'Invalid location selected' });
    }

    // 2. Perform bulk update
    const result = await prisma.animals.updateMany({
      where: {
        id: { in: animalIds },
        farm_id: req.farmId
      },
      data: {
        location_id: locationId || null,
        remark: remark !== undefined ? remark : undefined,
        updated_at: new Date(),
        updated_by_user_id: req.user.id
      }
    });

    res.json({ 
      message: `Successfully updated location for ${result.count} animals`,
      count: result.count 
    });
  } catch (err) {
    console.error('BULK LOCATION UPDATE ERROR:', err);
    res.status(500).json({ message: 'Animal API Error (Bulk Location)', error: err.message, code: err.code });
  }
};

// @desc    Bulk delete animals
// @route   DELETE /api/animals/bulk
exports.deleteAnimalsBulk = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No animal IDs provided' });
  }

  if (!req.farmId) {
    return res.status(400).json({ message: 'No farm selected' });
  }

  // UUID Validation Helper
  const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  try {
    // 0. Validate that farm_id and all animal_ids are correct UUID formats
    if (!isUUID(req.farmId)) {
       throw new Error(`Invalid Farm ID format: ${req.farmId}`);
    }

    const validIds = ids.filter(id => isUUID(id));
    if (validIds.length === 0) {
       return res.status(400).json({ message: 'None of the provided IDs are valid animal UUIDs' });
    }

    // 1. Fetch only animals that belong to this farm
    const animalsToDelete = await prisma.animals.findMany({
      where: {
        id: { in: validIds },
        farm_id: req.farmId
      },
      select: { id: true, tag_number: true, image_url: true }
    });

    if (animalsToDelete.length === 0) {
      return res.status(404).json({ message: 'No matching animals found for your farm.' });
    }

    const manageableIds = animalsToDelete.map(a => a.id);
    const tagNumbers = animalsToDelete.map(a => a.tag_number);

    // 2. Integrity Check: Ensure none of these animals are parents to other livestock (using tag_number)
    // We use count as it's more definitive and avoids casting issues in findFirst OR blocks
    const childCount = await prisma.animals.count({
      where: {
        farm_id: req.farmId,
        OR: [
          { mother_tag_id: { in: tagNumbers } },
          { father_tag_id: { in: tagNumbers } }
        ]
      }
    });

    if (childCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete these animals because some are parents to ${childCount} other livestock in the system.` 
      });
    }

    // 3. Batch delete all related data (if not cascaded) and the animals themselves
    await prisma.animals.deleteMany({
      where: {
        id: { in: manageableIds }
      }
    });

    // Bulk cleanup Cloudinary images
    animalsToDelete.forEach(a => {
        if (a.image_url) {
            deleteImage(a.image_url).catch(err => console.error('Cloudinary Bulk Cleanup Error:', err));
        }
    });

    res.json({ 
      message: `Successfully deleted ${animalsToDelete.length} animals.`,
      deletedCount: animalsToDelete.length
    });
  } catch (err) {
    console.error('BULK DELETE ANIMALS ERROR:', err);
    res.status(500).json({ 
      message: 'Animal API Error (Bulk Delete)', 
      error: err.message,
      code: err.code 
    });
  }
};
