# Nichelle Imports — Frontend 2026 (Loja Integrada)

## Objetivo
Transformar o protótipo 2026 em módulos customizados de HTML/CSS/JS para a Loja Integrada, usando GitHub/Codex/Cursor durante desenvolvimento e preservando as regras comerciais da plataforma.

- Loja atual: https://www.nichelleimports.com.br/
- Protótipo: https://projetos.fwragenciadigital.com.br/nichelle/2026/
- Prompt de execução: [PROMPT_INICIAL_CODEX.md](./PROMPT_INICIAL_CODEX.md)
- Instrução resumida: [CODEX.md](./CODEX.md)

## Fase atual
Somente análise de layout, inventário de funções e arquitetura de dashboard. O link do protótipo não foi inspecionado nesta sessão por indisponibilidade de acesso na ferramenta; o Codex deve tentar via Chromium e, se persistir, registrar bloqueio. **Nenhum visual ou campo do protótipo deve ser inventado.**

## Proposta de mini dashboard
A FWR terá um painel separado e autenticado para editar dados de seus módulos: banners, textos, vitrines (IDs e categorias da Loja Integrada), marcas, benefícios, cards, imagens URLs, ordem, visibilidade e escopo de página. Um serviço autenticado publica um JSON sanitizado e versionado. O JavaScript público da loja lê apenas o JSON publicado, com fallback e reserva de geometria; não recebe tokens. Rascunho/publicação/rollback e isolamento dev/prod são obrigatórios.

**Modo de entrega:** atualizar conteúdo via dashboard exige manter um endpoint externo de configuração. Se a entrega final remover todas as dependências externas e hospedar arquivos integralmente na Loja Integrada, atualizações remotas deixam de existir e precisam ser exportadas/publicadas manualmente.

## Segurança e não intervenção
- Não tocar em Loja Integrada, master ou pasta Malheiro durante a fase inicial.
- Não copiar imagens/IDs de Malheiro; as imagens da Nichelle serão fornecidas/hospedadas à parte.
- Não alterar checkout nem criar um segundo sistema de preços/estoque.
- Checar compatibilidade do tema/plano da Loja Integrada com código customizado antes de instalar.
