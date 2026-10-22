# Instruções para Codex / Cursor — Farmácia Malheiro

Leia antes de modificar a pasta Malheiro/.

## Missão
Investigar e corrigir o CLS estrutural real da Loja Integrada, preservando UX, SEO, performance, compra e Settings editáveis.
Trabalhar na branch malheiro/cls-preflight. Não modificar o painel da loja em produção.

## Evidência histórica — não extrapolar
Auditoria anterior registrou LayoutShift 0,993392 em ~898,5 ms, .conteiner-principal top 85→5px e deslocamento grande de #barraNewsletter, além de 423 URLs desktop com CLS dos grupos 0,33/0,41.
Esses números não são medição atual. Ler auditoria/01-CLS-DIAGNOSTICO-EVIDENCIAS.md.

## Arquivos necessários e lacuna
A pasta Malheiro foi criada como scaffold do TractorBell, não como export completo do frontend em produção.
O arquivo referencias/categorias-autoplay-snapshot-2026-10-13.html é um snapshot histórico e contém URLs de imagem incompletas.
Não imaginar implementações faltantes. Importar os blocos exatos de Cabeçalho/Rodapé e o CSS atual conforme auditoria/02-INVENTARIO-CODIGO-ATUAL.md, removendo credenciais antes de subir.

## Análise prioritária
1. Mapear HTML inicial versus DOM após carregamento e identificar movimentações pós-paint.
2. Usar DevTools Layout Shifts e DOM breakpoints em #cabecalho, .abriga-menu, .conteiner-principal e #barraNewsletter.
3. Revisar a função posicionar() que chama banner.insertAdjacentElement('afterend', sec) no snapshot de categorias; é suspeita de regressão, não causa comprovada dos dados anteriores.
4. Produzir correção mínima e testável do DOM antes da primeira renderização, sem margens compensatórias ou alturas genéricas.
5. Manter componentes separados em src/components/, src/runtime.js e assets/malheiro.css, com flags editáveis em configuracao.html.
6. Rodar scripts/build.mjs e testes unitários, com avaliações reais de home, categoria, PDP simples, PDP com variações, busca e carrinho.

## Critérios de merge e deploy
- Trace antes/depois disponível, com alvo CLS de laboratório <= 0,05; campo p75 <= 0,10 após janela de 28 dias.
- Não piorar LCP/INP, sem deslocamento em mobile; testes com rede normal e lenta.
- Não alterar compra, preço, variações, frete, login, navegação, wishlist nem checkout.
- Não versionar dados sensíveis, cookies, tokens nem IDs de sessão; scripts desativados por padrão.
- O preview não é produção. Nenhuma publicação definitiva antes de aceite expresso.
- Consultar auditoria/03-TESTE-URLS-E-PUBLICACAO.md para URLs e instruções.
