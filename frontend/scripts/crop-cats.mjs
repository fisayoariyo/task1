import path from 'path'
import sharp from 'sharp'

const src =
  'C:/Users/USER/.cursor/projects/c-Users-USER-Documents-Task-1/assets/image-39c43a93-a594-4fdc-bc05-9f4171db2130.png'
const outDir = 'C:/Users/USER/Documents/Task 1/frontend/public/assets/cats'

const meta = await sharp(src).metadata()
const w = meta.width
const h = meta.height
const names = ['biryani', 'pizza', 'burgers', 'north', 'south', 'chinese', 'rolls', 'desserts']

// Tuned to SS: 4 columns, 2 rows of pink squares (labels below excluded)
const gridLeft = w * 0.04
const gridRight = w * 0.96
const gridTop = h * 0.155
const gridBottom = h * 0.72
const cols = 4
const rows = 2
const gapX = w * 0.02
const gapY = h * 0.035
const cellW = (gridRight - gridLeft - gapX * (cols - 1)) / cols
const cellH = (gridBottom - gridTop - gapY * (rows - 1)) / rows
const side = Math.min(cellW, cellH)

for (let i = 0; i < 8; i++) {
  const row = Math.floor(i / 4)
  const col = i % 4
  const cx = gridLeft + col * (cellW + gapX) + cellW / 2
  const cy = gridTop + row * (cellH + gapY) + cellH / 2
  const left = Math.round(cx - side / 2)
  const top = Math.round(cy - side / 2)
  const size = Math.round(side)
  const out = path.join(outDir, `${names[i]}-ss.png`)
  await sharp(src).extract({ left, top, width: size, height: size }).png().toFile(out)
  console.log('wrote', path.basename(out), size)
}
