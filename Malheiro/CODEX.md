# Malheiro — Handoff para Codex/Cursor (22/10/2026)

## Escopo
Substituir o scaffold da pasta Malheiro por arquitetura organizada e fiel aos códigos efetivamente usados na Loja Integrada. Prioridades: **fluidez, CLS, LCP/INP, estabilidade visual, Settings editáveis no HTML/Rodapé** e entrega final independente do GitHub.

Trabalhar na branch `malheiro/cls-preflight`; não publicar no painel da loja sem aprovação.

## Fontes recebidas (preservar como backup intocável)
- CSS secundário completo: `legado/css/css-secundario-original.css`.
- HTML completo do bloco Home / Rodapé: `legado/home/base-home-original.html`.
- Rotina de carregamento final: `legado/rodape/footer-carregamento-original.html`.
- CDN principal externo: `//cdn.awsli.com.br/1351/1351790/arquivos/malheiroshoww-estabilizado.js` **conteúdo obtido, versão original disponível em `legado/cdn/malheiroshoww-estabilizado-original.js`**; registrado em `legado/cdn/malheiroshoww-estabilizado.REFERENCIA.md`.
- Candidato parcial: `src/home/base-home-candidata-posicionamento-unico.html` (não publicar).

## Evidências dos conflitos confirmados
Consultar `auditoria/04-ARQUIVOS-RECEBIDOS-E-CONFLITOS.md`.
1. Carrossel `#fm-categorias` com dois posicionadores: antes da primeira vitrine e depois de `.secao-banners`; candidato eliminou o primeiro.
2. `.lista-one` movido por jQuery `insertAfter('#corpo')`; `.lista-two`, `.videos-box`, `.box-new-sobre` também dependem de montagem externa.
3. CSS muda geometria do topo (`body padding-top:72px`, `.secao-banners margin-top:-80px`, `.fundo_banner margin-top:-58px`). Não remover sem trace/visão do cabeçalho.
4. **Dois blocos de JS soltos fora de `<script>`** após o modal de vídeo: `__FWR_VC_HARDENED__` e `__FWR_BENEFITS_FLEX__`. Identificar se o CDN fornece equivalentes. Não ativar cegamente.
5. Existem dois `.fwr-vc-modal` e múltiplas inicializações de `flexslider`; consolidar preservando comportamento.
6. Footer escaneia TODAS as imagens e sobrescreve prioridade/lazy depois do parse (ready/idle/load). Migrar para política declarativa por bloco, não executar varredura global tardia.
7. Há extração dinâmica de preços de HTML das PDPs; preservar sem alterar regras de variantes/carrinho até testes.

## Restrições obrigatórias
- **URLs de imagens devem permanecer byte a byte idênticas**, com mesma ordem e caminhos da AWS Loja Integrada. Verificar com `node Malheiro/scripts/verificar-urls-imagens.mjs`. A candidata parcial preservou 47 referências de imagens CDN.
- Manter os links de produtos, Vimeo, Lightwidget, Trustvox e WhatsApp existentes; alterar somente depois de avaliação explícita. Não copiar credenciais/tokens para GitHub público.
- Não modificar checkout, minicart, frete, login, carrinho nem estruturas internas da plataforma.
- Não usar novo JS que injete grandes blocos sem uma reserva de layout **antes do primeiro paint**. Não esconder a página inteira ou aplicar margens compensatórias arbitrárias.
- Settings/Variables editáveis no rodapé (enabled flags, textos, cores, posições), scripts idempotentes, CSS crítico no cabeçalho e carregamento de mídia controlado na origem.
- Não usar MCP ou API da Loja Integrada.

