// 生成经过校验的 cordis_define 注入 payload（JSON 转义，保证字节级一致）
// 用法: node tools/build-payload.js
'use strict'
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '..')
const HOST = fs.readFileSync(path.join(ROOT, 'tools', 'host-wrapped.js'), 'utf8')
const CLIENT = fs.readFileSync(path.join(ROOT, 'tools', 'client-wrapped.js'), 'utf8')

// 1. 语法校验
for (const [name, code] of [['host', HOST], ['client', CLIENT]]) {
  try { new Function(code); console.log('[OK] ' + name + ' 语法通过 (' + code.split('\n').length + ' 行)') }
  catch (e) { console.error('[FAIL] ' + name + ' 语法错误: ' + e.message); process.exit(1) }
}

// 2. 构造 payload 并 JSON.stringify（工具调用参数的转义格式）
const payload = { host: HOST, client: CLIENT }
const json = JSON.stringify(payload)
const outPath = path.join(ROOT, 'tools', 'inject-payload.json')
fs.writeFileSync(outPath, json, 'utf8')

// 3. 回读验证：解析后必须与源文件完全一致
const back = JSON.parse(fs.readFileSync(outPath, 'utf8'))
if (back.host !== HOST || back.client !== CLIENT) {
  console.error('[FAIL] payload 回读不一致！')
  process.exit(1)
}
console.log('[OK] payload 回读与源文件一致')
console.log('[OK] payload 写入: ' + outPath + ' (' + (json.length / 1024).toFixed(1) + ' KB)')
console.log('[OK] READY：可在 cordis_define 中直接使用该 JSON 转义内容')
