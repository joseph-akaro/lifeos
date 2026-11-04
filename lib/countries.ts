export interface Country { code: string; name: string; cur: string }

/** Eastern Africa (UN geoscheme) plus Sudan and DR Congo, which many routes through the region touch. USD is the primary currency. */
export const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya', cur: 'KES' },
  { code: 'UG', name: 'Uganda', cur: 'UGX' },
  { code: 'TZ', name: 'Tanzania', cur: 'TZS' },
  { code: 'RW', name: 'Rwanda', cur: 'RWF' },
  { code: 'BI', name: 'Burundi', cur: 'BIF' },
  { code: 'ET', name: 'Ethiopia', cur: 'ETB' },
  { code: 'SS', name: 'South Sudan', cur: 'SSP' },
  { code: 'SO', name: 'Somalia', cur: 'SOS' },
  { code: 'DJ', name: 'Djibouti', cur: 'DJF' },
  { code: 'ER', name: 'Eritrea', cur: 'ERN' },
  { code: 'SD', name: 'Sudan', cur: 'SDG' },
  { code: 'CD', name: 'DR Congo', cur: 'CDF' },
  { code: 'MW', name: 'Malawi', cur: 'MWK' },
  { code: 'ZM', name: 'Zambia', cur: 'ZMW' },
  { code: 'MZ', name: 'Mozambique', cur: 'MZN' },
  { code: 'ZW', name: 'Zimbabwe', cur: 'ZWG' },
  { code: 'MG', name: 'Madagascar', cur: 'MGA' },
  { code: 'MU', name: 'Mauritius', cur: 'MUR' },
  { code: 'SC', name: 'Seychelles', cur: 'SCR' },
  { code: 'KM', name: 'Comoros', cur: 'KMF' },
  { code: 'US', name: 'United States', cur: 'USD' },
];

export const FX_CODES = [...new Set(COUNTRIES.map((c) => c.cur))];
export const countryOf = (code?: string) => COUNTRIES.find((c) => c.code === code);
