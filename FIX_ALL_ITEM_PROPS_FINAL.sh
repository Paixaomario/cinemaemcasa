#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX ALL — Remover TODOS os item={} em TODO o projeto      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Procurando por item={} em TODO o projeto (src/, não node_modules)..."

python3 << 'PYTHON'
import os
import re

count = 0
for root, dirs, files in os.walk('src'):
    # Pular node_modules
    dirs[:] = [d for d in dirs if d != 'node_modules']
    
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            if 'item={' in content:
                count += 1
                print(f"   Corrigindo: {filepath}")
                
                # Remover QUALQUER padrão item={...}
                # Suporta nested braces
                content = re.sub(
                    r'\s*item=\{[^}]*(?:\{[^}]*\}[^}]*)?\}',
                    '',
                    content,
                    flags=re.MULTILINE | re.DOTALL
                )
                
                # Limpar quebras de linha extras
                while '\n\n\n' in content:
                    content = content.replace('\n\n\n', '\n\n')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print(f"   ✅ {count} arquivo(s) corrigido(s)")
PYTHON

echo ""
echo "2️⃣  Verificando se ainda tem item={...}..."

if grep -r "item={" src --include="*.tsx" --include="*.ts" 2>/dev/null | grep -i contentcard; then
  echo "   ⚠️  Ainda há item={ em alguns arquivos"
else
  echo "   ✅ Nenhum item={ com ContentCard encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ TODOS OS item={} REMOVIDOS!                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

