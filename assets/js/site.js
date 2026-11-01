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
