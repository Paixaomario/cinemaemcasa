# 🐛 BUG FIX: URLs de Vídeo Não Carregam

## 📋 Resumo do Problema

**Erro Reportado**: Filmes mostram "URL de vídeo não configurada" ou "não cadastradas"
- Mensagem: "URL de vídeo não configurada" na página de assitir
- Filmes não reproduzem apesar das URLs existirem no Supabase
- **Verificado**: URLs funcionam quando testadas diretamente no Supabase
- **Regressão**: Sistema funcionava antes da última atualização do Gemini

## 🔍 Root Cause Analysis

### O Que Causou o Erro:

1. **Mudança em f288af8**: O Gemini alterou o código para usar a tabela `search_catalog` que unifica cinema e séries
2. **Problema**: A tabela `search_catalog` **NÃO estava sincronizando o campo `url`**
3. **Consequência**: Quando o código tentava buscar URLs de `search_catalog`, não encontrava nada
4. **Logs**: 
   - Arquivo `021_automate_search_catalog.sql` - triggers SEM campo url
   - Arquivo `023_sync_search_catalog_function.sql` - função RPC SEM campo url

### Código Afetado:

**Arquivo**: `supabase/migrations/021_automate_search_catalog.sql`
```sql
-- ANTES (ERRADO):
INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner)
VALUES (...)

-- DEPOIS (CORRIGIDO):
INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner, url)
VALUES (...)
```

## ✅ Solução Implementada

### Arquivos Corrigidos:

1. **`supabase/migrations/021_automate_search_catalog.sql`**
   - ✅ Adicionado `url` ao INSERT da função `sync_movie_to_catalog()`
   - ✅ Adicionado `url` ao UPDATE na política de conflito
   - ✅ Adicionado `url` ao INSERT da função `sync_series_to_catalog()`
   - ✅ Adicionado `url` ao UPDATE na política de conflito para séries

2. **`supabase/migrations/023_sync_search_catalog_function.sql`**
   - ✅ Adicionado `url` ao INSERT da sincronização de cinema
   - ✅ Adicionado `url` ao UPDATE na política de conflito de cinema
   - ✅ Adicionado `url` ao INSERT da sincronização de séries
   - ✅ Adicionado `url` ao UPDATE na política de conflito de séries

3. **`supabase/migrations/024_add_url_to_search_catalog.sql` (NOVA)**
   - ✅ Adiciona coluna `url` à tabela search_catalog se não existir
   - ✅ Re-sincroniza todos os dados com URLs inclusos
   - ✅ Cria índice para performance: `idx_search_catalog_url`
   - ✅ Adiciona comentário explicativo ao campo

### Como as URLs Serão Sincronizadas:

#### Path 1: Novos Filmes/Séries
```
Usuário insere novo filme em cinema → Trigger dispara → sync_movie_to_catalog() executada → 
url incluída em search_catalog
```

#### Path 2: Atualizações Futuras
```
Filme existente é atualizado em cinema → Trigger dispara → 
sync_movie_to_catalog() executada com NEW.url → 
search_catalog atualizado com nova URL
```

#### Path 3: Re-sincronização Manual
```
$ SELECT sync_search_catalog(); → Todos os filmes/séries sincronizados com URLs incluídas
```

## 🧪 Como Testar a Correção

### Opção 1: Executar o Script de Verificação
```bash
cd /home/paixaomario/Downloads/cinemaemcasa-main

# Instalar dependência (se necessário)
pip install supabase

# Rodar verificação
export SUPABASE_ANON_KEY='sua_chave_aqui'
python3 check_urls.py
```

### Opção 2: Testar Manualmente no Supabase
1. Ir para: https://app.supabase.com
2. Database → `cinemaemcasa-main`
3. Executar no SQL Editor:
```sql
-- Verificar cinema table
SELECT id, titulo, url FROM public.cinema LIMIT 5;

-- Verificar series table
SELECT id_n, titulo, url FROM public.series LIMIT 5;

-- Verificar search_catalog
SELECT id, titulo, tipo, url FROM public.search_catalog LIMIT 5;

-- Re-sincronizar se necessário
SELECT sync_search_catalog();
```

### Opção 3: Testar no App
1. Deploy as migrations para Supabase
2. Abrir página assistir de um filme
3. Verificar no console do navegador (F12 → Console):
   - `[Watch] Filme encontrado:` deve mostrar URL configurada
   - Vídeo deve reproduzir normalmente

## 📝 Próximos Passos

1. ✅ **FEITO**: Criar/corrigir migrations com campo `url`
2. ⏳ **TODO**: Executar `024_add_url_to_search_catalog.sql` no Supabase
3. ⏳ **TODO**: Executar `SELECT sync_search_catalog()` para sincronizar dados existentes
4. ⏳ **TODO**: Testar page `/assistir/[id]` com um filme
5. ⏳ **TODO**: Verificar que vídeos reproduzem normalmente

## 📊 Impacto da Correção

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **URLs em search_catalog** | ❌ Não sincronizadas | ✅ Sincronizadas |
| **Vídeos carregam** | ❌ Erro "não configurada" | ✅ Reproduzem normalmente |
| **Filme novo adicionado** | ❌ Sem URL em search_catalog | ✅ URL sincronizada automaticamente |
| **Performance** | ❌ Queries sem índice | ✅ Índice `idx_search_catalog_url` criado |

## 🔗 Arquivos Modificados

- `supabase/migrations/021_automate_search_catalog.sql` ✅
- `supabase/migrations/023_sync_search_catalog_function.sql` ✅  
- `supabase/migrations/024_add_url_to_search_catalog.sql` ✅ (NOVO)
- `check_urls.py` ✅ (NOVO - script de verificação)

---

**Status**: ✅ Correção implementada, pronta para deploy
**Próximo**: Executar migrations no Supabase
