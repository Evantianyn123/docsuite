import sys, os, re, datetime
import docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

def add_rich(p, text):
    parts = re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith(chr(42)*2) and part.endswith(chr(42)*2):
            run = p.add_run(part[2:-2]); run.bold = True
        elif part.startswith(chr(96)) and part.endswith(chr(96)):
            run = p.add_run(part[1:-1]); run.font.name = chr(67)+chr(111)+chr(110)+chr(115)+chr(111)+chr(108)+chr(97)+chr(115)
        else:
            p.add_run(part)

def main():
    md_path = sys.argv[1]
    out_path = sys.argv[2]
    title = sys.argv[3]
    with open(md_path, chr(114), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:
        lines = f.read().split(chr(10))
    doc = docx.Document()
    h = doc.add_heading(title, 0)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(datetime.date.today().strftime(chr(37)+chr(89)+chr(45)+chr(37)+chr(109)+chr(45)+chr(37)+chr(100)))
    doc.add_page_break()
    i = 0
    table_buf = []
    def flush_table():
        nonlocal table_buf
        if not table_buf:
            return
        rows = [r.strip().strip(chr(124)).split(chr(124)) for r in table_buf if r.strip()]
        rows = [[c.strip() for c in r] for r in rows]
        rows = [r for r in rows if not all(re.fullmatch(r"[\s:\-]+", c) for c in r)]
        if rows:
            t = doc.add_table(rows=len(rows), cols=max(len(r) for r in rows))
            t.style = chr(76)+chr(105)+chr(103)+chr(104)+chr(116)+chr(32)+chr(71)+chr(114)+chr(105)+chr(100)+chr(32)+chr(65)+chr(99)+chr(99)+chr(101)+chr(110)+chr(116)
            for ri, row in enumerate(rows):
                for ci, cell in enumerate(row):
                    t.cell(ri, ci).text = cell
            doc.add_paragraph()
        table_buf = []
    while i < len(lines):
        line = lines[i]
        if line.startswith(chr(35) + chr(32)):
            flush_table(); doc.add_heading(line[2:].strip(), 1)
        elif line.startswith(chr(35)*2 + chr(32)):
            flush_table(); doc.add_heading(line[3:].strip(), 2)
        elif line.startswith(chr(35)*3 + chr(32)):
            flush_table(); doc.add_heading(line[4:].strip(), 3)
        elif line.startswith(chr(35)*4 + chr(32)):
            flush_table(); doc.add_heading(line[5:].strip(), 4)
        elif line.strip().startswith(chr(124)):
            table_buf.append(line)
        elif line.strip().startswith(chr(45) + chr(32)) or line.strip().startswith(chr(42) + chr(32)):
            flush_table(); doc.add_paragraph(line.strip()[2:], style=chr(76)+chr(105)+chr(115)+chr(116)+chr(32)+chr(66)+chr(117)+chr(108)+chr(108)+chr(101)+chr(116))
        elif line.strip() and not line.strip().startswith(chr(35)) and not re.match(r"^\s*---+\s*$", line):
            flush_table(); para = doc.add_paragraph(); add_rich(para, line.strip())
        else:
            flush_table()
        i += 1
    flush_table()
    doc.save(out_path)
    print(chr(79)+chr(75))

main()