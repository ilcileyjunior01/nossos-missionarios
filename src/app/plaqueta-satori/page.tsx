'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Missionary } from '@/types/missionary'

export default function PlaquetaSatoriPage() {
  const [missionaries, setMissionaries] = useState<Missionary[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [imgSrc, setImgSrc] = useState('/api/plaqueta')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('missionaries')
      .select('id, nome, ala, genero, pais_missao, nome_missao')
      .order('nome')
      .then(({ data }) => {
        if (data) setMissionaries(data as Missionary[])
      })
  }, [])

  function handleSelect(id: string) {
    setSelectedId(id)
    if (!id) {
      setImgSrc('/api/plaqueta')
      return
    }
    setLoading(true)
    setImgSrc(`/api/plaqueta?id=${id}&t=${Date.now()}`)
  }

  return (
    <div style={{
      background: '#1a1a1a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 24, gap: 20,
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ color: '#fff', fontSize: 18, margin: 0 }}>
        Gerador de Plaqueta
      </h1>

      {/* Seletor */}
      <select
        value={selectedId}
        onChange={e => handleSelect(e.target.value)}
        style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 14,
          background: '#333', color: '#fff', border: '1px solid #555',
          minWidth: 300, cursor: 'pointer',
        }}
      >
        <option value="">— Mock (Beatriz Silva Cavalcante) —</option>
        {missionaries.map(m => (
          <option key={m.id} value={m.id}>
            {m.nome} — {m.pais_missao ?? 'sem país'}
          </option>
        ))}
      </select>

      {/* Imagem gerada */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, zIndex: 1,
          }}>
            Gerando...
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="Plaqueta"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'block' }}
        />
      </div>

      {/* Botão download */}
      <a
        href={imgSrc}
        download={`plaqueta-${selectedId || 'preview'}.png`}
        style={{
          background: '#b8972a', color: '#fff', borderRadius: 8,
          padding: '8px 24px', fontSize: 14, textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Baixar PNG
      </a>
    </div>
  )
}
