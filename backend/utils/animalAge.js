const getAnimalAgeInMonths = (animal, now = new Date()) => {
  const birth = animal?.birth_date || animal?.birthDate;
  if (birth) {
    const b = new Date(birth);
    if (!isNaN(b.getTime())) {
      let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
      if (now.getDate() < b.getDate()) months--;
      return Math.max(0, months);
    }
  }

  const stored = animal?.age_in_months ?? animal?.ageInMonths;
  if (stored !== null && stored !== undefined && stored !== '') {
    const n = Number(stored);
    if (!isNaN(n)) return Math.max(0, n);
  }

  return null;
};

// Mutually exclusive kid buckets: [0,3), [3,6), [6,9)
const getKidAgeBucket = (ageInMonths) => {
  if (ageInMonths === null || ageInMonths === undefined || isNaN(ageInMonths) || ageInMonths < 0) {
    return null;
  }
  if (ageInMonths < 3) return '0-3';
  if (ageInMonths < 6) return '3-6';
  if (ageInMonths < 9) return '6-9';
  return null;
};

module.exports = { getAnimalAgeInMonths, getKidAgeBucket };
