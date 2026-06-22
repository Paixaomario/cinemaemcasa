#!/usr/bin/env python3
"""
Script para verificar URLs no banco de dados Supabase
"""

import os
import sys

# Tentar importar supabase
try:
    from supabase import create_client
except ImportError:
    print("❌ supabase não instalado. Execute: pip install supabase")
    sys.exit(1)

# Credenciais do Supabase (do arquivo .env.local se existir)
SUPABASE_URL = "https://ebbuobnltsrvqxayrulk.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

if not SUPABASE_KEY:
    print("❌ SUPABASE_ANON_KEY não definida em variáveis de ambiente")
    print("   Execute: export SUPABASE_ANON_KEY='sua_chave_aqui'")
    sys.exit(1)

# Conectar ao Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Verificando URLs no banco de dados...\n")

# 1. Verificar tabela cinema
print("📽️  Tabela CINEMA:")
print("-" * 60)
try:
    response = supabase.table('cinema').select('id,titulo,url').limit(5).execute()
    data = response.data
    
    if not data:
        print("❌ Nenhum filme encontrado na tabela cinema")
    else:
        for film in data:
            status = "✅ COM URL" if film['url'] else "❌ SEM URL"
            print(f"{status} | ID: {film['id']} | {film['titulo'][:30]}")
            if film['url']:
                print(f"           URL: {film['url'][:50]}...")
except Exception as e:
    print(f"❌ Erro ao buscar cinema: {e}")

# 2. Verificar tabela series
print("\n📺 Tabela SERIES:")
print("-" * 60)
try:
    response = supabase.table('series').select('id_n,titulo,url').limit(5).execute()
    data = response.data
    
    if not data:
        print("❌ Nenhuma série encontrada na tabela series")
    else:
        for series in data:
            status = "✅ COM URL" if series.get('url') else "❌ SEM URL"
            print(f"{status} | ID: {series['id_n']} | {series['titulo'][:30]}")
            if series.get('url'):
                print(f"           URL: {series['url'][:50]}...")
except Exception as e:
    print(f"❌ Erro ao buscar series: {e}")

# 3. Verificar tabela search_catalog
print("\n🔍 Tabela SEARCH_CATALOG:")
print("-" * 60)
try:
    response = supabase.table('search_catalog').select('*').limit(5).execute()
    data = response.data
    
    if not data:
        print("❌ search_catalog está vazia")
    else:
        print(f"✅ Encontrados {len(data)} registros")
        for item in data:
            has_url = 'url' in item and item['url']
            url_status = "✅ COM" if has_url else "❌ SEM"
            print(f"{url_status} URL | Tipo: {item.get('tipo', 'unknown')[:6]} | {item.get('titulo', 'sem título')[:25]}")
except Exception as e:
    print(f"❌ Erro ao buscar search_catalog: {e}")

print("\n" + "=" * 60)
print("✅ Verificação concluída!")
