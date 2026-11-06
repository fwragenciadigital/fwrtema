# PROMPT DE EXECUÇÃO — CODEX | Nichelle Imports 2026

> **Missão inicial:** analisar a loja atual e o layout proposto, propor a arquitetura de implementação na Loja Integrada e especificar um painel de configurações para vitrines e blocos customizados. **Não publicar nem substituir arquivos na loja sem aprovação.**

## Contexto e referências

- Loja atual: https://www.nichelleimports.com.br/
- Layout de referência aprovado para estudo, ainda não necessariamente para implantação: https://projetos.fwragenciadigital.com.br/nichelle/2026/
- Repositório: `fwragenciadigital/fwrtema`
- Branch exclusiva: `nichelle/2026-bootstrap`
- Diretório deste projeto: `Nichelle/2026/`
- Projeto usado apenas como referência **técnica**, não como fonte de identidade visual: `Malheiro/`, sobretudo `Malheiro/CODEX.md`, `Malheiro/auditoria/07-CAUSAS-CLS-CORRECOES-VALIDACAO.md`, `Malheiro/auditoria/08-CSS-COMPACTADO-ANALISE-INTEGRADA.md` e documentação de carregamento/Settings.
- Stack destino: Loja Integrada com HTML/Cabeçalho, HTML/Rodapé, CSS e JavaScript *se o plano/tema instalado permitir*. Confirmar capacidade antes de qualquer integração.

**Importante:** o endereço do protótipo 2026 pode estar temporariamente inacessível a crawlers/CI. Tente abrir num navegador real e capture screenshots; se houver bloqueio, registre o erro e solicite export HTML/CSS/JS ou screenshots. **Não invente a aparência, blocos, cores, fontes, interações ou estrutura do layout.** Separe fatos observados, hipóteses e itens a validar.

## Objetivo do trabalho

Criar a base de um novo projeto independente, profissional e editável para a Nichelle, aproveitando as boas práticas de Malheiro (separação HTML/CSS/JS, diagnóstico de CLS e inicialização idempotente), mas **NÃO copiar diretamente** JS minificado, CSS compacto, imagens, dados, preços, IDs, categorias, contatos ou identificadores da Malheiro.

Queremos trabalhar com Codex/Cursor + GitHub enquanto desenvolvemos. As imagens serão carregadas e hospedadas separadamente e suas URLs serão fornecidas em seguida. Na homologação, links externos versionados serão testados; na entrega final, a estratégia de hospedagem/independência deve ser documentada.

### Fase 1 — Diagnóstico e inventário (EXECUTAR AGORA)

1. Abra a loja atual e o protótipo `/nichelle/2026/` em desktop (1440px), tablet (820px) e mobile (390px), sem fazer alterações externas.
2. Registre screenshots, estrutura de páginas, seções, classes, IDs, dependências JS, sliders, menus, banners, frete, vitrines, product cards, PDP, busca, categorias, carrinho e footer.
3. Confirme, mediante código e/ou documentação, a capacidade de adicionar JS/CSS/HTML no tema e plano da Loja Integrada. Se não for possível confirmar pela vitrine pública, marque como **DEPENDÊNCIA A VALIDAR NO PAINEL**, não presuma.
4. Compare design atual × protótipo. Crie uma tabela: bloco/posição, finalidade, comportamento desktop/mobile, origem dos dados, imagem/URL necessária, dependência do tema, responsabilidade do JS, risco CLS e prioridade.
5. Colete baseline de performance da página atual, se possível usando Chromium/Playwright e PerformanceObserver: CLS com session windows, LCP, navegação, erros de Console e recursos externos. Identifique o que o tema já oferece nativamente para evitar duplicar funções.
6. Preserve a loja e o checkout. Não fazer mutações que alterem pedidos, clientes, pagamento, preços ou carrinho durante os testes.

### Fase 2 — Arquitetura e Settings (EXECUTAR AGORA)

Proponha a seguinte arquitetura modular (adapte justificadamente conforme o DOM real):

