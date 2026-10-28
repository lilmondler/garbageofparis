/*
  ============================================================
  GARBAGE OF PARIS — i18n.js
  ============================================================
  Три языка сайта: english, français, русский.
  Кнопка «en · fr · ru» — в шапке каждой страницы.
  Выбор запоминается в браузере.

  КАК ЭТО УСТРОЕНО:
  - Английский текст лежит прямо в HTML-страницах.
  - Французский и русский — здесь, в STRINGS.fr и STRINGS.ru.
  - В HTML у переводимого элемента есть метка data-i18n="ключ".
    Содержимое элемента заменяется текстом по этому ключу.
    data-i18n-aria="ключ"    — то же для aria-label (подсказки для незрячих)
    data-i18n-content="ключ" — то же для <meta name="description">
  - Манифест — три отдельных текста в manifesto.html
    (<article data-lang-block="en|fr|ru">), а не здесь.
  - Факты игры на странице curious — в assets/js/curious.js.

  КАК ПОПРАВИТЬ ПЕРЕВОД:
  найди ключ (например 'about.p1') в нужном языке и поменяй текст.
  Внутри текста можно использовать HTML: <b>, <i>, <br>, <span class="pos">.
  Если ключа нет в переводе — показывается английский текст.

  Названия и подписи к фото, места съёмки (data.js) не переводятся.

  Ссылки: ?lang=fr или ?lang=ru в адресе сразу открывают нужный язык,
  manifesto.html#fr / #ru — манифест на нужном языке.
  ============================================================
*/

