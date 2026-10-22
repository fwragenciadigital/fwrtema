# Instalação de homologação — **não usar direto na loja pública**

1. GitHub Pages não é necessário se o CDN jsDelivr funcionar. Os links usam commit Git imutável 38d36de75d6b80eb001187c96e10faff9e1c36c4. **HTTP/MIME ainda não verificados neste ambiente.**
2. Testar manualmente em navegador abrindo as URLs e checando HTTP 200, CSS `text/css` e JS `application/javascript`/tipo aceito pelo navegador. Se falhar, NÃO instalar.
3. Criar backup de todos os campos existentes do painel.
4. Na loja de testes, **substituir** o CSS secundário atual pelo link do arquivo `teste-cabecalho.html`, se o painel aceitar link no cabeçalho. NÃO manter duas cópias do CSS.
5. Substituir a tag JS original por `teste-rodape-js.html`, preservando as Settings globais do tema na ordem original. NÃO carregar original e candidato juntos.
6. Trocar a home/rodapé original pelo conteúdo de `../html/home.html` (não é uma tag de URL isolada). NÃO carregar original e candidato ao mesmo tempo.
7. Não usar o carregador global de imagens em duplicidade; durante primeiro teste mantenha o original e faça avaliação isolada antes de eliminá-lo.
8. Medir CLS e LCP em Chrome Performance/PSI; carrinho, variantes, vídeo, menu, categorias, login e checkout precisam continuar funcionando.

Esses arquivos são **candidatos mínimos de investigação**: ainda não resolvem todos os deslocamentos estruturais.
