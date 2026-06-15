export type MissionaryStatus = 'a_caminho' | 'em_campo' | 'retornou' | 'indefinido'

export type PlacaStatus = 'nao_enviado' | 'enviado' | 'impressa'

export interface Missionary {
  id: string
  nome: string
  ala: string
  genero: 'M' | 'F' | null
  foto_url: string | null
  data_inicio: string | null   // ISO date string YYYY-MM-DD
  data_termino: string | null  // ISO date string YYYY-MM-DD
  pais_missao: string | null
  nome_missao: string | null
  cidade_missao: string | null
  latitude: number | null
  longitude: number | null
  status_placa: PlacaStatus
  created_at: string
  updated_at: string
}

export type MissionaryInsert = Omit<Missionary, 'id' | 'created_at' | 'updated_at'>

export type SortOption = 'cronologico' | 'nome' | 'ala' | 'status'
