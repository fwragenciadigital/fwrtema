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
