export const currentCo2026003BmcSource = "SRC-DC-CO-2026-003-BT-AMENDMENT";

export const currentCo2026003BmcItemIds = [
  "BMC-CLM-002",
  "BMC-CLM-003",
  "BMC-CLM-004",
  "BMC-CLM-006",
  "BMC-CLM-007",
  "BMC-CLM-008",
];

export const currentCo2026003ForbiddenActiveMeaning = [
  /защищ[её]нн(?:ое|ого|ом|ым)\s+хранилищ/iu,
  /хранилищ[ае][^.\n]*(?:PDF|презентац|результат)/iu,
  /хранени[ея][^.\n]*(?:PDF|презентац|результат)/iu,
  /доставк[аи][^.\n]*по\s+ссылк[ауеи]/iu,
  /ссылк[ауеи][^.\n]*(?:PDF|презентац|результат|пользовател)/iu,
  /уведомлени[ея][^.\n]*(?:ссылк[ауеи]|результат)/iu,
  /показ(?:ать|ывает|ывают|а)[^.\n]*ссылк/iu,
];
