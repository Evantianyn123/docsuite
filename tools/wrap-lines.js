#!/usr/bin/env node
/**
 * 把 client.js / host.js 的超长行在「字符串外的逗号」处折行，输出可读副本。
 * 用途：让超长行不再被 read/显示截断，便于精确人工抄写进 cordis_define。
 * 折行不改变语义：逗号后换行在 JS 参数列表中合法。
 * 用法: node tools/wrap-lines.js <in.js> <out.js>
 */
const fs = require('fs')
const path = require('path')

const [, , inFile, outFile] = process.argv
if (!inFile) { console.error('用法: node tools/wrap-lines.js <in.js> <out.js>'); process.exit(1) }

const src = fs.readFileSync(inFile, 'utf8')
const lines = src.split('\n')
const out = []
// 折行阈值：read 工具的整行显示截断在 2000 字符，留安全余量取 1200。
// 阈值越高折行越少，行数越接近 src（此前 96 导致行数暴涨 30%，徒增读取/抄写开销）。
const MAX = parseInt(process.env.WRAP_MAX || '1200', 10) || 1200

function wrapLine(line) {
  if (line.length <= MAX) return [line]
  // 扫描字符串状态，在字符串外找 ", " 断点；在模板字符串内按 "; " 断点（CSS 换行语义不变）
  const parts = []
  let cur = ''
  let i = 0
  let inSingle = false, inDouble = false, inTick = false, inComment = false
  while (i < line.length) {
    const ch = line[i]; const next = line[i + 1]
    // 注释状态（// 行注释）
    if (inComment) { cur += ch; i++; continue }
    if (!inSingle && !inDouble && !inTick && ch === '/' && next === '/') { inComment = true; cur += ch; i++; continue }
    // 字符串切换
    if (!inSingle && !inDouble && !inTick) {
      if (ch === "'") { inSingle = true; cur += ch; i++; continue }
      if (ch === '"') { inDouble = true; cur += ch; i++; continue }
      if (ch === '`') { inTick = true; cur += ch; i++; continue }
    } else if (inSingle && ch === "'" && line[i - 1] !== '\\') { inSingle = false; cur += ch; i++; continue }
    else if (inDouble && ch === '"' && line[i - 1] !== '\\') { inDouble = false; cur += ch; i++; continue }
    else if (inTick && ch === '`' && line[i - 1] !== '\\') { inTick = false; cur += ch; i++; continue }
    // 模板字符串内：按 "; " 断行（CSS 语句结束处）
    if (inTick && ch === ';' && next === ' ' && cur.length >= MAX) {
      parts.push(cur + ';')
      cur = ''
      i += 2
      continue
    }
    // 不在字符串内：在 ", " 处断行
    if (!inSingle && !inDouble && !inTick && !inComment && ch === ',' && next === ' ' && cur.length >= MAX) {
      parts.push(cur + ',')
      cur = ''
      i += 2 // 跳过 ", "
      continue
    }
    cur += ch
    i++
  }
  parts.push(cur)
  return parts
}

for (const line of lines) {
  const wrapped = wrapLine(line)
  for (const w of wrapped) out.push(w)
}

fs.writeFileSync(outFile || inFile.replace(/\.js$/, '-wrapped.js'), out.join('\n'))
console.log('完成: ' + inFile + ' -> ' + (outFile || inFile.replace(/\.js$/, '-wrapped.js')))
console.log('行数: ' + lines.length + ' -> ' + out.length)
