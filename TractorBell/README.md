# TractorBell — Loja Integrada

Projeto leve para edição no **Cursor** e publicação de arquivos estáticos via **GitHub Pages**.

## Arquivos

- `assets/tractorbell.js`: JavaScript do projeto (namespace `window.TractorBell`).
- `assets/tractorbell.css`: CSS isolado para não impactar estilos do tema.
- `instalacao.html`: trecho HTML para colar uma única vez na Loja Integrada.
- `index.html`: página simples para verificar o carregamento antes da instalação na loja.

## Publicar os arquivos

1. No GitHub, abra `fwragenciadigital/fwrtema` > **Settings** > **Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **master**, pasta **/(root)**, e salve.
4. Confirme que a página `https://fwragenciadigital.github.io/fwrtema/TractorBell/` abre e exibe a confirmação de JavaScript carregado.

Os links públicos são:

- CSS: `https://fwragenciadigital.github.io/fwrtema/TractorBell/assets/tractorbell.css`
- JS: `https://fwragenciadigital.github.io/fwrtema/TractorBell/assets/tractorbell.js`

**Importante:** os links só funcionarão após habilitar e concluir a publicação do GitHub Pages. O código será público: não inclua chaves, tokens ou dados privados.

## Instalar na Loja Integrada

Em uma loja compatível com código customizado, acesse **Visual > Incluir código HTML > Modo avançado > Adicionar código**.
Selecione **Código no cabeçalho**, **Tipo HTML** e a página de publicação desejada (por exemplo, **Todas as páginas exceto checkout**). Cole o conteúdo de `instalacao.html` e salve.

O novo tema padrão da Loja Integrada não oferece a inserção geral de scripts próprios. O checkout não pode ser alterado por esse fluxo.

## Desenvolver com Cursor

Abra/clona o repositório no Cursor. Faça mudanças dentro de `TractorBell/assets/`, teste no navegador e envie commit e push para `master` somente após aprovação. Com o Pages ativo, novas versões dos arquivos serão publicadas; o cache do navegador pode retardar a atualização.

**Segurança:** mantenha os seletores CSS isolados, evite dependências globais, teste no desktop/mobile e não injete lógica de checkout. Nesta versão inicial, o script só registra `window.TractorBell` e dispara o evento `tractorbell:ready`; ainda não faz alterações visuais na loja.
