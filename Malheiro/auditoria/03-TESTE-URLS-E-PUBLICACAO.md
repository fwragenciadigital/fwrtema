# Malheiro — URLs e gates de publicação

## Repositório e ambiente de desenvolvimento
- Pasta: https://github.com/fwragenciadigital/fwrtema/tree/master/Malheiro
- Página de preview: https://fwragenciadigital.github.io/fwrtema/Malheiro/
- CSS: https://fwragenciadigital.github.io/fwrtema/Malheiro/assets/malheiro.css
- JS: https://fwragenciadigital.github.io/fwrtema/Malheiro/assets/malheiro.js

**ATENÇÃO:** acima são URLs calculadas para o GitHub Pages; disponibilidade HTTP ainda não foi confirmada. Ativar Pages em Settings > Pages: Deploy from a branch, `master`, `/(root)`, se estiver desativado.

## Snippets de desenvolvimento
- `Malheiro/dist/desenvolvimento-cabecalho.html`: link CSS.
- `Malheiro/dist/desenvolvimento-rodape.html`: settings + script externo.
- Aplicar somente em loja de teste ou modo de homologação suportado pelo tema, **não ligar na loja real** sem aprovação.
- O arquivo `Malheiro/configuracao.html` vem com `malheiroAtivo=false` e `beneficiosAtivo=false`.

## Verificação de integridade
1. Abrir a URL do preview, inspecionar Console e aba Network.
2. Confirmar status 200 de CSS e JS e ausência de erros de sintaxe.
3. Na cópia homologada da Loja Integrada: conferir montagem de componentes em slots realmente reservados; nenhum componente de exemplo deve ser ativado na primeira instalação.
4. Gravar Performance/CLS nas mesmas URLs, antes e depois, em múltiplas execuções.
5. Validar responsividade, navegação e compra sem alterações no fluxo nativo.

## Teste de produto / diagnóstico
- Página inicial: https://www.farmaciamalheiro.com.br/
- PDP simples: https://www.farmaciamalheiro.com.br/sabonete-liquido-com-peroxido-de-benzoila-e-calendula-100-ml
- PDP de variações: https://www.farmaciamalheiro.com.br/produto/vitamina-b1-tiamina-250-mg-capsulas.html
- PSI desktop: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.farmaciamalheiro.com.br%2F&form_factor=desktop
- PSI mobile: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.farmaciamalheiro.com.br%2F&form_factor=mobile

## Final independente
Após homologação: rodar `node Malheiro/scripts/build.mjs`, revisar `Malheiro/dist/producao-cabecalho.html` e `Malheiro/dist/producao-rodape.html`, substituir **ambos** os blocos de desenvolvimento por esses blocos finais (nunca misturar), remover links externos do GitHub, validar Network e registrar versão de rollback. Publicação definitiva somente após autorização.
