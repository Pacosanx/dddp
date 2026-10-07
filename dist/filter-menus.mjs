// Select-only menus keep keyboard focus on the control while browsing options.
export function createFilterMenus(triggers, onChange) {
  const menus = triggers.map(trigger => ({
    trigger,
    field: trigger.closest('.filter-field'),
    list: document.getElementById(trigger.getAttribute('aria-controls')),
    options: [...document.getElementById(trigger.getAttribute('aria-controls')).querySelectorAll('[role=option]')],
    active: 0,
    query: '',
    lastTyped: 0
  }));
  let opened;
  const selectedIndex = menu => Math.max(0, menu.options.findIndex(option => option.dataset.value === menu.trigger.value));
  function close() {
    if (!opened) return;
    opened.list.hidden = true;
    opened.field.classList.remove('is-open', 'opens-up');
    opened.trigger.setAttribute('aria-expanded', 'false');
    opened.trigger.removeAttribute('aria-activedescendant');
    opened.options.forEach(option => option.classList.remove('is-active'));
    opened = undefined;
  }
  function position(menu) {
    const rect = menu.field.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const height = menu.list.getBoundingClientRect().height;
    const upward = below < height && above >= height;
    menu.field.classList.toggle('opens-up', upward);
  }
  function activate(menu, index) {
    menu.active = Math.max(0, Math.min(menu.options.length - 1, index));
    const option = menu.options[menu.active];
    menu.options.forEach(item => item.classList.toggle('is-active', item === option));
    menu.trigger.setAttribute('aria-activedescendant', option.id);
    // The list has no internal scrolling; keep keyboard choices visible in the page.
    option.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function open(menu) {
    if (opened === menu) return;
    close();
    opened = menu;
    menu.query = '';
    menu.list.hidden = false;
    menu.field.classList.add('is-open');
    menu.trigger.setAttribute('aria-expanded', 'true');
    position(menu);
    activate(menu, selectedIndex(menu));
  }
  function choose(menu, index) {
    const value = menu.options[index].dataset.value;
    close();
    onChange(menu.trigger.dataset.filter, value);
  }
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  for (const menu of menus) {
    menu.trigger.addEventListener('click', () => { if (opened === menu) close(); else open(menu); });
    menu.trigger.addEventListener('keydown', event => {
      const wasOpen = opened === menu;
      const key = event.key;
      if (key === 'Escape' && wasOpen) { event.preventDefault(); close(); return; }
      if (key === 'Tab') { if (wasOpen) choose(menu, menu.active); return; }
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (event.repeat) return;
        if (wasOpen) choose(menu, menu.active); else open(menu);
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
        event.preventDefault();
        open(menu);
        if (key === 'Home') activate(menu, 0);
        else if (key === 'End') activate(menu, menu.options.length - 1);
        else if (key === 'PageDown' || key === 'PageUp') activate(menu, menu.active + (key === 'PageDown' ? 10 : -10));
        else if (key === 'ArrowUp' && event.altKey && wasOpen) choose(menu, menu.active);
        else if (wasOpen) activate(menu, menu.active + (key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      open(menu);
      const now = Date.now();
      menu.query = now - menu.lastTyped > 700 ? key : menu.query + key;
      menu.lastTyped = now;
      const query = normalize(menu.query);
      const cycle = [...query].every(character => character === query[0]);
      const prefix = cycle ? query[0] : query;
      const start = cycle ? menu.active + 1 : menu.active;
      for (let offset = 0; offset < menu.options.length; offset++) {
        const index = (start + offset) % menu.options.length;
        if (normalize(menu.options[index].firstElementChild.textContent).startsWith(prefix)) { activate(menu, index); break; }
      }
    });
    menu.options.forEach((option, index) => {
      option.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') event.preventDefault(); });
      option.addEventListener('click', () => { choose(menu, index); menu.trigger.focus({ preventScroll: true }); });
    });
  }
  document.addEventListener('pointerdown', event => { if (opened && !opened.field.contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (opened && !opened.field.contains(event.target)) close(); });
  window.addEventListener('resize', () => { if (opened) { position(opened); activate(opened, opened.active); } });
  return {
    sync(state) {
      close();
      for (const menu of menus) {
        menu.trigger.value = state[menu.trigger.dataset.filter];
        const chosen = menu.options[selectedIndex(menu)];
        menu.trigger.querySelector('.filter-value').textContent = chosen.firstElementChild.textContent;
        menu.options.forEach(option => option.setAttribute('aria-selected', String(option === chosen)));
      }
    }
  };
}
