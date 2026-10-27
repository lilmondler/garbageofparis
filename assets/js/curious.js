/*
  ============================================================
  GARBAGE OF PARIS — curious.js
  ============================================================
  Интерактивная урна на странице curious.html:
  нажимаешь на урну → из неё вылетает предмет → открывается
  карточка с фактом о мусоре. Найденное встаёт на шкалу времени.

  КАК ДОБАВИТЬ ИЛИ ПОМЕНЯТЬ ФАКТ:
  поправь текст в массиве FACTS ниже. Поле art — это id рисунка
  (<symbol id="o-..."> в curious.html), order — место на шкале.
  ============================================================
*/

(function () {
  'use strict';

  const FACTS = [
    {
      id: 'o-amphora', order: 1, when: '1st–3rd c.',
      word: 'Monte Testaccio', pos: 'n., a hill',
      text: 'In Rome there is a hill made of rubbish! Monte Testaccio is about 35 metres tall and is made of tens of millions of broken clay jars. They once carried olive oil to the city and were thrown away almost 2,000 years ago.',
      note: 'today archaeologists read it like a giant history book'
    },
    {
      id: 'o-pave', order: 2, when: '1185',
      word: 'le pavé', pos: 'n. m., cobblestone',
      text: 'The story goes that in 1185 King Philippe Auguste opened his palace window and almost fainted: carts were churning up stinking mud full of rubbish. So he ordered the main streets of Paris to be paved with stones.',
      note: 'a legend told by a chronicler of the king. smell → stones.'
    },
    {
      id: 'o-pot', order: 3, when: 'Middle Ages',
      word: '« Gare à l’eau ! »', pos: 'interj.',
      text: 'For centuries there were no toilets with pipes. People used a pot at night… and emptied it out of the window in the morning, straight into the street! The polite thing was to shout “Gare à l’eau !” — “watch out, water!” — first.',
      note: 'walking in old Paris? keep a hat on.'
    },
    {
      id: 'o-hotte', order: 4, when: '1800s',
      word: 'le chiffonnier', pos: 'n. m., rag-picker',
      text: 'In the 1800s, thousands of rag-pickers walked Paris at night with a lantern, a hook and a basket on their back. They fished rags, bones, glass and scraps out of the rubbish and sold them. The rags were turned into paper!',
      note: 'the very first recyclers of Paris'
    },
    {
      id: 'o-poubelle', order: 5, when: '1883',
      word: 'la poubelle', pos: 'n. f., bin',
      text: 'Before 1883, Parisians simply put their rubbish out on the street. Then the prefect Eugène Poubelle ordered every building to have boxes with lids. People grumbled — and named the boxes after him! He even wanted three boxes: food scraps, paper and rags, glass and oyster shells.',
      note: 'sorting rubbish, 140 years ago. respect.'
    },
    {
      id: 'o-seethrough', order: 6, when: 'since the 1990s',
      word: 'le sac transparent', pos: 'n. m.',
      text: 'Why are Paris street bins see-through? For safety: in the 1990s the city decided bins should be places where nothing can be hidden. So now everybody can see your apple core… and photographers can see everything.',
      note: 'that’s how this website was born, a little bit'
    },
    {
      id: 'o-sac', order: 7, when: 'March 2023',
      word: 'la grève', pos: 'n. f., strike',
      text: 'In March 2023 the people who empty the bins of Paris went on strike for about three weeks. Rubbish piled up — around 10,000 tonnes of it! Photos of Paris with mountains of black bags went around the whole world.',
      note: 'lesson: bin collectors are superheroes. say merci.'
    },
    {
      id: 'o-banana', order: 8, when: '2024',
      word: 'le biodéchet', pos: 'n. m., food waste',
      text: 'Banana peels and other food scraps aren’t really rubbish: they can become compost for gardens or gas for energy. Since 2024, a French law says food waste has to be sorted separately. In Paris, look for the brown bins.',
      note: 'peel → soil → new bananas? maybe one day.'
    },
    {
      id: 'o-bottle', order: 9, when: 'again & again',
      word: 'le verre', pos: 'n. m., glass',
      text: 'Glass is a recycling superhero: it can be melted and made into a new bottle again and again, and it never gets worse. That’s why bottles and jars have their own bins — in Paris, the ones with a white lid and the big glass columns in the street.',
      note: 'this bottle might have been a jam jar before'
    },
    {
      id: 'o-tapis', order: 10, when: 'every morning',
      word: 'le boudin', pos: 'n. m., rolled carpet',
      text: 'Ever seen a rolled-up carpet lying in a Paris gutter? It’s not lost! Street cleaners open little taps on the pavement and water rushes down the gutter. The carpet steers the water so it carries dust and litter to the drain. Paris even has separate pipes of non-drinking water just for this.',
      note: 'a carpet with a job'
    }
  ];

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
      ? 'the bin is empty! you found all 10.'
      : `${found.length} / ${FACTS.length} found · ${left} still inside. tap the bin!`;
    $('dig-bin').classList.toggle('is-empty', left === 0);
  }

  /* ---------- карточка ---------- */

  function renderCard(fact, isNew) {
    const n = found.indexOf(fact.id) + 1;
    $('dig-card').innerHTML = `
      <article class="fact-card${isNew ? ' is-new' : ''}">
        <div class="fact-card__art">
          ${art(fact.id, 'fact-card__svg')}
          <span class="fact-card__stamp">${fact.when}</span>
        </div>
        <div class="fact-card__body">
          <p class="kicker">find № ${n} of ${FACTS.length}</p>
          <h2 class="fact-card__word">${fact.word} <span class="pos">${fact.pos}</span></h2>
          <p class="fact-card__text">${fact.text}</p>
          <p class="fact-card__note">↳ ${fact.note}</p>
        </div>
      </article>`;
  }

  function renderDone(celebrate) {
    $('dig-card').innerHTML = `
      <article class="fact-card fact-card--done is-new">
        <div class="fact-card__body">
          <p class="kicker">the bin is empty</p>
          <h2 class="fact-card__word">garbologist <span class="pos">n.</span></h2>
          <p class="fact-card__text">A person who studies rubbish to understand how people live. That’s you now! You know about a hill made of jars, a king who hated mud, a man who became a bin, and a carpet with a job.</p>
          <p class="garbologist-stamp" aria-hidden="true">certified<br>garbologist</p>
          <p class="fact-card__note">↳ next time you pass a bin in Paris, look inside. just with your eyes.</p>
        </div>
      </article>`;
    if (celebrate !== false) confetti();
  }

  /* ---------- шкала времени ---------- */

  function renderTimeline() {
    const sorted = FACTS.slice().sort((a, b) => a.order - b.order);
    $('dig-timeline').innerHTML = sorted.map(f => {
      const has = found.includes(f.id);
      return has
        ? `<li class="timeline__item is-found">
             <button type="button" data-id="${f.id}" aria-label="Read again: ${f.word}">
               ${art(f.id, 'timeline__svg')}
               <span class="timeline__when">${f.when}</span>
               <span class="timeline__word">${f.word}</span>
             </button>
           </li>`
        : `<li class="timeline__item">
             <span class="timeline__slot" aria-label="not found yet">?</span>
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
      $('dig-card').innerHTML = `
        <article class="fact-card fact-card--intro is-new">
          <div class="fact-card__body">
            <p class="kicker">all back inside</p>
            <h2 class="fact-card__word">again! <span class="pos">adv.</span></h2>
            <p class="fact-card__text">Everything is back in the bin. Tap it to start digging again.</p>
            <p class="fact-card__note">ready? tap the bin</p>
          </div>
        </article>`;
    });

    syncBin();
    renderTimeline();
    // если пользователь уже что-то находил — показываем последнюю находку
    if (found.length === FACTS.length) renderDone(false);
    else if (found.length) renderCard(byId(found[found.length - 1]), false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
