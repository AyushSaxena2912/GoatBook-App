const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper to parse Postgres COPY format lines
function parseCopyBlock(sqlContent, tableName) {
  const startMarker = `COPY public.${tableName} `;
  const endMarker = '\\.';
  
  const startIndex = sqlContent.indexOf(startMarker);
  if (startIndex === -1) return [];
  
  // Find the start of the data (next line after COPY statement)
  const dataStart = sqlContent.indexOf('\n', startIndex) + 1;
  const endIndex = sqlContent.indexOf(endMarker, dataStart);
  if (endIndex === -1) return [];
  
  const blockText = sqlContent.substring(dataStart, endIndex).trim();
  if (!blockText) return [];
  
  // Get column names from COPY statement
  const copyHeaderLine = sqlContent.substring(startIndex, dataStart);
  const columnsMatch = copyHeaderLine.match(/\(([^)]+)\)/);
  if (!columnsMatch) return [];
  const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  
  const lines = blockText.split('\n');
  const records = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const values = line.split('\t');
    const record = {};
    
    columns.forEach((col, idx) => {
      let val = values[idx];
      if (val === '\\N') {
        record[col] = null;
      } else if (val === 't') {
        record[col] = true;
      } else if (val === 'f') {
        record[col] = false;
      } else {
        // Try parsing numbers or dates if needed, or keep as string
        record[col] = val;
      }
    });
    
    records.push(record);
  }
  
  return records;
}

