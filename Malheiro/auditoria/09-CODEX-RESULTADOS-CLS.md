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

### Ablação visual da home: `.conteiner-principal`

Teste adicional, somente no navegador isolado: CSS foi injetado na resposta HTML antes da primeira pintura; nada foi salvo na loja. No controle, CLS foi 0,99814 desktop e 0,86584 mobile. Ocultando `.conteiner-principal` inteiro com `display:none!important`, CLS caiu para 0,00442 e 0,00421, respectivamente — mas a altura renderizada do cabeçalho também caiu para 0 px. O teste elimina praticamente toda a página, portanto só confirma que o shift está na região ampla removida; não é uma correção aceitável nem prova de que os módulos injetados sejam a causa.

Para separar os módulos sem remover o cabeçalho, foi feita outra ablação pré-pintura dos seletores presentes `.lista-one`, `.lista-two`, `.videos-box`, `.box-new-sobre`, `.titulo_avalia` e `#_trustvox_colt` (`.fwr-bb` e `#app` não existiam nessa visita). Header preservado: 85 px desktop e 120 px mobile. CLS foi 0,77454 desktop e 0,86677 mobile. O shift dominante do próprio `.conteiner-principal` persistiu em 0,76989 no desktop (y=85→5); no mobile persistiu o shift de 0,8658 envolvendo `#rodape`/`#corpo`. Uma navegação por viewport/variante não prova causalidade, mas indica que ocultar apenas os módulos conhecidos não elimina o deslocamento dominante. O teste oculto também remove conteúdo e não deve ser instalado.

### Testes direcionados de reposicionamento (22/10/2026)

Foi testado no navegador isolado mover `.row-fluid.banner.cheio` para o primeiro filho de `.secao-banners` assim que ambos aparecem no DOM, antes do `prepend` posterior de `malheiroshoww.js`. Não houve melhora: desktop controle 0,99679 versus intervenção 1,00291; mobile 0,86677 em ambos. São amostras únicas, portanto a diferença desktop é ruído provável; o teste descarta esse banner, isoladamente, como solução do shift dominante. Não promover esse observer nem acrescentar código ao tema.

A captura de mutações mostrou a transição do cabeçalho de `position: static; top=85px; altura=242px` para `position: fixed; top=0; altura=85px`, com `body` ainda reservando 85 px. No mesmo intervalo o topo de `.conteiner-principal` muda de y=85 para y=5. Isso é evidência de uma transição geométrica simultânea, não prova de que remover o cabeçalho resolva o CLS: o prepaint já testado ainda ficou em 0,943 desktop. O wrapper `.conteiner-principal` é estrutural da plataforma e não deve ser ocultado/removido; o teste `display:none` só suprimiu quase toda a página.

Também foi identificado no HTML entregue pela produção um conjunto de scripts inline jQuery que reposiciona módulos (`.lista-one`, `.lista-two`, `.videos-box`, `banner-central-marcas`, `.box-new-sobre`, `.titulo_avalia`, `#app`, `#_trustvox_colt`, `#barraNewsletter`, entre outros). A cópia candidata versionada contém apenas parte desse conjunto (por exemplo, `home.html` move `.lista-one` depois de `#corpo`); logo, editar apenas o JS/CSS disponível não remove as mutações que hoje ocorrem na loja publicada. A substituição segura é renderizar cada bloco uma única vez em sua posição final no HTML de origem — não movê-lo no DOMReady/load. Não foi aplicada reordenação de teste: a variante parser-time anterior piorou CLS (ver commit `fb912a7`/seção de experimentos), e uma solução completa depende de recuperar/exportar os campos HTML/Cabeçalho e Rodapé exatos hoje ativos para reconciliar todos os scripts sem perder Settings editáveis, URLs ou integrações.

**Decisão desta rodada:** nenhum patch foi promovido; solução continua **NO-GO**. Próximo passo técnico bloqueante é obter a exportação integral dos campos de HTML/Cabeçalho, HTML/Rodapé e JS/CSS efetivamente ativos. Com essa fonte, remover as relocações redundantes e colocar os nós no destino final antes da primeira pintura; então repetir as medições reais em Chrome, sem esconder conteúdo.

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

### Base integral da home reorganizada (22/10/2026)

