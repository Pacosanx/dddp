import { fields, matchTool } from './filtering.mjs';
import { createFilterMenus } from './filter-menus.mjs';
const tools = JSON.parse(document.getElementById('tools-data').textContent);
const search = document.getElementById('search');
const state = { q: '', category: '', favorites: '', ...Object.fromEntries(fields.map(f => [f, ''])) };
const filters = [...document.querySelectorAll('[data-filter]')];
const categories = [...document.querySelectorAll('[data-category]')];
const cards = new Map(tools.map(t => [t.id, document.getElementById(t.id)]));
const sections = [...document.querySelectorAll('[data-section]')];
const categoryLabel = document.querySelector('.index-label');
const sidebarLayout = matchMedia('(min-width: 801px)');
let alignmentFrame;
function alignCategoryHeading() {
  cancelAnimationFrame(alignmentFrame);
  alignmentFrame = requestAnimationFrame(() => {
    const heading = sections.find(section => !section.hidden)?.querySelector('.section-heading');
    if (!sidebarLayout.matches || !heading) {
      for (const property of ['--category-heading-height', '--category-label-top', '--category-label-bottom']) categoryLabel.style.removeProperty(property);
      return;
    }
    const labelTop = categoryLabel.getBoundingClientRect().top;
    // Both labels use the same font metrics; matching their top aligns their baselines.
    const titleLabelTop = heading.querySelector('.section-index').getBoundingClientRect().top;
    categoryLabel.style.setProperty('--category-heading-height', `${heading.getBoundingClientRect().bottom - labelTop}px`);
    categoryLabel.style.setProperty('--category-label-top', `${titleLabelTop - labelTop}px`);
    categoryLabel.style.setProperty('--category-label-bottom', '0px');
  });
}
const headingResizeObserver = new ResizeObserver(alignCategoryHeading);
sections.forEach(section => headingResizeObserver.observe(section.querySelector('.section-heading')));
sidebarLayout.addEventListener('change', alignCategoryHeading);
document.fonts.ready.then(alignCategoryHeading);
const activeFilters = document.getElementById('active-filters');
const labels = Object.fromEntries(categories.map(b => [b.dataset.category, b.firstElementChild.textContent]));
const fieldLabels = {access:'Acceso',roles:'Función',environment:'Entorno',media:'Contenido',connections:'Programa / formato',favorites:'Favoritos de Paco',category:'Categoría',q:'Búsqueda'};
const filterMenus = createFilterMenus(filters, (field, value) => { state[field] = value; render(); });
function updateGridCells() {
  const columns = Number(getComputedStyle(document.documentElement).getPropertyValue('--tool-columns'));
  for (const section of sections) {
    const grid = section.querySelector('.grid');
    grid.querySelectorAll('.card-void').forEach(cell => cell.remove());
    const visibleCards = [...grid.querySelectorAll('.card')].filter(card => !card.hidden);
    const missing = visibleCards.length ? (columns - visibleCards.length % columns) % columns : 0;
    for (const card of grid.querySelectorAll('.card')) card.classList.remove('ends-row','ends-section');
    visibleCards.forEach((card,index) => {
      card.classList.toggle('ends-row',(index + 1) % columns === 0);
      card.classList.toggle('ends-section',index >= Math.floor((visibleCards.length - 1) / columns) * columns);
    });
    for (let i = 0; i < missing; i++) {
      const cell = document.createElement('div');
      cell.className = 'card-void' + (i === missing - 1 ? ' ends-row' : '');
      cell.setAttribute('aria-hidden','true'); grid.append(cell);
    }
  }
  document.dispatchEvent(new Event('datita:layout'));
}
for (const breakpoint of ['(max-width: 1200px)','(max-width: 800px)','(max-width: 540px)']) matchMedia(breakpoint).addEventListener('change',updateGridCells);
function render() {
  const matched = tools.filter(t => matchTool(t, state));
  const visible = new Set(matched.map(t => t.id));
  for (const tool of tools) cards.get(tool.id).hidden = !visible.has(tool.id);
  for (const section of sections) {
    const count = matched.filter(t => t.category === section.dataset.section).length;
    section.hidden = count === 0;
    section.querySelector('[data-section-count]').textContent = String(count).padStart(2, '0');
  }
  const base = tools.filter(t => matchTool(t, state, true));
  for (const button of categories) {
    const key = button.dataset.category;
    const active = state.category === key;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
    button.querySelector('[data-count]').textContent = String(key ? base.filter(t => t.category === key).length : base.length).padStart(2, '0');
  }
  document.getElementById('result-count').textContent = `${matched.length} ${matched.length === 1 ? 'herramienta' : 'herramientas'}${matched.length !== tools.length ? ' de ' + tools.length : ''}`;
  const empty = document.getElementById('empty-state');
  empty.hidden = matched.length > 0;
  const favoritesPending = state.favorites === 'only' && !tools.some(t => t.paco_favorite === true);
  empty.querySelector('h2').textContent = favoritesPending ? 'Todavía no hay favoritos de Paco.' : 'No encontramos esa combinación.';
  empty.querySelector('p').textContent = favoritesPending ? 'Paco todavía no seleccionó sus herramientas favoritas. Podés seguir explorando todas.' : 'Probá otra palabra o quitá alguno de los filtros.';
  filterMenus.sync(state);
  const reset = document.getElementById('reset');
  reset.disabled = !Object.values(state).some(Boolean);
  activeFilters.replaceChildren();
  for (const [field, value] of Object.entries(state)) {
    if (!value) continue;
    const button = document.createElement('button');
    button.type = 'button';
    const title = field === 'category' ? labels[value] : field === 'favorites' ? 'Favoritos de Paco' : value;
    button.textContent = `${title} ×`;
    button.setAttribute('aria-label', `Quitar ${fieldLabels[field]}: ${title}`);
    button.addEventListener('click', () => {
      state[field] = '';
      if (field === 'q') search.value = '';
      render();
      (field === 'q' ? search : document.getElementById('filter-' + field) || categories[0]).focus();
    });
    activeFilters.append(button);
  }
  document.querySelectorAll('[data-facet]').forEach(button => {
    const active = state[button.dataset.facet] === button.dataset.value;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateGridCells();
  alignCategoryHeading();
}
function resetFilters() {
  for (const field of Object.keys(state)) state[field] = '';
  search.value = '';
  render();
  search.focus();
}
search.addEventListener('input', () => { state.q = search.value; render(); });
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') { state.q = ''; search.value = ''; render(); }
});
categories.forEach(button => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
document.querySelectorAll('[data-facet]').forEach(button => button.addEventListener('click', () => {
  const field = button.dataset.facet;
  const value = button.dataset.value;
  state[field] = state[field] === value ? '' : value;
  render();
  document.getElementById('explorar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  document.getElementById('filter-' + field).focus({ preventScroll: true });
}));
document.getElementById('reset').addEventListener('click', resetFilters);
document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', resetFilters));
// The top shortcut also clears a previous category selection.
document.querySelector('.header-link').addEventListener('click', () => { for (const field of Object.keys(state)) state[field] = ''; search.value = ''; state.category = 'recursos'; render(); });
render();

// Decorative shader loads independently of search and filters.
if (navigator.gpu && !matchMedia('(prefers-reduced-motion: reduce)').matches) import('./paco-shader.mjs').catch(error => console.warn('No se pudo cargar el shader de Datita:', error));
