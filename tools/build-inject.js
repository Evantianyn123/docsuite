// DocSuite 注入校验脚本（B+ 方案核心）
// 作用：读取 src/host.js + src/client.js，校验两半齐全、语法合法、RPC 两端一致、
//       无 undefined 序列化残留、新创建流程标记齐全。全部通过后输出 READY 报告。
// 用法：node tools/build-inject.js
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const HOST = path.join(ROOT, 'src', 'host.js')
const CLIENT = path.join(ROOT, 'src', 'client.js')

const problems = []
const ok = (msg) => console.log('  [OK]   ' + msg)
const bad = (msg) => { problems.push(msg); console.log('  [FAIL] ' + msg) }

function read(f) { return fs.readFileSync(f, 'utf8') }

function syntaxCheck(name, code) {
  try {
    // 文件是 "注释头 + return { ... }" 的函数体；new Function 可做完整语法校验
    new Function(code)
    ok(name + ' 语法校验通过')
    return true
  } catch (e) {
    bad(name + ' 语法错误: ' + e.message)
    return false
  }
}

function stripHeader(code) {
  // 跳过开头注释行与空白，露出真正的函数体起点
  let s = code
  for (;;) {
    const t = s.trimStart()
    if (t.startsWith('//')) { const nl = t.indexOf('\n'); if (nl < 0) { s = ''; break } s = t.slice(nl + 1); continue }
    if (t.startsWith('/*')) { const end = t.indexOf('*/'); if (end < 0) { s = ''; break } s = t.slice(end + 2); continue }
    break
  }
  return s.trimStart()
}

function checkHalf(name, code, mustHave) {
  if (!code || !code.trim()) { bad(name + ' 为空'); return false }
  const body = stripHeader(code)
  if (!body.startsWith('return {')) { bad(name + ' 不是函数体（应以 "return {" 开头）'); return false }
  const s = syntaxCheck(name, code)
  if (!s) return false
  for (const m of mustHave) {
    if (!code.includes(m)) bad(name + ' 缺少关键内容: ' + m)
  }
  return true
}

console.log('=== DocSuite 注入前校验 ===')
console.log('host.js   : ' + HOST)
console.log('client.js : ' + CLIENT)
console.log('')

const host = read(HOST)
const client = read(CLIENT)

console.log('-- 双半区完整性 --')
const hostOk = checkHalf('host', host, [
  "function genOutlineFromDoc",
  "register('docsuite/proj/gen-outline-doc'",
  "register('docsuite/proj/save-outline'",
  "if (args && args.outline !== undefined)",
])
const clientOk = checkHalf('client', client, [
  'function OutlineEditor(',
  "rpc('docsuite/proj/gen-outline-doc'",
  "rpc('docsuite/proj/save-outline'",
])

console.log('')
console.log('-- RPC 两端一致性 --')
const hostRegs = new Set()
const reReg = /register\('(docsuite\/[^']+)'/g
let m
while ((m = reReg.exec(host)) !== null) hostRegs.add(m[1])
const clientCalls = new Set()
const reCall = /rpc\('(docsuite\/[^']+)'/g
while ((m = reCall.exec(client)) !== null) clientCalls.add(m[1])
ok('host 注册方法数: ' + hostRegs.size)
ok('client 调用方法数: ' + clientCalls.size)
let missing = false
for (const c of clientCalls) {
  if (!hostRegs.has(c)) { missing = true; bad('client 调用但 host 未注册: ' + c) }
}
if (!missing) ok('client 所有调用均有 host 注册')
const unidir = [...hostRegs].filter((x) => !clientCalls.has(x))
if (unidir.length) ok('host 独有方法（client 未调用，正常）: ' + unidir.join(', '))

console.log('')
console.log('-- 纯 JSON 检查（undefined 序列化风险） --')
const undefBad = []
const undefRe = /\|\| *undefined|\?: *undefined|: *undefined[,}\]]/g
let um
while ((um = undefRe.exec(client)) !== null) undefBad.push('L' + (client.slice(0, um.index).split('\n').length) + ': ' + um[0].trim())
if (undefBad.length) {
  for (const u of undefBad) bad('client 存在 undefined 风险: ' + u)
} else {
  ok('client 无 "|| undefined / : undefined" 残留')
}
// stripUndefined 包装存在
if (client.includes('function stripUndefined') && client.includes('function rpc(')) {
  ok('rpc()/stripUndefined 包装存在')
} else {
  bad('缺少 rpc()/stripUndefined 包装')
}

console.log('')
console.log('-- 新创建流程标记 --')
const flowChecks = [
  ['client: 需求/文档输入', 'nDocFile'],
  ['client: 大纲文件输入', 'nOutlineFile'],
  ['client: 大纲草稿状态', 'outlineDraft'],
  ['client: 大纲编辑器接入', 'el(OutlineEditor'],
  ['host: 用户大纲直用', 'fromUser'],
  ['host: 文档→大纲', 'genOutlineFromDoc'],
]
for (const [label, marker] of flowChecks) {
  if (host.includes(marker) || client.includes(marker)) ok(label + ' (' + marker + ')')
  else bad(label + ' 缺少标记: ' + marker)
}

console.log('')
const hSize = Buffer.byteLength(host, 'utf8')
const cSize = Buffer.byteLength(client, 'utf8')
console.log('-- 体积 --')
ok('host.js ' + (hSize / 1024).toFixed(1) + ' KB, ' + host.split('\n').length + ' 行')
ok('client.js ' + (cSize / 1024).toFixed(1) + ' KB, ' + client.split('\n').length + ' 行')

console.log('')
if (problems.length === 0) {
  console.log('=== ✅ READY：全部校验通过，可注入 pkg-18（完整双半区） ===')
  process.exit(0)
} else {
  console.log('=== ❌ 发现 ' + problems.length + ' 个问题，禁止注入 ===')
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
