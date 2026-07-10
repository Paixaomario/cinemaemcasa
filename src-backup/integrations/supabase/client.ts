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
