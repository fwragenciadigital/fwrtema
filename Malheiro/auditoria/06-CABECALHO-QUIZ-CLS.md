# Malheiro — HTML/Cabeçalho e QuizChat: integração e riscos (22/10/2026)

## Fontes originais importadas
- `legado/cabecalho/html-cabecalho-original.html`: bloco de preconnect, csscompactadoo.css, Font Awesome, regras de geometria, Quiz/Trustvox e segundo bloco com animações/fade/blur.
- `legado/cabecalho/quizchat-anexo-original.html`: arquivo de 369 linhas com marcação, estilos, dados de produtos e inicialização do QuizChat. Este material já está presente em partes dentro do HTML da home anteriormente fornecido (estilos/markup em uma posição e código JS no final).
- Fontes anteriores: `legado/css/css-secundario-original.css`, `legado/home/base-home-original.html`, `legado/cdn/malheiroshoww-estabilizado-original.js`.
- `https://cdn.awsli.com.br/1351/1351790/arquivos/csscompactadoo.css` é CSS hospedado externamente e não foi baixado nesta auditoria. **Não afirmar que seu conteúdo já foi auditado**.
- `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css` permanece referenciado pela home.

## Conflitos (prioridade por risco)

### P0 — três fontes de geometria do cabeçalho
- HTML/Cabeçalho declara `@media(min-width:993px) html body:not(.pagina-carrinho):not(.carrinho-checkout) {padding-top:85px!important}`.
- CSS secundário declara `body {padding-top:72px!important}` em regra responsiva.
- JS do tema, quando `menuFlutuante===true` e `min-width:769px`, mede `#cabecalho.height()`, aplica `$('body').css('padding-top',altura)` e usa `#cabecalho position:fixed`.
- Com ambos os CSS carregados, a regra de 85px no cabeçalho domina a de 72px para os seletores correspondentes; o JS em linha sem `!important` não a substitui. O valor fixo pode divergir da altura real do cabeçalho e os breakpoints JS/CSS (769 vs 993) não são equivalentes.
- **Não remover 85px, 72px ou fixed isoladamente.** Medir altura real do cabeçalho e traces em 769/992/993/1025/1026px, além de 1366px, desktop e mobile, e decidir **um dono da geometria**.

### P0/P1 — CSS de ocultação sem confirmação de controlador
- Segundo `<style>` do cabeçalho define `.listagem-item`, `.banner-end`, `.banner-central-marcas`, `.banner-tarja-central` com `opacity:0` e `translateY(20px)`; só libera com classe `.lazyloaded`.
- Aplica `filter:blur(10px)` nas imagens até ganhar classe `.loaded`.
- Busca textual no JS `malheiroshoww-estabilizado-original.js` e no HTML da home não encontrou código adicionando essas classes. **Algum outro script pode fazê-lo**, mas não podemos presumir isso. Se ausente, elementos ficam invisíveis/desfocados. `opacity`/`transform` não implicam necessariamente CLS, porém mascaram o carregamento e degradam a experiência/LCP visual.
- **Candidato preparado:** `homologacao/html/cabecalho-sem-fade-arriscado.html` remove SOMENTE o segundo `<style>` (973 caracteres), preservando as quatro URLs `<link>`, preconnect, CSS do header/Quiz/Trustvox e demais regras. Regressão visual necessária; ainda há risco CLS real da montagem dinâmica.

### P0 — QuizChat potencialmente duplicado
- O anexo contém `id="qc-trigger"`, `id="qc-drawer"`, `id="qc-backdrop"`, estilos `.qc-*` e scripts do quiz. A home anterior já contém os mesmos IDs uma vez e contém um inicializador `const WHATS_NUMBER` mais adiante, no fim do HTML.
- **Não inserir o anexo em HTML/Cabeçalho além da home**. O quiz deve ter um único dono; se for extraído da home para componente, remover a cópia antiga na mesma alteração.
- O anexo usa `<script defer>` **inline**: `defer` não adia a execução de scripts inline; se colocado no head, seus `getElementById` podem retornar nulo porque os elementos ainda não foram criados. Manter após o markup ou inicializar com DOM ready.
- O HTML/Cabeçalho contém `#qc-drawer[aria-hidden=true/false]` para controlar visibilidade; manter sincronização `aria-hidden`/`hidden` com eventos.

### P1 — dependências e CSS de imagens
- `csscompactadoo.css` é carregado do CDN da Loja Integrada e pode ter regras de layout; ainda não foi possível verificar seu conteúdo.
- Font Awesome 5.11.2 é dependência CSS externa. Não duplicar fontes, preferir não trocar versão sem regressão de ícones.
- Regra global `img {max-width:100%;height:auto}` e `aspect-ratio:1/1` em imagens PDP/listagem podem prevenir CLS em alguns templates mas devem ser verificadas contra imagens originais do tema; não mudar URLs.
- CSS Trustvox e QuizChat são correções direcionadas; mantê-las no candidato inicial.

## Critérios para continuar
1. Todos os originais imutáveis em `legado/`, incluindo URLs AWS sem mudanças.
2. Executar `node Malheiro/scripts/validar-cabecalho.mjs` para garantir que o candidato alterou apenas o bloco de animação.
3. Não ativar o QuizChat anexado novamente enquanto existir dentro da home.
4. Fazer captura visual e Performance no tema real usando versão original e candidata em homologação.
5. Só após confirmar as regras de layout reais ajustar 85px/72px/posicionamento fixo, reservas de banner, vitrines Owl e módulos `.lista-one`.
6. Merge/publicação em `master` e instalação definitiva **continuam bloqueados**.

**Importante:** sem acesso ao painel de testes ou ao CSS compactado, a causa final e a melhora do CLS ainda não estão comprovadas.
