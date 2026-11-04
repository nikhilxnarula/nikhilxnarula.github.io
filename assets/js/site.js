(() => {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme: follow the system until the visitor picks one, then remember it.
  const themeButton = document.querySelector('[data-theme-toggle]');
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  const paintTheme = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
    themeButton.title = `Switch to ${next} theme`;
    const paper = getComputedStyle(root).backgroundColor;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = paper;
    });
  };

  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', root.dataset.theme);
    } catch (e) {
      // Private windows can refuse storage. The theme still applies to this page.
    }
    paintTheme();
  });
  systemDark.addEventListener('change', paintTheme);
  paintTheme();

  // The six perfect matchings of the Petersen graph, as vertex pairs. Each pair
  // names a line in _includes/petersen.svg.
  const MATCHINGS = [
    ['0-5', '1-6', '2-7', '3-8', '4-9'],
    ['0-1', '2-3', '4-9', '5-7', '6-8'],
    ['0-1', '2-7', '3-4', '5-8', '6-9'],
    ['0-4', '1-2', '3-8', '5-7', '6-9'],
    ['0-4', '1-6', '2-3', '5-8', '7-9'],
    ['0-5', '1-2', '3-4', '6-8', '7-9'],
  ];

  document.querySelectorAll('[data-petersen]').forEach((figure) => {
    const lines = figure.querySelectorAll('[data-e]');
    const readout = figure.querySelector('[data-index]');
    let index = 0;

    const show = (next) => {
      index = (next + MATCHINGS.length) % MATCHINGS.length;
      const matching = MATCHINGS[index];
      lines.forEach((line) => line.classList.toggle('on', matching.includes(line.dataset.e)));
      readout.textContent = index + 1;
    };

    figure.querySelector('[data-controls]').hidden = false;
    figure.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
    figure.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  });

  // Confusion-matrix figures, as in "Judging the Judge". Each judge's button
  // carries its four cell counts: caught, missed, false alarms, passed.
  // Choosing a judge redraws the dots and metrics, and choosing a metric shows
  // which cells it reads and how.
  const pct = (x) => `${(Math.round(x * 1000) / 10).toFixed(1).replace(/\.0$/, '')}%`;
  const two = (x) => (Math.round(x * 100) / 100 + 0).toFixed(2);
  const agreementOf = (c) => (c.tp + c.tn) / c.n;
  const f1Of = (c) => (c.tp ? (2 * c.tp) / (2 * c.tp + c.fn + c.fp) : 0);
  const chanceOf = (c) => {
    const humans = (c.tp + c.fn) / c.n;
    const judge = (c.tp + c.fp) / c.n;
    return humans * judge + (1 - humans) * (1 - judge);
  };
  const kappaOf = (c) => (agreementOf(c) - chanceOf(c)) / (1 - chanceOf(c));
  const landisKoch = (k) => {
    const r = Math.round(k * 100) / 100;
    if (r <= 0) return 'chance level';
    if (r <= 0.2) return 'slight';
    if (r <= 0.4) return 'fair';
    if (r <= 0.6) return 'moderate';
    return r <= 0.8 ? 'substantial' : 'almost perfect';
  };
  const ratio = (a, b) => (b ? pct(a / b) : 'n/a');

  const METRICS = {
    agreement: {
      cells: ['tp', 'tn'],
      value: (c) => pct(agreementOf(c)),
      detail: (c) => `${c.tp + c.tn} of ${c.n} rows`,
      formula: (c) => `Agreement = (caught + passed) / all = (${c.tp} + ${c.tn}) / ${c.n} = ${pct(agreementOf(c))}`,
    },
    precision: {
      cells: ['tp', 'fp'],
      value: (c) => ratio(c.tp, c.tp + c.fp),
      detail: (c) => `${c.tp} of ${c.tp + c.fp} flags`,
      formula: (c) => (c.tp + c.fp
        ? `Precision = caught / (caught + false alarms) = ${c.tp} / (${c.tp} + ${c.fp}) = ${ratio(c.tp, c.tp + c.fp)}`
        : 'Precision = caught / (caught + false alarms) = 0 / 0, which is undefined: this judge never flags anything.'),
    },
    recall: {
      cells: ['tp', 'fn'],
      value: (c) => ratio(c.tp, c.tp + c.fn),
      detail: (c) => `${c.tp} of ${c.tp + c.fn} harmful`,
      formula: (c) => `Recall = caught / (caught + missed) = ${c.tp} / (${c.tp} + ${c.fn}) = ${ratio(c.tp, c.tp + c.fn)}`,
    },
    f1: {
      cells: ['tp', 'fn', 'fp'],
      value: (c) => pct(f1Of(c)),
      detail: () => 'harmonic mean',
      formula: (c) => `F1 = 2 × caught / (2 × caught + missed + false alarms) = ${2 * c.tp} / ${2 * c.tp + c.fn + c.fp} = ${pct(f1Of(c))}`,
    },
    kappa: {
      cells: ['tp', 'fn', 'fp', 'tn'],
      value: (c) => two(kappaOf(c)),
      detail: (c) => landisKoch(kappaOf(c)),
      formula: (c) => `κ = (observed − chance) / (1 − chance) = (${two(agreementOf(c))} − ${two(chanceOf(c))}) / (1 − ${two(chanceOf(c))}) ≈ ${two(kappaOf(c))}`,
    },
  };

  document.querySelectorAll('[data-matrix]').forEach((figure) => {
    const judges = [...figure.querySelectorAll('[data-switch] button')];
    const tiles = [...figure.querySelectorAll('[data-metric]')];
    const cells = [...figure.querySelectorAll('[data-cell]')];
    const current = figure.querySelector('[data-current]');
    const readout = figure.querySelector('[data-readout]');
    let judge = judges[0];
    let pinned = null;

    const counts = () => {
      const [tp, fn, fp, tn] = judge.dataset.counts.split(' ').map(Number);
      return { tp, fn, fp, tn, n: tp + fn + fp + tn };
    };

    // Light the cells a metric reads and show its working, or, with no
    // metric, the judge's own note.
    const explain = (metric) => {
      figure.classList.toggle('is-reading', Boolean(metric));
      cells.forEach((cell) => {
        cell.classList.toggle('is-read', Boolean(metric) && METRICS[metric].cells.includes(cell.dataset.cell));
      });
      tiles.forEach((tile) => tile.classList.toggle('is-on', tile.dataset.metric === metric));
      readout.textContent = metric ? METRICS[metric].formula(counts()) : judge.dataset.note;
    };

    const draw = () => {
      const c = counts();
      current.textContent = judge.dataset.name;
      judges.forEach((button) => button.setAttribute('aria-pressed', String(button === judge)));
      cells.forEach((cell) => {
        const n = c[cell.dataset.cell];
        cell.querySelector('.matrix__dots').replaceChildren(...Array.from({ length: n }, () => document.createElement('i')));
        cell.querySelector('b').textContent = n;
      });
      figure.querySelector('[data-total="pos"]').textContent = c.tp + c.fn;
      figure.querySelector('[data-total="neg"]').textContent = c.fp + c.tn;
      tiles.forEach((tile) => {
        const metric = METRICS[tile.dataset.metric];
        tile.querySelector('b').textContent = metric.value(c);
        tile.querySelector('.matrix__detail').textContent = metric.detail(c);
      });
      explain(pinned);
    };

    judges.forEach((button) => button.addEventListener('click', () => {
      judge = button;
      draw();
    }));

    // Hover and focus preview a metric. A click, tap or Enter keeps it chosen,
    // even while you switch judges, until you choose it again.
    tiles.forEach((tile) => {
      const { metric } = tile.dataset;
      const choose = () => {
        pinned = pinned === metric ? null : metric;
        tiles.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.metric === pinned)));
        explain(pinned);
      };
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-pressed', 'false');
      tile.addEventListener('click', choose);
      tile.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        choose();
      });
      tile.addEventListener('mouseenter', () => explain(metric));
      tile.addEventListener('mouseleave', () => explain(pinned));
      tile.addEventListener('focus', () => explain(metric));
      tile.addEventListener('blur', () => explain(pinned));
    });

    figure.querySelector('[data-switch]').hidden = false;
    draw();
  });

  // The rotating hero headline, which starts paused for anyone who asked for
  // reduced motion.
  const pauseButton = document.querySelector('[data-pause]');

  if (pauseButton) {
    const phrases = [...document.querySelectorAll('[data-rotate] .hero__phrase')];
    let index = 0;
    let paused = reducedMotion;
    let inView = true;

    const showPause = () => {
      const action = paused ? 'Play' : 'Pause';
      pauseButton.textContent = action;
      pauseButton.setAttribute('aria-label', `${action} the rotating headline`);
    };

    pauseButton.hidden = false;
    showPause();
    pauseButton.addEventListener('click', () => {
      paused = !paused;
      showPause();
    });

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    }).observe(pauseButton.closest('.hero'));

    setInterval(() => {
      if (paused || !inView || document.hidden) return;
      index = (index + 1) % phrases.length;
      phrases.forEach((phrase, i) => {
        const wasActive = phrase.classList.contains('is-active');
        phrase.classList.toggle('is-active', i === index);
        phrase.classList.toggle('is-leaving', wasActive && i !== index);
      });
    }, 3200);
  }

  // Links to post sections.
  document.querySelectorAll('.prose h2[id]').forEach((heading) => {
    const link = document.createElement('a');
    link.className = 'anchor';
    link.href = `#${heading.id}`;
    link.textContent = '#';
    link.setAttribute('aria-label', 'Link to this section');
    heading.append(link);
  });

  // Copy-to-clipboard for the email address, where the browser allows it.
  if (navigator.clipboard) {
    document.querySelectorAll('[data-copy]').forEach((button) => {
      button.hidden = false;
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          button.textContent = 'Copied';
        } catch (e) {
          button.textContent = 'Copy failed';
        }
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1800);
      });
    });
  }
})();
