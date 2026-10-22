/**
 * TractorBell runtime: vanilla JavaScript, sem dependências nem buscas de HTML.
 * Templates HTML são incorporados no build para facilitar a entrega final.
 * IMPORTANTE: inserir acima da dobra exige slot existente e altura reservada antes do JS.
 */
(() => {
  'use strict';

  const VERSION = '0.2.0';
  const templates = /*__TB_TEMPLATES__*/;
  const config = window.TractorBellSettings || {};
  const enabled = config.geral?.ativo === true;
  const debug = config.geral?.debug === true;
  const log = (...args) => { if (debug) console.info('[TractorBell]', ...args); };

  // Registro idempotente: evita duplicações em reexecuções acidentais do código.
  if (window.TractorBell?.initialized) return;

  function safeColor(color, fallback) {
    return typeof color === 'string' && /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(color)
      ? color
      : fallback;
  }

  function mountBeneficios() {
    const options = config.beneficios;
    if (!enabled || options?.ativo !== true) return false;
    const selector = options.seletor;
    if (typeof selector !== 'string' || !selector.trim()) return false;

    let slot;
    try { slot = document.querySelector(selector); } catch (_) { log('Seletor inválido:', selector); return false; }
    if (!slot || slot.dataset.tractorbellMounted === 'beneficios') return false;

    // A edição de HTML é controlada no repositório; textos do editor não são HTML.
    const fragment = document.createElement('template');
    fragment.innerHTML = templates.beneficios;
    const element = fragment.content.firstElementChild;
    if (!element) return false;

    const texts = [options.texto1, options.texto2, options.texto3];
    element.querySelectorAll('[data-tb-texto]').forEach((node, index) => {
      if (typeof texts[index] === 'string') node.textContent = texts[index].slice(0, 90);
    });

    slot.style.setProperty('--tb-beneficios-bg', safeColor(options.corFundo, '#f5f7fa'));
    slot.style.setProperty('--tb-beneficios-texto', safeColor(options.corTexto, '#253344'));
    slot.replaceChildren(element);
    slot.dataset.tractorbellMounted = 'beneficios';
    log('Componente beneficios ativado.');
    return true;
  }

  function init() {
    if (window.TractorBell?.initialized) return;
    window.TractorBell = Object.freeze({ version: VERSION, initialized: true, mountBeneficios });
    mountBeneficios();
    document.dispatchEvent(new CustomEvent('tractorbell:ready', { detail: { version: VERSION } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
