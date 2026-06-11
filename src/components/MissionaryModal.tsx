'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Missionary } from '@/types/missionary'
import Image from 'next/image'
// import dinâmico para evitar SSR com APIs de browser (WebWorker/WASM)
let removeBackgroundFn: typeof import('@imgly/background-removal').removeBackground | null = null
async function getRemoveBackground() {
  if (!removeBackgroundFn) {
    const mod = await import('@imgly/background-removal')
    removeBackgroundFn = mod.removeBackground
  }
  return removeBackgroundFn
}

export type ModalSavedAction = 'created' | 'updated' | 'deleted'

interface MissionaryModalProps {
  missionary?: Missionary | null
  onClose: () => void
  onSaved: (action: ModalSavedAction) => void
}

const ALAS = [
  'Ala Taboão',
  'Ala Parque Assunção',
  'Ala Jardim Guanabara',
  'Ala Jardim Silveira',
  'Ala Vila Figueira',
  'Outra',
]

export default function MissionaryModal({ missionary, onClose, onSaved }: MissionaryModalProps) {
  const isEdit = !!missionary?.id
  const fileRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(missionary?.nome ?? '')
  const [genero, setGenero] = useState<'M' | 'F' | ''>(missionary?.genero ?? '')
  const [ala, setAla] = useState(missionary?.ala ?? '')
  const [dataInicio, setDataInicio] = useState(missionary?.data_inicio ?? '')
  const [dataTermino, setDataTermino] = useState(missionary?.data_termino ?? '')
  const [paisMissao, setPaisMissao] = useState(missionary?.pais_missao ?? '')
  const [nomeMissao, setNomeMissao] = useState(missionary?.nome_missao ?? '')
  const [cidadeMissao, setCidadeMissao] = useState(missionary?.cidade_missao ?? '')
  const [fotoPreview, setFotoPreview] = useState<string | null>(missionary?.foto_url ?? null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [photoStep, setPhotoStep] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessingPhoto(true)
    setFotoPreview(null)
    setFotoFile(null)

    try {
      // 1. Remoção de fundo via IA (modelos ONNX no browser)
      setPhotoStep('Removendo fundo...')
      const removeBackground = await getRemoveBackground()
      const noBgBlob = await removeBackground(file, {
        model: 'isnet_fp16',
        device: 'cpu',
        output: { format: 'image/png', quality: 1 },
      })

      // 2. Fundo branco + suavização de pele no Canvas
      setPhotoStep('Aplicando retoques...')
      const processedBlob = await applyWhiteBgAndSmoothing(noBgBlob)

      // 3. Atualiza preview e arquivo para upload
      const processedFile = new File([processedBlob], file.name.replace(/\.[^.]+$/, '.png'), {
        type: 'image/png',
      })
      setFotoFile(processedFile)
      setFotoPreview(URL.createObjectURL(processedBlob))
    } catch (err) {
      console.error('Processamento de foto falhou, usando original:', err)
      setError('Não foi possível remover o fundo automaticamente. A foto original será usada.')
      setFotoFile(file)
      setFotoPreview(URL.createObjectURL(file))
    } finally {
      setProcessingPhoto(false)
      setPhotoStep('')
    }
  }

  /**
   * Recebe um Blob PNG com fundo transparente, aplica fundo branco
   * e suavização de pele (blur blend + brilho suave para atenuar olheiras).
   */
  function applyWhiteBgAndSmoothing(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new window.Image()
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas indisponível')); return }

        // Fundo branco
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)

        // Camada suavizada (blur 3px a 30% de opacidade) → atenua blemishes e olheiras
        ctx.filter = 'blur(3px) brightness(1.04)'
        ctx.globalAlpha = 0.30
        ctx.drawImage(img, 0, 0)

        // Imagem principal nítida por cima
        ctx.filter = 'none'
        ctx.globalAlpha = 1
        ctx.drawImage(img, 0, 0)

        URL.revokeObjectURL(url)
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob falhou'))),
          'image/png',
        )
      }
      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = url
    })
  }

  async function processImage(file: File): Promise<Blob> {
    const MAX_W = 800
    const MAX_H = 1067
    const QUALITY = 0.85

    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img

        // Redimensiona mantendo proporção, limitando a 800×1067
        const ratio = Math.min(MAX_W / width, MAX_H / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas não disponível'))

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao processar imagem'))
            resolve(blob)
          },
          'image/webp',
          QUALITY,
        )
      }
      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      )
      const data = await res.json()
      if (data.length === 0) return null
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {
      return null
    }
  }

  async function resolveCoords(): Promise<{ lat: number; lng: number } | null> {
    // 1. Campo manual tem prioridade (exceção explícita)
    if (cidadeMissao.trim() && paisMissao.trim()) {
      return geocodeQuery(`${cidadeMissao.trim()}, ${paisMissao.trim()}`)
    }
    // 2. Tenta com o nome oficial da missão
    if (nomeMissao.trim()) {
      return geocodeQuery(nomeMissao.trim())
    }
    // 3. Fallback só com o país
    if (paisMissao.trim()) {
      return geocodeQuery(paisMissao.trim())
    }
    return null
  }

  async function uploadFoto(file: File): Promise<string> {
    const blob = await processImage(file)
    const filename = `${Date.now()}.webp`
    const { error } = await supabase.storage
      .from('fotos-missionarios')
      .upload(filename, blob, { upsert: true, contentType: 'image/webp' })
    if (error) throw new Error('Erro ao fazer upload da foto: ' + error.message)
    const { data } = supabase.storage.from('fotos-missionarios').getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleDelete() {
    if (!missionary?.id) return
    setDeleting(true)
    setError(null)
    try {
      if (missionary.foto_url) {
        const filename = missionary.foto_url.split('/').pop()
        if (filename) {
          await supabase.storage.from('fotos-missionarios').remove([filename])
        }
      }
      const { error } = await supabase.from('missionaries').delete().eq('id', missionary.id)
      if (error) throw error
      onSaved('deleted')
      onClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message)
      } else {
        setError('Erro ao excluir.')
      }
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    const datesInvalid = dataInicio && dataTermino && dataTermino < dataInicio
    if (!nome.trim() || !ala.trim() || !genero || datesInvalid) {
      setError(datesInvalid ? 'A data de término deve ser após a data de início.' : 'Preencha os campos obrigatórios destacados.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      let foto_url = missionary?.foto_url ?? null
      if (fotoFile) foto_url = await uploadFoto(fotoFile)

      let latitude = missionary?.latitude ?? null
      let longitude = missionary?.longitude ?? null
      const locChanged =
        cidadeMissao.trim() !== (missionary?.cidade_missao ?? '') ||
        nomeMissao.trim() !== (missionary?.nome_missao ?? '') ||
        paisMissao.trim() !== (missionary?.pais_missao ?? '')
      if (!isEdit ? true : locChanged) {
        const coords = await resolveCoords()
        if (coords) {
          latitude = coords.lat
          longitude = coords.lng
        }
      }

      const payload = {
        nome: nome.trim(),
        ala: ala.trim(),
        genero: genero || null,
        foto_url,
        data_inicio: dataInicio || null,
        data_termino: dataTermino || null,
        pais_missao: paisMissao.trim() || null,
        nome_missao: nomeMissao.trim() || null,
        cidade_missao: cidadeMissao.trim() || null,
        latitude,
        longitude,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('missionaries')
          .update(payload)
          .eq('id', missionary.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('missionaries').insert(payload)
        if (error) throw error
      }

      onSaved(isEdit ? 'updated' : 'created')
      onClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao salvar.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="modal-panel bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2
            className="text-lg font-bold text-[#1a2744]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {isEdit ? 'Editar Missionário' : 'Novo Missionário'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => !processingPhoto && fileRef.current?.click()}
              className={`w-32 h-40 rounded-xl border-2 border-dashed bg-gray-50 flex items-center justify-center overflow-hidden relative transition-colors ${
                processingPhoto
                  ? 'border-[#b8972a] cursor-wait'
                  : 'border-gray-200 cursor-pointer hover:border-[#b8972a]'
              }`}
            >
              {processingPhoto ? (
                <div className="flex flex-col items-center gap-2 px-2 text-center">
                  <Loader2 size={22} className="animate-spin text-[#b8972a]" />
                  <span className="text-xs text-[#b8972a] font-[family-name:var(--font-inter)] leading-tight">
                    {photoStep}
                  </span>
                </div>
              ) : fotoPreview ? (
                <Image src={fotoPreview} alt="Preview" fill className="object-cover object-top" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Upload size={24} />
                  <span className="text-xs font-[family-name:var(--font-inter)]">Adicionar foto</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {fotoPreview && !processingPhoto && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-[#b8972a] font-[family-name:var(--font-inter)] underline"
              >
                Trocar foto
              </button>
            )}
            {!processingPhoto && !fotoPreview && (
              <p className="text-xs text-gray-400 font-[family-name:var(--font-inter)] text-center max-w-[180px] leading-tight">
                Fundo removido automaticamente
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              Nome completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João da Silva Santos"
              className={`w-full border rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none transition-colors ${
                submitAttempted && !nome.trim()
                  ? 'border-red-400 focus:border-red-400 bg-red-50'
                  : 'border-gray-200 focus:border-[#1a2744]'
              }`}
            />
            {submitAttempted && !nome.trim() && (
              <p className="text-xs text-red-500 mt-1 font-[family-name:var(--font-inter)]">Campo obrigatório</p>
            )}
          </div>

          {/* Gênero */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              Gênero <span className="text-red-400">*</span>
            </label>
            <div className={`flex gap-3 rounded-lg p-0.5 transition-colors ${submitAttempted && !genero ? 'ring-2 ring-red-400 rounded-lg' : ''}`}>
              <button
                type="button"
                onClick={() => setGenero('M')}
                className={`flex-1 py-2 rounded-lg border text-sm font-[family-name:var(--font-inter)] font-medium transition-colors ${
                  genero === 'M'
                    ? 'bg-[#1a2744] text-white border-[#1a2744]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a2744]'
                }`}
              >
                Elder (Homem)
              </button>
              <button
                type="button"
                onClick={() => setGenero('F')}
                className={`flex-1 py-2 rounded-lg border text-sm font-[family-name:var(--font-inter)] font-medium transition-colors ${
                  genero === 'F'
                    ? 'bg-[#1a2744] text-white border-[#1a2744]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a2744]'
                }`}
              >
                Sister (Mulher)
              </button>
            </div>
            {submitAttempted && !genero && (
              <p className="text-xs text-red-500 mt-1 font-[family-name:var(--font-inter)]">Selecione o gênero</p>
            )}
          </div>

          {/* Ala */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              Ala de origem <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={ala}
              onChange={e => setAla(e.target.value)}
              placeholder="Ex: Ala Taboão"
              list="alas-list"
              className={`w-full border rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none transition-colors ${
                submitAttempted && !ala.trim()
                  ? 'border-red-400 focus:border-red-400 bg-red-50'
                  : 'border-gray-200 focus:border-[#1a2744]'
              }`}
            />
            <datalist id="alas-list">
              {ALAS.map(a => <option key={a} value={a} />)}
            </datalist>
            {submitAttempted && !ala.trim() && (
              <p className="text-xs text-red-500 mt-1 font-[family-name:var(--font-inter)]">Campo obrigatório</p>
            )}
          </div>

          {/* Datas */}
          {(() => {
            const datesInvalid = submitAttempted && dataInicio && dataTermino && dataTermino < dataInicio
            return (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
                      Data de início
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none transition-colors ${
                        datesInvalid ? 'border-red-400 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#1a2744]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
                      Data de término
                    </label>
                    <input
                      type="date"
                      value={dataTermino}
                      onChange={e => setDataTermino(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none transition-colors ${
                        datesInvalid ? 'border-red-400 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#1a2744]'
                      }`}
                    />
                  </div>
                </div>
                {datesInvalid && (
                  <p className="text-xs text-red-500 mt-1 font-[family-name:var(--font-inter)]">A data de término deve ser após a data de início</p>
                )}
              </div>
            )
          })()}

          {/* País da missão */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              País da missão
            </label>
            <input
              type="text"
              value={paisMissao}
              onChange={e => setPaisMissao(e.target.value)}
              placeholder="Ex: Brasil, Portugal, Estados Unidos"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
            />
          </div>

          {/* Nome oficial da missão */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              Nome oficial da missão
            </label>
            <input
              type="text"
              value={nomeMissao}
              onChange={e => setNomeMissao(e.target.value)}
              placeholder="Ex: Missão Brasil Manaus"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
            />
          </div>

          {/* Cidade da missão — exceção manual */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 font-[family-name:var(--font-inter)] mb-1 uppercase tracking-wide">
              Cidade da missão <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={cidadeMissao}
              onChange={e => setCidadeMissao(e.target.value)}
              placeholder="Ex: Manaus"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-inter)] focus:outline-none focus:border-[#1a2744] transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1 font-[family-name:var(--font-inter)]">
              Preencha apenas se o nome da missão não localizar corretamente no mapa
            </p>
          </div>

          {/* Erro */}
          {error && (
            <p className="text-sm text-red-500 font-[family-name:var(--font-inter)]">{error}</p>
          )}

          {/* Confirmação de exclusão */}
          {confirmDelete && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-[family-name:var(--font-inter)]">
              <p className="text-red-700 font-medium mb-3">Tem certeza que deseja excluir este missionário? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-2 text-sm hover:bg-white transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  {deleting ? 'Excluindo...' : 'Sim, excluir'}
                </button>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            {isEdit && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-[family-name:var(--font-inter)] transition-colors disabled:opacity-40 px-1"
              >
                <Trash2 size={15} />
                Excluir
              </button>
            )}
            <div className="flex gap-3 flex-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 rounded-full py-2.5 text-sm font-[family-name:var(--font-inter)] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || processingPhoto}
                className="flex-1 bg-[#1a2744] hover:bg-[#253660] text-white rounded-full py-2.5 text-sm font-[family-name:var(--font-inter)] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
