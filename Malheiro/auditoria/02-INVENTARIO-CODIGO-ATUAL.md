# Malheiro — Inventário de migração para Codex

**Estado em 22/10/2026:** repositório tem scaffold Malheiro (cópia do TractorBell) e **um snapshot anterior** de categorias. **Não há comprovação de que a versão completa e atual do painel da Loja Integrada esteja neste GitHub.**

## Arquivo existente como referência
`Malheiro/referencias/categorias-autoplay-snapshot-2026-10-13.html`: HTML+CSS+JS fornecido anteriormente, **não ativado** pelo scaffold, com placeholders `URL_CDN_...`, portanto NÃO pronto para produção. Revisar posicionamento tardio.

## Para importar fielmente o que está em produção
Obter cópias exatas, com data e contexto de publicação, de:
1. Painel Loja Integrada > Visual > Incluir código HTML > todos os blocos **Cabeçalho**, com nomes, página-alvo, tipo e posição.
2. Painel > Incluir código HTML > todos os blocos **Rodapé**.
3. CSS personalizado em área de edição visual do tema, inclusive overrides relevantes.
4. JS, bibliotecas, snippets GTM, scripts externos, widget Trustvox, videos, quiz, comparador, banners, vitrines e outros códigos não presentes nos campos HTML.
5. URLs de assets usados (CDN) e catálogo de funcionalidades por página.

Salvar dados íntegros em área privada de backup; **remover tokens, senhas, IDs de sessão e credenciais** antes de colocá-los no GitHub público. O exemplo de configuração anteriormente anexado possui um `id_token` de Instagram: **NÃO copiar esse segredo**.

## Organização sugerida dos arquivos migrados
`Malheiro/legado/cabecalho/`, `Malheiro/legado/rodape/`, `Malheiro/legado/css/`, `Malheiro/legado/modulos/`, `Malheiro/docs/`. O Codex audita o legado sem sobrescrever `src/` até a análise de dependências.

## Ordem do refactor
1. Baseline visual/performance do site real, incluindo trace CLS.
2. Diffs de todos os códigos ativos; mapa da ordem de execução e DOM.
3. Isolar o módulo que move header/blocos; corrigir primeira renderização, reservar slot antes de hidratar.
4. Converter demais módulos gradualmente em `src/components/`, `src/runtime.js` e `assets/malheiro.css`.
5. Preservar `configuracao.html` como Settings simples do HTML/Rodapé, sem segredos.
6. Build e testes; aceite em preview isolado; depois homologação integrada na Loja Integrada.

## Regra de deploy
Somente o conteúdo de `dist/` aprovado poderá ser instalado no painel, e apenas após testes. Não considerar a URL pública do GitHub Pages uma prova de compatibilidade com o tema ou de CLS.
