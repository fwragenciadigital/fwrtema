# Resultados da auditoria CLS — Farmácia Malheiro

Data: 22/10/2026. Branch: `malheiro/cls-preflight`. PR #1 permanece sem merge. Nenhuma escrita foi feita no site/painel da Loja Integrada.

## Parecer

**NO-GO para homologação e produção.** A navegação real retornou HTTP 200, mas o CLS de laboratório ficou muito acima da meta nos dois viewports. O candidato de cabeçalho só reduziu o score desktop de 0,995277 para 0,943084; mobile mudou de 0,866771 para 0,865841. Isso não valida a correção, e as diferenças entre variantes não podem ser atribuídas exclusivamente ao cabeçalho sem repetição controlada. LCP, traces completos e QA comercial ainda não foram coletados.

## Evidência real capturada

O arquivo `cls-live-browser-resultados.json` registra quatro navegações Chromium com rede da loja aberta, coletor `PerformanceObserver` ignorando `hadRecentInput`, janela de sessão de 1 s/5 s, espera de 4 s e variantes original/prepaint. Foi usado Chrome instalado localmente via `CHROME_PATH`; não foi possível instalar o Chromium empacotado por erro `ENOSPC` durante o download.

| Viewport | Variante | HTTP | CLS | Header / reserva / topo de conteúdo | Observação |
|---|---|---:|---:|---|---|
| 1366×768 | Original | 200 | 0,995277 | fixed / 85 px / 5 px | 4 erros `Failed to fetch` capturados |
| 1366×768 | Header prepaint | 200 | 0,943084 | fixed / 85 px / 5 px | 4 erros `Failed to fetch` capturados |
| 390×844 | Original | 200 | 0,866771 | fixed / 124 px / 124 px | Owl não estava carregado na amostra; 4 erros de fetch |
| 390×844 | Header prepaint | 200 | 0,865841 | fixed / 124 px / 124 px | Owl presente na amostra; 4 erros de fetch |

O relatório JSON informa coleta de execução única por cenário, não cinco repetições; a execução local não captura call stacks/trace do DevTools. Há erro de rede e a condição do Owl variou entre as duas amostras mobile. Portanto não existe comparação experimental isolada suficiente para aprovar qualquer patch.

### Revisita direta à produção (22/10/2026)

Foi feita uma segunda rodada sem interceptar HTML, CSS ou JS: Chrome local headless, HTTPS da loja pública, HTTP 200 em todas as páginas, duas navegações por cenário, `PerformanceObserver` para `layout-shift`/LCP, sem throttling, coleta por 5–6 s após `DOMContentLoaded`. É evidência de laboratório da versão publicada, não CrUX. CLS/LCP variam entre carregamentos, especialmente nos PDPs:

| Página / viewport | CLS amostra 1 / 2 | LCP amostra 1 / 2 | Observação |
|---|---:|---:|---|
| Home, 1366×768 | 0,99814 / 0,99528 | 1.996 / 1.576 ms | Header fixed, 85 px; `.conteiner-principal` termina em y=5. Shift principal: y=85→5, valor 0,99349. |
| Home, 390×844 | 0,86584 / 0,86584 | 1.560 / 1.584 ms | Header fixed, 120 px; conteúdo em y=124. |
| PDP sabonete, 390×844 | 0,65881 / 0,22554 | 2.252 / 1.672 ms | Na primeira amostra, `.span6` e `#carouselImagem` mudaram de posição em shifts de grande magnitude. |
| PDP vitamina B1, 390×844 | 0,73169 / 0,13973 | 2.676 / 828 ms | Na primeira amostra, `.row-fluid`, `.atributos` e ações do produto deslocaram-se. |

As duas PDPs emitiram erro de página `rdtracker is not defined` nas duas amostras, além de falhas de fetch para recursos externos. Esses erros são registrados, mas as falhas de rede podem depender do ambiente do navegador. A observação de `sources` identifica os elementos afetados pelo layout shift; esta coleta não capturou stack trace suficiente para atribuir cada deslocamento a uma função específica. Não foram testados categoria, busca, tablet, carrinho/checkout nem interações de compra nesta rodada.

