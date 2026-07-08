#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX SEARCH PAGE — Remover props que não existem            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Removendo backdrop e banner de search/page.tsx..."

python3 << 'PYTHON'
import os

filepath = 'src/app/search/page.tsx'

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"   Editando: {filepath}")
    
    # Remover backdrop={...}
    content = content.replace('backdrop={item.backdrop || \'\'}', '')
    content = content.replace('backdrop={item.backdrop}', '')
    
    # Remover banner={...}
    content = content.replace('banner={item.banner || \'\'}', '')
    content = content.replace('banner={item.banner}', '')
    
    # Remover quebras de linha extras
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ backdrop e banner removidos")
else:
    print(f"   ❌ {filepath} não encontrado")

PYTHON

echo ""
echo "2️⃣  Verificando se ainda há erro..."

if grep -n "backdrop=" src/app/search/page.tsx 2>/dev/null; then
  echo "   ⚠️  Ainda há backdrop em search/page.tsx"
else
  echo "   ✅ Backdrop removido"
fi

if grep -n "banner=" src/app/search/page.tsx 2>/dev/null; then
  echo "   ⚠️  Ainda há banner em search/page.tsx"
else
  echo "   ✅ Banner removido"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ SEARCH PAGE CONTENTCARD FIXADO!               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

