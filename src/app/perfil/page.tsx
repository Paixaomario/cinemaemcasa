'use client'
 
import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/queries'
import { updateProfile } from '@/lib/actions' // Corrigido para importar de actions
 
// Para agora, vamos usar um user mock
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'
 
export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
 
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Para demonstração, carregamos um perfil mock
        // Depois vamos autenticar usuários reais
        setProfile({
          id: MOCK_USER_ID,
          username: 'usuario_demo',
          full_name: 'Usuário Demo',
          avatar_url: null,
          is_admin: false,
          is_child: false,
          content_rating_limit: '18'
        })
        setFullName('Usuário Demo')
        setUsername('usuario_demo')
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      } finally {
        setLoading(false)
      }
    }
 
    loadProfile()
  }, [])
 
  const handleUpdate = async () => {
    try {
      const updated = await updateProfile(MOCK_USER_ID, {
        full_name: fullName,
        username: username
      })
      if (updated) {
        setProfile(updated)
        setEditing(false)
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    }
  }
 
  if (loading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Carregando perfil...</div>
  }
 
  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '30px' }}>👤 Meu Perfil</h1>
 
      {profile && (
        <div style={{ background: '#222', padding: '20px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!editing}
              style={{
                width: '100%',
                padding: '10px',
                background: editing ? '#333' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
          </div>
 
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!editing}
              style={{
                width: '100%',
                padding: '10px',
                background: editing ? '#333' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
          </div>
 
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Classificação de Conteúdo</label>
            <select
              value={profile.content_rating_limit || '18'}
              disabled={!editing}
              style={{
                width: '100%',
                padding: '10px',
                background: editing ? '#333' : '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            >
              <option value="L">Livre</option>
              <option value="10">10+</option>
              <option value="12">12+</option>
              <option value="14">14+</option>
              <option value="16">16+</option>
              <option value="18">18+</option>
            </select>
          </div>
 
          <button
            onClick={() => {
              if (editing) {
                handleUpdate()
              } else {
                setEditing(true)
              }
            }}
            style={{
              padding: '12px 24px',
              background: editing ? '#ff6b35' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {editing ? 'Salvar' : 'Editar'}
          </button>
 
          {editing && (
            <button
              onClick={() => {
                setEditing(false)
                setFullName(profile.full_name)
                setUsername(profile.username)
              }}
              style={{
                padding: '12px 24px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}