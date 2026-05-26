# Como Testar a Página de Carregamento

## Funcionamento

A página de carregamento aparece automaticamente na **primeira visita** do usuário ao site.

### Como Funciona

1. **Primeira Visita:**
   - Usuário acessa `/`
   - Sistema verifica `localStorage.getItem('has_visited_before')`
   - Se não existe, redireciona para `/loading`
   - Mostra página de loading com progresso
   - Ao finalizar, marca visita e redireciona para `/`

2. **Visitas Seguintes:**
   - Usuário acessa `/`
   - Sistema verifica `localStorage.getItem('has_visited_before')`
   - Se existe, vai direto para home sem loading

## Como Testar

### Testar Primeira Visita

**Opção 1: Limpar LocalStorage**
1. Abra o console do navegador (F12)
2. Execute: `localStorage.clear()`
3. Recarregue a página
4. A página de loading deve aparecer

**Opção 2: Remover Apenas a Chave**
1. Abra o console do navegador (F12)
2. Execute: `localStorage.removeItem('has_visited_before')`
3. Recarregue a página
4. A página de loading deve aparecer

**Opção 3: Modo Incognito**
1. Abra uma janela em modo incognito
2. Acesse o site
3. A página de loading deve aparecer

### Testar Acesso Direto

Você também pode acessar diretamente a página de loading:
- Acesse: `/loading`
- A página deve mostrar o loading e redirecionar para home

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
- Deve ter gradiente de vermelho para dourado
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
- Ao atingir 100%, deve redirecionar para home
- Deve marcar `has_visited_before` no localStorage
- Não deve mostrar loading em visitas subsequentes

## Solução de Problemas

### Loading não aparece
- Verifique se o localStorage foi limpo
- Verifique o console do navegador para erros
- Certifique-se de que JavaScript está habilitado

### Barra de progresso não aparece
- Verifique se as variáveis CSS estão definidas em `globals.css`
- Verifique o console do navegador para erros
- Certifique-se de que o arquivo `logo.png` existe em `/public`

### Redirecionamento não funciona
- Verifique se há erros no console
- Verifique se o router está funcionando corretamente
- Certifique-se de que o localStorage não está bloqueado

### Loading aparece sempre
- Verifique se `has_visited_before` está sendo salvo corretamente
- Limpe o localStorage e teste novamente

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
