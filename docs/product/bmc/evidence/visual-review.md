# Проверка визуального BMC

Проверено: 2026-07-12T00:00:00Z

Итог: готово к пользовательской проверке.

Проверено:

- Сохранена классическая структура BMC: B8 | B7/B6 | B2 | B4/B3 | B1, нижний ряд B9 | B5.
- Текст каждого блока помещается внутри своей рамки без пересечений и обрезания.
- Рамки выровнены, интервалы сетки одинаковы, все элементы находятся внутри холста.
- SVG является каноническим визуальным источником; PNG и PDF формируются из него.
- PlantUML содержит те же девять блоков, ограниченные по длине строки и полную сетку связей.

Проверенные файлы:

- docs/product/bmc/source/derived/datacanvas-bmc.svg: f5e47e6985c00b9f93a2c32ef96216fb98819e57ee4208870c59256d096e95b8
- docs/product/bmc/source/derived/datacanvas-bmc.png: e17dcdfd24120e19994b83c45ee0453446671a132a271eb1d46925bfc42debe2
- docs/product/bmc/source/derived/datacanvas-bmc.pdf: 8c234ae066ab9bcba56f9233e99f7d0c3622ffa0ff652bea63585e384ac9db9e
- docs/product/bmc/source/derived/datacanvas-bmc.puml: ee21f5cf866c64f51540c8ac561758bd65554d052dbfc9ada5aff1c19aa2a019
