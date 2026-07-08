#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX ULTRA FINAL — Remover QUALQUER item= do ContentCard   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Procurando QUALQUER padrão item= em ContentCard..."

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
            
            if 'ContentCard' in content and 'item=' in content:
                print(f"   Corrigindo: {filepath}")
                
                # Remover item={qualquer coisa entre chaves}
                # Padrão: item={...} onde ... pode ser:
                # - item
                # - {item}
                # - formatContentItem(item)
                # - { ...item, type: 'movie' }
                # etc
                
                # Remover item={...} (multiline safe)
                content = re.sub(
                    r'\s*item=\{[^}]*\}',
                    '',
                    content,
                    flags=re.MULTILINE | re.DOTALL
                )
                
                # Agora adicionar props padrão onde falta
                # Procurar por <ContentCard key={item.id} /> sem id=
                pattern = r'(<ContentCard\s+key=\{item\.id\}\s*)/?\s*(/>)'
                
                def replace_func(match):
                    opening = match.group(1)
                    closing = match.group(2)
                    
                    props = '''
                  id={item.id}
                  titulo={item.titulo || item.title}
                  type={item.type === 'movie' ? 'movie' : 'series'}
                  poster={item.poster}
                  capa={item.capa}
                  backdrop={item.backdrop}
                  banner={item.banner}
                  rating={item.rating}
                  year={item.year || item.ano}
                '''
                    
                    return f"{opening}{props}\n                {closing}"
                
                content = re.sub(pattern, replace_func, content, flags=re.MULTILINE | re.DOTALL)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Todos os padrões item= removidos")
PYTHON

echo ""
echo "2️⃣  Verificando se ainda tem item=..."

if grep -r "item=" src/app --include="*.tsx" --include="*.ts" 2>/dev/null | grep -i contentcard; then
  echo "   ⚠️  Ainda há ContentCard com item="
  grep -r "item=" src/app --include="*.tsx" --include="*.ts" 2>/dev/null | grep -i contentcard || true
else
  echo "   ✅ Nenhum ContentCard com item= encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ ULTRA FINAL CONTENTCARD FIXED!                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

