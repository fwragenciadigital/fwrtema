# Malheiro — Modernização do frontend da Loja Integrada

**Estado:** fontes reais importadas para auditoria na branch `malheiro/cls-preflight`. NÃO colocar em produção nem substituir scripts existentes enquanto a dependência CDN principal não for auditada.

## O que já temos
| Local | Conteúdo | Estado |
|---|---|---|
| `legado/css/css-secundario-original.css` | CSS secundário completo fornecido pelo cliente | Backup imutável |
| `legado/home/base-home-original.html` | HTML/CSS/JS do rodapé/home completo | Backup imutável |
| `legado/rodape/footer-carregamento-original.html` | Otimização global de imagens/vídeos descrita no painel | Backup imutável |
| `legado/cdn/malheiroshoww-estabilizado.REFERENCIA.md` | URL do JS principal no CDN da loja | **Arquivo fonte ainda pendente** |
| `src/home/base-home-candidata-posicionamento-unico.html` | Teste de remover um dos dois posicionadores de categorias | Parcial; não publicar |
| `teste/cls-observer.js` | Diagnóstico não invasivo de CLS | Somente homologação |
| `auditoria/04-ARQUIVOS-RECEBIDOS-E-CONFLITOS.md` | Defeitos concretos e plano técnico | Pronto |
| `scripts/verificar-urls-imagens.mjs` | Compara URLs de imagens em original/candidata | Pronto |

## Arquitetura de evolução
- Desenvolvimento: Cursor/Codex + GitHub, arquivos organizados por componente e Settings no HTML/Rodapé.
- CSS crítico precisa chegar ao cabeçalho antes do layout, sem corrigir deslocamento a posteriori por margin/padding.
- JS manipula somente o que lhe pertence e não deve mover a mesma seção em dois callbacks.
- Produtos, checkout, minicart, meios de pagamento, login e frete são responsabilidade nativa da plataforma. Evitar afetá-los.
- **Todas as URLs atuais de imagens (AWS Loja Integrada) são imutáveis**, inclusive protocolo, nome e caminho. Não criar nova hospedagem de imagens.

## Execução do Codex
Ler `CODEX.md` e todos os relatórios em `auditoria/`. Conferir o código ausente do CDN antes de concluir a integração. Usar `node Malheiro/scripts/verificar-urls-imagens.mjs` para garantir URL de imagens.

## Atenção — scaffold anterior
`src/runtime.js`, `src/components/beneficios.html`, `assets/malheiro.js`, `assets/malheiro.css`, `configuracao.html` e `dist/` começaram como **estrutura demonstrativa** copiada de TractorBell, com ativação desligada. Não representam a loja real. **Não usar os links de master/Pages para testar a versão nova**; ela ainda não está publicada.

## Quando teremos links de teste?
Depois de importar o JS CDN faltante, resolver conflitos e gerar build validado na branch, disponibilizar arquivos de homologação numa publicação isolada (por exemplo, rota `/Malheiro/teste/` no Pages, após merge controlado). Conferir HTTP 200 e CSS/JS carregados antes de inserir no painel. Só após testes no site e aprovação criar o pacote definitivo sem dependência do GitHub.
