# Codex — Nichelle Imports 2026

**EXECUTE PRIMEIRO:** [PROMPT_INICIAL_CODEX.md](./PROMPT_INICIAL_CODEX.md).

## Escopo
- Loja atual: https://www.nichelleimports.com.br/
- Referência visual: https://projetos.fwragenciadigital.com.br/nichelle/2026/
- Repositório: fwragenciadigital/fwrtema
- Branch: nichelle/2026-bootstrap
- Pasta: Nichelle/2026/

A base Malheiro é referência técnica de arquitetura, problemas de CLS e Settings, **não um tema para copiar sem análise**. Não carregar URLs AWS da Malheiro na Nichelle. Não copiar tokens, contatos, produtos, preços ou integrações comerciais de outra loja.

## Estado
Fase inicial: diagnóstico, mapa de layout e especificação de campos/painel. Não há autorização para modificar a loja em produção ou trocar assets dos clientes. HTML/CSS/JS e config externos deverão ser preparados e homologados depois da aprovação.

## Regras
1. Preserve Loja Integrada como fonte de preço, estoque, checkout e catálogo.
2. Verifique tipo de tema/plano e o suporte real aos campos HTML/CSS/JS.
3. Mini dashboard privado deve publicar somente configuração sanitizada e versionada para módulos próprios.
4. Nunca expor credenciais GitHub/backend no HTML público da loja.
5. CSS crítico e slots devem evitar CLS; observar protótipo real antes de criar módulos.
6. Registre indisponibilidade de URL, problemas de CORS ou execução bloqueada; não fabrique resultados.
7. Faça apenas commits na branch nichelle/2026-bootstrap; sem merge até aprovação.
