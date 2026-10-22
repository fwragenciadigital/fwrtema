import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(name, import.meta.url), 'utf8');

test('final não depende do GitHub ou de buscar HTML externo', async () => {
  const header = await read('./dist/producao-cabecalho.html');
  const footer = await read('./dist/producao-rodape.html');
  assert.match(header, /<style>/);
  assert.match(footer, /window\.TractorBellSettings/);
  assert.match(footer, /tractorbell-beneficios/);
  assert.doesNotMatch(header + footer, /github\.io|<script[^>]*src=|<link[^>]*href=|\bfetch\(/);
});

test('desenvolvimento aponta para arquivos publicados estáticos', async () => {
  const header = await read('./dist/desenvolvimento-cabecalho.html');
  const footer = await read('./dist/desenvolvimento-rodape.html');
  assert.match(header, /tractorbell\.css/);
  assert.match(footer, /tractorbell\.js/);
  assert.match(footer, /tractorbellAtivo = false/);
});

test('runtime não depende de biblioteca e contém verificações de idempotência', async () => {
  const js = await read('./assets/tractorbell.js');
  assert.match(js, /\.initialized/);
  assert.match(js, /replaceChildren/);
  assert.doesNotMatch(js, /jQuery|\$\(/);
});
