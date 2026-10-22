# Instalação de homologação — **não usar direto na loja pública**

1. GitHub Pages não é necessário se o CDN jsDelivr funcionar. Os links usam commit Git imutável `9636c3a095fb966f6c79f93ba728dd8eb214c327`. HTTP/MIME foram verificados; ainda assim, a candidata não está aprovada para instalação porque os resultados de CLS seguem reprovados.
2. Testar manualmente em navegador abrindo as URLs e checando HTTP 200, CSS `text/css` e JS `application/javascript`/tipo aceito pelo navegador. Se falhar, NÃO instalar.
3. Criar backup de todos os campos existentes do painel.
4. Na loja de testes, **substituir** o CSS secundário atual pelo link do arquivo `teste-cabecalho.html`, se o painel aceitar link no cabeçalho. NÃO manter duas cópias do CSS.
5. Substituir a tag JS original por `teste-rodape-js.html`, preservando as Settings globais do tema na ordem original. NÃO carregar original e candidato juntos.
6. Para contornar a rejeição de arquivos `.html` no Gerenciador, carregar `../assets/home-malheiro.js` na loja de teste usando a chamada de `carregar-home-malheiro.html`. A base HTML está serializada dentro desse JS; não renomeie o HTML nem use `fetch` para tentar baixá-lo.
7. Não usar o carregador global de imagens em duplicidade; durante primeiro teste mantenha o original e faça avaliação isolada antes de eliminá-lo.
8. Medir CLS e LCP em Chrome Performance/PSI; carrinho, variantes, vídeo, menu, categorias, login e checkout precisam continuar funcionando.
9. O asset insere os módulos após `#corpo #listagemProdutos.listagem.borda-alpha` quando a vitrine existir. Como é inserção por JavaScript, isso não garante estabilidade de layout: não aprovar sem medir na loja de teste.

Esses arquivos são **candidatos mínimos de investigação**: ainda não resolvem todos os deslocamentos estruturais.
