export const publicBusinessLanguageRules = [
  {
    id: "stakeholder-timing-jargon",
    pattern:
      /(?:^|[^А-Яа-яЁё])(?:инкремент[а-яё-]*|смежн(?:ый|ом|ого|ому|ие|их|ими|ые|ых|ыми)\s+маршрут|(?:отдельн[а-яё-]*\s+)?(?:`?P[1-5]`?\s*[-–—]?\s*)?этап[а-яё-]*\s+дорожн[а-яё-]*\s+карт[а-яё-]*|(?:Guard|guard|гард[а-яё-]*)\s+границ[а-яё-]*\s+приоритет[а-яё-]*)/iu,
    message:
      "очередность поставки в публичных бизнес-документах нужно описывать через понятные сценарии, возможности, каналы и пользовательский результат; внутренняя roadmap-лексика остается в backlog, roadmap, XLSX, impact/evidence или плановом контуре",
  },
];

export const stakeholderTimingJargonRule = publicBusinessLanguageRules.find(
  (rule) => rule.id === "stakeholder-timing-jargon",
);

export const publicBusinessForbiddenSnippets = [
  "инкремент",
  "смежный маршрут",
  "отдельный этап дорожной карты",
  "этап дорожной карты",
  "P1-этап дорожной карты",
  "P2-этап дорожной карты",
  "Guard границ приоритетов",
];
