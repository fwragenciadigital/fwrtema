# Malheiro — CSS compactado integrado: análise cruzada de CLS (22/10/2026)

## Fonte auditada
- CSS anexado pelo cliente: `legado/css/csscompactadoo-original.css` (241.529 caracteres no GitHub, sem alterações de URL).
- Parse por `tinycss2`: 1.194 nós de regras/at-rules de nível superior, **0 erros de sintaxe** no conteúdo analisado.
- Fonte secundária: `legado/css/css-secundario-original.css` (33.115 caracteres, 0 erros), mais `legado/cabecalho/html-cabecalho-original.html`, `legado/home/base-home-original.html`, `legado/cdn/malheiroshoww-estabilizado-original.js`, `legado/configuracao/settings-tema-sanitizadas.js`.
- URLs de imagem no CSS compacto: **30 ocorrências para 13 recursos AWS únicos**; preservar **literalmente** as URLs e ocorrências. O CSS do painel ainda deve ser comparado com o CDN ativo em uma visita real.

## P0 — vitrine invisível até carregar Owl
Compactado, no nível global:
```css
.produtos-carrossel { display: none; width: 100%; position: relative; z-index: 1; }
.owl-loading { opacity: 0; display: block; }
.owl-loaded { display: block; position: relative; }
```
JavaScript do tema: `.listagem .produtos-carrossel .listagem-item` passa por quatro `unwrap()` e a vitrine chama `.owlCarousel()` dentro de `$(window).on("load", ...)` em duas variantes.

**Mecanismo:** cards do catálogo estão ocultos no layout inicial e podem aparecer já com grandes dimensões quando o Owl inicia, provocando Layout Shift na região abaixo. O CSS também pode causar LCP ruim por ocultar temporariamente conteúdo relevante. É a maior nova descoberta do CSS compactado. É **causa potencial confirmada pelo código**, ainda não atribuída ao CLS histórico por trace do navegador.

### Experimento isolado
`homologacao/experimentos/csscompactadoo-owl-reserva-fluxo.css`: troca só `display:none` por `display:block` na primeira regra `.produtos-carrossel`; 30 URLs AWS são idênticas ao original. **NÃO considerar correção final**: até o Owl aplicar sua estrutura, os filhos podem ficar empilhados e a altura pode diminuir depois, piorando CLS. Medir a geometria antes de definir layout estático provisório com dimensões compatíveis.

Não instalar o CSS do experimento sobre o compacto original simultaneamente. Experimento JS independente `homologacao/experimentos/malheiroshoww-owl-domready.js` antecipa a inicialização para DOMReady, mas depende de DOM e plugin prontos; também não é automaticamente seguro. Avaliar A/B dos dois mecanismos separadamente.

**Correção alvo:** primeira pintura da vitrine deve usar uma grade ou carrossel estático de altura equivalente ao resultado final, com largura, número de cards e espaço de imagem pré-determinados por breakpoint; a inicialização do Owl só adiciona interatividade sem alterar geometria da linha. Exige observar DOM real (antes e depois dos quatro unwrap) para definir CSS seletor correto.

## P0 — três estratégias de topo, e o quarto componente também participa
Compactado:
- `#cabecalho` global: `top:0`, transição geral e sombra.
- `.fixed`: `position:fixed` global.
- `#cabecalho .cabecalho-conteiner .row-fluid`: `min-height:85px` global.
- `@media (min-width:992px) and (max-width:9999px)`: `#cabecalho.fixed .cabecalho-conteiner .row-fluid` reduz `min-height` a 60px + 6px padding; a regra do HTML/Cabeçalho com `85px!important` tende a impedir esse encolhimento.
- `@media (min-width:768px) and (max-width:992px)`: `#cabecalho.fixed {margin-top:-60px;padding-top:24px}`. Potencial deslocamento visual do header de tablet ao receber `.fixed`.
- `@media (max-width:767px)`: `body {padding-top:124px}` e `#cabecalho {position:fixed;padding-top:23px!important}`: **mobile já reserva e fixa inicialmente; preservar até medição**.

Secundário: `body{padding-top:72px!important}` no desktop, além de compensações de banners. HTML/Cabeçalho: `body padding-top:85px!important` a partir de 993px. JS com `menuFlutuante=true` passa header a fixed e ajusta body padding no DOMReady a partir de 769px.

**Conclusão:** no desktop, fixar o cabeçalho antes da pintura é opção v1 (`homologacao/html/cabecalho-prepaint-desktop.html`), mas 85px pode não corresponder à **altura total** incluindo menu. O CSS compacto acrescenta transição, encolhimento e offsets que devem ser controlados.

