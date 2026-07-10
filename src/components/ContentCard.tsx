'use client'
 
interface ContentCardProps {
  id?: string | number
  titulo?: string
  poster?: string
  rating?: number
  year?: number
  onClick?: () => void
}
 
export function ContentCard({ id, titulo, poster, rating, year, onClick }: ContentCardProps) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: '#222',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {poster ? (
        <img 
          src={poster} 
          alt={titulo}
          style={{
            width: '100%',
            height: '250px',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '250px',
          background: '#444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888'
        }}>
          Sem capa
        </div>
      )}
      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: '14px', color: '#fff', margin: '0 0 8px 0' }}>
          {titulo || 'Sem título'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
          <span>⭐ {rating || 'N/A'}</span>
          <span>{year || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}