'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'

const LCR_URL = 'https://lcr.churchofjesuschrist.org/mlt/orgs/missionary?lang=por'

/**
 * Gera o bookmarklet com a origin do app embutida.
 * O bookmarklet NÃO faz requisições externas — apenas extrai dados do DOM
 * do LCR e abre uma aba do nosso sistema com os dados codificados em base64.
 * Isso evita problemas com o CSP (Content-Security-Policy) do LCR.
 */
function buildBookmarklet(appOrigin: string): string {
  const previewUrl = `${appOrigin}/importar/preview`

  // Meses em PT-BR usados pelo LCR
  const code = `
;(function(){
var PM={jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12'};
function nd(d){
  if(!d)return null;
  var s=String(d).trim();
  var m=s.match(/^(\\d{1,2})\\s+([a-zA-Z]{3})\\.?\\s+(\\d{4})$/);
  if(m){var mm=PM[m[2].toLowerCase()];if(mm)return m[3]+'-'+mm+'-'+m[1].padStart(2,'0');}
  if(/^\\d{8}$/.test(s))return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);
  var b=s.match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/);
  if(b)return b[3]+'-'+b[2]+'-'+b[1];
  if(/^\\d{4}-\\d{2}-\\d{2}/.test(s))return s.slice(0,10);
  var ts=Date.parse(s);return isNaN(ts)?null:new Date(ts).toISOString().slice(0,10);
}
var CM={brazil:'Brasil',bolivia:'Bolívia',mexico:'México',peru:'Peru',chile:'Chile',argentina:'Argentina',colombia:'Colômbia',ecuador:'Equador',paraguay:'Paraguai',uruguay:'Uruguai',usa:'EUA','united states':'EUA',portugal:'Portugal',japan:'Japão',korea:'Coreia',australia:'Austrália',canada:'Canadá',nigeria:'Nigéria',ghana:'Gana',philippines:'Filipinas'};
function ec(mn){
  if(!mn)return null;
  var l=mn.toLowerCase();
  for(var k in CM)if(l.indexOf(k)===0)return CM[k];
  return mn.split(/\\s+/)[0]||null;
}
function ct(mn){
  if(!mn)return null;
  var DROP=['mission','missão','missao','north','south','east','west','norte','sul','leste','oeste','central','district'];
  var CTRY=Object.keys(CM);
  var parts=mn.trim().split(/\\s+/);
  var lo=parts.map(function(p){return p.toLowerCase();});
  var i=0;
  if(parts.length>2&&CTRY.indexOf(lo[0]+' '+lo[1])>=0)i=2;
  else if(CTRY.indexOf(lo[0])>=0)i=1;
  var city=[];
  for(var j=i;j<parts.length;j++){if(DROP.indexOf(lo[j])<0)city.push(parts[j].charAt(0).toUpperCase()+parts[j].slice(1).toLowerCase());}
  return city.length?city.join(' '):null;
}
function sm(mn){
  if(!mn)return mn;
  var DIR={north:'Norte',south:'Sul',east:'Leste',west:'Oeste',central:'Central'};
  var DROP=['mission','missão','missao','district'];
  var CTRY=Object.keys(CM);
  var parts=mn.trim().split(/\\s+/);
  var lo=parts.map(function(p){return p.toLowerCase();});
  var i=0;
  if(parts.length>2&&CTRY.indexOf(lo[0]+' '+lo[1])>=0)i=2;
  else if(CTRY.indexOf(lo[0])>=0)i=1;
  var res=[];
  for(var j=i;j<parts.length;j++){var lw=lo[j];if(DROP.indexOf(lw)>=0)continue;res.push(DIR[lw]||parts[j].charAt(0).toUpperCase()+parts[j].slice(1).toLowerCase());}
  return res.length?res.join(' '):mn;
}
function nn(raw){
  if(!raw)return'';
  var s=raw.trim(),parts;
  if(s.indexOf(',')>=0){var ci=s.indexOf(',');parts=s.slice(ci+1).trim().split(/\\s+/).concat(s.slice(0,ci).trim().split(/\\s+/));}
  else parts=s.split(/\\s+/);
  return parts.filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();}).join(' ');
}
var SERVICO=['serviço da','servico da','são paulo oeste','sao paulo oeste'];
function isServ(orig,simp){
  var lo=(orig||'').toLowerCase(),ls=(simp||'').toLowerCase();
  return SERVICO.some(function(p){return lo.indexOf(p)>=0||ls.indexOf(p)>=0;});
}
function sa(a){return(a||'').trim().replace(/^(ala|ramo)\\s+/i,'').trim();}
function mr(r){
  var nm=r.missionName||r.nomeMissao||r.mission||null;
  var simp=sm(nm);
  return{nome:nn(r.name||r.nome||r.fullName||r.preferredName||r.nameOrder||''),ala:sa(r.homeUnitName||r.unitName||r.ala||r.ward||r.nomeUnidade||''),genero:r.gender==='MALE'||r.gender==='M'?'M':r.gender==='FEMALE'||r.gender==='F'?'F':null,data_inicio:nd(r.startDate||r.callingDate||r.dataInicio||r.iniciadoEm||r.beginDate),data_termino:nd(r.expectedReturnDate||r.returnDate||r.endDate||r.fimEsperado||r.dataTermino),nome_missao:simp,pais_missao:ec(nm),cidade_missao:ct(nm),eh_servico:isServ(nm,simp),foto_url:null,latitude:null,longitude:null,status_placa:'nao_enviado'};
}
function tryDom(){
  var HM={nome:['nome','name'],miss:['missão','missao','mission'],ini:['iniciou','início','inicio','start','mtc','chamada'],ret:['fim esperado','retorno','término','termino','return','release'],ala:['unidade atual','unidade','ward','congregação','branch']};
  function fi(hs,terms){return hs.findIndex(function(h){return terms.some(function(t){return h.indexOf(t)>=0;});});}
  function dd(s){var h=Math.floor(s.length/2);if(h>0&&s.slice(0,h)===s.slice(h))return s.slice(0,h);return s;}
  function sl(raw,hdr){var t=(raw||'').trim(),h=(hdr||'').toLowerCase();if(h&&t.toLowerCase().slice(0,h.length)===h)t=t.slice(h.length).trim();return t;}
  var tables=document.querySelectorAll('table');
  for(var i=0;i<tables.length;i++){
    var t=tables[i];
    var sr=t.querySelector('tbody tr');if(!sr)continue;
    var cc=sr.querySelectorAll('td').length;if(!cc)continue;
    var trs=[].slice.call(t.querySelectorAll('thead tr')),hr=null;
    for(var j=trs.length-1;j>=0;j--){if(trs[j].querySelectorAll('th,td').length===cc){hr=trs[j];break;}}
    if(!hr)continue;
    var hs=[].slice.call(hr.querySelectorAll('th,td')).map(function(th){return dd(th.textContent.trim().toLowerCase());});
    console.log('[LCR Import] Headers:',hs,'cols:',cc);
    var hasMiss=hs.some(function(h){return h.indexOf('miss')>=0;});
    var hasNome=hs.some(function(h){return h.indexOf('nome')>=0||h.indexOf('name')>=0;});
    if(!hasMiss&&!hasNome)continue;
    var iN=fi(hs,HM.nome),iM=fi(hs,HM.miss),iI=fi(hs,HM.ini),iR=fi(hs,HM.ret),iA=fi(hs,HM.ala);
    console.log('[LCR Import] Índices:',{iN:iN,iM:iM,iI:iI,iR:iR,iA:iA});
    var rows=[].slice.call(t.querySelectorAll('tbody tr'));
    if(!rows.length)continue;
    var res=rows.map(function(row){
      var c=[].slice.call(row.querySelectorAll('td')).map(function(td){return td.textContent||'';});
      function gc(idx){return idx>=0&&idx<c.length?sl(c[idx],hs[idx]):'';}
      return{name:gc(iN),missionName:gc(iM),startDate:gc(iI),expectedReturnDate:gc(iR),homeUnitName:gc(iA)};
    }).filter(function(r){return r.name&&r.name.length>2;});
    if(res.length>0)return res;
  }
  return null;
}
var el=document.createElement('div');
el.style.cssText='position:fixed;top:20px;right:20px;background:#1a2744;color:#fff;padding:12px 20px;border-radius:10px;z-index:2147483647;font-family:system-ui;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.35)';
el.textContent='⏳ Lendo dados do LCR…';
document.body.appendChild(el);
var raw=tryDom();
document.body.removeChild(el);
if(!raw||!raw.length){alert('❌ Nenhum dado encontrado.\\n\\nVerifique se:\\n• Está em: lcr.churchofjesuschrist.org/mlt/orgs/missionary\\n• A tabela está visível na tela\\n\\nAbra o Console (F12) para diagnóstico.');return;}
var mapped=raw.map(mr).filter(function(m){return m.nome.length>2;});
if(!mapped.length){alert('❌ Não foi possível extrair os nomes dos missionários.');return;}
var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(mapped))));
window.open('${previewUrl}?data='+encoded,'_blank');
})();
  `.trim().replace(/\n\s*/g, '')

  return 'javascript:' + code
}

