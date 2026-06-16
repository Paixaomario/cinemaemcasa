# Como Testar a Página de Carregamento

## Funcionamento

A página de carregamento aparece **sempre** ao acessar o site (`/`), independentemente de visitas anteriores.

### Como Funciona

1. **Acessar `/`:**
   - Usuário acessa `/`
   - Sistema redireciona automaticamente para `/loading`
   - Mostra página de loading com progresso
   - Ao finalizar, redireciona para `/home`

2. **Acessar `/home` diretamente:**
   - Usuário acessa `/home`
   - Vai direto para a home sem loading

3. **Acessar `/loading` diretamente:**
   - Usuário acessa `/loading`
   - Mostra página de loading
   - Ao finalizar, redireciona para `/home`

## Como Testar

### Testar Página de Loading

**Opção 1: Acessar a Raiz**
1. Acesse: `/`
2. A página de loading deve aparecer automaticamente
3. Ao finalizar, deve redirecionar para `/home`

**Opção 2: Acessar Diretamente**
1. Acesse: `/loading`
2. A página de loading deve aparecer
3. Ao finalizar, deve redirecionar para `/home`

**Opção 3: Limpar LocalStorage e Recarregar**
1. Abra o console do navegador (F12)
2. Execute: `localStorage.clear()`
3. Recarregue a página
4. A página de loading deve aparecer

## O que Verificar

### 1. Logo
- Deve aparecer centralizado
- Tamanhos responsivos:
  - Mobile: 300px
  - Tablet (sm): 400px
  - Desktop (md): 500px
  - Smart TV 4K (lg): 600px
- Deve ter animação de pulso

### 2. Barra de Progresso
- Deve aparecer abaixo do logo
- Deve mostrar porcentagem de 0 a 100%
- Deve ter cor `#00ADEF` (cor do logo)
- Deve ter efeito shimmer
- Deve preencher gradualmente

### 3. Texto de Status
- Deve mostrar o passo atual:
  - "Carregando configurações..."
  - "Preparando interface..."
  - "Carregando dados do usuário..."
  - "Otimizando experiência..."
  - "Finalizando..."
  - "Pronto!"

### 4. Redirecionamento
- Ao atingir 100%, deve redirecionar para `/home`
- Deve marcar `has_visited_before` no localStorage
- Links do navbar apontam para `/home`

## Solução de Problemas

### Loading não aparece
- Verifique se está acessando `/` e não `/home`
- Verifique o console do navegador para erros
- Certifique-se de que JavaScript está habilitado

### Barra de progresso não aparece
- Verifique se a cor `#00ADEF` está definida
- Verifique o console do navegador para erros
- Certifique-se de que o arquivo `logo.png` existe em `/public`

### Redirecionamento não funciona
- Verifique se há erros no console
- Verifique se o router está funcionando corretamente
- Certifique-se de que o localStorage não está bloqueado

### Redireciona para página errada
- Verifique se o link no loading aponta para `/home`
- Verifique se o arquivo `/home/page.tsx` existe

## Duração do Loading

O loading dura aproximadamente **3 segundos**:
- Carregando configurações: 800ms
- Preparando interface: 600ms
- Carregando dados do usuário: 700ms
- Otimizando experiência: 500ms
- Finalizando: 400ms

## Personalização

Para alterar a duração do loading, edite `src/app/loading/page.tsx`:

```typescript
const steps = [
  { name: 'Carregando configurações...', duration: 800 },
  { name: 'Preparando interface...', duration: 600 },
  { name: 'Carregando dados do usuário...', duration: 700 },
  { name: 'Otimizando experiência...', duration: 500 },
  { name: 'Finalizando...', duration: 400 },
]
```

Ajuste os valores de `duration` conforme necessário.

## Estrutura de Rotas

```
/           → Redireciona para /loading
/loading    → Página de carregamento → Redireciona para /home
/home       → Página inicial (conteúdo real)
/filmes     → Página de filmes
/series     → Página de séries
/favoritos  → Página de favoritos
/perfil     → Página de perfil
```

## Links Atualizados

Todos os links de navegação interna que antes apontavam para `/` agora apontam para `/home`. Isso inclui:
- Logo no `Navbar`
- Link "Início" no `Navbar`
- Links "Home" no `Sidebar` e `MobileBottomNav`
- Links "Home" no `MobileNavBar`
- Botão "Voltar" na página de assistir (se aplicável)
