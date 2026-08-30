const fs = require('fs')

const clientPath = 'src/client.js'
let s = fs.readFileSync(clientPath, 'utf8')
const editorBlock = fs.readFileSync('tools/new-outline-editor.txt', 'utf8').trimEnd()
const studioBlock = fs.readFileSync('tools/new-studiopage.txt', 'utf8').trimEnd()

// 定位：文档工坊页面注释 → ProjectWorkbench 函数开始前
const startMarker = '    // ================= 文档工坊页面（M3） ================='
const endMarker = '    function ProjectWorkbench(props) {'
const startIdx = s.indexOf(startMarker)
const endIdx = s.indexOf(endMarker)
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
  console.error('未找到替换边界 start=' + startIdx + ' end=' + endIdx)
  process.exit(1)
}

const replacement = editorBlock + '\n' + studioBlock + '\n\n'
s = s.slice(0, startIdx) + replacement + s.slice(endIdx)
fs.writeFileSync(clientPath, s)
console.log('已替换：' + startMarker.slice(0, 40) + ' → ProjectWorkbench')
console.log('client.js 新长度: ' + s.length)

// 基本一致性检查
console.log('含 OutlineEditor 定义: ' + (s.indexOf('function OutlineEditor(props)') >= 0))
console.log('含 gen-outline-doc 调用: ' + (s.indexOf('docsuite/proj/gen-outline-doc') >= 0))
console.log('含「创建并生成大纲」: ' + (s.indexOf('创建并生成大纲') >= 0))
console.log('含「请先选择套用模板」: ' + (s.indexOf('请先选择套用模板') >= 0))
