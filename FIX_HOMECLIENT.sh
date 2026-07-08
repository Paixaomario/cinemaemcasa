#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔧 CORRIGIR HomeClient.tsx — Usar ContentCard correto     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Fazer backup
echo "1️⃣  Fazendo backup de src/app/HomeClient.tsx..."
cp src/app/HomeClient.tsx src/app/HomeClient.tsx.backup
echo "   ✅ Backup em: src/app/HomeClient.tsx.backup"
echo ""

# PASSO 2: Corrigir uso do ContentCard
echo "2️⃣  Corrigindo HomeClient.tsx..."

python3 << 'PYTHON'
import re

# Ler arquivo
with open('src/app/HomeClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Padrão 1: <ContentCard key={item.id} item={item} />
# Substituir por: <ContentCard key={item.id} id={item.id} titulo={item.titulo} type={item.type} ... />

# Encontrar e substituir o padrão incorreto
old_pattern = r'<ContentCard\s+key=\{item\.id\}\s+item=\{item\}\s*/?\s*>'

new_code = '''<ContentCard
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

# Substituir o padrão
content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE | re.DOTALL)

# Se ainda tiver item={item}, remove
content = re.sub(r'\s+item=\{item\}', '', content)

# Salvar
with open('src/app/HomeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ HomeClient.tsx corrigido")
PYTHON

echo "   ✅ HomeClient.tsx atualizado"
echo ""

# PASSO 3: Verificar
echo "3️⃣  Verificando arquivo..."
if grep -q "ContentCard" src/app/HomeClient.tsx; then
  echo "   ✅ ContentCard ainda está presente"
else
  echo "   ❌ Erro: ContentCard não encontrado"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ HOMECLIENT CORRIGIDO!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo:"
echo "  npm run build"
echo ""