Foi incorporado em `Malheiro/homologacao/html/home.html` o arquivo completo `base-home.html` fornecido pelo usuário (2.421 linhas). A interpretação aplicada foi manter uma única vitrine nativa da Loja Integrada como primeira seção de produtos; as listas promocionais autorais, categorias, vídeos e faixa de marcas foram preservados em seguida. Não foram apagadas vitrines/cards autorais. A ordem definida é: vitrine nativa `#corpo #listagemProdutos.listagem.borda-alpha` → categorias → `.lista-one` → `.lista-two` → `.videos-box` → `.banner-central-marcas`.

O arquivo recebido tinha dois posicionadores concorrentes para `#fm-categorias` (um inseria antes da vitrine e outro depois do banner) e um `insertAfter('#corpo')` independente para `.lista-one`. Eles foram removidos e substituídos por uma rotina única idempotente que junta os blocos em um `DocumentFragment` e faz uma inserção após a vitrine principal. QuizChat, Trustvox e os outros conteúdos da base permanecem.

Verificações da alteração: `node --test Malheiro/tests.smoke.mjs` **PASS 4/4**; `validar-homologacao.mjs` **PASS**; `validar-montagem-sincrona.mjs` **PASS**; `verificar-urls-imagens.mjs` **PASS**. Comparação direta com a versão anterior: 47 referências CDN AWS sem alteração, 42 URLs explícitas de produto sem alteração, e conteúdo literal de preço presente sem alteração. Os oito scripts inline passaram por verificação sintática `vm.Script`.

Essa é uma correção de ordem estrutural candidata, ainda **não uma comprovação de CLS**: não foi feita medição real da página publicada com o novo arquivo. Como o arquivo pode ser carregado pelo campo HTML/Rodapé depois da pintura, a rotina pode continuar causando um deslocamento nesse caso; precisa ser instalada somente na loja de teste e medida com o mesmo Chrome/viewport antes de aprovação. O teste anterior de montagem parser-time da `.lista-one` não passou e não deve ser usado como evidência de melhora. GO continua **NO-GO** até teste real de CLS e QA funcional.

## URLs e homologação

