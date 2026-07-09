const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://ebbuobnltsrvqxayrulk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnVvYm5sdHNydnF4YXlydWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDI0NjQsImV4cCI6MjA5Mzg3ODQ2NH0.9QAf6l69lPn48MhAD2Xgf3adNzEpf6LkBCk3jfqqGXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('=== Testando conexão com Supabase ===\n');
  
  // Testa tabela cinema - verificar se tem imagens
  console.log('1. Verificando dados de imagem na tabela cinema...');
  try {
    const { data: cinemaData, error: cinemaError } = await supabase
      .from('cinema')
      .select('id,titulo,poster,banner,backdrop')
      .limit(5);
    
    if (cinemaError) {
      console.error('ERRO na tabela cinema:', cinemaError);
    } else if (cinemaData && cinemaData.length > 0) {
      console.log(`✓ Encontrados ${cinemaData.length} registros em cinema`);
      cinemaData.forEach((item, i) => {
        console.log(`\n--- Cinema ${i + 1} ---`);
        console.log(`ID: ${item.id}`);
        console.log(`Título: ${item.titulo}`);
        console.log(`Poster: ${item.poster ? 'SIM' : 'NÃO'}`);
        console.log(`Banner: ${item.banner ? 'SIM' : 'NÃO'}`);
        console.log(`Backdrop: ${item.backdrop ? 'SIM' : 'NÃO'}`);
        if (item.poster) console.log(`Poster URL: ${item.poster.substring(0, 50)}...`);
      });
    } else {
      console.log('Tabela cinema vazia');
    }
  } catch (e) {
    console.error('Erro ao buscar cinema:', e.message);
  }
  
  console.log('\n');
  
  // Testa tabela series - verificar se tem imagens
  console.log('2. Verificando dados de imagem na tabela series...');
  try {
    const { data: seriesData, error: seriesError } = await supabase
      .from('series')
      .select('id_n,titulo,poster,capa,banner')
      .limit(5);
    
    if (seriesError) {
      console.error('ERRO na tabela series:', seriesError);
    } else if (seriesData && seriesData.length > 0) {
      console.log(`✓ Encontrados ${seriesData.length} registros em series`);
      seriesData.forEach((item, i) => {
        console.log(`\n--- Série ${i + 1} ---`);
        console.log(`ID: ${item.id_n}`);
        console.log(`Título: ${item.titulo}`);
        console.log(`Poster: ${item.poster ? 'SIM' : 'NÃO'}`);
        console.log(`Capa: ${item.capa ? 'SIM' : 'NÃO'}`);
        console.log(`Banner: ${item.banner ? 'SIM' : 'NÃO'}`);
        if (item.poster) console.log(`Poster URL: ${item.poster.substring(0, 50)}...`);
      });
    } else {
      console.log('Tabela series vazia');
    }
  } catch (e) {
    console.error('Erro ao buscar series:', e.message);
  }
  
  console.log('\n');
  
  // Conta quantos registros têm imagens
  console.log('3. Contando registros com imagens...');
  try {
    const { count: cinemaWithPoster } = await supabase
      .from('cinema')
      .select('*', { count: 'exact', head: true })
      .not('poster', 'is', null);
    
    const { count: seriesWithPoster } = await supabase
      .from('series')
      .select('*', { count: 'exact', head: true })
      .not('poster', 'is', null);
    
    console.log(`✓ Cinema com poster: ${cinemaWithPoster}`);
    console.log(`✓ Series com poster: ${seriesWithPoster}`);
  } catch (e) {
    console.error('Erro ao contar imagens:', e.message);
  }
  
  console.log('\n=== Teste concluído ===');
}

testConnection();
