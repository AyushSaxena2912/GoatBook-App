const defaultFormulationIngredients = [
 { name: "Maize", percentage: 45, ratePerKg: 25},  
 { name: "Chunni/Tur/Mung/Chana/Urd", percentage: 20, ratePerKg: 25},
 { name: "Rice Bran/Wheat Bran", percentage: 20, ratePerKg: 24}, 
 { name: "Any Oil Cake GNC/Cotton", percentage: 13, ratePerKg: 40},   
 { name: "Mineral Mixture", percentage: 1, ratePerKg: 125},
  { name: "Common Salt", percentage: 1, ratePerKg: 20},      
];


async function seedFormulation(farmId, tx){
    console.log("Creating formulation for farm:", farmId);
    await tx.feedFormulation.create({
        data: {
            name: "Concentrate Formulation",
            farmId,
            ingredients :{
                create: defaultFormulationIngredients,
            },
        },
    });
}

module.exports = { seedFormulation };