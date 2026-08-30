const fs = require('fs')
const p = 'src/client.js'
let s = fs.readFileSync(p, 'utf8')
const bad = "（请先选择套用模板')))) : null"
const good = "（请先选择套用模板'))) : null"
const idx = s.indexOf(bad)
console.log('找到位置: ' + idx)
if (idx >= 0) {
  s = s.slice(0, idx) + good + s.slice(idx + bad.length)
  fs.writeFileSync(p, s)
  console.log('已修正')
} else {
  console.log('未找到目标串，检查现状…')
  const lines = s.split('\n')
  console.log(lines[449].slice(-130))
}
