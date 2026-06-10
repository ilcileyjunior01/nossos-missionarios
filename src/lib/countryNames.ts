// Mapeamento de código ISO 3166-1 numérico (usado pelo world-atlas) → alpha-2
// Usado em conjunto com Intl.DisplayNames para obter nomes em português
const NUM_TO_A2: Record<number, string> = {
  4:'AF',8:'AL',12:'DZ',20:'AD',24:'AO',28:'AG',32:'AR',36:'AU',40:'AT',
  44:'BS',48:'BH',50:'BD',52:'BB',56:'BE',64:'BT',68:'BO',70:'BA',72:'BW',
  76:'BR',84:'BZ',90:'SB',96:'BN',100:'BG',104:'MM',108:'BI',116:'KH',
  120:'CM',124:'CA',132:'CV',140:'CF',144:'LK',152:'CL',156:'CN',170:'CO',
  174:'KM',178:'CG',180:'CD',188:'CR',191:'HR',192:'CU',196:'CY',203:'CZ',
  204:'BJ',208:'DK',214:'DO',218:'EC',222:'SV',226:'GQ',230:'ET',231:'ET',
  232:'ER',233:'EE',242:'FJ',246:'FI',250:'FR',266:'GA',268:'GE',276:'DE',
  288:'GH',296:'KI',300:'GR',308:'GD',316:'GU',320:'GT',324:'GN',328:'GY',
  332:'HT',336:'VA',340:'HN',344:'HK',348:'HU',356:'IN',360:'ID',364:'IR',
  368:'IQ',372:'IE',376:'IL',380:'IT',388:'JM',392:'JP',400:'JO',404:'KE',
  408:'KP',410:'KR',414:'KW',417:'KG',418:'LA',422:'LB',426:'LS',428:'LV',
  430:'LR',434:'LY',440:'LT',442:'LU',450:'MG',454:'MW',458:'MY',462:'MV',
  466:'ML',470:'MT',478:'MR',484:'MX',496:'MN',498:'MD',504:'MA',508:'MZ',
  516:'NA',520:'NR',524:'NP',528:'NL',540:'NC',554:'NZ',558:'NI',562:'NE',
  566:'NG',578:'NO',583:'FM',584:'MH',586:'PK',591:'PA',598:'PG',600:'PY',
  604:'PE',608:'PH',616:'PL',620:'PT',626:'TL',630:'PR',634:'QA',642:'RO',
  643:'RU',646:'RW',662:'LC',670:'VC',678:'ST',682:'SA',686:'SN',694:'SL',
  703:'SK',704:'VN',706:'SO',710:'ZA',716:'ZW',724:'ES',728:'SS',729:'SD',
  740:'SR',752:'SE',756:'CH',760:'SY',762:'TJ',764:'TH',768:'TG',776:'TO',
  780:'TT',784:'AE',788:'TN',792:'TR',795:'TM',798:'TV',800:'UG',804:'UA',
  818:'EG',826:'GB',834:'TZ',840:'US',858:'UY',860:'UZ',862:'VE',882:'WS',
  887:'YE',894:'ZM',51:'AM',31:'AZ',112:'BY',
}

let displayNames: Intl.DisplayNames | null = null

export function getCountryName(numericId: number | string): string {
  const alpha2 = NUM_TO_A2[Number(numericId)]
  if (!alpha2) return ''
  try {
    if (!displayNames) {
      displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
    }
    return displayNames.of(alpha2) ?? ''
  } catch {
    return alpha2
  }
}