async function mergeData() {
  const sqlPath = path.join(__dirname, '../../neondb_backup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`[MERGE] ❌ SQL backup file not found at: ${sqlPath}`);
    return;
  }
  
  console.log('[MERGE] Reading SQL backup file...');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // 1. Parse all tables from backup
  console.log('[MERGE] Parsing tables from backup...');
  const breeds = parseCopyBlock(sqlContent, 'breeds');
  const locations = parseCopyBlock(sqlContent, 'locations');
  const animals = parseCopyBlock(sqlContent, 'animals');
  const weights = parseCopyBlock(sqlContent, 'weights');
  const breedings = parseCopyBlock(sqlContent, 'breedings');
  const matings = parseCopyBlock(sqlContent, 'matings');
  const vaccinationRecords = parseCopyBlock(sqlContent, 'vaccination_records');
  
  console.log(`[MERGE] Parsed counts from backup:
  - Breeds: ${breeds.length}
  - Locations: ${locations.length}
  - Animals: ${animals.length}
  - Weights: ${weights.length}
  - Breedings: ${breedings.length}
  - Matings: ${matings.length}
  - Vaccinations: ${vaccinationRecords.length}`);

  // Helper to upsert a record safely
  async function safeInsert(table, data, uniqueField = 'id') {
    try {
      const existing = await prisma[table].findUnique({
        where: { [uniqueField]: data[uniqueField] }
      });
      if (existing) {
        return { status: 'skipped' };
      }
      
      // Clean up fields to match Prisma schema types
      const cleanData = { ...data };
      
      // Remap deleted farm_ids to Goatwala Farm to satisfy FK constraints
      const activeFarms = ['3d08e737-06c0-43f4-a9c5-de9a650d7c1b', 'fa7c62fe-ea16-4361-9e0a-c41ca8cac70c'];
      if (cleanData.farm_id && !activeFarms.includes(cleanData.farm_id)) {
        cleanData.farm_id = '3d08e737-06c0-43f4-a9c5-de9a650d7c1b';
      }
      
      // Convert decimal/numeric string fields to parseFloat/Number
      if (table === 'animals') {
        if (cleanData.birth_weight) cleanData.birth_weight = parseFloat(cleanData.birth_weight);
        if (cleanData.purchase_price) cleanData.purchase_price = parseFloat(cleanData.purchase_price);
        if (cleanData.age_in_months) cleanData.age_in_months = parseInt(cleanData.age_in_months, 10);
        if (cleanData.sale_price) cleanData.sale_price = parseFloat(cleanData.sale_price);
        if (cleanData.current_weight) cleanData.current_weight = parseFloat(cleanData.current_weight);
        if (cleanData.landing_cost) cleanData.landing_cost = parseFloat(cleanData.landing_cost);
        if (cleanData.purchase_weight) cleanData.purchase_weight = parseFloat(cleanData.purchase_weight);
        if (cleanData.net_sale_price) cleanData.net_sale_price = parseFloat(cleanData.net_sale_price);
        if (cleanData.sale_discount) cleanData.sale_discount = parseFloat(cleanData.sale_discount);
        if (cleanData.sale_rate) cleanData.sale_rate = parseFloat(cleanData.sale_rate);
        if (cleanData.sale_weight) cleanData.sale_weight = parseFloat(cleanData.sale_weight);
        
        // Map MATED to PREGNANT
        if (cleanData.female_condition === 'MATED') {
          cleanData.female_condition = 'PREGNANT';
        }
        
        // Parse dates
        if (cleanData.birth_date) cleanData.birth_date = new Date(cleanData.birth_date);
        if (cleanData.purchase_date) cleanData.purchase_date = new Date(cleanData.purchase_date);
        if (cleanData.death_date) cleanData.death_date = new Date(cleanData.death_date);
        if (cleanData.sold_at) cleanData.sold_at = new Date(cleanData.sold_at);
        if (cleanData.expected_delivery_date) cleanData.expected_delivery_date = new Date(cleanData.expected_delivery_date);
        if (cleanData.mating_date) cleanData.mating_date = new Date(cleanData.mating_date);
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
      }
      
      if (table === 'weights') {
        if (cleanData.weight) cleanData.weight = parseFloat(cleanData.weight);
        if (cleanData.height) cleanData.height = parseFloat(cleanData.height);
        if (cleanData.date) cleanData.date = new Date(cleanData.date);
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
      }
      
      if (table === 'breedings') {
        if (cleanData.delivery_date) cleanData.delivery_date = new Date(cleanData.delivery_date);
        if (cleanData.num_male) cleanData.num_male = parseInt(cleanData.num_male, 10);
        if (cleanData.num_female) cleanData.num_female = parseInt(cleanData.num_female, 10);
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
        if (cleanData.kids_details) {
          try {
            cleanData.kids_details = JSON.parse(cleanData.kids_details);
          } catch(e) {
            cleanData.kids_details = null;
          }
        }
      }
      
      if (table === 'matings') {
        if (cleanData.mating_date) cleanData.mating_date = new Date(cleanData.mating_date);
        if (cleanData.expected_delivery_date) cleanData.expected_delivery_date = new Date(cleanData.expected_delivery_date);
        if (cleanData.miscarriage_date) cleanData.miscarriage_date = new Date(cleanData.miscarriage_date);
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
      }

      if (table === 'vaccination_records') {
        if (cleanData.date) cleanData.date = new Date(cleanData.date);
        if (cleanData.valid_till) cleanData.valid_till = new Date(cleanData.valid_till);
        if (cleanData.next_due_date) cleanData.next_due_date = new Date(cleanData.next_due_date);
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
      }

      if (table === 'locations') {
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
      }

      if (table === 'breeds') {
        if (cleanData.created_at) cleanData.created_at = new Date(cleanData.created_at);
        if (cleanData.updated_at) cleanData.updated_at = new Date(cleanData.updated_at);
        if (cleanData.is_default === null) cleanData.is_default = false;
      }

      await prisma[table].create({ data: cleanData });
      return { status: 'inserted' };
    } catch (err) {
      console.error(`[MERGE] ❌ Error inserting into ${table}:`, err.message);
      return { status: 'error', error: err.message };
    }
  }

  console.log('[MERGE] Merging Breeds...');
  let breedInserts = 0;
  const breedIdMap = {}; // Maps old breed ID -> active breed ID in DB
  
  for (const breed of breeds) {
    const cleanBreed = { ...breed };
    const activeFarms = ['3d08e737-06c0-43f4-a9c5-de9a650d7c1b', 'fa7c62fe-ea16-4361-9e0a-c41ca8cac70c'];
    if (cleanBreed.farm_id && !activeFarms.includes(cleanBreed.farm_id)) {
      cleanBreed.farm_id = '3d08e737-06c0-43f4-a9c5-de9a650d7c1b';
    }
    if (cleanBreed.is_default === null) cleanBreed.is_default = false;
    if (cleanBreed.created_at) cleanBreed.created_at = new Date(cleanBreed.created_at);
    if (cleanBreed.updated_at) cleanBreed.updated_at = new Date(cleanBreed.updated_at);

    try {
      // 1. Check if ID exists
      const existingById = await prisma.breeds.findUnique({
        where: { id: breed.id }
      });
      if (existingById) {
        breedIdMap[breed.id] = breed.id;
        continue;
      }
      
      // 2. Check if name/type/farm unique constraint matches
      const existingByUnique = await prisma.breeds.findFirst({
        where: {
          farm_id: cleanBreed.farm_id,
          name: cleanBreed.name,
          animal_type: cleanBreed.animal_type
        }
      });
      
      if (existingByUnique) {
        breedIdMap[breed.id] = existingByUnique.id;
        console.log(`[MERGE] Breed '${cleanBreed.name}' already exists. Mapping old ID ${breed.id} -> existing ID ${existingByUnique.id}`);
      } else {
        await prisma.breeds.create({ data: cleanBreed });
        breedIdMap[breed.id] = breed.id;
        breedInserts++;
      }
    } catch (err) {
      console.error(`[MERGE] ❌ Error processing breed ${cleanBreed.name}:`, err.message);
    }
  }
  console.log(`[MERGE] Merged ${breedInserts} new breeds.`);

  console.log('[MERGE] Merging Locations...');
  let locInserts = 0;
  const locationIdMap = {};
  for (const loc of locations) {
    const cleanLoc = { ...loc };
    const activeFarms = ['3d08e737-06c0-43f4-a9c5-de9a650d7c1b', 'fa7c62fe-ea16-4361-9e0a-c41ca8cac70c'];
    if (cleanLoc.farm_id && !activeFarms.includes(cleanLoc.farm_id)) {
      cleanLoc.farm_id = '3d08e737-06c0-43f4-a9c5-de9a650d7c1b';
    }
    if (cleanLoc.created_at) cleanLoc.created_at = new Date(cleanLoc.created_at);
    if (cleanLoc.updated_at) cleanLoc.updated_at = new Date(cleanLoc.updated_at);

    try {
      const existingById = await prisma.locations.findUnique({
        where: { id: loc.id }
      });
      if (existingById) {
        locationIdMap[loc.id] = loc.id;
        continue;
      }
      
      const existingByUnique = await prisma.locations.findFirst({
        where: {
          farm_id: cleanLoc.farm_id,
          code: cleanLoc.code
        }
      });
      if (existingByUnique) {
        locationIdMap[loc.id] = existingByUnique.id;
      } else {
        await prisma.locations.create({ data: cleanLoc });
        locationIdMap[loc.id] = loc.id;
        locInserts++;
      }
    } catch (err) {
      console.error(`[MERGE] ❌ Error processing location ${cleanLoc.name}:`, err.message);
    }
  }
  console.log(`[MERGE] Merged ${locInserts} new locations.`);

  console.log('[MERGE] Merging Animals...');
  let animalInserts = 0;
  for (const animal of animals) {
    if (animal.farm_id === '3d08e737-06c0-43f4-a9c5-de9a650d7c1b') {
      const cleanAnimal = { ...animal };
      
      // Map breed_id and location_id
      if (cleanAnimal.breed_id && breedIdMap[cleanAnimal.breed_id]) {
        cleanAnimal.breed_id = breedIdMap[cleanAnimal.breed_id];
      }
      if (cleanAnimal.location_id && locationIdMap[cleanAnimal.location_id]) {
        cleanAnimal.location_id = locationIdMap[cleanAnimal.location_id];
      } else {
        cleanAnimal.location_id = null; // Set to null if not found
      }
      
      const res = await safeInsert('animals', cleanAnimal);
      console.log(`[MERGE] Animal ${cleanAnimal.tag_number} (ID: ${cleanAnimal.id}):`, res.status, res.error || '');
      if (res.status === 'inserted') animalInserts++;
    } else {
      console.log(`[MERGE] Animal ${animal.tag_number} skipped: farm_id ${animal.farm_id} does not match`);
    }
  }
  console.log(`[MERGE] Merged ${animalInserts} new animals.`);

  console.log('[MERGE] Merging Weights...');
  let weightInserts = 0;
  for (const wt of weights) {
    const res = await safeInsert('weights', wt);
    if (res.status === 'inserted') weightInserts++;
  }
  console.log(`[MERGE] Merged ${weightInserts} new weight records.`);

  console.log('[MERGE] Merging Breedings/Deliveries...');
  let breedingInserts = 0;
  for (const br of breedings) {
    const res = await safeInsert('breedings', br);
    if (res.status === 'inserted') breedingInserts++;
  }
  console.log(`[MERGE] Merged ${breedingInserts} new breeding records.`);

  console.log('[MERGE] Merging Matings...');
  let matingInserts = 0;
  for (const mt of matings) {
    const res = await safeInsert('matings', mt);
    if (res.status === 'inserted') matingInserts++;
  }
  console.log(`[MERGE] Merged ${matingInserts} new mating records.`);

  console.log('[MERGE] Merging Vaccinations...');
  let vacInserts = 0;
  for (const vr of vaccinationRecords) {
    const res = await safeInsert('vaccination_records', vr);
    if (res.status === 'inserted') vacInserts++;
  }
  console.log(`[MERGE] Merged ${vacInserts} new vaccination records.`);

  console.log('[MERGE] 🎉 Data merge complete!');
  
  // Verify final animal count for Goatwala Farm
  const finalCount = await prisma.animals.count({
    where: { farm_id: '3d08e737-06c0-43f4-a9c5-de9a650d7c1b' }
  });
  console.log(`[MERGE] Total animals now in Goatwala Farm: ${finalCount}`);
  
  await prisma.$disconnect();
}

mergeData().catch(console.error);
