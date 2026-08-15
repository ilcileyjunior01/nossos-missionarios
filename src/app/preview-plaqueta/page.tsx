'use client'

import PlaquetaPreview from '@/components/PlaquetaPreview'
import { Missionary } from '@/types/missionary'

const mock: Missionary = {
  id: 'test-1',
  nome: 'Beatriz Silva Cavalcante',
  ala: 'Jardim Helena',
  genero: 'F',
  foto_url: null,
  data_inicio: '2025-02-10',
  data_termino: '2026-07-22',
  pais_missao: 'Brasil',
  nome_missao: 'Brasil Salvador',
  cidade_missao: 'Salvador',
  latitude: -12.9714,
  longitude: -38.5014,
  status_placa: 'nao_enviado',
  eh_servico: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function PreviewPage() {
  return (
    <div style={{ background: '#222', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PlaquetaPreview missionary={mock} onClose={() => {}} />
    </div>
  )
}
