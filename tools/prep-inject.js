// DocSuite 注入准备一键脚本（省时优化）
// 一条命令完成：wrap-lines（折行阈值 1200，行数接近 src）→ build-inject 校验 → build-payload 生成注入载荷。
// 用法: node tools/prep-inject.js
'use strict'
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const ROOT = path.resolve(__dirname, '..')
const steps = [
  ['wrap host', ['node', path.join('tools', 'wrap-lines.js'), path.join('src', 'host.js'), path.join('tools', 'host-wrapped.js')]],
  ['wrap client', ['node', path.join('tools', 'wrap-lines.js'), path.join('src', 'client.js'), path.join('tools', 'client-wrapped.js')]],
  ['build-inject 校验', ['node', path.join('tools', 'build-inject.js')]],
  ['build-payload 载荷', ['node', path.join('tools', 'build-payload.js')]],
]

for (const [label, cmd] of steps) {
  try {
    const out = execFileSync(process.execPath, cmd.slice(1), { cwd: ROOT, encoding: 'utf8' })
    process.stdout.write('---- ' + label + ' ----\n' + out)
    // build-inject 失败会 exit 1，execFileSync 会抛错
  } catch (e) {
    process.stdout.write(String(e.stdout || ''))
    process.stderr.write(String(e.stderr || ''))
    console.error('❌ 步骤失败: ' + label)
    process.exit(1)
  }
}

// 行数统计（与 src 对比，确认折行开销）
for (const name of ['host', 'client']) {
  const srcLines = fs.readFileSync(path.join(ROOT, 'src', name + '.js'), 'utf8').split('\n').length
  const wrapped = fs.readFileSync(path.join(ROOT, 'tools', name + '-wrapped.js'), 'utf8').split('\n').length
  const pct = Math.round((wrapped / srcLines - 1) * 100)
  console.log(`行数 ${name}: src ${srcLines} -> wrapped ${wrapped} (+${pct}%)`)
}
console.log('=== ✅ 全部就绪：可直接读取 tools/host-wrapped.js 与 tools/client-wrapped.js 注入 cordis_define ===')
