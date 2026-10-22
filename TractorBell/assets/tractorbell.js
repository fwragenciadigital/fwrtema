/**
 * TractorBell · JavaScript próprio
 * Sem dependências e sem alterações automáticas no layout da loja.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';

  function init() {
    if (window.TractorBell?.initialized) return;

    window.TractorBell = Object.freeze({
      version: VERSION,
      initialized: true,
    });

    document.dispatchEvent(new CustomEvent('tractorbell:ready', {
      detail: { version: VERSION },
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
