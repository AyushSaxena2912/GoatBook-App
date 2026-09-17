export const CLEARED_ANIMAL_LIST_PARAMS = {
  listReset: true,
  breedId: null,
  locationId: null,
  gender: null,
  isBreeder: null,
  femaleCondition: null,
  ageRange: null,
  status: null,
  initialSearch: null,
};

export const hasAnimalListNavFilters = (params = {}) =>
  params.breedId != null ||
  params.locationId != null ||
  params.gender != null ||
  params.femaleCondition != null ||
  params.ageRange != null ||
  params.status != null ||
  (params.initialSearch != null && String(params.initialSearch).trim() !== '') ||
  params.isBreeder === true ||
  params.isBreeder === false;
