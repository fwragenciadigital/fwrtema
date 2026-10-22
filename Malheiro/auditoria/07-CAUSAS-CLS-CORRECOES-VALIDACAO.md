# Malheiro — Conclusão da análise de CLS e correções controladas (22/10/2026)

## Escopo e limites
Arquivos auditados: `legado/home/base-home-original.html`, `legado/css/css-secundario-original.css`, `legado/cabecalho/html-cabecalho-original.html`, `legado/cabecalho/quizchat-anexo-original.html`, `legado/cdn/malheiroshoww-estabilizado-original.js` e `legado/rodape/footer-carregamento-original.html`.

**LACUNA:** `https://cdn.awsli.com.br/1351/1351790/arquivos/csscompactadoo.css` foi identificado mas não pôde ser obtido pelas ferramentas desta sessão. Sem seu conteúdo e uma execução no site real, isto é uma **análise completa das fontes entregues**, mas não uma auditoria completa de todas as folhas que o navegador carrega. **Não é possível atestar CLS corrigido em produção.**

## Análise causal, com fatos e hipóteses separados

### P0 — Cabeçalho convertido em fixed após o primeiro layout
FATOS:
- `HTML/Cabecalho` aplica `padding-top: 85px !important` em `>=993px`; também `min-height:85px` para #cabecalho, mas não o torna fixed desde o começo.
- O CSS secundário contém `body {padding-top:72px!important}` sob `@media(min-width:1025px)`. O cabeçalho tem maior especificidade (85px domina quando carregado).
- O JavaScript do tema faz, em `$(document).ready` com `menuFlutuante===true` e `min-width:769px`: `lt=$('#cabecalho').height()`, `body.css('padding-top', lt+'px')` e `#cabecalho.css({position:'fixed',z-index:'201'})`.
- Portanto, o cabeçalho **sai do fluxo do documento depois da montagem inicial**; isso pode deslocar `.conteiner-principal` para cima. A regra `padding-top:85px!important` imposta antes do script não elimina esse salto; antes, corpo tem padding + cabeçalho normal, e depois, corpo tem padding + cabeçalho fixed.

EXPERIMENTO REPRODUZÍVEL DE GEOMETRIA (não é a Malheiro real):
- Fixture Chromium desktop 1366x768: late fixed -> CLS **0,062225**; fixed desde paint com espaço reservado -> CLS **0**.
- Fixture Chrome 820px: sem patch tablet, 0,103659 antes/depois (patch deliberadamente só >=993px).
- Estes números são de uma **página fictícia controlada** com header 85px; não são resultados PageSpeed da loja.

CORREÇÃO PROPOSTA EM HOMOLOGAÇÃO:
- `homologacao/html/cabecalho-prepaint-desktop.html`: parte do candidato sem fade/blur, adiciona marca de prepaint antes de renderização e CSS que torna `#cabecalho` fixed **desde o primeiro paint** nos desktops >=993px, com reserva de 85px. **Só instalar no tema em que menuFlutuante esteja habilitado**, e validar altura real do header e possíveis sobreposições.
- `homologacao/assets/css-secundario-sem-padding-duplicado.css`: remove apenas o `body {padding-top:72px!important}` redundante do CSS secundário; o head continua responsável por 85px no desktop. Preserva URLs e demais regras.
- Testar 993, 1024, 1025, 1280, 1366, 1920 e 2560px; **tablets 769..992 ainda não corrigidos** por falta de medidas e layout específico. Não ativar correção tablet sem conhecer altura efetiva.

### P0 — Inserções e movimentação de seções após primeira pintura
FATOS:
- `base-home-original.html` contém `jQuery(function($){ $('.lista-one').insertAfter('#corpo'); })`: move uma seção de home que já foi escrita no HTML/Rodapé.
- `#fm-categorias` tem duas rotinas que o movem para lugares diferentes; candidata removeu apenas uma rotina. A outra move o nó para depois da área de banners.
- `malheiroshoww-estabilizado.js` coloca `.banner.cheio` no início de `.secao-banners`, movimenta menu/banners, e reconstrói vitrines em Owl após `window.load`.
- `#barraNewsletter` pode ser **vítima** da inserção de grandes blocos acima dele (investigar trace para estabelecer qual bloco).
- Remover a segunda chamada de `prepend('.banner.cheio')` elimina trabalho redundante, mas **não prova redução de CLS**: como o elemento já se encontra no mesmo container, o segundo prepend pode ser inócuo.

EXPERIMENTO DE LABORATÓRIO:
- Simulação de seção 420px deslocada do fim da página para antes da newsletter **após first paint** gerou CLS 0,129312 em 1366x768, 0,215415 em 820x768 e 0,235254 em 390x844.
- A mesma seção no DOM inicial, no local correto, produziu CLS zero no laboratório. **Isto só confirma o mecanismo, não corrige a loja.**

