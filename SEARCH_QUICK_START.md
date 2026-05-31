# 🎯 Quick Start - Exemplos Práticos

## 1️⃣ Para Usuários Finais

### **Como Usar a Busca Aprimorada**

#### **Buscar por Voz**
```
1. Abra a página /search
2. Clique no ícone 🎤 (botão de voz)
3. Fale: "Avatar", "Filmes de terror", "Anime"
4. Espere a transcrição aparecer
5. Pressione Enter ou clique na sugestão
```

**Idiomas Suportados:**
- PT (Português Brasileiro) - Padrão
- EN (Inglês)
- ES (Espanhol)

#### **Usar Sugestões**
```
1. Comece a digitar: "Ava"
2. Aguarde 300ms
3. Dropdown aparece com opções
4. Use ↑↓ ou mouse para navegar
5. Pressione Enter para selecionar
```

**Tipos de Sugestões:**
- 🕐 Histórico (últimas buscas)
- 🏷️ Categorias (Ação, Drama, etc)
- 🔥 Populares (top 5 da semana)
- 🎬 Previsões (títulos do acervo)

#### **Filtrar por Localização**
```
1. Buscar normalmente
2. Sugestões regionais aparecem
3. Clique em uma sugestão regional
4. Conteúdo filtrado por região
```

**Regiões Detectadas Automaticamente:**
- 🎯 GPS (se permitir)
- 🌍 Reverse geocoding (se GPS falhar)
- ⏰ Timezone (fallback offline)

---

## 2️⃣ Para Desenvolvedores

### **Usar o Módulo de Sugestões**

```typescript
import { generateSuggestions, trackSearch } from '@/lib/searchSuggestions'

// Gerar sugestões
const suggestions = await generateSuggestions(
  'ava',  // input do usuário
  ['Avatar', 'Avengers'],  // histórico
  ['Ação', 'Ficção']  // categorias customizadas
)

// suggestions = [
//   { id: 'history-Avatar', text: 'Avatar', type: 'history' },
//   { id: 'category-Ação', text: 'Ação', type: 'category' },
//   { id: 'prediction-movie-1', text: 'Avatar 2', type: 'prediction' }
// ]

// Rastrear busca (anônimo)
await trackSearch('avatar', 1250)  // 1250 resultados
```

### **Usar Geolocalização**

```typescript
import { 
  getLocationWithFallback, 
  getLocationBasedSuggestions,
  watchLocation 
} from '@/lib/geolocation'

// Obter localização com fallback automático
const location = await getLocationWithFallback()
// { region: 'BR', source: 'realtime', accuracy: 15 }

// Sugestões de conteúdo local
const local = await getLocationBasedSuggestions(location.region)
// [
//   { id: 'trending-BR-123', title: 'Avatar em PT', ... },
//   { id: 'regional-BR-Action', title: 'Populares em Brasil', ... }
// ]

// Monitorar mudanças de localização
const watchId = watchLocation((location) => {
  console.log('Usuário se moveu!', location)
})

// Parar monitoramento
stopWatchingLocation(watchId)
```

### **Usar Reconhecimento de Voz Avançado**

```typescript
import { AdvancedVoiceSearch } from '@/lib/advancedVoiceSearch'

// Criar instância
const voiceSearch = new AdvancedVoiceSearch({
  language: 'pt-BR',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  confidenceThreshold: 0.5
})

// Iniciar escuta
voiceSearch.start(
  (result) => {
    console.log(`"${result.transcript}" - ${result.confidence * 100}%`)
    
    if (result.alternatives) {
      result.alternatives.forEach((alt, i) => {
        console.log(`  Alt ${i}: "${alt.transcript}" - ${alt.confidence * 100}%`)
      })
    }
  },
  (error) => console.error(error)
)

// Parar escuta
voiceSearch.stop()

// Obter estado
const state = voiceSearch.getState()
console.log(state.finalTranscript)
```

### **Componente SearchSuggestions**

```typescript
import { SearchSuggestions } from '@/components/SearchSuggestions'

<SearchSuggestions
  input={searchInput}
  searchHistory={['Avatar', 'Avengers']}
  onSuggestionSelect={(text) => {
    setSearchInput(text)
    performSearch(text)
  }}
  onSuggestionHighlight={(suggestion) => {
    console.log('Hover:', suggestion?.text)
  }}
  isWebOS={isWebOS}
  maxVisible={8}
/>
```

### **Componente VoiceSearchButton**

```typescript
import { VoiceSearchButton } from '@/components/VoiceSearchButton'

<VoiceSearchButton
  onVoiceInput={(text, confidence) => {
    setSearchInput(text)
    console.log(`Confiança: ${confidence * 100}%`)
  }}
  onError={(error) => {
    showNotification(error, 'error')
  }}
  language="pt-BR"
  isWebOS={isWebOS}
  continuous={false}
/>
```

---

## 3️⃣ Para Customizar

### **Mudar Idioma Padrão**

```typescript
// Em src/app/search/page.tsx
<VoiceSearchButton
  language="en-US"  // Mudar para inglês
  // ...
/>
```

### **Adicionar Novas Categorias**

```typescript
// Em src/app/search/page.tsx, na seção de Gêneros
const categories = [
  'Ação',
  'Comédia',
  'Terror',
  'Drama',
  'Ficção',
  'Romance',
  'Animação',
  'Documentário',
  'Thriller',  // ← Nova categoria
  'Mistério'   // ← Nova categoria
]
```

### **Ajustar Debounce Time**

```typescript
// Em src/components/SearchSuggestions.tsx
debounceTimerRef.current = setTimeout(async () => {
  // ... gerar sugestões
}, 500)  // ← Mudar de 300ms para 500ms
```

