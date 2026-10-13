import { QRCodeCanvas } from 'qrcode.react'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { saveAs } from 'file-saver'

/**
 * Zero-Waste QR payload: the QR itself carries the student's identification,
 * so a scan NEVER needs a Firestore lookup to know who scanned. Legacy codes
 * (plain Student ID) remain fully supported by parseQrPayload().
 */
export function buildQrPayload(student) {
  return JSON.stringify({
    id: String(student.studentId || ''),
    name: String(student.fullName || ''),
    sec: [student.program, student.yearLevel, student.section].filter(Boolean).join('-'),
  })
}

/** Accepts the new JSON payload OR a legacy plain Student ID / student number. */
export function parseQrPayload(text) {
  const raw = String(text || '').trim()
  if (raw.startsWith('{')) {
    try {
      const o = JSON.parse(raw)
      if (o && o.id)
        return { id: String(o.id).trim().toUpperCase(), name: String(o.name || ''), sec: String(o.sec || '') }
    } catch {
      /* malformed JSON — treat as a plain token below */
    }
  }
  return { id: raw.toUpperCase(), name: '', sec: '' }
}

/**
 * Renders a person's QR code onto an offscreen canvas with their full name
 * (and Student ID) drawn underneath, then returns the PNG data URL.
 * QR payload = the JSON identification block (see buildQrPayload).
 *
 * Works ANYTIME — it only needs the profile record, never a running
 * attendance session. Works for students and admins/operators alike.
 */
export async function buildStudentQrDataUrl(student) {
  if (!student?.studentId) throw new Error('This record has no Student ID to encode.')
  const qrSize = 480
  const labelArea = 118

  // Mount a hidden QRCodeCanvas so we can grab its canvas element.
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;'
  document.body.appendChild(host)
  const root = createRoot(host)

  try {
    // NOTE: qrcode.react v4 no longer supports the `onRendered` callback,
    // so we poll for the painted canvas instead (reliable, no deadlocks).
    const qrCanvas = await new Promise((resolve, reject) => {
      root.render(
        createElement(QRCodeCanvas, {
          value: buildQrPayload(student),
          size: qrSize,
          marginSize: 2,
          level: 'M',
        }),
      )
      let tries = 0
      const tick = () => {
        const canvas = host.querySelector('canvas')
        if (canvas && canvas.width > 0) return resolve(canvas)
        if (++tries > 240) return reject(new Error('QR canvas did not render.'))
        // setTimeout instead of rAF so polling also runs when the tab is hidden.
        setTimeout(tick, 25)
      }
      tick()
    })

    const out = document.createElement('canvas')
    out.width = qrSize
    out.height = qrSize + labelArea
    const ctx = out.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(qrCanvas, 0, 0, qrSize, qrSize)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 34px Inter, Arial, sans-serif'

    // Wrap the name onto up to two lines if it is long.
    const words = String(student.fullName || student.studentId).split(/\s+/).filter(Boolean)
    const lines = []
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > out.width - 48 && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    if (lines.length > 2) {
      lines.length = 2
      lines[1] = `${lines[1].slice(0, -1)}…`
    }

    lines.forEach((l, i) => ctx.fillText(l, out.width / 2, qrSize + 52 + i * 38))
    ctx.fillStyle = '#4f46e5'
    ctx.font = '24px Inter, Arial, sans-serif'
    ctx.fillText(String(student.studentId), out.width / 2, out.height - 22)

    return out.toDataURL('image/png')
  } finally {
    // Cleanup must happen no matter what, so failed builds never leak nodes.
    try {
      root.unmount()
    } catch {
      /* ignore */
    }
    host.remove()
  }
}

export async function downloadStudentQr(student) {
  const url = await buildStudentQrDataUrl(student)
  const safeName = String(student.fullName || student.studentId).replace(/\s+/g, '_')
  saveAs(url, `${student.studentId}_${safeName}_QR.png`)
}
