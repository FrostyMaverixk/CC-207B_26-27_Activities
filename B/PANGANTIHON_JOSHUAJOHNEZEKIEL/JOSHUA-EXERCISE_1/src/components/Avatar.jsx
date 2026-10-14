import { initialsOf, hueOf } from '../utils/format'

export default function Avatar({ name = '', size = 34, ring = false }) {
  const hue = hueOf(name)
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, size * 0.38),
    background: `linear-gradient(135deg, hsl(${hue}, 62%, 52%), hsl(${(hue + 40) % 360}, 58%, 42%))`,
    ...(ring ? { border: '2px solid var(--surface)' } : {}),
  }
  return (
    <span className="avatar" style={style} title={name}>
      {initialsOf(name)}
    </span>
  )
}