```text
Nichelle/2026/
  README.md
  CODEX.md
  PROMPT_INICIAL_CODEX.md
  auditoria/
    01-LOJA-ATUAL.md
    02-MAPA-LAYOUT-2026.md
    03-CAMPOS-EDITAVEIS.md
    04-ARQUITETURA-DASHBOARD.md
  src/
    modules/
    styles/
    runtime/
  config/
    schema.json
    defaults.json
  integracao/
    cabecalho.html
    rodape.html
  dashboard/            # desenho/POC após aprovação do mapeamento
  testes/
  imagens/
    MANIFESTO.md       # registro de URLs fornecidas, sem mover assets
```

- Um único ponto de inicialização JS, módulos idempotentes e seletores específicos `fwr-nichelle-*` para evitar colisão com o CSS do tema.
- HTML/CSS/JS separados em desenvolvimento; **CSS crítico no cabeçalho**, ações no rodapé quando apropriado, e atributos dimensionais de imagens/vídeos para mitigar CLS.
- Não mover seções pesadas após first paint sem slot/reserva no DOM inicial. Nada de `display:none` seguido de grande inserção que desloque a página.
- Guardas por tipo de página (home/categoria/busca/produto) e fallbacks quando elemento ainda não existe.
- **Fonte da verdade dos preços, estoque, descontos, variantes e checkout deve permanecer a Loja Integrada.** Painel não deve estabelecer preço paralelo nem forjar disponibilidade.
- Settings editáveis com validação de tipos, limites de itens e preview. Exemplos de campos propostos, **não definitivos**:
  - Site: nome, cores, tipografia, containers, feature flags, versão publicada.
  - Banner: desktop/mobile URL, alt, proporção, destino, ordem, exibição.
  - Categorias/marcas: título, subtítulo, ícone, URL, ordem, ativo.
  - Vitrines: identificador, título, subtítulo, fonte (categoria/seleção de IDs), limite, ordem, layout mobile/desktop, navegação/autoplay, CTA, exibição.
  - Cards editoriais: mídia, texto, botão, imagem, alinhamento, condições por página.
  - Régua de benefícios: ícone, nome, descrição, URL, ordem, ativo.
  - Vídeo/UGC: Vimeo ou outra URL validada, capa, proporção, som/autoplay, ordem e regras de exibição.
  - Escopo: quais páginas recebem o componente, estado rascunho/publicado e, posteriormente, datas de campanha.
- Somente criar os campos que correspondam aos módulos efetivamente encontrados no protótipo; registrar o restante como sugestões opcionais.

### Fase 3 — Painel externo de administração (PROPOR AGORA; IMPLEMENTAR APÓS APROVAÇÃO)

A FWR deseja um **mini dashboard privado**, sem necessidade de criar painel dentro da Loja Integrada, para mudar conteúdo e opções de HTML/JS refletidos na loja.

Proponha uma versão mínima com:
1. Admin privado hospedado sob domínio da FWR; login/autorização apenas para administradores designados.
2. Configuração de apresentação **pública e sanitizada** (`published.json` ou endpoint equivalente) consumida pelo JavaScript da loja via HTTPS e CORS autorizado. Nenhuma credencial pode ser exposta ao navegador da loja.
3. Edição de banners, vitrines, lista de produtos por IDs, textos, URLs de imagens externas, ordem, flags e exibição por página.
4. Botões **Salvar rascunho**, **Pré-visualizar**, **Publicar** e **Reverter versão**; não alterar produção automaticamente ao editar campos.
5. Backend ou função serverless autenticada que valida o JSON e salva a versão no GitHub (ou storage versionado) com credenciais **somente no servidor**, nunca em frontend/HTML da Loja Integrada.
6. Histórico/rollback, schema validation, campos com URL validada e restrição ao domínio de imagens aprovado. Não permitir HTML ou JS arbitrário editado por clientes (XSS).
7. Política de cache documentada (por exemplo ETag/TTL curto e publicação versionada); alterações podem ter latência do CDN. Nenhuma promessa de “tempo real” sem comprovação.
8. Fallback estável no tema se o endpoint falhar; conteúdo prioritário deve existir com geometria reservada antes do first paint. Configurações remotas NÃO podem causar CLS por inserção de seções acima da dobra.
9. Separar desenvolvimento/homologação/produção e garantir que URLs de preview não ativem recursos não publicados para todos os visitantes.
10. Comparar **MVP simples: GitHub como CMS + painel FWR serverless** versus opção de backend próprio/DB (somente se a complexidade justificar). Escolher solução de menor manutenção. Não exige MCP nem acesso administrativo à Loja Integrada para mudanças de conteúdo do nosso módulo.