## Roteiro de execução
1. Auditar o conteúdo exato importado do JS CDN; o primeiro mapa de conflitos está em `auditoria/05-INTEGRACAO-JS-TEMA-E-HOMOLOGACAO.md`. Registrar ownership dos seletores, bibliotecas, eventos e ordem de inicialização.
2. Mapear dependências entre CDN JS, CSS e HTML; capturar trace base de CLS e subárvore de DOM.
3. Corrigir prioridade P0: montagem única das seções, posição estável da home/heading, deduplicar scripts/movimentos. Se não for possível montar antes do paint via campos HTML, documentar dependência de template e testar reserva de espaço específica.
4. Separar HTML dos componentes, CSS e JS sem duplicar lógica. Escrever testes unitários/smoke + verificações de URLs.
5. Gerar pacote **desenvolvimento** com JS/CSS externos para teste e pacote **final** HTML/CSS/JS embutidos, Settings editáveis no rodapé.
6. Validar desktop/mobile em home, PDP simples, PDP com variantes, busca, categoria e carrinho. Medir CLS/LCP/INP e logar efeito antes/depois. Alvo lab CLS <=0,05; campo CLS p75 <=0,10 (janela de 28 dias).
7. Somente com aceite, criar versão de teste publicável por Pages e depois preparar instalação definitiva. Não misturar scripts atuais e substitutos na mesma home, salvo compatibilidade comprovada.

## Diagnóstico
`teste/cls-observer.js` é **read-only** e pode capturar eventos de Layout Shift via PerformanceObserver se inserido no cabeçalho. Não é uma correção. O GitHub Pages, se configurado para `master`, não publica a branch de preflight; não fornecer URLs da branch como se fossem homologação pronta.

## Não esquecer
Backup de produção deve ser mantido. Não mexer no que funciona até haver teste funcional e comparação visual.

## Atualização 22/10 — JS do tema recebido
- Fonte original completa: `legado/cdn/malheiroshoww-estabilizado-original.js`.
- Candidato JS com segunda chamada duplicada de `prepend()` removida: `homologacao/assets/malheiroshoww.js`.
- CSS e HTML de teste: `homologacao/assets/css-secundario.css` e `homologacao/html/home.html`.
- **Ainda não corrigimos CLS estrutural**. Avaliar cabeçalho fixed e `body` padding-top dinâmico vs 72px important, vitrines Owl após load e movidas, `lista-one` e `fm-categorias` após DOMReady, antes de chamar pronto.

## Novo material — códigos reais do HTML/Cabeçalho
- Ler `legado/cabecalho/html-cabecalho-original.html` e `legado/cabecalho/quizchat-anexo-original.html`.
- Ler `auditoria/06-CABECALHO-QUIZ-CLS.md` antes de modificar CSS ou QuizChat.
- São três controladores concorrentes do topo: CSS secundário `padding-top:72px!important`; CSS do head `padding-top:85px!important`; JS do tema `body.css('padding-top',height)` com header fixed. Breakpoints não coincidem (769px JS vs 993px head). Confirmar por viewport e altura real.
- O CSS de head ocultava os produtos e banners com `opacity:0` até receber `.lazyloaded`, e desfocava imagens até `.loaded`. Esses eventos não foram localizados nas fontes recebidas; outro script pode existir. Candidato que remove só esse efeito: `homologacao/html/cabecalho-sem-fade-arriscado.html`.
- O quiz anexado já existe na home (markup e JS, ainda que em partes separadas): NÃO duplicar IDs nem adicionar o anexo ao head. `<script defer>` inline ignora defer; exige montagem de DOM antes do JS.
- Testar `node Malheiro/scripts/validar-cabecalho.mjs` e validar visualmente; **não publicar na loja sem confirmação**.

