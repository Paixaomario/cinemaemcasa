# 🔍 Busca Aprimorada com Voz, Geolocalização e Sugestões em Tempo Real

## Visão Geral

A página de busca foi completamente redesenhada com recursos profissionais de busca moderna:

- ✅ **Busca por Voz Aprimorada** - Reconhecimento contínuo com confiança e alternativas
- ✅ **Sugestões em Tempo Real** - Autocomplete com histórico, categorias e previsões
- ✅ **Localização em Tempo Real** - Recomendações baseadas em região (com fallback)
- ✅ **Interface Profissional** - Design responsivo, otimizado para desktop e TV (WebOS)
- ✅ **Analytics Anônimo** - Rastreamento de buscas populares para melhor ranking
- ✅ **Performance Otimizada** - Debouncing, cache e lazy loading

---

## 📚 Módulos Criados

### 1. **searchSuggestions.ts** (`src/lib/searchSuggestions.ts`)
Gerencia sugestões em tempo real com múltiplas fontes.

```typescript
// Gerar sugestões para um texto de entrada
const suggestions = await generateSuggestions(input, searchHistory, categories)

// Rastrear busca (anônimo)
await trackSearch(query, resultCount)

// Obter buscas populares dos últimos 7 dias
const popular = await getPopularSearches()
```

**Features:**
- Fuzzy matching (60%+ de relevância)
- 4 tipos de sugestões: histórico, categorias, populares, previsões
- Cache de 1 hora com limpeza automática
- Integração com banco de dados para previsões de títulos

---

### 2. **geolocation.ts** (`src/lib/geolocation.ts`)
Localização em tempo real com fallback inteligente.

**Prioridade de detecção:**
1. **GPS em Tempo Real** (permissão do usuário)
2. **Reverse Geocode** (converte GPS em país)
3. **Timezone** (offline, baseado no sistema)
4. **Cache Local** (até 30 minutos)

```typescript
// Obter localização com fallback automático
const location = await getLocationWithFallback()
// { region: 'BR', source: 'realtime', accuracy: 15 }

// Sugestões baseadas em localização
const suggestions = await getLocationBasedSuggestions('BR')

// Monitorar mudanças de localização (> 1km)
const watchId = watchLocation(callback)
stopWatchingLocation(watchId)
```

**Regiões Suportadas:**
- Brasil (BR), USA (US), México (MX), Espanha (ES), Portugal (PT)
- Argentina (AR), França (FR), Alemanha (DE), Itália (IT)
- Japão (JP), Coréia (KR), Índia (IN), Austrália (AU), Reino Unido (GB)

---

### 3. **advancedVoiceSearch.ts** (`src/lib/advancedVoiceSearch.ts`)
Reconhecimento de voz aprimorado com confiança e alternativas.

```typescript
const voiceSearch = new AdvancedVoiceSearch({
  language: 'pt-BR',
  continuous: false, // Interrompe após frase completa
  interimResults: true, // Mostra resultados parciais
  maxAlternatives: 3,
  confidenceThreshold: 0.5, // 50% mínimo
  maxDuration: 60000 // 1 minuto máximo
})

// Iniciar escuta
voiceSearch.start(
  (result: VoiceResult) => {
    console.log(result.transcript) // "Avatar"
    console.log(result.confidence) // 0.95
    console.log(result.alternatives) // [{transcript: "Avator", confidence: 0.82}]
  },
  (error: string) => console.error(error)
)

// Parar escuta
voiceSearch.stop()

// Obter estado
const state = voiceSearch.getState()
```

**Idiomas Suportados:**
- Português Brasileiro (pt-BR)
- Inglês (en-US)
- Espanhol (es-ES)

---

### 4. **SearchSuggestions.tsx** (`src/components/SearchSuggestions.tsx`)
Componente visual de sugestões com navegação por teclado/D-Pad.

**Navegação:**
- `↑ ↓` - Navegar sugestões
- `Enter` - Selecionar sugestão
- `Esc` - Fechar dropdown
- **WebOS:** D-Pad sobe/desce, ⊙ (círculo) seleciona

