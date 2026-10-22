import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const malheiroDir = resolve(scriptDir, '..');
const sourcePath = resolve(malheiroDir, 'homologacao/html/home.html');
const outputPath = resolve(malheiroDir, 'homologacao/assets/home-malheiro.js');

const source = await readFile(sourcePath, 'utf8');
const organizerPattern = /<!--\s*\n\s*Ordem da home:[\s\S]*?window\.__FWR_HOME_ORDER__[\s\S]*?<\/script>\s*/;

if (!organizerPattern.test(source)) {
  throw new Error('Organizador de ordem da home não encontrado; bundle não foi gerado.');
}

const html = source.replace(organizerPattern, '');
const generated = `/*
 * Farmácia Malheiro — asset de homologação.
 * Gerado por Malheiro/scripts/gerar-home-js.mjs a partir de homologacao/html/home.html.
 * Não edite este arquivo manualmente; altere a fonte e gere novamente.
 */
(function () {
  'use strict';

  var KEY = '__FWR_MALHEIRO_HOME_ASSET_V1__';
  if (window[KEY]) return;
  window[KEY] = { state: 'waiting' };

  var markup = ${JSON.stringify(html)};
  var selector = '#corpo #listagemProdutos.listagem.borda-alpha';

  function isAlreadyLoaded(src) {
    var expected = new URL(src, document.baseURI).href;
    return Array.prototype.some.call(document.scripts, function (script) {
      if (!script.src) return false;
      try { return new URL(script.src, document.baseURI).href === expected; }
      catch (_) { return false; }
    });
  }

  function runScripts(scripts) {
    return scripts.reduce(function (chain, original) {
      return chain.then(function () {
        var src = original.getAttribute('src');
        if (src && isAlreadyLoaded(src)) return;

        var active = document.createElement('script');
        Array.prototype.forEach.call(original.attributes, function (attribute) {
          if (attribute.name !== 'src' && attribute.name !== 'async') {
            active.setAttribute(attribute.name, attribute.value);
          }
        });

        if (!src) {
          active.text = original.textContent;
          document.body.appendChild(active);
          return;
        }

        active.src = src;
        if (original.hasAttribute('async')) {
          active.async = true;
          document.body.appendChild(active);
          return;
        }

        active.async = false;
        return new Promise(function (resolve) {
          active.onload = resolve;
          active.onerror = function () {
            console.error('[Malheiro home] Falha ao carregar dependência:', src);
            resolve();
          };
          document.body.appendChild(active);
        });
      });
    }, Promise.resolve());
  }

  function mount() {
    if (window[KEY].state === 'mounting' || window[KEY].state === 'mounted') return true;
    var showcase = document.querySelector(selector);
    if (!showcase || !showcase.parentNode) return false;

    window[KEY].state = 'mounting';
    var template = document.createElement('template');
    template.innerHTML = markup;

    var styles = Array.prototype.slice.call(template.content.querySelectorAll('style'));
    var scripts = Array.prototype.slice.call(template.content.querySelectorAll('script'));
    scripts.forEach(function (script) { script.remove(); });
    styles.forEach(function (style, index) {
      style.setAttribute('data-fwr-malheiro-home-style', String(index + 1));
      document.head.appendChild(style);
    });

    showcase.parentNode.insertBefore(template.content, showcase.nextSibling);
    runScripts(scripts).then(function () {
      window[KEY].state = 'mounted';
      window.dispatchEvent(new CustomEvent('fwr:malheiro-home-mounted'));
    }).catch(function (error) {
      window[KEY].state = 'error';
      console.error('[Malheiro home] Erro ao inicializar a base:', error);
    });
    return true;
  }

  if (mount()) return;

  var observer = new MutationObserver(function () {
    if (mount()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(function () {
    observer.disconnect();
    if (window[KEY].state === 'waiting') {
      window[KEY].state = 'target-not-found';
      console.error('[Malheiro home] Vitrine nativa não encontrada:', selector);
    }
  }, 20000);
})();
`;

await writeFile(outputPath, generated, 'utf8');
console.log(`Gerado: ${outputPath}`);