### **Aumentar Cache Duration**

```typescript
// Em src/lib/searchSuggestions.ts
const CACHE_DURATION = 2 * 60 * 60 * 1000  // ← 2 horas (era 1 hora)
```

### **Adicionar Nova Região**

```typescript
// Em src/lib/geolocation.ts
const REGIONS = {
  // ... existing regions
  CH: { 
    name: 'Suíça', 
    timezone: 'Europe/Zurich', 
    defaultCategory: 'Drama' 
  }
}
```

---

## 4️⃣ Para Analytics

### **Ver Buscas Populares**

```sql
-- No Supabase SQL Editor
SELECT query, count, result_count
FROM search_analytics
WHERE date >= CURRENT_DATE - 7
ORDER BY count DESC
LIMIT 10;
```

### **Histórico do Usuário (Privado)**

```sql
-- Ver próprio histórico
SELECT query, result_count, clicked_result_id, created_at
FROM user_search_history
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 20;
```

### **Gráfico de Buscas por Dia**

```sql
SELECT 
  date,
  COUNT(DISTINCT query) as unique_queries,
  SUM(count) as total_searches
FROM search_analytics
WHERE date >= CURRENT_DATE - 30
GROUP BY date
ORDER BY date DESC;
```

---

## 5️⃣ Para WebOS TV

### **Testar Localização de Voz**

```
1. Samsung/LG remote → Botão APP
2. Digite: cinema-em-casa
3. Abra a app
4. Red button (S) → Settings → Region
5. Notará sugestões em sua región
```

### **Testar D-Pad Navigation**

```
1. Abra /search
2. Comece a digitar
3. Sugestões aparecem
4. ↑ ↓ (D-Pad) para navegar
5. ⊙ (Circle) para selecionar
6. ∠ (Back) para fechar
```

### **Testar Magic Remote**

```
1. Fale para o remote: "Filmes de ação"
2. Texto aparece no input
3. Sugestões aparecem
4. Use red/yellow/green/blue para ações
```

---

## 6️⃣ Troubleshooting

### **Voz não funciona**

```bash
# Verificar permissões
Windows 10+: Settings → Privacy → Microphone → Enable
macOS: System Preferences → Security → Microphone → Allow
Chrome: Recarregar com Ctrl+Shift+R
Safari: Pedir permissão novo
```

### **Sugestões lentas**

```typescript
// Aumentar debounce
300ms → 500ms  // Em SearchSuggestions.tsx
```

### **Localização não detecta**

```typescript
// Forçar timezone como fallback
const location = await getLocationWithFallback()
console.log(location)  // Verificar 'source'
```

### **Cache corrompido**

```javascript
// No console (DevTools)
localStorage.removeItem('cinema_location_latest')
localStorage.removeItem('searchHistory')
location.reload()
```

---

## 7️⃣ Performance Tips

### **Para Desktop**

```
✅ Usar Chrome/Firefox
✅ Ativar Hardware Acceleration
✅ Desabilitar extensões pesadas
```

### **Para Mobile**

```
✅ Usar WiFi para geolocalização
✅ Permitir GPS para melhor acurácia
✅ Fechar apps em background
```

### **Para WebOS TV**

```
✅ Conexão Ethernet (se possível)
✅ Atualizar TV para último firmware
✅ Ligar TV 5 minutos antes de usar
```

---

## 📊 Métricas para Monitorar

```javascript
// No DevTools Console

// Tempo de sugestões
performance.mark('suggestions-start')
// ... gerar sugestões
performance.mark('suggestions-end')
performance.measure('suggestions', 'suggestions-start', 'suggestions-end')

// Tempo de busca
performance.mark('search-start')
// ... busca
performance.mark('search-end')
performance.measure('search', 'search-start', 'search-end')

// Ver resultados
performance.getEntriesByType('measure').forEach(m => console.log(m.name, m.duration + 'ms'))
```

---

## 🎓 Conceitos-Chave

### **Debouncing**
```
Usuário digita rápido → debounce aguarda parada → então executa
Evita 1000 requests → executa apenas o final
```

### **Fuzzy Matching**
```
Busca 'ava' encontra:
- Avatar (match exato no início)
- Avengers (match no início)
- Visão (contém 'a', 'v', 'a')
```

### **RLS (Row-Level Security)**
```
- search_analytics: público (qualquer um vê)
- user_search_history: privado (só o user)
```

### **Graceful Degradation**
```
GPS falha? → Usa reverse geocoding
Reverse geocoding falha? → Usa timezone
Timezone falha? → Usa padrão (Brasil)
```

---

## 🚀 Próximas Features

### **Em Desenvolvimento**
- [ ] Busca visual (screenshot → conteúdo)
- [ ] Recomendações personalizadas
- [ ] Histórico sincronizado (cloud)
- [ ] Voice bookmarks

### **Roadmap Futuro**
- [ ] Elasticsearch (busca semântica)
- [ ] Machine Learning (ranking)
- [ ] Social sharing
- [ ] Voice commands avançados

---

## 📞 Contato & Suporte

## **Problemas?**

1. Verificar console (F12)
2. Ler `ADVANCED_SEARCH_GUIDE.md`
3. Limpar localStorage
4. Hard refresh (Ctrl+Shift+R)

## **Sugestões?**

1. Abrir issue no GitHub
2. Descrever o problema
3. Include screenshot/video
4. Incluir DevTools console logs

---

**Divirta-se buscando conteúdo! 🎬🍿**

Para mais informações, veja `ADVANCED_SEARCH_GUIDE.md`