**Features:**
- Debounce de 300ms para performance
- Sugestões de localização integradas
- Foco automático em elemento destacado
- Compatível com screen readers

---

### 5. **VoiceSearchButton.tsx** (`src/components/VoiceSearchButton.tsx`)
Botão de voz com indicador visual de confiança.

**Estados:**
- 🎤 Inativo (clique para começar)
- 🔴 Ouvindo (pulse animation)
- 📊 Indicador de confiança (barra de progresso)
- ⚠️ Alternativas (se múltiplas interpretações)

**Features:**
- Transcrição em tempo real
- Exibição de alternativas (com confiança individual)
- Tratamento de erros com mensagens claras
- Suporte a múltiplos idiomas

---

## 🎯 Integração na Página de Busca

### Componentes Utilizados

```tsx
<VoiceSearchButton
  onVoiceInput={handleVoiceInput}
  onError={handleVoiceError}
  isWebOS={isWebOS}
/>

<SearchSuggestions
  input={searchInput}
  searchHistory={history}
  onSuggestionSelect={(text) => setSearchInput(text)}
  onSuggestionHighlight={setHighlightedSuggestion}
  isWebOS={isWebOS}
/>
```

### Flow da Busca

```
Usuário digita/fala → Sugestões aparecem (300ms debounce)
                   ↓
           Usuário seleciona
                   ↓
           Busca executada (400ms debounce)
                   ↓
           Análise criada (anônima)
                   ↓
           Histórico salvo (localStorage)
```

---

## 💾 Banco de Dados

### Tabela: `search_analytics`
Agregação **anônima** de buscas populares.

```sql
- id (PK)
- query (TEXT, unique com date)
- count (INT) - Número de buscas
- result_count (INT) - Média de resultados
- date (DATE)
- created_at, updated_at
```

**Índices:**
- `query` - Para buscar sugestões
- `date DESC` - Para limpeza de dados antigos
- `count DESC` - Para ranking de populares

### Tabela: `user_search_history`
Histórico **privado** do usuário (com RLS).

```sql
- id (PK)
- user_id (FK auth.users, RLS)
- query (TEXT)
- result_count (INT)
- clicked_result_id (TEXT) - Qual resultado clicou
- clicked_at (TIMESTAMP)
- created_at
```

