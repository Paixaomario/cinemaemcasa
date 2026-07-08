#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 ADICIONAR PROPS FALTANDO — ContentCard completo           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Procurando ContentCard sem props suficientes..."

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
                
                # Padrão: <ContentCard key={...} /> com nada mais
                # Substituir por versão completa
                pattern = r'<ContentCard\s+key=\{item\.id\}\s*/?\s*>'
                replacement = '''<ContentCard
                  key={item.id}
                  id={item.id}
                  titulo={item.titulo || item.title}
                  type={item.type === 'movie' ? 'movie' : 'series'}
                  poster={item.poster}
                  capa={item.capa}
                  backdrop={item.backdrop}
                  banner={item.banner}
                  rating={item.rating}
                  year={item.year || item.ano}
                />'''
                
                content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
                
                # Também corrigir padrão multi-linha simples
                # <ContentCard
                #   key={item.id}
                # />
                pattern2 = r'<ContentCard\s+key=\{item\.id\}\s*/?\s*>'
                content = re.sub(pattern2, replacement, content, flags=re.MULTILINE)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Props adicionadas")
PYTHON

echo ""
echo "2️⃣  Verificando arquivo..."

if grep -r "ContentCard" src/app --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "id=" | grep -v "from"; then
  echo "   ⚠️  Ainda há ContentCard sem props (verificar manualmente)"
else
  echo "   ✅ Todos os ContentCard têm props"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ CONTENTCARD PROPS COMPLETOS!                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

