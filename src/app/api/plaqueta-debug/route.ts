import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'Passe ?id=...' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: m, error } = await supabase
    .from('missionaries')
    .select('id, nome, foto_url, pais_missao, latitude, longitude')
    .eq('id', id)
    .single()

  if (error || !m) {
    return Response.json({ error: error?.message ?? 'Não encontrado' }, { status: 404 })
  }

  // Testa o fetch da foto
  let fotoStatus: string | null = null
  let fotoContentType: string | null = null
  if (m.foto_url) {
    try {
      const res = await fetch(m.foto_url)
      fotoStatus = `${res.status} ${res.statusText}`
      fotoContentType = res.headers.get('content-type')
    } catch (e) {
      fotoStatus = `ERRO: ${String(e)}`
    }
  }

  return Response.json({
    id: m.id,
    nome: m.nome,
    foto_url: m.foto_url,
    foto_fetch_status: fotoStatus,
    foto_content_type: fotoContentType,
    pais_missao: m.pais_missao,
    latitude: m.latitude,
    longitude: m.longitude,
  })
}
