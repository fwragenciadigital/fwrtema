# Malheiro — integração do JS do tema e homologação v0.1 (22/10/2026)

## Arquivo recebido
- Nome: malheiroshoww-estabilizado.js; 159.549 bytes no anexo original (UTF-8 com BOM).
- SHA-256 do anexo: d504599d2629873c8cf889c121c8918ed692a7f720f4f599d7762ddbba5c2e2a
- Backup completo: `legado/cdn/malheiroshoww-estabilizado-original.js`.
- O upload foi feito mantendo o BOM, e o conteúdo recuperado no GitHub tem 159.380 caracteres (inclui BOM).
- Sintaxe: `node --check` no anexo original e na candidata JS passou. Isso não é um teste funcional/browser.

## Responsabilidades do JavaScript principal de tema (baseado no conteúdo real)
1. No `$(document).ready(...)` reordena logo, busca, carrinho, login, atendimento, menu superior e rodapé. Faz `.barra-inicial.remove()` e diversas inserções/movimentações via jQuery.
2. Quando `menuFlutuante===true`, calcula `#cabecalho.height()`, executa `$('body').css('padding-top', altura)` e torna `#cabecalho` fixed no desktop. Conflita potencialmente com `body {padding-top:72px!important}` do CSS secundário. A causa exata do CLS requer trace e valores reais de configuração.
3. Banners: `$('.secao-banners').prepend($('.banner.cheio'))` foi executado **duas vezes** sob a mesma condição `info-banner.titulo:contains("Full")`. Candidata remove **apenas a segunda movimentação**; a primeira continua funcional. Alerta: ainda pode haver shift.
4. Vitrines: remove `unwrap()` sucessivos e navegação Flexslider dos produtos, embute Owl Carousel e inicializa depois de `window.load`. Requer monitorar tamanho de vitrine antes/depois e dependência de jQuery.
5. Elementos adicionais: `abriga-marcas` antes da newsletter ou do rodapé, múltiplas alterações na newsletter, rodapé, página de produto, parcelas e produto flutuante. Não alterar cegamente.
6. O HTML da home move `.lista-one` após `#corpo`, e tenta mover `#fm-categorias` para dois alvos. Na candidata foi removido o primeiro posicionador (antes da vitrine), mantendo o posicionamento após banner. Permanece problema de potencial deslocamento após paint.
7. `__FWR_VC_HARDENED__` e `__FWR_BENEFITS_FLEX__` apareciam como texto fora de tags `<script>`; na candidata esse texto foi retirado. Não ativar os handlers sem revisão contra o JS do tema.
8. O bloco `footer-carregamento-original.html` escaneia imagens após o DOM: sugerido eliminá-lo do bundle final e aplicar lazy/eager no HTML de origem após testar o LCP real.

## Arquivos de homologação produzidos (NÃO finais)
- `homologacao/assets/malheiroshoww.js`: candidato JS original com uma movimentação duplicada eliminada.
- `homologacao/assets/css-secundario.css`: cópia fiel do CSS original sem alterações.
- `homologacao/html/home.html`: HTML candidato com só um posicionamento do carrossel e texto de dois handlers JS órfãos removido.
- `teste/cls-observer.js`: instrumentação para detectar Layout Shifts sem modificar layout.

## Restrições para o Codex
- As 47 referências CDN do HTML da home foram comparadas entre original e candidata: **idênticas e na mesma ordem**.
- Não renomear, redirecionar ou mudar domínio/protocolo de nenhuma imagem da AWS.
- Não minificar novamente o JS principal nem removê-lo até conseguir substituir integralmente funções.
- Não adicionar a candidata por cima da versão original no mesmo site; para testar é necessário **substituir** a referência JS original no HTML existente do ambiente de homologação. A mesma regra vale para o CSS e a home.
- O código do tema depende de variáveis globais do painel; preservar configurações existentes.
- Rodar testes de frontend com tema real: não temos evidência de que o JS tenha funcionado em browser local/integrado ou que CLS esteja resolvido.

## Links provisórios via jsDelivr para teste
Repositório GitHub público. As URLs abaixo são **calculadas**, mas ainda não foi confirmado HTTP 200, MIME correto, CORS ou execução real. São construídas apontando para um commit imutável de homologação; verificar Network no browser antes de colar em uma loja de teste.

Base `https://cdn.jsdelivr.net/gh/fwragenciadigital/fwrtema@<COMMIT>/Malheiro/homologacao/`
- `assets/malheiroshoww.js`
- `assets/css-secundario.css`

GitHub Pages, caso ativo, serve a branch `master` e **não** disponibiliza diretamente a branch `malheiro/cls-preflight`. Não usar URLs de master para avaliar os ajustes da branch.

## Passos de homologação
1. Preservar backup dos campos HTML cabeçalho, HTML rodapé e CSS secundário no painel.
2. Na loja de TESTE, confirmar que o CSS original da loja e o HTML original correspondem aos arquivos importados.
3. Deixar a configuração global existente do tema; trocar **somente** a URL do JS principal pela candidata, sem duplicar scripts.
4. Aplicar CSS candidato e HTML candidato por substituição apenas em ambiente isolado; conferir ordem de carregamento e Console.
5. Instrumentar CLS no cabeçalho **antes da montagem**, capturar traces e comparar com baseline da mesma página/viewport.
6. Testar home, categorias, busca, PDP com variações, carrinho, menus, vídeos, footer e checkout antes de merge.
7. Após correções estruturais adicionais e autorização explícita, gerar arquivo independente hospedado na Loja Integrada.

**Esta etapa é apenas v0.1 de integração e saneamento; não constitui correção comprovada de CLS.**