**Política RLS:** Users can only see their own search history

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env.local não precisa de nada extra
# Tudo funciona com APIs nativas do navegador
```

### Permissões Necessárias (Browser)

1. **Geolocalização** - Solicitada ao clicar em filtros regionais
   - Fallback automático para timezone se negado
   - Caching local de 30 minutos

2. **Microfone** - Solicitado ao clicar no botão de voz
   - Apenas enquanto gravando
   - Pode ser desligado a qualquer momento

### Database Setup

Execute a migração:

```bash
supabase db push supabase/migrations/018_search_analytics.sql
```

Ou no dashboard Supabase:
1. SQL Editor
2. Paste migração
3. Run

---

## 🎨 Customização

### Modificar Categorias de Gênero

`src/app/search/page.tsx`:
```tsx
const categories = ['Ação', 'Comédia', 'Terror', 'Drama', 'Ficção', 'Romance', 'Animação', 'Documentário']
```

### Mudar Idioma de Voz Padrão

`src/components/VoiceSearchButton.tsx`:
```tsx
<VoiceSearchButton language="en-US" />
```

### Ajustar Debounce

`src/components/SearchSuggestions.tsx`:
```tsx
debounceTimerRef.current = setTimeout(async () => {
  // 300ms padrão
}, 300) // ← Modificar aqui
```

---

## 📊 Analytics

### Rastreamento Automático

Quando uma busca retorna resultados:

```typescript
await trackSearch(query, resultCount)
// Insere/atualiza em search_analytics (anônimo)
```

### Obter Buscas Populares

```typescript
const popular = await getPopularSearches()
// Retorna top 5 dos últimos 7 dias
```

### Limitar Dados (GDPR)

Os dados são **completamente anônimos**:
- ❌ Sem IP
- ❌ Sem user_id
- ❌ Sem timestamp exato (apenas data)
- ✅ Apenas texto da busca + contador

---

## 🚀 Performance

### Otimizações Implementadas

1. **Debouncing**
   - Sugestões: 300ms
   - Busca: 400ms
   - Evita múltiplas queries

2. **Caching**
   - Sugestões: 1 hora em memória
   - Localização: 30 minutos em localStorage
   - Results: cached automaticamente pelo Supabase

3. **Lazy Loading**
   - Images com `priority={false}`
   - SearchSuggestions renderizado apenas se houver input
   - Database queries otimizadas com índices

4. **Code Splitting**
   - Componentes lazy com Suspense
   - VoiceSearchButton carregado dinâmico
   - Sugestões carregadas sob demanda

---

## 🐛 Troubleshooting

### Voz não funciona

**Solução:**
- Verificar permissão do microfone no navegador
- Chrome: Settings → Privacy → Site Settings → Microphone
- Safari: System Preferences → Security & Privacy → Microphone

### Sugestões não aparecem

**Solução:**
- Aguardar 300ms (debounce)
- Verificar console para erros
- Limpar cache: `clearSuggestionsCache()`

### Localização não detecta corretamente

**Solução:**
- Usar fallback de timezone (automático)
- Limpar cache local: localStorage.removeItem('cinema_location_latest')
- Verificar permissão de geolocalização

### Performance lenta

**Solução:**
- Reduzir `maxVisible` em SearchSuggestions
- Aumentar debounce time
- Verificar conexão de internet
- Profile no DevTools

---

## 🔐 Segurança

### RLS (Row Level Security)

✅ **search_analytics** - Público (apenas leitura, dados anônimos)
✅ **user_search_history** - Privado (apenas próprio usuário)

### Permissões de Banco

```sql
-- Service role pode escrever analytics (via triggers)
-- Usuários podem ler public analytics
-- Usuários podem ler/escrever seu próprio histórico
```

### Proteção de Dados

- [x] Sem rastreamento de IP
- [x] Sem dados pessoais em analytics
- [x] RLS em histórico do usuário
- [x] Cache local com expiração

---

## 📱 Compatibilidade

### Plataformas

| Plataforma | Voice | Autocomplete | Location | Status |
|----------|-------|--------------|----------|--------|
| Desktop (Chrome) | ✅ | ✅ | ✅ | Completo |
| Desktop (Firefox) | ✅ | ✅ | ✅ | Completo |
| Safari (iOS) | ✅* | ✅ | ✅ | *Webkit |
| Android | ✅ | ✅ | ✅ | Completo |
| **LG WebOS** | ✅ | ✅ | ✅ | Otimizado |

### WebOS Específico

Otimizações para TV:
- D-Pad navigation (automaticamente mapeado para ↑↓)
- Magic Remote buttons (coloridos para ações)
- Display de 1920x1080 + 4K (tested)
- Safe area margins para bezels

---

## 🧪 Testes Recomendados

```bash
# Testes manuais
1. Digite "Ava" → debe aparecer "Avatar" como sugestão
2. Clique no microfone → fale "filmes de ação"
3. Aguarde geolocalização → veja sugestões regionais
4. Abra DevTools → Search Analytics em Network

# Testes de performance
1. Digitar rápido → sugestões aparecem sem lag
2. Clicar em múltiplas sugestões → histórico cresce
3. Refresh página → histórico carregado do localStorage
```

---

## 📝 Roadmap Futuro

- [ ] Integração com Elasticsearch para busca semântica
- [ ] Recomendações personalizadas por usuário
- [ ] Social features (compartilhar buscas)
- [ ] Voice commands avançados ("próximo", "reproduzir")
- [ ] Export de histórico (CSV)
- [ ] Busca visual por screenshot (TensorFlow.js)

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs no console (F12)
2. Consultar este documento
3. Revisar migração SQL (018_search_analytics.sql)
4. Check módulos (`src/lib/searchSuggestions.ts`, etc)

---

**Última atualização:** 2024
**Status:** ✅ Produção Ready
**Compatibilidade:** Desktop, Mobile, WebOS TV
