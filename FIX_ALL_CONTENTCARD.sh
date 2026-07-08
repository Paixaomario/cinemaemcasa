#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 CORRIGIR TODOS ContentCard — Buscar e substituir em todos  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Encontrar todos os arquivos com ContentCard
echo "1️⃣  Procurando arquivos com ContentCard..."
FILES=$(grep -r "item={item}" src/app --include="*.tsx" --include="*.ts" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "   ⚠️  Nenhum arquivo com item={item} encontrado"
else
  echo "   ✅ Arquivos encontrados"
fi
echo ""

# PASSO 2: Corrigir todos os arquivos
echo "2️⃣  Corrigindo todos os arquivos com ContentCard..."

python3 << 'PYTHON'
import os
import re

# Procurar por todos os arquivos .tsx e .ts
for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            
            # Ler arquivo
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            # Se tem item={item}, precisamos corrigir
            if 'item={item}' in content:
                print(f"   Corrigindo: {filepath}")
                
                # Padrão: <ContentCard ... item={item} />
                # Precisa remover item={item} e adicionar as props corretas
                
                # Encontra padrões como:
                # <ContentCard
                #   key={item.id}
                #   item={item}
                # />
                
                pattern = r'<ContentCard\s+key=\{item\.id\}\s+item=\{item\}\s*/?\s*>'
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
                
                # Também remove item={item} em qualquer contexto
                content = re.sub(r'\s+item=\{item\}', '', content)
                
                # Salvar
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Todos os arquivos corrigidos")
PYTHON

echo ""

# PASSO 3: Verificar
echo "3️⃣  Verificando se ainda tem item={item}..."
if grep -r "item={item}" src/app --include="*.tsx" --include="*.ts" 2>/dev/null; then
  echo "   ⚠️  Ainda há item={item} em alguns arquivos"
else
  echo "   ✅ Nenhum item={item} encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ TODOS OS CONTENTCARDS CORRIGIDOS!             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo:"
echo "  npm run build"
echo ""

