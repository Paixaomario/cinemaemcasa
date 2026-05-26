# Sistema Inteligente de Gerenciamento de Conteúdo da Home

## Visão Geral

Sistema implementado para gerenciar o conteúdo da home de forma inteligente, evitando duplicatas e fornecendo recomendações personalizadas baseadas no comportamento do usuário.

## Funcionalidades

### 1. Cache de Conteúdo Exibido

**Objetivo:** Evitar que o mesmo conteúdo apareça múltiplas vezes na home.

**Como funciona:**
- Inicializa uma nova sessão a cada carregamento da página
- Mantém um cache de IDs de conteúdo já exibidos
- Sessão expira após 1 hora (pode ser ajustado)
- Cada seção verifica o cache antes de adicionar conteúdo

**Funções:**
- `initializeContentSession()` - Inicializa nova sessão
- `addToDisplayedCache(contentId)` - Adiciona conteúdo ao cache
- `isContentDisplayed(contentId)` - Verifica se conteúdo já foi exibido

### 2. Prevenção de Duplicatas

**Objetivo:** Garantir que não haja repetição de conteúdo:
- Na mesma seção
- Em seções diferentes
- Entre continuar assistindo e outras seções

**Como funciona:**
- Remove duplicatas baseadas no título (case insensitive)
- Usa um Set para rastrear IDs já exibidos
- Cada seção recebe uma lista de IDs para excluir
- Continuar assistindo é adicionado ao cache primeiro

**Funções:**
- `removeDuplicatesByTitle(items)` - Remove duplicatas por título
- `getSectionContent()` - Busca conteúdo excluindo IDs já exibidos

### 3. Recomendações por IA

**Objetivo:** Fornecer recomendações personalizadas baseadas nos gêneros mais assistidos do usuário.

**Como funciona:**

#### Para Usuários Existentes:
1. Analisa o histórico de visualização do usuário
2. Identifica os gêneros mais assistidos (top 5)
3. Busca conteúdo baseado nesses gêneros
4. Embaralha para variedade
5. Exclui conteúdo já visualizado

#### Para Novos Usuários:
1. Detecta se o usuário tem menos de 5 visualizações
2. Mostra conteúdo em alta (rating >= 7)
3. Ordena por rating e ano
4. Embaralha para variedade

#### Para Usuários Não Logados:
1. Mostra conteúdo em alta
2. Mesma lógica de novos usuários

**Funções:**
- `getUserFavoriteGenres(userId)` - Busca gêneros favoritos
- `getPersonalizedRecommendations(userId, limit, excludeIds)` - Recomendações personalizadas
- `getTrendingContent(limit)` - Conteúdo em alta
- `isNewUser(userId)` - Verifica se usuário é novo

### 4. Atualização a Cada Reinício

**Objetivo:** Garantir que cada carregamento da home mostre conteúdo diferente.

**Como funciona:**
- Cache é resetado a cada carregamento da página
- Função `shuffleArray()` embaralha os resultados
- Cada seção busca conteúdo novo
- Ordenação é aplicada, mas resultados são embaralhados

**Funções:**
- `shuffleArray(array)` - Embaralha array usando Fisher-Yates

### 5. Respeito às Configurações de Seção

**Objetivo:** Manter as configurações originais de cada seção.

**Configurações respeitadas:**
- Categorias/filtros
- Limite de itens
- Ordenação (rating, ano, data)
- Layout (row, grid, featured)
- Agendamento (datas e horários)

**Como funciona:**
- Lê configurações da tabela `home_sections`
- Aplica filtros de categoria
- Aplica ordenação configurada
- Respeita limite de itens
- Filtra por agendamento

## Estrutura do Código

### Arquivo: `src/lib/homeContentManager.ts`

**Funções principais:**

```typescript
// Gerenciamento de cache
initializeContentSession()
addToDisplayedCache(contentId)
isContentDisplayed(contentId)

// Recomendações
getUserFavoriteGenres(userId)
getPersonalizedRecommendations(userId, limit, excludeIds)
getTrendingContent(limit)
isNewUser(userId)

// Busca de conteúdo
getSectionContent(sectionId, categories, limit, ordenacao, excludeIds)

// Utilitários
removeDuplicatesByTitle(items)
shuffleArray(array)
```

### Arquivo: `src/app/HomeClient.tsx`

