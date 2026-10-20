/*
  ============================================================
  GARBAGE OF PARIS — data-format.js
  ============================================================
  Читает и записывает файл assets/js/data.js.
  Используется страницей studio.html (добавление фото).
  На самом сайте этот файл не подключается.
  ============================================================
*/

(function (root) {
  'use strict';

  var FIELDS = ['title', 'image', 'date', 'location', 'category', 'caption', 'alt'];

  var HEADER = [
    '/*',
    '  ============================================================',
    '  GARBAGE OF PARIS — data.js',
    '  ============================================================',
    '',
    '  Это главный файл данных. Все фотографии хранятся здесь.',
    '',
    '  САМЫЙ ПРОСТОЙ СПОСОБ ДОБАВИТЬ ФОТО — страница studio.html',
    '  (garbageofparis.fr/studio.html): выбери фото, заполни поля,',
    '  нажми «Publish». Этот файл обновится сам.',
    '',
    '  ВРУЧНУЮ:',
    '  1. Загрузи изображение в папку assets/img/gallery/',
    '  2. Скопируй один блок { ... } ниже, вставь его и поменяй значения',
    '  3. Сохрани файл — галерея, архив и главная обновятся сами',
    '',
    '  ПОЛЯ:',
    '  - title:    короткое название',
    '  - image:    путь к файлу от корня сайта',
    '  - date:     дата съёмки "2025-05-12" (год — первые 4 цифры)',
    '  - location: район или адрес в Париже',
    '  - category: одна из категорий в списке CATEGORIES внизу файла',
    '  - caption:  подпись к фото (одна-две фразы)',
    '  - alt:      что изображено на фото — для незрячих читателей',
    '',
    '  Порядок в массиве не важен — сортировка по дате автоматическая.',
    '  Следи за запятыми между блоками и кавычками вокруг текста.',
    '  ============================================================',
    '*/',
    ''
  ].join('\n');

  function yearOf(p) {
    return String(p.year || (p.date || '').slice(0, 4) || '????');
  }

  // Превращает массив фото обратно в текст data.js
  function serializeData(photos, categories) {
    var sorted = photos.slice().sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });

    var out = [HEADER, 'const photos = ['];
    var lastYear = null;
    sorted.forEach(function (p, i) {
      var y = yearOf(p);
      if (y !== lastYear) {
        out.push('');
        out.push('  // — ' + y + ' —');
        lastYear = y;
      }
      var keys = FIELDS.concat(Object.keys(p).filter(function (k) {
        return FIELDS.indexOf(k) === -1 && k !== 'year' && p[k] !== undefined;
      }));
      var lines = keys.map(function (k) {
        return '    ' + k + ': ' + JSON.stringify(p[k] == null ? '' : p[k]);
      });
      out.push('  {');
      out.push(lines.join(',\n'));
      out.push('  }' + (i < sorted.length - 1 ? ',' : ''));
    });
    out.push('');
    out.push('];');
    out.push('');
    out.push('/*');
    out.push('  КАТЕГОРИИ — порядок, в котором показываются фильтры.');
    out.push('  В галерее появляются только категории, в которых есть фото.');
    out.push('  Новую категорию можно просто дописать в список.');
    out.push('*/');
    out.push('');
    out.push('const CATEGORIES = [');
    out.push(categories.map(function (c) { return '  ' + JSON.stringify(c); }).join(',\n'));
    out.push('];');
    out.push('');
    return out.join('\n');
  }

  // Достаёт массивы из текста data.js
  function parseData(text) {
    /* eslint-disable no-new-func */
    var result = new Function(text + '\n;return { photos: photos, CATEGORIES: (typeof CATEGORIES !== "undefined" ? CATEGORIES : []) };')();
    return {
      photos: Array.isArray(result.photos) ? result.photos : [],
      categories: Array.isArray(result.CATEGORIES) ? result.CATEGORIES : []
    };
  }

  var api = { serializeData: serializeData, parseData: parseData, FIELDS: FIELDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GOPData = api;
})(this);
