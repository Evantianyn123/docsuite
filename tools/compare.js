// 对比候选文件与 wrapped 基准文件，输出第一个差异及上下文，返回退出码。
// 用法: node tools/compare.js <base> <candidate>
'use strict'
const fs = require('fs')
const [,, base, cand] = process.argv
if (!base || !cand) { console.error('用法: node tools/compare.js <base> <candidate>'); process.exit(2) }
const a = fs.readFileSync(base, 'utf8').split('\n')
const b = fs.readFileSync(cand, 'utf8').split('\n')
const max = Math.max(a.length, b.length)
let diffs = 0
for (let i = 0; i < max; i++) {
  const la = a[i]; const lb = b[i]
  if (la !== lb) {
    diffs++
    if (diffs <= 20) {
      console.log('--- 第 ' + (i + 1) + ' 行差异 ---')
      console.log('[base]      ' + (la === undefined ? '<EOF>' : la))
      console.log('[candidate] ' + (lb === undefined ? '<EOF>' : lb))
    }
  }
}
console.log('行数: base=' + a.length + ' candidate=' + b.length + ' 差异行数=' + diffs)
process.exit(diffs > 0 ? 1 : 0)
