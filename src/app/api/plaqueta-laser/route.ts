import { NextRequest } from 'next/server'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

// ── Curva S para contraste (deepens shadows, brightens highlights) ─────────────
function applySCurve(buf: Buffer): Buffer {
  const lut = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    // Curva S quadrática com boost extra de contraste
    const s = t < 0.5
      ? 2 * t * t
      : 1 - 2 * (1 - t) * (1 - t)
    const boosted = (s - 0.5) * 1.7 + 0.5
    lut[i] = Math.round(Math.max(0, Math.min(1, boosted)) * 255)
  }
  const out = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) out[i] = lut[buf[i]]
  return out
}

// ── Jarvis-Judice-Ninke dithering (melhor qualidade para retratos) ────────────
// Kernel (divisor 48):
//           X   7   5
//   3   5   7   5   3
//   1   3   5   3   1
function jjnDither(pixels: Buffer, width: number, height: number): Uint8Array {
  const data = new Float32Array(pixels.length)
  for (let i = 0; i < pixels.length; i++) data[i] = pixels[i]
  const out = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const old = Math.max(0, Math.min(255, Math.round(data[idx])))
      const newVal = old < 128 ? 0 : 255
      out[idx] = newVal
      const err = old - newVal

      const spread = (dx: number, dy: number, f: number) => {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height)
          data[ny * width + nx] += (err * f) / 48
      }

      spread(1, 0, 7); spread(2, 0, 5)
      spread(-2, 1, 3); spread(-1, 1, 5); spread(0, 1, 7); spread(1, 1, 5); spread(2, 1, 3)
      spread(-2, 2, 1); spread(-1, 2, 3); spread(0, 2, 5); spread(1, 2, 3); spread(2, 2, 1)
    }
  }
  return out
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id     = searchParams.get('id')
  const format = searchParams.get('format') ?? 'png' // 'png' | 'svg'

  // 1. Busca a plaqueta gerada
  const { protocol, host } = new URL(request.url)
  const plaquetaUrl = `${protocol}//${host}/api/plaqueta${id ? `?id=${id}` : ''}`

  let pngBuf: Buffer
  try {
    const res = await fetch(plaquetaUrl)
    if (!res.ok) throw new Error(`plaqueta status ${res.status}`)
    pngBuf = Buffer.from(await res.arrayBuffer())
  } catch (e) {
    return new Response(`Erro ao gerar plaqueta: ${e}`, { status: 500 })
  }

  // 2. Upscale 5× (1950×2700) via Lanczos3 — mais pixels = dithering mais fino
  const SCALE = 5
  const W5 = 390 * SCALE
  const H5 = 540 * SCALE

  const upscaled = await sharp(pngBuf)
    .resize({ width: W5, height: H5, kernel: 'lanczos3' })
    .toBuffer()

  // 3. Grayscale + normalização + nitidez agressiva
  const { data: gray, info } = await sharp(upscaled)
    .grayscale()
    .normalise()                           // estica histograma ao máximo
    .sharpen({ sigma: 3, m1: 0.5, m2: 4 }) // realça bordas e detalhes do rosto
    .raw()
    .toBuffer({ resolveWithObject: true })

  // 4. Curva S de contraste (separa sombras de meios-tons de altas luzes)
  const contrasted = applySCurve(gray)

  // 5. Dithering JJN → bitmap P&B puro
  const dithered = jjnDither(contrasted, info.width, info.height)

  const bwPng = await sharp(Buffer.from(dithered), {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer()

  // ── Saída PNG (padrão — raster laser) ──
  if (format !== 'svg') {
    const nome = id ? `plaqueta-laser-${id}.png` : 'plaqueta-laser.png'
    return new Response(new Uint8Array(bwPng), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${nome}"`,
      },
    })
  }

  // ── Saída SVG (vetorial via potrace) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const potrace = require('potrace')
    const svg = await new Promise<string>((resolve, reject) => {
      potrace.trace(bwPng, {
        threshold:    128,
        color:        '#000000',
        background:   '#ffffff',
        turdSize:     1,      // remove manchas mínimas
        optCurve:     true,   // suaviza curvas
        optTolerance: 0.2,
      }, (err: Error | null, svgStr: string) => {
        if (err) reject(err)
        else resolve(svgStr)
      })
    })
    const nome = id ? `plaqueta-laser-${id}.svg` : 'plaqueta-laser.svg'
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${nome}"`,
      },
    })
  } catch (e) {
    return new Response(`Erro no potrace: ${e}`, { status: 500 })
  }
}
