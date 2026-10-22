# CODEX — MISSÃO DE EXECUÇÃO: validar e corrigir CLS da Farmácia Malheiro

**Data do handoff:** 2026-10-22  
**Repositório:** `fwragenciadigital/fwrtema`  
**Branch de trabalho:** `malheiro/cls-preflight`  
**PR de acompanhamento:** https://github.com/fwragenciadigital/fwrtema/pull/1 (DRAFT)  
**Escopo:** apenas `Malheiro/` e testes/workflows relacionados.  
**Situação:** as fontes reais foram importadas e auditadas; *nenhuma redução de CLS na loja real foi comprovada*. Você, Codex, deve executar a verificação independente, corrigir o que os testes demonstrarem e entregar evidência comparativa.

## Ordem explícita

**Execute o trabalho, não apenas descreva o plano.** Investigue, produza correções pequenas, valide via Chrome/Playwright na loja real sem fazer alterações no site, adicione testes, documente evidências e abra/atualize commits na branch de homologação. Se acesso externo falhar, registre o bloqueio e conclua apenas as etapas comprováveis localmente; não invente métricas.

1. Leia este arquivo inteiro e os relatórios técnicos.
2. Reproduza o estado atual e **capture baseline antes de qualquer correção**.
3. Descubra qual mutação DOM ou troca de CSS causou cada Layout Shift significativo; não deduza causalidade por coincidência.
4. Valide os candidatos existentes isoladamente, descarte os que criarem regressão e implemente a solução final mínima.
5. Rode validações estáticas, testes integrados e QA visual/funcional.
6. Prepare snippets/URLs verificadas de **homologação**, mantendo produção intocada.
7. Entregue relatório de resultados com comparação *antes/depois* e checklist de aprovação; **não faça merge nem altere o painel da loja**.

## 0. Leitura obrigatória e fonte da verdade

### Fontes originais, imutáveis

- `Malheiro/legado/css/csscompactadoo-original.css` — CSS compactado principal, ~241,5 mil caracteres; contém `.produtos-carrossel { display:none; }`, `.owl-loaded { display:block; }` e regras responsivas.
- `Malheiro/legado/css/css-secundario-original.css` — CSS secundário com `body padding-top:72px!important` no desktop e compensações de banners.
- `Malheiro/legado/cabecalho/html-cabecalho-original.html` — HTML/Cabeçalho com `body padding-top:85px!important` em >=993px, proteção de QuizChat, Trustvox e classes de fade/blur.
- `Malheiro/legado/home/base-home-original.html` — HTML/Rodapé/Home com seções reposicionadas, vitrines e QuizChat.
- `Malheiro/legado/cdn/malheiroshoww-estabilizado-original.js` — JS principal da Loja Integrada, backup original (não substituir com scaffold).
- `Malheiro/legado/rodape/footer-carregamento-original.html` — otimização tardia de imagens/iframes/vídeos.
- `Malheiro/legado/cabecalho/quizchat-anexo-original.html` — referência, **não publicar uma segunda cópia** do QuizChat.
- `Malheiro/legado/configuracao/settings-tema-sanitizadas.js` — snapshot das variáveis, confirmado `menuFlutuante=true`, token ocultado; **não publicar valores sensíveis**.

### Auditorias e instruções existentes

- `Malheiro/CODEX.md`
- `Malheiro/auditoria/07-CAUSAS-CLS-CORRECOES-VALIDACAO.md`
- `Malheiro/auditoria/08-CSS-COMPACTADO-ANALISE-INTEGRADA.md`
- `Malheiro/auditoria/06-CABECALHO-QUIZ-CLS.md`
- `Malheiro/auditoria/04-ARQUIVOS-RECEBIDOS-E-CONFLITOS.md`
- `Malheiro/README.md`

Alguns relatórios anteriores foram redigidos **antes de receber o CSS compactado**; ao encontrar afirmações antigas de “CSS indisponível”, trate `08-CSS-COMPACTADO-ANALISE-INTEGRADA.md` e o código importado como referências posteriores. Não confundir hipótese documentada com resultado de teste.

