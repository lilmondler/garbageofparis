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
    title: "After the market",
    image: "assets/img/gallery/placeholder-2.jpg",
    year: "2025",
    date: "2025-04-27",
    location: "Marché d'Aligre",
    category: "leftovers",
    caption: "What the market leaves behind. A still life that nobody arranged.",
    alt: "Leftover produce and boxes after a Paris street market"
  },
  {
    title: "Official notice",
    image: "assets/img/gallery/placeholder-3.jpg",
    year: "2025",
    date: "2025-03-08",
    location: "20e arrondissement",
    category: "signs",
    caption: "A sign explaining how to sort your waste correctly. The bins next to it contain everything mixed together.",
    alt: "Waste sorting instructions sign next to unsorted bins in Paris"
  },
  {
    title: "Sofa, Tuesday",
    image: "assets/img/gallery/placeholder-4.jpg",
    year: "2025",
    date: "2025-02-18",
    location: "18e arrondissement",
    category: "objects",
    caption: "Someone's sofa, Tuesday morning. By afternoon it was gone. By Wednesday, forgotten.",
    alt: "Abandoned sofa on a Paris sidewalk"
  },
  {
    title: "Traces",
    image: "assets/img/gallery/placeholder-5.jpg",
    year: "2025",
    date: "2025-01-30",
    location: "Canal Saint-Martin",
    category: "traces",
    caption: "The pavement records everything. Rain doesn't wash it all away.",
    alt: "Stains and traces on Paris pavement near Canal Saint-Martin"
  },

  // — ПРИМЕР 2024 —
  {
    title: "Bin at dusk",
    image: "assets/img/gallery/placeholder-6.jpg",
    year: "2024",
    date: "2024-11-14",
    location: "5e arrondissement",
    category: "bins",
    caption: "The light at dusk makes everything look more considered than it is.",
    alt: "Paris garbage bin photographed at dusk"
  },
  {
    title: "Accident on rue de la Roquette",
    image: "assets/img/gallery/placeholder-7.jpg",
    year: "2024",
    date: "2024-09-22",
    location: "Rue de la Roquette",
    category: "accidents",
    caption: "A bag broke mid-route. The contents form an unintended map.",
    alt: "Broken garbage bag contents spilled on Paris street"
  },
  {
    title: "Street corner archive",
    image: "assets/img/gallery/placeholder-8.jpg",
    year: "2024",
    date: "2024-07-05",
    location: "Belleville",
    category: "streets",
    caption: "Every corner is an archive. Most of it goes uncollected.",
    alt: "Garbage and objects accumulated at a Paris street corner in Belleville"
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
