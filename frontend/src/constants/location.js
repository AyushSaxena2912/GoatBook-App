import { Country, State } from 'country-state-city';

export const getCountryOptions = () =>
  Country.getAllCountries()
    .map(c => ({ label: c.name, value: c.name, isoCode: c.isoCode }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const getStateOptions = (countryName) => {
  const country = Country.getAllCountries().find(c => c.name === countryName);
  if (!country) return [];
  return State.getStatesOfCountry(country.isoCode)
    .map(s => ({ label: s.name, value: s.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
