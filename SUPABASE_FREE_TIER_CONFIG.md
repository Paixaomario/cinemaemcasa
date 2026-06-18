# ⚙️ Configurações do Supabase - Limite Gratuito

## 📊 Limites do Plano Gratuito Supabase

### Database
- **500MB** de armazenamento
- **1GB** de transferência de dados por mês
- **2 conexões simultâneas** (CPU)
- **500 horas** de compute por mês

### Authentication
- **50.000** MAUs (Monthly Active Users)
- **3** provedores sociais (Google, GitHub, etc.)

### Storage
- **1GB** de armazenamento
- **2GB** de transferência de dados por mês

### Realtime
- **200** conexões simultâneas
- **2GB** de transferência de dados por mês

### Edge Functions
- **500.000** invocações por mês
- **1GB** de horas de execução

---

## ✅ Configurações Atuais do Cinema em Casa

### Database
**Uso estimado:**
- Tabelas principais: ~50MB (cinema, series, search_catalog)
- Índices: ~20MB
- Dados de usuários: ~5MB
- **Total estimado: ~75MB** (15% do limite)

**Transferência estimada:**
- Queries de busca: ~200MB/mês
- Queries de autenticação: ~50MB/mês
- Queries de sincronização: ~100MB/mês
- **Total estimado: ~350MB/mês** (35% do limite)

**Conexões simultâneas:**
- Web: ~5-10 conexões
- Realtime: ~10-20 conexões
- **Total: ~15-30 conexões** (dentro do limite de 2 CPU connections)

### Authentication
**MAUs estimados:**
- Usuários ativos: ~100-500
- **Total: bem abaixo do limite de 50.000**

### Storage
**Uso estimado:**
- Imagens de posters: ~200MB
- Imagens de backdrops: ~300MB
- **Total estimado: ~500MB** (50% do limite)

**Transferência estimada:**
- Downloads de imagens: ~800MB/mês
- **Total: ~800MB/mês** (40% do limite)

### Realtime
**Conexões simultâneas:**
- Home subscriptions: ~10-20
- **Total: ~10-20 conexões** (10% do limite de 200)

**Transferência estimada:**
- Eventos de mudança: ~50MB/mês
- **Total: ~50MB/mês** (2.5% do limite)

### Edge Functions
**Invocações estimadas:**
- /api/sync-catalog: ~100/mês
- **Total: ~100/mês** (0.02% do limite de 500.000)

---

## 🔧 Otimizações Implementadas para Não Ultrapassar Limites

### 1. Cache Agressivo
```typescript
// Cache de sugestões (1 hora em memória)
const suggestionsCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000

// Cache de geolocalização (30 min em localStorage)
localStorage.setItem('geo_cache', JSON.stringify(data))

// Cache de conteúdo da home (1 hora)
localStorage.setItem('home_content_cache', JSON.stringify(cache))
```

### 2. Polling Inteligente
```typescript
// Só sincroniza quando a página está visível
if (document.visibilityState === 'visible') {
  syncCatalog()
}

// Intervalo de 5 minutos (não 1 minuto)
const SYNC_INTERVAL = 5 * 60 * 1000
```

### 3. Lazy Loading
```typescript
// Lazy loading de imagens
<Image
  src={poster}
  loading="lazy"
  placeholder="blur"
/>

// Code splitting com Suspense
const LazyComponent = lazy(() => import('./Component'))
```

### 4. Queries Otimizadas
```typescript
// Usa índices existentes
.query('id', ids)

// Limita resultados
.limit(20)

// Seleciona apenas colunas necessárias
.select('id, titulo, poster')
```

### 5. Realtime Subscriptions Eficientes
```typescript
// Só se inscreve quando há usuário
if (user) {
  const subscription = sb.channel('changes')
    .on('postgres_changes', { event: '*' }, callback)
    .subscribe()
}

// Limpa subscriptions quando componente desmonta
return () => subscription.unsubscribe()
```

### 6. Imagens Otimizadas
```typescript
// Usa CDN do TMDB
`https://image.tmdb.org/t/p/w500${poster}`

