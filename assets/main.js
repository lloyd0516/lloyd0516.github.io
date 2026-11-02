(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toolbar = document.querySelector('.work-toolbar');
  const search = document.querySelector('#work-search');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const works = [...document.querySelectorAll('[data-work]')];
  const count = document.querySelector('#work-count');
  let filter = 'all';
  toolbar.hidden = false;
  count.hidden = false;

  function filterWorks() {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    works.forEach(work => {
      const matchesTopic = filter === 'all' || work.dataset.topics.split(' ').includes(filter);
      const matchesText = work.textContent.toLocaleLowerCase().includes(query);
      work.hidden = !(matchesTopic && matchesText);
      if (!work.hidden) shown++;
    });
    document.querySelectorAll('[data-work-group]').forEach(group => {
      group.hidden = ![...group.querySelectorAll('[data-work]')].some(work => !work.hidden);
    });
    document.querySelector('.no-results').hidden = shown > 0;
    count.textContent = `${shown} of ${works.length} works`;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterWorks();
  }));
  search.addEventListener('input', filterWorks);
  filterWorks();

  const steps = JSON.parse(document.querySelector('#process-data').textContent);
  const stepButtons = [...document.querySelectorAll('[data-step]')];
  stepButtons.forEach(button => button.addEventListener('click', () => {
    const step = steps[Number(button.dataset.step)];
    stepButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#process-description').textContent = step.detail;
    document.querySelector('#process-example').textContent = step.example;
  }));

  let toastTimer;
  function notify(message) {
    const toast = document.querySelector('.toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(source.textContent);
      button.textContent = 'Copied ✓';
      notify('BibTeX copied to clipboard.');
      setTimeout(() => { button.textContent = 'Copy citation'; }, 2500);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(source);
      selection.removeAllRanges();
      selection.addRange(range);
      notify('Citation selected. Press Ctrl+C (or ⌘C) to copy.');
    }
  }));

  const navLinks = [...document.querySelectorAll('nav a')];
  const progress = document.querySelector('.reading-progress');
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    const threshold = window.innerHeight * 0.35;
    let current = navLinks[0];
    navLinks.forEach(link => {
      if (document.querySelector(link.hash).getBoundingClientRect().top <= threshold) current = link;
    });
    navLinks.forEach(link => link === current ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  }
  function scheduleScroll() {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateScroll); }
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  document.addEventListener('toggle', scheduleScroll, true);
  updateScroll();

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.04 });
    document.querySelectorAll('.research-row, .timeline-row').forEach(item => {
      item.classList.add('reveal-pending');
      observer.observe(item);
    });
    reduceMotion.addEventListener('change', () => {
      document.querySelectorAll('.reveal-pending').forEach(item => item.classList.remove('reveal-pending'));
      observer.disconnect();
    }, { once: true });
  }
})();
