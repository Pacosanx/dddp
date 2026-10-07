export const fields = ['access', 'roles', 'environment', 'media', 'connections'];
export const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const aliases = {free:'gratis',paid:'pago',generator:'generador',online:'navegador',gradiente:'gradientes',gradient:'gradientes',gradients:'gradientes',scanning:'escaneo',tracking:'trackeo',trackear:'trackeo'};
const filler = new Set(['el','la','los','las','un','una','unos','unas','de','del','a','al','y','en','con','por','para','que','como','hacer','quiero','herramienta','herramientas']);
export function matchTool(tool, state, ignoreCategory = false) {
  if (!ignoreCategory && state.category && tool.category !== state.category) return false;
  if (state.favorites === 'only' && tool.paco_favorite !== true) return false;
  for (const field of fields) if (state[field] && !tool[field].includes(state[field])) return false;
  const haystack = normalize([tool.name, tool.description, tool.note, tool.category, tool.tags, ...(tool.capabilities || []), ...(tool.search_terms || []), ...fields.flatMap(f => tool[f])].join(' '));
  return normalize(state.q || '').trim().split(/\s+/).filter(term => term && !filler.has(term)).map(t => aliases[t] || t).every(term => term === 'ia' ? haystack.split(/[^a-z0-9]+/).includes(term) : haystack.includes(term));
}
