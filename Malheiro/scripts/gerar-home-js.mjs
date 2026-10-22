import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const malheiroDir = resolve(scriptDir, '..');
const sourcePath = resolve(malheiroDir, 'homologacao/html/home.html');
const ablation = process.argv.includes('--ablation-cls');
const removeInstagram = process.argv.includes('--remove-insta-footer');
const outputName = removeInstagram
  ? 'home-malheiro-sem-insta-footer.js'
  : ablation ? 'home-malheiro-ablation-cls.js' : 'home-malheiro.js';
const outputPath = resolve(malheiroDir, 'homologacao/assets', outputName);

function removeDivsWithClass(markup, className) {
  const openPattern = new RegExp('<div\\b[^>]*\\bclass="[^"]*\\b' + className + '\\b[^"]*"[^>]*>', 'i');
  let removed = 0;
  let match;

  while ((match = openPattern.exec(markup))) {
    const start = match.index;
    // Não conte strings do JavaScript, estilos ou comentários como HTML: a home
    // contém templates de modal com várias strings que começam por "<div".
    const tags = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<div\b[^>]*>|<\/div\s*>/gi;
    tags.lastIndex = start;
    let depth = 0;
    let end = -1;
    let tag;
    while ((tag = tags.exec(markup))) {
      if (/^<\/div/i.test(tag[0])) depth -= 1;
      else if (/^<div\b/i.test(tag[0]) && !/\/\s*>$/.test(tag[0])) depth += 1;
      if (depth === 0) {
        end = tags.lastIndex;
        break;
      }
    }
    if (end < 0) throw new Error(`Bloco .${className} sem fechamento; ablação cancelada.`);
    markup = markup.slice(0, start) + markup.slice(end);
    removed += 1;
  }
  return { markup, removed };
}

const source = await readFile(sourcePath, 'utf8');
const organizerPattern = /<!--\s*\n\s*Ordem da home:[\s\S]*?window\.__FWR_HOME_ORDER__[\s\S]*?<\/script>\s*/;

if (!organizerPattern.test(source)) {
  throw new Error('Organizador de ordem da home não encontrado; bundle não foi gerado.');
}

let html = source.replace(organizerPattern, '');
if (removeInstagram) {
  const instaPattern = /<section class="insta-footer fwr-insta"(?=[\s>])[\s\S]*?<\/section>/g;
  const before = html;
  html = html.replace(instaPattern, '');
  if (before === html || (before.match(/<section class="insta-footer fwr-insta"/g) || []).length !== 1) {
    throw new Error('Esperada exatamente uma seção insta-footer.fwr-insta; bundle não foi gerado.');
  }
  if (html.includes('cdn.lightwidget.com/widgets/lightwidget.js') || html.includes('cdn.lightwidget.com/widgets/d1f4f7eb1f625e419e74ec481a131a5a.html')) {
    throw new Error('A seção Instagram foi removida, mas a dependência LightWidget permaneceu.');
  }
}
let removedModalCount = 0;
if (ablation) {
  const trustvoxPattern = /<!--\s*Trustvox\s*-->[\s\S]*?<!--\s*\/Trustvox\s*-->\s*<div\s+id="_trustvox_colt"\s*><\/div>/i;
  if (!trustvoxPattern.test(html)) throw new Error('Bloco Trustvox não encontrado; ablação cancelada.');
  html = html.replace(trustvoxPattern, '');

  const vcGuardIndex = html.indexOf('window.__FWR_VC_HARDENED__');
  const vcCodeStart = vcGuardIndex >= 0 ? html.lastIndexOf('(function () {', vcGuardIndex) : -1;
  const vcCodeClose = vcGuardIndex >= 0 ? html.indexOf('})();', vcGuardIndex) : -1;
  if (vcCodeStart < 0 || vcCodeClose < 0) {
    throw new Error('Inicializador __FWR_VC_HARDENED__ não encontrado; ablação cancelada.');
  }
  html = html.slice(0, vcCodeStart) + html.slice(vcCodeClose + '})();'.length);

  const modalOpening = '<div class="fwr-vc-modal" hidden aria-hidden="true">';
  const firstModalStart = html.indexOf(modalOpening);
  const viewportStart = firstModalStart >= 0 ? html.indexOf('<div class="fwr-vc__viewport"', firstModalStart) : -1;
  if (firstModalStart < 0 || viewportStart < 0 || !html.slice(firstModalStart, viewportStart).includes('fwr-vc-modal__backdrop')) {
    throw new Error('Primeiro modal/backdrop está fora da estrutura esperada; ablação cancelada.');
  }
  html = html.slice(0, firstModalStart) + html.slice(viewportStart);
  removedModalCount += 1;

  const secondModalComment = html.indexOf('<!-- MODAL -->');
  const secondModalStart = secondModalComment >= 0 ? html.indexOf(modalOpening, secondModalComment) : -1;
  const nextHomeSection = secondModalStart >= 0 ? html.indexOf('<div class="disable box-new-sobre">', secondModalStart) : -1;
  const secondModalEnd = nextHomeSection >= 0 ? html.lastIndexOf('\n  </div>', nextHomeSection) : -1;
  if (secondModalStart < 0 || secondModalEnd < secondModalStart || !html.slice(secondModalStart, secondModalEnd).includes('fwr-vc-modal__backdrop')) {
    throw new Error('Segundo modal/backdrop está fora da estrutura esperada; ablação cancelada.');
  }
  html = html.slice(0, secondModalComment) + html.slice(secondModalEnd);
  removedModalCount += 1;
  if (removedModalCount !== 2) {
    throw new Error(`Esperados 2 containers .fwr-vc-modal; removidos ${removedModalCount}. Ablação cancelada.`);
  }
}

const purgeTestSelectors = ablation
  ? `function purgeTestSelectors() {
    document.querySelectorAll('.titulo_avalia, #_trustvox_colt').forEach(function (node) { node.remove(); });
  }
  purgeTestSelectors();
  var purgeObserver = new MutationObserver(function (records) {
    records.forEach(function (record) {
      Array.prototype.forEach.call(record.addedNodes, function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches('.titulo_avalia, #_trustvox_colt')) {
          node.remove();
          return;
        }
        node.querySelectorAll('.titulo_avalia, #_trustvox_colt').forEach(function (nested) { nested.remove(); });
      });
    });
  });
  purgeObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(function () { purgeObserver.disconnect(); }, 60000);
`
  : '';
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
  ${purgeTestSelectors}

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
    ${ablation ? 'purgeTestSelectors();' : ''}
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
console.log(`Gerado${ablation ? ' (ablação CLS)' : ''}${removeInstagram ? ' (sem insta-footer)' : ''}: ${outputPath}`);
