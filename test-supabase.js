const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://ebbuobnltsrvqxayrulk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnVvYm5sdHNydnF4YXlydWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDI0NjQsImV4cCI6MjA5Mzg3ODQ2NH0.9QAf6l69lPn48MhAD2Xgf3adNzEpf6LkBCk3jfqqGXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('=== Testando conexão com Supabase ===\n');
  
  // Testa tabela cinema - buscar todas as colunas
  console.log('1. Verificando colunas da tabela cinema...');
  try {
    const { data: cinemaData, error: cinemaError } = await supabase
      .from('cinema')
      .select('*')
      .limit(1);
    
    if (cinemaError) {
      console.error('ERRO na tabela cinema:', cinemaError);
    } else if (cinemaData && cinemaData.length > 0) {
      console.log(`✓ Colunas disponíveis em cinema:`, Object.keys(cinemaData[0]));
      console.log('Exemplo de registro:', cinemaData[0]);
    } else {
      console.log('Tabela cinema vazia');
    }
  } catch (e) {
    console.error('Erro ao buscar cinema:', e.message);
  }
  
  console.log('\n');
  
  // Testa tabela series - buscar todas as colunas
  console.log('2. Verificando colunas da tabela series...');
  try {
    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .limit(1);
    
    if (seriesError) {
      console.error('ERRO na tabela series:', seriesError);
    } else if (seriesData && seriesData.length > 0) {
      console.log(`✓ Colunas disponíveis em series:`, Object.keys(seriesData[0]));
      console.log('Exemplo de registro:', seriesData[0]);
    } else {
      console.log('Tabela series vazia');
    }
  } catch (e) {
    console.error('Erro ao buscar series:', e.message);
  }
  
  console.log('\n');
  
  // Conta total de registros
  console.log('3. Contando registros...');
  try {
    const { count: cinemaCount } = await supabase.from('cinema').select('*', { count: 'exact', head: true });
    const { count: seriesCount } = await supabase.from('series').select('*', { count: 'exact', head: true });
    console.log(`✓ Cinema: ${cinemaCount} registros`);
    console.log(`✓ Series: ${seriesCount} registros`);
  } catch (e) {
    console.error('Erro ao contar:', e.message);
  }
  
  console.log('\n=== Teste concluído ===');
}

testConnection();