## Camadas e conflitos

| Camada | Conflito confirmado por inspeção | Resultado |
|---|---|---|
| CSS compacto | Regras de Owl ocultam `.produtos-carrossel` até `display:block`; regra inicial e estado carregado diferem. | Código candidato ainda não aprovado nem aplicado. |
| CSS secundário | `body` reserva 72 px em trecho desktop; cabeçalho reserva 85 px a partir de 993 px; existem regras por breakpoint. | Sem patch final comprovado. |
| HTML/Cabeçalho | Head contém prepaint opcional desktop e a reserva 85 px; script principal ainda controla estado fixed. | Geometria observada em desktop 85 px e mobile 124 px, conteúdo em y=5 px no desktop. |
| JavaScript principal/Home | Há movimento de módulos, reconstrução de vitrines e inicializações de Owl após load; a fonte precisa de trace para vincular cada evento. | Sem correção estrutural comprovada. |

## Testes

- `node --test Malheiro/tests.smoke.mjs`: **PASS 3/3**.
- `validar-homologacao.mjs`, `validar-montagem-sincrona.mjs`, `verificar-urls-imagens.mjs`: **PASS**; o comparador confirmou 47 referências CDN AWS no HTML e duas no CSS conforme seu escopo atual.
- `validar-csscompactadoo.mjs`, `validar-cabecalho.mjs` e `validar-cls-v2.mjs`: falharam inicialmente por marcadores frágeis que exigiam whitespace/CRLF exatos. Foram iniciadas correções nos validadores; reexecução final permanece bloqueada por outras asserções que também presumem formatação/strings não correspondentes à fonte atual. Os validadores não podem ser considerados aprovados.
- Chrome instalado executou a loja real e produziu os quatro scores acima. O Playwright Chromium não pôde ser instalado por falta de espaço temporário reportada pelo instalador (`ENOSPC`); os erros `Failed to fetch` e falhas de validação também impedem atestar integridade completa da página.
- LCP, tablet, PDP, categoria, busca, cache quente/frio, 5 repetições, screenshots/traces e QA funcional de menu/carrinho/frete/Trustvox/QuizChat: **pendentes**.

## URLs e homologação

Os snippets de homologação foram atualizados para fixar o commit `9636c3a095fb966f6c79f93ba728dd8eb214c327` (em vez de um SHA antigo). CSS e JS retornaram HTTP 200 via jsDelivr com MIME `text/css` e `application/javascript`; o conteúdo remoto foi comparado byte a byte com os blobs do commit. Links: [CSS](https://cdn.jsdelivr.net/gh/fwragenciadigital/fwrtema@9636c3a095fb966f6c79f93ba728dd8eb214c327/Malheiro/homologacao/assets/css-secundario.css) e [JavaScript](https://cdn.jsdelivr.net/gh/fwragenciadigital/fwrtema@9636c3a095fb966f6c79f93ba728dd8eb214c327/Malheiro/homologacao/assets/malheiroshoww.js). São arquivos candidatos publicados no CDN para a branch, não uma aprovação para instalar: **não instalar ainda**, pois a medição real não passou e a validação funcional está incompleta.

## Rollback

Não houve alteração no painel. Na branch, descarte apenas os arquivos de saída de auditoria e reverta os scripts/testes de validação caso não sejam aceitos. Não editar `Malheiro/legado/`. Para qualquer teste futuro de painel, salvar o HTML/CSS/JS atuais e restaurar os blocos originais em caso de regressão; nenhuma publicação real foi autorizada.

## Próxima ação para aprovação

Executar os validadores corrigidos até PASS; repetir 5 carregamentos por variante com mesmo Chromium, cache/rede/CPU; registrar CLS/LCP e trace com seletores/fontes de shift; cobrir desktop, tablet, mobile, home, PDP, categoria e busca; confirmar URLs de homologação; e revalidar todas as interações comerciais. Até isso ocorrer, o ganho observado em CLS é evidência exploratória, não correção aprovada.
