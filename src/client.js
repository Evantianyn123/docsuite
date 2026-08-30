// DocSuite 文档工坊 — DSH 动态 Cordis 插件源码（client）
// 插件: docsu-1 · 包: pkg-12 (DocSuite M5 增强) · 导出时间: 2026-08-30T07:24:27.381Z
// 来源: cordis_inspect_self 快照。此为存档/版本管理副本，需经 cordis_define 重新注入 DSH 运行。

return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    const el = React.createElement

    // RPC 包装：DSH 桥只接受纯 JSON。递归剔除 undefined（含嵌套对象/数组），
    // 避免 host.call 因参数含 undefined 被桥拒绝（dynamicCordisRunner/invoke rejected "args"）。
    function stripUndefined(v) {
      if (v === undefined) return null
      if (v === null) return null
      if (Array.isArray(v)) { const out = []; for (let i = 0; i < v.length; i++) out.push(stripUndefined(v[i])); return out }
      if (typeof v === 'object') { const out = {}; for (const k of Object.keys(v)) { if (v[k] === undefined) continue; out[k] = stripUndefined(v[k]) } return out }
      return v
    }
    function rpc(method, args) {
      const clean = args === undefined ? undefined : stripUndefined(args)
      return host.call(method, clean)
    }

    const disposeCss = styles.insert(`
.ds-root{color-scheme:light dark;font-family:system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;padding:20px 24px 40px;max-width:1080px;margin:0 auto}
.ds-header{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.ds-brand{font-size:20px;font-weight:700;color:#0e7490;color:light-dark(#0e7490,#22d3ee);letter-spacing:.5px}
.ds-sub{font-size:12px;color:#6b7280;color:light-dark(#6b7280,#9ca3af)}
.ds-back{background:none;border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);color:#374151;color:light-dark(#374151,#e5e7eb);border-radius:8px;padding:5px 12px;font-size:13px;cursor:pointer}
.ds-back:hover{background:#f3f4f6;background:light-dark(#f3f4f6,#1f2937)}
.ds-stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.ds-stat{background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#374151);border-radius:12px;padding:10px 18px;min-width:120px}
.ds-stat-value{font-size:20px;font-weight:700;color:#111827;color:light-dark(#111827,#f9fafb)}
.ds-stat-label{font-size:12px;color:#6b7280;color:light-dark(#6b7280,#9ca3af);margin-top:2px}
.ds-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.ds-card{background:#ffffff;background:light-dark(#ffffff,#0f172a);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#334155);border-radius:14px;padding:18px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;text-align:left}
.ds-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.12)}
.ds-card-icon{font-size:26px;margin-bottom:8px}
.ds-card-title{font-size:15px;font-weight:700;color:#111827;color:light-dark(#111827,#f1f5f9);margin-bottom:6px}
.ds-card-desc{font-size:12.5px;line-height:1.55;color:#6b7280;color:light-dark(#6b7280,#94a3b8)}
.ds-panel{background:#ffffff;background:light-dark(#ffffff,#0f172a);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#334155);border-radius:14px;padding:20px;margin-bottom:14px}
.ds-panel-title{font-size:16px;font-weight:700;margin-bottom:12px;color:#111827;color:light-dark(#111827,#f1f5f9)}
.ds-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.ds-label{font-size:13px;color:#374151;color:light-dark(#374151,#d1d5db);min-width:90px}
.ds-input{flex:1;min-width:220px;background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);border-radius:8px;color:#111827;color:light-dark(#111827,#f9fafb);padding:7px 10px;font-size:13px;font-family:inherit}
.ds-select{background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);border-radius:8px;color:#111827;color:light-dark(#111827,#f9fafb);padding:7px 10px;font-size:13px}
.ds-btn{background:#0e7490;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:13px;cursor:pointer}
.ds-btn:disabled{opacity:.55;cursor:default}
.ds-btn-ghost{background:transparent;border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);color:#374151;color:light-dark(#374151,#e5e7eb);border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer}
.ds-btn-danger{background:transparent;border:1px solid #fca5a5;color:#b91c1c;color:light-dark(#b91c1c,#fca5a5);border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer}
.ds-muted{font-size:12px;color:#6b7280;color:light-dark(#6b7280,#9ca3af)}
.ds-err{background:#fef2f2;background:light-dark(#fef2f2,#450a0a);border:1px solid #fecaca;border:1px solid light-dark(#fecaca,#7f1d1d);color:#b91c1c;color:light-dark(#b91c1c,#fca5a5);border-radius:8px;padding:8px 12px;font-size:12.5px;margin-bottom:12px}
.ds-ok{background:#f0fdf4;background:light-dark(#f0fdf4,#052e16);border:1px solid #bbf7d0;border:1px solid light-dark(#bbf7d0,#166534);color:#15803d;color:light-dark(#15803d,#86efac);border-radius:8px;padding:8px 12px;font-size:12.5px;margin-bottom:12px}
.ds-badge{display:inline-block;background:#e0f2fe;background:light-dark(#e0f2fe,#0c4a6e);color:#0369a1;color:light-dark(#0369a1,#7dd3fc);border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:600}
.ds-badge-warn{display:inline-block;background:#fef3c7;background:light-dark(#fef3c7,#78350f);color:#b45309;color:light-dark(#b45309,#fcd34d);border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:600}
.ds-badge-busy{display:inline-block;background:#e0e7ff;background:light-dark(#e0e7ff,#312e81);color:#4338ca;color:light-dark(#4338ca,#a5b4fc);border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:600}
.ds-badge-violet{display:inline-block;background:#ede9fe;background:light-dark(#ede9fe,#4c1d95);color:#6d28d9;color:light-dark(#6d28d9,#c4b5fd);border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:600}
.ds-env-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:8px}
.ds-env-item{background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#374151);border-radius:10px;padding:10px 12px}
.ds-env-name{font-size:12px;color:#6b7280;color:light-dark(#6b7280,#9ca3af);margin-bottom:4px}
.ds-env-val{font-size:13px;color:#111827;color:light-dark(#111827,#f9fafb);word-break:break-all}
.ds-divider{border:none;border-top:1px solid #e5e7eb;border-top:1px solid light-dark(#e5e7eb,#374151);margin:18px 0}
.ds-kb-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.ds-file-btn{background:transparent;border:1px dashed #0e7490;color:#0e7490;color:light-dark(#0e7490,#22d3ee);border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer;max-width:220px}
.ds-file-btn::-webkit-file-upload-button{background:#0e7490;color:#fff;border:none;border-radius:6px;padding:4px 10px;margin-right:8px;cursor:pointer}
.ds-list{display:flex;flex-direction:column;gap:8px}
.ds-item{background:#f9fafb;background:light-dark(#f9fafb,#0b1220);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#1e293b);border-radius:12px;padding:12px 14px;cursor:pointer}
.ds-item:hover{border-color:#0e7490}
.ds-item-row{display:flex;align-items:flex-start;gap:10px}
.ds-item-main{flex:1;min-width:0}
.ds-item-title{font-size:14px;font-weight:700;color:#111827;color:light-dark(#111827,#f1f5f9)}
.ds-item-meta{font-size:12px;color:#6b7280;color:light-dark(#6b7280,#9ca3af);margin-top:3px}
.ds-item-summary{font-size:12.5px;color:#374151;color:light-dark(#374151,#cbd5e1);margin-top:5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ds-tag{display:inline-block;background:#e0f2fe;background:light-dark(#e0f2fe,#0c4a6e);color:#0369a1;color:light-dark(#0369a1,#7dd3fc);border-radius:6px;padding:1px 8px;font-size:11.5px;margin-right:6px;margin-top:4px}
.ds-table{width:100%;border-collapse:collapse;font-size:13px}
.ds-table th,.ds-table td{border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#334155);padding:6px 10px;text-align:left;vertical-align:top}
.ds-table th{background:#f9fafb;background:light-dark(#f9fafb,#111827);color:#374151;color:light-dark(#374151,#d1d5db);font-weight:600}
.ds-textarea{width:100%;min-height:90px;background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);border-radius:8px;color:#111827;color:light-dark(#111827,#f9fafb);padding:7px 10px;font-size:13px;font-family:inherit;box-sizing:border-box}
.ds-pre{white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;color:#374151;color:light-dark(#374151,#cbd5e1);max-height:320px;overflow:auto;background:#f9fafb;background:light-dark(#f9fafb,#111827);border-radius:8px;padding:10px}
.ds-tree-node{background:#f9fafb;background:light-dark(#f9fafb,#111827);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#334155);border-radius:10px;padding:10px;margin-bottom:8px}
.ds-tree-children{margin-left:18px;border-left:2px solid #e5e7eb;border-left:2px solid light-dark(#e5e7eb,#334155);padding-left:12px}
.ds-md{font-size:14px;line-height:1.75;color:#111827;color:light-dark(#111827,#e5e7eb)}
.ds-md h1,.ds-md h2,.ds-md h3,.ds-md h4{color:#0e7490;color:light-dark(#0e7490,#22d3ee);margin:14px 0 8px;line-height:1.4}
.ds-md h1{font-size:22px;border-bottom:1px solid #e5e7eb;border-bottom:1px solid light-dark(#e5e7eb,#334155);padding-bottom:6px}
.ds-md h2{font-size:18px}
.ds-md h3{font-size:15.5px}
.ds-md p{margin:8px 0}
.ds-md table{border-collapse:collapse;width:100%;margin:10px 0;font-size:13px}
.ds-md th,.ds-md td{border:1px solid #d1d5db;border:1px solid light-dark(#d1d5db,#4b5563);padding:5px 9px;text-align:left}
.ds-md th{background:#f3f4f6;background:light-dark(#f3f4f6,#1f2937)}
.ds-md ul,.ds-md ol{margin:8px 0;padding-left:24px}
.ds-md blockquote{border-left:3px solid #0e7490;margin:10px 0;padding:4px 12px;color:#4b5563;color:light-dark(#4b5563,#9ca3af);background:#f9fafb;background:light-dark(#f9fafb,#111827)}
.ds-md code{background:#f3f4f6;background:light-dark(#f3f4f6,#1f2937);border-radius:4px;padding:1px 5px;font-size:12.5px}
.ds-md pre{background:#0b1220;color:#e5e7eb;border-radius:8px;padding:10px 14px;overflow:auto;font-size:12.5px}
.ds-md pre code{background:none;padding:0;color:inherit}
.ds-slide{background:#ffffff;background:light-dark(#ffffff,#0f172a);border:1px solid #e5e7eb;border:1px solid light-dark(#e5e7eb,#334155);border-radius:10px;padding:14px 16px;margin-bottom:10px}
.ds-slide-title{font-size:15px;font-weight:700;color:#0e7490;color:light-dark(#0e7490,#22d3ee);margin-bottom:8px}
.ds-slide-bullets{font-size:13px;line-height:1.7;color:#374151;color:light-dark(#374151,#cbd5e1);margin:0;padding-left:18px}
`)

    const CATEGORIES = ['导航定位', '推进动力', '通信遥测', '能源电池', '水密耐压', '作业工具', '通用设备', '其他']
    const DOC_KINDS = [
      { key: 'tech', label: '技术方案', icon: '📝' }, { key: 'research', label: '调研报告', icon: '🔍' }, { key: 'bid', label: '投标技术文件', icon: '🏆' }, { key: 'test', label: '机器人测试方案', icon: '🧪' },
    ]
    const MACHINE_TYPES = ['ROV', 'AUV', '通用']
    const PPT_THEMES = [{ key: 'ocean', label: '🌊 深海蓝' }, { key: 'tech', label: '💠 科技青' }, { key: 'dark', label: '🌑 商务暗色' }, { key: 'light', label: '☀️ 简洁浅色' }]
    const STATUS_TEXT = { draft: '草稿', outline: '大纲', writing: '撰写中', done: '已完成' }
    const MODULES = [
      { key: 'studio', icon: '📝', title: '文档工坊', desc: '技术方案 / 调研报告 / 投标技术文件 / 机器人测试方案，交互式大纲→逐章生成' },
      { key: 'ppt', icon: '🎞️', title: 'PPT 生成器', desc: '从文档项目一键生成演示文稿，内置多套主题，16:9 导出' },
      { key: 'kb', icon: '📚', title: '知识库', desc: '说明书上传/AI 抽取/网页抓取/OCR、全文检索、资料卡与对比表' },
      { key: 'tpl', icon: '🧬', title: '模板库', desc: '自动学习历史报告风格模型 + 手工模板编辑器' },
    ]

    function kindLabel(k) { const d = DOC_KINDS.find((x) => x.key === k); return d ? d.label : '未分类' }
    function kindIcon(k) { const d = DOC_KINDS.find((x) => x.key === k); return d ? d.icon : '📄' }
    function statusText(s) { return STATUS_TEXT[s] || s || '' }
    function leafList(outline) {
      const out = []; const walk = (list, path) => { for (const n of list || []) { const p = path.concat([n]); if (n.children && n.children.length) walk(n.children, p); else out.push(p) } }; walk(outline, []); return out
    }
    function countSections(sections) { let n = 0; const walk = (list) => { for (const s of list || []) { n++; walk(s.children) } }; walk(sections); return n }

    function inlineMd(text) {
      const out = []; let rest = String(text || '')
      while (rest.length) {
        const bold = rest.match(/^\*\*([^*]+)\*\*/)
        if (bold) { out.push({ t: 'b', s: bold[1] }); rest = rest.slice(bold[0].length); continue }
        const code = rest.match(/^`([^`]+)`/)
        if (code) { out.push({ t: 'c', s: code[1] }); rest = rest.slice(code[0].length); continue }
        const em = rest.match(/^\*([^*]+)\*/)
        if (em) { out.push({ t: 'i', s: em[1] }); rest = rest.slice(em[0].length); continue }
        out.push({ t: null, s: rest.charAt(0) }); rest = rest.slice(1)
      }
      return out.map((x, i) => { const style = x.t === 'b' ? { fontWeight: 700 } : x.t === 'i' ? { fontStyle: 'italic' } : x.t === 'c' ? { background: 'rgba(128,128,128,.18)', borderRadius: 4, padding: '0 4px', fontFamily: 'monospace', fontSize: '0.92em' } : null; return el('span', { key: i, style: style }, x.s) })
    }

    function MarkdownView(props) {
      const text = props.text || ''; const lines = text.split('\n'); const blocks = []; let i = 0
      while (i < lines.length) {
        const line = lines[i]
        if (/^#{1,4}\s/.test(line)) { const m = line.match(/^(#{1,4})\s+(.*)$/); blocks.push(el('h' + m[1].length, { key: 'h' + i }, m[2])); i++ }
        else if (/^```/.test(line)) { const code = []; i++; while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++ }; i++; blocks.push(el('pre', { key: 'p' + i }, el('code', null, code.join('\n')))) }
        else if (/^\|/.test(line) && /\|\s*$/.test(line)) {
          const rows = []; while (i < lines.length && /^\|/.test(lines[i]) && /\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++ }
          const parseRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
          const head = parseRow(rows[0]); const bodyRows = rows.slice(1).filter((r) => !/^\|\s*[-:]+\s*\|/.test(r))
          blocks.push(el('table', { key: 't' + i }, el('thead', null, el('tr', null, head.map((h, hi) => el('th', { key: hi }, inlineMd(h))))), el('tbody', null, bodyRows.map((r, ri) => el('tr', { key: ri }, parseRow(r).map((c, ci) => el('td', { key: ci }, inlineMd(c))))))))
        }
        else if (/^\s*[-*]\s+/.test(line)) { const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }; blocks.push(el('ul', { key: 'u' + i }, items.map((it, ii) => el('li', { key: ii }, inlineMd(it))))) }
        else if (/^\s*\d+\.\s+/.test(line)) { const items = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }; blocks.push(el('ol', { key: 'o' + i }, items.map((it, ii) => el('li', { key: ii }, inlineMd(it))))) }
        else if (/^>\s?/.test(line)) { const quote = []; while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++ }; blocks.push(el('blockquote', { key: 'q' + i }, quote.map((q, qi) => el('p', { key: qi }, inlineMd(q))))) }
        else if (/^\s*---+\s*$/.test(line)) { blocks.push(el('hr', { key: 'r' + i })); i++ }
        else if (/^\s*$/.test(line)) { i++ }
        else {
          const para = [line]; i++
          while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^\|/.test(lines[i]) && !/^```/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^>\s?/.test(lines[i])) { para.push(lines[i]); i++ }
          blocks.push(el('p', { key: 'p' + i }, inlineMd(para.join(' '))))
        }
      }
      return el('div', { className: 'ds-md' }, blocks)
    }

    function StatBox(props) { return el('div', { className: 'ds-stat' }, el('div', { className: 'ds-stat-value' }, String(props.value == null ? '—' : props.value)), el('div', { className: 'ds-stat-label' }, props.label)) }
    function EnvCheck() {
      const [info, setInfo] = React.useState(null); const [err, setErr] = React.useState(null); const [busy, setBusy] = React.useState(false)
      const run = () => { setBusy(true); setErr(null); rpc('docsuite/env/check').then((r) => setInfo(r)).catch((e) => setErr(String((e && e.message) || e))).then(() => setBusy(false)) }
      React.useEffect(() => { run() }, [])
      const items = []
      if (info) {
        items.push({ name: 'Python', val: info.python && info.python.present ? ((info.python.version || info.python.path || '已安装') + (info.pythonDeps ? ' · 依赖已装' : ' · 依赖缺失')) : '未找到' })
        items.push({ name: 'Chrome（PDF 打印）', val: info.chrome || '未找到' }); items.push({ name: 'Edge（PDF 备选）', val: info.edge || '未找到' }); items.push({ name: '数据目录', val: info.dataDir || '—' })
      }
      return el('div', null, el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '环境自检'), el('button', { className: 'ds-btn-ghost', onClick: run, disabled: busy }, busy ? '检测中…' : '重新检测')), err ? el('div', { className: 'ds-err' }, '自检失败：' + err) : null, info ? el('div', { className: 'ds-env-grid' }, items.map((it) => el('div', { key: it.name, className: 'ds-env-item' }, el('div', { className: 'ds-env-name' }, it.name), el('div', { className: 'ds-env-val' }, it.val)))) : null)
    }
    function SettingsContent() {
      const [dataDir, setDataDir] = React.useState(''); const [lang, setLang] = React.useState('zh'); const [msg, setMsg] = React.useState(null); const [err, setErr] = React.useState(null); const [saving, setSaving] = React.useState(false)
      const [migrateDir, setMigrateDir] = React.useState(''); const [migrating, setMigrating] = React.useState(false)
      React.useEffect(() => { rpc('docsuite/config/get').then((c) => { setDataDir((c && c.dataDir) || ''); setLang((c && c.language) || 'zh') }).catch((e) => setErr(String((e && e.message) || e))) }, [])
      const save = () => { setSaving(true); setMsg(null); setErr(null); rpc('docsuite/config/set', { patch: { dataDir: dataDir.trim(), language: lang } }).then(() => setMsg('配置已保存')).catch((e) => setErr('保存失败：' + String((e && e.message) || e))).then(() => setSaving(false)) }
      const runMigrate = () => {
        if (!migrateDir.trim()) { setErr('请输入目标目录'); return }
        if (!window.confirm('将把全部数据（知识库/模板/项目/导出）从 ' + dataDir + ' 迁移到 ' + migrateDir.trim() + '，确认？')) return
        setMigrating(true); setErr(null); setMsg(null)
        rpc('docsuite/migrate', { targetDir: migrateDir.trim() })
          .then((r) => {
            if (r && r.ok) { setMsg('✅ 迁移完成，新数据目录：' + r.dataDir); setDataDir(r.dataDir); rpc('docsuite/config/get').then((c) => setDataDir((c && c.dataDir) || r.dataDir)).catch(() => {}) }
            else { setErr('迁移失败：' + ((r && r.message) || '未知')) }
          })
          .catch((e) => setErr('迁移异常：' + String((e && e.message) || e))).then(() => setMigrating(false))
      }
      return el('div', null,
        el('div', { className: 'ds-panel-title' }, 'DocSuite 设置'),
        el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '数据目录'), el('input', { className: 'ds-input', value: dataDir, onChange: (e) => setDataDir(e.target.value), placeholder: '默认：工作区/.docsuite-data' })),
        el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '界面语言'), el('select', { className: 'ds-select', value: lang, onChange: (e) => setLang(e.target.value) }, el('option', { value: 'zh' }, '中文'), el('option', { value: 'en' }, 'English'))),
        el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: save, disabled: saving }, saving ? '保存中…' : '保存'), msg ? el('span', { className: 'ds-ok', style: { margin: 0 } }, msg) : null),
        err ? el('div', { className: 'ds-err' }, err) : null,
        el('hr', { className: 'ds-divider' }),
        el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '🚚 迁移数据目录'),
        el('div', { className: 'ds-muted', style: { marginBottom: 8 } }, '把知识库、模板、项目、导出等全部数据从当前目录移动到新目录（推荐使用数据盘或用户目录，避免放在工具安装目录）。'),
        el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '目标目录'), el('input', { className: 'ds-input', value: migrateDir, onChange: (e) => setMigrateDir(e.target.value), placeholder: '如：D:\DocSuiteData 或 %USERPROFILE%\.dsh-docsuite' }), el('button', { className: 'ds-btn', onClick: runMigrate, disabled: migrating || !migrateDir.trim() }, migrating ? '迁移中…' : '🚚 开始迁移')),
        el('hr', { className: 'ds-divider' }),
        el(EnvCheck, null),
      )
    }
    function Placeholder(props) { return el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-card-icon' }, props.icon), el('span', { className: 'ds-panel-title', style: { margin: 0 } }, props.title), el('span', { className: 'ds-badge' }, '规划中')), el('p', { className: 'ds-muted', style: { lineHeight: 1.7 } }, props.desc)) }
    function Home(props) {
      const cards = MODULES.concat([{ key: 'settings', icon: '⚙️', title: '设置中心', desc: '数据目录、迁移、模型、主题与环境自检' }])
      return el('div', null, el('div', { className: 'ds-stats' }, el(StatBox, { label: '知识条目', value: props.sum && props.sum.kbItems }), el(StatBox, { label: '文档项目', value: props.sum && props.sum.projects }), el(StatBox, { label: '模板', value: props.sum && props.sum.templates })), el('div', { className: 'ds-cards' }, cards.map((m) => el('div', { key: m.key, className: 'ds-card', onClick: () => props.onOpen(m.key) }, el('div', { className: 'ds-card-icon' }, m.icon), el('div', { className: 'ds-card-title' }, m.title), el('div', { className: 'ds-card-desc' }, m.desc)))))
    }

    // 分类选择：下拉（已用/内置分类直接选）+ 自由输入（选「其他」或不在列表中时输入，保存后下次自动可选）
    function CategoryInput(props) {
      const cats = props.categories || []
      const val = props.value || ''
      const known = cats.indexOf(val) >= 0
      const [mode, setMode] = React.useState(known ? 'select' : 'input')
      React.useEffect(() => { setMode(cats.indexOf(val) >= 0 ? 'select' : 'input') }, [val, cats.length])
      if (mode === 'input') {
        return el('span', { className: 'ds-row', style: { flex: 1, minWidth: 220, marginBottom: 0 } },
          el('input', { className: 'ds-input', list: 'ds-cat-suggest', value: val, onChange: (e) => props.onChange(e.target.value), placeholder: props.placeholder || '输入新分类' }),
          el('button', { className: 'ds-btn-ghost', onClick: () => setMode('select') }, '⬇ 从列表选'))
      }
      return el('span', { className: 'ds-row', style: { flex: 1, minWidth: 220, marginBottom: 0 } },
        el('select', { className: 'ds-select', style: { flex: 1, minWidth: 0 }, value: val, onChange: (e) => { if (e.target.value === '__custom__') { setMode('input'); props.onChange('') } else props.onChange(e.target.value) } },
          cats.map((c) => el('option', { key: c, value: c }, c)),
          el('option', { value: '__custom__' }, '✏️ 其他（自定义输入）…')),
        el('button', { className: 'ds-btn-ghost', onClick: () => setMode('input') }, '✏️'))
    }

    // ================= 知识库页面（M1+M5） =================
    function KBPage() {
      const [py, setPy] = React.useState(null); const [q, setQ] = React.useState(''); const [cat, setCat] = React.useState('')
      const [cats, setCats] = React.useState([])
      const [items, setItems] = React.useState([]); const [total, setTotal] = React.useState(0); const [busy, setBusy] = React.useState(false)
      const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null)
      const [selected, setSelected] = React.useState(null); const [preview, setPreview] = React.useState('')
      const [compareIds, setCompareIds] = React.useState([]); const [compareData, setCompareData] = React.useState(null)
      const [manualOpen, setManualOpen] = React.useState(false); const [enrichingId, setEnrichingId] = React.useState(null)
      const [webOpen, setWebOpen] = React.useState(false); const [webQuery, setWebQuery] = React.useState(''); const [webResults, setWebResults] = React.useState([]); const [webBusy, setWebBusy] = React.useState(false); const [webImporting, setWebImporting] = React.useState(null); const [ocrId, setOcrId] = React.useState(null)
      const refresh = () => {
        const query = q.trim()
        if (query) { const sargs = { q: query, page: 1, pageSize: 100 }; if (cat) sargs.category = cat; rpc('docsuite/kb/search', sargs).then((r) => { setItems((r && r.items) || []); setTotal((r && r.total) || 0); setCats((r && r.categories) || []) }).catch((e) => setErr('检索失败：' + String((e && e.message) || e))) }
        else { rpc('docsuite/kb/list').then((r) => { const list = (r && r.items) || []; setItems(list); setTotal(list.length); setCats((r && r.categories) || []) }).catch((e) => setErr('加载失败：' + String((e && e.message) || e))) }
      }
      const enrichItem = (id) => {
        setEnrichingId(id); setErr(null); setMsg(null)
        rpc('docsuite/kb/enrich', { id: id }).then((r) => {
          if (r && r.ok) {
            if (r.split && r.items && r.items.length) setMsg('🤖 已拆分为 ' + r.modelCount + ' 个型号条目（首个 ' + (r.paramsCount != null ? r.paramsCount + ' 项参数' : '') + '）')
            else setMsg('🤖 AI 抽取完成：' + ((r.paramsCount != null ? r.paramsCount + ' 项参数' : '') + (r.summary ? '，已生成摘要' : '')))
            setSelected((prev) => (prev && prev.id === id) ? r.item : prev); refresh()
          } else setErr('AI 抽取失败：' + ((r && r.message) || '未知错误') + ((r && r.rawPreview) ? '｜模型输出：' + r.rawPreview : ''))
        }).catch((e) => setErr('AI 抽取异常：' + String((e && e.message) || e))).then(() => setEnrichingId(null))
      }
      const reOcr = (id) => {
        setOcrId(id); setErr(null); setMsg(null)
        rpc('docsuite/kb/reocr', { id: id }).then((r) => {
          if (r && r.ok) { setMsg('🔍 OCR 完成：' + r.item.textLen + ' 字符'); setSelected(r.item); refresh() }
          else { setErr('OCR 失败：' + ((r && r.message) || '未知')) }
        }).catch((e) => setErr('OCR 异常：' + String((e && e.message) || e))).then(() => setOcrId(null))
      }
      React.useEffect(() => { rpc('docsuite/env/setup-python').then((r) => setPy(r)).catch((e) => setPy({ ok: false, message: String((e && e.message) || e) })); refresh() }, [])
      const onFile = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        setBusy(true); setErr(null); setMsg(null)
        const reader = new FileReader()
        reader.onload = () => {
          const b64 = String(reader.result).split(',')[1] || ''
          rpc('docsuite/kb/upload', { fileName: file.name, base64: b64, category: cat || '其他' }).then((r) => {
            if (r && r.ok) {
              setMsg('已入库：' + file.name + '（' + r.item.textLen + ' 字符）' + (r.item.ocr ? '，已自动 OCR 识别' : '') + '，正在 AI 抽取参数…')
              refresh(); enrichItem(r.item.id)
            } else setErr('入库失败：' + ((r && r.message) || '未知错误'))
          }).catch((er) => setErr('上传失败：' + String((er && er.message) || er))).then(() => setBusy(false))
        }
        reader.onerror = () => { setBusy(false); setErr('读取文件失败') }
        reader.readAsDataURL(file); e.target.value = ''
      }
      const runWebSearch = () => {
        if (!webQuery.trim()) { setErr('请输入搜索关键词'); return }
        setWebBusy(true); setErr(null); setMsg(null)
        rpc('docsuite/web/search', { query: webQuery.trim() }).then((r) => {
          if (r && r.ok) { setWebResults(r.sources || []) }
          else { setErr('搜索失败：' + ((r && r.message) || '未知')) }
        }).catch((e) => setErr('搜索异常：' + String((e && e.message) || e))).then(() => setWebBusy(false))
      }
      const runWebImport = (s) => {
        setWebImporting(s.url); setErr(null); setMsg(null)
        rpc('docsuite/web/import', { url: s.url, title: s.title || s.url }).then((r) => {
          if (r && r.ok) { setMsg('🌐 已入库：' + r.item.name + '（' + r.item.textLen + ' 字符），正在 AI 抽取…'); refresh(); enrichItem(r.item.id) }
          else { setErr('导入失败：' + ((r && r.message) || '未知')) }
        }).catch((e) => setErr('导入异常：' + String((e && e.message) || e))).then(() => setWebImporting(null))
      }
      const toggleCompare = (id) => setCompareIds((prev) => prev.indexOf(id) >= 0 ? prev.filter((x) => x !== id) : prev.slice(0, 9).concat([id]))
      const runCompare = () => { setBusy(true); rpc('docsuite/kb/compare', { ids: compareIds }).then((r) => setCompareData(r)).catch((e) => setErr('对比失败：' + String((e && e.message) || e))).then(() => setBusy(false)) }
      const openDetail = (item) => { setSelected(item); setPreview(''); rpc('docsuite/kb/preview', { id: item.id }).then((r) => setPreview((r && r.text) || '')).catch(() => setPreview('')) }
      const downloadSource = () => {
        if (!selected) return
        rpc('docsuite/kb/source', { id: selected.id }).then((r) => {
          if (!r || !r.ok) { setErr('下载失败：' + ((r && r.message) || '未知')); return }
          const bin = atob(r.base64); const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          const blob = new Blob([bytes], { type: 'application/octet-stream' }); const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = r.fileName || 'source'; a.click()
          setTimeout(() => URL.revokeObjectURL(url), 5000)
        }).catch((e) => setErr('下载失败：' + String((e && e.message) || e)))
      }
      const removeItem = () => {
        if (!selected) return
        if (!window.confirm('确认删除条目「' + (selected.name || selected.id) + '」？')) return
        rpc('docsuite/kb/delete', { id: selected.id }).then((r) => { if (r && r.ok) { setMsg('已删除'); setSelected(null); setCompareData(null); refresh() } else setErr('删除失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('删除失败：' + String((e && e.message) || e)))
      }
      const [editing, setEditing] = React.useState(false)
      const [edName, setEdName] = React.useState(''); const [edManu, setEdManu] = React.useState(''); const [edModel, setEdModel] = React.useState(''); const [edCat, setEdCat] = React.useState('')
      const [edTags, setEdTags] = React.useState(''); const [edSummary, setEdSummary] = React.useState(''); const [edParams, setEdParams] = React.useState([])
      const startEdit = () => {
        if (!selected) return
        setEdName(selected.name || ''); setEdManu(selected.manufacturer || ''); setEdModel(selected.model || ''); setEdCat(selected.category || '')
        setEdTags((selected.tags || []).join(', ')); setEdSummary(selected.summary || '')
        setEdParams((selected.params || []).map((p) => ({ name: p.name || '', value: p.value || '', unit: p.unit || '', desc: p.desc || '' }))); setEditing(true)
      }
      const saveEdit = () => {
        setBusy(true)
        rpc('docsuite/kb/update', { id: selected.id, patch: { name: edName, manufacturer: edManu, model: edModel, category: edCat, tags: edTags.split(/[,，]/).map((s) => s.trim()).filter(Boolean), summary: edSummary, params: edParams } })
          .then((r) => { if (r && r.ok) { setMsg('已保存'); setSelected(r.item); setEditing(false); refresh() } else setErr('保存失败：' + ((r && r.message) || '未知')) })
          .catch((e) => setErr('保存失败：' + String((e && e.message) || e))).then(() => setBusy(false))
      }
      const [mName, setMName] = React.useState(''); const [mManu, setMManu] = React.useState(''); const [mModel, setMModel] = React.useState(''); const [mCat, setMCat] = React.useState('导航定位')
      const [mTags, setMTags] = React.useState(''); const [mSummary, setMSummary] = React.useState(''); const [mParams, setMParams] = React.useState([{ name: '', value: '', unit: '', desc: '' }])
      const createManual = () => {
        if (!mName.trim()) { setErr('请填写名称'); return }
        setBusy(true)
        rpc('docsuite/kb/create-manual', { name: mName.trim(), manufacturer: mManu.trim(), model: mModel.trim(), category: mCat, tags: mTags.split(/[,，]/).map((s) => s.trim()).filter(Boolean), summary: mSummary, params: mParams.filter((p) => p.name.trim()) })
          .then((r) => { if (r && r.ok) { setMsg('已录入：' + r.item.name); setManualOpen(false); setMName(''); setMManu(''); setMModel(''); setMTags(''); setMSummary(''); setMParams([{ name: '', value: '', unit: '', desc: '' }]); refresh() } else setErr('录入失败：' + ((r && r.message) || '未知')) })
          .catch((e) => setErr('录入失败：' + String((e && e.message) || e))).then(() => setBusy(false))
      }
      const setParam = (arr, setter, idx, key, val) => setter(arr.map((p, i) => i === idx ? Object.assign({}, p, { [key]: val }) : p))
      const toolStatus = py ? (py.ok ? el('span', { className: 'ds-badge' }, 'Python 工具链就绪') : el('span', { className: 'ds-badge-warn' }, '工具链未就绪：' + (py.message || ''))) : el('span', { className: 'ds-muted' }, '检测工具链…')
      let body
      if (compareData) {
        body = el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '多型号对比'), el('button', { className: 'ds-btn-ghost', onClick: () => setCompareData(null) }, '← 返回列表')), el('table', { className: 'ds-table' }, el('thead', null, el('tr', null, el('th', { style: { minWidth: 120 } }, '参数'), (compareData.items || []).map((it) => el('th', { key: it.id }, it.name)))), el('tbody', null, (compareData.rows || []).map((row) => el('tr', { key: row.key }, el('td', { style: { fontWeight: 600 } }, row.label), (row.values || []).map((v, i) => el('td', { key: i }, v || '—')))))))
      } else if (selected) {
        const p = (selected.params || []); const isEnriching = enrichingId === selected.id; const isOcr = ocrId === selected.id
        body = el('div', { className: 'ds-panel' },
          el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '📄 ' + (selected.name || selected.id)), el('span', { className: 'ds-badge' }, selected.category || '未分类'), isEnriching ? el('span', { className: 'ds-badge-busy' }, 'AI 抽取中…') : null, isOcr ? el('span', { className: 'ds-badge-busy' }, 'OCR 中…') : null, el('button', { className: 'ds-btn-ghost', onClick: () => { setSelected(null); setCompareData(null) } }, '← 返回列表')),
          !editing ? el('div', null,
            el('div', { className: 'ds-row' }, el('span', { className: 'ds-muted' }, '厂家：' + (selected.manufacturer || '—') + '　型号：' + (selected.model || '—') + '　来源：' + ((selected.sourceFiles && selected.sourceFiles[0]) || '手动录入') + '　' + (selected.textLen ? selected.textLen + ' 字符' : '') + (selected.type === 'web' ? '　🌐 网页条目' : '') + (selected.ocr ? '　🔍 已 OCR' : '') + (selected.enrichedAt ? '　🤖 已抽取' : ''))),
            (selected.tags || []).map((t) => el('span', { key: t, className: 'ds-tag' }, t)),
            selected.summary ? el('p', { className: 'ds-muted', style: { lineHeight: 1.6 } }, selected.summary) : null,
            p.length ? el('table', { className: 'ds-table', style: { marginTop: 10 } }, el('thead', null, el('tr', null, el('th', { style: { width: '30%' } }, '参数'), el('th', null, '值'), el('th', null, '说明'))), el('tbody', null, p.map((pp, i) => el('tr', { key: i }, el('td', { style: { fontWeight: 600 } }, pp.name), el('td', null, String((pp.value || '') + (pp.unit ? ' ' + pp.unit : '')).trim() || '—'), el('td', null, pp.desc || ''))))) : el('p', { className: 'ds-muted' }, '（暂无参数，可点击「🤖 AI 抽取」自动提取）'),
            preview ? el('div', null, el('div', { className: 'ds-panel-title', style: { marginTop: 14, fontSize: 14 } }, '原文摘录'), el('div', { className: 'ds-pre' }, preview)) : null,
            el('div', { className: 'ds-row', style: { marginTop: 14 } }, el('button', { className: 'ds-btn', onClick: () => enrichItem(selected.id), disabled: isEnriching }, isEnriching ? '抽取中…' : '🤖 AI 抽取参数'), selected.type === 'upload' && selected.sourceFiles && selected.sourceFiles.length && /\.pdf$/i.test(selected.sourceFiles[0]) ? el('button', { className: 'ds-btn-ghost', onClick: () => reOcr(selected.id), disabled: isOcr }, isOcr ? 'OCR 中…' : '🔍 OCR 重新识别') : null, el('button', { className: 'ds-btn-ghost', onClick: startEdit }, '✏️ 编辑'), el('button', { className: 'ds-btn-ghost', onClick: downloadSource }, '⬇️ 下载源文件'), el('button', { className: 'ds-btn-danger', onClick: removeItem }, '🗑 删除')),
          ) : el('div', null,
            el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '名称'), el('input', { className: 'ds-input', value: edName, onChange: (e) => setEdName(e.target.value) })),
            el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '厂家'), el('input', { className: 'ds-input', value: edManu, onChange: (e) => setEdManu(e.target.value) }), el('span', { className: 'ds-label' }, '型号'), el('input', { className: 'ds-input', value: edModel, onChange: (e) => setEdModel(e.target.value) })),
            el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '分类'), el(CategoryInput, { categories: cats, value: edCat, onChange: setEdCat, placeholder: '输入新分类，如：声呐' }), el('span', { className: 'ds-label' }, '标签'), el('input', { className: 'ds-input', value: edTags, onChange: (e) => setEdTags(e.target.value), placeholder: '逗号分隔' })),
            el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '摘要'), el('textarea', { className: 'ds-textarea', value: edSummary, onChange: (e) => setEdSummary(e.target.value) })),
            el('div', { className: 'ds-panel-title', style: { fontSize: 14, marginTop: 10 } }, '参数表'),
            (edParams.length ? el('table', { className: 'ds-table', style: { marginBottom: 8 } }, el('thead', null, el('tr', null, el('th', null, '参数名'), el('th', null, '值'), el('th', null, '单位'), el('th', null, '说明'), el('th', null, ''))), el('tbody', null, edParams.map((pp, i) => el('tr', { key: i }, el('td', null, el('input', { className: 'ds-input', value: pp.name, onChange: (e) => setParam(edParams, setEdParams, i, 'name', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.value, onChange: (e) => setParam(edParams, setEdParams, i, 'value', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.unit, onChange: (e) => setParam(edParams, setEdParams, i, 'unit', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.desc, onChange: (e) => setParam(edParams, setEdParams, i, 'desc', e.target.value) })), el('td', null, el('button', { className: 'ds-btn-danger', onClick: () => setEdParams(edParams.filter((_, j) => j !== i)) }, '✕')))))) : null),
            el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setEdParams(edParams.concat([{ name: '', value: '', unit: '', desc: '' }])) }, '+ 加一行'), el('button', { className: 'ds-btn', onClick: saveEdit, disabled: busy }, busy ? '保存中…' : '保存修改'), el('button', { className: 'ds-btn-ghost', onClick: () => setEditing(false) }, '取消')),
          ),
        )
      } else {
        const webPanel = webOpen ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title' }, '🌐 网页抓取入库'), el('div', { className: 'ds-row' }, el('input', { className: 'ds-input', value: webQuery, onChange: (e) => setWebQuery(e.target.value), placeholder: '搜索关键词，如：ROV 深度计 6000m 参数', onKeyDown: (e) => { if (e.key === 'Enter') runWebSearch() } }), el('button', { className: 'ds-btn', onClick: runWebSearch, disabled: webBusy }, webBusy ? '搜索中…' : '🔎 搜索'), el('span', { className: 'ds-muted' }, '搜索结果可点击「导入」抓取页面文本入库并自动 AI 抽取')), webResults.length ? el('div', { className: 'ds-list', style: { marginTop: 10 } }, webResults.map((s, si) => el('div', { key: si, className: 'ds-item' }, el('div', { className: 'ds-item-row' }, el('div', { className: 'ds-item-main' }, el('div', { className: 'ds-item-title' }, s.title || s.url), el('div', { className: 'ds-item-meta' }, s.url), s.snippet ? el('div', { className: 'ds-item-summary' }, s.snippet) : null), el('button', { className: 'ds-btn', onClick: () => runWebImport(s), disabled: webImporting === s.url }, webImporting === s.url ? '导入中…' : '📥 导入'))))) : el('div', { className: 'ds-muted', style: { padding: 10 } }, '输入关键词搜索后选择来源网页导入。')) : null
        body = el('div', null,
          el('div', { className: 'ds-panel' }, el('div', { className: 'ds-kb-toolbar' }, toolStatus, el('input', { type: 'file', accept: '.pdf,.docx,.txt,.md', className: 'ds-file-btn', onChange: onFile, disabled: busy }), el('button', { className: 'ds-btn-ghost', onClick: () => { setWebOpen(!webOpen); setManualOpen(false) } }, webOpen ? '收起网页抓取' : '🌐 网页抓取'), el('button', { className: 'ds-btn-ghost', onClick: () => { setManualOpen(!manualOpen); setWebOpen(false) } }, manualOpen ? '收起录入' : '+ 手动录入'), el('button', { className: 'ds-btn-ghost', onClick: () => { setPy(null); rpc('docsuite/env/setup-python').then(setPy).catch((e) => setPy({ ok: false, message: String((e && e.message) || e) })) } }, '初始化工具链')), el('div', { className: 'ds-kb-toolbar' }, el('input', { className: 'ds-input', value: q, onChange: (e) => setQ(e.target.value), placeholder: '搜索关键词：型号、量程、精度、DVL、声纳…', onKeyDown: (e) => { if (e.key === 'Enter') refresh() } }), el('select', { className: 'ds-select', value: cat, onChange: (e) => setCat(e.target.value) }, el('option', { value: '' }, '全部分类'), (cats.length ? cats : CATEGORIES).map((c) => el('option', { key: c, value: c }, c))), el('button', { className: 'ds-btn', onClick: refresh }, '搜索'), el('span', { className: 'ds-muted' }, '共 ' + total + ' 条' + (compareIds.length ? ' · 已选 ' + compareIds.length : '')), el('button', { className: 'ds-btn', onClick: runCompare, disabled: compareIds.length < 2 || busy }, '⚖ 对比所选')), err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null),
          webPanel,
          manualOpen ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title' }, '手动录入设备资料'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '名称 *'), el('input', { className: 'ds-input', value: mName, onChange: (e) => setMName(e.target.value), placeholder: '如：深度计 6000m' }), el('span', { className: 'ds-label' }, '厂家'), el('input', { className: 'ds-input', value: mManu, onChange: (e) => setMManu(e.target.value) })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '型号'), el('input', { className: 'ds-input', value: mModel, onChange: (e) => setMModel(e.target.value) }), el('span', { className: 'ds-label' }, '分类'), el(CategoryInput, { categories: cats, value: mCat, onChange: setMCat, placeholder: '输入新分类，如：推进器' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '标签'), el('input', { className: 'ds-input', value: mTags, onChange: (e) => setMTags(e.target.value), placeholder: '逗号分隔，如：ROV, 深度计' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '摘要'), el('textarea', { className: 'ds-textarea', value: mSummary, onChange: (e) => setMSummary(e.target.value) })), el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '参数'), (mParams.length ? el('table', { className: 'ds-table', style: { marginBottom: 8 } }, el('thead', null, el('tr', null, el('th', null, '参数名'), el('th', null, '值'), el('th', null, '单位'), el('th', null, '说明'), el('th', null, ''))), el('tbody', null, mParams.map((pp, i) => el('tr', { key: i }, el('td', null, el('input', { className: 'ds-input', value: pp.name, onChange: (e) => setParam(mParams, setMParams, i, 'name', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.value, onChange: (e) => setParam(mParams, setMParams, i, 'value', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.unit, onChange: (e) => setParam(mParams, setMParams, i, 'unit', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: pp.desc, onChange: (e) => setParam(mParams, setMParams, i, 'desc', e.target.value) })), el('td', null, el('button', { className: 'ds-btn-danger', onClick: () => setMParams(mParams.filter((_, j) => j !== i)) }, '✕')))))) : null), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setMParams(mParams.concat([{ name: '', value: '', unit: '', desc: '' }])) }, '+ 加一行'), el('button', { className: 'ds-btn', onClick: createManual, disabled: busy }, busy ? '提交中…' : '提交录入'), el('button', { className: 'ds-btn-ghost', onClick: () => setManualOpen(false) }, '取消'))) : null,
          el('div', { className: 'ds-list' }, items.map((it) => el('div', { key: it.id, className: 'ds-item' }, el('div', { className: 'ds-item-row' }, el('input', { type: 'checkbox', checked: compareIds.indexOf(it.id) >= 0, onChange: () => toggleCompare(it.id), onClick: (e) => e.stopPropagation() }), el('div', { className: 'ds-item-main', onClick: () => openDetail(it) }, el('div', { className: 'ds-item-row' }, el('div', { className: 'ds-item-title' }, it.name || it.id), el('span', { className: 'ds-badge' }, it.category || '未分类'), it.type === 'web' ? el('span', { className: 'ds-tag', style: { marginTop: 0 } }, '🌐 网页') : null, it.ocr ? el('span', { className: 'ds-tag', style: { marginTop: 0 } }, '🔍 OCR') : null, enrichingId === it.id ? el('span', { className: 'ds-badge-busy' }, 'AI 抽取中…') : null), el('div', { className: 'ds-item-meta' }, (it.manufacturer || '—') + ' · ' + (it.model || '—') + ' · ' + (it.textLen ? it.textLen + ' 字符' : '手动条目') + (it.enrichedAt ? ' · 🤖 已抽取' : '') + (it.matched && it.matched.length ? ' · 命中: ' + it.matched.join(' ').slice(0, 60) : '')), it.summary ? el('div', { className: 'ds-item-summary' }, it.summary) : null, (it.tags || []).map((t) => el('span', { key: t, className: 'ds-tag' }, t)))))), !items.length ? el('div', { className: 'ds-muted', style: { padding: 20, textAlign: 'center' } }, '暂无条目。上传 PDF/Word 说明书、网页抓取或手动录入开始建立知识库。') : null),
        )
      }
      return el('div', null, el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '📚 知识库'), el('span', { className: 'ds-sub' }, '说明书 · 网页 · OCR · 参数检索'))), body)
    }

    // ================= 模板库页面（M2） =================
    function TPLPage() {
      const [templates, setTemplates] = React.useState([]); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null)
      const [learnOpen, setLearnOpen] = React.useState(false); const [createOpen, setCreateOpen] = React.useState(false); const [editing, setEditing] = React.useState(null)
      const [lFile, setLFile] = React.useState(null); const [lKind, setLKind] = React.useState('tech'); const [lName, setLName] = React.useState('')
      const [cName, setCName] = React.useState(''); const [cKind, setCKind] = React.useState('tech')
      const refresh = () => rpc('docsuite/tpl/list').then((r) => setTemplates((r && r.templates) || [])).catch((e) => setErr('加载模板失败：' + String((e && e.message) || e)))
      React.useEffect(() => { refresh() }, [])
      const onLearnFile = (e) => { const f = e.target.files && e.target.files[0]; if (f) { setLFile(f); if (!lName.trim()) setLName(f.name.replace(/\.[^.]+$/, '')) } e.target.value = '' }
      const runLearn = () => {
        if (!lFile) { setErr('请选择历史报告文件'); return }
        setBusy(true); setErr(null); setMsg(null)
        const reader = new FileReader()
        reader.onload = () => {
          const b64 = String(reader.result).split(',')[1] || ''
          rpc('docsuite/tpl/learn', { fileName: lFile.name, base64: b64, docKind: lKind, name: lName.trim() })
            .then((r) => { if (r && r.ok) { setMsg('🧬 学习完成：' + r.template.name + '（' + countSections(r.template.sections) + ' 个章节）'); setLearnOpen(false); setLFile(null); refresh(); setEditing(r.template) } else setErr('学习失败：' + ((r && r.message) || '未知错误') + ((r && r.rawPreview) ? '｜模型输出：' + r.rawPreview : '')) })
            .catch((e) => setErr('学习异常：' + String((e && e.message) || e))).then(() => setBusy(false))
        }
        reader.onerror = () => { setBusy(false); setErr('读取文件失败') }
        reader.readAsDataURL(lFile)
      }
      const createTpl = () => {
        if (!cName.trim()) { setErr('请填写模板名称'); return }
        setBusy(true)
        rpc('docsuite/tpl/create-manual', { name: cName.trim(), docKind: cKind }).then((r) => { if (r && r.ok) { setCreateOpen(false); setCName(''); refresh(); setEditing(r.template) } else setErr('创建失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('创建异常：' + String((e && e.message) || e))).then(() => setBusy(false))
      }
      const removeTpl = (t) => {
        if (!window.confirm('确认删除模板「' + t.name + '」？')) return
        rpc('docsuite/tpl/delete', { id: t.id }).then((r) => { if (r && r.ok) { setMsg('已删除'); setEditing(null); refresh() } else setErr('删除失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('删除异常：' + String((e && e.message) || e)))
      }
      let body
      if (editing) {
        body = el(TemplateEditor, { template: editing, onBack: () => setEditing(null), onSaved: (t) => { setEditing(t); refresh(); setMsg('模板已保存') } })
      } else {
        const toolbar = el('div', { className: 'ds-kb-toolbar' }, el('button', { className: 'ds-btn', onClick: () => { setLearnOpen(!learnOpen); setCreateOpen(false) } }, '🧬 学习历史报告'), el('button', { className: 'ds-btn-ghost', onClick: () => { setCreateOpen(!createOpen); setLearnOpen(false) } }, '+ 新建手工模板'), el('span', { className: 'ds-muted' }, '共 ' + templates.length + ' 个模板'))
        const learnPanel = learnOpen ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title' }, '🧬 学习历史报告（自动归纳章节结构与文风）'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '报告文件 *'), el('input', { type: 'file', accept: '.pdf,.docx,.txt,.md', className: 'ds-file-btn', onChange: onLearnFile })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '文档类型'), el('select', { className: 'ds-select', value: lKind, onChange: (e) => setLKind(e.target.value) }, DOC_KINDS.map((d) => el('option', { key: d.key, value: d.key }, d.label))), el('span', { className: 'ds-label' }, '模板名称'), el('input', { className: 'ds-input', value: lName, onChange: (e) => setLName(e.target.value), placeholder: '默认取文件名' })), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: runLearn, disabled: busy || !lFile }, busy ? '学习中…' : '开始学习'), el('span', { className: 'ds-muted' }, '模型将归纳章节树、语气、表格偏好、典型图表与篇幅习惯'))) : null
        const createPanel = createOpen ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title' }, '+ 新建手工模板'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '模板名称 *'), el('input', { className: 'ds-input', value: cName, onChange: (e) => setCName(e.target.value), placeholder: '如：ROV 测试方案通用模板' }), el('span', { className: 'ds-label' }, '文档类型'), el('select', { className: 'ds-select', value: cKind, onChange: (e) => setCKind(e.target.value) }, DOC_KINDS.map((d) => el('option', { key: d.key, value: d.key }, d.label)))), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: createTpl, disabled: busy }, '创建并编辑'))) : null
        const list = el('div', { className: 'ds-list' }, templates.map((t) => el('div', { key: t.id, className: 'ds-item' }, el('div', { className: 'ds-item-row' }, el('div', { className: 'ds-item-main', onClick: () => setEditing(t) }, el('div', { className: 'ds-item-row' }, el('div', { className: 'ds-item-title' }, t.name || t.id), el('span', { className: t.kind === 'manual' ? 'ds-badge-violet' : 'ds-badge' }, t.kind === 'manual' ? '手工' : 'AI 学习'), el('span', { className: 'ds-badge' }, kindLabel(t.docKind))), el('div', { className: 'ds-item-meta' }, countSections(t.sections) + ' 个章节' + (t.sourceFiles && t.sourceFiles.length ? ' · 来源：' + t.sourceFiles.join(', ') : '') + (t.style && t.style.tone ? ' · 风格：' + t.style.tone : ''))), el('button', { className: 'ds-btn-danger', onClick: () => removeTpl(t) }, '🗑')))), !templates.length ? el('div', { className: 'ds-muted', style: { padding: 20, textAlign: 'center' } }, '暂无模板。上传一份历史报告「学习」出风格模型，或新建手工模板。') : null)
        body = el('div', null, el('div', { className: 'ds-panel' }, toolbar, err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null), learnPanel, createPanel, list)
      }
      return el('div', null, el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '🧬 模板库'), el('span', { className: 'ds-sub' }, '自动学习历史报告 · 手工模板编辑 · 供文档工坊套用'))), body)
    }

    function TemplateEditor(props) {
      const tpl = props.template
      const [name, setName] = React.useState(tpl.name || ''); const [kind, setKind] = React.useState(tpl.docKind || 'tech')
      const [sections, setSections] = React.useState(tpl.sections || [])
      const [style, setStyle] = React.useState(Object.assign({ tone: '', tablePreference: '', typicalCharts: [], lengthPerSection: '', writingStyle: '' }, tpl.style || {}))
      const [saving, setSaving] = React.useState(false)
      let seq = 0
      const newId = () => 'n-' + Date.now().toString(36) + '-' + (seq++)
      const updateNode = (nodes, id, patch) => nodes.map((n) => n.id === id ? Object.assign({}, n, patch) : Object.assign({}, n, { children: updateNode(n.children || [], id, patch) }))
      const removeNode = (nodes, id) => nodes.filter((n) => n.id !== id).map((n) => Object.assign({}, n, { children: removeNode(n.children || [], id) }))
      const addChild = (nodes, parentId, node) => nodes.map((n) => n.id === parentId ? Object.assign({}, n, { children: (n.children || []).concat([node]) }) : Object.assign({}, n, { children: addChild(n.children || [], parentId, node) }))
      const renderNode = (node, depth) => el('div', { key: node.id, className: 'ds-tree-node' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-muted', style: { minWidth: 26 } }, String(depth + 1) + '.'), el('input', { className: 'ds-input', value: node.title || '', onChange: (e) => setSections(updateNode(sections, node.id, { title: e.target.value })), placeholder: '章节标题' })), el('div', { className: 'ds-row' }, el('input', { className: 'ds-input', value: node.desc || '', onChange: (e) => setSections(updateNode(sections, node.id, { desc: e.target.value })), placeholder: '本节内容说明' }), el('button', { className: 'ds-btn-ghost', onClick: () => setSections(addChild(sections, node.id, { id: newId(), title: '', desc: '', children: [] })) }, '+ 子节'), el('button', { className: 'ds-btn-danger', onClick: () => setSections(removeNode(sections, node.id)) }, '✕')), (node.children && node.children.length) ? el('div', { className: 'ds-tree-children' }, node.children.map((c) => renderNode(c, depth + 1))) : null)
      const save = () => {
        setSaving(true)
        rpc('docsuite/tpl/update', { id: tpl.id, patch: { name: name, docKind: kind, sections: sections, style: Object.assign({}, style, { typicalCharts: Array.isArray(style.typicalCharts) ? style.typicalCharts : [] }) } }).then((r) => { if (r && r.ok) props.onSaved(r.template) }).catch(() => {}).then(() => setSaving(false))
      }
      return el('div', null, el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '📄 ' + (tpl.name || '模板编辑')), el('span', { className: tpl.kind === 'manual' ? 'ds-badge-violet' : 'ds-badge' }, tpl.kind === 'manual' ? '手工' : 'AI 学习'), el('button', { className: 'ds-btn-ghost', onClick: props.onBack }, '← 返回列表')), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '模板名称'), el('input', { className: 'ds-input', value: name, onChange: (e) => setName(e.target.value) }), el('span', { className: 'ds-label' }, '文档类型'), el('select', { className: 'ds-select', value: kind, onChange: (e) => setKind(e.target.value) }, DOC_KINDS.map((d) => el('option', { key: d.key, value: d.key }, d.label)))), el('hr', { className: 'ds-divider' }), el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '章节结构'), sections.map((n) => renderNode(n, 0)), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setSections(sections.concat([{ id: newId(), title: '', desc: '', children: [] }])) }, '+ 添加章节')), el('hr', { className: 'ds-divider' }), el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '写作风格'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '整体语气'), el('input', { className: 'ds-input', value: style.tone || '', onChange: (e) => setStyle(Object.assign({}, style, { tone: e.target.value })), placeholder: '如：正式严谨、简洁务实' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '表格偏好'), el('input', { className: 'ds-input', value: style.tablePreference || '', onChange: (e) => setStyle(Object.assign({}, style, { tablePreference: e.target.value })), placeholder: '如：多用参数表' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '典型图表'), el('input', { className: 'ds-input', value: (style.typicalCharts || []).join(', '), onChange: (e) => setStyle(Object.assign({}, style, { typicalCharts: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })), placeholder: '逗号分隔' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '章节篇幅'), el('input', { className: 'ds-input', value: style.lengthPerSection || '', onChange: (e) => setStyle(Object.assign({}, style, { lengthPerSection: e.target.value })), placeholder: '如：每节 500-800 字' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '文风说明'), el('textarea', { className: 'ds-textarea', value: style.writingStyle || '', onChange: (e) => setStyle(Object.assign({}, style, { writingStyle: e.target.value })), placeholder: '其他文风要求' })), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: save, disabled: saving }, saving ? '保存中…' : '💾 保存模板'))))
    }

    // ================= 大纲编辑器（创建流程：生成后可编辑，确认后进入写作） =================
    function OutlineEditor(props) {
      const project = props.project
      const [outline, setOutline] = React.useState(project.outline || [])
      const [saving, setSaving] = React.useState(false)
      const [err, setErr] = React.useState(null)
      let seq = 0
      const newId = () => 'n-' + Date.now().toString(36) + '-' + (seq++)
      const updateNode = (nodes, id, patch) => nodes.map((n) => n.id === id ? Object.assign({}, n, patch) : Object.assign({}, n, { children: updateNode(n.children || [], id, patch) }))
      const removeNode = (nodes, id) => nodes.filter((n) => n.id !== id).map((n) => Object.assign({}, n, { children: removeNode(n.children || [], id) }))
      const addChild = (nodes, parentId) => nodes.map((n) => n.id === parentId ? Object.assign({}, n, { children: (n.children || []).concat([{ id: newId(), title: '', desc: '', children: [] }]) }) : Object.assign({}, n, { children: addChild(n.children || [], parentId) }))
      const renderNode = (node, depth) => el('div', { key: node.id, className: 'ds-tree-node' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-muted', style: { minWidth: 26 } }, String(depth + 1) + '.'), el('input', { className: 'ds-input', value: node.title || '', onChange: (e) => setOutline(updateNode(outline, node.id, { title: e.target.value })), placeholder: '章节标题' }), el('button', { className: 'ds-btn-ghost', style: { padding: '2px 8px', fontSize: 12 }, onClick: () => setOutline(addChild(outline, node.id)) }, '+ 子节'), el('button', { className: 'ds-btn-danger', style: { padding: '2px 8px', fontSize: 12 }, onClick: () => setOutline(removeNode(outline, node.id)) }, '✕')), el('div', { className: 'ds-row' }, el('input', { className: 'ds-input', value: node.desc || '', onChange: (e) => setOutline(updateNode(outline, node.id, { desc: e.target.value })), placeholder: '本节要点' })), (node.children && node.children.length) ? el('div', { className: 'ds-tree-children' }, node.children.map((c) => renderNode(c, depth + 1))) : null)
      const confirm = () => {
        setSaving(true); setErr(null)
        rpc('docsuite/proj/save-outline', { id: project.id, outline: outline })
          .then((r) => { if (r && r.ok) { props.onConfirmed(r.project) } else setErr('保存失败：' + ((r && r.message) || '未知')) })
          .catch((e) => setErr('保存异常：' + String((e && e.message) || e))).then(() => setSaving(false))
      }
      const count = (nodes) => { let n = 0; const walk = (list) => { for (const s of list || []) { n++; walk(s.children) } }; walk(nodes); return n }
      return el('div', null,
        el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '📐 大纲编辑'), el('span', { className: 'ds-muted' }, '「' + (project.title || '') + '」 · ' + count(outline) + ' 个章节'), el('button', { className: 'ds-btn', onClick: confirm, disabled: saving }, saving ? '保存中…' : '✅ 确认大纲，开始写作'), el('button', { className: 'ds-btn-ghost', onClick: props.onCancel }, '← 返回')), err ? el('div', { className: 'ds-err' }, err) : null, el('div', { className: 'ds-muted', style: { marginBottom: 8 } }, '可增删章节、修改标题与要点；确认后进入逐章写作。')),
        el('div', { className: 'ds-panel' }, outline.map((n) => renderNode(n, 0)), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setOutline(outline.concat([{ id: newId(), title: '', desc: '', children: [] }])) }, '+ 添加章节'))))
    }

    // ================= 机器人边界配置（基本参数 + 传感器搭载，AI 初稿人工复核） =================
    function RobotSpecEditor(props) {
      const project = props.project
      const rs = (project.robotSpec && project.robotSpec.params && project.robotSpec.sensors) ? project.robotSpec : { machineType: project.machineType || 'ROV', params: [], sensors: [] }
      const [machineType, setMachineType] = React.useState(rs.machineType || 'ROV')
      const [params, setParams] = React.useState((rs.params || []).map((p) => ({ name: p.name || '', value: p.value || '', unit: p.unit || '', desc: p.desc || '' })))
      const [sensors, setSensors] = React.useState((rs.sensors || []).map((s) => ({ itemId: s.itemId || '', name: s.name || '', model: s.model || '', manufacturer: s.manufacturer || '', category: s.category || '', count: s.count || 1, purpose: s.purpose || '' })))
      const [busy, setBusy] = React.useState(false); const [saving, setSaving] = React.useState(false); const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null)
      const [kbItems, setKbItems] = React.useState([])
      const [cats, setCats] = React.useState([])
      const newParam = () => ({ name: '', value: '', unit: '', desc: '' })
      const newSensor = () => ({ itemId: '', name: '', model: '', manufacturer: '', category: '', count: 1, purpose: '' })
      const setParam = (i, key, val) => setParams(params.map((p, idx) => idx === i ? Object.assign({}, p, { [key]: val }) : p))
      const setSensor = (i, key, val) => setSensors(sensors.map((s, idx) => idx === i ? Object.assign({}, s, { [key]: val }) : s))
      React.useEffect(() => { rpc('docsuite/kb/list').then((r) => { setKbItems((r && r.items) || []); setCats((r && r.categories) || []) }).catch(() => {}) }, [])
      const genDraft = () => {
        setBusy(true); setErr(null); setMsg(null)
        rpc('docsuite/proj/robot-spec-draft', { id: project.id }).then((r) => {
          if (r && r.ok) { setMachineType(r.machineType || machineType); setParams((r.params || []).map((p) => ({ name: p.name || '', value: p.value || '', unit: p.unit || '', desc: p.desc || '' }))); setSensors((r.sensors || []).map((s) => ({ itemId: s.itemId || '', name: s.name || '', model: s.model || '', manufacturer: s.manufacturer || '', category: s.category || '', count: s.count || 1, purpose: s.purpose || '' }))); setMsg('🤖 已生成初稿（基本参数 ' + (r.params || []).length + ' 项，传感器 ' + (r.sensors || []).length + ' 项），请人工复核修改') }
          else setErr('初稿生成失败：' + ((r && r.message) || '未知'))
        }).catch((e) => setErr('初稿生成异常：' + String((e && e.message) || e))).then(() => setBusy(false))
      }
      const addFromKb = (itemId) => {
        const it = kbItems.find((x) => x.id === itemId); if (!it) return
        if (sensors.some((s) => s.itemId === itemId)) { setMsg('该设备已在搭载清单中'); return }
        setSensors(sensors.concat([{ itemId: it.id, name: it.name || '', model: it.model || '', manufacturer: it.manufacturer || '', category: it.category || '', count: 1, purpose: '' }]))
      }
      const confirm = () => {
        setSaving(true); setErr(null)
        rpc('docsuite/proj/save-robot-spec', { id: project.id, robotSpec: { machineType: machineType, params: params, sensors: sensors } })
          .then((r) => { if (r && r.ok) { props.onConfirmed(r.project) } else setErr('保存失败：' + ((r && r.message) || '未知')) })
          .catch((e) => setErr('保存异常：' + String((e && e.message) || e))).then(() => setSaving(false))
      }
      return el('div', null,
        el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '🤖 机器人边界配置'), el('span', { className: 'ds-muted' }, '「' + (project.title || '') + '」'), el('button', { className: 'ds-btn', onClick: genDraft, disabled: busy }, busy ? '生成中…' : '🪄 自动生成初稿'), el('button', { className: 'ds-btn', onClick: confirm, disabled: saving }, saving ? '保存中…' : '✅ 确认边界，开始写作'), el('button', { className: 'ds-btn-ghost', onClick: props.onCancel }, '← 返回大纲')), err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null, el('div', { className: 'ds-muted', style: { marginBottom: 8 } }, '确定机器人基本参数与传感器搭载方案后，后续所有章节将严格基于此边界生成。可先「自动生成初稿」再人工复核修改。')),
        el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '基本参数（' + params.length + ' 项）'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '机型'), el('select', { className: 'ds-select', value: machineType, onChange: (e) => setMachineType(e.target.value) }, MACHINE_TYPES.map((m) => el('option', { key: m, value: m }, m)))), params.length ? el('table', { className: 'ds-table' }, el('thead', null, el('tr', null, el('th', null, '参数名'), el('th', null, '数值'), el('th', { style: { width: 80 } }, '单位'), el('th', null, '说明'), el('th', { style: { width: 50 } }, ''))), el('tbody', null, params.map((p, i) => el('tr', { key: i }, el('td', null, el('input', { className: 'ds-input', value: p.name, onChange: (e) => setParam(i, 'name', e.target.value), placeholder: '如：最大作业深度' })), el('td', null, el('input', { className: 'ds-input', value: p.value, onChange: (e) => setParam(i, 'value', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: p.unit, onChange: (e) => setParam(i, 'unit', e.target.value), placeholder: '如：m' })), el('td', null, el('input', { className: 'ds-input', value: p.desc, onChange: (e) => setParam(i, 'desc', e.target.value) })), el('td', null, el('button', { className: 'ds-btn-danger', onClick: () => setParams(params.filter((_, j) => j !== i)) }, '✕')))))) : el('div', { className: 'ds-muted' }, '暂无参数，点击「🪄 自动生成初稿」或手动添加。'), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setParams(params.concat([newParam()])) }, '+ 添加参数'))),
        el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '传感器搭载（' + sensors.length + ' 项）'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '从知识库添加'), el('select', { className: 'ds-select', value: '', onChange: (e) => { if (e.target.value) { addFromKb(e.target.value); e.target.value = '' } } }, el('option', { value: '' }, '（选择设备…）'), kbItems.map((it) => el('option', { key: it.id, value: it.id }, (it.model ? it.model + ' ' : '') + (it.name || it.id) + '（' + (it.category || '未分类') + '）'))), el('span', { className: 'ds-muted' }, '或点击「自动生成初稿」按作业需求推荐搭载')), sensors.length ? el('table', { className: 'ds-table' }, el('thead', null, el('tr', null, el('th', null, '设备名称'), el('th', null, '型号'), el('th', null, '厂家'), el('th', { style: { width: 90 } }, '分类'), el('th', { style: { width: 60 } }, '数量'), el('th', null, '搭载用途'), el('th', { style: { width: 50 } }, ''))), el('tbody', null, sensors.map((s, i) => el('tr', { key: i }, el('td', null, el('input', { className: 'ds-input', value: s.name, onChange: (e) => setSensor(i, 'name', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: s.model, onChange: (e) => setSensor(i, 'model', e.target.value) })), el('td', null, el('input', { className: 'ds-input', value: s.manufacturer, onChange: (e) => setSensor(i, 'manufacturer', e.target.value) })), el('td', null, el(CategoryInput, { categories: cats, value: s.category, onChange: (v) => setSensor(i, 'category', v), placeholder: '分类' })), el('td', null, el('input', { className: 'ds-input', type: 'number', min: 1, value: s.count, onChange: (e) => setSensor(i, 'count', parseInt(e.target.value, 10) || 1) })), el('td', null, el('input', { className: 'ds-input', value: s.purpose, onChange: (e) => setSensor(i, 'purpose', e.target.value), placeholder: '如：水深测量' })), el('td', null, el('button', { className: 'ds-btn-danger', onClick: () => setSensors(sensors.filter((_, j) => j !== i)) }, '✕')))))) : el('div', { className: 'ds-muted' }, '暂无搭载设备，从知识库添加或自动生成初稿。'), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setSensors(sensors.concat([newSensor()])) }, '+ 手动添加'))),
      )
    }
    // ================= 文档工坊页面（M3） =================
    function StudioPage() {
      const [projects, setProjects] = React.useState([]); const [templates, setTemplates] = React.useState([]); const [busy, setBusy] = React.useState(false)
      const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null); const [createOpen, setCreateOpen] = React.useState(false); const [active, setActive] = React.useState(null)
      const [nKind, setNKind] = React.useState('tech'); const [nTitle, setNTitle] = React.useState(''); const [nTopic, setNTopic] = React.useState(''); const [nLang, setNLang] = React.useState('zh')
      const [nTpl, setNTpl] = React.useState(''); const [nTechTpl, setNTechTpl] = React.useState(''); const [nMachine, setNMachine] = React.useState('ROV')
      const [nDocFile, setNDocFile] = React.useState(null); const [nOutlineFile, setNOutlineFile] = React.useState(null)
      const [outlineDraft, setOutlineDraft] = React.useState(null)
      const [specDraft, setSpecDraft] = React.useState(null)
      const refresh = () => { rpc('docsuite/proj/list').then((r) => setProjects((r && r.projects) || [])).catch((e) => setErr('加载项目失败：' + String((e && e.message) || e))) }
      React.useEffect(() => { refresh(); rpc('docsuite/tpl/list').then((r) => setTemplates((r && r.templates) || [])).catch(() => {}) }, [])
      const parseOutlineText = (text, name) => {
        if (/\.json$/i.test(name)) {
          const parsed = JSON.parse(text)
          const arr = Array.isArray(parsed) ? parsed : (parsed && parsed.outline)
          return Array.isArray(arr) ? arr : null
        }
        const lines = String(text).split('\n'); const roots = []; const stack = []; let seq = 0
        for (const raw of lines) {
          const m = raw.match(/^(#{1,4})\s+(.*)$/)
          if (!m) continue
          const level = m[1].length; const title = m[2].trim()
          const node = { id: 'o-' + Date.now().toString(36) + '-' + (seq++), title: title, desc: '', children: [] }
          while (stack.length >= level) stack.pop()
          if (stack.length) stack[stack.length - 1].children.push(node)
          else roots.push(node)
          stack.push(node)
        }
        return roots.length ? roots : null
      }
      const createProj = () => {
        if (!nTitle.trim()) { setErr('请填写项目标题'); return }
        if (!nTpl) { setErr('请先选择套用模板'); return }
        if (!nTopic.trim() && !nDocFile && !nOutlineFile) { setErr('请填写主题描述，或上传需求/参考文档、大纲文件'); return }
        setBusy(true); setErr(null); setMsg(null)
        const args = { kind: nKind, title: nTitle.trim(), topic: nTopic.trim(), lang: nLang, templateRef: nTpl }
        if (nKind === 'bid' && nTechTpl) args.techTemplateRef = nTechTpl
        if (nKind === 'test' && nMachine) args.machineType = nMachine
        const runOutline = (proj) => {
          const after = (r) => {
            if (!r || !r.ok) { setErr('大纲生成失败：' + ((r && r.message) || '未知')); setBusy(false); return }
            setOutlineDraft(r.project); setBusy(false)
          }
          if (nOutlineFile) {
            const reader = new FileReader()
            reader.onload = () => {
              let parsed = null
              try { parsed = parseOutlineText(String(reader.result), nOutlineFile.name) } catch (e) { parsed = null }
              if (!parsed || !parsed.length) { setErr('大纲文件解析失败，请使用 Markdown（# 标题）或 JSON 格式'); setBusy(false); return }
              rpc('docsuite/proj/gen-outline', { id: proj.id, outline: parsed }).then(after).catch((e) => { setErr('大纲应用异常：' + String((e && e.message) || e)); setBusy(false) })
            }
            reader.onerror = () => { setErr('读取大纲文件失败'); setBusy(false) }
            reader.readAsText(nOutlineFile)
            return
          }
          if (nDocFile) {
            const reader = new FileReader()
            reader.onload = () => {
              const b64 = String(reader.result).split(',')[1] || ''
              rpc('docsuite/proj/gen-outline-doc', { id: proj.id, fileName: nDocFile.name, base64: b64 }).then(after).catch((e) => { setErr('文档解析异常：' + String((e && e.message) || e)); setBusy(false) })
            }
            reader.onerror = () => { setErr('读取文档失败'); setBusy(false) }
            reader.readAsDataURL(nDocFile)
            return
          }
          rpc('docsuite/proj/gen-outline', { id: proj.id }).then(after).catch((e) => { setErr('大纲生成异常：' + String((e && e.message) || e)); setBusy(false) })
        }
        rpc('docsuite/proj/create', args)
          .then((r) => { if (r && r.ok) { setMsg('项目已创建，正在生成大纲…'); setCreateOpen(false); refresh(); runOutline(r.project) } else { setErr('创建失败：' + ((r && r.message) || '未知')); setBusy(false) } })
          .catch((e) => { setErr('创建异常：' + String((e && e.message) || e)); setBusy(false) })
      }
      const removeProj = (p) => {
        if (!window.confirm('确认删除项目「' + p.title + '」？')) return
        rpc('docsuite/proj/delete', { id: p.id }).then((r) => { if (r && r.ok) { setMsg('已删除'); setActive(null); refresh() } else setErr('删除失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('删除异常：' + String((e && e.message) || e)))
      }
      let body
      if (specDraft) {
        body = el(RobotSpecEditor, { project: specDraft, onConfirmed: (p) => { setSpecDraft(null); setActive(p); refresh() }, onCancel: () => { setSpecDraft(null); setActive(outlineDraft); refresh() } })
      } else if (outlineDraft) {
        body = el(OutlineEditor, { project: outlineDraft, onConfirmed: (p) => { setOutlineDraft(null); if (p.kind === 'tech' || p.kind === 'bid' || p.kind === 'test') setSpecDraft(p); else { setActive(p); refresh() } }, onCancel: () => { setOutlineDraft(null); refresh() } })
      } else if (active) {
        body = el(ProjectWorkbench, { project: active, onBack: () => { setActive(null); refresh() }, onChanged: (p) => setActive(p) })
      } else {
        const filteredTpl = templates.filter((t) => t.docKind === nKind); const techTpls = templates.filter((t) => t.docKind === 'tech')
        const toolbar = el('div', { className: 'ds-kb-toolbar' }, el('button', { className: 'ds-btn', onClick: () => setCreateOpen(!createOpen) }, createOpen ? '收起表单' : '📝 新建文档项目'), el('span', { className: 'ds-muted' }, '共 ' + projects.length + ' 个项目'))
        const createPanel = createOpen ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title' }, '📝 新建文档项目'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '文档类型'), el('select', { className: 'ds-select', value: nKind, onChange: (e) => setNKind(e.target.value) }, DOC_KINDS.map((d) => el('option', { key: d.key, value: d.key }, d.icon + ' ' + d.label)))), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '项目标题 *'), el('input', { className: 'ds-input', value: nTitle, onChange: (e) => setNTitle(e.target.value), placeholder: '如：6000m 级 ROV 总体技术方案' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '主题描述'), el('textarea', { className: 'ds-textarea', value: nTopic, onChange: (e) => setNTopic(e.target.value), placeholder: '提出你的需求：项目背景、目标、关键技术点、约束条件等，越具体生成质量越高' })), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '需求文档'), el('input', { type: 'file', accept: '.pdf,.docx,.txt,.md', className: 'ds-file-btn', onChange: (e) => { const f = e.target.files && e.target.files[0]; setNDocFile(f || null); e.target.value = '' } }), el('span', { className: 'ds-muted' }, nDocFile ? '已选：' + nDocFile.name : '可选：上传需求/参考文档，LLM 将读取后生成大纲')), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '大纲文件'), el('input', { type: 'file', accept: '.md,.json,.txt', className: 'ds-file-btn', onChange: (e) => { const f = e.target.files && e.target.files[0]; setNOutlineFile(f || null); e.target.value = '' } }), el('span', { className: 'ds-muted' }, nOutlineFile ? '已选：' + nOutlineFile.name : '可选：直接用你已有的 Markdown/JSON 大纲')), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '语言'), el('select', { className: 'ds-select', value: nLang, onChange: (e) => setNLang(e.target.value) }, el('option', { value: 'zh' }, '中文'), el('option', { value: 'en' }, 'English')), nKind === 'test' ? el('span', { className: 'ds-label' }, '机型') : null, nKind === 'test' ? el('select', { className: 'ds-select', value: nMachine, onChange: (e) => setNMachine(e.target.value) }, MACHINE_TYPES.map((m) => el('option', { key: m, value: m }, m))) : null), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '套用模板'), el('select', { className: 'ds-select', value: nTpl, onChange: (e) => setNTpl(e.target.value) }, el('option', { value: '' }, '（请选择模板…）'), filteredTpl.map((t) => el('option', { key: t.id, value: t.id }, (t.kind === 'manual' ? '[手工] ' : '[学习] ') + t.name)))), nKind === 'bid' ? el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '技术方案参考模板'), el('select', { className: 'ds-select', value: nTechTpl, onChange: (e) => setNTechTpl(e.target.value) }, el('option', { value: '' }, '（不指定，AI 按招标要求生成）'), techTpls.map((t) => el('option', { key: t.id, value: t.id }, (t.kind === 'manual' ? '[手工] ' : '[学习] ') + t.name))), el('span', { className: 'ds-muted' }, '标书「技术方案」部分按此模板生成')) : null, el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: createProj, disabled: busy }, busy ? '创建中…' : '🚀 创建并生成大纲'), el('span', { className: 'ds-muted' }, '生成大纲后可编辑，确认后再进入写作'))) : null
        const list = el('div', { className: 'ds-list' }, projects.map((p) => el('div', { key: p.id, className: 'ds-item' }, el('div', { className: 'ds-item-row' }, el('div', { className: 'ds-item-main', onClick: () => setActive(p) }, el('div', { className: 'ds-item-row' }, el('span', { className: 'ds-card-icon', style: { fontSize: 18 } }, kindIcon(p.kind)), el('div', { className: 'ds-item-title' }, p.title || p.id), el('span', { className: 'ds-badge' }, kindLabel(p.kind)), p.status ? el('span', { className: 'ds-badge-violet' }, statusText(p.status)) : null), el('div', { className: 'ds-item-meta' }, (p.topic || '').slice(0, 80) + ' · ' + leafList(p.outline).length + ' 个章节' + (p.machineType ? ' · ' + p.machineType : ''))), el('button', { className: 'ds-btn-danger', onClick: () => removeProj(p) }, '🗑')))), !projects.length ? el('div', { className: 'ds-muted', style: { padding: 20, textAlign: 'center' } }, '暂无项目。点击「📝 新建文档项目」开始。') : null)
        body = el('div', null, el('div', { className: 'ds-panel' }, toolbar, err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null), createPanel, list)
      }
      return el('div', null, el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '📝 文档工坊'), el('span', { className: 'ds-sub' }, '技术方案 / 调研报告 / 投标技术文件 / 机器人测试方案'))), body)
    }

    function ProjectWorkbench(props) {
      const [p, setP] = React.useState(props.project); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null)
      const [genNodeId, setGenNodeId] = React.useState(null); const [viewNode, setViewNode] = React.useState(null); const [editNode, setEditNode] = React.useState(null); const [editText, setEditText] = React.useState('')
      const [bidFile, setBidFile] = React.useState(null); const [bidGenIdx, setBidGenIdx] = React.useState(null); const [exporting, setExporting] = React.useState(null)
      const [contractDate, setContractDate] = React.useState(new Date().toISOString().slice(0, 10)); const [deliveryDays, setDeliveryDays] = React.useState(''); const [scheduleBusy, setScheduleBusy] = React.useState(false)
      const [editOutline, setEditOutline] = React.useState(false)
      const [specEdit, setSpecEdit] = React.useState(false)
      const update = (next) => { setP(next); props.onChanged(next) }
      const leaves = leafList(p.outline || []); const matrix = p.bidMatrix || []; const terms = p.bidTerms || {}; const schedule = p.bidSchedule || []; const bidStruct = p.bidStructure || {}
      React.useEffect(() => { if (terms && terms.deliveryDays && !deliveryDays) setDeliveryDays(String(terms.deliveryDays)) }, [])
      const genOutline = () => { setBusy(true); setErr(null); setMsg(null); rpc('docsuite/proj/gen-outline', { id: p.id }).then((r) => { if (r && r.ok) { update(r.project); setMsg('大纲已生成：' + leafList(r.project.outline).length + ' 个章节') } else setErr('大纲生成失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('大纲异常：' + String((e && e.message) || e))).then(() => setBusy(false)) }
      const genSection = (nodeId) => { setGenNodeId(nodeId); setErr(null); setMsg(null); rpc('docsuite/proj/gen-section', { id: p.id, nodeId: nodeId }).then((r) => { if (r && r.ok) { update(r.project); setMsg('章节已生成' + (r.refs ? '，引用 ' + r.refs + ' 条知识' : '')) } else setErr('章节生成失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('章节异常：' + String((e && e.message) || e))).then(() => setGenNodeId(null)) }
      const genAll = () => {
        const ids = leaves.map((l) => l[l.length - 1].id).filter((id) => !(p.sections && p.sections[id]))
        if (!ids.length) { setMsg('所有章节均已生成'); return }
        setBusy(true); setErr(null); setMsg(null)
        let idx = 0
        const next = () => { if (idx >= ids.length) { setBusy(false); setMsg('全部章节生成完成'); return } const id = ids[idx]; idx++; rpc('docsuite/proj/gen-section', { id: p.id, nodeId: id }).then((r) => { if (r && r.ok) { update(r.project); setMsg('正在生成 ' + idx + '/' + ids.length + '…') } else setErr('章节生成失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('章节异常：' + String((e && e.message) || e))).then(() => next()) }
        next()
      }
      const saveSection = () => { if (!editNode) return; setBusy(true); rpc('docsuite/proj/save-section', { id: p.id, nodeId: editNode, content: editText }).then((r) => { if (r && r.ok) { update(r.project); setEditNode(null); setMsg('章节已保存') } else setErr('保存失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('保存异常：' + String((e && e.message) || e))).then(() => setBusy(false)) }
      const saveOutline = () => { setBusy(true); rpc('docsuite/proj/save-outline', { id: p.id, outline: p.outline }).then((r) => { if (r && r.ok) { update(r.project); setMsg('大纲已保存') } else setErr('保存失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('保存异常：' + String((e && e.message) || e))).then(() => setBusy(false)) }
      const doExport = (format) => {
        setExporting(format); setErr(null)
        rpc('docsuite/proj/export', { id: p.id, format: format }).then((r) => {
          if (!r || !r.ok) { setErr('导出失败：' + ((r && r.message) || '未知')); return }
          if (format === 'md') {
            const blob = new Blob([r.content], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = (r.fileName || 'export') + '.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000)
          } else {
            const bin = atob(r.base64); const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const blob = new Blob([bytes], { type: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : format === 'pdf' ? 'application/pdf' : 'text/html;charset=utf-8' })
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = r.fileName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000)
          }
          setMsg('已导出：' + (r.fileName || ''))
        }).catch((e) => setErr('导出异常：' + String((e && e.message) || e))).then(() => setExporting(null))
      }
      const onBidFile = (e) => { const f = e.target.files && e.target.files[0]; if (f) setBidFile(f); e.target.value = '' }
      const runBidParse = () => {
        if (!bidFile) { setErr('请选择招标文件'); return }
        setBusy(true); setErr(null); setMsg(null)
        const reader = new FileReader()
        reader.onload = () => {
          const b64 = String(reader.result).split(',')[1] || ''
          rpc('docsuite/proj/bid-parse', { id: p.id, fileName: bidFile.name, base64: b64 })
            .then((r) => { if (r && r.ok) { update(r.project); setMsg('已提取 ' + r.count + ' 条要求' + (r.terms && r.terms.deliveryText ? '，交货期：' + r.terms.deliveryText : '')); if (r.project.bidTerms && r.project.bidTerms.deliveryDays) setDeliveryDays(String(r.project.bidTerms.deliveryDays)); setBidFile(null) } else setErr('解析失败：' + ((r && r.message) || '未知')) })
            .catch((e) => setErr('解析异常：' + String((e && e.message) || e))).then(() => setBusy(false))
        }
        reader.onerror = () => { setBusy(false); setErr('读取文件失败') }
        reader.readAsDataURL(bidFile)
      }
      const genBidAnswer = (idx) => { setBidGenIdx(idx); setErr(null); rpc('docsuite/proj/bid-answer', { id: p.id, index: idx }).then((r) => { if (r && r.ok) { update(r.project); setMsg('应答已生成' + (r.refs ? '，引用 ' + r.refs + ' 条知识' : '')) } else setErr('应答生成失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('应答异常：' + String((e && e.message) || e))).then(() => setBidGenIdx(null)) }
      const saveBidAnswer = (idx, val) => {
        const next = matrix.map((row, i) => i === idx ? Object.assign({}, row, { answer: val }) : row)
        rpc('docsuite/proj/save-outline', { id: p.id, bidMatrix: next }).then((r) => { if (r && r.ok) { update(r.project); setMsg('应答已保存') } else setErr('保存失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('保存异常：' + String((e && e.message) || e)))
      }
      const saveBidStatus = (idx, val) => {
        const next = matrix.map((row, i) => i === idx ? Object.assign({}, row, { status: val }) : row)
        rpc('docsuite/proj/save-outline', { id: p.id, bidMatrix: next }).then((r) => { if (r && r.ok) { update(r.project); setMsg('偏离情况已保存') } else setErr('保存失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('保存异常：' + String((e && e.message) || e)))
      }
      const bidStatusText = (st) => st === 'full' ? '无偏离' : st === 'positive' ? '正偏离' : st === 'negative' ? '负偏离' : st === 'na' ? '不适用' : (st === 'pending' ? '未应答' : (st || '未应答'))
      const genSchedule = () => {
        setScheduleBusy(true); setErr(null); setMsg(null)
        const d = parseInt(deliveryDays, 10); const sargs = { id: p.id, contractDate: contractDate }; if (d > 0) sargs.deliveryDays = d
        rpc('docsuite/proj/bid-schedule', sargs)
          .then((r) => { if (r && r.ok) { update(r.project); setMsg('时间节点安排已生成（' + (r.project.bidSchedule || []).length + ' 个阶段）') } else setErr('生成失败：' + ((r && r.message) || '未知')) })
          .catch((e) => setErr('生成异常：' + String((e && e.message) || e))).then(() => setScheduleBusy(false))
      }
      const refsOf = (nodeId) => (p.references && p.references[nodeId]) || []
      const renderOutline = (nodes, depth) => el('div', null, (nodes || []).map((n) => el('div', { key: n.id, style: { marginLeft: depth * 18 } }, el('div', { className: 'ds-row', style: { marginBottom: 4 } }, el('span', { className: 'ds-muted', style: { minWidth: 20 } }, '▸'), el('span', { className: 'ds-item-title', style: { fontSize: 13.5 } }, (n.title || '（未命名章节）') + (n.desc ? ' — ' + n.desc : '')), (n.children && n.children.length) ? null : el('button', { className: 'ds-btn-ghost', style: { padding: '2px 10px', fontSize: 12 }, onClick: () => genSection(n.id), disabled: genNodeId === n.id }, genNodeId === n.id ? '生成中…' : (p.sections && p.sections[n.id] ? '↻ 重生成' : '⚡ 生成')), (p.sections && p.sections[n.id]) ? el('button', { className: 'ds-btn-ghost', style: { padding: '2px 10px', fontSize: 12 }, onClick: () => { setViewNode(n.id); setEditNode(null) } }, '👁 查看') : null, (p.sections && p.sections[n.id]) ? el('button', { className: 'ds-btn-ghost', style: { padding: '2px 10px', fontSize: 12 }, onClick: () => { setEditNode(n.id); setEditText(p.sections[n.id] || ''); setViewNode(null) } }, '✏️ 编辑') : null, refsOf(n.id).length ? el('span', { className: 'ds-tag', style: { marginTop: 0 } }, '📎 ' + refsOf(n.id).length) : null), renderOutline(n.children, depth + 1))))
      let body
      if (specEdit) { body = el(RobotSpecEditor, { project: p, onConfirmed: (np) => { update(np); setSpecEdit(false); setMsg('边界配置已更新') }, onCancel: () => setSpecEdit(false) }) }
      else if (editOutline) { body = el(OutlineEditor, { project: p, onConfirmed: (np) => { update(np); setEditOutline(false); setMsg('大纲已更新') }, onCancel: () => setEditOutline(false) }) }
      else if (viewNode) { body = el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setViewNode(null) }, '← 返回大纲'), el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '章节预览')), el(MarkdownView, { text: (p.sections && p.sections[viewNode]) || '（空）' })) }
      else if (editNode) { body = el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn-ghost', onClick: () => setEditNode(null) }, '← 返回大纲'), el('span', { className: 'ds-panel-title', style: { margin: 0 } }, '章节编辑（Markdown）')), el('textarea', { className: 'ds-textarea', style: { minHeight: 320 }, value: editText, onChange: (e) => setEditText(e.target.value) }), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: saveSection, disabled: busy }, busy ? '保存中…' : '💾 保存章节'), el('span', { className: 'ds-muted' }, '下方为预览（前 400 字）')), el(MarkdownView, { text: editText.slice(0, 400) })) }
      else {
        const toolbar = el('div', { className: 'ds-kb-toolbar' }, el('button', { className: 'ds-btn', onClick: genOutline, disabled: busy }, '🪄 生成大纲'), el('button', { className: 'ds-btn-ghost', onClick: () => setEditOutline(true), disabled: busy }, '✏️ 编辑大纲'), el('button', { className: 'ds-btn-ghost', onClick: () => setSpecEdit(true), disabled: busy }, '🤖 边界配置'), el('button', { className: 'ds-btn-ghost', onClick: saveOutline, disabled: busy }, '💾 保存大纲'), el('button', { className: 'ds-btn-ghost', onClick: genAll, disabled: busy || !leaves.length }, '⚡ 一键生成全部章节'), el('button', { className: 'ds-btn-ghost', onClick: () => doExport('md'), disabled: exporting !== null }, exporting === 'md' ? '导出中…' : '⬇️ Markdown'), el('button', { className: 'ds-btn-ghost', onClick: () => doExport('docx'), disabled: exporting !== null }, exporting === 'docx' ? '导出中…' : '⬇️ Word'), el('button', { className: 'ds-btn-ghost', onClick: () => doExport('html'), disabled: exporting !== null }, exporting === 'html' ? '导出中…' : '⬇️ HTML'), el('button', { className: 'ds-btn-ghost', onClick: () => doExport('pdf'), disabled: exporting !== null }, exporting === 'pdf' ? '导出中…' : '⬇️ PDF'))
        const header = el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-panel-title', style: { margin: 0 } }, kindLabel(p.kind) + '：' + (p.title || p.id)), el('span', { className: 'ds-badge' }, statusText(p.status)), p.machineType ? el('span', { className: 'ds-badge' }, p.machineType) : null, el('button', { className: 'ds-btn-ghost', onClick: props.onBack }, '← 返回项目列表')), el('div', { className: 'ds-row' }, el('span', { className: 'ds-muted' }, (p.topic || '未填写主题描述') + (p.templateName ? '　·　模板：' + p.templateName : '') + (p.techTemplateName ? '　·　技术方案模板：' + p.techTemplateName : ''))), toolbar, err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null)
        const structPanel = p.kind === 'bid' ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '📐 标书编制要求（来自招标文件）'), bidStruct.compileRequirement ? el('p', { className: 'ds-muted', style: { lineHeight: 1.7 } }, bidStruct.compileRequirement) : el('div', { className: 'ds-muted' }, '（上传招标文件后自动识别其对投标文件组成/顺序/排版的要求）'), p.techTemplateName ? el('div', { className: 'ds-row' }, el('span', { className: 'ds-badge-violet' }, '技术方案模板：' + p.techTemplateName)) : null) : null
        const termsPanel = p.kind === 'bid' ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '📋 商务条款（来自招标文件）'), terms.deliveryText || terms.warranty || terms.payment ? el('table', { className: 'ds-table' }, el('tbody', null, terms.deliveryText ? el('tr', null, el('td', { style: { width: 110, fontWeight: 600 } }, '交货期'), el('td', null, terms.deliveryText + (terms.deliveryDays ? '（约 ' + terms.deliveryDays + ' 天）' : ''))) : null, terms.place ? el('tr', null, el('td', { style: { width: 110, fontWeight: 600 } }, '交货地点'), el('td', null, terms.place)) : null, terms.warranty ? el('tr', null, el('td', { style: { width: 110, fontWeight: 600 } }, '质保期'), el('td', null, terms.warranty)) : null, terms.payment ? el('tr', null, el('td', { style: { width: 110, fontWeight: 600 } }, '付款方式'), el('td', null, terms.payment)) : null)) : el('div', { className: 'ds-muted' }, '（未提取到商务条款）'), el('hr', { className: 'ds-divider' }), el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '📅 时间节点安排（基于交货期推算）'), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '合同签订日'), el('input', { type: 'date', className: 'ds-input', style: { maxWidth: 200 }, value: contractDate, onChange: (e) => setContractDate(e.target.value) }), el('span', { className: 'ds-label' }, '交货期限(天)'), el('input', { className: 'ds-input', style: { maxWidth: 120 }, value: deliveryDays, onChange: (e) => setDeliveryDays(e.target.value), placeholder: '如 180' }), el('button', { className: 'ds-btn', onClick: genSchedule, disabled: scheduleBusy || !deliveryDays }, scheduleBusy ? '推算中…' : '📅 生成时间节点安排')), schedule.length ? el('table', { className: 'ds-table' }, el('thead', null, el('tr', null, el('th', null, '阶段'), el('th', { style: { width: 110 } }, '开始日期'), el('th', { style: { width: 110 } }, '结束日期'), el('th', null, '工作内容'))), el('tbody', null, schedule.map((s, si) => el('tr', { key: si }, el('td', { style: { fontWeight: 600 } }, s.phase), el('td', null, s.start), el('td', null, s.end), el('td', null, s.desc))))) : el('div', { className: 'ds-muted' }, '设置合同签订日与交货期限后点击生成。')) : null
        const bidPanel = p.kind === 'bid' ? el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { fontSize: 14 } }, '🏆 招标需求响应矩阵'), el('div', { className: 'ds-kb-toolbar' }, el('input', { type: 'file', accept: '.pdf,.docx,.txt', className: 'ds-file-btn', onChange: onBidFile }), el('button', { className: 'ds-btn', onClick: runBidParse, disabled: busy || !bidFile }, busy ? '解析中…' : '上传招标文件并自动生成矩阵'), el('span', { className: 'ds-muted' }, matrix.length + ' 条要求 · 自动从技术要求分类提取')), matrix.length ? el('table', { className: 'ds-table' }, el('thead', null, el('tr', null, el('th', { style: { width: 40 } }, '序号'), el('th', null, '招标要求'), el('th', null, '响应内容'), el('th', { style: { width: 100 } }, '偏离情况'), el('th', { style: { width: 110 } }, ''))), el('tbody', null, matrix.map((row, idx) => el('tr', { key: idx }, el('td', null, row.no || (idx + 1)), el('td', null, el('div', { className: 'ds-muted' }, (row.category ? '【' + row.category + '】' : '') + (row.chapter ? '（' + row.chapter + '）' : '')) + (row.requirement || '')), el('td', null, row.answer ? el('div', { className: 'ds-item-summary', style: { WebkitLineClamp: 8 } }, row.answer) : el('span', { className: 'ds-muted' }, '（未应答）')), el('td', null, el('select', { className: 'ds-select', value: row.status || 'pending', onChange: (e) => saveBidStatus(idx, e.target.value) }, el('option', { value: 'pending' }, '未应答'), el('option', { value: 'full' }, '无偏离'), el('option', { value: 'positive' }, '正偏离'), el('option', { value: 'negative' }, '负偏离'), el('option', { value: 'na' }, '不适用'))), el('td', null, el('div', { className: 'ds-row', style: { marginBottom: 0 } }, el('button', { className: 'ds-btn-ghost', style: { padding: '2px 8px', fontSize: 12 }, onClick: () => genBidAnswer(idx), disabled: bidGenIdx === idx }, bidGenIdx === idx ? '…' : '⚡ 应答'), el('textarea', { className: 'ds-textarea', style: { minHeight: 50 }, value: row.answer || '', onChange: (e) => saveBidAnswer(idx, e.target.value), placeholder: '手动编辑响应内容' }))))))) : el('div', { className: 'ds-muted' }, '上传招标文件后自动生成响应矩阵（无明确表格时从技术要求自动分类提取），可逐条 AI 应答并标记偏离情况。')) : null
        const outlinePanel = el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('div', { className: 'ds-panel-title', style: { margin: 0, fontSize: 14 } }, '章节大纲（' + leaves.length + ' 个章节）'), el('button', { className: 'ds-btn-ghost', style: { padding: '2px 10px', fontSize: 12 }, onClick: () => setEditOutline(true) }, '✏️ 编辑大纲')), renderOutline(p.outline || [], 0), !leaves.length ? el('div', { className: 'ds-muted' }, '点击「🪄 生成大纲」创建章节结构。') : null)
        body = el('div', null, header, structPanel, termsPanel, bidPanel, outlinePanel)
      }
      return el('div', null, body)
    }

    // ================= PPT 生成器页面（M4） =================
    function PPTPage() {
      const [projects, setProjects] = React.useState([]); const [selId, setSelId] = React.useState(''); const [theme, setTheme] = React.useState('ocean')
      const [slides, setSlides] = React.useState(null); const [busy, setBusy] = React.useState(false); const [exporting, setExporting] = React.useState(false)
      const [err, setErr] = React.useState(null); const [msg, setMsg] = React.useState(null)
      React.useEffect(() => { rpc('docsuite/proj/list').then((r) => setProjects((r && r.projects) || [])).catch((e) => setErr('加载项目失败：' + String((e && e.message) || e))) }, [])
      const genSlides = () => {
        if (!selId) { setErr('请先选择文档项目'); return }
        setBusy(true); setErr(null); setMsg(null); setSlides(null)
        rpc('docsuite/ppt/preview', { id: selId }).then((r) => { if (r && r.ok) { setSlides(r.slides); setMsg('已生成 ' + r.slides.length + ' 页幻灯片') } else setErr('生成失败：' + ((r && r.message) || '未知')) }).catch((e) => setErr('生成异常：' + String((e && e.message) || e))).then(() => setBusy(false))
      }
      const doExport = () => {
        if (!slides || !slides.length) { setErr('请先生成幻灯片'); return }
        setExporting(true); setErr(null)
        rpc('docsuite/ppt/export', { slides: slides, theme: theme, title: (projects.find((x) => x.id === selId) || {}).title || 'presentation' })
          .then((r) => {
            if (!r || !r.ok) { setErr('导出失败：' + ((r && r.message) || '未知')); return }
            const bin = atob(r.base64); const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = r.fileName; a.click()
            setTimeout(() => URL.revokeObjectURL(url), 5000); setMsg('已导出：' + r.fileName)
          })
          .catch((e) => setErr('导出异常：' + String((e && e.message) || e))).then(() => setExporting(false))
      }
      const renderSlide = (s, idx) => el('div', { key: idx, className: 'ds-slide' }, el('div', { className: 'ds-slide-title' }, (idx === 0 ? '🏠 ' : (idx + 1) + '. ') + (s.title || '幻灯片 ' + (idx + 1))), s.bullets && s.bullets.length ? el('ul', { className: 'ds-slide-bullets' }, s.bullets.map((b, bi) => el('li', { key: bi }, b))) : null, s.table && s.table.headers ? el('table', { className: 'ds-table', style: { marginTop: 8 } }, el('thead', null, el('tr', null, s.table.headers.map((h, hi) => el('th', { key: hi }, h)))), el('tbody', null, (s.table.rows || []).map((r, ri) => el('tr', { key: ri }, r.map((c, ci) => el('td', { key: ci }, String(c == null ? '' : c))))))) : null)
      return el('div', null, el('div', { className: 'ds-panel' }, el('div', { className: 'ds-panel-title', style: { margin: 0 } }, '🎞️ PPT 生成器'), el('span', { className: 'ds-sub' }, '从已完成文档项目一键生成演示文稿（16:9）')), el('div', { className: 'ds-panel' }, el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '文档项目'), el('select', { className: 'ds-select', value: selId, onChange: (e) => setSelId(e.target.value) }, el('option', { value: '' }, '（选择项目…）'), projects.map((p) => el('option', { key: p.id, value: p.id }, kindLabel(p.kind) + ' · ' + p.title + (p.status ? '（' + statusText(p.status) + '）' : ''))))), el('div', { className: 'ds-row' }, el('span', { className: 'ds-label' }, '演示主题'), el('select', { className: 'ds-select', value: theme, onChange: (e) => setTheme(e.target.value) }, PPT_THEMES.map((t) => el('option', { key: t.key, value: t.key }, t.label)))), el('div', { className: 'ds-row' }, el('button', { className: 'ds-btn', onClick: genSlides, disabled: busy || !selId }, busy ? '生成中…' : '🪄 生成幻灯片'), el('button', { className: 'ds-btn-ghost', onClick: doExport, disabled: exporting || !slides }, exporting ? '导出中…' : '⬇️ 导出 PPTX'), el('span', { className: 'ds-muted' }, '建议选择已生成章节的文档项目')), err ? el('div', { className: 'ds-err' }, err) : null, msg ? el('div', { className: 'ds-ok' }, msg) : null), slides && slides.length ? el('div', null, el('div', { className: 'ds-panel-title' }, '幻灯片预览（' + slides.length + ' 页）'), slides.map((s, idx) => renderSlide(s, idx))) : null)
    }

    function DocSuiteApp() {
      const [page, setPage] = React.useState('home'); const [sum, setSum] = React.useState(null); const [err, setErr] = React.useState(null)
      React.useEffect(() => { rpc('docsuite/state/summary').then(setSum).catch((e) => setErr(String((e && e.message) || e))) }, [])
      let body = null
      if (page === 'settings') body = el(SettingsContent, null)
      else if (page === 'home') body = el(Home, { sum: sum, onOpen: (k) => setPage(k) })
      else if (page === 'kb') body = el(KBPage, null)
      else if (page === 'tpl') body = el(TPLPage, null)
      else if (page === 'studio') body = el(StudioPage, null)
      else if (page === 'ppt') body = el(PPTPage, null)
      else { const m = MODULES.find((x) => x.key === page); body = el(Placeholder, { icon: m ? m.icon : '📄', title: m ? m.title : page, desc: m ? m.desc : '' }) }
      return el('div', { className: 'ds-root' }, el('datalist', { id: 'ds-cat-suggest' }, ['导航定位', '推进动力', '通信遥测', '能源电池', '水密耐压', '作业工具', '通用设备', '其他', '声呐', '深度计', '测深仪', '多普勒测速仪', '罗经', '惯导', '超短基线', '摄像机', '云台', '推进器', '机械手', '机械爪', '灯组'].map((c) => el('option', { key: c, value: c }))), el('div', { className: 'ds-header' }, el('span', { className: 'ds-brand' }, 'DocSuite 文档工坊'), page !== 'home' ? el('button', { className: 'ds-back', onClick: () => setPage('home') }, '← 返回主页') : null, el('span', { className: 'ds-sub' }, '水下机器人 · ROV/AUV')), err ? el('div', { className: 'ds-err' }, '服务连接失败：' + err) : null, body)
    }

    slots.inject('conversation.view', () => slots.register({ name: 'conversation.view', id: 'docsuite', order: 20, label: () => 'DocSuite' }, () => el(DocSuiteApp, null)))
    slots.inject('settings.section', () => slots.register({ name: 'settings.section', id: 'docsuite', order: 60, label: () => 'DocSuite' }, () => el(SettingsContent, null)))
    return () => { disposeCss() }
  },
}