// 注入前自检：确认 host/client 源文件完整、语法可解析、且差异可追踪
const fs = require('fs')
const { execSync } = require('child_process')

const files = ['src/host.js', 'src/client.js']
let ok = true
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8')
  const lines = s.split('\n').length
  console.log(f + ': ' + s.length + ' 字节 / ' + lines + ' 行')
  if (!s.trim().startsWith('return {')) { console.log('  ✗ 不以 return { 开头'); ok = false }
  if (!s.trim().endsWith('}')) { console.log('  ✗ 不以 } 结尾'); ok = false }
  // 括号粗平衡检查
  let bal = 0
  for (const ch of s) { if (ch === '{') bal++; else if (ch === '}') bal-- }
  console.log('  花括号平衡: ' + bal)
  if (bal !== 0) { ok = false }
}

// 用 node 实际解析（模拟 cordis_define 的语法校验）
for (const f of files) {
  try { execSync('node --check "' + f + '"', { stdio: 'pipe' }); console.log(f + ' 语法: OK') }
  catch (e) { console.log(f + ' 语法: 失败'); ok = false }
}

console.log('\n自检结果: ' + (ok ? '全部通过' : '存在失败项'))
process.exit(ok ? 0 : 1)
