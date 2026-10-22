# Farmácia Malheiro — Auditoria do legado recebido (22/10/2026)

## Estado da execução
- Backup completo do CSS secundário e do HTML da home na branch `malheiro/cls-preflight`.
- Cópia do carregador original de imagens/mídia do rodapé.
- Referência ao JS remoto `//cdn.awsli.com.br/1351/1351790/arquivos/malheiroshoww-estabilizado.js`.
- **Conteúdo do JS remoto ainda INDISPONÍVEL**: download recusado no ambiente de auditoria. Não criar código substituto inventado.
- Não houve publicação no painel da Loja Integrada. Branch `master` permanece fora do teste.
- A versão candidata em `src/home/base-home-candidata-posicionamento-unico.html` é parcial e **não deve ser instalada ainda**.

## Conflitos confirmados nos arquivos recebidos

### P0 — Carrossel de categorias reposicionado duas vezes
Na base-home original há dois blocos: um inicializador `posicionar()` que tenta mover `#fm-categorias` antes da primeira vitrine (com fallback para `#corpo`), e outro inicializador `posicionarCategorias()` que desloca a seção para depois de `.secao-banners`, usando `insertAdjacentElement('afterend', categorias)` e um `MutationObserver` se o banner não existir ainda.

Esses dois alvos não são equivalentes: um posicionamento sobrescreve o outro, com trabalho de DOM desnecessário e potencial CLS. A candidata REMOVE a rotina de posicionamento antes da primeira vitrine, mantendo apenas a segunda. Ainda há **um reposicionamento tardio**, portanto não é solução definitiva de CLS.

### P0 — Blocos extensos movidos após parsing
`jQuery(function($){ $('.lista-one').insertAfter('#corpo'); });` move uma seção enorme do rodapé após o documento inicial, potencialmente alterando a geometria da página. Outras seções usam wrappers `.disable` (`.lista-two`, `.videos-box`, `.box-new-sobre`) cujo posicionamento final pode depender do JavaScript remoto, indisponível para análise.

### P0 — CSS com compensações globais de geometria
No CSS secundário há `body { padding-top:72px!important; }` em desktop (>1025px), `.pagina-inicial .secao-banners {margin-top:-80px}` em outro breakpoint e `.pagina-inicial .fundo_banner {margin-top:-58px}`, além de `top:175px`. Não eliminar essas regras no escuro: mapear CSS computado do tema/JS e a causa raiz do deslocamento `.conteiner-principal` observado historicamente.

### P1 — Duplicação do modal de vídeo
O HTML inclui **duas instâncias** `.fwr-vc-modal`. O código `querySelector('.fwr-vc-modal')` seleciona só a primeira. Precisa rastrear se a segunda tem uso por outro script antes de removê-la.

### P0/P1 — Dois blocos JavaScript fora de tags `<script>`
Logo depois do encerramento `</script>` do controlador institucional, o HTML contém duas funções autoexecutáveis de texto puro, começando por `(function () { ... window.__FWR_VC_HARDENED__ ... })();` e `(function(){ ... window.__FWR_BENEFITS_FLEX__ ... })();`, seguidas de `<style>`. Em HTML renderizado normalmente, o navegador não executa esses blocos; são texto solto na página. Antes de convertê-los em scripts executáveis, verificar se o arquivo do CDN já oferece esses recursos: ativar dois handlers pode causar novas regressões.

### P1 — Prioridades de imagem incoerentes
O HTML contém **39 `img`**, 5 marcações `fetchpriority='high'` e diversos `loading='lazy'`. O bloco `footer-carregamento-original.html` busca a maior imagem geométrica dentro de 1,25 viewports, alterando `fetchpriority`, `loading`, `decoding` após `DOMContentLoaded`, durante idle e após `load + 1s`. O navegador já iniciou muitos downloads nesse ponto: essas mudanças tardias não corrigem a descoberta inicial do LCP e adicionam varreduras de layout repetidas. Substituição recomendada: política declarativa por componente, aplicada no HTML inicial, sem varredura global.

### P1 — Carrossel e vídeos
Existe `$(window).load(...flexslider...)` para `.flexslider` e outra inicialização de `flexslider` baseada no breakpoint com tentativas via `setInterval`. A inicialização tardia pode alterar tamanhos. Também há duas rotinas de modal de vídeo e iframe Lightwidget. Não alterar sem regressão funcional.

### P1 — Preços e botão de compra
O HTML faz `fetch` da própria PDP e tenta extrair preços/parcelamentos de HTML, JSON-LD e texto. Há seletor de botão `.fwr-cat-hero__buy` mas markup apresenta `.fwr-cat-hero__buyy`. Não modificar regras comerciais sem validar as variantes e os destinos reais; há risco de preço errado ou CTA com significado incorreto.

## Imagens preservadas
- HTML original: 39 tags `img`, 47 referências a imagens do CDN via `src`, `data-bg`, `data-product-img`.
- Candidata parcial: as mesmas 47 referências no mesmo posicionamento relativo da string, sem substituir nenhuma URL.
- CSS original: continuar carregando imagens do CDN pelos caminhos originais. Não renomear, migrar nem comprimir URLs.
- Script automático de revisão: `scripts/verificar-urls-imagens.mjs`.

## Próximo bloqueio
Importar o conteúdo real de `malheiroshoww-estabilizado.js` do CDN ou receber o arquivo por upload. Só então integrar o carregador único de layout, deduplicar modal, estabilizar geometria, consolidar CSS e gerar URLs de homologação. Até lá, qualquer bundle que afirme reproduzir a loja por inteiro seria incompleto.

## Teste e deploy
Branch de trabalho: `malheiro/cls-preflight`. **GitHub Pages configurado a partir de `master` não publica os arquivos dessa branch.** Não colar os links de `master` como se fossem a versão refatorada. Planejar merge controlado ou workflow de preview isolado após os testes. Os códigos da loja não foram alterados.
