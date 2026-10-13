/**
 * Sound effects for toasts and actions, generated live with the Web Audio API
 * (no audio files needed). The AudioContext is created lazily on the first
 * user interaction so autoplay policies never block us.
 */

let ctx = null

function ac() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq, delay, duration, type = 'sine', gain = 0.07) {
  const c = ac()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + delay
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export function playSound(kind) {
  switch (kind) {
    case 'success': // bright two-tone chime
      tone(660, 0, 0.12)
      tone(880, 0.1, 0.18)
      break
    case 'error': // low double buzz
      tone(220, 0, 0.22, 'square', 0.055)
      tone(160, 0.13, 0.28, 'square', 0.055)
      break
    case 'warning': // soft descending pair
      tone(440, 0, 0.14, 'triangle')
      tone(330, 0.15, 0.2, 'triangle')
      break
    case 'info': // single blip
      tone(520, 0, 0.09, 'sine', 0.05)
      break
    case 'pop': // tiny click for menus / kebabs
      tone(300, 0, 0.05, 'sine', 0.04)
      break
    case 'confirm': // attention: rising minor third
      tone(392, 0, 0.1)
      tone(494, 0.09, 0.16)
      break
    default:
      tone(500, 0, 0.08)
  }
}