## 1. HIPÓTESES P0 que precisam de testes, não de suposições

### A — Header: normal -> fixed depois do primeiro paint

- Configuração confirma `menuFlutuante=true`.
- JS do tema transforma `#cabecalho` em fixed em `$(document).ready` a partir de 769px.
- CSS secundário usa 72px >=1025px; HTML/Cabeçalho usa 85px >=993px; compacto contém altura de header 85px, estado `.fixed`, ajustes desktop e `margin-top:-60px` entre 768–992px. Mobile <=767px já possui cabeçalho fixed e padding próprio ~124px.
- Registrar posições e alturas **antes/depois do DOMReady** e **antes/depois de `.fixed`**; testar scroll, menu, carrinho e breakpoints: 360, 390, 767, 768, 769, 820, 992, 993, 1024, 1025, 1366 e 1920.
- Candidatos **mutuamente exclusivos**:
  - `homologacao/html/cabecalho-prepaint-desktop.html` (fixed desde o início com reserva 85px).
  - `homologacao/experimentos/cabecalho-sticky-sem-salto.html` (sticky no fluxo, sem padding arbitrário desktop).
- **Não escolher por intuição**: checar computed styles, fluxos de menu, ancestrais overflow, altura real, comportamento do scroll e score CLS. 85px só é válido se corresponder à geometria do tema. Não aplicar desktop aos tablets/mobile sem verificação.

### B — Owl Carousel esconde produtos e só revela após carregar

- CSS compacto: `.produtos-carrossel { display:none; }`, `.owl-loading { opacity:0; display:block; }` e `.owl-loaded { display:block; }`.
- JS remove wrappers/reconstrói vitrine e inicializa Owl em `window.load` (duas rotinas).
- Capturar `getBoundingClientRect()`, `offsetHeight`, `display`, `scrollHeight` e quantidade de slides no DOM **antes de inicializar**, **quando `.owl-loaded` aparece** e **depois de carregar imagens**. Vincular eventos de LayoutShift a essas fases.
- Experimentos, inicialmente **não aprovados**:
  - `homologacao/experimentos/csscompactadoo-owl-reserva-fluxo.css` altera apenas `display:none` -> `display:block`. Pode empilhar cards e aumentar CLS: **não usar como solução final sem layout fallback**.
  - `homologacao/experimentos/malheiroshoww-owl-domready.js` antecipa Owl de `window.load` para DOMReady; confirmar disponibilidade de plugin e de todos os itens.
- Objetivo: geometria inicial **equivalente** à geometria final em todos os breakpoints, mantendo UX do carrossel. CSS de fallback de altura, largura e número de cards, se necessário, deve ser baseado em dimensões reais, não em valores fictícios. Não esconder a página inteira.

### C — Montagem da home no HTML/Rodapé

- `.lista-one` é movida depois de `#corpo` por `insertAfter` no ready; `#fm-categorias` possuía dois posicionadores concorrentes; outras seções (marcas, vídeos, benefícios, newsletter) recebem alterações.
- `homologacao/html/home.html` retirou uma rotina duplicada; `homologacao/experimentos/home-montagem-sincrona.html` tenta adiantar a montagem.
- Como o HTML nasce no RODAPÉ, movê-lo durante o parsing **não prova** que a área do topo já estava reservada antes da primeira pintura. Se houver Layout Shift remanescente, avaliar montagem nas posições iniciais do tema ou slots reservados especificamente por módulo, dimensionados com evidência.
- Não atribuir culpa à newsletter só porque `#barraNewsletter` mudou de posição; ela pode ser uma **vítima** de conteúdo inserido acima.

### D — Riscos secundários

