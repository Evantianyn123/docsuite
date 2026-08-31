// DocSuite 文档工坊 — DSH 动态 Cordis 插件源码（host）
// 插件: docsu-1 · 包: pkg-12 (DocSuite M5 增强) · 导出时间: 2026-08-30T07:24:27.381Z
// 来源: cordis_inspect_self 快照。此为存档/版本管理副本，需经 cordis_define 重新注入 DSH 运行。

return {
  apply(ctx) {
    const fs = ctx.get('fs')
    const shell = ctx.get('shell')
    const subprocess = ctx.get('subprocess')
    const sandboxPolicy = ctx.get('sandboxPolicy')
    // llm 惰性解析：动态插件挂载时 llm 服务可能尚未激活；业务体在请求处理时才用 llm。
    let llm = null
    const llmResolve = () => {
      try { const s = ctx && typeof ctx.get === 'function' ? ctx.get('llm') : undefined; llm = s || null } catch (e) { llm = null }
      return llm
    }
    const agentDefaultModel = ctx.get('agentDefaultModel')
    const web = ctx.get('web')

    const joinPath = (...parts) => {
      const out = []
      for (const p of parts) { const s = String(p == null ? '' : p); if (s) out.push(s.replace(/[\\/]+$/g, '')) }
      return out.join('\\')
    }
    const workspaceRoot = sandboxPolicy && sandboxPolicy.workspaceRoot ? String(sandboxPolicy.workspaceRoot) : ''
    let rootDir = workspaceRoot ? joinPath(workspaceRoot, '.docsuite-data') : '.docsuite-data'
    let CONFIG_PATH = joinPath(rootDir, 'config.json')
    const DEFAULT_CONFIG = { version: 1, dataDir: rootDir, language: 'zh', pptTheme: 'ocean', model: { mode: 'dsh', customApi: { baseUrl: '', apiKey: '', model: '' } }, scanDirs: [] }
    const CATEGORIES = ['导航定位', '推进动力', '通信遥测', '能源电池', '水密耐压', '作业工具', '通用设备', '其他']
    const DOC_KINDS = ['tech', 'research', 'bid', 'test']
    const KIND_NAMES = { tech: '技术方案', research: '调研报告', bid: '投标技术文件', test: '机器人测试方案' }
    const PPT_THEME_KEYS = ['ocean', 'tech', 'dark', 'light']

    function collectText(o) { if (o == null) return ''; if (typeof o === 'string') return o; if (typeof o.text === 'string') return o.text; return '' }
    function stdoutOf(res) { return res ? collectText(res.stdout) : '' }
    function stderrOf(res) { return res ? collectText(res.stderr) : '' }
    function pickStdout(res) { return stdoutOf(res) || stderrOf(res) }
    function exitCodeOf(res) { if (!res) return null; if (res.exitCode !== undefined && res.exitCode !== null) return res.exitCode; if (res.code !== undefined && res.code !== null) return res.code; return null }
    function stripHtml(html) {
      let s = String(html || '')
      s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
      s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&rsquo;/gi, "'").replace(/&ldquo;|&rdquo;/gi, '"')
      return s.replace(/\s+/g, ' ').trim()
    }

    async function ensureDir(dir) {
      if (!shell) return
      try {
        const spec = shell.resolve({ command: 'New-Item -ItemType Directory -Force -Path "' + String(dir).replace(/"/g, '\\"') + '" | Out-Null' })
        await shell.run(spec)
      } catch (e) { console.log('[docsuite] ensureDir failed:', String((e && e.message) || e)) }
    }
    async function readJson(absPath) {
      if (!fs) return undefined
      try { const target = await fs.resolve(absPath); const info = await fs.stat(target); if (!info) return undefined; return JSON.parse(await fs.readText(target)) } catch (e) { return undefined }
    }
    async function writeTextFile(absPath, content) {
      if (!fs) return
      const target = await fs.resolve(absPath); await fs.writeText(target, content)
    }
    // 容错读取文本：fs.readText 会把含 NUL 字节的文件判定为二进制拒绝读取（FS_NOT_TEXT），
    // 而 PDF 提取产物常带 NUL/控制字符。此函数优先 readText，失败则 readBytes 原始字节，
    // 手工做 UTF-8 容错解码，并过滤 NUL 与控制字符（保留 \n \t \r）。
    // 参数接受两种形式：已 resolve 的 target 对象（{targetKey,displayPath}），或原始路径字符串。
    // 注意：fs.resolve 只接受路径字符串，若对 target 对象再次 resolve 会得到垃圾路径。
    function decodeBytesTolerant(bytes) {
      let out = ''
      let i = 0
      const n = bytes ? bytes.length : 0
      while (i < n) {
        const b = bytes[i]
        if (b === 0) { i++; continue }
        if (b < 0x80) { out += String.fromCharCode(b); i++; continue }
        let len = 0, cp = 0
        if (b >= 0xF0) { len = 4; cp = b & 0x07 }
        else if (b >= 0xE0) { len = 3; cp = b & 0x0F }
        else if (b >= 0xC0) { len = 2; cp = b & 0x1F }
        else { i++; continue }
        if (i + len > n) break
        let ok = true
        for (let j = 1; j < len; j++) {
          const c = bytes[i + j]
          if ((c & 0xC0) !== 0x80) { ok = false; break }
          cp = (cp << 6) | (c & 0x3F)
        }
        if (!ok) { i++; continue }
        out += String.fromCodePoint(cp)
        i += len
      }
      let res = ''
      for (let k = 0; k < out.length; k++) {
        const code = out.charCodeAt(k)
        if (code === 9 || code === 10 || code === 13 || code >= 32) res += out[k]
      }
      return res
    }
    async function readTextTolerant(targetOrPath) {
      if (!fs) return ''
      try {
        let target = targetOrPath
        if (typeof targetOrPath === 'string') target = await fs.resolve(targetOrPath)
        try { return await fs.readText(target) } catch (e) {}
        const bytes = await fs.readBytes(target, undefined, 64 * 1024 * 1024)
        return decodeBytesTolerant(bytes)
      } catch (e) { return '' }
    }
    async function writeJson(absPath, obj) { await writeTextFile(absPath, JSON.stringify(obj, null, 2)) }
    async function getConfig() { const cfg = await readJson(CONFIG_PATH); return cfg && typeof cfg === 'object' && !Array.isArray(cfg) ? cfg : DEFAULT_CONFIG }
    async function saveConfig(patch) {
      const cur = await getConfig(); const clean = {}
      for (const k in (patch || {})) { const v = patch[k]; if (v !== undefined) clean[k] = v }
      const next = Object.assign({}, cur, clean); await ensureDir(rootDir); await writeJson(CONFIG_PATH, next); return next
    }
    async function dataDir() { const cfg = await getConfig(); return (cfg.dataDir && String(cfg.dataDir)) || rootDir }
    async function countJsonFiles(dir) {
      if (!fs) return 0
      try {
        const target = await fs.resolve(dir); const info = await fs.stat(target); if (!info) return 0
        const entries = await fs.listDir(target); let n = 0
        for (const e of entries) { const nm = e.name || String(e.path || e.target || '').split(/[\\/]/).pop(); if (/\.json$/i.test(nm)) n++ }
        return n
      } catch (e) { return 0 }
    }

    // ---- Python 工具链 ----
    const PY_SCRIPT = [
      'import base64, json, os, sys',
      '',
      'def extract_pdf(path):',
      '    try:',
      '        import pdfplumber',
      '        body_parts = []',
      '        table_parts = []',
      '        with pdfplumber.open(path) as pdf:',
      '            for pi, page in enumerate(pdf.pages):',
      '                try:',
      '                    txt = page.extract_text() or chr(34) + chr(34)',
      '                    if txt:',
      '                        body_parts.append("【第" + str(pi + 1) + "页正文】")',
      '                        body_parts.append(txt)',
      '                except Exception:',
      '                    pass',
      '                try:',
      '                    tables = page.extract_tables()',
      '                    for ti, tb in enumerate(tables):',
      '                        if not tb:',
      '                            continue',
      '                        table_parts.append("【表格 第" + str(pi + 1) + "页 第" + str(ti + 1) + "个】")',
      '                        for row in tb:',
      '                            cells = []',
      '                            for c in row:',
      '                                if c is None:',
      '                                    cells.append("")',
      '                                else:',
      '                                    cells.append(str(c).replace(chr(10), " ").strip())',
      '                            table_parts.append("|".join(cells))',
      '                except Exception:',
      '                    pass',
      '        if table_parts:',
      '            sep = "===== 以下为表格数据（每行用 | 分隔，同一行各列表示同一型号的一组参数，第一行常为表头：型号|参数1|参数2|...） ====="',
      '            return chr(10).join(body_parts) + chr(10) + chr(10) + sep + chr(10) + chr(10) + chr(10).join(table_parts)',
      '        return chr(10).join(body_parts)',
      '    except Exception:',
      '        pass',
      '    try:',
      '        from pypdf import PdfReader',
      '    except Exception:',
      '        from PyPDF2 import PdfReader',
      '    reader = PdfReader(path)',
      '    parts = []',
      '    for page in reader.pages:',
      '        try:',
      '            parts.append(page.extract_text() or chr(39) + chr(39))',
      '        except Exception:',
      '            parts.append(chr(39) + chr(39))',
      '    return chr(10).join(parts)',
      '',
      'def extract_docx(path):',
      '    import docx',
      '    d = docx.Document(path)',
      '    parts = [p.text for p in d.paragraphs]',
      '    for t in d.tables:',
      '        for row in t.rows:',
      '            seen = []',
      '            for c in row.cells:',
      '                seen.append((c.text or chr(39) + chr(39)).strip())',
      '            parts.append(chr(124).join(seen))',
      '    return chr(10).join(parts)',
      '',
      'def extract_txt(path):',
      '    for enc in (chr(117)+chr(116)+chr(102)+chr(45)+chr(56), chr(103)+chr(98)+chr(49)+chr(56)+chr(48)+chr(51)+chr(48), chr(117)+chr(116)+chr(102)+chr(45)+chr(49)+chr(54)):',
      '        try:',
      '            with open(path, chr(114), encoding=enc) as f:',
      '                return f.read()',
      '        except Exception:',
      '            continue',
      '    return chr(39) + chr(39)',
      '',
      'def main():',
      '    b64_path = sys.argv[1]',
      '    out_dir = sys.argv[2]',
      '    file_name = sys.argv[3]',
      '    with open(b64_path, chr(114), encoding=chr(97)+chr(115)+chr(99)+chr(105)+chr(105)) as f:',
      '        raw = f.read().strip()',
      '    data = base64.b64decode(raw)',
      '    os.makedirs(out_dir, exist_ok=True)',
      '    orig_path = os.path.join(out_dir, file_name)',
      '    with open(orig_path, chr(119)+chr(98)) as f:',
      '        f.write(data)',
      '    ext = os.path.splitext(file_name)[1].lower()',
      '    if ext == chr(46)+chr(112)+chr(100)+chr(102):',
      '        text = extract_pdf(orig_path)',
      '    elif ext in (chr(46)+chr(100)+chr(111)+chr(99)+chr(120), chr(46)+chr(100)+chr(111)+chr(99)):',
      '        text = extract_docx(orig_path)',
      '    else:',
      '        text = extract_txt(orig_path)',
      '    text_path = os.path.join(out_dir, chr(101)+chr(120)+chr(116)+chr(114)+chr(97)+chr(99)+chr(116)+chr(101)+chr(100)+chr(46)+chr(116)+chr(120)+chr(116))',
      '    text = "".join(ch for ch in text if ch in (chr(10), chr(9), chr(13)) or ord(ch) >= 32)',
      '    with open(text_path, chr(119), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:',
      '        f.write(text)',
      '    print(json.dumps({chr(111)+chr(107): True, chr(102)+chr(105)+chr(108)+chr(101): orig_path, chr(116)+chr(101)+chr(120)+chr(116)+chr(76)+chr(101)+chr(110): len(text)}))',
      '    sys.exit(0)',
      '',
      'main()',
    ].join('\n')

    const EXPORT_SCRIPT = [
      'import sys, os, re, datetime',
      'import docx',
      'from docx.shared import Pt',
      'from docx.enum.text import WD_ALIGN_PARAGRAPH',
      '',
      'def add_rich(p, text):',
      '    parts = re.split(r"(\\*\\*[^*]+\\*\\*|`[^`]+`)", text)',
      '    for part in parts:',
      '        if not part:',
      '            continue',
      '        if part.startswith(chr(42)*2) and part.endswith(chr(42)*2):',
      '            run = p.add_run(part[2:-2]); run.bold = True',
      '        elif part.startswith(chr(96)) and part.endswith(chr(96)):',
      '            run = p.add_run(part[1:-1]); run.font.name = chr(67)+chr(111)+chr(110)+chr(115)+chr(111)+chr(108)+chr(97)+chr(115)',
      '        else:',
      '            p.add_run(part)',
      '',
      'def main():',
      '    md_path = sys.argv[1]',
      '    out_path = sys.argv[2]',
      '    title = sys.argv[3]',
      '    with open(md_path, chr(114), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:',
      '        lines = f.read().split(chr(10))',
      '    doc = docx.Document()',
      '    h = doc.add_heading(title, 0)',
      '    h.alignment = WD_ALIGN_PARAGRAPH.CENTER',
      '    p = doc.add_paragraph()',
      '    p.alignment = WD_ALIGN_PARAGRAPH.CENTER',
      '    p.add_run(datetime.date.today().strftime(chr(37)+chr(89)+chr(45)+chr(37)+chr(109)+chr(45)+chr(37)+chr(100)))',
      '    doc.add_page_break()',
      '    i = 0',
      '    table_buf = []',
      '    def flush_table():',
      '        nonlocal table_buf',
      '        if not table_buf:',
      '            return',
      '        rows = [r.strip().strip(chr(124)).split(chr(124)) for r in table_buf if r.strip()]',
      '        rows = [[c.strip() for c in r] for r in rows]',
      '        rows = [r for r in rows if not all(re.fullmatch(r"[\\s:\\-]+", c) for c in r)]',
      '        if rows:',
      '            t = doc.add_table(rows=len(rows), cols=max(len(r) for r in rows))',
      '            t.style = chr(76)+chr(105)+chr(103)+chr(104)+chr(116)+chr(32)+chr(71)+chr(114)+chr(105)+chr(100)+chr(32)+chr(65)+chr(99)+chr(99)+chr(101)+chr(110)+chr(116)',
      '            for ri, row in enumerate(rows):',
      '                for ci, cell in enumerate(row):',
      '                    t.cell(ri, ci).text = cell',
      '            doc.add_paragraph()',
      '        table_buf = []',
      '    while i < len(lines):',
      '        line = lines[i]',
      '        if line.startswith(chr(35) + chr(32)):',
      '            flush_table(); doc.add_heading(line[2:].strip(), 1)',
      '        elif line.startswith(chr(35)*2 + chr(32)):',
      '            flush_table(); doc.add_heading(line[3:].strip(), 2)',
      '        elif line.startswith(chr(35)*3 + chr(32)):',
      '            flush_table(); doc.add_heading(line[4:].strip(), 3)',
      '        elif line.startswith(chr(35)*4 + chr(32)):',
      '            flush_table(); doc.add_heading(line[5:].strip(), 4)',
      '        elif line.strip().startswith(chr(124)):',
      '            table_buf.append(line)',
      '        elif line.strip().startswith(chr(45) + chr(32)) or line.strip().startswith(chr(42) + chr(32)):',
      '            flush_table(); doc.add_paragraph(line.strip()[2:], style=chr(76)+chr(105)+chr(115)+chr(116)+chr(32)+chr(66)+chr(117)+chr(108)+chr(108)+chr(101)+chr(116))',
      '        elif line.strip() and not line.strip().startswith(chr(35)) and not re.match(r"^\\s*---+\\s*$", line):',
      '            flush_table(); para = doc.add_paragraph(); add_rich(para, line.strip())',
      '        else:',
      '            flush_table()',
      '        i += 1',
      '    flush_table()',
      '    doc.save(out_path)',
      '    print(chr(79)+chr(75))',
      '',
      'main()',
    ].join('\n')

    const PPT_SCRIPT = [
      'import sys, json',
      'from pptx import Presentation',
      'from pptx.util import Inches, Pt, Emu',
      'from pptx.dml.color import RGBColor',
      'from pptx.enum.text import PP_ALIGN',
      '',
      'THEMES = {',
      '  chr(111)+chr(99)+chr(101)+chr(97)+chr(110): {chr(98)+chr(103): chr(49)+chr(52)+chr(50)+chr(50)+chr(51)+chr(50)+chr(50), chr(97)+chr(99)+chr(99): chr(51)+chr(52)+chr(68)+chr(70)+chr(70)+chr(69)+chr(66), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(66)+chr(70)+chr(66)+chr(70)+chr(70)+chr(70)} ,',
      '  chr(116)+chr(101)+chr(99)+chr(104): {chr(98)+chr(103): chr(48)+chr(49)+chr(49)+chr(48)+chr(49)+chr(53), chr(97)+chr(99)+chr(99): chr(48)+chr(57)+chr(68)+chr(65)+chr(70)+chr(70), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(50)+chr(49)+chr(52)+chr(50)+chr(49)+chr(55)} ,',
      '  chr(100)+chr(97)+chr(114)+chr(107): {chr(98)+chr(103): chr(49)+chr(55)+chr(49)+chr(56)+chr(50)+chr(50), chr(97)+chr(99)+chr(99): chr(70)+chr(49)+chr(56)+chr(56)+chr(56)+chr(56), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(49)+chr(54)+chr(51)+chr(49)+chr(54)+chr(51)} ,',
      '  chr(108)+chr(105)+chr(103)+chr(104)+chr(116): {chr(98)+chr(103): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(97)+chr(99)+chr(99): chr(48)+chr(57)+chr(56)+chr(55)+chr(70)+chr(66), chr(116)+chr(101)+chr(120)+chr(116): chr(49)+chr(50)+chr(50)+chr(49)+chr(50)+chr(50), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(56)+chr(57)+chr(57)+chr(57)+chr(57)+chr(57)} ,',
      '}',
      '',
      'def hexc(s):',
      '    return RGBColor(int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))',
      '',
      'def set_bg(slide, color):',
      '    slide.background.fill.solid()',
      '    slide.background.fill.fore_color.rgb = hexc(color)',
      '',
      'def add_text(slide, left, top, width, height, text, size, color, bold=False, align=PP_ALIGN.LEFT):',
      '    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))',
      '    tf = box.text_frame',
      '    tf.word_wrap = True',
      '    p = tf.paragraphs[0]',
      '    p.alignment = align',
      '    run = p.add_run()',
      '    run.text = text',
      '    run.font.size = Pt(size)',
      '    run.font.color.rgb = hexc(color)',
      '    run.font.bold = bold',
      '    return box',
      '',
      'def add_bullets(slide, bullets, color, top=1.5):',
      '    box = slide.shapes.add_textbox(Inches(0.8), Inches(top), Inches(11.7), Inches(5.5))',
      '    tf = box.text_frame',
      '    tf.word_wrap = True',
      '    first = True',
      '    for b in bullets:',
      '        if first:',
      '            p = tf.paragraphs[0]',
      '            first = False',
      '        else:',
      '            p = tf.add_paragraph()',
      '        p.text = b',
      '        p.font.size = Pt(18)',
      '        p.font.color.rgb = hexc(color)',
      '        p.space_after = Pt(8)',
      '',
      'def add_table(slide, table, theme):',
      '    headers = table.get(chr(104)+chr(101)+chr(97)+chr(100)+chr(101)+chr(114)+chr(115), [])',
      '    rows = table.get(chr(114)+chr(111)+chr(119)+chr(115), [])',
      '    if not headers:',
      '        return',
      '    ncols = len(headers)',
      '    nrows = len(rows) + 1',
      '    shape = slide.shapes.add_table(nrows, ncols, Inches(0.8), Inches(1.6), Inches(11.7), Inches(4.5))',
      '    tbl = shape.table',
      '    for ci, h in enumerate(headers):',
      '        cell = tbl.cell(0, ci)',
      '        cell.text = str(h)',
      '        cell.fill.solid()',
      '        cell.fill.fore_color.rgb = hexc(theme[chr(97)+chr(99)+chr(99)])',
      '    for ri, row in enumerate(rows):',
      '        for ci, val in enumerate(row):',
      '            if ci < ncols:',
      '                cell = tbl.cell(ri + 1, ci)',
      '                cell.text = str(val)',
      '                cell.fill.solid()',
      '                cell.fill.fore_color.rgb = hexc(theme[chr(98)+chr(103)])',
      '',
      'def main():',
      '    data_path = sys.argv[1]',
      '    out_path = sys.argv[2]',
      '    theme_key = sys.argv[3]',
      '    title = sys.argv[4]',
      '    with open(data_path, chr(114), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:',
      '        data = json.load(f)',
      '    theme = THEMES.get(theme_key, THEMES[chr(111)+chr(99)+chr(101)+chr(97)+chr(110)])',
      '    prs = Presentation()',
      '    prs.slide_width = Inches(13.333)',
      '    prs.slide_height = Inches(7.5)',
      '    blank = prs.slide_layouts[6]',
      '    slides = data.get(chr(115)+chr(108)+chr(105)+chr(100)+chr(101)+chr(115), [])',
      '    for idx, s in enumerate(slides):',
      '        slide = prs.slides.add_slide(blank)',
      '        set_bg(slide, theme[chr(98)+chr(103)])',
      '        s_title = str(s.get(chr(116)+chr(105)+chr(116)+chr(108)+chr(101), chr(24037)+chr(24149)+chr(29255)+chr(32)+str(idx + 1)))',
      '        if idx == 0:',
      '            add_text(slide, 0.8, 2.4, 11.7, 1.6, s_title, 44, theme[chr(97)+chr(99)+chr(99)], True, PP_ALIGN.CENTER)',
      '            add_text(slide, 0.8, 4.2, 11.7, 0.8, title, 20, theme[chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116)], False, PP_ALIGN.CENTER)',
      '        else:',
      '            add_text(slide, 0.8, 0.5, 11.7, 0.9, s_title, 30, theme[chr(97)+chr(99)+chr(99)], True)',
      '            if s.get(chr(116)+chr(97)+chr(98)+chr(108)+chr(101)):',
      '                add_table(slide, s[chr(116)+chr(97)+chr(98)+chr(108)+chr(101)], theme)',
      '            else:',
      '                add_bullets(slide, s.get(chr(98)+chr(117)+chr(108)+chr(108)+chr(101)+chr(116)+chr(115), []), theme[chr(116)+chr(101)+chr(120)+chr(116)])',
      '    prs.save(out_path)',
      '    print(chr(79)+chr(75))',
      '',
      'main()',
    ].join('\n')

    const OCR_SCRIPT = [
      'import sys, os',
      'import fitz',
      'from rapidocr_onnxruntime import RapidOCR',
      '',
      'def main():',
      '    pdf_path = sys.argv[1]',
      '    out_path = sys.argv[2]',
      '    ocr = RapidOCR()',
      '    doc = fitz.open(pdf_path)',
      '    parts = []',
      '    tmp_dir = os.path.dirname(out_path)',
      '    for pi, page in enumerate(doc):',
      '        pix = page.get_pixmap(dpi=200)',
      '        tmp = os.path.join(tmp_dir, chr(95) + chr(111) + chr(99) + chr(114) + chr(95) + str(pi) + chr(46) + chr(112) + chr(110) + chr(103))',
      '        pix.save(tmp)',
      '        try:',
      '            result, _ = ocr(tmp)',
      '            if result:',
      '                for line in result:',
      '                    try:',
      '                        parts.append(str(line[1]))',
      '                    except Exception:',
      '                        pass',
      '        except Exception:',
      '            pass',
      '        parts.append(chr(32))',
      '        try:',
      '            os.remove(tmp)',
      '        except Exception:',
      '            pass',
      '    text = "".join(ch for ch in chr(10).join(parts) if ch in (chr(10), chr(9), chr(13)) or ord(ch) >= 32)',
      '    with open(out_path, chr(119), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:',
      '        f.write(text)',
      '    print(chr(79)+chr(67)+chr(82)+chr(95)+chr(68)+chr(79)+chr(78)+chr(69))',
      '',
      'main()',
    ].join('\n')

    async function depsInstalled() {
      if (!shell) return false
      try {
        const res = await shell.run(shell.resolve({ command: 'python -c "import pypdf, docx"' }))
        const code = exitCodeOf(res)
        if (code === 0) return true
        return false
      } catch (e) { return false }
    }
    async function pptDepsInstalled() {
      if (!shell) return false
      try { const res = await shell.run(shell.resolve({ command: 'python -c "import pptx"' })); return exitCodeOf(res) === 0 } catch (e) { return false }
    }
    async function pdfTblDepsInstalled() {
      if (!shell) return false
      try { const res = await shell.run(shell.resolve({ command: 'python -c "import pdfplumber"' })); return exitCodeOf(res) === 0 } catch (e) { return false }
    }
    async function ocrDepsInstalled() {
      if (!shell) return false
      try { const res = await shell.run(shell.resolve({ command: 'python -c "import fitz; import rapidocr_onnxruntime"' })); return exitCodeOf(res) === 0 } catch (e) { return false }
    }
    async function ensurePythonToolchain() {
      if (!shell) return { ok: false, message: 'shell 服务不可用' }
      const dir = await dataDir()
      const scriptsDir = joinPath(dir, 'scripts')
      await ensureDir(scriptsDir)
      try { await writeTextFile(joinPath(scriptsDir, 'ingest_file.py'), PY_SCRIPT); await writeTextFile(joinPath(scriptsDir, 'export_docx.py'), EXPORT_SCRIPT); await writeTextFile(joinPath(scriptsDir, 'export_pptx.py'), PPT_SCRIPT); await writeTextFile(joinPath(scriptsDir, 'ocr_file.py'), OCR_SCRIPT) } catch (e) { return { ok: false, message: '写入脚本失败：' + String((e && e.message) || e) } }
      const need = []
      if (!(await depsInstalled())) need.push('pypdf python-docx')
      if (!(await pdfTblDepsInstalled())) need.push('pdfplumber')
      if (!(await pptDepsInstalled())) need.push('python-pptx')
      if (!need.length) return { ok: true, message: '工具链就绪', installed: true }
      // 用 --user 避免系统 site-packages 不可写；--no-cache-dir 避免 DSH 临时目录权限问题
      const installRes = await shell.run(shell.resolve({ command: 'python -m pip install --user --no-cache-dir ' + need.join(' ') + ' --disable-pip-version-check' }))
      const installText = (pickStdout(installRes) + ' ' + stderrOf(installRes)).replace(/WARNING:[\s\S]*?manually\./g, '').replace(/notice[^\n]*\n?/g, '').trim()
      if ((await depsInstalled()) && (await pptDepsInstalled())) return { ok: true, message: '依赖安装完成', installed: true }
      return { ok: false, message: '依赖安装失败：' + (installText || installRes).slice(-600), installed: false }
    }
    async function ensureOcrToolchain() {
      if (!shell) return { ok: false, message: 'shell 服务不可用' }
      const dir = await dataDir(); const scriptsDir = joinPath(dir, 'scripts')
      await ensureDir(scriptsDir)
      try { await writeTextFile(joinPath(scriptsDir, 'ocr_file.py'), OCR_SCRIPT) } catch (e) { return { ok: false, message: '写入脚本失败' } }
      if (await ocrDepsInstalled()) return { ok: true, message: 'OCR 就绪', installed: true }
      const installRes = await shell.run(shell.resolve({ command: 'python -m pip install --user --no-cache-dir pymupdf rapidocr-onnxruntime --disable-pip-version-check' }))
      const installText = (pickStdout(installRes) + ' ' + stderrOf(installRes)).replace(/WARNING:[\s\S]*?manually\./g, '').replace(/notice[^\n]*\n?/g, '').trim()
      if (await ocrDepsInstalled()) return { ok: true, message: 'OCR 依赖安装完成（首次使用较慢）', installed: true }
      return { ok: false, message: 'OCR 依赖安装失败：' + (installText || installRes).slice(-600), installed: false }
    }
    async function ocrPdfFile(pdfPath, outTxtPath) {
      const tc = await ensureOcrToolchain()
      if (!tc.ok) return tc
      const dir = await dataDir()
      const scriptPath = joinPath(dir, 'scripts', 'ocr_file.py')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + pdfPath + '" "' + outTxtPath + '"' }))
      if (/OCR_DONE/.test(pickStdout(res))) return { ok: true }
      return { ok: false, message: 'OCR 执行失败：' + pickStdout(res).slice(0, 200) + stderrOf(res).slice(0, 200) }
    }

    // ---- LLM ----
    function parseModelJson(raw) {
      if (!raw) return null
      const tryParse = (t) => { try { return JSON.parse(t) } catch (e) { return null } }
      let s = String(raw).trim()
      let p = tryParse(s); if (p) return p
      s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
      p = tryParse(s); if (p) return p
      // 平衡括号提取：定位第一个 { 并扫描到与之匹配的 }（字符串内 {} 不干扰）
      const extractBalanced = (str, open, close) => {
        const start = str.indexOf(open)
        if (start < 0) return null
        let depth = 0, inStr = false, esc = false
        for (let i = start; i < str.length; i++) {
          const ch = str[i]
          if (inStr) {
            if (esc) esc = false
            else if (ch === '\\') esc = true
            else if (ch === '"') inStr = false
            continue
          }
          if (ch === '"') { inStr = true; continue }
          if (ch === open) depth++
          else if (ch === close) { depth--; if (depth === 0) return str.slice(start, i + 1) }
        }
        return null
      }
      let cand = extractBalanced(s, '{', '}')
      if (cand) { p = tryParse(cand); if (p) return p }
      cand = extractBalanced(s, '[', ']')
      if (cand) { p = tryParse(cand); if (p) return p }
      // 回退：从后往前尝试每一个 } 作为结束点（处理模型输出被截断/夹带文本）
      const st = s.indexOf('{')
      if (st >= 0) {
        let back = s.lastIndexOf('}')
        while (back > st) { p = tryParse(s.slice(st, back + 1)); if (p) return p; back = s.lastIndexOf('}', back - 1) }
      }
      return null
    }
    async function modelRoute() {
      if (agentDefaultModel && typeof agentDefaultModel.currentSelection === 'function') {
        try { const sel = agentDefaultModel.currentSelection(); if (sel && sel.provider && sel.model) return { provider: sel.provider, model: sel.model } } catch (e) {}
      }
      const svc = llmResolve()
      if (svc && typeof svc.listProviders === 'function') {
        try {
          const providers = svc.listProviders()
          if (providers && providers.length && providers[0].id) {
            try { const models = await svc.listModels(providers[0].id); if (models && models.length && models[0].id) return { provider: providers[0].id, model: models[0].id } } catch (e) {}
          }
        } catch (e) {}
      }
      return null
    }
    async function llmText(route, system, userPrompt, maxTokens) {
      const textParts = []; const reasonParts = []; let failed = null
      try {
        const stream = llm.stream({
          provider: route.provider, model: route.model, temperature: 0.2, maxTokens: maxTokens || 2000, system: system,
          messages: [{ id: 'docsuite-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), role: 'user', content: [{ type: 'text', text: userPrompt }], source: { kind: 'user' } }],
        })
        for await (const chunk of stream) {
          if (chunk.type === 'text-delta') textParts.push(chunk.text)
          else if (chunk.type === 'reasoning-delta') reasonParts.push(chunk.text)
          else if (chunk.type === 'finish') { const reason = chunk.reason; if (reason && (reason.kind === 'error' || reason.kind === 'aborted')) failed = (reason.failure && reason.failure.message) || reason.kind }
        }
      } catch (e) { failed = String((e && e.message) || e) }
      if (failed) return { ok: false, message: failed }
      return { ok: true, text: textParts.join(''), reasoning: reasonParts.join('') }
    }
    function normalizeParams(rawParams) {
      if (!Array.isArray(rawParams)) return []
      return rawParams.map((p) => ({ name: String((p && p.name) || '').slice(0, 60), value: String((p && p.value) || '').slice(0, 60), unit: String((p && p.unit) || '').slice(0, 20), desc: String((p && p.desc) || '').slice(0, 200) })).filter((p) => p.name)
    }
    function validCategory(c) { return typeof c === 'string' ? c.slice(0, 20) : '' }

    // ---- 模板（M2） ----
    function normalizeSections(input) {
      if (!Array.isArray(input)) return []
      return input.filter((s) => s && typeof s === 'object').map((s, i) => ({ id: 's-' + Date.now().toString(36) + '-' + i + '-' + Math.random().toString(36).slice(2, 5), title: String(s.title || '').slice(0, 120), desc: String(s.desc || '').slice(0, 300), children: normalizeSections(s.children) }))
    }
    async function findTemplate(id) {
      if (!id) return null
      const dir = await dataDir()
      for (const sub of ['learned', 'manual']) { const item = await readJson(joinPath(dir, 'templates', sub, id + '.json')); if (item) return item }
      return null
    }
    async function writeTemplate(tpl) {
      const sub = tpl.kind === 'manual' ? 'manual' : 'learned'
      const dir = joinPath(await dataDir(), 'templates', sub)
      await ensureDir(dir); await writeJson(joinPath(dir, tpl.id + '.json'), tpl)
    }
    async function listTemplates() {
      const dir = await dataDir(); const out = []
      for (const sub of ['learned', 'manual']) {
        const d = joinPath(dir, 'templates', sub)
        try {
          const target = await fs.resolve(d); const info = await fs.stat(target); if (!info) continue
          const entries = await fs.listDir(target)
          for (const e of entries) {
            const nm = e.name || String(e.path || e.target || '').split(/[\\/]/).pop()
            if (!/\.json$/i.test(nm)) continue
            const item = await readJson(joinPath(d, nm)); if (item && item.id) out.push(item)
          }
        } catch (e) {}
      }
      out.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      return out
    }
    async function learnTemplate(args) {
      if (!args || !args.fileName || !args.base64) return { ok: false, message: '缺少文件' }
      const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const dir = await dataDir(); const id = 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const tmpDir = joinPath(dir, 'templates', 'tmp', id)
      await ensureDir(tmpDir); await writeTextFile(joinPath(tmpDir, 'upload.b64'), String(args.base64))
      const scriptPath = joinPath(dir, 'scripts', 'ingest_file.py')
      const safeName = String(args.fileName).replace(/"/g, '')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + joinPath(tmpDir, 'upload.b64') + '" "' + tmpDir + '" "' + safeName + '"' }))
      let text = ''
      try { const t = await fs.resolve(joinPath(tmpDir, 'extracted.txt')); const st = await fs.stat(t); if (st) text = await readTextTolerant(t) } catch (e) { text = '' }
      if (!text) return { ok: false, message: '文本抽取失败：' + pickStdout(res).slice(0, 300) }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const kindName = KIND_NAMES[args.docKind] || '技术文档'
      const system = '你是文档结构分析专家。你擅长从历史文档中归纳章节结构、层级关系和写作风格。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '请分析以下' + kindName + '文档，归纳章节结构（含层级）sections，并总结写作风格 style（语气/表格偏好/典型图表/篇幅/其他）。\n输出 JSON：{"sections": [{"title": "章节标题", "desc": "要点", "children": []}], "style": {"tone": "", "tablePreference": "", "typicalCharts": [], "lengthPerSection": "", "writingStyle": ""}}\n\n文档文本（前 30000 字符）：\n' + text.slice(0, 30000)
      const res2 = await llmText(route, system, userPrompt, 8000)
      if (!res2.ok) return { ok: false, message: '模型调用失败：' + res2.message }
      const effective = res2.text || res2.reasoning || ''
      const parsed = parseModelJson(effective) || parseModelJson(res2.reasoning || '') || parseModelJson(res2.text || '')
      if (!parsed) {
        try { const dbgDir = joinPath(dir, 'templates', 'debug'); await ensureDir(dbgDir); await writeJson(joinPath(dbgDir, id + '.json'), { id: id, at: new Date().toISOString(), fileName: safeName, text: (res2.text || '').slice(0, 4000), reasoning: (res2.reasoning || '').slice(0, 4000) }) } catch (e) {}
        return { ok: false, message: '模型输出解析失败，请重试', rawPreview: effective.slice(0, 400) }
      }
      const style = parsed.style && typeof parsed.style === 'object' ? parsed.style : {}
      const tpl = {
        id: id, kind: 'learned', name: (args.name && String(args.name).trim()) || safeName.replace(/\.[^.]+$/, ''),
        docKind: DOC_KINDS.indexOf(args.docKind) >= 0 ? args.docKind : 'tech', sourceFiles: [safeName],
        language: /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en', sections: normalizeSections(parsed.sections),
        style: { tone: String(style.tone || '').slice(0, 200), tablePreference: String(style.tablePreference || '').slice(0, 200), typicalCharts: Array.isArray(style.typicalCharts) ? style.typicalCharts.map(String).slice(0, 20) : [], lengthPerSection: String(style.lengthPerSection || '').slice(0, 200), writingStyle: String(style.writingStyle || '').slice(0, 500) },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      await writeTemplate(tpl)
      try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force -Recurse "' + tmpDir.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })) } catch (e) {}
      return { ok: true, template: tpl }
    }
    async function createManualTemplate(args) {
      const id = 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const tpl = { id: id, kind: 'manual', name: String((args && args.name) || '未命名模板').slice(0, 120), docKind: DOC_KINDS.indexOf(args && args.docKind) >= 0 ? args.docKind : 'tech', sourceFiles: [], language: 'zh', sections: [{ id: 's-' + Date.now().toString(36) + '-0', title: '1 概述', desc: '项目背景、目标与范围', children: [] }], style: { tone: '', tablePreference: '', typicalCharts: [], lengthPerSection: '', writingStyle: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await writeTemplate(tpl)
      return { ok: true, template: tpl }
    }
    async function updateTemplate(args) {
      const tpl = await findTemplate(args && args.id)
      if (!tpl) return { ok: false, message: '模板不存在' }
      const patch = (args && args.patch) || {}
      if (patch.name !== undefined) tpl.name = String(patch.name).slice(0, 120)
      if (patch.docKind !== undefined && DOC_KINDS.indexOf(patch.docKind) >= 0) tpl.docKind = patch.docKind
      if (patch.sections !== undefined) tpl.sections = normalizeSections(patch.sections)
      if (patch.style !== undefined && typeof patch.style === 'object') { const st = patch.style; tpl.style = Object.assign({}, tpl.style || {}, { tone: String(st.tone || '').slice(0, 200), tablePreference: String(st.tablePreference || '').slice(0, 200), typicalCharts: Array.isArray(st.typicalCharts) ? st.typicalCharts.map(String).slice(0, 20) : (tpl.style && tpl.style.typicalCharts) || [], lengthPerSection: String(st.lengthPerSection || '').slice(0, 200), writingStyle: String(st.writingStyle || '').slice(0, 500) }) }
      tpl.updatedAt = new Date().toISOString(); await writeTemplate(tpl)
      return { ok: true, template: tpl }
    }
    async function deleteTemplate(args) {
      const id = args && args.id; if (!id) return { ok: false, message: '缺少 id' }
      const dir = await dataDir()
      for (const sub of ['learned', 'manual']) {
        const p = joinPath(dir, 'templates', sub, id + '.json')
        try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force "' + p.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })); else { const t = await fs.resolve(p); await fs.writeText(t, '') } } catch (e) { try { const t = await fs.resolve(p); await fs.writeText(t, '') } catch (e2) {} }
      }
      return { ok: true }
    }

    // ---- 知识库（M1+M5） ----
    let indexCache = null; let indexDirty = true
    function tokenize(text) {
      const out = []; const s = String(text || '').toLowerCase()
      const words = s.match(/[a-z0-9][a-z0-9._+\-]*/g) || []
      for (const w of words) out.push(w)
      const cleaned = s.replace(/[^\u4e00-\u9fff]/g, ' ').replace(/\s+/g, '')
      for (let i = 0; i < cleaned.length; i++) { out.push(cleaned.charAt(i)); if (i + 1 < cleaned.length) out.push(cleaned.substr(i, 2)) }
      return out
    }
    async function readItem(id) { return readJson(joinPath(await dataDir(), 'kb', 'items', id + '.json')) }
    async function writeItem(item) { await ensureDir(joinPath(await dataDir(), 'kb', 'items')); await writeJson(joinPath(await dataDir(), 'kb', 'items', item.id + '.json'), item) }
    async function reconcileOrphans() {
      if (!fs) return
      const dir = await dataDir(); const sourcesDir = joinPath(dir, 'kb', 'sources')
      try {
        const sTarget = await fs.resolve(sourcesDir); const sInfo = await fs.stat(sTarget); if (!sInfo) return
        const entries = await fs.listDir(sTarget)
        for (const e of entries) {
          const id = e.name || String(e.path || e.target || '').split(/[\\/]/).pop()
          if (!id || id.indexOf('kb_') !== 0) continue
          const existing = await readItem(id); if (existing) continue
          let textLen = 0
          try { const t = await fs.resolve(joinPath(sourcesDir, id, 'extracted.txt')); const st = await fs.stat(t); if (st) textLen = (await readTextTolerant(t)).length } catch (e2) { textLen = 0 }
          let fileName = ''
          try {
            const fTarget = await fs.resolve(joinPath(sourcesDir, id)); const fEntries = await fs.listDir(fTarget)
            for (const fe of fEntries) { const fn = fe.name || String(fe.path || fe.target || '').split(/[\\/]/).pop(); if (fn && fn !== 'extracted.txt' && fn !== 'upload.b64') { fileName = fn; break } }
          } catch (e3) {}
          const name = fileName ? fileName.replace(/\.[^.]+$/, '') : id
          const item = { id: id, type: 'upload', name: name, title: name, manufacturer: '', model: '', category: '其他', tags: [], params: [], summary: '', sourceFiles: fileName ? [fileName] : [], lang: '', textLen: textLen, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          await writeItem(item)
        }
      } catch (e) {}
    }
    function slim(item) { return { id: item.id, type: item.type || 'upload', name: item.name || '', title: item.title || '', manufacturer: item.manufacturer || '', model: item.model || '', category: item.category || '', tags: item.tags || [], params: item.params || [], summary: item.summary || '', sourceFiles: item.sourceFiles || [], sourceDir: item.sourceDir || '', url: item.url || '', ocr: !!item.ocr, textLen: item.textLen || 0, enrichedAt: item.enrichedAt || '', createdAt: item.createdAt || '', updatedAt: item.updatedAt || '' } }
    async function listItems() {
      const dir = joinPath(await dataDir(), 'kb', 'items')
      if (!fs) return []
      try {
        const target = await fs.resolve(dir); const info = await fs.stat(target); if (!info) return []
        const entries = await fs.listDir(target); const out = []
        for (const e of entries) { const nm = e.name || String(e.path || e.target || '').split(/[\\/]/).pop(); if (!/\.json$/i.test(nm)) continue; const item = await readJson(joinPath(dir, nm)); if (item && item.id) out.push(item) }
        out.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        return out
      } catch (e) { return [] }
    }
    // 全部可选分类：内置默认 + 知识库中已使用过的分类（去重），供下拉选择/自由输入
    async function allCategories() {
      const set = new Set()
      for (const c of CATEGORIES) set.add(c)
      const items = await listItems()
      for (const it of items) { const c = String(it.category || '').trim(); if (c) set.add(c) }
      return Array.from(set)
    }
    async function ensureIndex() {
      if (indexCache && !indexDirty) return indexCache
      await reconcileOrphans()
      const items = await listItems(); const terms = new Map(); const byId = new Map(); const dir = await dataDir()
      for (const item of items) {
        byId.set(item.id, item)
        const fields = { title: (item.name || '') + ' ' + (item.title || ''), model: item.model || '', manufacturer: item.manufacturer || '', category: item.category || '', tags: (item.tags || []).join(' '), params: (item.params || []).map((p) => (p.name || '') + ' ' + (p.value || '') + ' ' + (p.unit || '')).join(' '), summary: item.summary || '' }
        const weightMap = { title: 3, model: 3, manufacturer: 2, category: 2, tags: 2, params: 2, summary: 1 }
        for (const key in fields) {
          const w = weightMap[key] || 1
          for (const tok of tokenize(fields[key])) { let m = terms.get(tok); if (!m) { m = new Map(); terms.set(tok, m) } m.set(item.id, (m.get(item.id) || 0) + w) }
        }
        let body = ''
        try { const t = await fs.resolve(joinPath(dir, 'kb', 'sources', item.sourceDir || item.id, 'extracted.txt')); const st = await fs.stat(t); if (st) body = (await readTextTolerant(t)).slice(0, 20000) } catch (e) { body = '' }
        for (const tok of tokenize(body)) { let m = terms.get(tok); if (!m) { m = new Map(); terms.set(tok, m) } m.set(item.id, (m.get(item.id) || 0) + 1) }
      }
      indexCache = { terms: terms, byId: byId }; indexDirty = false
      return indexCache
    }
    function markDirty() { indexDirty = true; indexCache = null }
    async function searchItems(args) {
      const q = String((args && args.q) || '').trim()
      const idx = await ensureIndex()
      if (!q) return { items: [], total: 0 }
      const toks = tokenize(q); const scores = new Map(); const matched = new Map()
      for (const tok of toks) {
        const m = idx.terms.get(tok); if (!m) continue
        for (const entry of m) { const id = entry[0]; const c = entry[1]; scores.set(id, (scores.get(id) || 0) + c); const arr = matched.get(id) || []; if (arr.indexOf(tok) < 0) arr.push(tok); matched.set(id, arr) }
      }
      const out = []
      for (const entry of scores) {
        const id = entry[0]; const score = entry[1]; const item = idx.byId.get(id); if (!item) continue
        if (args && args.category && item.category !== args.category) continue
        if (args && args.tag) { const tag = String(args.tag).toLowerCase(); if (!(item.tags || []).some((t) => String(t).toLowerCase().indexOf(tag) >= 0)) continue }
        out.push(Object.assign(slim(item), { score: score, matched: matched.get(id) || [] }))
      }
      out.sort((a, b) => b.score - a.score)
      const total = out.length; const page = (args && args.page) || 1; const pageSize = (args && args.pageSize) || 20; const start = (page - 1) * pageSize
      return { items: out.slice(start, start + pageSize), total: total }
    }
    async function uploadItem(args) {
      if (!args || !args.fileName || !args.base64) return { ok: false, message: '缺少文件或内容' }
      const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
      const dir = await dataDir(); const id = 'kb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const outdir = joinPath(dir, 'kb', 'sources', id)
      await ensureDir(outdir); await writeTextFile(joinPath(outdir, 'upload.b64'), String(args.base64))
      const scriptPath = joinPath(dir, 'scripts', 'ingest_file.py'); const safeName = String(args.fileName).replace(/"/g, '')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + joinPath(outdir, 'upload.b64') + '" "' + outdir + '" "' + safeName + '"' }))
      const out = pickStdout(res); let parsed = null
      const lines = out.split('\n')
      for (let i = lines.length - 1; i >= 0; i--) { const line = lines[i].trim(); if (line.charAt(0) === '{') { try { parsed = JSON.parse(line); break } catch (e) {} } }
      if (!parsed || !parsed.ok) {
        let textLen = 0
        try { const t = await fs.resolve(joinPath(outdir, 'extracted.txt')); const st = await fs.stat(t); if (st) textLen = (await readTextTolerant(t)).length } catch (e) { textLen = 0 }
        if (textLen > 0) parsed = { ok: true, textLen: textLen }
        else return { ok: false, message: '文本解析失败：' + out.slice(0, 500) + (stderrOf(res) ? ' | 错误：' + stderrOf(res).slice(0, 300) : '') }
      }
      let ocrDone = false
      // 扫描件 PDF 自动 OCR
      if (/^.*\.pdf$/i.test(safeName) && parsed.textLen < 30) {
        const pdfPath = joinPath(outdir, safeName)
        const ocrOut = joinPath(outdir, 'extracted.txt')
        const ocrR = await ocrPdfFile(pdfPath, ocrOut)
        if (ocrR.ok) {
          let ocrLen = 0
          try { const t = await fs.resolve(ocrOut); const st = await fs.stat(t); if (st) ocrLen = (await readTextTolerant(t)).length } catch (e) { ocrLen = 0 }
          if (ocrLen > 30) { parsed.textLen = ocrLen; ocrDone = true }
        }
      }
      const item = { id: id, type: 'upload', name: args.name || safeName, title: args.name || safeName, manufacturer: args.manufacturer || '', model: args.model || '', category: args.category ? String(args.category).slice(0, 20) : '其他', tags: Array.isArray(args.tags) ? args.tags : [], params: [], summary: '', sourceFiles: [safeName], lang: '', ocr: ocrDone, textLen: parsed.textLen || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await writeItem(item)
      try { const t = await fs.resolve(joinPath(outdir, 'upload.b64')); await fs.writeText(t, '') } catch (e) {}
      markDirty()
      return { ok: true, item: slim(item) }
    }
    async function reOcrItem(args) {
      const id = args && args.id; const item = await readItem(id); if (!item) return { ok: false, message: '条目不存在' }
      const srcId = item.sourceDir || id; const dir = await dataDir(); const sDir = joinPath(dir, 'kb', 'sources', srcId)
      let pdfPath = ''
      try {
        const entries = await fs.listDir(await fs.resolve(sDir))
        for (const e of entries) { const fn = e.name || String(e.path || e.target || '').split(/[\\/]/).pop(); if (/\.pdf$/i.test(fn)) { pdfPath = joinPath(sDir, fn); break } }
      } catch (e) {}
      if (!pdfPath) return { ok: false, message: '未找到源 PDF 文件' }
      const ocrOut = joinPath(sDir, 'extracted.txt')
      const r = await ocrPdfFile(pdfPath, ocrOut)
      if (!r.ok) return r
      let ocrLen = 0
      try { const t = await fs.resolve(ocrOut); const st = await fs.stat(t); if (st) ocrLen = (await readTextTolerant(t)).length } catch (e) { ocrLen = 0 }
      item.textLen = ocrLen; item.ocr = true; item.updatedAt = new Date().toISOString()
      await writeItem(item); markDirty()
      return { ok: true, item: slim(item) }
    }
    async function createManual(args) {
      const id = 'kb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const item = { id: id, type: 'manual', name: args.name || '未命名', title: args.name || '未命名', manufacturer: args.manufacturer || '', model: args.model || '', category: args.category ? String(args.category).slice(0, 20) : '其他', tags: Array.isArray(args.tags) ? args.tags : [], params: Array.isArray(args.params) ? args.params.map((p) => ({ name: String(p.name || ''), value: String(p.value || ''), unit: String(p.unit || ''), desc: String(p.desc || '') })) : [], summary: args.summary || '', sourceFiles: [], lang: '', textLen: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await writeItem(item); markDirty()
      return { ok: true, item: slim(item) }
    }
    async function updateItem(args) {
      const item = await readItem(args && args.id); if (!item) return { ok: false, message: '条目不存在' }
      const patch = (args && args.patch) || {}
      for (const k of ['name', 'title', 'manufacturer', 'model', 'category', 'tags', 'params', 'summary']) { if (patch[k] !== undefined) item[k] = patch[k] }
      if (!item.category) item.category = '其他'
      item.updatedAt = new Date().toISOString(); await writeItem(item); markDirty()
      return { ok: true, item: slim(item) }
    }
    async function deleteItem(args) {
      const id = args && args.id; if (!id) return { ok: false, message: '缺少 id' }
      const dir = await dataDir(); const jsonPath = joinPath(dir, 'kb', 'items', id + '.json'); const srcDir = joinPath(dir, 'kb', 'sources', id)
      try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force -Recurse "' + jsonPath.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue; Remove-Item -Force -Recurse "' + srcDir.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })); else { const t = await fs.resolve(jsonPath); await fs.writeText(t, '') } } catch (e) { try { const t = await fs.resolve(jsonPath); await fs.writeText(t, '') } catch (e2) {} }
      markDirty(); return { ok: true }
    }
    async function compareItems(args) {
      const ids = Array.isArray(args && args.ids) ? args.ids : []; const items = []
      for (const id of ids) { const it = await readItem(id); if (it) items.push(it) }
      const rows = []; const basic = [['名称', (i) => i.name || ''], ['厂家', (i) => i.manufacturer || ''], ['型号', (i) => i.model || ''], ['分类', (i) => i.category || '']]
      for (const pair of basic) rows.push({ key: 'basic:' + pair[0], label: pair[0], values: items.map(pair[1]) })
      const paramNames = []; const paramMap = new Map()
      for (const it of items) { for (const p of (it.params || [])) { const key = String(p.name || '').trim(); if (!key) continue; if (!paramMap.has(key)) { paramMap.set(key, []); paramNames.push(key) } paramMap.get(key).push(String((p.value || '') + (p.unit ? ' ' + p.unit : '')).trim()) } }
      for (const name of paramNames) { const vals = paramMap.get(name); rows.push({ key: 'param:' + name, label: name, values: items.map((_, idx) => vals[idx] || '—') }) }
      return { items: items.map((i) => ({ id: i.id, name: i.name || '' })), rows: rows }
    }
    async function sourceItem(args) {
      const item = await readItem(args && args.id); if (!item || !item.sourceFiles || !item.sourceFiles.length) return { ok: false, message: '该条目无源文件' }
      const file = item.sourceFiles[0]; const p = joinPath(await dataDir(), 'kb', 'sources', item.sourceDir || item.id, file)
      try {
        const t = await fs.resolve(p); const info = await fs.stat(t); if (!info) return { ok: false, message: '源文件不存在' }
        const bytes = await fs.readBytes(t, undefined, 100 * 1024 * 1024); let bin = ''
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        return { ok: true, fileName: file, base64: btoa(bin), size: bytes.length }
      } catch (e) { return { ok: false, message: String((e && e.message) || e) } }
    }
    async function previewItem(args) {
      const item = await readItem(args && args.id); const srcId = (item && item.sourceDir) || (args && args.id)
      const p = joinPath(await dataDir(), 'kb', 'sources', srcId, 'extracted.txt')
      try { const t = await fs.resolve(p); const info = await fs.stat(t); if (!info) return { ok: true, text: '', total: 0 }; const text = await readTextTolerant(t); return { ok: true, text: text.slice(0, 3000), total: text.length } } catch (e) { return { ok: true, text: '', total: 0 } }
    }
    async function enrichItem(args) {
      const id = args && args.id; if (!id) return { ok: false, message: '缺少 id' }; if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const item = await readItem(id); if (!item) return { ok: false, message: '条目不存在' }
      const dir = await dataDir(); const srcId = item.sourceDir || id
      const textPath = joinPath(dir, 'kb', 'sources', srcId, 'extracted.txt')
      let text = ''; let readErr = ''
      try { const t = await fs.resolve(textPath); const info = await fs.stat(t); if (info) text = (await readTextTolerant(t)).slice(0, 50000) } catch (e) { readErr = String((e && e.message) || e) }
      if (!text) return { ok: false, message: '该条目无可抽取的文本（目录:' + dir + '；路径:' + textPath + (readErr ? '；错误:' + readErr : '；文件存在但内容为空') + '）' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const system = '你是水下机器人（ROV/AUV）领域的资深技术文档分析助手。你擅长识别不同型号并提取结构化技术参数、撰写精炼摘要。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '识别文档中所有型号，为每个型号分别提取关键技术参数（8-20 项：工作频率、探测范围、量程、精度、分辨率、功耗、工作电压、接口、工作深度、耐压等级等）并各写 2-3 句中文摘要。\n【重要】文档中可能包含「表格数据」：表格用 | 分隔每行的各列，同一行各列表示【同一个型号】的一组参数（第一行常为表头，如：型号|参数1|参数2|...）。请严格按表格的行列对应关系识别每个型号及其参数，确保参数归属到正确的型号，不要张冠李戴；正文中提及的参数也要并入对应型号。\n设备名称：' + (item.name || '') + '\n厂家：' + (item.manufacturer || '') + '\n\n输出 JSON：{"models": [{"model": "型号标识", "name": "产品名称", "category": "分类（传感器归入 导航定位|通信遥测|能源电池|通用设备，执行单元如 推进器/机械爪/云台/灯组 归入 推进动力|作业工具，也可用更具体的自定义分类如 声呐|深度计|推进器|机械手），其他不匹配归 其他", "params": [{"name": "参数名", "value": "数值", "unit": "单位", "desc": "说明"}], "summary": "2-3句中文摘要"}]}\n\n说明书文本（含表格，| 分隔每行各列）：\n' + text
      const res = await llmText(route, system, userPrompt, 9000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const effective = res.text || res.reasoning || ''
      let parsed = parseModelJson(effective)
      if (!parsed) {
        // 自动重试一次：模型可能只输出思考/夹带文字而未输出 JSON，带纠错提示重新调用
        const retryPrompt = '你上次的回答没有包含有效的 JSON，无法解析。请重新回答并严格遵守：只输出一个 JSON 对象，不要输出任何解释、思考过程、Markdown 代码块或其他文字。注意按表格（| 分隔）的行列对应关系确保参数归属正确型号。\n\n设备名称：' + (item.name || '') + '\n\n你上次的回答：\n' + effective.slice(0, 3000) + '\n\n请只输出 JSON：{"models": [{"model": "型号标识", "name": "产品名称", "category": "分类", "params": [{"name": "参数名", "value": "数值", "unit": "单位", "desc": "说明"}], "summary": "2-3句中文摘要"}]}'
        const res2 = await llmText(route, system, retryPrompt, 6000)
        if (!res2.ok) return { ok: false, message: '模型调用失败：' + res2.message }
        const effective2 = res2.text || res2.reasoning || ''
        parsed = parseModelJson(effective2)
        if (!parsed) { try { const dbgDir = joinPath(dir, 'kb', 'enrich-debug'); await ensureDir(dbgDir); await writeJson(joinPath(dbgDir, id + '.json'), { id: id, at: new Date().toISOString(), attempt1: { text: res.text.slice(0, 2000), reasoning: (res.reasoning || '').slice(0, 2000) }, attempt2: { text: res2.text.slice(0, 2000), reasoning: (res2.reasoning || '').slice(0, 2000) } }) } catch (e) {} return { ok: false, message: '模型输出解析失败（已自动重试一次），请再次点击重试', rawPreview: effective2.slice(0, 300) } }
      }
      let models = Array.isArray(parsed.models) ? parsed.models : []
      if (!models.length) models = [{ model: parsed.model || '', name: parsed.name || '', category: parsed.category || '', params: parsed.params || [], summary: parsed.summary || '' }]
      models = models.filter((m) => m && typeof m === 'object')
      if (!models.length) return { ok: false, message: '模型未返回有效型号数据' }
      const first = models[0]
      const firstModel = String(first.model || first.name || item.model || '').slice(0, 80)
      if (first.name) item.name = String(first.name).slice(0, 120)
      if (firstModel) item.model = firstModel
      item.params = normalizeParams(first.params)
      if (first.summary) item.summary = String(first.summary).slice(0, 600)
      const firstCat = validCategory(first.category); if (firstCat) item.category = firstCat
      item.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en'
      item.enrichedAt = new Date().toISOString(); item.updatedAt = new Date().toISOString()
      await writeItem(item)
      const created = []; const baseName = item.name || '设备'
      for (let i = 1; i < models.length; i++) {
        const m = models[i]
        const subId = 'kb_' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
        const subModel = String(m.model || m.name || '').slice(0, 80)
        const subName = String(m.name || (subModel ? baseName + ' ' + subModel : baseName + ' ' + (i + 1))).slice(0, 120)
        const sub = { id: subId, type: 'upload', name: subName, title: subName, manufacturer: item.manufacturer || '', model: subModel, category: validCategory(m.category) || item.category || '其他', tags: Array.isArray(item.tags) ? item.tags.slice() : [], params: normalizeParams(m.params), summary: String(m.summary || '').slice(0, 600), sourceFiles: Array.isArray(item.sourceFiles) ? item.sourceFiles.slice() : [], sourceDir: item.sourceDir || id, lang: item.lang || '', ocr: item.ocr, textLen: item.textLen || 0, enrichedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        await writeItem(sub); created.push(slim(sub))
      }
      markDirty()
      return { ok: true, item: slim(item), items: created, split: models.length > 1, modelCount: models.length, paramsCount: item.params.length, summary: item.summary }
    }

    // ---- 网页抓取（M5） ----
    async function webSearch(args) {
      if (!web) return { ok: false, message: 'web 服务不可用' }
      const query = String((args && args.query) || '').trim()
      if (!query) return { ok: false, message: '请输入搜索关键词' }
      try {
        const res = await web.search({ query: query, maxResults: 10 })
        const sources = ((res && res.sources) || []).map((s) => ({ url: String(s.url || ''), title: String(s.title || ''), snippet: String(s.snippet || '') }))
        return { ok: true, sources: sources, content: String((res && res.content) || '') }
      } catch (e) { return { ok: false, message: '搜索失败：' + String((e && e.message) || e) } }
    }
    async function webImport(args) {
      const url = String((args && args.url) || '').trim()
      const title = String((args && args.title) || '').trim() || url
      if (!url) return { ok: false, message: '缺少 URL' }
      if (!web) return { ok: false, message: 'web 服务不可用' }
      let fetched
      try { fetched = await web.fetch({ url: url }) } catch (e) { return { ok: false, message: '抓取失败：' + String((e && e.message) || e) } }
      if (!fetched || fetched.statusCode >= 400) return { ok: false, message: '抓取失败：HTTP ' + (fetched && fetched.statusCode) }
      const body = fetched.body
      const raw = (body && body.content) ? String(body.content) : ''
      const text = (body && body.kind === 'html') ? stripHtml(raw) : raw
      if (!text || text.length < 10) return { ok: false, message: '页面无有效文本' }
      const dir = await dataDir(); const id = 'kb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const outdir = joinPath(dir, 'kb', 'sources', id)
      await ensureDir(outdir)
      await writeTextFile(joinPath(outdir, 'extracted.txt'), text.slice(0, 200000))
      const item = { id: id, type: 'web', name: title.slice(0, 120), title: title.slice(0, 120), manufacturer: '', model: '', category: '其他', tags: ['网页'], params: [], summary: '', sourceFiles: [title.slice(0, 120)], url: url, lang: /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en', textLen: text.length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await writeItem(item); markDirty()
      return { ok: true, item: slim(item) }
    }

    // ---- 数据目录迁移（M5） ----
    async function migrateData(args) {
      const target = String((args && args.targetDir) || '').trim()
      if (!target) return { ok: false, message: '请输入目标目录' }
      const dir = await dataDir()
      if (target.toLowerCase() === dir.toLowerCase()) return { ok: false, message: '目标目录与当前目录相同' }
      if (!shell) return { ok: false, message: 'shell 服务不可用' }
      // 预检：插件的 fs/shell 沙箱（workspace-write）只允许写入 workspaceRoot 及系统临时目录。
      // 迁移目标必须位于这些可写根内，否则写 config.json 会被沙箱拒绝（FS_SANDBOX_DENIED）。
      const targetNorm0 = target.replace(/[\\/]+$/, '')
      const wsRoot = workspaceRoot ? String(workspaceRoot).replace(/[\\/]+$/, '') : ''
      const okTarget = !wsRoot || targetNorm0.toLowerCase() === wsRoot.toLowerCase() || targetNorm0.toLowerCase().startsWith(wsRoot.toLowerCase() + '\\') || targetNorm0.toLowerCase().startsWith(wsRoot.toLowerCase() + '/')
      if (!okTarget) return { ok: false, message: '目标目录不在插件可写范围内：当前会话沙箱（workspace-write）只允许数据目录位于工作区根 ' + wsRoot + ' 或其子目录（或系统临时目录）。请选择 ' + wsRoot + ' 下的目录作为新数据目录。' }
      const targetNorm = target.replace(/[\\/]+$/, '')
      try {
        await ensureDir(targetNorm)
        const robocopyCmd = 'robocopy "' + dir + '" "' + targetNorm + '" /E /COPY:DAT /R:1 /W:1 /NFL /NDL /NJH /NJS'
        const rc = await shell.run(shell.resolve({ command: robocopyCmd }))
        const rcCode = exitCodeOf(rc)
        if (rcCode != null && rcCode >= 8) return { ok: false, message: '复制失败（robocopy 退出码 ' + rcCode + '）：' + pickStdout(rc).slice(0, 300) }
        const cfg = await readJson(joinPath(targetNorm, 'config.json'))
        if (cfg && typeof cfg === 'object') {
          cfg.dataDir = targetNorm
          await writeTextFile(joinPath(targetNorm, 'config.json'), JSON.stringify(cfg, null, 2))
        } else {
          const newCfg = Object.assign({}, DEFAULT_CONFIG, { dataDir: targetNorm })
          await writeTextFile(joinPath(targetNorm, 'config.json'), JSON.stringify(newCfg, null, 2))
        }
        rootDir = targetNorm
        CONFIG_PATH = joinPath(targetNorm, 'config.json')
        indexCache = null; indexDirty = true
        await shell.run(shell.resolve({ command: 'Remove-Item -Force -Recurse "' + dir.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' }))
        return { ok: true, dataDir: targetNorm }
      } catch (e) { return { ok: false, message: '迁移失败：' + String((e && e.message) || e) } }
    }

    // ---- 文档项目（M3） ----
    async function readProj(id) { return readJson(joinPath(await dataDir(), 'projects', id + '.json')) }
    async function writeProj(proj) { await ensureDir(joinPath(await dataDir(), 'projects')); await writeJson(joinPath(await dataDir(), 'projects', proj.id + '.json'), proj) }
    async function listProjs() {
      const dir = joinPath(await dataDir(), 'projects')
      if (!fs) return []
      try {
        const target = await fs.resolve(dir); const info = await fs.stat(target); if (!info) return []
        const entries = await fs.listDir(target); const out = []
        for (const e of entries) { const nm = e.name || String(e.path || e.target || '').split(/[\\/]/).pop(); if (!/\.json$/i.test(nm)) continue; const item = await readJson(joinPath(dir, nm)); if (item && item.id) out.push(item) }
        out.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        return out
      } catch (e) { return [] }
    }
    function cloneOutline(nodes) { return (nodes || []).map((n) => ({ id: 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6), title: String(n.title || '').slice(0, 120), desc: String(n.desc || '').slice(0, 300), children: cloneOutline(n.children) })) }
    function findNode(nodes, id) { for (const n of nodes || []) { if (n.id === id) return n; const f = findNode(n.children, id); if (f) return f } return null }
    function leafNodes(outline) {
      const out = []; const walk = (list, path) => { for (const n of list || []) { const p = path.concat([n]); if (n.children && n.children.length) walk(n.children, p); else out.push(p) } }; walk(outline, []); return out
    }
    async function updateStatus(proj) {
      const leaves = leafNodes(proj.outline || [])
      const done = leaves.filter((l) => proj.sections && proj.sections[l[l.length - 1].id]).length
      proj.status = !leaves.length ? 'draft' : done === leaves.length && done > 0 ? 'done' : done > 0 ? 'writing' : 'outline'
      proj.updatedAt = new Date().toISOString()
    }
    async function createProject(args) {
      const id = 'proj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const tpl = await findTemplate(args && args.templateRef)
      const techTpl = args && args.kind === 'bid' ? await findTemplate(args.techTemplateRef) : null
      const proj = {
        id: id, kind: DOC_KINDS.indexOf(args && args.kind) >= 0 ? args.kind : 'tech',
        title: String((args && args.title) || '未命名项目').slice(0, 120), topic: String((args && args.topic) || '').slice(0, 2000),
        lang: (args && args.lang) === 'en' ? 'en' : 'zh',
        templateRef: tpl ? tpl.id : '', templateName: tpl ? tpl.name : '',
        techTemplateRef: techTpl ? techTpl.id : '', techTemplateName: techTpl ? techTpl.name : '',
        machineType: args && args.machineType ? String(args.machineType).slice(0, 20) : '',
        robotSpec: { machineType: args && args.machineType ? String(args.machineType).slice(0, 20) : '', params: [], sensors: [] },
        outline: tpl ? cloneOutline(tpl.sections) : [],
        sections: {}, references: {}, bidMatrix: [], bidTerms: {}, bidSchedule: [], bidStructure: { compileRequirement: '', sections: [] },
        status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      await updateStatus(proj); await writeProj(proj)
      return { ok: true, project: proj }
    }
    async function deleteProject(args) {
      const id = args && args.id; if (!id) return { ok: false, message: '缺少 id' }
      const dir = await dataDir(); const p = joinPath(dir, 'projects', id + '.json')
      try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force "' + p.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })); else { const t = await fs.resolve(p); await fs.writeText(t, '') } } catch (e) { try { const t = await fs.resolve(p); await fs.writeText(t, '') } catch (e2) {} }
      return { ok: true }
    }
    async function genOutline(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      // 用户已提供大纲（上传 MD/JSON 解析结果）→ 直接采用，跳过 LLM
      if (args && args.outline !== undefined) {
        proj.outline = cloneOutline(args.outline); proj.sections = {}; proj.references = {}
        await updateStatus(proj); await writeProj(proj)
        return { ok: true, project: proj, fromUser: true }
      }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const kindName = KIND_NAMES[proj.kind] || '技术文档'
      let tplRef = ''
      if (proj.templateRef) { const t = await findTemplate(proj.templateRef); if (t) tplRef = '\n可参考的整体模板章节结构（可选）：\n' + JSON.stringify(t.sections).slice(0, 2000) }
      const machine = proj.machineType ? '\n机型：' + proj.machineType : ''
      let system = '你是资深' + kindName + '撰写专家。你擅长设计条理清晰、层次合理的文档大纲。你的回答必须只包含一个 JSON 对象。'
      let userPrompt = ''
      if (proj.kind === 'bid') {
        const struct = proj.bidStructure || {}
        let techTplRef = ''
        if (proj.techTemplateRef) { const t = await findTemplate(proj.techTemplateRef); if (t) techTplRef = '\n「技术方案」部分参考技术方案模板结构（可沿用或调整）：\n' + JSON.stringify(t.sections).slice(0, 3000) }
        const compileReq = struct.compileRequirement ? '\n招标文件对投标文件编制的要求（须遵循其中的组成、顺序与排版要求）：\n' + struct.compileRequirement : ''
        system = '你是资深投标技术文件撰写专家。你精通招投标文件编制，严格按照招标文件的组成与顺序要求组织标书。你的回答必须只包含一个 JSON 对象。'
        userPrompt = '请为以下投标技术文件设计章节大纲。\n标题：' + proj.title + '\n主题：' + (proj.topic || '') + compileReq + techTplRef + tplRef + '\n\n标书总体结构为三段式：\n1. 响应文件（招标要求响应表、商务条款响应、项目进度计划）——由系统自动生成，你【不要】设计这部分章节。\n2. 技术方案——按招标要求和技术方案模板展开（系统方案概述、系统组成、各分系统技术方案、关键技术、设备选型与参数、可靠性等）。\n3. 售后及服务方案——售后服务承诺、质保方案、操作培训、技术支持、备件供应、应急响应等。\n\n第一层章节请用「第一部分 技术方案」「第二部分 售后及服务方案」命名；若招标文件有明确的编号/排版要求（如必须用「第一章」），遵循招标要求。\n总章节数 10-30 个。输出 JSON：{"outline": [{"title": "第一部分 技术方案", "desc": "要点", "children": [{"title": "1.1 章节", "desc": "要点", "children": []}]}]}'
      } else {
        userPrompt = '请为以下' + kindName + '设计章节大纲（总章节数 8-30 个，叶子章节要具体可写）。\n标题：' + proj.title + '\n主题描述：' + (proj.topic || '（无）') + machine + tplRef + '\n\n输出 JSON：{"outline": [{"title": "1 章节标题", "desc": "本节要点", "children": [{"title": "1.1 子章节", "desc": "要点", "children": []}]}]}'
      }
      const res = await llmText(route, system, userPrompt, 4000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const parsed = parseModelJson(res.text || res.reasoning || '')
      if (!parsed || !Array.isArray(parsed.outline)) return { ok: false, message: '模型输出解析失败，请重试' }
      proj.outline = cloneOutline(parsed.outline); proj.sections = {}; proj.references = {}
      await updateStatus(proj); await writeProj(proj)
      return { ok: true, project: proj }
    }
    // 读取用户上传的需求/参考文档 → LLM 生成大纲
    async function genOutlineFromDoc(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (!args || !args.fileName || !args.base64) return { ok: false, message: '缺少上传文档' }
      const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const dir = await dataDir(); const id = 'doc_' + Date.now().toString(36)
      const tmpDir = joinPath(dir, 'projects', 'tmp', id); await ensureDir(tmpDir)
      await writeTextFile(joinPath(tmpDir, 'upload.b64'), String(args.base64))
      const scriptPath = joinPath(dir, 'scripts', 'ingest_file.py')
      const safeName = String(args.fileName).replace(/"/g, '')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + joinPath(tmpDir, 'upload.b64') + '" "' + tmpDir + '" "' + safeName + '"' }))
      let text = ''
      try { const t = await fs.resolve(joinPath(tmpDir, 'extracted.txt')); const st = await fs.stat(t); if (st) text = await readTextTolerant(t) } catch (e) { text = '' }
      if (!text || text.length < 30) {
        const pdfPath = joinPath(tmpDir, safeName)
        if (/^.*\.pdf$/i.test(safeName)) {
          const ocrR = await ocrPdfFile(pdfPath, joinPath(tmpDir, 'extracted.txt'))
          if (ocrR.ok) { try { const t = await fs.resolve(joinPath(tmpDir, 'extracted.txt')); const st = await fs.stat(t); if (st) text = await readTextTolerant(t) } catch (e) { text = '' } }
        }
      }
      if (!text) return { ok: false, message: '文档解析失败：' + pickStdout(res).slice(0, 300) }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const kindName = KIND_NAMES[proj.kind] || '技术文档'
      const machine = proj.machineType ? '\n机型：' + proj.machineType : ''
      let tplRef = ''
      if (proj.templateRef) { const t = await findTemplate(proj.templateRef); if (t) tplRef = '\n可参考的整体模板章节结构（可选）：\n' + JSON.stringify(t.sections).slice(0, 2000) }
      let system = '你是资深' + kindName + '撰写专家。你擅长从需求文档/参考资料中提炼文档大纲。你的回答必须只包含一个 JSON 对象。'
      let userPrompt = '请阅读以下需求文档/参考资料，为「' + proj.title + '」设计章节大纲（总章节数 8-30 个，叶子章节要具体可写，覆盖文档中的关键内容）。\n文档标题：' + proj.title + '\n主题描述：' + (proj.topic || '（无）') + machine + tplRef + '\n\n文档内容（前 40000 字符）：\n' + text.slice(0, 40000) + '\n\n输出 JSON：{"outline": [{"title": "1 章节标题", "desc": "本节要点", "children": [{"title": "1.1 子章节", "desc": "要点", "children": []}]}]}'
      const res2 = await llmText(route, system, userPrompt, 5000)
      if (!res2.ok) return { ok: false, message: '模型调用失败：' + res2.message }
      const parsed = parseModelJson(res2.text || res2.reasoning || '')
      if (!parsed || !Array.isArray(parsed.outline)) return { ok: false, message: '模型输出解析失败，请重试' }
      proj.outline = cloneOutline(parsed.outline); proj.sections = {}; proj.references = {}
      proj.topic = (proj.topic || '') + (proj.topic ? '\n' : '') + '（依据上传文档生成大纲：' + safeName + '）'
      await updateStatus(proj); await writeProj(proj)
      try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force -Recurse "' + tmpDir.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })) } catch (e) {}
      return { ok: true, project: proj, sourceDoc: safeName }
    }
    async function saveOutline(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (args && args.outline !== undefined) proj.outline = cloneOutline(args.outline)
      if (args && args.bidMatrix !== undefined) proj.bidMatrix = args.bidMatrix
      await updateStatus(proj); await writeProj(proj)
      return { ok: true, project: proj }
    }
    // 把已确定的机器人边界（基本参数 + 传感器搭载）转为 prompt 文本
    function robotSpecText(proj) {
      const rs = (proj && proj.robotSpec) || {}
      const parts = []
      if (rs.machineType) parts.push('机型：' + rs.machineType)
      if (Array.isArray(rs.params) && rs.params.length) parts.push('基本参数：' + rs.params.map((p) => (p.name || '') + ' ' + (p.value || '') + (p.unit || '') + (p.desc ? '（' + p.desc + '）' : '')).filter(Boolean).join('；'))
      if (Array.isArray(rs.sensors) && rs.sensors.length) parts.push('传感器搭载：' + rs.sensors.map((s) => (s.name || '') + (s.model ? ' ' + s.model : '') + '×' + (s.count || 1) + (s.purpose ? '（' + s.purpose + '）' : '')).filter(Boolean).join('；'))
      return parts.join('\n')
    }
    // AI 生成机器人边界初稿：依据项目主题/机型 + 知识库设备清单
    async function robotSpecDraft(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const items = await listItems()
      const devices = items.filter((it) => (it.model || it.name) && (it.params || []).length).slice(0, 40).map((it) => ({ id: it.id, name: it.name || '', model: it.model || '', manufacturer: it.manufacturer || '', category: it.category || '', params: (it.params || []).slice(0, 10).map((p) => p.name + ' ' + (p.value || '') + (p.unit || '')).join('、'), summary: (it.summary || '').slice(0, 120) }))
      const machine = proj.machineType || (proj.robotSpec && proj.robotSpec.machineType) || 'ROV'
      const system = '你是水下机器人（ROV/AUV）总体设计专家。你擅长为项目确定合理的机器人基本参数与传感器搭载方案。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '请为以下水下机器人项目确定基本参数和传感器搭载方案（AI 初稿，供人工复核修改）。\n项目：' + proj.title + '\n主题：' + (proj.topic || '（无）') + '\n机型：' + machine + '\n\n1. 基本参数 params：给出 8-16 项关键参数（如最大作业深度、最大航速、排水量/空气中重量、外形尺寸、推进器配置、供电方式/电池容量、脐带缆长度、通信方式、最大载荷、工作温度等），格式 [{"name": "参数名", "value": "数值", "unit": "单位", "desc": "说明"}]。\n2. 传感器搭载 sensors：结合下列知识库可用设备，为完成项目任务选择 5-15 项传感器/设备，格式 [{"name": "设备名", "model": "型号", "manufacturer": "厂家", "category": "分类", "count": 数量, "purpose": "搭载用途"}]，务必从知识库设备中选择（含 id 用 "itemId" 字段）。\n\n【重要规则】相同类型的传感器一般只安装一台（count=1），不要重复选择同类设备（例如二维声呐只装一台、深度计只装一台）；执行单元如推进器、机械手、云台可按实际需要多台（count 可为 2-8）。\n\n知识库可用设备：\n' + JSON.stringify(devices) + '\n\n输出 JSON：{"params": [...], "sensors": [{"itemId": "", "name": "", "model": "", "manufacturer": "", "category": "", "count": 1, "purpose": ""}]}'
      const res = await llmText(route, system, userPrompt, 8000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const parsed = parseModelJson(res.text || res.reasoning || '')
      if (!parsed) return { ok: false, message: '初稿生成失败，请重试' }
      const params = (Array.isArray(parsed.params) ? parsed.params : []).filter((p) => p && p.name).slice(0, 20).map((p) => ({ name: String(p.name || '').slice(0, 60), value: String(p.value || '').slice(0, 40), unit: String(p.unit || '').slice(0, 20), desc: String(p.desc || '').slice(0, 200) }))
      const rawSensors = (Array.isArray(parsed.sensors) ? parsed.sensors : []).filter((s) => s && (s.name || s.itemId)).slice(0, 20).map((s) => {
        const dev = devices.find((d) => d.id === s.itemId) || null
        return { itemId: String(s.itemId || ''), name: String(s.name || (dev && dev.name) || '').slice(0, 80), model: String(s.model || (dev && dev.model) || '').slice(0, 60), manufacturer: String(s.manufacturer || (dev && dev.manufacturer) || '').slice(0, 60), category: String(s.category || (dev && dev.category) || '其他').slice(0, 20), count: Math.max(1, parseInt(s.count, 10) || 1), purpose: String(s.purpose || '').slice(0, 200) }
      })
      // 同类传感器去重：测量/探测类（导航定位|通信遥测|能源电池|通用设备|声呐|深度计|传感器等）按名称去重，只保留一台 count=1；执行单元（推进|作业工具|机械|云台|灯）保留
      const sensorLike = (c, n) => /导航定位|通信遥测|能源电池|通用设备/.test(c || '') || /声呐|声纳|深度计|传感器|罗经|换能器|摄像机|相机|惯导|信标|定位|测深|测速|DVL|探照灯|灯/.test(n || '')
      const seen = new Set(); const sensors = []
      for (const s of rawSensors) {
        const key = (s.name || '').trim() || (s.model || '').trim()
        if (sensorLike(s.category, s.name)) {
          if (!key || seen.has(key)) continue
          seen.add(key); s.count = 1
        }
        sensors.push(s)
      }
      return { ok: true, machineType: machine, params: params, sensors: sensors }
    }
    async function saveRobotSpec(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      const rs = (args && args.robotSpec) || {}
      proj.robotSpec = { machineType: String(rs.machineType || proj.machineType || 'ROV').slice(0, 20), params: Array.isArray(rs.params) ? rs.params.filter((p) => p && (p.name || p.value)).map((p) => ({ name: String(p.name || '').slice(0, 60), value: String(p.value || '').slice(0, 40), unit: String(p.unit || '').slice(0, 20), desc: String(p.desc || '').slice(0, 200) })) : [], sensors: Array.isArray(rs.sensors) ? rs.sensors.filter((s) => s && (s.name || s.itemId)).map((s) => ({ itemId: String(s.itemId || ''), name: String(s.name || '').slice(0, 80), model: String(s.model || '').slice(0, 60), manufacturer: String(s.manufacturer || '').slice(0, 60), category: String(s.category || '其他').slice(0, 20), count: Math.max(1, parseInt(s.count, 10) || 1), purpose: String(s.purpose || '').slice(0, 200) })) : [] }
      if (proj.robotSpec.machineType) proj.machineType = proj.robotSpec.machineType
      proj.updatedAt = new Date().toISOString()
      await writeProj(proj)
      return { ok: true, project: proj }
    }
    async function genSection(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      const nodeId = args && args.nodeId; const node = findNode(proj.outline || [], nodeId); if (!node) return { ok: false, message: '章节不存在' }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const query = (node.title || '') + ' ' + (node.desc || '') + ' ' + proj.title
      const kb = await searchItems({ q: query.slice(0, 100), pageSize: 5 })
      let kbText = ''; let refIds = []
      if (kb && kb.items && kb.items.length) {
        refIds = kb.items.map((it) => it.id)
        kbText = '\n\n可参考的知识库资料（从中引用相关参数并标注 [出处]）：\n' + kb.items.map((it) => '- [' + it.name + ']（型号 ' + (it.model || '未知') + '）：' + (it.summary || '') + '；关键参数：' + (it.params || []).slice(0, 8).map((pp) => pp.name + ' ' + (pp.value || '') + (pp.unit || '')).join('、')).join('\n')
      }
      const specText = robotSpecText(proj)
      const kindName = KIND_NAMES[proj.kind] || '技术文档'
      const langHint = proj.lang === 'en' ? 'Write in English.' : '用中文撰写。'
      const system = '你是资深' + kindName + '撰写专家。你撰写的章节内容专业、详实、结构清晰，严格遵循已确定的机器人边界参数。只输出章节正文 Markdown，不要输出章节标题。'
      const userPrompt = '请撰写章节「' + node.title + '」。\n本节要点：' + (node.desc || '（无）') + '\n项目主题：' + proj.title + ' - ' + (proj.topic || '') + (proj.machineType ? '\n机型：' + proj.machineType : '') + (specText ? '\n\n【已确定的机器人边界（撰写时须严格遵循，不得与之矛盾）】\n' + specText : '') + kbText + '\n\n要求：' + langHint + ' 使用 Markdown 格式（可用小标题、列表、表格），内容 400-900 字，专业且具体；引用知识库资料时在正文后标注 [出处：资料名]。'
      const res = await llmText(route, system, userPrompt, 3000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const content = (res.text || res.reasoning || '').trim()
      if (!content) return { ok: false, message: '模型未返回内容' }
      proj.sections = Object.assign({}, proj.sections || {}, { [nodeId]: content })
      proj.references = Object.assign({}, proj.references || {}, { [nodeId]: refIds })
      await updateStatus(proj); await writeProj(proj)
      return { ok: true, project: proj, refs: refIds.length }
    }
    async function saveSection(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      proj.sections = Object.assign({}, proj.sections || {}, { [args.nodeId]: String((args && args.content) || '') })
      await updateStatus(proj); await writeProj(proj)
      return { ok: true, project: proj }
    }
    const refNameCache = new Map()
    async function preloadRefNames(proj) {
      const ids = new Set()
      for (const path of leafNodes(proj.outline || [])) { const id = path[path.length - 1].id; for (const rid of (proj.references && proj.references[id]) || []) ids.add(rid) }
      for (const rid of ids) { if (!refNameCache.has(rid)) { const it = await readItem(rid); refNameCache.set(rid, it ? { name: it.name || rid, model: it.model || '' } : null) } }
    }
    function refName(id) { const v = refNameCache.get(id); return v || null }
    function mdEscapeCell(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>') }
    function bidStatusText(st) {
      if (st === 'full') return '无偏离'
      if (st === 'positive') return '正偏离'
      if (st === 'negative') return '负偏离'
      if (st === 'na') return '不适用'
      if (st === 'pending') return '未应答'
      return st || '未应答'
    }
    function buildMarkdown(proj) {
      const lines = []; lines.push('# ' + proj.title); lines.push('')
      if (proj.topic) lines.push('> ' + proj.topic)
      lines.push('')
      if (proj.kind === 'bid') {
        lines.push('# 第一部分 响应文件'); lines.push('')
        if (proj.bidMatrix && proj.bidMatrix.length) {
          lines.push('## 一、招标要求响应表'); lines.push(''); lines.push('| 序号 | 招标要求 | 响应内容 | 偏离情况 |'); lines.push('| --- | --- | --- | --- |')
          for (const r of proj.bidMatrix) lines.push('| ' + mdEscapeCell(r.no) + ' | ' + mdEscapeCell(r.requirement).slice(0, 300) + ' | ' + mdEscapeCell(r.answer || '（未应答）').slice(0, 400) + ' | ' + mdEscapeCell(bidStatusText(r.status)) + ' |')
          lines.push('')
        }
        const terms = proj.bidTerms || {}
        if (terms.deliveryText || terms.warranty || terms.payment || terms.place) {
          lines.push('## 二、商务条款响应'); lines.push(''); lines.push('| 条款 | 招标要求 | 我方响应 |'); lines.push('| --- | --- | --- |')
          if (terms.deliveryText) lines.push('| 交货期 | ' + mdEscapeCell(terms.deliveryText) + (terms.deliveryDays ? '（约 ' + terms.deliveryDays + ' 天）' : '') + ' | 完全响应，详见项目进度计划 |')
          if (terms.place) lines.push('| 交货地点 | ' + mdEscapeCell(terms.place) + ' | 完全响应 |')
          if (terms.warranty) lines.push('| 质保期 | ' + mdEscapeCell(terms.warranty) + ' | 完全响应 |')
          if (terms.payment) lines.push('| 付款方式 | ' + mdEscapeCell(terms.payment) + ' | 完全响应 |')
          lines.push('')
        }
        if (proj.bidSchedule && proj.bidSchedule.length) {
          lines.push('## 三、项目进度计划（基于交货期推算）'); lines.push('')
          lines.push('合同签订日：' + (proj.contractDate || '—') + '；交货期限：' + ((proj.bidTerms && proj.bidTerms.deliveryText) || ((proj.bidTerms && proj.bidTerms.deliveryDays) ? proj.bidTerms.deliveryDays + ' 天' : '—'))); lines.push('')
          lines.push('| 阶段 | 开始日期 | 结束日期 | 工作内容 |'); lines.push('| --- | --- | --- | --- |')
          for (const s of proj.bidSchedule) lines.push('| ' + mdEscapeCell(s.phase) + ' | ' + mdEscapeCell(s.start) + ' | ' + mdEscapeCell(s.end) + ' | ' + mdEscapeCell(s.desc) + ' |')
          lines.push('')
        }
        lines.push('---'); lines.push('')
      }
      const leaves = leafNodes(proj.outline || [])
      for (const path of leaves) {
        const node = path[path.length - 1]; const depth = path.length
        lines.push(Array(Math.min(depth, 6) + 1).join('#') + ' ' + node.title); lines.push('')
        lines.push((proj.sections && proj.sections[node.id]) || '（本节内容待生成）'); lines.push('')
      }
      const refMap = new Map()
      for (const path of leafNodes(proj.outline || [])) { const id = path[path.length - 1].id; for (const rid of (proj.references && proj.references[id]) || []) refMap.set(rid, (refMap.get(rid) || 0) + 1) }
      if (refMap.size) {
        lines.push('---'); lines.push('## 参考文献'); lines.push('')
        let idx = 0
        for (const entry of refMap) { idx++; const it = refName(entry[0]); lines.push(idx + '. [' + (it ? it.name : entry[0]) + ']（知识库条目' + (it && it.model ? '，型号 ' + it.model : '') + '，引用 ' + entry[1] + ' 次）') }
      }
      return lines.join('\n')
    }
    function mdToHtml(md, title) {
      const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const lines = md.split('\n'); const out = []; let tableRows = []; let inPre = false; let preBuf = []
      const flushTable = () => {
        if (!tableRows.length) return
        const rows = tableRows.map((r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
        const body = rows.filter((r) => !r.every((c) => /^\s*[-:]+\s*$/.test(c)))
        if (body.length) { out.push('<table>'); body.forEach((r, ri) => { out.push('<tr>' + r.map((c) => (ri === 0 ? '<th>' : '<td>') + esc(c.replace(/<br\/>/g, '<br>')) + (ri === 0 ? '</th>' : '</td>')).join('') + '</tr>') }); out.push('</table>') }
        tableRows = []
      }
      for (const line of lines) {
        if (inPre) { if (/^```/.test(line)) { inPre = false; out.push('<pre>' + esc(preBuf.join('\n')) + '</pre>'); preBuf = [] } else preBuf.push(line); continue }
        if (/^```/.test(line)) { inPre = true; continue }
        if (/^#{1,4}\s/.test(line)) { flushTable(); const m = line.match(/^(#{1,4})\s+(.*)$/); const lv = m[1].length; out.push('<h' + lv + '>' + esc(m[2]) + '</h' + lv + '>') }
        else if (/^\|/.test(line) && /\|\s*$/.test(line)) { tableRows.push(line) }
        else if (/^\s*[-*]\s+/.test(line)) { flushTable(); out.push('<ul><li>' + esc(line.replace(/^\s*[-*]\s+/, '')) + '</li></ul>') }
        else if (/^\s*\d+\.\s+/.test(line)) { flushTable(); out.push('<ol><li>' + esc(line.replace(/^\s*\d+\.\s+/, '')) + '</li></ol>') }
        else if (/^>\s?/.test(line)) { flushTable(); out.push('<blockquote>' + esc(line.replace(/^>\s?/, '')) + '</blockquote>') }
        else if (/^\s*---+\s*$/.test(line)) { flushTable(); out.push('<hr/>') }
        else if (/^\s*$/.test(line)) { flushTable() }
        else { flushTable(); out.push('<p>' + esc(line) + '</p>') }
      }
      flushTable(); if (inPre) out.push('<pre>' + esc(preBuf.join('\n')) + '</pre>')
      return '<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:system-ui,\'Microsoft YaHei\',sans-serif;max-width:860px;margin:0 auto;padding:24px;line-height:1.7;color:#1f2937}h1,h2,h3,h4{color:#0e7490}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d1d5db;padding:6px 10px;text-align:left}th{background:#f3f4f6}blockquote{border-left:3px solid #0e7490;margin:10px 0;padding:4px 12px;color:#4b5563;background:#f9fafb}pre{background:#0b1220;color:#e5e7eb;padding:12px;border-radius:8px;overflow:auto}code{background:#f3f4f6;padding:1px 5px;border-radius:4px}</style></head><body>' + out.join('\n') + '</body></html>'
    }
    async function exportPdf(proj, md) {
      const chrome = await findFirst(['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'])
      if (!chrome) return { ok: false, message: '未找到 Chrome/Edge，无法导出 PDF' }
      const dir = await dataDir(); const outdir = joinPath(dir, 'exports'); await ensureDir(outdir)
      const safeTitle = (proj.title || 'docsuite-export').replace(/[\\/:*?"<>|]/g, '_')
      const htmlPath = joinPath(outdir, safeTitle + '.html'); const pdfPath = joinPath(outdir, safeTitle + '.pdf')
      await writeTextFile(htmlPath, mdToHtml(md, proj.title))
      const url = 'file:///' + htmlPath.replace(/\\/g, '/')
      const tmpProfile = joinPath(outdir, 'chrome-profile-' + Date.now())
      const cmd = '"' + chrome + '" --headless=new --disable-gpu --no-sandbox --user-data-dir="' + tmpProfile + '" --print-to-pdf="' + pdfPath + '" --print-to-pdf-no-header "' + url + '"'
      const res = await shell.run(shell.resolve({ command: cmd }))
      try {
        const t = await fs.resolve(pdfPath); const info = await fs.stat(t)
        if (!info) return { ok: false, message: 'PDF 生成失败：' + pickStdout(res).slice(0, 200) }
        const bytes = await fs.readBytes(t, undefined, 200 * 1024 * 1024)
        let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        return { ok: true, base64: btoa(bin), fileName: safeTitle + '.pdf' }
      } catch (e) { return { ok: false, message: String((e && e.message) || e) } }
    }
    async function exportProject(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      const format = (args && args.format) || 'md'
      await preloadRefNames(proj); const md = buildMarkdown(proj)
      const safeTitle = (proj.title || 'docsuite-export').replace(/[\\/:*?"<>|]/g, '_')
      if (format === 'md') return { ok: true, content: md, fileName: safeTitle }
      if (format === 'html') return { ok: true, content: mdToHtml(md, proj.title), fileName: safeTitle + '.html' }
      if (format === 'pdf') return exportPdf(proj, md)
      if (format === 'docx') {
        const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
        const dir = await dataDir(); const outdir = joinPath(dir, 'exports'); await ensureDir(outdir)
        const mdPath = joinPath(outdir, safeTitle + '.md'); const docxPath = joinPath(outdir, safeTitle + '.docx')
        await writeTextFile(mdPath, md)
        const scriptPath = joinPath(dir, 'scripts', 'export_docx.py')
        const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + mdPath + '" "' + docxPath + '" "' + proj.title.replace(/"/g, '') + '"' }))
        const ok = /OK/.test(pickStdout(res))
        if (!ok) return { ok: false, message: 'Word 导出失败：' + pickStdout(res).slice(0, 300) + stderrOf(res).slice(0, 300) }
        try {
          const t = await fs.resolve(docxPath); const info = await fs.stat(t); if (!info) return { ok: false, message: '导出文件不存在' }
          const bytes = await fs.readBytes(t, undefined, 200 * 1024 * 1024)
          let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
          return { ok: true, base64: btoa(bin), fileName: safeTitle + '.docx' }
        } catch (e) { return { ok: false, message: String((e && e.message) || e) } }
      }
      return { ok: false, message: '不支持的格式：' + format }
    }
    function addDays(isoDate, days) { const d = new Date(isoDate + 'T00:00:00'); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10) }
    async function bidParse(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (!args || !args.fileName || !args.base64) return { ok: false, message: '缺少招标文件' }
      const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const dir = await dataDir(); const id = 'bid_' + Date.now().toString(36)
      const tmpDir = joinPath(dir, 'projects', 'tmp', id); await ensureDir(tmpDir)
      await writeTextFile(joinPath(tmpDir, 'upload.b64'), String(args.base64))
      const scriptPath = joinPath(dir, 'scripts', 'ingest_file.py'); const safeName = String(args.fileName).replace(/"/g, '')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + joinPath(tmpDir, 'upload.b64') + '" "' + tmpDir + '" "' + safeName + '"' }))
      let text = ''
      try { const t = await fs.resolve(joinPath(tmpDir, 'extracted.txt')); const st = await fs.stat(t); if (st) text = await readTextTolerant(t) } catch (e) { text = '' }
      if (!text || text.length < 30) {
        // 扫描件招标文件：OCR
        const pdfPath = joinPath(tmpDir, safeName)
        if (/^.*\.pdf$/i.test(safeName)) {
          const ocrR = await ocrPdfFile(pdfPath, joinPath(tmpDir, 'extracted.txt'))
          if (ocrR.ok) { try { const t = await fs.resolve(joinPath(tmpDir, 'extracted.txt')); const st = await fs.stat(t); if (st) text = await readTextTolerant(t) } catch (e) { text = '' } }
        }
      }
      if (!text) return { ok: false, message: '招标文件解析失败：' + pickStdout(res).slice(0, 300) }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const system = '你是招投标文件分析专家。你擅长从招标文件中提取技术要求、商务要求、投标文件编制要求与关键交付条款。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '请从以下招标文件文本中提取信息，输出 JSON：\n1. structure（投标文件编制要求）：{"compileRequirement": "招标文件对投标文件的组成、编制顺序、排版/格式要求的原文要点，没有则空字符串", "sections": []}\n2. terms（商务关键条款）：{"deliveryText": "交货期原文", "deliveryDays": 交货天数（无法确定则 0）, "deliveryDate": "固定日期（无则空）", "place": "交货地点", "warranty": "质保期", "payment": "付款方式"}\n3. requirements（要求清单，技术/商务/资质/交付/验收均有）：[{"no": "1", "chapter": "来源条款号", "requirement": "要求原文", "category": "技术|商务|资质|交付|验收"}]\n\n招标文件文本（前 40000 字符）：\n' + text.slice(0, 40000)
      const res2 = await llmText(route, system, userPrompt, 8000)
      if (!res2.ok) return { ok: false, message: '模型调用失败：' + res2.message }
      const parsed = parseModelJson(res2.text || res2.reasoning || '')
      if (!parsed) return { ok: false, message: '要求解析失败，请重试' }
      const rawStruct = (parsed.structure && typeof parsed.structure === 'object') ? parsed.structure : {}
      const rawTerms = (parsed.terms && typeof parsed.terms === 'object') ? parsed.terms : {}
      const reqs = Array.isArray(parsed.requirements) ? parsed.requirements : []
      proj.bidStructure = { compileRequirement: String(rawStruct.compileRequirement || '').slice(0, 800), sections: Array.isArray(rawStruct.sections) ? rawStruct.sections.map(String).slice(0, 20) : [] }
      proj.bidTerms = { deliveryText: String(rawTerms.deliveryText || '').slice(0, 300), deliveryDays: parseInt(rawTerms.deliveryDays, 10) > 0 ? parseInt(rawTerms.deliveryDays, 10) : 0, deliveryDate: String(rawTerms.deliveryDate || '').slice(0, 20), place: String(rawTerms.place || '').slice(0, 200), warranty: String(rawTerms.warranty || '').slice(0, 300), payment: String(rawTerms.payment || '').slice(0, 300) }
      proj.bidMatrix = reqs.filter((r) => r && r.requirement).slice(0, 150).map((r, i) => ({ no: String(r.no || (i + 1)), chapter: String(r.chapter || ''), requirement: String(r.requirement).slice(0, 1000), category: String(r.category || '技术').slice(0, 10), answer: '', status: 'pending' }))
      await updateStatus(proj); await writeProj(proj)
      try { if (shell) await shell.run(shell.resolve({ command: 'Remove-Item -Force -Recurse "' + tmpDir.replace(/"/g, '\\"') + '" -ErrorAction SilentlyContinue' })) } catch (e) {}
      return { ok: true, project: proj, count: proj.bidMatrix.length, terms: proj.bidTerms }
    }
    async function bidAnswer(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      const idx = args && args.index; const row = proj.bidMatrix && proj.bidMatrix[idx]; if (!row) return { ok: false, message: '要求不存在' }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const kb = await searchItems({ q: row.requirement.slice(0, 100), pageSize: 4 })
      let kbText = ''; let refIds = []
      if (kb && kb.items && kb.items.length) { refIds = kb.items.map((it) => it.id); kbText = '\n\n可参考知识库：\n' + kb.items.map((it) => '- [' + it.name + ']：' + (it.summary || '') + '；参数：' + (it.params || []).slice(0, 6).map((pp) => pp.name + ' ' + (pp.value || '') + (pp.unit || '')).join('、')).join('\n') }
      const system = '你是投标技术文件撰写专家。你撰写的应答专业、具体、以事实和数据支撑。只输出应答正文。'
      const userPrompt = '请对以下招标要求撰写投标应答（100-300 字，说明我方如何满足要求，给出具体指标/方案）。\n招标要求（' + row.category + '）：' + row.requirement + '\n来源：' + (row.chapter || '') + '\n项目：' + proj.title + '\n主题：' + proj.topic + kbText + '\n\n请以「响应：」开头表示完全满足（无偏离）；若我方指标优于或超出招标要求，以「正偏离：」开头并说明超出内容；若无法完全满足（部分满足或达不到），以「负偏离：」开头并说明偏离项与理由；完全不适用时以「不适用：」开头。'
      const res = await llmText(route, system, userPrompt, 1500)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const answer = (res.text || res.reasoning || '').trim()
      if (!answer) return { ok: false, message: '模型未返回内容' }
      const type = /^正偏离/.test(answer) ? 'positive' : /^负偏离/.test(answer) ? 'negative' : /^响应/.test(answer) ? 'full' : /^不适用/.test(answer) ? 'na' : (/^偏离/.test(answer) ? 'negative' : 'full')
      proj.bidMatrix[idx] = Object.assign({}, row, { answer: answer, status: type })
      await writeProj(proj)
      return { ok: true, project: proj, refs: refIds.length }
    }
    async function bidSchedule(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const terms = proj.bidTerms || {}
      const contractDate = (args && args.contractDate) || new Date().toISOString().slice(0, 10)
      const deliveryDays = parseInt(args && args.deliveryDays, 10) > 0 ? parseInt(args.deliveryDays, 10) : (parseInt(terms.deliveryDays, 10) > 0 ? parseInt(terms.deliveryDays, 10) : 0)
      if (!deliveryDays) return { ok: false, message: '未获取到交货期限，请在页面填写交货天数' }
      const deliveryText = terms.deliveryText || (deliveryDays + ' 天')
      const system = '你是投标项目管理专家，精通项目进度计划编制。你设计的进度安排合理、可执行、完全满足交货期约束。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '请为以下投标项目设计时间节点安排（阶段 10-15 个），总工期不得超过交货期 ' + deliveryDays + ' 天。\n项目：' + proj.title + '\n交货要求：' + deliveryText + '\n\n阶段须覆盖：合同签订、技术联络/方案确认、详细设计、物料采购、生产制造、集成装配、出厂测试(FAT)、包装发运、现场安装、现场调试(SAT)、操作培训、试运行、最终验收。\n注意：出厂测试应安排在交货前留出发运与安装时间；最终验收必须在交货期内完成。\n\n输出 JSON：{"stages": [{"phase": "阶段名称", "offsetDays": 相对合同签订日的开始天数（整数）, "durationDays": 持续天数, "desc": "工作内容（30-80字）"}]}\n要求：第一个阶段 offsetDays=0；各阶段按时间顺序排列、尽量衔接；最后一个阶段结束日 = offsetDays + durationDays 不得超过 ' + deliveryDays + '。'
      const res = await llmText(route, system, userPrompt, 5000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const parsed = parseModelJson(res.text || res.reasoning || '')
      if (!parsed || !Array.isArray(parsed.stages) || !parsed.stages.length) return { ok: false, message: '进度计划解析失败，请重试' }
      const schedule = parsed.stages.filter((s) => s && s.phase).slice(0, 20).map((s) => { const offset = Math.max(0, parseInt(s.offsetDays, 10) || 0); const dur = Math.max(1, parseInt(s.durationDays, 10) || 1); return { phase: String(s.phase).slice(0, 40), offsetDays: offset, durationDays: dur, start: addDays(contractDate, offset), end: addDays(contractDate, offset + dur - 1), desc: String(s.desc || '').slice(0, 200) } })
      const last = schedule[schedule.length - 1]
      if (last.offsetDays + last.durationDays - 1 > deliveryDays) { last.end = addDays(contractDate, deliveryDays); last.desc = (last.desc || '') + '（压缩至交货期内）' }
      proj.bidSchedule = schedule; proj.contractDate = contractDate
      proj.bidTerms = Object.assign({}, terms, { deliveryDays: deliveryDays, deliveryText: terms.deliveryText || (deliveryDays + ' 天') })
      await writeProj(proj)
      return { ok: true, project: proj }
    }

    // ---- PPT（M4） ----
    async function pptPreview(args) {
      const proj = await readProj(args && args.id); if (!proj) return { ok: false, message: '项目不存在' }
      if (!llmResolve()) return { ok: false, message: 'LLM 服务不可用' }
      const route = await modelRoute(); if (!route) return { ok: false, message: '未找到可用模型路由' }
      const leaves = leafNodes(proj.outline || [])
      let bodyText = ''
      for (const path of leaves.slice(0, 40)) { const node = path[path.length - 1]; const content = (proj.sections && proj.sections[node.id]) || ''; bodyText += '## ' + node.title + '\n' + content.slice(0, 500) + '\n\n' }
      if (!bodyText) return { ok: false, message: '项目尚无章节内容，请先在文档工坊生成章节' }
      const system = '你是演示文稿设计专家。你擅长从技术文档中提炼精炼的演示要点。你的回答必须只包含一个 JSON 对象。'
      const userPrompt = '请根据以下文档内容设计演示文稿（8-15 页）。\n第 1 页为封面：title=文档标题，bullets=[一句话主题概述]。\n其余页：每页 title（简短有力）+ bullets（3-6 条要点，每条 10-30 字，概括核心内容；含关键数据的用「参数名 数值 单位」表达）。\n若某部分有明显表格数据（如参数对比、时间节点），可给 table: {"headers": [...], "rows": [[...]]}。\n\n文档标题：' + proj.title + '\n\n文档内容：\n' + bodyText.slice(0, 12000) + '\n\n输出 JSON：{"slides": [{"title": "页标题", "bullets": ["要点1", "要点2"], "table": {"headers": [], "rows": []}}]}'
      const res = await llmText(route, system, userPrompt, 5000)
      if (!res.ok) return { ok: false, message: '模型调用失败：' + res.message }
      const parsed = parseModelJson(res.text || res.reasoning || '')
      if (!parsed || !Array.isArray(parsed.slides) || !parsed.slides.length) return { ok: false, message: '幻灯片内容解析失败，请重试' }
      const slides = parsed.slides.slice(0, 20).map((s) => ({ title: String(s.title || '').slice(0, 80), bullets: Array.isArray(s.bullets) ? s.bullets.map((b) => String(b).slice(0, 120)) : [], table: s.table && Array.isArray(s.table.headers) ? { headers: s.table.headers.map(String).slice(0, 8), rows: Array.isArray(s.table.rows) ? s.table.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c == null ? '' : c)).slice(0, 8) : [])) : [] } : null }))
      if (slides[0]) slides[0] = Object.assign({}, slides[0], { title: slides[0].title || proj.title })
      return { ok: true, slides: slides }
    }
    async function pptExport(args) {
      const slides = args && Array.isArray(args.slides) ? args.slides : []
      if (!slides.length) return { ok: false, message: '无幻灯片数据' }
      const theme = PPT_THEME_KEYS.indexOf(args && args.theme) >= 0 ? args.theme : 'ocean'
      const title = String((args && args.title) || '演示文稿').slice(0, 80)
      const tc = await ensurePythonToolchain(); if (!tc.ok) return { ok: false, message: 'Python 工具链未就绪：' + tc.message }
      const dir = await dataDir(); const outdir = joinPath(dir, 'exports'); await ensureDir(outdir)
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_')
      const dataPath = joinPath(outdir, safeTitle + '-slides.json'); const pptxPath = joinPath(outdir, safeTitle + '.pptx')
      await writeJson(dataPath, { slides: slides })
      const scriptPath = joinPath(dir, 'scripts', 'export_pptx.py')
      const res = await shell.run(shell.resolve({ command: 'python "' + scriptPath + '" "' + dataPath + '" "' + pptxPath + '" "' + theme + '" "' + title.replace(/"/g, '') + '"' }))
      const ok = /OK/.test(pickStdout(res))
      if (!ok) return { ok: false, message: 'PPTX 导出失败：' + pickStdout(res).slice(0, 300) + stderrOf(res).slice(0, 300) }
      try {
        const t = await fs.resolve(pptxPath); const info = await fs.stat(t); if (!info) return { ok: false, message: '导出文件不存在' }
        const bytes = await fs.readBytes(t, undefined, 200 * 1024 * 1024)
        let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        return { ok: true, base64: btoa(bin), fileName: safeTitle + '.pptx' }
      } catch (e) { return { ok: false, message: String((e && e.message) || e) } }
    }

    async function summary() {
      const dir = await dataDir(); const cfg = await getConfig()
      return { dataDir: dir, kbItems: await countJsonFiles(joinPath(dir, 'kb', 'items')), projects: await countJsonFiles(joinPath(dir, 'projects')), templates: await countJsonFiles(joinPath(dir, 'templates', 'learned')) + await countJsonFiles(joinPath(dir, 'templates', 'manual')), language: cfg.language || 'zh' }
    }
    async function findFirst(paths) {
      if (!fs) return undefined
      for (const p of paths) { try { const target = await fs.resolve(p); const info = await fs.stat(target); if (info) return p } catch (e) {} }
      return undefined
    }
    async function checkExecutable(name) {
      if (!subprocess) return { present: false, reason: 'no-subprocess-service' }
      try { const resolved = await subprocess.resolveExecutable(name); return { present: true, path: resolved } } catch (e) { return { present: false, reason: String((e && e.message) || e) } }
    }
    async function pythonVersion() {
      if (!shell) return ''
      try { const res = await shell.run(shell.resolve({ command: 'python --version 2>&1' })); return pickStdout(res).trim() } catch (e) { return '' }
    }
    async function envCheck() {
      const python = await checkExecutable('python')
      let version = ''; let pythonDeps = false
      if (python.present) { version = await pythonVersion(); pythonDeps = await depsInstalled() }
      const chrome = await findFirst(['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'])
      const edge = await findFirst(['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'])
      return { python: { present: python.present, path: python.path || null, version: version }, pythonDeps: pythonDeps, chrome: chrome || null, edge: edge || null, dataDir: await dataDir(), workspaceRoot: workspaceRoot || null }
    }
    async function health() {
      const cfg = await getConfig()
      return { ok: true, name: 'DocSuite', version: cfg.version || 1, dataDir: cfg.dataDir || rootDir, workspaceRoot: workspaceRoot || null }
    }

    const cleanups = []
    const register = (method, handler) => {
      try { const dispose = harness.handle(method, handler); if (typeof dispose === 'function') cleanups.push(dispose) } catch (e) { console.log('[docsuite] handle register failed:', method, String((e && e.message) || e)) }
    }
    register('docsuite/health', async () => health())
    register('docsuite/config/get', async () => getConfig())
    register('docsuite/config/set', async (args) => saveConfig((args && args.patch) || {}))
    register('docsuite/env/check', async () => envCheck())
    register('docsuite/env/setup-python', async () => ensurePythonToolchain())
    register('docsuite/state/summary', async () => summary())
    register('docsuite/kb/list', async () => { await reconcileOrphans(); const items = (await listItems()).map(slim); return { items: items, categories: await allCategories() } })
    register('docsuite/kb/search', async (args) => { const r = await searchItems(args || {}); return Object.assign({}, r, { categories: await allCategories() }) })
    register('docsuite/kb/upload', async (args) => uploadItem(args || {}))
    register('docsuite/kb/enrich', async (args) => enrichItem(args || {}))
    register('docsuite/kb/reocr', async (args) => reOcrItem(args || {}))
    register('docsuite/kb/create-manual', async (args) => createManual(args || {}))
    register('docsuite/kb/update', async (args) => updateItem(args || {}))
    register('docsuite/kb/delete', async (args) => deleteItem(args || {}))
    register('docsuite/kb/compare', async (args) => compareItems(args || {}))
    register('docsuite/kb/source', async (args) => sourceItem(args || {}))
    register('docsuite/kb/preview', async (args) => previewItem(args || {}))
    register('docsuite/web/search', async (args) => webSearch(args || {}))
    register('docsuite/web/import', async (args) => webImport(args || {}))
    register('docsuite/migrate', async (args) => migrateData(args || {}))
    register('docsuite/tpl/list', async () => ({ templates: await listTemplates() }))
    register('docsuite/tpl/learn', async (args) => learnTemplate(args || {}))
    register('docsuite/tpl/create-manual', async (args) => createManualTemplate(args || {}))
    register('docsuite/tpl/update', async (args) => updateTemplate(args || {}))
    register('docsuite/tpl/delete', async (args) => deleteTemplate(args || {}))
    register('docsuite/proj/list', async () => ({ projects: await listProjs() }))
    register('docsuite/proj/create', async (args) => createProject(args || {}))
    register('docsuite/proj/get', async (args) => ({ project: await readProj(args && args.id) }))
    register('docsuite/proj/delete', async (args) => deleteProject(args || {}))
    register('docsuite/proj/gen-outline', async (args) => genOutline(args || {}))
    register('docsuite/proj/gen-outline-doc', async (args) => genOutlineFromDoc(args || {}))
    register('docsuite/proj/save-outline', async (args) => saveOutline(args || {}))
    register('docsuite/proj/robot-spec-draft', async (args) => robotSpecDraft(args || {}))
    register('docsuite/proj/save-robot-spec', async (args) => saveRobotSpec(args || {}))
    register('docsuite/proj/gen-section', async (args) => genSection(args || {}))
    register('docsuite/proj/save-section', async (args) => saveSection(args || {}))
    register('docsuite/proj/export', async (args) => exportProject(args || {}))
    register('docsuite/proj/bid-parse', async (args) => bidParse(args || {}))
    register('docsuite/proj/bid-answer', async (args) => bidAnswer(args || {}))
    register('docsuite/proj/bid-schedule', async (args) => bidSchedule(args || {}))
    register('docsuite/ppt/preview', async (args) => pptPreview(args || {}))
    register('docsuite/ppt/export', async (args) => pptExport(args || {}))

    let disposed = false
    const cleanup = () => { if (disposed) return; disposed = true; for (const d of cleanups) { try { d() } catch (e) {} } }
    ctx.on('dispose', cleanup)
    return cleanup
  },
}