**Alterações:**
- Importa funções do `homeContentManager`
- Inicializa sessão no início do `loadHome()`
- Adiciona continuar assistindo ao cache
- Usa `getSectionContent()` para seções normais
- Usa `getPersonalizedRecommendations()` para seção "Indicados por IA"
- Usa `getTrendingContent()` para novos usuários/não logados

## Como Configurar

### 1. Criar Seção "Indicados por IA"

No banco de dados, na tabela `home_sections`:

```sql
INSERT INTO home_sections (
  titulo,
  categorias,
  fonte,
  layout,
  limite,
  ordenacao,
  posicao,
  ativo
) VALUES (
  'Indicados por IA',
  ARRAY[]::text[],
  'cinema',
  'row',
  20,
  'rating_desc',
  1,
  true
);
```

### 2. Ajustar Limite de Sessão

Para mudar o tempo de expiração da sessão, edite `homeContentManager.ts`:

```typescript
function isSessionExpired(): boolean {
  if (!sessionStartTime) return true
  const oneHour = 60 * 60 * 1000 // Mude este valor
  return Date.now() - sessionStartTime > oneHour
}
```

### 3. Ajustar Limite para Novo Usuário

Para mudar o limite de visualizações para considerar usuário novo:

```typescript
export async function isNewUser(userId: string): Promise<boolean> {
  // ...
  return (count || 0) < 5 // Mude este valor
}
```

## Como Testar

### 1. Testar Prevenção de Duplicatas

1. Carregue a home
2. Verifique se não há conteúdo repetido
3. Recarregue a página
4. Conteúdo deve ser diferente, mas ainda sem repetições

### 2. Testar Recomendações por IA

**Para usuário existente:**
1. Faça login com uma conta
2. Assista a alguns filmes/séries de gêneros específicos
3. Recarregue a home
4. Seção "Indicados por IA" deve mostrar conteúdo dos gêneros assistidos

**Para novo usuário:**
1. Faça logout
2. Ou crie uma nova conta
3. Carregue a home
4. Seção "Indicados por IA" deve mostrar conteúdo em alta

### 3. Testar Atualização a Cada Reinício

1. Carregue a home
2. Anote os conteúdos exibidos
3. Recarregue a página
4. Conteúdo deve ser diferente
5. Repita algumas vezes

### 4. Testar Respeito às Configurações

1. Crie seções com diferentes configurações
2. Verifique se cada seção respeita:
   - Categorias configuradas
   - Limite de itens
   - Ordenação
   - Layout

## Performance

### Otimizações Implementadas

1. **Cache em memória:** Usa Set para O(1) lookup
2. **Busca em paralelo:** Usa Promise.all para carregar seções simultaneamente
3. **Limite de busca:** Busca mais itens do que necessário para filtrar duplicatas
4. **Embaralhamento eficiente:** Fisher-Yates O(n)

### Considerações

- Cache é resetado a cada carregamento da página
- Sessão expira após 1 hora para evitar memory leak
- Busca de gêneros favoritos analisa até 50 visualizações
- Recomendações personalizadas buscam em ambas as tabelas (cinema e series)

## Troubleshooting

### Conteúdo se Repete

**Causa:** Cache não está sendo inicializado corretamente.

**Solução:**
- Verifique se `initializeContentSession()` está sendo chamado
- Verifique se `addToDisplayedCache()` está sendo chamado para cada item

### Recomendações Não Funcionam

**Causa:** Usuário não tem histórico suficiente.

**Solução:**
- Verifique se a tabela `view_progress` tem dados
- Verifique se o usuário tem pelo menos 5 visualizações
- Verifique se a tabela `content` tem campo `genres`

### Conteúdo Não Muda ao Recarregar

**Causa:** Embaralhamento não está funcionando.

**Solução:**
- Verifique se `shuffleArray()` está sendo chamado
- Verifique se `initializeContentSession()` está sendo chamado

### Seção "Indicados por IA" Não Aparece

**Causa:** Título da seção não corresponde.

**Solução:**
- Verifique se o título contém "indicados por ia" ou "ia" (case insensitive)
- Verifique se a seção está ativa
- Verifique se a seção está dentro do agendamento

## Próximas Melhorias

- [ ] Implementar cache persistente (localStorage)
- [ ] Adicionar sistema de pesos para gêneros
- [ ] Implementar collaborative filtering
- [ ] Adicionar A/B testing para recomendações
- [ ] Implementar feedback do usuário (gostei/não gostei)
- [ ] Adicionar sistema de "por que recomendou"
- [ ] Implementar cache no servidor para reduzir queries
