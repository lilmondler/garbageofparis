/*
  ============================================================
  GARBAGE OF PARIS — data.js
  ============================================================

  Это главный файл данных. Все фотографии хранятся здесь.

  КАК ДОБАВИТЬ НОВОЕ ФОТО:
  1. Загрузи изображение в папку assets/img/gallery/
  2. Скопируй один объект ниже и добавь его в массив
  3. Сохрани файл — галерея, архив и главная обновятся сами

  ПОЛЯ:
  - title:    короткое название (показывается в галерее)
  - image:    путь к файлу от корня сайта
  - year:     год съёмки, например "2025" — используется для фильтров
              (если не указать, возьмётся из date)
  - date:     "2025-05-12" — ISO формат, для сортировки
  - location: район или адрес в Париже
  - category: одна из: bins / streets / leftovers / signs / objects / accidents / traces
  - caption:  подпись к фото (одна-две фразы)
  - alt:      описание того, что на фото, для скринридеров (accessibility)

  Порядок в массиве не важен — сортировка по дате автоматическая.
  ============================================================
*/

const photos = [

  // — 2026 —
  {
    title: "J'adore le cinéma!",
    image: "assets/img/gallery/photo_2026-04-06_19-26-28.jpg",
    year: "2026",
    date: "2026-04-06",
    location: "Stalingrad",
    category: "leftovers",
    caption: "A whole lot of popcorn!",
    alt: "A cardboard box full of red and white striped popcorn boxes next to a grey street bin"
  },

  // — 2025 —
  {
    title: "Nike shoe",
    image: "assets/img/gallery/photo_2025-12-30_19-50-29.jpg",
    year: "2025",
    date: "2025-12-30",
    location: "Madeleine",
    category: "objects",
    caption: "Someone ran off wearing just one shoe!",
    alt: "A pair of navy sneakers left on top of a street bin near the Madeleine"
  },
  {
    title: "Cis men",
    image: "assets/img/gallery/photo_2025-12-20_16-36-12.jpg",
    year: "2025",
    date: "2025-12-20",
    location: "Paris",
    category: "signs",
    caption: "A bin can be a statement.",
    alt: "A grey wheelie bin with “CIS MEN” written in chalk under an arrow pointing to the lid"
  },
  {
    title: "Some basic trash",
    image: "assets/img/gallery/photo_2025-11-19_10-48-22.jpg",
    year: "2025",
    date: "2025-11-19",
    location: "Paris",
    category: "bins",
    caption: "Oh, another piece of art!",
    alt: "An overflowing street bin between two bollards, a black bag and flattened beer cartons on the pavement"
  },
  {
    title: "Red umbrella",
    image: "assets/img/gallery/photo_2025-10-13_10-51-22.jpg",
    year: "2025",
    date: "2025-10-13",
    location: "Saint-Michel-Notre-Dame",
    category: "objects",
    caption: "Even the trash is protected from the autumn rain.",
    alt: "An open red umbrella stuck in a metal street bin"
  },
  {
    title: "After the party",
    image: "assets/img/gallery/photo_2025-09-11_13-30-12.jpg",
    year: "2025",
    date: "2025-09-11",
    location: "Saint-Michel-Notre-Dame",
    category: "leftovers",
    caption: "Lots of fun and lots of trash!",
    alt: "Dozens of empty wine and beer bottles lined up on the pavement next to a street bin"
  },

  // — 2024 —
  {
    title: "Garbage",
    image: "assets/img/gallery/photo_2024-09-15_22-35-06.jpg",
    year: "2024",
    date: "2024-09-15",
    location: "Paris",
    category: "bins",
    caption: "Just an ordinary garbage.",
    alt: "An overflowing street bin with cups and bottles on top, a black bag and a paper bag at its foot"
  },
  {
    title: "Bread and shoes",
    image: "assets/img/gallery/photo_2024-08-04_18-39-15.jpg",
    year: "2024",
    date: "2024-08-04",
    location: "Paris",
    category: "objects",
    caption: "Someone ran so fast that they left their baguettes and shoes behind!",
    alt: "White sneakers, baguettes and a paper bag of bread scattered on the pavement next to rubbish bags"
  },
  {
    title: "Add some pink",
    image: "assets/img/gallery/photo_2024-07-01_14-47-06.jpg",
    year: "2024",
    date: "2024-07-01",
    location: "1e arrondissement",
    category: "bins",
    caption: "Nobody will pay me for advertisement.",
    alt: "An overflowing street bin at night with a pink paper bag and a black bag beside it"
  },
  {
    title: "Business as usual",
    image: "assets/img/gallery/photo_2024-06-20_00-28-22.jpg",
    year: "2024",
    date: "2024-06-20",
    location: "Paris",
    category: "streets",
    caption: "Someone is always too busy to notice.",
    alt: "A full street bin and black rubbish bags on the pavement, a man in a suit checking his phone nearby"
  },

];

/*
  КАТЕГОРИИ — порядок, в котором показываются фильтры.
  В галерее появляются только те категории, у которых есть хотя бы одно фото.
  Если добавляешь новую категорию, добавь её также сюда.
*/

const CATEGORIES = [
  "bins",
  "streets",
  "leftovers",
  "signs",
  "objects",
  "accidents",
  "traces"
];
