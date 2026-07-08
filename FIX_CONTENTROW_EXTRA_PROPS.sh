#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX CONTENTROW — Remover props extras não suportadas       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Removendo showProgress, progress, onItemClick de ContentRow..."

python3 << 'PYTHON'
import os
import re

filepath = 'src/components/sections/ContentRow.tsx'

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"   Editando: {filepath}")
    
    # Remover showProgress={...}
    content = re.sub(r'\s*showProgress=\{[^}]*\}', '', content)
    
    # Remover progress={...} (pode ter braces aninhadas)
    content = re.sub(
        r'\s*progress=\{[^{}]*(?:\{[^}]*\}[^{}]*)?\}',
        '',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Remover onClick={...}
    content = re.sub(r'\s*onClick=\{[^}]*\}', '', content)
    
    # Limpar quebras de linha extras
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')
    
    # Remover linhas em branco antes de />
    content = re.sub(r'\s+/>', '/>', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Props extras removidas")
else:
    print(f"   ❌ {filepath} não encontrado")

PYTHON

echo ""
echo "2️⃣  Verificando arquivo corrigido..."

if grep -n "showProgress\|progress=\|onClick=" src/components/sections/ContentRow.tsx 2>/dev/null | grep -i contentcard; then
  echo "   ⚠️  Ainda há props extras"
else
  echo "   ✅ Nenhuma prop extra encontrada"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ PROPS EXTRAS REMOVIDAS!                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

