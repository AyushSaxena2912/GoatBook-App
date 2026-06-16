const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create Formulation With Ingredients
const createFormulation = async (req, res) => {
  const {name, ingredients } = req.body;
  const farmId = req.farmId;

  if(!farmId){
    return res.status(400).json({
        message: "Farm ID required!"
    });
  }

  if (!name || !ingredients || ingredients.length === 0) {
    return res.status(400).json({ message: "name aur ingredients required hain" });
  }

  const totalPercentage = ingredients.reduce((sum, i) => sum + i.percentage, 0);
  if (totalPercentage !== 100) {
    return res.status(400).json({ message: "Ingredients ka total percentage 100 hona chahiye" });
  }

  try {
    const formulation = await prisma.feedFormulation.create({
      data: {
        name,
        farmId,
        ingredients: {
          create: ingredients.map((i) => ({
            name: i.name,
            percentage: i.percentage,
            ratePerKg: i.ratePerKg,
          })),
        },
      },
      include: { ingredients: true },
    });

    res.status(201).json({ message: "Formulation save ho gaya", formulation });

  } catch (error) {
    res.status(500).json({ message: "Kuch gadbad ho gayi", error: error.message });
  }
};

// Get All Formulations With its Ingredients
const getAllFormulations = async(req, res) => {
    const farmId = req.farmId;
    if(!farmId){
        return res.status(400).json({
            message: "Farm ID is required."
        }); }

    try{

        const formulations = await prisma.feedFormulation.findMany({
            where: { farmId },
            include: {ingredients : true}
        });
    
        const result = formulations.map((formulation)=>{

        const ingredientsWithRateTMR = formulation.ingredients.map((i) => ({
        ...i,
        rateTMR: (i.percentage * i.ratePerKg)/100,
        }));

        const totalRatePerKg = ingredientsWithRateTMR.reduce(
            (sum, i) => sum + i.rateTMR, 0


        );

        return {
            id: formulation.id,
            name: formulation.name,
            ingredients : ingredientsWithRateTMR,
            totalRatePerKg,
        };

        });

        res.status(200).json(result);
    }
    catch(error){
         res.status(500).json({
            message: "Internal Server Error.",error: error.message
         });

    }
    };



// Get Formulation With its Ingredients by ID
const getFormulationById = async(req, res) => {
    const {id} = req.params;
    const farmId = req.farmId;

    if(!farmId){
        return res.status(400).json({
            message: "Farm ID is required."
        }); }

    try{

        const formulation = await prisma.feedFormulation.findFirst({
            where: { id: Number(id),farmId },
            include: {ingredients : true}
        });

        if(!formulation){
             return res.status(400).json({message: "Formulation is not found."})
        }
    
        const ingredientsWithRateTMR = formulation.ingredients.map((i) => ({
        ...i,
        rateTMR: (i.percentage * i.ratePerKg)/100,
        }));

        const totalRatePerKg = ingredientsWithRateTMR.reduce(
            (sum, i) => sum + i.rateTMR, 0
        );

          res.status(200).json({
            id: formulation.id,
            name: formulation.name,
            ingredients : ingredientsWithRateTMR,
            totalRatePerKg,
        });
    }
    catch(error){
         res.status(500).json({
            message: "Internal Server Error.",error: error.message
         });

    }
    };

// Update Formulation (Full Update including ingredients)

const updateFormulation = async(req, res) => {
    const { id } = req.params;
    const {name, ingredients} = req.body;
    const farmId = req.farmId;

    if(!farmId){
        return res.status(400).json({message: "Farm Id required."});
    }

    if(!name || !ingredients || ingredients.length === 0) {
        return res.status(400).json({message: "name and ingredients are required."});
    }

    const totalPercentage = ingredients.reduce((sum, i) => sum+i.percentage, 0);
    if (totalPercentage !== 100) {
        return res.status(400).json({message: " Ingredients total percentage must be 100 "});
    }

    try{
      
        const existing = await prisma.feedFormulation.findFirst({
            where: {id: Number(id), farmId},
        });

        if(!existing) {
            return res.status(404).json({message: "Formulation not found."});
        }

       // Deleting old ingredients and storing new ingredients

       await prisma.formulationIngredients.deleteMany({
            where: {
                     formulationId: Number(id)
            },
       });

       const formulation = await prisma.feedFormulation.update({
         where: {id: Number(id)},
         data: {
            name,
            ingredients: {
                create: ingredients.map((i) => ({
                     name: i.name,
                     percentage: i.percentage,
                     ratePerKg: i.ratePerKg,
                })),
            },
         },
         include: {ingredients: true},
       });

       res.status(200).json({message: "Formulation is updated", formulation});
    }
    catch(error){
        res.status(500).json({ message: "Internal Server Error.", error: error.message });
    }


}

const patchFormulation = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const farmId = req.farmId;

  if (!farmId) {
    return res.status(400).json({ message: "Farm Id required." });
  }

  if (!name) {
    return res.status(400).json({ message: "name is required." });
  }

  try {
    const existing = await prisma.feedFormulation.findFirst({
      where: { id: Number(id), farmId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Formulation not found." });
    }

    const formulation = await prisma.feedFormulation.update({
      where: { id: Number(id) },
      data: { name },
    });

    res.status(200).json({ message: "Formulation updated successfully", formulation });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error.", error: error.message });
  }
};

const deleteFormulation = async (req, res) => {
  const { id } = req.params;
  const farmId = req.farmId;

  if (!farmId) {
    return res.status(400).json({ message: "Farm Id required." });
  }

  try {
    const existing = await prisma.feedFormulation.findFirst({
      where: { id: Number(id), farmId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Formulation not found." });
    }

    // Delete associated ingredients first
    await prisma.formulationIngredients.deleteMany({
      where: {
        formulationId: Number(id)
      },
    });

    // Delete the formulation itself
    await prisma.feedFormulation.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Formulation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error.", error: error.message });
  }
};

module.exports = { 
  createFormulation, 
  getAllFormulations, 
  getFormulationById, 
  updateFormulation, 
  patchFormulation, 
  deleteFormulation 
};