(function () {
  'use strict';

  const LANGS = ['en', 'fr', 'ru'];
  const STORAGE_KEY = 'gop-lang';

  const STRINGS = {

    /* ==========================================================
       ENGLISH — только строки, которые собираются в скриптах.
       Остальной английский текст — в самих HTML-страницах.
       ========================================================== */
    en: {
      'menu.open': 'Open menu',
      'menu.close': 'Close menu',

      'lb.aria': 'Photograph viewer',
      'lb.close.aria': 'Close',
      'lb.close': 'close ×',
      'lb.prev.aria': 'Previous photograph',
      'lb.prev': '← prev',
      'lb.next.aria': 'Next photograph',
      'lb.next': 'next →',
      'photo.open': 'Open photograph: {title}',

      'filter.year.aria': 'Filter by year',
      'filter.year': 'year:',
      'filter.year.all': 'all',
      'filter.cat.aria': 'Filter by category',
      'filter.cat': 'what:',
      'filter.cat.all': 'everything',
      'finds': { one: '{n} find', other: '{n} finds' },
      'gallery.empty': 'Nothing here. Even the bins are empty.',
      'archive.pos': 'n., {cat}',

      'splash.kicker': 'dictionary of the street',
      'splash.struck': 'waste; refuse',

      'cat.bins': 'bins',
      'cat.streets': 'streets',
      'cat.leftovers': 'leftovers',
      'cat.signs': 'signs',
      'cat.objects': 'objects',
      'cat.accidents': 'accidents',
      'cat.traces': 'traces',

      'dig.count.done': 'the bin is empty! you found all 10.',
      'dig.count': '{found} / {total} found · {left} still inside. tap the bin!',
      'dig.find': 'find № {n} of {total}',
      'dig.done.kicker': 'the bin is empty',
      'dig.done.word': 'garbologist <span class="pos">n.</span>',
      'dig.done.text': 'A person who studies rubbish to understand how people live. That’s you now! You know about a hill made of jars, a king who hated mud, a man who became a bin, and a carpet with a job.',
      'dig.done.stamp': 'certified<br>garbologist',
      'dig.done.note': 'next time you pass a bin in Paris, look inside. just with your eyes.',
      'dig.again': 'Read again: {word}',
      'dig.notyet': 'not found yet',
      'dig.reset.kicker': 'all back inside',
      'dig.reset.word': 'again! <span class="pos">adv.</span>',
      'dig.reset.text': 'Everything is back in the bin. Tap it to start digging again.',
      'dig.reset.note': 'ready? tap the bin'
    },


    /* ==========================================================
       FRANÇAIS
       ========================================================== */
    fr: {
      /* --- общее: шапка, подвал --- */
      'skip': 'Aller au contenu',
      'nav.aria': 'Navigation principale',
      'nav.logo': 'Garbage of Paris — accueil',
      'nav.menu': 'menu',
      'nav.close': 'fermer ×',
      'nav.home': 'accueil',
      'nav.gallery': 'galerie',
      'nav.archive': 'archives',
      'nav.curious': 'curieux',
      'nav.manifesto': 'manifeste',
      'nav.about': 'à propos',
      'lang.aria': 'Langue',
      'menu.open': 'Ouvrir le menu',
      'menu.close': 'Fermer le menu',
      'footer.aria': 'Navigation du pied de page',
      'footer.pos': 'n., de Paris',
      'footer.struck': 'Ce dont personne ne veut.',
      'footer.hand': 'une sociologie visuelle du quotidien. Paris, 2022 — la collecte continue.',
      'footer.copy': '© Garbage of Paris. Photos : Snezhana et ses proches.',
      'top.aria': 'Retour en haut',
      'top': '↑ haut',

      /* --- главная --- */
      'index.title': 'Garbage of Paris — une sociologie visuelle des déchets',
      'index.desc': 'Garbage of Paris est un projet de sociologie visuelle sur les déchets, les traces urbaines et le quotidien à Paris. Photos de Snezhana.',
      'index.kicker': 'dictionnaire de la rue · Paris, 2022 —',
      'index.pos': 'n. angl., indénombrable',
      'index.pron': '/ˈɡɑːr.bɪdʒ/ &nbsp;·&nbsp; en français : <i>ordures, déchets, poubelle</i>',
      'index.sense': '1. Déchets ; choses que l’on jette.',
      'index.correction': 'l’intime rendu public,<br>le dedans mis dehors',
      'index.lede': 'Garbage of Paris est une sociologie visuelle des déchets, des traces et de la vie urbaine. Sacs, poubelles, taches, objets, signes — photographiés là où on les a laissés.',
      'index.evidence': 'voir les preuves →',
      'index.read': 'lire le manifeste',
      'index.usage.no': '§ 01 — usage',
      'index.usage.h': 'à propos du projet <span class="pos">loc.</span>',
      'index.usage.lead': 'Je m’appelle Snezhana. Ou Jane. Comme vous voulez. Je suis sociologue et je photographie des déchets.',
      'index.usage.p1': 'Voici donc Garbage of Paris. Sacs, poubelles, taches, objets, signes. L’intime rendu public. Le dedans mis dehors.',
      'index.usage.p2': 'L’interprétation est laissée à chacun.',
      'index.usage.note': '« Le déchet constitue un objet de contemplation idéal. »',
      'index.receipt.aria': 'L’archive en chiffres',
      'index.receipt.sub': 'inventaire · rue de partout',
      'index.receipt.photos': 'photos',
      'index.receipt.places': 'lieux',
      'index.receipt.cats': 'catégories',
      'index.receipt.latest': 'dernière trouvaille',
      'index.receipt.total': 'total payé',
      'index.receipt.thanks': 'merci · ni repris · ni échangé',
      'index.receipt.stamp': 'gratuit !',
      'index.latest.no': '§ 02 — nouveautés',
      'index.latest.h': 'trouvailles fraîches <span class="pos">n. f. pl.</span>',
      'index.latest.all': 'les voir toutes →',
      'index.card.gallery': 'Toutes les photos, à filtrer par année et par catégorie.',
      'index.card.archive': 'Chaque trouvaille, classée par année. Un dictionnaire de la rue.',
      'index.card.curious': 'Fouille une poubelle parisienne et découvre d’où viennent les déchets. Pour les enfants.',
      'index.card.manifesto': 'Pour en savoir plus. En français, in English и по-русски.',
      'index.card.open': 'ouvrir →',
      'index.card.play': 'jouer →',
      'index.card.read': 'lire →',

      /* --- галерея --- */
      'gallery.title': 'Galerie — Garbage of Paris',
      'gallery.desc': 'Galerie de photos des déchets, des traces urbaines et des objets du quotidien à Paris.',
      'gallery.kicker': '§ 03 · photographies',
      'gallery.h1': 'galerie <span class="pos">n. f.</span>',
      'gallery.def': '<b>1.</b>Une collection d’observations urbaines, épinglées au mur.',
      'gallery.note': 'cliquez sur une photo pour la voir de plus près ↓',

      /* --- архив --- */
      'archive.title': 'Archives — Garbage of Paris',
      'archive.desc': 'Archives des observations urbaines, classées par année. Un dictionnaire des déchets, des traces et des objets de Paris.',
      'archive.kicker': '§ 04 · carnet de terrain',
      'archive.h1': 'archives <span class="pos">n. f. pl.</span>',
      'archive.def': '<b>1.</b>Toutes les observations, par ordre chronologique. Le déchet comme preuve. La ville comme document.',
      'archive.note': 'chaque trouvaille a un numéro, une date et un lieu',

      /* --- игра curious --- */
      'curious.title': 'Curieux — Garbage of Paris',
      'curious.desc': 'Sors des objets d’une poubelle parisienne interactive et découvre l’histoire des déchets : Eugène Poubelle, les chiffonniers, une colline faite de jarres et plus encore.',
      'curious.kicker': '§ 07 · pour les esprits curieux de tout âge',
      'curious.h1': 'curieux <span class="pos">adj.</span>',
      'curious.def': '<b>1.</b>Qui veut savoir ce qu’il y a à l’intérieur des choses. Surtout des poubelles.',
      'curious.note': 'touche la poubelle et sors-en quelque chose ↓',
      'curious.bin': 'Sortir quelque chose de la poubelle',
      'curious.count': '10 choses à l’intérieur. touche la poubelle !',
      'curious.intro.kicker': 'comment jouer',
      'curious.intro.word': 'fouiller <span class="pos">v.</span>',
      'curious.intro.text': 'Dix choses se cachent dans cette poubelle parisienne. Chacune raconte une histoire de déchets — de la Rome antique à aujourd’hui. Touche la poubelle, sors-les une par une et deviens un vrai <b>rudologue</b> (oui, ce mot existe : c’est quelqu’un qui étudie les déchets !).',
      'curious.intro.note': 'prêt ? touche la poubelle ←',
      'curious.timeline.no': '§ 07.2 — frise',
      'curious.timeline.h': 'à travers le temps <span class="pos">loc. adv.</span>',
      'curious.reset': 'tout remettre dans la poubelle ↺',
      'curious.hint': 'Tout ce que tu sors prend sa place dans l’histoire. Touche une trouvaille pour la relire.',
      'curious.sources.kicker': 'd’où ça vient',
      'curious.sources': 'Faits vérifiés dans des encyclopédies et des sources publiques, par exemple <a href="https://fr.wikipedia.org/wiki/Eug%C3%A8ne_Poubelle" target="_blank" rel="noopener">Eugène Poubelle</a>, <a href="https://fr.wikipedia.org/wiki/Monte_Testaccio" target="_blank" rel="noopener">Monte Testaccio</a>, <a href="https://fr.wikipedia.org/wiki/Chiffonnier" target="_blank" rel="noopener">Chiffonnier</a> et la Ville de Paris. Certaines vieilles histoires (comme celle du roi et de la boue puante) sont des légendes que les chroniqueurs aimaient raconter — nous le disons quand c’est le cas.',

      'dig.count.done': 'la poubelle est vide ! tu as trouvé les 10.',
      'dig.count': '{found} / {total} trouvées · encore {left} dedans. touche la poubelle !',
      'dig.find': 'trouvaille n° {n} sur {total}',
      'dig.done.kicker': 'la poubelle est vide',
      'dig.done.word': 'rudologue <span class="pos">n.</span>',
      'dig.done.text': 'Quelqu’un qui étudie les déchets pour comprendre comment vivent les gens. C’est toi, maintenant ! Tu connais une colline faite de jarres, un roi qui détestait la boue, un homme devenu poubelle et un tapis qui a un métier.',
      'dig.done.stamp': 'rudologue<br>certifié',
      'dig.done.note': 'la prochaine fois que tu passes devant une poubelle à Paris, regarde dedans. juste avec les yeux.',
      'dig.again': 'Relire : {word}',
      'dig.notyet': 'pas encore trouvé',
      'dig.reset.kicker': 'tout est rentré',
      'dig.reset.word': 'encore ! <span class="pos">adv.</span>',
      'dig.reset.text': 'Tout est de retour dans la poubelle. Touche-la pour recommencer à fouiller.',
      'dig.reset.note': 'prêt ? touche la poubelle',

      /* --- манифест (сам текст — в manifesto.html) --- */
      'manifesto.title': 'Manifeste — Garbage of Paris',
      'manifesto.desc': 'Le déchet comme objet culturel. Un manifeste sur les déchets, les traces urbaines et la culture matérielle à Paris.',
      'manifesto.kicker': '§ 05 · position',
      'manifesto.h1': 'manifeste <span class="pos">n. m.</span>',
      'manifesto.def': 'Déclaration publique d’intentions et de principes.',
      'manifesto.correction': 'plutôt une moquerie du genre',

      /* --- обо мне --- */
      'about.title': 'À propos — Garbage of Paris',
      'about.desc': 'À propos de Garbage of Paris — un projet de sociologie visuelle de Snezhana (Jane) sur les déchets, les traces et le quotidien à Paris.',
      'about.kicker': '§ 06 · qui et pourquoi',
      'about.h1': 'à propos <span class="pos">loc. adv.</span>',
      'about.def': '<b>1.</b>Une sociologue, l’appareil photo d’un téléphone et les rues de Paris.',
      'about.note': 'coucou ! c’est moi →',
      'about.card.name': 'nom',
      'about.card.name.v': 'Snezhana (ou Jane)',
      'about.card.role': 'rôle',
      'about.card.role.v': 'étudiante en sociologie, photographe de déchets, observatrice',
      'about.card.based': 'basée à',
      'about.card.based.v': 'Paris',
      'about.h.who': '<span>1.</span> qui suis-je ?',
      'about.who.1': 'Je m’appelle Snezhana. Ou Jane. Comme vous voulez. Je suis sociologue, je vis à Paris et je photographie des déchets.',
      'about.who.2': 'Je me demandais simplement… Qu’est-ce que les gens jettent ? Et qu’est-ce que cela dit de nous ?',
      'about.h.project': '<span>2.</span> le projet',
      'about.project.1': 'Garbage of Paris a commencé en 2022 comme une pratique d’observation personnelle, avant de devenir une archive publique. Je ne suis pas photographe professionnelle et je ne cherche pas la perfection.',
      'about.project.2': 'Ce qui m’intéresse vraiment, c’est la façon dont les choses que nous jetons deviennent une part invisible de notre quotidien.',
      'about.project.3': 'Le projet se situe entre la sociologie visuelle, l’ethnographie urbaine et ce que certains appelleraient une pratique d’art contemporain — même si je ne tiens à aucune de ces catégories. Les photos existent. Vous pouvez les regarder, ou pas.',
      'about.h.method': '<span>3.</span> la méthode',
      'about.method.1': 'J’ai toujours regardé vers le haut, dans tous les sens du terme. Mais un jour, quelque chose s’est passé, et j’ai baissé les yeux. Désormais, dès que je remarque des déchets, je les prends aussitôt en photo.',
      'about.method.2': 'Chaque photo de cette archive a une date et un lieu, parce que le lieu et le moment comptent. Un déchet est toujours unique. Aussi unique que chaque promenade.',
      'about.h.not': '<span>4.</span> ce que ce n’est pas',
      'about.not.1': 'Ce n’est pas un projet sérieux ni rigoureux sur le plan méthodologique. J’écris déjà des travaux de recherche et j’adore la sociologie. C’est peut-être plutôt un exercice d’observation ? Mes amis et ma famille m’envoient déjà des photos de poubelles — que me faut-il de plus pour être heureuse ?',
      'about.quote': '« Comme les gens, les déchets aiment rester près d’autres déchets. »',
      'about.read': 'lire le manifeste',
      'about.gallery': 'voir la galerie →',

      /* --- 404 --- */
      '404.title': 'Introuvable — Garbage of Paris',
      '404.desc': 'Cette page a été jetée.',
      '404.kicker': 'erreur 404 · page introuvable',
      '404.h1': 'cette page <span class="pos">n. f.</span>',
      '404.sense': '1. Un document qui existe à cette adresse.',
      '404.correction': 'jetée. la poubelle est vide.',
      '404.home': 'retour à l’accueil',
      '404.gallery': 'voir la galerie →',

      /* --- строки из скриптов --- */
      'lb.aria': 'Visionneuse de photos',
      'lb.close.aria': 'Fermer',
      'lb.close': 'fermer ×',
      'lb.prev.aria': 'Photo précédente',
      'lb.prev': '← préc.',
      'lb.next.aria': 'Photo suivante',
      'lb.next': 'suiv. →',
      'photo.open': 'Ouvrir la photo : {title}',
      'filter.year.aria': 'Filtrer par année',
      'filter.year': 'année :',
      'filter.year.all': 'toutes',
      'filter.cat.aria': 'Filtrer par catégorie',
      'filter.cat': 'quoi :',
      'filter.cat.all': 'tout',
      'finds': { one: '{n} trouvaille', other: '{n} trouvailles' },
      'gallery.empty': 'Rien ici. Même les poubelles sont vides.',
      'archive.pos': 'n., {cat}',
      'splash.kicker': 'dictionnaire de la rue',
      'splash.struck': 'déchets ; ordures',

      'cat.bins': 'poubelles',
      'cat.streets': 'rues',
      'cat.leftovers': 'restes',
      'cat.signs': 'signes',
      'cat.objects': 'objets',
      'cat.accidents': 'accidents',
      'cat.traces': 'traces'
    },


    /* ==========================================================
       РУССКИЙ
       ========================================================== */
    ru: {
      /* --- общее: шапка, подвал --- */
      'skip': 'Перейти к содержанию',
      'nav.aria': 'Главное меню',
      'nav.logo': 'Garbage of Paris — на главную',
      'nav.menu': 'меню',
      'nav.close': 'закрыть ×',
      'nav.home': 'главная',
      'nav.gallery': 'галерея',
      'nav.archive': 'архив',
      'nav.curious': 'любопытное',
      'nav.manifesto': 'манифест',
      'nav.about': 'обо мне',
      'lang.aria': 'Язык',
      'menu.open': 'Открыть меню',
      'menu.close': 'Закрыть меню',
      'footer.aria': 'Меню в подвале сайта',
      'footer.pos': 'сущ., парижский',
      'footer.struck': 'То, что никому не нужно.',
      'footer.hand': 'визуальная социология повседневности. Париж, 2022 — сбор продолжается.',
      'footer.copy': '© Garbage of Paris. Фото: Снежана и близкие люди.',
      'top.aria': 'Наверх',
      'top': '↑ наверх',

      /* --- главная --- */
      'index.title': 'Garbage of Paris — визуальная социология мусора',
      'index.desc': 'Garbage of Paris — проект визуальной социологии о мусоре, городских следах и повседневной жизни Парижа. Фото: Снежана.',
      'index.kicker': 'словарь улицы · Париж, 2022 —',
      'index.pos': 'англ. сущ., неисч.',
      'index.pron': '/ˈɡɑːr.bɪdʒ/ &nbsp;·&nbsp; по-русски: <i>мусор, отбросы, помойка</i>',
      'index.sense': '1. Отходы; то, что выбрасывают.',
      'index.correction': 'личное, ставшее публичным,<br>внутреннее, вынесенное наружу',
      'index.lede': 'Garbage of Paris — визуальная социология мусора, следов и городской жизни. Пакеты, урны, пятна, вещи, знаки — сфотографированные там, где их оставили.',
      'index.evidence': 'смотреть улики →',
      'index.read': 'читать манифест',
      'index.signature': 'Снежана',
      'index.usage.no': '§ 01 — употребление',
      'index.usage.h': 'о проекте <span class="pos">словосоч.</span>',
      'index.usage.lead': 'Меня зовут Снежана. Или Джейн. Как вам удобнее. Я социолог и фотографирую мусор.',
      'index.usage.p1': 'Итак, это Garbage of Paris. Пакеты, урны, пятна, вещи, знаки. Личное, ставшее публичным. Внутреннее, вынесенное наружу.',
      'index.usage.p2': 'Интерпретации остаются за зрителем.',
      'index.usage.note': '«Мусор — идеальный объект для созерцания».',
      'index.receipt.aria': 'Архив в цифрах',
      'index.receipt.sub': 'инвентаризация · rue de partout',
      'index.receipt.photos': 'фотографий',
      'index.receipt.places': 'мест',
      'index.receipt.cats': 'категорий',
      'index.receipt.latest': 'последняя находка',
      'index.receipt.total': 'итого оплачено',
      'index.receipt.thanks': 'merci · обмену и возврату не подлежит',
      'index.receipt.stamp': 'даром!',
      'index.latest.no': '§ 02 — свежее',
      'index.latest.h': 'свежие находки <span class="pos">сущ., мн.</span>',
      'index.latest.all': 'смотреть все →',
      'index.card.gallery': 'Все фотографии с фильтром по году и категории.',
      'index.card.archive': 'Все находки по годам. Словарь улицы.',
      'index.card.curious': 'Пороемся в парижской урне и узнаем, откуда берётся мусор. Интересно детям.',
      'index.card.manifesto': 'Если хочется узнать больше. По-русски, in English et en français.',
      'index.card.open': 'открыть →',
      'index.card.play': 'играть →',
      'index.card.read': 'читать →',

      /* --- галерея --- */
      'gallery.title': 'Галерея — Garbage of Paris',
      'gallery.desc': 'Галерея фотографий мусора, городских следов и повседневных вещей Парижа.',
      'gallery.kicker': '§ 03 · фотографии',
      'gallery.h1': 'галерея <span class="pos">ж.</span>',
      'gallery.def': '<b>1.</b>Коллекция городских наблюдений, приколотых к стене.',
      'gallery.note': 'нажмите на фото, чтобы рассмотреть поближе ↓',

      /* --- архив --- */
      'archive.title': 'Архив — Garbage of Paris',
      'archive.desc': 'Архив городских наблюдений по годам. Словарь мусора, следов и вещей Парижа.',
      'archive.kicker': '§ 04 · полевой дневник',
      'archive.h1': 'архив <span class="pos">м.</span>',
      'archive.def': '<b>1.</b>Все наблюдения в хронологическом порядке. Мусор как улика. Город как документ.',
      'archive.note': 'у каждой находки есть номер, дата и место',

      /* --- игра curious --- */
      'curious.title': 'Любопытное — Garbage of Paris',
      'curious.desc': 'Доставай вещи из интерактивной парижской урны и узнавай историю мусора: Эжен Пубель, тряпичники, холм из кувшинов и многое другое.',
      'curious.kicker': '§ 07 · для любопытных любого возраста',
      'curious.h1': 'любопытное <span class="pos">прил.</span>',
      'curious.def': '<b>1.</b>То, от чего хочется узнать, что внутри. Особенно внутри урны.',
      'curious.note': 'нажми на урну и достань что-нибудь ↓',
      'curious.bin': 'Достать что-нибудь из урны',
      'curious.count': 'внутри 10 вещей. нажми на урну!',
      'curious.intro.kicker': 'как играть',
      'curious.intro.word': 'рыться <span class="pos">гл.</span>',
      'curious.intro.text': 'В этой парижской урне спрятались десять вещей. У каждой есть своя история про мусор — от Древнего Рима до наших дней. Нажимай на урну, доставай их по одной и стань настоящим <b>гарбологом</b> (да, такое слово правда есть: так называют человека, который изучает мусор!).',
      'curious.intro.note': 'поехали? нажми на урну ←',
      'curious.timeline.no': '§ 07.2 — хронология',
      'curious.timeline.h': 'сквозь время <span class="pos">нареч. оборот</span>',
      'curious.reset': 'сложить всё обратно в урну ↺',
      'curious.hint': 'Всё, что ты достаёшь, встаёт на своё место в истории. Нажми на находку, чтобы прочитать о ней снова.',
      'curious.sources.kicker': 'откуда это всё',
      'curious.sources': 'Факты сверены с энциклопедиями и открытыми источниками, например: <a href="https://en.wikipedia.org/wiki/Eug%C3%A8ne_Poubelle" target="_blank" rel="noopener">Эжен Пубель</a>, <a href="https://en.wikipedia.org/wiki/Monte_Testaccio" target="_blank" rel="noopener">Монте-Тестаччо</a>, <a href="https://fr.wikipedia.org/wiki/Chiffonnier" target="_blank" rel="noopener">тряпичники (chiffonniers)</a> и мэрия Парижа. Некоторые старые истории (например, про короля и вонючую грязь) — легенды, которые любили пересказывать летописцы. Мы всегда предупреждаем, когда это так.',

      'dig.count.done': 'урна пуста! все 10 вещей найдены.',
      'dig.count': 'найдено {found} из {total} · внутри ещё {left}. нажми на урну!',
      'dig.find': 'находка № {n} из {total}',
      'dig.done.kicker': 'урна пуста',
      'dig.done.word': 'гарболог <span class="pos">м.</span>',
      'dig.done.text': 'Человек, который изучает мусор, чтобы понять, как живут люди. Теперь это ты! Ты знаешь про холм из кувшинов, короля, который терпеть не мог грязь, человека, который стал урной, и коврик, у которого есть работа.',
      'dig.done.stamp': 'дипломированный<br>гарболог',
      'dig.done.note': 'в следующий раз, проходя мимо урны в Париже, загляни внутрь. только глазами.',
      'dig.again': 'Прочитать снова: {word}',
      'dig.notyet': 'ещё не найдено',
      'dig.reset.kicker': 'всё снова внутри',
      'dig.reset.word': 'ещё раз! <span class="pos">нареч.</span>',
      'dig.reset.text': 'Всё снова лежит в урне. Нажми на неё, чтобы начать сначала.',
      'dig.reset.note': 'поехали? нажми на урну',

      /* --- манифест (сам текст — в manifesto.html) --- */
      'manifesto.title': 'Манифест — Garbage of Paris',
      'manifesto.desc': 'Мусор как объект культуры. Манифест об отходах, городских следах и материальной культуре Парижа.',
      'manifesto.kicker': '§ 05 · позиция',
      'manifesto.h1': 'манифест <span class="pos">м.</span>',
      'manifesto.def': 'Публичное заявление о взглядах и целях.',
      'manifesto.correction': 'скорее издевка над жанром',

      /* --- обо мне --- */
      'about.title': 'Обо мне — Garbage of Paris',
      'about.desc': 'О проекте Garbage of Paris — визуальная социология Снежаны (Джейн): мусор, следы и повседневная жизнь Парижа.',
      'about.kicker': '§ 06 · кто и зачем',
      'about.h1': 'обо мне <span class="pos">предл. + мест.</span>',
      'about.def': '<b>1.</b>Социолог, камера телефона и улицы Парижа.',
      'about.note': 'привет! это я →',
      'about.card.name': 'имя',
      'about.card.name.v': 'Снежана (или Джейн)',
      'about.card.role': 'кто',
      'about.card.role.v': 'студентка-социолог, фотограф мусора, наблюдательница',
      'about.card.based': 'где',
      'about.card.based.v': 'Париж',
      'about.h.who': '<span>1.</span> кто я?',
      'about.who.1': 'Меня зовут Снежана. Или Джейн. Как вам удобнее. Я социолог, живу в Париже и фотографирую мусор.',
      'about.who.2': 'Мне просто стало интересно… Что люди выбрасывают? И что это говорит о нас?',
      'about.h.project': '<span>2.</span> проект',
      'about.project.1': 'Garbage of Paris начался в 2022 году как личная практика наблюдения и стал публичным архивом. Я не профессиональный фотограф и не стремлюсь к совершенству.',
      'about.project.2': 'Что меня действительно интересует — то, как вещи, которые мы выбрасываем, становятся невидимой частью нашей повседневной жизни.',
      'about.project.3': 'Проект находится где-то между визуальной социологией, городской этнографией и тем, что кто-то назвал бы практикой современного искусства, — хотя я не держусь ни за одну из этих категорий. Фотографии существуют. На них можно смотреть, а можно и не смотреть.',
      'about.h.method': '<span>3.</span> метод',
      'about.method.1': 'Я всегда смотрела вверх — во всех смыслах. Но однажды что-то случилось, и я посмотрела вниз. Теперь, как только я замечаю мусор, я сразу же его фотографирую.',
      'about.method.2': 'У каждой фотографии в архиве есть дата и место, потому что место и время важны. Мусор всегда уникален. Так же уникален, как каждая прогулка.',
      'about.h.not': '<span>4.</span> чем это не является',
      'about.not.1': 'Это не серьёзный и не методологически строгий проект. Научные работы я и так пишу, а социологию люблю. Может быть, это скорее упражнение в наблюдении? Друзья и семья уже присылают мне фотографии мусорных баков — что ещё нужно для счастья?',
      'about.quote': '«Как и люди, мусор старается держаться поближе к другому мусору».',
      'about.read': 'читать манифест',
      'about.gallery': 'смотреть галерею →',

      /* --- 404 --- */
      '404.title': 'Не найдено — Garbage of Paris',
      '404.desc': 'Эту страницу выбросили.',
      '404.kicker': 'ошибка 404 · страница не найдена',
      '404.h1': 'эта страница <span class="pos">ж.</span>',
      '404.sense': '1. Документ, который существует по этому адресу.',
      '404.correction': 'выброшена. урна пуста.',
      '404.home': 'на главную',
      '404.gallery': 'смотреть галерею →',

      /* --- строки из скриптов --- */
      'lb.aria': 'Просмотр фотографий',
      'lb.close.aria': 'Закрыть',
      'lb.close': 'закрыть ×',
      'lb.prev.aria': 'Предыдущая фотография',
      'lb.prev': '← назад',
      'lb.next.aria': 'Следующая фотография',
      'lb.next': 'дальше →',
      'photo.open': 'Открыть фото: {title}',
      'filter.year.aria': 'Фильтр по году',
      'filter.year': 'год:',
      'filter.year.all': 'все',
      'filter.cat.aria': 'Фильтр по категории',
      'filter.cat': 'что:',
      'filter.cat.all': 'всё',
      'finds': { one: '{n} находка', few: '{n} находки', many: '{n} находок', other: '{n} находки' },
      'gallery.empty': 'Здесь пусто. Даже урны пустые.',
      'archive.pos': 'сущ., {cat}',
      'splash.kicker': 'словарь улицы',
      'splash.struck': 'отходы; отбросы',

      'cat.bins': 'урны',
      'cat.streets': 'улицы',
      'cat.leftovers': 'остатки',
      'cat.signs': 'знаки',
      'cat.objects': 'вещи',
      'cat.accidents': 'происшествия',
      'cat.traces': 'следы'
    }
  };


  /* ============================================================
     Ниже — механика. Тексты выше.
     ============================================================ */

  function safeStorage(action, value) {
    try {
      return action === 'get' ? localStorage.getItem(STORAGE_KEY) : localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      return null;
    }
  }

  // Язык при загрузке: ?lang= в адресе → #fr/#ru на манифесте → сохранённый выбор → английский
  function initialLang() {
    let fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) { /* старые браузеры */ }
    if (LANGS.includes(fromUrl)) {
      safeStorage('set', fromUrl);
      return fromUrl;
    }
    const hash = location.hash.replace('#', '');
    if (LANGS.includes(hash) && document.querySelector('[data-lang-block]')) {
      safeStorage('set', hash);
      return hash;
    }
    const saved = safeStorage('get');
    return LANGS.includes(saved) ? saved : 'en';
  }

  let lang = initialLang();

  // Оригинальный английский текст из HTML — чтобы вернуться к нему без перезагрузки
  const originals = new Map();
  function original(el, attr) {
    if (!originals.has(el)) originals.set(el, {});
    const store = originals.get(el);
    if (!(attr in store)) store[attr] = attr === 'html' ? el.innerHTML : el.getAttribute(attr);
    return store[attr];
  }

  function lookup(key) {
    const dict = STRINGS[lang] || {};
    if (key in dict) return dict[key];
    return lang === 'en' ? undefined : STRINGS.en[key];
  }

  // t('finds', { n: 3 }) → «3 находки»
  function t(key, vars) {
    let value = lookup(key);
    if (value === undefined) value = STRINGS.en[key];
    if (value === undefined) return key;
    if (typeof value === 'object') {
      let form = 'other';
      try { form = new Intl.PluralRules(lang).select(vars && vars.n); } catch (e) { /* без Intl */ }
      value = value[form] || value.other;
    }
    return String(value).replace(/\{(\w+)\}/g, (m, name) =>
      vars && vars[name] != null ? vars[name] : m);
  }

  function category(name) {
    const key = 'cat.' + name;
    const value = t(key);
    return value === key ? name : value;
  }

  // Для текстов вида { en: '…', fr: '…', ru: '…' } (факты на странице curious)
  function pick(obj) {
    if (obj == null || typeof obj !== 'object') return obj;
    return obj[lang] != null ? obj[lang] : obj.en;
  }

  function apply() {
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const base = original(el, 'html');
      const value = lang === 'en' ? undefined : (STRINGS[lang] || {})[el.dataset.i18n];
      el.innerHTML = typeof value === 'string' ? value : base;
    });

    [['data-i18n-aria', 'aria-label'], ['data-i18n-content', 'content']].forEach(([marker, attr]) => {
      document.querySelectorAll('[' + marker + ']').forEach(el => {
        const base = original(el, attr);
        const value = lang === 'en' ? undefined : (STRINGS[lang] || {})[el.getAttribute(marker)];
        el.setAttribute(attr, typeof value === 'string' ? value : base);
      });
    });

    // Блоки, написанные целиком на одном языке (манифест)
    document.querySelectorAll('[data-lang-block]').forEach(el => {
      const on = el.dataset.langBlock === lang;
      el.hidden = !on;
      el.classList.toggle('active', on);
    });

    // Кнопки переключателя
    document.querySelectorAll('[data-set-lang]').forEach(b => {
      const on = b.dataset.setLang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    safeStorage('set', lang);

    // Чтобы в адресе не оставался старый язык
    try {
      const url = new URL(location.href);
      let changed = false;
      if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); changed = true; }
      if (document.querySelector('[data-lang-block]') && LANGS.includes(url.hash.slice(1))) {
        url.hash = lang;
        changed = true;
      }
      if (changed) history.replaceState(null, '', url);
    } catch (e) { /* file:// и т.п. — не страшно */ }

    apply();
    document.dispatchEvent(new CustomEvent('gop:langchange', { detail: { lang } }));
  }

  window.I18N = {
    get lang() { return lang; },
    t: t,
    category: category,
    pick: pick,
    set: setLang
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-set-lang]');
    if (b) setLang(b.dataset.setLang);
  });

  // Скрипт подключён в конце <body>: страница уже прочитана — переводим сразу,
  // чтобы английский текст не мелькал перед переводом
  function start() {
    document.querySelectorAll('.lang-switch[hidden]').forEach(el => { el.hidden = false; });
    apply();
  }
  start();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
})();
