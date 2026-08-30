#!/usr/bin/env node
/**
 * DocSuite 源码导出脚本
 * 用法: node tools/export-source.js <cordis_inspect_self 快照.json> [输出目录]
 * 快照 = 在 DSH 会话中调用 cordis_inspect_self(pluginId, packageId) 的完整 JSON 结果。
 * 作用: 从快照提取 host/client 源码写入 src/，并从 host 源码还原内嵌的 Python 工具脚本写入 scripts/。
 * 这样仓库始终保存插件源码的"可读文件形态"，之后可用 cordis_define 重新注入 DSH。
 */
const fs = require('fs')
const path = require('path')

const [, , snapshotPath, outDir] = process.argv
if (!snapshotPath) {
  console.error('用法: node tools/export-source.js <snapshot.json> [outDir]')
  process.exit(1)
}

const obj = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
const plugin = (obj.plugin && obj.plugin.pluginId) ? obj.plugin : { pluginId: '?', name: '?' }
const pluginId = plugin.pluginId
const packageId = obj.packageId || '?'
const pkgName = obj.name || plugin.name || '?'

const out = path.resolve(outDir || path.join(__dirname, '..'))
const srcDir = path.join(out, 'src')
const scriptsDir = path.join(out, 'scripts')
fs.mkdirSync(srcDir, { recursive: true })
fs.mkdirSync(scriptsDir, { recursive: true })

const stamp = new Date().toISOString()
function header(kind) {
  return [
    '// DocSuite 文档工坊 — DSH 动态 Cordis 插件源码（' + kind + '）',
    '// 插件: ' + pluginId + ' · 包: ' + packageId + ' (' + pkgName + ') · 导出时间: ' + stamp,
    '// 来源: cordis_inspect_self 快照。此为存档/版本管理副本，需经 cordis_define 重新注入 DSH 运行。',
    '',
    ''
  ].join('\n')
}

if (!obj.code || typeof obj.code.host !== 'string') {
  console.error('快照缺少 code.host 字段，不是有效的 cordis_inspect_self(packageId) 结果')
  process.exit(1)
}
const hostCode = obj.code.host
const clientCode = obj.code.client

fs.writeFileSync(path.join(srcDir, 'host.js'), header('host') + hostCode)
if (clientCode) fs.writeFileSync(path.join(srcDir, 'client.js'), header('client') + clientCode)

// ---- 从 host 源码还原内嵌 Python 工具脚本 ----
const chr = (c) => String.fromCharCode(c)
const scriptDefs = {
  PY_SCRIPT: 'ingest_file.py',
  EXPORT_SCRIPT: 'export_docx.py',
  PPT_SCRIPT: 'export_pptx.py',
  OCR_SCRIPT: 'ocr_file.py'
}
const found = []
for (const constName of Object.keys(scriptDefs)) {
  const re = new RegExp('const ' + constName + ' = \\[([\\s\\S]*?)\\s*\\]\\.join\\(', 'g')
  const m = re.exec(hostCode)
  if (!m) { console.log('  [skip] ' + constName + '（未在 host 源码中找到）'); continue }
  try {
    const script = new Function('chr', 'return [' + m[1] + ']')(chr).join('\n')
    if (typeof script === 'string' && script.length > 20) {
      fs.writeFileSync(path.join(scriptsDir, scriptDefs[constName]), script)
      found.push(scriptDefs[constName] + ' (' + script.length + ' 字节)')
    } else {
      console.log('  [skip] ' + constName + '（还原结果为空）')
    }
  } catch (e) {
    console.log('  [fail] ' + constName + ': ' + String(e && e.message || e))
  }
}

console.log('导出完成:')
console.log('  插件    : ' + pluginId)
console.log('  包      : ' + packageId + ' (' + pkgName + ')')
console.log('  src/host.js   : ' + hostCode.length + ' 字节')
console.log('  src/client.js : ' + (clientCode ? clientCode.length : 0) + ' 字节')
console.log('  scripts       : ' + (found.length ? found.join(', ') : '（无）'))
