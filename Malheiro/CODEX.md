# Malheiro — Handoff para Codex/Cursor (22/10/2026)

## Escopo
Substituir o scaffold da pasta Malheiro por arquitetura organizada e fiel aos códigos efetivamente usados na Loja Integrada. Prioridades: **fluidez, CLS, LCP/INP, estabilidade visual, Settings editáveis no HTML/Rodapé** e entrega final independente do GitHub.

Trabalhar na branch `malheiro/cls-preflight`; não publicar no painel da loja sem aprovação.

## Fontes recebidas (preservar como backup intocável)
- CSS secundário completo: `legado/css/css-secundario-original.css`.
- HTML completo do bloco Home / Rodapé: `legado/home/base-home-original.html`.
- Rotina de carregamento final: `legado/rodape/footer-carregamento-original.html`.
- CDN principal externo: `//cdn.awsli.com.br/1351/1351790/arquivos/malheiroshoww-estabilizado.js` **conteúdo ainda não obtido**; registrado em `legado/cdn/malheiroshoww-estabilizado.REFERENCIA.md`.
- Candidato parcial: `src/home/base-home-candidata-posicionamento-unico.html` (não publicar).

## Evidências dos conflitos confirmados
Consultar `auditoria/04-ARQUIVOS-RECEBIDOS-E-CONFLITOS.md`.
1. Carrossel `#fm-categorias` com dois posicionadores: antes da primeira vitrine e depois de `.secao-banners`; candidato eliminou o primeiro.
2. `.lista-one` movido por jQuery `insertAfter('#corpo')`; `.lista-two`, `.videos-box`, `.box-new-sobre` também dependem de montagem externa.
3. CSS muda geometria do topo (`body padding-top:72px`, `.secao-banners margin-top:-80px`, `.fundo_banner margin-top:-58px`). Não remover sem trace/visão do cabeçalho.
4. **Dois blocos de JS soltos fora de `<script>`** após o modal de vídeo: `__FWR_VC_HARDENED__` e `__FWR_BENEFITS_FLEX__`. Identificar se o CDN fornece equivalentes. Não ativar cegamente.
5. Existem dois `.fwr-vc-modal` e múltiplas inicializações de `flexslider`; consolidar preservando comportamento.
6. Footer escaneia TODAS as imagens e sobrescreve prioridade/lazy depois do parse (ready/idle/load). Migrar para política declarativa por bloco, não executar varredura global tardia.
7. Há extração dinâmica de preços de HTML das PDPs; preservar sem alterar regras de variantes/carrinho até testes.

## Restrições obrigatórias
- **URLs de imagens devem permanecer byte a byte idênticas**, com mesma ordem e caminhos da AWS Loja Integrada. Verificar com `node Malheiro/scripts/verificar-urls-imagens.mjs`. A candidata parcial preservou 47 referências de imagens CDN.
- Manter os links de produtos, Vimeo, Lightwidget, Trustvox e WhatsApp existentes; alterar somente depois de avaliação explícita. Não copiar credenciais/tokens para GitHub público.
- Não modificar checkout, minicart, frete, login, carrinho nem estruturas internas da plataforma.
- Não usar novo JS que injete grandes blocos sem uma reserva de layout **antes do primeiro paint**. Não esconder a página inteira ou aplicar margens compensatórias arbitrárias.
- Settings/Variables editáveis no rodapé (enabled flags, textos, cores, posições), scripts idempotentes, CSS crítico no cabeçalho e carregamento de mídia controlado na origem.
- Não usar MCP ou API da Loja Integrada.

## Roteiro de execução
1. Conseguir e auditar **o conteúdo exato** do JS CDN. Registrar ownership dos seletores, bibliotecas, eventos e ordem de inicialização.
2. Mapear dependências entre CDN JS, CSS e HTML; capturar trace base de CLS e subárvore de DOM.
3. Corrigir prioridade P0: montagem única das seções, posição estável da home/heading, deduplicar scripts/movimentos. Se não for possível montar antes do paint via campos HTML, documentar dependência de template e testar reserva de espaço específica.
4. Separar HTML dos componentes, CSS e JS sem duplicar lógica. Escrever testes unitários/smoke + verificações de URLs.
5. Gerar pacote **desenvolvimento** com JS/CSS externos para teste e pacote **final** HTML/CSS/JS embutidos, Settings editáveis no rodapé.
6. Validar desktop/mobile em home, PDP simples, PDP com variantes, busca, categoria e carrinho. Medir CLS/LCP/INP e logar efeito antes/depois. Alvo lab CLS <=0,05; campo CLS p75 <=0,10 (janela de 28 dias).
7. Somente com aceite, criar versão de teste publicável por Pages e depois preparar instalação definitiva. Não misturar scripts atuais e substitutos na mesma home, salvo compatibilidade comprovada.

## Diagnóstico
`teste/cls-observer.js` é **read-only** e pode capturar eventos de Layout Shift via PerformanceObserver se inserido no cabeçalho. Não é uma correção. O GitHub Pages, se configurado para `master`, não publica a branch de preflight; não fornecer URLs da branch como se fossem homologação pronta.

## Não esquecer
Backup de produção deve ser mantido. Não mexer no que funciona até haver teste funcional e comparação visual.
