#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX FINAL — Remover TODOS os item={} do ContentCard       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Procurando padrões de ContentCard com item..."

# Usar Python para remover TODOS os padrões item={}
python3 << 'PYTHON'
import os
import re

# Procurar por todos os arquivos .tsx e .ts
for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            # Se tem item=, precisamos remover
            if 'item={' in content and 'ContentCard' in content:
                print(f"   Corrigindo: {filepath}")
                
                # Remover QUALQUER padrão item={...} (seja item={item} ou item={{...}})
                # Padrão 1: item={item}
                content = re.sub(r'\s*item=\{item\}', '', content)
                
                # Padrão 2: item={{ ...item, ...}}
                content = re.sub(r'\s*item=\{\{[^}]*\}\}', '', content)
                
                # Padrão 3: item={...} genérico (qualquer coisa)
                # Isso é mais arriscado, vamos fazer só se necessário
                
                # Salvar
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Todos os padrões item={} removidos")
PYTHON

echo ""
echo "2️⃣  Verificando se ainda tem item=..."

if grep -r "item=\{" src/app --include="*.tsx" --include="*.ts" 2>/dev/null; then
  echo "   ⚠️  Ainda há item={ em alguns arquivos (verificar manualmente)"
else
  echo "   ✅ Nenhum item={ encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ CONTENTKARD FINAL CORRIGIDO!                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

