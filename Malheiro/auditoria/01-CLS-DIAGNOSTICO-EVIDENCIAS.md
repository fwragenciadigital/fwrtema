# Malheiro — Preflight de CLS (22/10/2026)

**Status:** INVESTIGAÇÃO / NÃO CORRIGIDO / SEM PUBLICAÇÃO EM PRODUÇÃO.

## Evidências históricas (não são resultados novos)
Uma auditoria anterior, baseada em captura do Google Search Console e trace do Chrome fornecidos pelo cliente, registrou:
- 423 URLs desktop afetadas: 339 com CLS 0,33 e 84 com CLS 0,41.
- Home com CLS de campo 1,00 na captura.
- LayoutShift isolado 0,993392 por volta de 898,5 ms, sem input recente.
- `.conteiner-principal` passou de top 85px para 5px (~80px de diferença).
- `#barraNewsletter` estava visível perto de y=462px antes do shift; no estado final, `offsetTop` era ~6666px.
Esses dados **não garantem que a situação ainda seja igual em outubro**. Nova medição em Chrome Performance e PSI/CrUX é obrigatória.

## Candidatos prioritários
1. Reordenação tardia do conteúdo da home (grandes blocos inseridos/movidos na inicialização), empurrando a newsletter.
2. Alteração global de aproximadamente 80px no topo: header, menu, tema, fonte, barra ou JS.
3. Assistente Farmacêutico/Quiz se ocupa espaço antes de CSS posicioná-lo como overlay.
4. Banners, vitrines, vídeos, avaliações, preços e blocos de terceiros sem dimensões pré-reservadas.
5. **Achado direto em um snapshot disponibilizado anteriormente:** `Malheiro/referencias/categorias-autoplay-snapshot-2026-10-13.html` contém markup no rodapé e usa `banner.insertAdjacentElement('afterend', sec)` no carregamento, movendo o bloco para o começo da home. Pode produzir CLS se ocorrer após o paint; testar com essa funcionalidade ligada/desligada. Como o arquivo tem data posterior à auditoria, **não é a causa demonstrada dos números históricos**.

## Reprodução obrigatória antes da correção
Chrome anônimo, desktop 1366x768 e 1920x1080; mobile 390x844 e 360x740; throttling normal e 4G lento; repetir ao menos cinco vezes por template:
- Home: https://www.farmaciamalheiro.com.br/
- PDP simples: https://www.farmaciamalheiro.com.br/sabonete-liquido-com-peroxido-de-benzoila-e-calendula-100-ml
- PDP com variações: https://www.farmaciamalheiro.com.br/produto/vitamina-b1-tiamina-250-mg-capsulas.html
- Uma página de categoria e uma página de busca reais.

Em DevTools:
1. Performance > Record and reload > faixa de Layout Shifts; salvar trace antes/depois.
2. Elements > Break on > Subtree modifications em `.conteiner-principal` e em áreas movidas; verificar Call Stack no ponto da mutação.
3. Comparar computed styles de `body`, `#cabecalho`, `.abriga-menu`, `.conteiner-principal` antes/depois do shift.
4. Verificar se `#barraNewsletter` é VÍTIMA do deslocamento, não atribuir culpa a ela sem evidência.
5. Desativar **um módulo por vez** em ambiente de teste (categoria, quiz, header, vitrine, Trustvox), manter registro do que mudou.

## Critérios de aceite
- CLS em laboratório idealmente <=0,05; sem eventos individuais dominantes na carga e scroll.
- Meta real: CLS <=0,10 no percentil 75 desktop/mobile, verificado em CrUX ao longo do tempo (janela 28 dias).
- LCP <=2,5s e INP <=200ms como metas complementares, sem regressão.
- Carrinho, variações, preço, frete, busca, menu, login, wishlist, Trustvox e checkout intactos.
- Não usar hacks de `min-height` global, margens artificiais ou ocultação indiscriminada de conteúdo.
- **Não ativar nenhum script novo na produção** antes de homologação e aceite expresso.

## Referências
Auditorias históricas salvas na Library da conversa do cliente; não são código da versão atual. Documentação: https://web.dev/articles/optimize-cls ; https://web.dev/articles/cls