**Limites técnicos:** painel externo administra apenas módulos próprios consumidos pelo runtime. Não altera por conta própria catálogo nativo, preços, estoque, componentes do checkout ou campos internos da LI. Se a loja vier a usar pacote final integralmente local, **não haverá atualizações remotas** do painel sem manter ao menos uma pequena dependência externa de configuração; documentar as duas modalidades.

### Fase 4 — Preparação da implementação (SOMENTE SCAFFOLD AGORA)

- Crie arquivos iniciais e documentação; não reproduza o visual por suposição se o layout não estiver acessível.
- Entregue um mapa ordenado de componentes e campos que serão solicitados à equipe de design.
- Prepare manifesto de imagens (arquivo, uso, dimensões sugeridas, versão desktop/mobile, URL recebida, status); **não inventar links nem sobrescrever as imagens hospedadas**.
- Não adicionar dependências não justificadas; sem impacto no checkout.
- Inclua plano de publicação por etapas, rollback e critérios de aprovação.

## Critérios técnicos de qualidade

- Mobile-first, Web Vitals: **CLS <=0,10** no campo (p75) e preferência por <=0,05 em testes lab comparáveis, sem regressões de LCP/INP.
- CSS crítico/geometry preload antes de JS, `width`/`height` ou `aspect-ratio` coerentes, imagens abaixo da dobra lazy, LCP descoberto cedo.
- Runtime idempotente, mínimo de CSS !important, zero manipulação desnecessária de DOM, `prefers-reduced-motion`, acessibilidade de foco/teclado e links válidos.
- Não duplicar jQuery/Owl/Swiper que o tema já forneça; somente adotar biblioteca após inventário.
- Testes e comparações em home, categoria, busca, PDP, minicart e mobile. **Nenhum teste deve concluir pedidos**.

## Entregáveis desta execução inicial

Escrever, com evidência/links/screenshots quando obtidos:

1. `auditoria/01-LOJA-ATUAL.md` — inventário concreto da loja atual e restrições técnicas.
2. `auditoria/02-MAPA-LAYOUT-2026.md` — mapeamento fiel das seções do protótipo; marcar indisponível se bloqueado.
3. `auditoria/03-CAMPOS-EDITAVEIS.md` — cada componente + campos, tipos, defaults, limites, necessidade de imagem e onde aparece.
4. `auditoria/04-ARQUITETURA-DASHBOARD.md` — fluxo de publicação, segurança, cache, custo/complexidade, fallback e tradeoffs.
5. Proposta de schema `config/schema.json` e `config/defaults.json` (sem conteúdo inventado da loja).
6. `integracao/cabecalho.html` e `integracao/rodape.html` **somente como exemplos sinalizados NÃO PUBLICAR**, após confirmar compatibilidade.
7. `auditoria/05-PROXIMOS-PASSOS.md` com prioridades, bloqueios, critérios de aprovação e perguntas que realmente dependam do cliente.
8. Commits na branch `nichelle/2026-bootstrap`, sem alterar `master`, `Malheiro/` ou lojas de produção.

**Não migrar a loja nem implementar o dashboard completo nesta primeira execução.** Entregar o diagnóstico, a arquitetura e o contrato de campos para aprovação; depois avançaremos para módulos e hospedagem de imagens reais.

**Resposta final esperada do Codex:** links de commits/PR, inventário do layout observado, principais riscos, proposta de dashboard, lista ordenada de campos, dependências não confirmadas e decisão GO/NO-GO para iniciar implementação. Não alegar que testes não realizados passaram.
