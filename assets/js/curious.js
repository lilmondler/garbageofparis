/*
  ============================================================
  GARBAGE OF PARIS — curious.js
  ============================================================
  Интерактивная урна на странице curious.html:
  нажимаешь на урну → из неё вылетает предмет → открывается
  карточка с фактом о мусоре. Найденное встаёт на шкалу времени.

  КАК ДОБАВИТЬ ИЛИ ПОМЕНЯТЬ ФАКТ:
  поправь текст в массиве FACTS ниже (en, fr, ru). Поле id — это id
  рисунка (<symbol id="o-..."> в curious.html), order — место на шкале.
  Остальные надписи игры — в assets/js/i18n.js (ключи dig.*).
  ============================================================
*/

(function () {
  'use strict';

  // Тексты фактов на трёх языках: { en, fr, ru }.
  // word — французское «словарное» слово, оно одинаковое для всех языков.
  const FACTS = [
    {
      id: 'o-amphora', order: 1,
      when: { en: '1st–3rd c.', fr: 'Ier–IIIe s.', ru: 'I–III вв.' },
      word: 'Monte Testaccio',
      pos: { en: 'n., a hill', fr: 'n. m., une colline', ru: 'сущ., холм' },
      text: {
        en: 'In Rome there is a hill made of rubbish! Monte Testaccio is about 35 metres tall and is made of tens of millions of broken clay jars. They once carried olive oil to the city and were thrown away almost 2,000 years ago.',
        fr: 'À Rome, il y a une colline faite de déchets ! Le Monte Testaccio mesure environ 35 mètres de haut et il est fait de dizaines de millions de jarres en terre cuite cassées. Elles apportaient autrefois de l’huile d’olive en ville et ont été jetées il y a presque 2 000 ans.',
        ru: 'В Риме есть холм из мусора! Монте-Тестаччо высотой около 35 метров, и он состоит из десятков миллионов разбитых глиняных кувшинов. Когда-то в них привозили в город оливковое масло, а выбросили их почти 2000 лет назад.'
      },
      note: {
        en: 'today archaeologists read it like a giant history book',
        fr: 'aujourd’hui, les archéologues la lisent comme un livre d’histoire géant',
        ru: 'сегодня археологи читают его, как огромную книгу по истории'
      }
    },
    {
      id: 'o-pave', order: 2,
      when: { en: '1185', fr: '1185', ru: '1185' },
      word: 'le pavé',
      pos: { en: 'n. m., cobblestone', fr: 'n. m.', ru: 'сущ., булыжник' },
      text: {
        en: 'The story goes that in 1185 King Philippe Auguste opened his palace window and almost fainted: carts were churning up stinking mud full of rubbish. So he ordered the main streets of Paris to be paved with stones.',
        fr: 'On raconte qu’en 1185, le roi Philippe Auguste ouvrit la fenêtre de son palais et faillit s’évanouir : les charrettes remuaient une boue puante pleine de déchets. Alors il ordonna de paver de pierres les grandes rues de Paris.',
        ru: 'Рассказывают, что в 1185 году король Филипп Август открыл окно своего дворца и чуть не упал в обморок: телеги месили вонючую грязь, полную мусора. И тогда он приказал вымостить главные улицы Парижа камнем.'
      },
      note: {
        en: 'a legend told by a chronicler of the king. smell → stones.',
        fr: 'une légende racontée par un chroniqueur du roi. odeur → pavés.',
        ru: 'легенда, которую записал летописец короля. вонь → камни.'
      }
    },
    {
      id: 'o-pot', order: 3,
      when: { en: 'Middle Ages', fr: 'Moyen Âge', ru: 'Средние века' },
      word: '« Gare à l’eau ! »',
      pos: { en: 'interj.', fr: 'interj.', ru: 'междом.' },
      text: {
        en: 'For centuries there were no toilets with pipes. People used a pot at night… and emptied it out of the window in the morning, straight into the street! The polite thing was to shout “Gare à l’eau !” — “watch out, water!” — first.',
        fr: 'Pendant des siècles, il n’y avait pas de toilettes avec des tuyaux. La nuit, on utilisait un pot… et le matin, on le vidait par la fenêtre, directement dans la rue ! Par politesse, il fallait d’abord crier « Gare à l’eau ! ».',
        ru: 'Много веков не было туалетов с трубами. Ночью пользовались горшком… а утром выливали его прямо из окна на улицу! Вежливые люди сначала кричали «Gare à l’eau !» — «Берегись, вода!».'
      },
      note: {
        en: 'walking in old Paris? keep a hat on.',
        fr: 'une balade dans le vieux Paris ? garde ton chapeau.',
        ru: 'гуляешь по старому Парижу? не снимай шляпу.'
      }
    },
    {
      id: 'o-hotte', order: 4,
      when: { en: '1800s', fr: 'XIXe siècle', ru: 'XIX век' },
      word: 'le chiffonnier',
      pos: { en: 'n. m., rag-picker', fr: 'n. m.', ru: 'сущ., тряпичник' },
      text: {
        en: 'In the 1800s, thousands of rag-pickers walked Paris at night with a lantern, a hook and a basket on their back. They fished rags, bones, glass and scraps out of the rubbish and sold them. The rags were turned into paper!',
        fr: 'Au XIXᵉ siècle, des milliers de chiffonniers parcouraient Paris la nuit avec une lanterne, un crochet et une hotte sur le dos. Ils repêchaient dans les ordures les chiffons, les os, le verre et les restes, puis les revendaient. Avec les chiffons, on fabriquait du papier !',
        ru: 'В XIX веке тысячи тряпичников бродили ночью по Парижу с фонарём, крюком и корзиной за спиной. Они выуживали из мусора тряпки, кости, стекло и объедки и продавали их. А из тряпок делали бумагу!'
      },
      note: {
        en: 'the very first recyclers of Paris',
        fr: 'les tout premiers recycleurs de Paris',
        ru: 'самые первые переработчики Парижа'
      }
    },
    {
      id: 'o-poubelle', order: 5,
      when: { en: '1883', fr: '1883', ru: '1883' },
      word: 'la poubelle',
      pos: { en: 'n. f., bin', fr: 'n. f.', ru: 'сущ., мусорный бак' },
      text: {
        en: 'Before 1883, Parisians simply put their rubbish out on the street. Then the prefect Eugène Poubelle ordered every building to have boxes with lids. People grumbled — and named the boxes after him! He even wanted three boxes: food scraps, paper and rags, glass and oyster shells.',
        fr: 'Avant 1883, les Parisiens déposaient simplement leurs ordures dans la rue. Puis le préfet Eugène Poubelle obligea chaque immeuble à avoir des boîtes avec un couvercle. Les gens ont râlé — et ont donné son nom aux boîtes ! Il voulait même trois boîtes : une pour les restes de nourriture, une pour le papier et les chiffons, une pour le verre et les coquilles d’huîtres.',
        ru: 'До 1883 года парижане просто выставляли мусор на улицу. Потом префект Эжен Пубель велел, чтобы у каждого дома были ящики с крышками. Люди ворчали — и назвали ящики его именем! Он даже хотел, чтобы ящиков было три: для объедков, для бумаги и тряпок, для стекла и устричных раковин.'
      },
      note: {
        en: 'sorting rubbish, 140 years ago. respect.',
        fr: 'trier ses déchets, il y a 140 ans. respect.',
        ru: 'сортировка мусора 140 лет назад. уважение.'
      }
    },
    {
      id: 'o-seethrough', order: 6,
      when: { en: 'since the 1990s', fr: 'depuis les années 1990', ru: 'с 1990-х' },
      word: 'le sac transparent',
      pos: { en: 'n. m.', fr: 'n. m.', ru: 'сущ., прозрачный пакет' },
      text: {
        en: 'Why are Paris street bins see-through? For safety: in the 1990s the city decided bins should be places where nothing can be hidden. So now everybody can see your apple core… photographers can see everything… and so can the rats! They spot the snacks right away and come running to gobble it all up.',
        fr: 'Pourquoi les poubelles des rues de Paris sont-elles transparentes ? Pour la sécurité : dans les années 1990, la ville a décidé qu’on ne devait rien pouvoir cacher dans les poubelles. Alors maintenant, tout le monde peut voir ton trognon de pomme… les photographes voient tout… et les rats aussi ! Ils repèrent tout de suite le festin et accourent pour tout dévorer.',
        ru: 'Почему уличные урны в Париже прозрачные? Ради безопасности: в 1990-х город решил, что в урне нельзя ничего спрятать. Поэтому теперь все видят твой огрызок яблока… фотографы видят всё… и крысы тоже! Они сразу замечают угощение и сбегаются всё это слопать.'
      },
      note: {
        en: 'that’s how this website was born, a little bit',
        fr: 'c’est un peu comme ça qu’est né ce site',
        ru: 'отчасти так и появился этот сайт'
      }
    },
    {
      id: 'o-sac', order: 7,
      when: { en: 'March 2023', fr: 'mars 2023', ru: 'март 2023' },
      word: 'la grève',
      pos: { en: 'n. f., strike', fr: 'n. f.', ru: 'сущ., забастовка' },
      text: {
        en: 'In March 2023 the people who empty the bins of Paris went on strike for about three weeks. Rubbish piled up — around 10,000 tonnes of it! Photos of Paris with mountains of black bags went around the whole world.',
        fr: 'En mars 2023, les éboueurs de Paris ont fait grève pendant environ trois semaines. Les déchets se sont accumulés — environ 10 000 tonnes ! Les photos de Paris avec des montagnes de sacs noirs ont fait le tour du monde.',
        ru: 'В марте 2023 года люди, которые вывозят мусор в Париже, бастовали около трёх недель. Мусор копился — набралось около 10 000 тонн! Фотографии Парижа с горами чёрных мешков облетели весь мир.'
      },
      note: {
        en: 'lesson: bin collectors are superheroes. say merci.',
        fr: 'leçon : les éboueurs sont des super-héros. dis-leur merci.',
        ru: 'мораль: мусорщики — супергерои. скажи им merci.'
      }
    },
    {
      id: 'o-banana', order: 8,
      when: { en: '2024', fr: '2024', ru: '2024' },
      word: 'le biodéchet',
      pos: { en: 'n. m., food waste', fr: 'n. m.', ru: 'сущ., пищевые отходы' },
      text: {
        en: 'Banana peels and other food scraps aren’t really rubbish: they can become compost for gardens or gas for energy. Since 2024, a French law says food waste has to be sorted separately. In Paris, look for the brown bins.',
        fr: 'Les peaux de banane et les autres restes de repas ne sont pas vraiment des déchets : ils peuvent devenir du compost pour les jardins ou du gaz pour produire de l’énergie. Depuis 2024, une loi française oblige à trier les déchets alimentaires à part. À Paris, cherche les bacs marron.',
        ru: 'Банановая кожура и другие объедки — не совсем мусор: из них можно сделать компост для садов или газ для энергии. С 2024 года французский закон требует собирать пищевые отходы отдельно. В Париже ищи коричневые баки.'
      },
      note: {
        en: 'peel → soil → new bananas? maybe one day.',
        fr: 'peau → terre → nouvelles bananes ? peut-être un jour.',
        ru: 'кожура → земля → новые бананы? может быть, когда-нибудь.'
      }
    },
    {
      id: 'o-bottle', order: 9,
      when: { en: 'again & again', fr: 'encore et encore', ru: 'снова и снова' },
      word: 'le verre',
      pos: { en: 'n. m., glass', fr: 'n. m.', ru: 'сущ., стекло' },
      text: {
        en: 'Glass is a recycling superhero: it can be melted and made into a new bottle again and again, and it never gets worse. That’s why bottles and jars have their own bins — in Paris, the ones with a white lid and the big glass columns in the street.',
        fr: 'Le verre est un super-héros du recyclage : on peut le fondre et en refaire une bouteille encore et encore, sans qu’il s’abîme jamais. C’est pour ça que les bouteilles et les bocaux ont leurs propres poubelles — à Paris, celles au couvercle blanc et les grandes colonnes à verre dans la rue.',
        ru: 'Стекло — супергерой переработки: его можно расплавить и сделать новую бутылку снова и снова, и хуже оно от этого не становится. Поэтому у бутылок и банок свои баки — в Париже это баки с белой крышкой и большие контейнеры-колонны для стекла на улицах.'
      },
      note: {
        en: 'this bottle might have been a jam jar before',
        fr: 'cette bouteille a peut-être été un pot de confiture avant',
        ru: 'может быть, раньше эта бутылка была банкой из-под варенья'
      }
    },
    {
      id: 'o-tapis', order: 10,
      when: { en: 'every morning', fr: 'chaque matin', ru: 'каждое утро' },
      word: 'le boudin',
      pos: { en: 'n. m., rolled carpet', fr: 'n. m.', ru: 'сущ., свёрнутый коврик' },
      text: {
        en: 'Ever seen a rolled-up carpet lying in a Paris gutter? It’s not lost! Street cleaners open little taps on the pavement and water rushes down the gutter. The carpet steers the water so it carries dust and litter to the drain. Paris even has separate pipes of non-drinking water just for this.',
        fr: 'Tu as déjà vu un tapis roulé dans un caniveau parisien ? Il n’est pas perdu ! Les agents de nettoyage ouvrent de petits robinets sur le trottoir et l’eau dévale le caniveau. Le tapis guide l’eau pour qu’elle emporte la poussière et les détritus jusqu’à l’égout. Paris a même des tuyaux d’eau non potable rien que pour ça.',
        ru: 'Тебе попадался на глаза свёрнутый коврик в парижском водостоке? Его не потеряли! Уборщики открывают маленькие краны на тротуаре, и вода бежит по водостоку. Коврик направляет воду, чтобы она уносила пыль и мусор в канализацию. В Париже даже есть отдельные трубы с технической водой специально для этого.'
      },
      note: {
        en: 'a carpet with a job',
        fr: 'un tapis qui a un métier',
        ru: 'коврик, у которого есть работа'
      }
    }
  ];

  // Текст на текущем языке (см. assets/js/i18n.js)
  const L = value => (window.I18N ? I18N.pick(value) : (value && value.en) || value);
  const T = (key, vars) => (window.I18N ? I18N.t(key, vars) : key);

  const STORAGE_KEY = 'gop-curious-found';
  const $ = id => document.getElementById(id);
  const byId = id => FACTS.find(f => f.id === id);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let found = loadFound();
  let busy = false;

  function loadFound() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(id => byId(id)) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFound() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(found)); } catch (e) { /* не страшно */ }
  }

  function art(id, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g filter="url(#sketch)"><use href="#${id}"/></g></svg>`;
  }

  /* ---------- урна ---------- */

  function syncBin() {
    document.querySelectorAll('.bin-item').forEach(el => {
      el.classList.toggle('is-gone', found.includes(el.dataset.id));
    });
    const left = FACTS.length - found.length;
    $('dig-count').textContent = left === 0
      ? T('dig.count.done')
      : T('dig.count', { found: found.length, total: FACTS.length, left });
    $('dig-bin').classList.toggle('is-empty', left === 0);
  }

  /* ---------- карточка ---------- */

  // Что сейчас в карточке: null — правила игры (из HTML), id факта, 'done' или 'reset'.
  // Нужно, чтобы перерисовать карточку при смене языка.
  let shown = null;

  function renderCard(fact, isNew) {
    shown = fact.id;
    const n = found.indexOf(fact.id) + 1;
    $('dig-card').innerHTML = `
      <article class="fact-card${isNew ? ' is-new' : ''}">
        <div class="fact-card__art">
          ${art(fact.id, 'fact-card__svg')}
          <span class="fact-card__stamp">${L(fact.when)}</span>
        </div>
        <div class="fact-card__body">
          <p class="kicker">${T('dig.find', { n, total: FACTS.length })}</p>
          <h2 class="fact-card__word">${fact.word} <span class="pos">${L(fact.pos)}</span></h2>
          <p class="fact-card__text">${L(fact.text)}</p>
          <p class="fact-card__note">↳ ${L(fact.note)}</p>
        </div>
      </article>`;
  }

  function renderDone(celebrate, isNew) {
    shown = 'done';
    $('dig-card').innerHTML = `
      <article class="fact-card fact-card--done${isNew === false ? '' : ' is-new'}">
        <div class="fact-card__body">
          <p class="kicker">${T('dig.done.kicker')}</p>
          <h2 class="fact-card__word">${T('dig.done.word')}</h2>
          <p class="fact-card__text">${T('dig.done.text')}</p>
          <p class="garbologist-stamp" aria-hidden="true">${T('dig.done.stamp')}</p>
          <p class="fact-card__note">↳ ${T('dig.done.note')}</p>
        </div>
      </article>`;
    if (celebrate !== false) confetti();
  }

  function renderReset(isNew) {
    shown = 'reset';
    $('dig-card').innerHTML = `
      <article class="fact-card fact-card--intro${isNew ? ' is-new' : ''}">
        <div class="fact-card__body">
          <p class="kicker">${T('dig.reset.kicker')}</p>
          <h2 class="fact-card__word">${T('dig.reset.word')}</h2>
          <p class="fact-card__text">${T('dig.reset.text')}</p>
          <p class="fact-card__note">${T('dig.reset.note')}</p>
        </div>
      </article>`;
  }

  // Смена языка: перерисовываем всё, что собрано скриптом
  function relabel() {
    syncBin();
    renderTimeline();
    if (shown === 'done') renderDone(false, false);
    else if (shown === 'reset') renderReset(false);
    else if (shown) renderCard(byId(shown), false);
  }

  /* ---------- шкала времени ---------- */

  function renderTimeline() {
    const sorted = FACTS.slice().sort((a, b) => a.order - b.order);
    $('dig-timeline').innerHTML = sorted.map(f => {
      const has = found.includes(f.id);
      return has
        ? `<li class="timeline__item is-found">
             <button type="button" data-id="${f.id}" aria-label="${T('dig.again', { word: f.word })}">
               ${art(f.id, 'timeline__svg')}
               <span class="timeline__when">${L(f.when)}</span>
               <span class="timeline__word">${f.word}</span>
             </button>
           </li>`
        : `<li class="timeline__item">
             <span class="timeline__slot" aria-label="${T('dig.notyet')}">?</span>
             <span class="timeline__when">· · ·</span>
           </li>`;
    }).join('');
  }

  /* ---------- главное действие: достать предмет ---------- */

  function pull() {
    if (busy) return;
    const left = FACTS.filter(f => !found.includes(f.id));
    if (!left.length) {
      renderDone();
      return;
    }
    busy = true;
    const fact = left[Math.floor(Math.random() * left.length)];
    const binBtn = $('dig-bin');
    const item = document.querySelector(`.bin-item[data-id="${fact.id}"]`);
    const from = item ? item.getBoundingClientRect() : binBtn.getBoundingClientRect();

    binBtn.classList.remove('is-shaking');
    void binBtn.offsetWidth; // перезапуск анимации
    binBtn.classList.add('is-shaking');

    found.push(fact.id);
    saveFound();
    syncBin();
    renderCard(fact, true);
    renderTimeline();

    const card = $('dig-card');
    const target = card.querySelector('.fact-card__svg');
    // на телефоне карточка под урной — показываем её
    if (window.innerWidth < 900) card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });

    if (reduceMotion() || !target || !document.body.animate) {
      busy = false;
      if (found.length === FACTS.length) setTimeout(renderDone, 2600);
      return;
    }

    target.style.opacity = '0';
    // ждём, пока страница докрутится, и запускаем полёт
    setTimeout(() => {
      const to = target.getBoundingClientRect();
      const fromNow = item ? item.getBoundingClientRect() : from;
      const flyer = document.createElement('div');
      flyer.className = 'flyer';
      flyer.innerHTML = art(fact.id);
      Object.assign(flyer.style, {
        left: fromNow.left + 'px', top: fromNow.top + 'px',
        width: fromNow.width + 'px', height: fromNow.height + 'px'
      });
      document.body.appendChild(flyer);

      const dx = to.left - fromNow.left;
      const dy = to.top - fromNow.top;
      const scale = to.width / Math.max(fromNow.width, 1);
      const lift = Math.min(-120, dy - 160);
      const anim = flyer.animate([
        { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
        { transform: `translate(${dx * 0.35}px, ${lift}px) rotate(-200deg) scale(${(1 + scale) / 2})`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) rotate(-360deg) scale(${scale})` }
      ], { duration: 950, easing: 'cubic-bezier(.3,.6,.3,1)' });

      anim.onfinish = () => {
        flyer.remove();
        target.style.opacity = '';
        target.classList.add('is-landed');
        busy = false;
        if (found.length === FACTS.length) setTimeout(renderDone, 2600);
      };
    }, window.innerWidth < 900 ? 450 : 120);
  }

  /* ---------- конфетти из бумажек ---------- */

  function confetti() {
    if (reduceMotion() || !document.body.animate) return;
    const colors = ['#cf3b2c', '#233f8f', '#fdfcf7', '#e8c547', '#1c1b18'];
    for (let i = 0; i < 40; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.style.left = Math.random() * 100 + 'vw';
      bit.style.background = colors[i % colors.length];
      bit.style.width = 6 + Math.random() * 10 + 'px';
      bit.style.height = 8 + Math.random() * 14 + 'px';
      document.body.appendChild(bit);
      const drift = (Math.random() - 0.5) * 200;
      bit.animate([
        { transform: 'translate(0, -20px) rotate(0deg)', opacity: 1 },
        { transform: `translate(${drift}px, 105vh) rotate(${360 + Math.random() * 720}deg)`, opacity: 0.9 }
      ], { duration: 2200 + Math.random() * 1800, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.5,.4,1)' })
        .onfinish = () => bit.remove();
    }
  }

  /* ---------- запуск ---------- */

  function init() {
    if (!$('dig-bin')) return;

    $('dig-bin').addEventListener('click', pull);

    $('dig-timeline').addEventListener('click', e => {
      const b = e.target.closest('button[data-id]');
      if (!b || busy) return;
      renderCard(byId(b.dataset.id), true);
      const card = $('dig-card');
      card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    });

    $('dig-reset').addEventListener('click', () => {
      if (busy) return;
      found = [];
      saveFound();
      syncBin();
      renderTimeline();
      renderReset(true);
    });

    document.addEventListener('gop:langchange', relabel);

    syncBin();
    renderTimeline();
    // если пользователь уже что-то находил — показываем последнюю находку
    if (found.length === FACTS.length) renderDone(false);
    else if (found.length) renderCard(byId(found[found.length - 1]), false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