Os snippets de homologação foram atualizados para fixar o commit `9636c3a095fb966f6c79f93ba728dd8eb214c327` (em vez de um SHA antigo). CSS e JS retornaram HTTP 200 via jsDelivr com MIME `text/css` e `application/javascript`; o conteúdo remoto foi comparado byte a byte com os blobs do commit. Links: [CSS](https://cdn.jsdelivr.net/gh/fwragenciadigital/fwrtema@9636c3a095fb966f6c79f93ba728dd8eb214c327/Malheiro/homologacao/assets/css-secundario.css) e [JavaScript](https://cdn.jsdelivr.net/gh/fwragenciadigital/fwrtema@9636c3a095fb966f6c79f93ba728dd8eb214c327/Malheiro/homologacao/assets/malheiroshoww.js). São arquivos candidatos publicados no CDN para a branch, não uma aprovação para instalar: **não instalar ainda**, pois a medição real não passou e a validação funcional está incompleta.

## Rollback

Não houve alteração no painel. Na branch, descarte apenas os arquivos de saída de auditoria e reverta os scripts/testes de validação caso não sejam aceitos. Não editar `Malheiro/legado/`. Para qualquer teste futuro de painel, salvar o HTML/CSS/JS atuais e restaurar os blocos originais em caso de regressão; nenhuma publicação real foi autorizada.

## Próxima ação para aprovação

Executar os validadores corrigidos até PASS; repetir 5 carregamentos por variante com mesmo Chromium, cache/rede/CPU; registrar CLS/LCP e trace com seletores/fontes de shift; cobrir desktop, tablet, mobile, home, PDP, categoria e busca; confirmar URLs de homologação; e revalidar todas as interações comerciais. Até isso ocorrer, o ganho observado em CLS é evidência exploratória, não correção aprovada.

### Asset JS para upload na Loja Integrada (22/10/2026)

O Gerenciador da Loja Integrada não aceita `.html`, mas aceita `.js`. Foi criado `Malheiro/homologacao/assets/home-malheiro.js`, bundle autogerado da base `Malheiro/homologacao/html/home.html` pelo script `Malheiro/scripts/gerar-home-js.mjs`. O asset serializa a base, aplica seus estilos antes de inserir o markup, coloca os módulos uma única vez logo depois da vitrine nativa e reexecuta as tags de script da base em sequência, mantendo scripts externos `async` e evitando reinicialização do próprio carregador. O organizador inline antigo é removido do payload para não haver dois posicionadores.

O snippet está em `Malheiro/homologacao/snippets/carregar-home-malheiro.html`. Faça upload de `home-malheiro.js`, substitua o placeholder pela URL HTTPS real gerada pela Loja Integrada e instale apenas na loja de teste. Não é possível preencher/verificar essa URL antes do upload feito pela conta da loja. O carregamento é síncrono no primeiro ensaio; não acrescentar `async` ou `defer` até validar o ciclo dos scripts. A instalação após a vitrine continua sendo montagem client-side e pode gerar CLS; este bundle não é uma prova de correção nem está aprovado para produção.

Validação local do bundle: `node --check Malheiro/homologacao/assets/home-malheiro.js`, `node --test Malheiro/tests.smoke.mjs` (**5/5**), `node Malheiro/scripts/validar-homologacao.mjs`, `node Malheiro/scripts/validar-montagem-sincrona.mjs` e `node Malheiro/scripts/verificar-urls-imagens.mjs` passaram. O comparador manteve literalmente as 47 referências de imagem CDN AWS. O binário Playwright `chromium_headless_shell-1194` não está instalado, mas o teste de montagem foi executado com Chrome local via Playwright em uma página isolada: estado `mounted`; categorias, `.lista-one`, `.lista-two`, vídeos e marcas presentes; próxima seção após a vitrine nativa é `#fm-categorias`. Isso validava a montagem do DOM no fixture, não CLS, integrações reais ou comportamento da loja. À época da geração do bundle ainda não havia upload nem medição real; a publicação posterior é verificada na seção abaixo.

### Verificação da publicação informada pelo usuário (22/10/2026)

Visita somente leitura à home oficial `https://www.farmaciamalheiro.com.br/` com Chrome headless local e Playwright. O documento respondeu HTTP 200. O navegador requisitou `https://cdn.awsli.com.br/1351/1351790/arquivos/home-malheiro.js`, também HTTP 200, Content-Type `application/x-javascript`. A CDN entrega uma forma minificada/normalizada, portanto seus bytes e SHA-256 não coincidem com o artefato local; o marcador de runtime chegou a `mounted`, comprovando que o carregador executou. Em três viewports, cada um com duas navegações independentes, havia exatamente uma ocorrência de categorias, `.lista-one`, `.lista-two`, `.videos-box` e faixa de marcas; a ordem após a vitrine nativa começou por `#fm-categorias`, e `.owl-loaded` estava presente. Isso confirma instalação e montagem, não estabilidade geométrica.

Medição de laboratório sem throttling, `prefers-reduced-motion: reduce`, espera de 6 s após `DOMContentLoaded`, observador `layout-shift` excluindo entradas com `hadRecentInput`, maior janela de sessão (1 s / 5 s):

| Viewport | CLS run 1 / 2 | LCP run 1 / 2 |
|---|---:|---:|
| 1366×768 desktop | 0,582356 / 0,585229 | 1.736 / 2.052 ms |
| 768×1024 tablet | 0,743566 / 0,743566 | 1.904 / 1.760 ms |
| 390×844 mobile | 1,130456 / 1,130256 | 1.400 / 1.576 ms |

**Conclusão: NO-GO para declarar CLS resolvido.** A meta ≤0,05 não foi atingida; o CLS segue severo, sobretudo em tablet e mobile. Os maiores eventos observados associaram-se a `#barraNewsletter` (desktop, 0,3855; y=463→0), `#rodape` (tablet, 0,5576; mobile, 0,7192; y para 0), `.conteiner-principal` (desktop, 0,1949; y=85→5), `#corpo`/banner (tablet, 0,1758; mobile, 0,3893) e `#fm-categorias` (desktop, 0,0562; tablet, 0,1880; mobile, 0,1516; y para 0). As fontes do navegador identificam elementos que se moveram, mas não atribuem por si só cada evento à função causadora. Também ocorreram quatro erros `Failed to fetch` por navegação; a origem não foi isolada nesta rodada.

Os resultados são medições reais de laboratório na versão pública e não CrUX. Comparação numérica com as medições anteriores é indicativa, não um A/B controlado (duas amostras por cenário; conteúdo e estado da loja podem variar). O asset está publicado e funcional; ainda são necessários diagnóstico de cada relocação remanescente, correção em staging, cinco ou mais repetições e QA das integrações/checkout antes de qualquer aprovação.

### Revalidação com contextos anônimos — 22/10/2026

Runner: `scripts/validar-base-atual.mjs`, Chrome local via Playwright, contextos novos sem cookies/cache, viewport 390/820/1366 × 844, DPR 1, animações normais, sem limitação de CPU/rede, 10 segundos após DOMContentLoaded. Cinco cargas frias por viewport e variante. CLS calculado pela maior janela de sessão (gap <1 s; duração <5 s), excluindo entradas com input recente. JSON e screenshots em `auditoria/evidencias-base-atual/`. Não são resultados CrUX nem uma nova execução Lighthouse. A rodada não cobre cache quente ou regressão completa de PDP/categoria/busca/checkout.

O recurso publicado foi `https://cdn.awsli.com.br/1351/1351790/arquivos/end-home-malheiro-ablation-cls.js`, HTTP 200, SHA-256 `d007502952ecd40ae6c70c9d0177b23e40b5645523a0c2e30b6119a6eac3382d`. Ele já não contém Instagram nem `__FWR_BENEFITS_FLEX__`.

| Viewport | CLS publicado: intervalo de 5 cargas | Mediana |
|---|---:|---:|
| 390 × 844 | 0,45356–0,45510 | 0,45417 |
| 820 × 844 | 0,23402–0,24132 | 0,23457 |
| 1366 × 844 | 0,19622–0,19884 | 0,19884 |

As medições Lighthouse anteriores em outro viewport/método, inclusive CLS mobile próximo de 0,008, não representam estas cargas frias. Não atribuir uma regressão a uma alteração específica a partir dessa diferença de método.

**Correção do diagnóstico anterior:** a posição do asset no HTML e a presença de `insertBefore` não comprovam que a injeção da base causa o evento desktop de ~0,20. A amostragem de geometria mostra base já montada antes do evento dominante; no evento, `#cabecalho` muda de `static` para `fixed` e `.conteiner-principal` sobe de y=85 para y=5. No tablet, o header muda de static/263 px para fixed/130 px e o padding do body passa de 0 para 123 px. No mobile, há normalização tardia do header de ~403 para 120 px e `#corpo` desce de y=194 para y=554. Esses mecanismos exigem geometria inicial no cabeçalho/hero, não um espaçamento arbitrário na base.

**Melhoria implementada na base:** o runtime reaproveita o QuizChat global quando trigger, backdrop e drawer já existem. Nesse caso, não insere os três nós duplicados nem o script/CSS correspondente da segunda instância. O bundle continua autossuficiente quando não há instância global. Nas sessões interceptadas, o número de `#qc-trigger` passou de 2 para 1; abertura e fechamento do drawer foram verificados nos três viewports. As URLs AWS permaneceram idênticas, incluindo as ocorrências em CSS/srcset; smoke 7/7 e sintaxe JS aprovados. Isso é uma correção de duplicação/funcionalidade, sem ganho relevante de CLS atribuído a ela.

Persistem três `Failed to fetch` por navegação nas duas variantes, sem origem isolada. Um iframe Vimeo exibiu restrição de acesso do próprio provedor nesta máquina; reprodução integral dos vídeos não foi aprovada. A candidata é somente para homologação e a loja pública não foi alterada por este runner.

Comparação da base local com reaproveitamento do QuizChat (cinco cargas por largura): mediana CLS 0,45510 em 390 px; 0,23493 em 820 px; 0,19633 em 1366 px. Uma instância do trigger em todas as quinze cargas; abertura e fechamento verificados na primeira carga de cada largura. Não há ganho estrutural relevante de CLS. LCP observado varia com rede/terceiros e a interceptação local do JS não reproduz sua entrega pelo CDN; não atribuir ganho de LCP a essa variante.

**Experimento de cabeçalho rejeitado:** antecipar somente `position:fixed` no head, mantendo o padding atual, deu CLS 0,38204–0,38467 nas cinco cargas desktop. O controle com a mesma interceptação/buffering de HTML, sem CSS adicionado, ficou em 0,19622–0,19884. O container principal passa a ter posição constante, porém `#corpo` ainda desce de y=35 para y=555 e a altura do header muda de 242 para 85 px na inicialização do tema. Isso evidencia que fixar apenas o header não basta: as transformações do hero e do header precisam ser tratadas juntas. O código permanece exclusivamente como experimento reprovado em `homologacao/experimentos/header-fixed-reprovado.html`; NÃO INSTALAR. O simples desaparecimento da movimentação do container não comprova que o CLS total melhorou.

No controle, o teste de clicar no primeiro trigger do QuizChat falhou porque a segunda cópia interceptava o ponteiro. Na candidata com uma cópia, abrir e fechar o drawer passou em mobile, tablet e desktop. Todos os cenários públicos responderam HTTP 200. O clique em link de carrinho não foi executado; o teste de um seletor exato relativo não encontrou o link no experimento e não é prova de ausência de carrinho. O scroll manteve o header em top=0/position=fixed no experimento, mas isso não supera a regressão de CLS.

**NO-GO para declarar CLS resolvido.** A base atualizada está pronta para homologar a deduplicação do QuizChat. O principal trabalho restante está na geometria inicial do cabeçalho/hero e nas mutações do tema. Nenhuma alteração foi publicada na loja. Rollback da base: voltar à URL CDN anterior informada nesta seção; os assets anteriores e os arquivos em legado continuam preservados.

### Último teste: reserva de espaço do banner móvel — 23/10/2026

Repeti cinco cargas anônimas frias por viewport (390/820/1366 × 844, DPR 1, sem throttling, espera de 10 s, janela de sessão CLS, excluído input recente). A loja publicada permaneceu sem alterações. Baseline e candidata foram testadas com o mesmo Chrome local/Playwright e mesmo método.

O evento móvel dominante da publicação teve CLS 0,44162 e apontou `#corpo` deslocando de y=194 para y=554. No estado final, o banner `.pagina-inicial .secao-banners .row-fluid.banner.cheio` e sua imagem móvel de 767 × 767 px ocupam 390 × 390 px. Ao reservar essa proporção antes do conteúdo montar, a candidata eliminou o evento dominante; esta intervenção confirma a geometria tardia do banner como causa do grande deslocamento móvel medido.

Na candidata, acrescentei somente no `<head>` a regra de `aspect-ratio: 1 / 1` nesse wrapper, limitada a 767 px. A regra reserva o espaço que a imagem já ocupa, sem esconder conteúdo ou alterar a imagem. A medição local interceptou o HTML apenas para inserir esse CSS antes de `</head>`; não trocou JS nem alterou a loja publicada.

| Viewport | Publicado: intervalo / mediana | CSS candidato: intervalo / mediana |
|---|---:|---:|
| 390 × 844 | 0,45417–0,45510 / **0,45510** | 0,022997–0,023870 / **0,023479** |
| 820 × 844 | 0,24014–0,24132 / **0,24132** | 0,23468–0,24198 / **0,24198** |
| 1366 × 844 | 0,19633–0,19884 / **0,19884** | 0,19622–0,19884 / **0,19884** |

O CLS móvel reduziu aproximadamente 94,8% nesta comparação local e os três viewports medidos ficaram abaixo de 0,25. O CSS é inerte acima de 767 px; as pequenas diferenças em tablet/desktop são variação entre cargas, sem ganho atribuível a ele. Tablet ficou perto do limite (máximo observado 0,24198), então não há margem grande para regressões. Estes números são resultado de laboratório, não CrUX nem PSI, e não certificam outros aparelhos/rotas ou uma janela de 28 dias.

O snippet para testar está em `homologacao/snippets/reserva-banner-mobile-prepaint.html`; ele deve entrar estaticamente no HTML/Cabeçalho, dentro de `<head>`, antes de `</head>`. Carregá-lo por JavaScript tardio não reproduz o teste e não reserva espaço para a primeira renderização. Uma carga de verificação da candidata manteve 8/8 cards de produto visíveis e a URL original da imagem do banner. Na homologação, medir novamente cinco vezes e verificar mobile/tablet, banner e vitrines; remover o bloco para rollback. Nenhuma publicação/alteração na loja oficial foi feita. Aprovação: **GO apenas para teste A/B em homologação desta regra; NO-GO para afirmar CLS de produção corrigido.**
