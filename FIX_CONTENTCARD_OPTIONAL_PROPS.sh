#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 FIX OPTIONAL PROPS — Tornar props opcionais                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Tornando props opcionais no ContentCard..."

# Editar o tipo ContentCardProps para tornar props opcionais
python3 << 'PYTHON'
import os

# Abrir src/components/ui/ContentCard.tsx
filepath = 'src/components/ui/ContentCard.tsx'

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tornar todas as props opcionais (adicionar ? antes do :)
    # Padrão: id: string => id?: string
    content = content.replace('id: string', 'id?: string')
    content = content.replace('titulo: string', 'titulo?: string')
    content = content.replace('type: \'movie\' | \'series\'', 'type?: \'movie\' | \'series\'')
    content = content.replace('poster?: string', 'poster?: string')
    content = content.replace('capa?: string', 'capa?: string')
    content = content.replace('backdrop?: string', 'backdrop?: string')
    content = content.replace('banner?: string', 'banner?: string')
    content = content.replace('rating?: number', 'rating?: number')
    content = content.replace('year?: number', 'year?: number')
    content = content.replace('onClick?: () => void', 'onClick?: () => void')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ {filepath} atualizado (props opcionais)")
else:
    print(f"   ❌ {filepath} não encontrado")

PYTHON

echo ""
echo "2️⃣  Adicionando fallbacks nas props de ContentCard..."

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
                
                # Adicionar fallbacks para todas as props opcionais
                # backdrop={item.backdrop} => backdrop={item.backdrop || ''}
                content = re.sub(
                    r'backdrop=\{item\.backdrop\}',
                    "backdrop={item.backdrop || ''}",
                    content
                )
                
                # banner={item.banner} => banner={item.banner || ''}
                content = re.sub(
                    r'banner=\{item\.banner\}',
                    "banner={item.banner || ''}",
                    content
                )
                
                # rating={item.rating} => rating={item.rating || 0}
                content = re.sub(
                    r'rating=\{item\.rating\}',
                    "rating={item.rating || 0}",
                    content
                )
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Fallbacks adicionados")
PYTHON

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ PROPS OPCIONAIS ADICIONADOS!                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