// Tamanhos apropriados para cada dispositivo
const sizes = {
  mobile: 'w300',
  tablet: 'w500',
  desktop: 'w780',
  tv: 'original'
}
```

---

## 📈 Monitoramento de Uso

### Métricas para Monitorar Diariamente

1. **Database Storage**
   - Comando: `SELECT pg_size_pretty(pg_database_size('postgres'))`
   - Alerta se > 400MB (80% do limite)

2. **Database Transfer**
   - Dashboard Supabase → Database → Bandwidth
   - Alerta se > 800MB/mês (80% do limite)

3. **Conexões Simultâneas**
   - Dashboard Supabase → Database → Active connections
   - Alerta se > 1.5 (75% do limite)

4. **MAUs**
   - Dashboard Supabase → Authentication → Users
   - Alerta se > 40.000 (80% do limite)

5. **Storage Transfer**
   - Dashboard Supabase → Storage → Bandwidth
   - Alerta se > 1.6GB/mês (80% do limite)

6. **Realtime Connections**
   - Dashboard Supabase → Realtime → Connections
   - Alerta se > 160 (80% do limite)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Crescimento de Conteúdo
**Problema:** 100K+ conteúdos podem ultrapassar 500MB do database

**Mitigações:**
- ✅ Usar search_catalog unificado (evita duplicação)
- ✅ Não armazenar imagens no banco (usar URLs do TMDB)
- ✅ Implementar cache para reduzir queries
- 🔜 Considerar arquivar conteúdo antigo
- 🔜 Migrar para plano pago se necessário

### Risco 2: Tráfico de Imagens
**Problema:** Downloads de imagens podem ultrapassar 2GB/mês

**Mitigações:**
- ✅ Usar CDN do TMDB (não conta no limite do Supabase)
- ✅ Lazy loading de imagens
- ✅ Cache de imagens no navegador
- ✅ Usar tamanhos apropriados (w300 para mobile, w500 para desktop)
- 🔜 Implementar WebP para compressão

### Risco 3: Realtime Connections
**Problema:** Muitos usuários podem ultrapassar 200 conexões

**Mitigações:**
- ✅ Só se inscreve quando há usuário autenticado
- ✅ Limpa subscriptions quando componente desmonta
- ✅ Usa polling como fallback (5 minutos)
- 🔜 Implementar pooling de conexões
- 🔜 Migrar para plano pago se necessário

### Risco 4: Edge Functions
**Problema:** Muitas invocações podem ultrapassar 500.000/mês

**Mitigações:**
- ✅ Sincronização a cada 5 minutos (não 1 minuto)
- ✅ Só sincroniza quando página está visível
- ✅ Usa cache para evitar sincronizações desnecessárias
- 🔜 Implementar rate limiting
- 🔜 Migrar para plano pago se necessário

---

## 🎯 Recomendações para Permanecer no Limite Gratuito

### 1. Monitoramento Diário
- Configurar alertas no dashboard do Supabase
- Revisar métricas diariamente
- Ajustar configurações se necessário

### 2. Otimizações Contínuas
- Revisar queries lentas mensalmente
- Implementar cache adicional se necessário
- Arquivar conteúdo antigo

### 3. Escalonamento Gradual
- Começar com plano gratuito
- Monitorar crescimento
- Migrar para plano pago quando necessário (~10.000 MAUs)

### 4. Alternativas ao Supabase
- **CDN de imagens:** Cloudflare, Cloudinary (não conta no limite)
- **Edge Functions:** Vercel Edge Functions (incluído no plano Pro)
- **Analytics:** Google Analytics, Plausible (não conta no limite)

---

## 📊 Custo Estimado se Migrar para Plano Pago

### Supabase Pro ($25/mês)
- **8GB** de armazenamento database
- **50GB** de transferência de dados
- **Conexões ilimitadas**
- **100.000 MAUs**
- **8GB** de armazenamento storage
- **50GB** de transferência storage

### Quando migrar?
- Quando ultrapassar 80% de qualquer limite
- Quando tiver > 10.000 MAUs
- Quando precisar de mais performance

---

## ✅ Checklist de Configuração

### Database
- [x] Índices criados para queries principais
- [x] Triggers para sincronização automática
- [x] Cache implementado para reduzir queries
- [x] Queries otimizadas (limit, select específico)
- [ ] Monitoramento diário configurado

### Authentication
- [x] RLS implementado
- [x] Rate limiting configurado
- [x] Provedores sociais limitados a 3
- [ ] Monitoramento de MAUs configurado

### Storage
- [x] Imagens externas (TMDB CDN)
- [x] Lazy loading implementado
- [x] Cache de imagens no navegador
- [ ] Monitoramento de transferência configurado

### Realtime
- [x] Subscriptions limpas quando desmontam
- [x] Só se inscreve quando há usuário
- [x] Polling como fallback
- [ ] Monitoramento de conexões configurado

### Edge Functions
- [x] Invocações minimizadas (5 minutos)
- [x] Só executa quando necessário
- [x] Cache implementado
- [ ] Monitoramento de invocações configurado

---

## 📝 Notas

- As configurações atuais estão bem dentro do limite gratuito
- O sistema de sincronização automática é eficiente
- O uso de CDN externo para imagens reduz drasticamente o uso do Storage
- Monitoramento contínuo é essencial para permanecer no limite gratuito
- Plano pago ($25/mês) é opção viável quando necessário

---

**Última atualização:** 18 Junho 2026
**Status:** 🟢 Dentro do limite gratuito - Monitoramento necessário