CORREÇÃO ESTRUTURAL NECESSÁRIA:
- Para eliminar CLS de blocos grandes é necessário renderizá-los no destino **antes da primeira pintura**, ou reservar o espaço dimensionado corretamente **antes do paint**. Uma montagem que só começa no HTML/Rodapé pode ocorrer depois do paint, independentemente de `defer`/`DOMContentLoaded`.
- Não definir `min-height:6000px` global, não esconder a página inteira e não reposicionar o footer com hacks.
- O Codex deve determinar se a Loja Integrada permite markup inicial nas posições de destino (tema, widget nativo, slots reais). Se não permitir, medir e implementar reserva de espaço **por módulo** com base nos breakpoints reais. Essa etapa ainda depende do DOM e viewport reais da loja, não é responsável fazer valores arbitrários.
- Enquanto isso, manter a home em `homologacao/html/home.html` como **candidata parcial** e NÃO divulgar como pronta.

### P1 — Carrossel Owl inicializado somente após window.load
- O JS atual remove 4 wrappers de `.listagem .produtos-carrossel .listagem-item`, remove controles Flexslider e só instala Owl no `window.load`. O atraso aumenta o período com layout intermediário.
- Experimento isolado `homologacao/experimentos/malheiroshoww-owl-domready.js`: altera **somente** os 2 inicializadores Owl dos produtos para `$(document).ready`, mantém bibliotecas e URLs. JS sintaticamente válido localmente, mas o carrossel **ainda não foi testado** contra imagens, widths/height, breakpoints e dependências no tema. Não instalar este experimento junto com outro malheiroshoww.
- Se causar regressão, adotar inicialização específica com reserva de dimensões e validação dos nós antes de trocar o evento.

### P1 — Ocultação por lazyloaded/loaded sem handler conhecido
- O cabeçalho atual usa opacity 0 e blur 10px em vitrines até ganhar classes `lazyloaded` e `loaded`; as fontes de JS/HTML recebidas não adicionam essas classes aos containers.
- `homologacao/html/cabecalho-sem-fade-arriscado.html` remove só o segundo bloco de estilo: nenhuma URL de CSS/imagem foi alterada. O candidato prepaint incorpora essa limpeza.
- `opacity` e `transform` geralmente **não criam CLS geométrico**: a correção principal é visibilidade, experiência e medição de LCP, não deve ser contabilizada como ganho comprovado em CLS.

### P1 — Footer altera prioridades das imagens depois da descoberta
- `footer-carregamento-original.html` revarre todas as imagens no DOMReady, idle e load+1s, calcula retângulos e muda `loading` e `fetchpriority` **tardiamente**. Pode produzir trabalho extra, não garante melhora de LCP e conflita com atributos declarados nas imagens.
- Na home: 39 tags <img>, 31 têm width + height, 26 lazy e 5 fetchpriority high. Imagens acima da dobra devem ter estratégia prioritária no **HTML inicial**, não após load.
- Recomendar retirada gradual do escaneamento global em homologação, confirmando que banners, iframes e vídeos não regressaram. URLs AWS intocadas.

### P1 — Quiz e modais
- QuizChat já está dentro da home, mas seu HTML e script estão em regiões diferentes. O anexo é backup — **não carregar pela segunda vez**.
- `<script defer>` inline não oferece defer real; colocar após o markup é o caminho seguro.
- Duas instâncias de `.fwr-vc-modal` e handlers JS em texto solto requerem deduplicação cuidadosa. Não ativar handlers antes de verificar todos os pontos de montagem.

## Critérios de aceite REAL (ainda pendentes)
1. Backup e baseline da home e PDP em 390x844, 820x768, 992x768, 993x768, 1024x768, 1025x768, 1366x768 e 1920x1080.
2. Com Chrome DevTools > Performance, 5 reloads com cache fria e quente; salvar scores **antes/depois**, call stacks e lista de LayoutShifts (sem input recente).
3. Comparar `MalheiroCLS.report()` (observador `teste/cls-observer.js`) e `document.querySelector('.conteiner-principal').getBoundingClientRect().top` ao longo das fases.
4. Validar que o header não cobre conteúdo, que a reserva coincide com sua altura e que topo não muda na primeira rolagem.
5. Validar todos os tipos de vitrine, banner, categorias, quiz, vídeo, login, carrinho, pagamento, página de produto, frete, Trustvox, checkout.
6. Aceite lab CLS <= 0,05 ideal e sem regressão LCP/INP; meta CrUX campo CLS <= 0,10 p75 ao longo dos 28 dias subsequentes. **Não afirmar fix antes desses resultados.**
7. Só depois de aceite preparar o bundle final independente do GitHub. Manter tudo na branch `malheiro/cls-preflight` e PR Draft até confirmação.

## Referências de fonte e metodologia
- Códigos enviados pelo cliente nos campos HTML/Cabeçalho, HTML/Rodapé, CSS secundário e JS externo.
- Relatório histórico anterior da Malheiro, que registrou shift ~0,993 e `.conteiner-principal` 85→5px (não pode ser tratado como performance atual).
- Google web.dev: https://web.dev/articles/optimize-cls e https://web.dev/articles/cls