## Diagnóstico aprofundado e testes (22/10/2026)
- Leia primeiro `auditoria/07-CAUSAS-CLS-CORRECOES-VALIDACAO.md`; tem tabelas causais, evidências e critérios de aceite.
- O arquivo real de Settings foi importado em `legado/configuracao/settings-tema-sanitizadas.js`; **menuFlutuante=true confirmado**, portanto o tema fixa o header no DOMReady. Token de integração foi redigido antes de publicar no GitHub público.
- CSS externo `csscompactadoo.css` ainda indisponível para revisão; não assumir que a análise de todas as regras está completa.
- Teste de header em desktop: `homologacao/html/cabecalho-prepaint-desktop.html` (pré-fixa o header no head >=993px). CSS limpo: `homologacao/assets/css-secundario-sem-padding-duplicado.css`. Nunca aplicar isoladamente sem verificar as Settings e altura real.
- Experimento home: `homologacao/experimentos/home-montagem-sincrona.html` adianta o DOM, mas não substitui HTML inicial; não é uma correção de CLS garantida.
- Experimento Owl: `homologacao/experimentos/malheiroshoww-owl-domready.js` inicializa as vitrines no DOMReady, em vez de window.load. **Não adicionar ao JS original**, apenas substituir em homologação isolada.
- Testes estáticos: `node Malheiro/scripts/validar-cls-v2.mjs`, `node Malheiro/scripts/validar-montagem-sincrona.mjs`.
- Medição real (sem escrita na loja): `node Malheiro/scripts/medir-cls-loja-real.mjs` usa Playwright e intercepta somente a sessão de browser; pode rodar pelo workflow `malheiro-cls-verify.yml` (GitHub Actions). **Resultados ainda não conferidos**. 
- Números de fixture 1366px de header 0,062225→0 e seções 0,129312→0 são só experimentos controlados, NÃO métricas da Malheiro.
- Sem trace real antes/depois, nenhum merge da PR Draft e nenhum upload final no painel.


## CSS compactado importado — 22/10 (auditoria agora inclui as quatro camadas)
- Backup integral: `legado/css/csscompactadoo-original.css` (241.530 caracteres).
- CSS validado com `tinycss2`: 0 erros estruturais; CSS secundário também 0.
- Relatório obrigatório: `auditoria/08-CSS-COMPACTADO-ANALISE-INTEGRADA.md`.
- **P0 comprovado no código:** `.produtos-carrossel{display:none}`, `.owl-loading{opacity:0;display:block}`, `.owl-loaded{display:block}`; o JS monta Owl após `window.load`. Isso pode causar um deslocamento ao aparecer uma vitrine inteira. Teste `homologacao/experimentos/csscompactadoo-owl-reserva-fluxo.css` troca apenas um `display:none` por `display:block`, mas **é diagnóstico, não solução pronta**; sem layout inicial dimensionado os cards podem empilhar e piorar CLS.
- Breakpoint tablet 768..992: `#cabecalho.fixed{margin-top:-60px;padding-top:24px}`; JS `menuFlutuante=true` ativa o fixed a partir de 769px. Requer medição e correção separada.
- Desktop >=993: além da solução anterior fixed-prepaint há alternativa **preferencial para ensaio** `homologacao/experimentos/cabecalho-sticky-sem-salto.html`, que mantém header no fluxo e remove necessidade de padding-top artificial; o CSS com `!important` sobrepõe o `fixed` inline de JS. Verificar se sticky funciona com o DOM real, ancestrais overflow, menu e rolagem.
- Mobile <=767: compactado já posiciona `#cabecalho{position:fixed}` e `body{padding-top:124px}` inicialmente, **não reusar 85px do desktop**. Confirmar visual.
- Não utilizar os dois candidatos de header juntos. Não utilizar dois JS malheiroshoww juntos; não sobrescrever ZIP/URLs imagens.
- Compare CSS original/candidato com `node Malheiro/scripts/validar-csscompactadoo.mjs` (incluído no workflow).
- A meta é **corrigir** layout, não disfarçar a métrica: DOM pre-Owl e pós-Owl precisam ter mesma geometria; evitar CSS global `display:none` da vitrine sem fallback com dimensões apropriadas. Registrar Chrome Performance e LayoutShift entries antes/depois.
- **Bloqueio de merge e publicação permanece** até existir uma comparação real de CLS na loja, aceite visual e QA de compra.