### Alternativa mais robusta em teste, sem altura arbitrária
`homologacao/experimentos/cabecalho-sticky-sem-salto.html` adiciona CSS desktop >=993px:
```css
html body:not(.pagina-carrinho):not(.carrinho-checkout){padding-top:0!important}
html body:not(.pagina-carrinho):not(.carrinho-checkout) #cabecalho{
  position:sticky!important; top:0!important; z-index:201;
}
```
Com `!important`, esse CSS vence a propriedade `position:fixed` atribuída inline pelo JS e mantém o cabeçalho dentro do fluxo mesmo depois do DOMReady. A classe `.fixed` pode continuar alterando cores/altura do menu; portanto **testar sticky vs fixed** em vários tamanhos e com scroll. Sticky depende de não haver um ancestral com overflow que interrompa aderência.

**Não instalar simultaneamente as opções header prepaint-fixed e sticky.** Para tablets 768..992 continua necessária decisão baseada em trace (offset -60px). Mobile <=767 preservado nesta etapa.

## P1 — regras adicionais de geometria
- `.pagina-inicial .secao-banners {margin-top:40px}` no CSS compacto >=992px, enquanto secundário chega a `margin-top:-80px` em outro intervalo. Considerar ordem, especificidade e breakpoint, não somar regras cegamente. CSS de head não modifica esse seletor.
- `.fundo_banner {display:none}` global e `.fundo_banner {display:none!important}` mobile: compensações de margens desse bloco podem ser irrelevantes quando oculto.
- `.listagem .span3 .imagem-produto` usa alturas de **300px** desktop, **210px** <=767, **215px** <=500 e **165px** <=375; títulos e preços têm alturas e paddings adicionais. Não usar um único valor de placeholder para todos os breakpoints.
- `.fwr-vita__bg{min-height:1200px}` com absolute; o contêiner de cima `.fwr-vita` possui conteúdo flexível e pode mudar de altura após montagem. Atenção ao `margin:70px 0` na versão <=560px.
- Vários componentes (`.fwr-vc`, `.insta-footer`, `#barraNewsletter`) apresentam margens/paddings altos e podem ser realocados pelo HTML/Rodapé: o problema é **momento da inserção**, não necessariamente sua altura.
- Há regra de hover com border 1px alterando para 5px na vitrine: pode causar salto durante interação; CSS de hover com borda deveria preservar espessura e usar outline/box-shadow. Layout shift após interação tem regras de exclusão temporal específicas e ainda pode prejudicar UX.

## Prioridade técnica — o que fazer antes de afirmar CLS solucionado
1. Registrar baseline (trace, Layout Shift Regions e snapshots) da **loja real** em mobile 390, tablet 820/992 e desktop 993/1025/1366.
2. Testar **apenas header** com o candidato sticky-flow, verificar computed headerPosition, altura total, menu/scroll e body padding. Se não mantiver sticky ou quebrar experiência, avaliar prepaint fixed com reserva real medida.
3. Testar **apenas vitrine** com experimentos CSS e antecipação Owl (não simultâneos), coletar DOM pre-Owl/pós-Owl e valores de altura/posição dos dois momentos. Criar fallback responsivo que preserve altura real.
4. Testar home com reposicionamento mais cedo; módulos criados no HTML/Rodapé *depois da primeira pintura* podem exigir slots no HTML inicial, especialmente antes de banner/vitrine. Não resolver com ocultação global ou 6000px artificiais.
5. Validar QuizChat só uma vez, modais sem IDs duplicados, preço/carrinho, Trustvox, busca, login e checkout.
6. Comparar no mesmo viewport/hardware/rede várias execuções. Meta CLS lab <=0,05 sem deslocamentos dominantes; dado real CLS p75 <=0,1 quando houver amostras suficientes (janela de 28 dias). LCP/INP sem regressão.
7. Somente após testes de navegador produzir os arquivos oficiais e remover a dependência do GitHub.

## Ferramentas existentes
- `scripts/validar-csscompactadoo.mjs`: gate de integridade dos arquivos originais e dos dois experimentos isolados.
- `scripts/medir-cls-loja-real.mjs`: infraestrutura de teste Playwright criada; validação da execução ainda pendente.
- `.github/workflows/malheiro-cls-browser.yml` na branch e `.github/workflows/malheiro-cls-verify.yml` em master; status real das execuções ainda não confirmado.

**Status honesto: análise de arquivos completa. Correções candidatas criadas, mas CLS da loja real não está comprovadamente corrigido.**
