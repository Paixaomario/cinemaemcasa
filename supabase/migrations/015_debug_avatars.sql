-- Script de debug para verificar avatares
-- Execute no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar se a tabela system_avatars existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'system_avatars'
) as tabela_system_avatars_existe;

-- 2. Verificar se há dados na tabela system_avatars
SELECT COUNT(*) as total_avatares_sistema FROM public.system_avatars;

-- 3. Mostrar exemplos de avatares do sistema
SELECT id, name, url, category, is_active 
FROM public.system_avatars 
LIMIT 10;

-- 4. Verificar se a coluna system_avatar_id existe na tabela profiles
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'system_avatar_id'
) as coluna_system_avatar_id_existe;

-- 5. Verificar quantos usuários têm avatares do sistema selecionados
SELECT COUNT(*) as usuarios_com_avatar_sistema 
FROM public.profiles 
WHERE system_avatar_id IS NOT NULL;

-- 6. Mostrar exemplos de perfis com avatares
SELECT id, username, avatar_url, system_avatar_id 
FROM public.profiles 
LIMIT 5;
