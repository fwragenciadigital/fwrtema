# TractorBell — Frontend leve para Loja Integrada

Desenvolvimento no **Cursor**, hospedagem temporária via **GitHub Pages** e entrega final **independente** com código incorporado nos campos HTML da Loja Integrada. Não usa MCP, API, bibliotecas externas ou backend.

## Os quatro pilares

1. **Fluidez:** JavaScript vanilla, sem dependências, carregamento não bloqueante, código idempotente, interfaces responsivas e `prefers-reduced-motion`.
2. **CLS / Google:** sempre reservar **no HTML inicial** o espaço de um componente que será exibido acima da dobra. Carregar CSS no cabeçalho. Imagens sempre com largura/altura ou proporção definidas. Nunca usar lazy-loading na imagem de LCP.
3. **Migração:** manter HTML dos componentes em arquivos individuais. O build incorpora esse HTML ao JS. O pacote de produção inclui os próprios CSS/JS, sem depender do GitHub.
4. **Settings / Variables:** ativação, cores, textos e seletores editáveis no bloco `configuracao.html`, que vai no HTML/Rodapé. Não editar a lógica de cada componente para customização comum.

**Metas de referência** em dados reais (percentil 75): CLS ≤ 0,1, LCP ≤ 2,5 s, INP ≤ 200 ms. Elas **não foram medidas na loja** e não são garantidas apenas pelo pacote.

## Estrutura

- `src/components/beneficios.html` — componente HTML de exemplo.
- `src/runtime.js` — inicializador e lógica de montagem.
- `assets/tractorbell.css` — CSS escopado e reserva de altura.
- `assets/tractorbell.js` — JS **gerado** com HTML incorporado (não editar manualmente).
- `configuracao.html` — variáveis que o cliente edita no editor HTML/Rodapé.
- `scripts/build.mjs` — gera JS e snippets de publicação sem dependências npm.
- `dist/desenvolvimento-cabecalho.html`, `dist/desenvolvimento-rodape.html` — instalação vinculada ao GitHub Pages.
- `dist/producao-cabecalho.html`, `dist/producao-rodape.html` — cópia final sem dependências do GitHub.
- `index.html` — preview isolado para testar o componente.
- `tests.smoke.mjs` — validações estáticas básicas.

## Edição no Cursor

Abra o repositório `fwragenciadigital/fwrtema`. Altere HTML em `src/components/`, JS em `src/runtime.js`, CSS em `assets/tractorbell.css` e variáveis em `configuracao.html`.

Na raiz do repositório:

```bash
node TractorBell/scripts/build.mjs
node --check TractorBell/assets/tractorbell.js
node --test TractorBell/tests.smoke.mjs
```

Depois de validar, faça commit/push dos arquivos, **incluindo os gerados**. O GitHub Pages pode publicar automaticamente a versão da branch configurada.

## Desenvolvimento conectado

1. Ative GitHub Pages em `fwragenciadigital/fwrtema` → Settings → Pages, branch `master`, pasta `/(root)`.
2. Em **Visual > Incluir código HTML > Modo avançado** da Loja Integrada, insira o conteúdo de `dist/desenvolvimento-cabecalho.html` como **HTML/Cabeçalho**.
3. Crie outro bloco **HTML/Rodapé** com `dist/desenvolvimento-rodape.html`.
4. Ative `tractorbellAtivo = true` e `beneficiosAtivo = true` apenas após preparar um lugar reservado para o componente.
5. Revise as mudanças numa loja de homologação antes de habilitar na loja real.

O exemplo usa um **slot criado no HTML antes do JS**:

```html
<div data-tractorbell-slot="beneficios"></div>
```

Se o componente ficar acima da dobra, esse slot deve ser parte do **HTML inicial**, e o CSS com altura reservada precisa carregar no cabeçalho. **Criar a seção apenas pelo JS do rodapé pode elevar o CLS**; não é correto prometer CLS zero nesse cenário. A reserva exemplificada tem 92px desktop / 186px mobile, que precisam ser reavaliados quando o conteúdo mudar.

Não existe inserção automática em qualquer posição do DOM nesta versão inicial: o modo padrão exige um slot dedicado para diminuir o risco de deslocamento da página.

## Entrega final sem GitHub

1. Execute o build com as últimas alterações e mantenha backup das configurações de produção.
2. Cole `dist/producao-cabecalho.html` em **HTML/Cabeçalho** (CSS embutido).
3. Cole `dist/producao-rodape.html` em **HTML/Rodapé** (settings editáveis + JS e HTML incorporados).
4. Remova os **dois** códigos externos de desenvolvimento. Não mantenha dev e produção juntos.
5. Inspecione a rede e confirme que nada é carregado de `fwragenciadigital.github.io`, que não há duplicação e que o checkout funciona normalmente.

A cópia final é independente **dos arquivos do projeto no GitHub**. Links para imagens ou serviços de terceiros que forem adicionados futuramente continuam sendo dependências externas e precisam ser tratados separadamente.

## Checklist de cada componente

- Alternância via settings e falha segura quando desativado
- HTML sem scripts inline; textos editáveis aplicados com `textContent` (sem HTML arbitrário)
- CSS prefixado, sem seletores globais conflitantes
- Responsivo, acessível, imagens dimensionadas, animações respeitando movimento reduzido
- Slot com reserva real de espaço, principalmente acima da dobra
- Evita manipulações repetidas do DOM e dependências desnecessárias
- Testes em mobile/desktop e verificação de CLS, LCP e INP em ambiente real
- Sem tokens, segredos ou dados de clientes no GitHub

## Restrições da Loja Integrada

O painel aceita códigos personalizados no **cabeçalho** e **rodapé** em lojas com plano/tema compatível; o novo tema padrão não oferece a opção. Não há acesso via FTP ou aos arquivos internos do tema; o checkout não aceita estes scripts. A publicação via painel pode levar até 15 minutos.

- [Documentação oficial: código HTML/JavaScript](https://ajuda.lojaintegrada.com.br/pt-BR/articles/911875-como-inserir-um-codigo-html-e-javascript)
- [Google Search Central: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
