'use client'
 
interface CategoryFilterProps {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}
 
export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 16px',
          background: selected === null ? '#ff6b35' : '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background 0.3s'
        }}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            padding: '8px 16px',
            background: selected === cat ? '#ff6b35' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.3s'
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}