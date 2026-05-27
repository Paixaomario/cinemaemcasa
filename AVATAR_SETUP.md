# Configuração do Sistema de Avatares

## Visão Geral

O sistema agora suporta dois tipos de avatares:
1. **Avatares Personalizados:** Upload de imagens do usuário
2. **Avatares do Sistema:** Seleção de avatares pré-definidos (estilo Netflix, Disney+, etc.)

## Configuração do Supabase Storage

### Passo 1: Criar Bucket de Avatares

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **"New bucket"**
5. Nome do bucket: `avatars`
6. Configurações:
   - **Public bucket:** Marque como público
   - **File size limit:** 5MB
   - **Allowed MIME types:** `image/*`

### Passo 2: Configurar Políticas de Acesso (RLS)

No painel do Supabase Storage, configure as seguintes políticas para o bucket `avatars`:

#### Política de Upload (INSERT)
```sql
CREATE POLICY "Usuários podem fazer upload de avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Política de Leitura (SELECT)
```sql
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Política de Atualização (UPDATE)
```sql
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Política de Remoção (DELETE)
```sql
CREATE POLICY "Usuários podem remover seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Executar Migração SQL

Execute a migração `012_create_avatars_storage.sql` no Supabase:

1. Vá em **SQL Editor** no painel do Supabase
2. Clique em **"New query"**
3. Cole o conteúdo do arquivo `supabase/migrations/012_create_avatars_storage.sql`
4. Clique em **"Run"**

Esta migração irá:
- Criar a tabela `system_avatars` com 20 avatares pré-definidos
- Adicionar coluna `system_avatar_id` na tabela `profiles`
- Configurar RLS para a tabela de avatares do sistema

## Avatares do Sistema

O sistema inclui 20 avatares pré-definidos organizados em categorias:

### Categorias
- **Padrão (4):** Avatares básicos com cores variadas
- **Cinema (4):** Diretor, Crítico, Cineasta, Produtor
- **Personagens (4):** Herói, Vilão, Aventureiro, Explorador
- **Animais (4):** Gato, Cachorro, Panda, Raposa
- **Abstrato (4):** Formas geométricas abstratas
- **Profissional (4):** Engenheiro, Designer, Desenvolvedor, Artista

### Como Funciona

1. Os avatares são gerados dinamicamente usando a API DiceBear
2. Cada avatar tem uma URL única baseada em sementes
3. URLs são armazenadas no banco de dados
4. Usuários podem selecionar qualquer avatar do sistema
5. A seleção é salva no perfil do usuário

## Uso

### Para Usuários

1. Acesse a página de perfil
2. Clique no avatar atual
3. Duas opções:
   - **Upload personalizado:** Clique na câmera para fazer upload de uma imagem
   - **Avatar do sistema:** Clique no botão azul (ícone de imagem) para selecionar um avatar pré-definido
4. Se selecionar avatar do sistema:
   - Uma janela modal abrirá
   - Filtre por categoria
   - Clique no avatar desejado
   - O avatar será aplicado imediatamente

### Para Desenvolvedores

#### Adicionar Novos Avatares

Para adicionar novos avatares do sistema, execute:

```sql
INSERT INTO system_avatars (name, url, category) VALUES
  ('Nome do Avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=semente-unico', 'categoria');
```

#### Usar API DiceBear

Gere avatares personalizados em: https://dicebear.com/

Exemplos de estilos:
- `avataaars`: Avatares cartoon
- `shapes`: Formas abstratas
- `notionists`: Estilo Notion
- `lorelei`: Personagens femininos
- `micah`: Estilo moderno

## Solução de Problemas

### Erro: "Erro ao fazer upload do avatar"

**Causa:** Bucket `avatars` não existe ou não está configurado corretamente

**Solução:**
1. Verifique se o bucket `avatars` existe no Storage
2. Verifique se as políticas de acesso estão configuradas
3. Verifique se o bucket está marcado como público

### Erro: "Bucket not found"

**Causa:** O código está tentando acessar um bucket que não existe

**Solução:**
1. Crie o bucket `avatars` no Supabase Storage
2. Configure as políticas de acesso conforme acima

### Avatares do sistema não aparecem

**Causa:** Migração SQL não foi executada

**Solução:**
1. Execute a migração `012_create_avatars_storage.sql`
2. Verifique se a tabela `system_avatars` existe
3. Verifique se há dados na tabela

## Segurança

- Uploads são limitados a 5MB
- Apenas imagens são aceitas
- Usuários só podem acessar seus próprios avatares
- Avatares do sistema são públicos
- RLS está habilitado em todas as tabelas
