# Malheiro — Modernização do frontend da Loja Integrada

**Estado:** fontes reais importadas para auditoria na branch `malheiro/cls-preflight`. NÃO colocar em produção nem substituir scripts existentes enquanto a dependência CDN principal não for auditada.

## O que já temos
| Local | Conteúdo | Estado |
|---|---|---|
| `legado/css/css-secundario-original.css` | CSS secundário completo fornecido pelo cliente | Backup imutável |
| `legado/home/base-home-original.html` | HTML/CSS/JS do rodapé/home completo | Backup imutável |
| `legado/rodape/footer-carregamento-original.html` | Otimização global de imagens/vídeos descrita no painel | Backup imutável |
| `legado/cdn/malheiroshoww-estabilizado.REFERENCIA.md` | URL do JS principal no CDN da loja | **Arquivo fonte recebido, veja o backup ao lado** |
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

## Links de teste e próximos passos
O JS CDN já foi importado em `legado/cdn/malheiroshoww-estabilizado-original.js`. A versão candidata mínima está em `homologacao/assets/`, a home correspondente em `homologacao/html/home.html`, e a análise técnica em `auditoria/05-INTEGRACAO-JS-TEMA-E-HOMOLOGACAO.md`. Conferir HTTP 200 e CSS/JS antes da instalação isolada, sem duplicar scripts. Ainda não é uma correção de CLS validada.

## HTML/Cabeçalho importado (22/10)
- Backup dos códigos ativos de Cabeçalho: `legado/cabecalho/html-cabecalho-original.html`.
- QuizChat anexo preservado: `legado/cabecalho/quizchat-anexo-original.html`. A home já contém markup e JavaScript do QuizChat; **não instalar o anexo pela segunda vez**.
- Ajuste mínimo e conservador, ainda NÃO validado em loja: `homologacao/html/cabecalho-sem-fade-arriscado.html`; somente segundo `<style>` do fade/blur foi removido (973 caracteres). CSS crítico, URLs originais e regras do topo foram preservados.
- CSS adicional linkado em `https://cdn.awsli.com.br/1351/1351790/arquivos/csscompactadoo.css` não foi baixado nesta auditoria, portanto não está inventariado internamente.
- Detalhes: `auditoria/06-CABECALHO-QUIZ-CLS.md`.
- Teste: `node Malheiro/scripts/validar-cabecalho.mjs`.


## Escopo CSS fechado — 22/10/2026
- Fonte compactada completa: `legado/css/csscompactadoo-original.css` (241.530 caracteres; preservadas as URLs AWS).
- Relatório técnico combinado de CSS compactado, CSS secundário, HTML/Cabeçalho e JS do tema: `auditoria/08-CSS-COMPACTADO-ANALISE-INTEGRADA.md`.
- Experimento de Owl (**não publicar sem trace**): `homologacao/experimentos/csscompactadoo-owl-reserva-fluxo.css`; remove `display:none` inicial de `.produtos-carrossel` e **pode piorar CLS se os filhos empilharem antes do Owl**.
- Experimento de header sticky desktop (**alternativo** ao prepaint fixed): `homologacao/experimentos/cabecalho-sticky-sem-salto.html`; mantém o header no fluxo e remove padding-top artificial >=993px. Sem teste de rolagem/DOM real.
- Testes automatizados: `node Malheiro/scripts/validar-csscompactadoo.mjs` + demais scripts de CLS.
- Particularidade tablet: compactado faz `#cabecalho.fixed { margin-top:-60px }` entre 768..992px; mobile <=767 já usa fixed desde CSS, com reserva de 124px.
- **Status:** quatro fontes principais entregues e auditadas, mas CLS real não está provadamente corrigido; não realizar deploy ou merge por enquanto.
