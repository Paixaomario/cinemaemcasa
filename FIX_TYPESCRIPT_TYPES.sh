#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX TYPESCRIPT TYPES — Corrigir tipos undefined            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Corrigindo tipos TypeScript..."

python3 << 'PYTHON'
import os
import re

for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            if 'ContentCard' in content:
                print(f"   Corrigindo: {filepath}")
                
                # Corrigir: titulo={item.titulo || item.title}
                # Para: titulo={item.titulo || item.title || 'Sem título'}
                content = re.sub(
                    r'titulo=\{item\.titulo\s*\|\|\s*item\.title\}',
                    "titulo={item.titulo || item.title || 'Sem título'}",
                    content
                )
                
                # Corrigir: type={item.type === 'movie' ? 'movie' : 'series'}
                # Para: type={(item.type === 'movie' ? 'movie' : 'series') as 'movie' | 'series'}
                content = re.sub(
                    r'type=\{item\.type === [\'"]movie[\'"] \? [\'"]movie[\'"] : [\'"]series[\'"]',
                    "type={(item.type === 'movie' ? 'movie' : 'series') as 'movie' | 'series'",
                    content
                )
                
                # Corrigir year com fallback
                content = re.sub(
                    r'year=\{item\.year \|\| item\.ano\}',
                    "year={item.year || item.ano || new Date().getFullYear()}",
                    content
                )
                
                # Corrigir poster com fallback
                content = re.sub(
                    r'poster=\{item\.poster\}',
                    "poster={item.poster || ''}",
                    content
                )
                
                # Corrigir capa com fallback
                content = re.sub(
                    r'capa=\{item\.capa\}',
                    "capa={item.capa || ''}",
                    content
                )
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Tipos corrigidos")
PYTHON

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ TYPESCRIPT TYPES CORRIGIDOS!                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

