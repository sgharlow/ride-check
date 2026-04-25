/**
 * TOP_50_MAKES — static list of vehicle makes for the Make dropdown.
 *
 * Source: prd.md > Entering a Vehicle > US-1 (acceptance criterion bullet
 * starting "Make is a dropdown populated from a static top-50 makes list...").
 * Order preserved as listed in the PRD.
 *
 * Display-cased names (e.g. "Volkswagen", "Mercedes-Benz") so they round-trip
 * cleanly through `lib/slug.ts` and render in the UI without re-casing.
 */
export const TOP_50_MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Hyundai",
  "Kia",
  "Subaru",
  "Mazda",
  "Jeep",
  "Ram",
  "GMC",
  "Audi",
  "Lexus",
  "Acura",
  "Infiniti",
  "Cadillac",
  "Buick",
  "Lincoln",
  "Volvo",
  "Porsche",
  "Land Rover",
  "Jaguar",
  "Mini",
  "Mitsubishi",
  "Tesla",
  "Dodge",
  "Chrysler",
  "Fiat",
  "Genesis",
  "Alfa Romeo",
  "Maserati",
  "Bentley",
  "Rolls-Royce",
  "Ferrari",
  "Lamborghini",
  "McLaren",
  "Aston Martin",
  "Lotus",
  "Smart",
  "Saab",
  "Saturn",
  "Pontiac",
  "Hummer",
  "Suzuki",
  "Isuzu",
  "Scion",
] as const;

export type Make = (typeof TOP_50_MAKES)[number];
