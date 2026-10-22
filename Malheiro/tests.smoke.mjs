import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(name, import.meta.url), 'utf8');

test('final não depende do GitHub ou de buscar HTML externo', async () => {
  const header = await read('./dist/producao-cabecalho.html');
  const footer = await read('./dist/producao-rodape.html');
  assert.match(header, /<style>/);
  assert.match(footer, /window\.MalheiroSettings/);
  assert.match(footer, /malheiro-beneficios/);
  assert.doesNotMatch(header + footer, /github\.io|<script[^>]*src=|<link[^>]*href=|\bfetch\(/);
});

test('desenvolvimento aponta para arquivos publicados estáticos', async () => {
  const header = await read('./dist/desenvolvimento-cabecalho.html');
  const footer = await read('./dist/desenvolvimento-rodape.html');
  assert.match(header, /malheiro\.css/);
  assert.match(footer, /malheiro\.js/);
  assert.match(footer, /malheiroAtivo = false/);
});

test('runtime não depende de biblioteca e contém verificações de idempotência', async () => {
  const js = await read('./assets/malheiro.js');
  assert.match(js, /\.initialized/);
  assert.match(js, /replaceChildren/);
  assert.doesNotMatch(js, /jQuery|\$\(/);
});

test('base da home preserva uma vitrine nativa inicial e ordena os módulos uma vez', async () => {
  const home = await read('./homologacao/html/home.html');
  assert.match(home, /#corpo #listagemProdutos\.listagem\.borda-alpha/);
  assert.match(home, /var blocos = \[categorias, listaUm, listaDois, videos, marcas\]/);
  assert.match(home, /insertBefore\(fragmento, vitrine\.nextSibling\)/);
  assert.doesNotMatch(home, /posicionarCategorias|insertAfter\('#corpo'\)|data\.fmPosicionado/);
  for (const marker of ['.lista-one', '.lista-two', '.videos-box', '.banner-central-marcas', 'id="qc-trigger"', 'id="_trustvox_colt"']) {
    assert.ok(home.includes(marker), `base perdeu integração ou bloco: ${marker}`);
  }
});

test('asset JS da home contém a base HTML, mantém URLs e monta junto à vitrine nativa', async () => {
  const home = await read('./homologacao/html/home.html');
  const asset = await read('./homologacao/assets/home-malheiro.js');
  const organizer = /<!--\s*\n\s*Ordem da home:[\s\S]*?window\.__FWR_HOME_ORDER__[\s\S]*?<\/script>\s*/;
  const payloadMatch = asset.match(/var markup = ([\s\S]*?);\n  var selector/);

  assert.ok(payloadMatch, 'asset deve conter a base HTML serializada');
  assert.equal(JSON.parse(payloadMatch[1]), home.replace(organizer, ''), 'base empacotada deve corresponder à fonte sem o organizador concorrente');
  assert.match(asset, /#corpo #listagemProdutos\.listagem\.borda-alpha/);
  assert.match(asset, /__FWR_MALHEIRO_HOME_ASSET_V1__/);
  assert.doesNotMatch(asset.slice(0, asset.indexOf('var markup = ')), /fetch\s*\(/, 'carregador não deve tentar baixar HTML externo');
});

test('variante CLS remove Trustvox e modal de vídeo sem alterar os demais módulos ou URLs', async () => {
  const home = await read('./homologacao/html/home.html');
  const asset = await read('./homologacao/assets/home-malheiro-ablation-cls.js');
  const payloadMatch = asset.match(/var markup = ([\s\S]*?);\n  var selector/);
  assert.ok(payloadMatch, 'variante CLS deve conter a base HTML serializada');
  const markup = JSON.parse(payloadMatch[1]);
  const cdn = value => [...value.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(match => match[1]);

  assert.doesNotMatch(markup, /trustvox|_trustvox_colt|titulo_avalia/i, 'Trustvox deve ser removido do HTML empacotado');
  assert.doesNotMatch(markup, /fwr-vc-modal|__FWR_VC_HARDENED__/i, 'modal, backdrop e inicializador de vídeo devem sair do HTML empacotado');
  assert.match(markup, /id="qc-trigger"/, 'QuizChat deve permanecer no payload');
  for (const marker of ['lista-one', 'lista-two', 'videos-box', 'banner-central-marcas']) {
    assert.ok(markup.includes(marker), `variante removeu conteúdo não solicitado: ${marker}`);
  }
  assert.match(asset, /querySelectorAll\('\.titulo_avalia, #_trustvox_colt'\)/, 'runtime deve remover seletores Trustvox já presentes');
  assert.match(asset, /new MutationObserver/, 'runtime deve remover nós Trustvox adicionados tardiamente');
  assert.deepEqual(cdn(markup), cdn(home), 'URLs CDN de imagens devem permanecer exatamente na mesma ordem');
});

test('variante sem Instagram remove o feed e LightWidget, preservando o restante da home', async () => {
  const home = await read('./homologacao/html/home.html');
  const asset = await read('./homologacao/assets/home-malheiro-sem-insta-footer.js');
  const payloadMatch = asset.match(/var markup = ([\s\S]*?);\n  var selector/);
  assert.ok(payloadMatch, 'variante deve conter a base HTML serializada');
  const markup = JSON.parse(payloadMatch[1]);
  const cdn = value => [...value.matchAll(/(?:src|data-bg|data-product-img)\s*=\s*["']((?:https?:)?\/\/cdn\.awsli\.com\.br\/[^"']+)["']/gi)].map(match => match[1]);

  assert.doesNotMatch(markup, /insta-footer|fwr-insta|lightwidget/i, 'Instagram e sua dependência devem sair do payload');
  assert.match(markup, /fwr-vimeo-modal/, 'modal Vimeo deve permanecer nesta variante isolada');
  assert.match(markup, /id="qc-trigger"/, 'QuizChat deve permanecer');
  assert.deepEqual(cdn(markup), cdn(home), 'URLs CDN AWS devem permanecer literalmente iguais');
});