export default function ImportarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookmarklet, setBookmarklet] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setBookmarklet(buildBookmarklet(window.location.origin))
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1a2744] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8 font-[family-name:var(--font-inter)]">

        <div>
          <h1
            className="text-2xl font-bold text-[#1a2744]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Importar do LCR
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Carregue missionários diretamente do Portal de Líderes e Secretários.
          </p>
        </div>

        {/* Como funciona */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#1a2744]">Como funciona</h2>
          <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside leading-relaxed">
            <li>
              Arraste o botão <strong>&ldquo;📋 Importar LCR&rdquo;</strong> abaixo para a{' '}
              barra de favoritos do navegador (basta uma vez).
            </li>
            <li>
              Abra o LCR na página de missionários:{' '}
              <a
                href={LCR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a2744] underline underline-offset-2 font-medium break-all"
              >
                {LCR_URL}
              </a>
            </li>
            <li>Aguarde a <strong>tabela aparecer</strong> com todos os missionários.</li>
            <li>Clique no favorito <strong>&ldquo;📋 Importar LCR&rdquo;</strong>.</li>
            <li>
              Uma nova aba abrirá aqui no sistema com o preview — revise e confirme.
            </li>
          </ol>
        </section>

        {/* Bookmarklet */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#1a2744]">Instalar o bookmarklet</h2>

          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-gray-500">
              Arraste este botão até a barra de favoritos (<kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+B</kbd> para exibi-la):
            </p>
            {bookmarklet && (
              <div
                dangerouslySetInnerHTML={{
                  __html: `<a
                    href="${bookmarklet.replace(/"/g, '&quot;')}"
                    draggable="true"
                    title="Arraste para a barra de favoritos"
                    style="display:inline-flex;align-items:center;gap:8px;background:#1a2744;color:white;font-size:14px;font-weight:600;padding:12px 20px;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.2);text-decoration:none;cursor:grab;user-select:none;font-family:system-ui,sans-serif"
                  >📋 Importar LCR</a>`,
                }}
              />
            )}
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Ou copie o código, crie um favorito manualmente e cole como URL:
            </p>
            <div className="relative">
              <textarea
                readOnly
                value={bookmarklet}
                rows={4}
                className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-[#1a2744] text-gray-600"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(bookmarklet)
                    .then(() => alert('✅ Copiado! Cole no campo URL de um novo favorito.'))
                    .catch(() => alert('Selecione o texto e use Ctrl+C para copiar.'))
                }
                className="absolute top-2 right-2 text-xs bg-white border border-gray-200 hover:border-[#1a2744] text-gray-600 hover:text-[#1a2744] px-2.5 py-1 rounded-md transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
        </section>

        {/* Observações */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-amber-800">Atenção</h3>
          <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Funciona apenas enquanto você estiver <strong>logado no LCR</strong> como líder ou secretário.</li>
            <li>Missionários <strong>já cadastrados</strong> (mesmo nome) são ignorados automaticamente.</li>
            <li>A aba ativa no LCR (<em>Servindo</em>, <em>Retornaram</em>, etc.) determina quais dados são lidos.</li>
            <li>Após importar, rode <code className="bg-amber-100 px-1 rounded text-xs">node scripts/geocode-all.mjs</code> para preencher o mapa.</li>
          </ul>
        </section>

        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-[#1a2744] underline underline-offset-2 transition-colors"
        >
          ← Voltar para o painel
        </button>

      </main>
    </div>
  )
}