- Head oculta produtos até `.lazyloaded` e aplica blur até `.loaded`; não há prova de handler correspondente nas fontes importadas. Candidato `homologacao/html/cabecalho-sem-fade-arriscado.html` retira só esse bloco.
- Footer revarre todas as imagens repetidamente após DOMReady, idle e load+1s; `loading/fetchpriority` alterados tardiamente não substituem atribuição declarativa para LCP.
- HTML da home tem duas instâncias `.fwr-vc-modal`, inicializadores FlexSlider e blocos JS soltos fora de `<script>`. Não ativar handlers duplicados.
- CSS compacto tem hover com borda 1px -> 5px e vários ajustes de margens/alturas; classificar impacto em CLS **sem interação** separadamente de UX **após interação**.
- Preservar Trustvox, QuizChat, preços, frete, checkout, wishlist, formulários, ícones e recursos de produto.

## 2. Método obrigatório de verificação

1. Ambiente de navegador isolado: Chrome/Playwright, primeiro sem interceptações, depois interceptando **somente recursos do navegador de teste**. Nunca enviar requisições de escrita nem editar a loja real.
2. Executar home e ao menos PDP simples, PDP com variação, categoria e busca reais. Se não conseguir identificar uma URL válida, documentar qual faltou — não inventar.
3. Repetir pelo menos cinco cargas por cenário, com cache fria e quente, pelo menos desktop 1366x768, mobile 390x844 e tablet 820x768; adicionar breakpoints de borda relevantes. Usar rede e CPU comparáveis, registrar condições.
4. Capturar screenshots antes/depois e arquivo JSON de `PerformanceObserver` com `layout-shift` (ignorar `hadRecentInput` para CLS); quando possível, salvar trace completo do Performance DevTools com fonte da mutação.
5. Calcular CLS por **maior janela de sessão** (intervalo entre shifts <=1s, janela total <=5s). Para cada shift dominante: timestamp, score, seletor de elemento que mudou, retângulos antes/depois, mutação/código responsável e estado de header/Owl.
6. Capturar LCP e erros de console/network; verificar INP apenas com interações reproduzidas em ambiente apropriado (não inventar dados CrUX).
7. Executar variantes **isoladamente** (header prepaint, header sticky, Owl CSS, Owl DOMReady, home cedo); depois combinar somente as aprovadas. Não carregar o mesmo `malheiroshoww.js` duas vezes.
8. Verificar se `.produtos-carrossel` pode mudar `display`/altura de forma drástica e se `#cabecalho`/conteúdo principal sofrem alteração vertical durante a carga.
9. Qualquer resultado de fixture sintética já documentado NÃO conta como medição da loja. Se bloqueio por anti-bot, CDN, falta de login ou runner, registrar HTTP, erros e providenciar instrução de teste local.

**Ferramentas preparadas (examinar e reparar se necessário antes de confiar):**

```bash
node Malheiro/scripts/validar-csscompactadoo.mjs
node Malheiro/scripts/validar-cabecalho.mjs
node Malheiro/scripts/validar-homologacao.mjs
node Malheiro/scripts/validar-cls-v2.mjs
node Malheiro/scripts/validar-montagem-sincrona.mjs
node Malheiro/scripts/verificar-urls-imagens.mjs
node Malheiro/scripts/medir-cls-loja-real.mjs
```

Os workflows `.github/workflows/malheiro-cls-browser.yml` e `.github/workflows/malheiro-cls-verify.yml` foram criados em fases anteriores. **Não assumir que já passaram.** Conferir acionamento, permissões, Playwright, prioridades de roteamento, status real da loja, relatórios e artefatos. Corrigir testes frágeis antes de apresentá-los como evidência.

## 3. Restrições inegociáveis

