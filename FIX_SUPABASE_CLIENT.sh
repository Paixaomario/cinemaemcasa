#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔧 CORRIGIR Supabase Client — Criar arquivo faltante      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Criar pasta integrations/supabase
echo "1️⃣  Criando pasta src/integrations/supabase..."
mkdir -p src/integrations/supabase
echo "   ✅ Pasta criada"
echo ""

# PASSO 2: Verificar se existe .env.local com SUPABASE_URL e SUPABASE_KEY
echo "2️⃣  Verificando variáveis de ambiente..."
if [ -f ".env.local" ]; then
  echo "   ✅ .env.local encontrado"
  # Verificar se tem as variáveis
  if grep -q "SUPABASE_URL" .env.local; then
    echo "   ✅ SUPABASE_URL existe"
  else
    echo "   ⚠️  SUPABASE_URL não encontrada em .env.local"
  fi
else
  echo "   ⚠️  .env.local não encontrado"
fi
echo ""

# PASSO 3: Criar arquivo client.ts
echo "3️⃣  Criando src/integrations/supabase/client.ts..."

cat > src/integrations/supabase/client.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente Supabase não definidas!')
  console.error('Adicione em .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=sua_url')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)

export default supabase
EOF

echo "   ✅ Arquivo client.ts criado"
echo ""

# PASSO 4: Verificar se Supabase está instalado
echo "4️⃣  Verificando se @supabase/supabase-js está instalado..."
if grep -q "@supabase/supabase-js" package.json; then
  echo "   ✅ @supabase/supabase-js está instalado"
else
  echo "   ⚠️  @supabase/supabase-js NÃO está instalado!"
  echo "   Instalando..."
  npm install @supabase/supabase-js --legacy-peer-deps
  echo "   ✅ Instalação concluída"
fi
echo ""

# PASSO 5: Criar .env.local se não existir (com placeholder)
if [ ! -f ".env.local" ]; then
  echo "5️⃣  Criando .env.local (você precisa preencher com suas credenciais)..."
  cat > .env.local << 'ENVFILE'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sua-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Outros
NEXT_PUBLIC_API_URL=http://localhost:3000
ENVFILE
  echo "   ✅ .env.local criado (VOCÊ PRECISA PREENCHER AS CREDENCIAIS!)"
  echo ""
  echo "   ⚠️  IMPORTANTE:"
  echo "   Abra .env.local e substitua:"
  echo "     - https://sua-supabase-url.supabase.co → Sua URL real"
  echo "     - sua-chave-anonima-aqui → Sua chave anônima"
  echo ""
else
  echo "5️⃣  .env.local já existe"
  echo "   ✅ Pulando criação"
fi
echo ""

# PASSO 6: Verificar se arquivo foi criado
echo "6️⃣  Verificando arquivo..."
if [ -f "src/integrations/supabase/client.ts" ]; then
  echo "   ✅ src/integrations/supabase/client.ts existe"
else
  echo "   ❌ Erro: arquivo não foi criado!"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ SUPABASE CONFIGURADO!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Abra .env.local"
echo "  2. Substitua NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  3. Use seus valores reais do Supabase"
echo ""
echo "Depois execute:"
echo "  npm run build"
echo ""

