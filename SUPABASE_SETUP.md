# Configuração do Supabase para Página de Perfil

## Passo 1: Executar SQL no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Crie uma nova query
5. Copie e cole todo o conteúdo do arquivo `database/profile_tables.sql`
6. Execute o SQL

**O que este SQL faz:**
- Cria a tabela `profiles` (se não existir)
- Cria todas as tabelas de configurações do perfil
- Cria triggers para atualizar `updated_at` automaticamente
- Configura políticas RLS (Row Level Security) para segurança
- Cria índices para otimização de consultas

## Passo 2: Criar Bucket de Avatares no Storage

1. No Supabase Dashboard, vá para **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name:** `avatars`
   - **Make public:** ❌ (desmarcado)
   - **File size limit:** 5MB
4. Clique em **Create bucket**

## Passo 3: Configurar Políticas RLS do Storage

1. No bucket `avatars`, clique em **Policies**
2. Clique em **New Policy**
3. Selecione **For full customization** e clique em **Get started**
4. Adicione as seguintes políticas:

### Política 1: Upload de Avatares
```sql
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Política 2: Visualização Pública de Avatares
```sql
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### Política 3: Deletar Avatares
```sql
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Passo 4: Verificar Configuração

### Verificar Tabelas
No SQL Editor, execute:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles',
  'profile_settings',
  'accessibility_settings',
  'connected_devices',
  'profile_statistics'
);
```

### Verificar Políticas RLS
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar Bucket de Storage
No Dashboard, vá para Storage e verifique se o bucket `avatars` aparece.

## Passo 5: Testar a Aplicação

1. Faça login na aplicação
2. Acesse a página de perfil (`/perfil`)
3. Abra o console do navegador (F12)
4. Teste cada funcionalidade:
   - Upload de avatar
   - Edição de nome
   - Salvamento de configurações
   - Salvamento de acessibilidade
   - Registro de dispositivos

## Solução de Problemas

### Erro: "relation profiles does not exist"
**Solução:** Execute o SQL novamente para criar a tabela `profiles`.

### Erro: "new row violates row-level security policy"
**Solução:** Verifique se as políticas RLS foram criadas corretamente. Execute a query de verificação de políticas.

### Erro: "Bucket not found"
**Solução:** Crie o bucket `avatars` no Storage conforme o Passo 2.

### Erro: "Permission denied"
**Solução:** Verifique as políticas RLS do Storage. Certifique-se de que as políticas de upload e visualização estão configuradas.

### Dispositivos não aparecendo
**Solução:** Verifique o console do navegador. Deve aparecer logs como:
- `Buscando dispositivos conectados para usuário: [ID]`
- `Registrando dispositivo: { deviceName, deviceType }`

Se houver erros, verifique se a tabela `connected_devices` existe e se as políticas RLS estão configuradas.

## Logs de Debug

A aplicação agora tem logs detalhados no console para ajudar a identificar problemas:

- `Salvando nome: [nome]`
- `Iniciando upload de avatar: [nome do arquivo] [tamanho]`
- `Avatar upload concluído: [URL]`
- `Salvando configurações: [configurações]`
- `Salvando configurações de acessibilidade: [configurações]`
- `Buscando dispositivos conectados para usuário: [ID]`
- `Registrando dispositivo: { deviceName, deviceType }`

Use esses logs para identificar onde está o problema.