- **TODAS as URLs de imagens AWS já existentes devem permanecer idênticas, byte a byte**, incluindo `src`, `srcset`, `data-*`, `url(...)`, protocolo, querystring e ordem quando relevantes. Não migrar imagens para GitHub, jsDelivr ou outro CDN. Criar teste automatizado que extraia e compare **todas** essas ocorrências dos originais com candidatos; os testes anteriores de 47 refs HTML e 30 refs CSS são parciais, não autorização para mudar as demais.
- Manter cópias originais em `Malheiro/legado/` inalteradas. Não apagar nem substituir arquivos de produção sem possibilidade de rollback.
- Configurações/Settings continuam editáveis no **HTML/Rodapé da Loja Integrada**; separar variáveis de customização de lógica de runtime. Nunca colocar token privado ou dados de sessão no GitHub.
- Sem backend e sem integração MCP com Loja Integrada; desenvolvimento via Cursor/Codex + GitHub e injeção temporária de JS/CSS externos **somente em homologação aprovada**.
- Evitar bibliotecas adicionais, JavaScript síncrono pesado, CSS global invasivo, mudanças no carrinho/checkout, versões diferentes de Font Awesome e mudanças de SEO/schema não relacionadas ao CLS.
- Componentes acima da dobra precisam ocupar dimensões previsíveis antes do paint. CSS crítico no Head, inicializações idempotentes, animações sem geometria em movimento, e compatibilidade com `prefers-reduced-motion`.
- Não converter `CLS: 0` de fixture em promessa de produção; não chamar um problema de “resolvido” sem evidência de navegador real.

## 4. Entregáveis obrigatórios do Codex

Criar/atualizar na PR Draft:

1. `Malheiro/auditoria/09-CODEX-RESULTADOS-CLS.md`: relatório final com:
   - inventário das 4 camadas e tabela de conflitos;
   - matriz de cenários, variações e breakpoints;
   - baseline e resultado pós-patch por cenário (CLS, LCP, bloqueios, console);
   - **fontes** de cada Layout Shift dominante, com provas/trace;
   - comparação visual mobile/desktop e QA funcional;
   - o que foi corrigido, o que foi descartado, o que ainda falta;
   - parecer `GO` / `NO-GO` para homologação e para produção, separadamente.
2. Commits dos patches efetivos em `Malheiro/`, limitados ao mínimo necessário, com arquivos fonte e build reproduzível.
3. Testes automatizados de regressão de URL, HTML, CSS, JS, categorias, vitrines e cabecalho; CI com logs e anexos JSON/screenshots/traces (ou bloqueio documentado).
4. Artefatos de **homologação**: `HTML/Cabeçalho`, `HTML/Rodapé`, CSS secundário e JS, com sequência EXATA para **substituir**, não duplicar os códigos atuais.
5. Links HTTPS de teste (JS e CSS) apontando para commit/tag identificável e **verificados HTTP 200, MIME e conteúdo atualizado**; se não houver deploy verificado, sinalizar pendência e não inventar URL funcional.
6. Após aprovação expressa do usuário, **somente preparar** versão oficial autônoma para upload na Loja Integrada; a publicação real será uma etapa posterior e autorizada à parte.

## 5. Checklist de aceite para passar da PR Draft

- [ ] Nada foi alterado na loja de produção; `master` permanece sem nova versão final da Malheiro.
- [ ] CSS compactado original completo integrado e URLs de todas as imagens preservadas.
- [ ] Header estável no primeiro paint no desktop/tablet/mobile, sem sobreposições, menu funcional e sem salto de 85/72/60px.
- [ ] Vitrines não saltam ao iniciar Owl; todas as imagens e botões estão visíveis e responsivos.
- [ ] Home: categorias, benefícios, vídeos, marcas e newsletter sem reordenação perceptível depois da pintura.
- [ ] PDP, busca, categoria, carrinho, frete, Trustvox, QuizChat, variantes e checkout sem regressões.
- [ ] Traces de Chrome antes/depois, logs de console/network e screenshots disponíveis.
- [ ] Idealmente CLS <=0,05 por cenário de laboratório; objetivo Core Web Vitals: CLS <=0,10 no percentil 75 dos dados de campo quando disponíveis, sem regressão de LCP/INP.
- [ ] Código final depende apenas dos assets nativos da Loja Integrada e das dependências já autorizadas; Settings editáveis preservadas.
- [ ] Relatório 09 entregue e decisão GO/NO-GO fundamentada.

**Regra final:** não fazer merge da PR #1 nem publicar código no painel até autorização explícita do usuário. Se o CLS continuar acima da meta, manter NO-GO e dizer qual script/regra/limitação impede a correção.
