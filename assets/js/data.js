/*
  ============================================================
  GARBAGE OF PARIS — data.js
  ============================================================

  Это главный файл данных. Все фотографии хранятся здесь.

  КАК ДОБАВИТЬ НОВОЕ ФОТО:
  1. Загрузи изображение в папку assets/img/gallery/
  2. Скопируй один объект ниже и добавь его В НАЧАЛО массива
  3. Сохрани файл — галерея, архив и главная обновятся сами

  ПОЛЯ:
  - title:    короткое название (показывается в галерее)
  - image:    путь к файлу от корня сайта
  - year:     "2024" или "2025" — используется для фильтров
  - date:     "2025-05-12" — ISO формат, для сортировки
  - location: район или адрес в Париже
  - category: одна из: bins / streets / leftovers / signs / objects / accidents / traces
  - caption:  подпись к фото (одна-две фразы)
  - alt:      описание для скринридеров (accessibility)

  ПОРЯДОК: сначала самые свежие фотографии.
  Сортировка по дате происходит автоматически.
  ============================================================
*/

const photos = [

  // — ПРИМЕР 2025 —
  {
    title: "J'adore le cinéma!",
    image: "assets/img/gallery/photo_2026-04-06_19-26-28.jpg",
    year: "2026",
    date: "2026-04-06",
    location: "Stalingrad",
    category: "bins",
    caption: "A whole lot of popcorn!",
    alt: "popcorn"
  },
  {
    title: "Nike shoe",
    image: "assets/img/gallery/photo_2025-12-30_19-50-29.jpg",
    year: "2025",
    date: "2025-12-30",
    location: "Madeleine",
    category: "objects",
    caption: "Someone ran off wearing just one shoe!",
    alt: " Merry Christmas"
  },
  {
    title: "Red Umbrella",
    image: "assets/img/gallery/photo_2025-10-13_10-51-22.jpg",
    year: "2025",
    date: "2025-10-13",
    location: "Saint-Michel-Notre-Dame",
    category: "signs",
    caption: "Even the trash is protected from the autumn rain",
    alt: "umbrella"
  },
  {
    title: "Some basic trash",
    image: "assets/img/gallery/photo_2025-11-19_10-48-22.jpg",
    year: "2025",
    date: "2025-11-19",
    location: "Paris",
    category: "bins",
    caption: "Oh, another piece of art!",
    alt: "trash"
  },
  {
    title: "After the party",
    image: "assets/img/gallery/photo_2025-09-11_13-30-12.jpg",
    year: "2025",
    date: "2025-09-11",
    location: "Saint-Michel-Notre-Dame",
    category: "objects",
    caption: "Lots of fun and lots of trash!",
    alt: "bottles"
  },
  {
    title: "Cis men",
    image: "assets/img/gallery/photo_2025-12-20_16-36-12.jpg",
    year: "2025",
    date: "2025-12-20",
    location: "Paris",
    category: "bins",
    caption: "A bin can be a statement",
    alt: "Statement"
  },

  // — ПРИМЕР 2024 —
  {
    title: "Upper-class x Paris's Trash",
    image: "assets/img/gallery/photo_2024-06-20_00-28-22.jpg",
    year: "2024",
    date: "2025-06-20",
    location: "2e arrondissement",
    category: "bins",
    caption: "The key is to always look up",
    alt: "The key is to always look up"
  },
  {
    title: "Bread and shoes",
    image: "assets/img/gallery/photo_2024-08-04_18-39-15.jpg",
    year: "2024",
    date: "2024-08-04",
    location: "Paris",
    category: "objects",
    caption: "bread and shoes",
    alt: "Someone ran so fast that they left their baguettes and shoes behind!"
  },
  {
    title: "Add some pink",
    image: "assets/img/gallery/photo_2024-07-01_14-47-06.jpg",
    year: "2024",
    date: "2024-07-01",
    location: "1e arrondissement",
    category: "bins",
    caption: "Nobody will pay me for advertisement",
    alt: "some trash"
  },

];

/*
  КАТЕГОРИИ — не меняй названия, если хочешь, чтобы фильтры работали.
  Если добавляешь новую категорию, добавь её также в массив CATEGORIES ниже.
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
