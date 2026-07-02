/**
 * Bookmarklet: Importar Missionários do LCR
 *
 * Executar enquanto estiver logado em:
 * https://lcr.churchofjesuschrist.org/mlt/orgs/missionary?lang=por
 *
 * Estrutura real da tabela do LCR (confirmada via screenshot):
 *   Nome | Missão | Iniciou em | Fim Esperado | Unidade Atual | Meu Plano
 *
 * Datas no formato: "12 mai. 2025"
 */

;(async function () {
  'use strict'

  // ─── Configuração ────────────────────────────────────────────────
  const SUPABASE_URL = 'https://ktlvqmaacsaqffyyiujz.supabase.co'
  const SUPABASE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bHZxbWFhY3NhcWZmeXlpdWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzcyNTcsImV4cCI6MjA5NjYxMzI1N30.eHNhw_VwoZgWNY_3e2Rq7Zv9mBZWMXeCnCtxXeBxPUM'

  const SB_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }

  // ─── Parser de datas ─────────────────────────────────────────────
  // Cobre o formato real do LCR: "12 mai. 2025"
  // E outros formatos comuns como YYYYMMDD, DD/MM/YYYY, YYYY-MM-DD

  const PT_MONTHS = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
  }

  function normalizeDate(d) {
    if (!d) return null
    const s = String(d).trim()

    // "12 mai. 2025" ou "12 mai 2025"
    const ptMatch = s.match(/^(\d{1,2})\s+([a-zA-Zç]{3})\.?\s+(\d{4})$/)
    if (ptMatch) {
      const [, day, mon, year] = ptMatch
      const mm = PT_MONTHS[mon.toLowerCase().slice(0, 3)]
      if (mm) return `${year}-${mm}-${day.padStart(2, '0')}`
    }

    // YYYYMMDD
    if (/^\d{8}$/.test(s))
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`

    // DD/MM/YYYY
    const brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`

    // Já está em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

    // Último recurso: Date.parse
    const ts = Date.parse(s)
    return isNaN(ts) ? null : new Date(ts).toISOString().slice(0, 10)
  }

  // ─── Normalização de nome ─────────────────────────────────────────
  // "CAVALCANTE, BEATRIZ SILVA" → "Beatriz Silva Cavalcante"
  // "Concha Arciniega, Javier Ricardo" → "Javier Ricardo Concha Arciniega"

  function normalizeName(raw) {
    if (!raw) return ''
    const s = raw.trim()
    let parts
    if (s.includes(',')) {
      const commaIdx = s.indexOf(',')
      const last = s.slice(0, commaIdx).trim()
      const first = s.slice(commaIdx + 1).trim()
      parts = [...first.split(/\s+/), ...last.split(/\s+/)]
    } else {
      parts = s.split(/\s+/)
    }
    return parts
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  // ─── Extrai país da missão ────────────────────────────────────────
  // "Brazil Salvador Mission" → "Brasil"
  // "Bolivia La Paz El Alto Mission" → "Bolívia"

  const COUNTRY_MAP = {
    brazil: 'Brasil', bolivia: 'Bolívia', mexico: 'México', peru: 'Peru',
    chile: 'Chile', argentina: 'Argentina', colombia: 'Colômbia',
    ecuador: 'Equador', paraguay: 'Paraguai', uruguay: 'Uruguai',
    venezuela: 'Venezuela', usa: 'EUA', 'united states': 'EUA',
    portugal: 'Portugal', spain: 'Espanha', italy: 'Itália',
    france: 'França', germany: 'Alemanha', japan: 'Japão',
    korea: 'Coreia', china: 'China', australia: 'Austrália',
    canada: 'Canadá', nigeria: 'Nigéria', ghana: 'Gana',
    'south africa': 'África do Sul', philippines: 'Filipinas',
    indonesia: 'Indonésia', india: 'Índia', russia: 'Rússia',
    ukraine: 'Ucrânia', poland: 'Polônia',
  }

  function extractCountry(missionName) {
    if (!missionName) return null
    const lower = missionName.toLowerCase()
    for (const [key, val] of Object.entries(COUNTRY_MAP)) {
      if (lower.startsWith(key)) return val
    }
    // Retorna a primeira palavra como fallback
    const first = missionName.split(/\s+/)[0]
    return first || null
  }

  // ─── Mapeamento do registro LCR para nosso schema ────────────────

  function mapRecord(r) {
    const nome = normalizeName(
      r.name || r.nome || r.fullName || r.preferredName || r.nameOrder || ''
    )
    const nome_missao =
      r.missionName || r.nomeMissao || r.mission || null
    const ala =
      r.homeUnitName || r.unitName || r.ala || r.ward || r.nomeUnidade || ''
    const genero =
      r.gender === 'MALE' || r.gender === 'M' ? 'M' :
      r.gender === 'FEMALE' || r.gender === 'F' ? 'F' : null
    const data_inicio = normalizeDate(
      r.startDate || r.callingDate || r.dataInicio || r.iniciadoEm || r.beginDate
    )
    const data_termino = normalizeDate(
      r.expectedReturnDate || r.returnDate || r.endDate ||
      r.dataTermino || r.fimEsperado || r.releaseDate
    )
    const pais_missao = extractCountry(nome_missao)

    return {
      nome,
      ala,
      genero,
      data_inicio,
      data_termino,
      nome_missao,
      pais_missao,
      cidade_missao: null,
      foto_url: null,
      latitude: null,
      longitude: null,
      status_placa: 'nao_enviado',
    }
  }

  // ─── Tentativa 1: APIs internas do LCR ──────────────────────────
  // O LCR é uma SPA que faz chamadas à própria API.
  // Como o bookmarklet roda no mesmo domínio, os cookies de sessão
  // são enviados automaticamente → sem necessidade de login extra.

  async function tryLcrApi() {
    const ENDPOINTS = [
      '/api/v3/unitMembers?callingStatus=MISSIONARY',
      '/api/v3/orgs/missionary',
      '/api/umlu/v1/missionary-profile',
      '/api/v3/memberList?type=MISSIONARY',
      '/api/members/missionary',
    ]

    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) continue

        const data = await res.json()
        console.log(`[LCR Import] Endpoint ${ep}:`, data)

        const list =
          Array.isArray(data) ? data :
          Array.isArray(data?.members) ? data.members :
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.unitMembers) ? data.unitMembers :
          Array.isArray(data?.missionaryList) ? data.missionaryList :
          null

        if (list && list.length > 0) {
          console.log(`[LCR Import] ✅ API encontrado (${ep}): ${list.length} registros`)
          return list
        }
      } catch (e) {
        console.log(`[LCR Import] Endpoint ${ep} falhou:`, e.message)
      }
    }
    return null
  }

  // ─── Tentativa 2: Scraping do DOM ────────────────────────────────
  // Baseado na estrutura real do LCR:
  //   Colunas: Nome | Missão | Iniciou em | Fim Esperado | Unidade Atual
  //
  // Problema conhecido: o LCR tem linhas extras no <thead> (barra de pesquisa, abas)
  // e injeta o texto do cabeçalho dentro de cada <td> para responsividade mobile.

  function tryDomScrape() {
    const HEADER_MAP = {
      nome:         ['nome', 'name'],
      missionName:  ['missão', 'missao', 'mission'],
      startDate:    ['iniciou', 'início', 'inicio', 'start', 'mtc', 'chamada'],
      returnDate:   ['fim esperado', 'retorno', 'término', 'termino', 'return', 'release'],
      homeUnitName: ['unidade atual', 'unidade', 'ward', 'congregação', 'branch'],
    }

    function findIdx(headers, terms) {
      return headers.findIndex((h) => terms.some((t) => h.includes(t)))
    }

    // O LCR injeta o texto do header dentro de cada <td> (mobile label).
    // Removemos esse prefixo comparando com o header da própria coluna.
    function stripLabel(raw, hdrText) {
      const text = (raw ?? '').trim()
      const hdr  = (hdrText ?? '').toLowerCase()
      if (hdr && text.toLowerCase().startsWith(hdr)) {
        return text.slice(hdr.length).trim()
      }
      return text
    }

    const tables = document.querySelectorAll('table')
    for (const table of tables) {
      // 1. Determina quantas <td> cada linha de dados tem
      const sampleRow = table.querySelector('tbody tr')
      if (!sampleRow) continue
      const colCount = sampleRow.querySelectorAll('td').length
      if (colCount === 0) continue

      // 2. Encontra a linha de <thead> cujo número de células bate com os dados.
      //    (ignora linhas extras: barra de pesquisa, abas, etc.)
      const theadRows = [...table.querySelectorAll('thead tr')]
      const headerRow = [...theadRows]
        .reverse()
        .find((r) => r.querySelectorAll('th, td').length === colCount)

      if (!headerRow) continue

      const headers = [...headerRow.querySelectorAll('th, td')]
        .map((th) => th.textContent.trim().toLowerCase())

      console.log('[LCR Import] Headers:', headers, '| colCount:', colCount)

      const hasMission = headers.some((h) => h.includes('miss'))
      const hasNome    = headers.some((h) => h.includes('nome') || h.includes('name'))
      if (!hasMission && !hasNome) continue

      const iNome    = findIdx(headers, HEADER_MAP.nome)
      const iMissao  = findIdx(headers, HEADER_MAP.missionName)
      const iInicio  = findIdx(headers, HEADER_MAP.startDate)
      const iRetorno = findIdx(headers, HEADER_MAP.returnDate)
      const iAla     = findIdx(headers, HEADER_MAP.homeUnitName)

      console.log('[LCR Import] Índices:', { iNome, iMissao, iInicio, iRetorno, iAla })

      const rows = [...table.querySelectorAll('tbody tr')]
      if (!rows.length) continue

      const result = rows
        .map((row) => {
          const cells = [...row.querySelectorAll('td')].map((td) => td.textContent ?? '')
          const cell  = (idx) =>
            idx >= 0 && idx < cells.length ? stripLabel(cells[idx], headers[idx]) : ''
          return {
            name:               cell(iNome),
            missionName:        cell(iMissao),
            startDate:          cell(iInicio),
            expectedReturnDate: cell(iRetorno),
            homeUnitName:       cell(iAla),
          }
        })
        .filter((r) => r.name && r.name.length > 2)

      if (result.length > 0) {
        console.log('[LCR Import] ✅ DOM scrape:', result.length, 'registros')
        return result
      }
    }

    return null
  }

  // ─── Supabase: busca missionários já cadastrados ─────────────────

  async function fetchExisting() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/missionaries?select=id,nome`,
      { headers: SB_HEADERS }
    )
    return res.ok ? res.json() : []
  }

  // ─── Supabase: insere novos missionários ─────────────────────────

  async function insertMissionaries(list) {
    return fetch(`${SUPABASE_URL}/rest/v1/missionaries`, {
      method: 'POST',
      headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify(list),
    })
  }

  // ─── UI: toast de progresso ───────────────────────────────────────

  function toast(msg) {
    document.getElementById('__nm_toast')?.remove()
    const el = document.createElement('div')
    el.id = '__nm_toast'
    el.style.cssText =
      'position:fixed;top:20px;right:20px;background:#1a2744;color:#fff;padding:12px 20px;' +
      'border-radius:10px;z-index:2147483647;font-family:system-ui,sans-serif;font-size:14px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.35);transition:opacity .2s'
    el.textContent = msg
    document.body.appendChild(el)
    return () => el.remove()
  }

  // ─── UI: modal de preview ────────────────────────────────────────

  function showPreviewModal(items, existingNames) {
    return new Promise((resolve) => {
      document.getElementById('__nm_modal')?.remove()

      const newOnes  = items.filter((m) => !existingNames.has(m.nome.toLowerCase()))
      const skipOnes = items.filter((m) =>  existingNames.has(m.nome.toLowerCase()))

      const tbody = items
        .map((m) => {
          const isNew = !existingNames.has(m.nome.toLowerCase())
          const bg    = isNew ? '#f0fdf4' : '#fffbeb'
          const co    = isNew ? '#166534' : '#92400e'
          const badge = isNew ? '✅ Novo' : '⚠️ Já existe'
          return `<tr style="background:${bg};color:${co}">
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${m.nome || '—'}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${m.ala || '—'}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;max-width:180px">${m.nome_missao || '—'}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${m.data_inicio || '—'}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb">${m.data_termino || '—'}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;font-weight:700">${badge}</td>
          </tr>`
        })
        .join('')

      const disabled = newOnes.length === 0
      const btnStyle = disabled
        ? 'padding:9px 22px;background:#9ca3af;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:not-allowed'
        : 'padding:9px 22px;background:#1a2744;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer'

      const overlay = document.createElement('div')
      overlay.id = '__nm_modal'
      overlay.style.cssText =
        'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2147483647;' +
        'display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif'

      overlay.innerHTML = `
        <div style="background:#fff;border-radius:14px;max-width:960px;width:96%;max-height:90vh;
                    overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 60px rgba(0,0,0,.45)">

          <div style="padding:18px 24px;background:#1a2744;color:#fff;border-radius:14px 14px 0 0">
            <div style="font-size:18px;font-weight:700">📋 Importar Missionários do LCR</div>
            <div style="font-size:13px;opacity:.8;margin-top:5px">
              ${items.length} encontrados &nbsp;·&nbsp;
              <span style="color:#86efac">${newOnes.length} novos</span> &nbsp;·&nbsp;
              <span style="color:#fbbf24">${skipOnes.length} já cadastrados (serão ignorados)</span>
            </div>
          </div>

          <div style="overflow-y:auto;flex:1">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f9fafb;position:sticky;top:0;z-index:1">
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Nome</th>
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Ala</th>
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Missão</th>
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Início</th>
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Retorno</th>
                  <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Status</th>
                </tr>
              </thead>
              <tbody>${tbody}</tbody>
            </table>
          </div>

          <div style="padding:14px 24px;border-top:1px solid #e5e7eb;display:flex;gap:10px;
                      justify-content:flex-end;background:#fff;border-radius:0 0 14px 14px">
            <button id="__nm_cancel"
              style="padding:9px 22px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;background:#fff;font-size:14px">
              Cancelar
            </button>
            <button id="__nm_confirm" ${disabled ? 'disabled' : ''} style="${btnStyle}">
              ${disabled ? 'Nenhum novo para importar' : `Importar ${newOnes.length} novo(s)`}
            </button>
          </div>
        </div>
      `

      document.body.appendChild(overlay)
      document.getElementById('__nm_cancel').onclick  = () => { overlay.remove(); resolve(null) }
      document.getElementById('__nm_confirm').onclick = () => { overlay.remove(); resolve(newOnes) }
    })
  }

  // ─── Main ─────────────────────────────────────────────────────────

  const removeToast1 = toast('⏳ Buscando missionários no LCR…')

  let rawList = await tryLcrApi()
  if (!rawList) rawList = tryDomScrape()

  removeToast1()

  if (!rawList || rawList.length === 0) {
    alert(
      '❌ Nenhum dado encontrado.\n\n' +
      'Verifique se:\n' +
      '• Está em: lcr.churchofjesuschrist.org/mlt/orgs/missionary\n' +
      '• A página terminou de carregar (a tabela está visível)\n' +
      '• Você tem permissão de secretário ou bispo\n\n' +
      'Dica: abra o Console (F12) e procure por "[LCR Import]" para diagnóstico.'
    )
    return
  }

  const IGNORAR_MISSAO = ['missão de serviço da igreja', 'missao de servico da igreja']

  const mapped = rawList
    .map(mapRecord)
    .filter((m) => {
      if (m.nome.length <= 2) return false
      const miss = (m.nome_missao ?? '').toLowerCase().trim()
      return !IGNORAR_MISSAO.some((ig) => miss.includes(ig))
    })

  if (mapped.length === 0) {
    alert(
      '❌ Registros encontrados mas não foi possível extrair os nomes.\n' +
      'Abra o Console (F12) e procure por "[LCR Import]" para ver os dados brutos.'
    )
    return
  }

  const removeToast2 = toast('⏳ Verificando registros existentes…')
  const existing = await fetchExisting()
  removeToast2()

  const existingNames = new Set(existing.map((m) => m.nome.toLowerCase()))

  const toInsert = await showPreviewModal(mapped, existingNames)
  if (!toInsert) return // cancelado pelo usuário

  if (toInsert.length === 0) return

  const removeToast3 = toast(`⏳ Inserindo ${toInsert.length} missionário(s)…`)
  const res = await insertMissionaries(toInsert)
  removeToast3()

  if (res.ok || res.status === 201) {
    alert(
      `✅ Importação concluída!\n\n` +
      `${toInsert.length} missionário(s) inserido(s) com sucesso.\n\n` +
      `Próximos passos:\n` +
      `• Atualize a página do sistema para ver os novos registros\n` +
      `• Rode: node scripts/geocode-all.mjs  para preencher o mapa\n` +
      `• Faça upload das fotos individualmente em cada perfil`
    )
  } else {
    const err = await res.text().catch(() => String(res.status))
    alert(`❌ Erro ao inserir (HTTP ${res.status}):\n${err}`)
  }
})()
