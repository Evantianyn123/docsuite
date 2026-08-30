import sys, json
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

THEMES = {
  chr(111)+chr(99)+chr(101)+chr(97)+chr(110): {chr(98)+chr(103): chr(49)+chr(52)+chr(50)+chr(50)+chr(51)+chr(50)+chr(50), chr(97)+chr(99)+chr(99): chr(51)+chr(52)+chr(68)+chr(70)+chr(70)+chr(69)+chr(66), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(66)+chr(70)+chr(66)+chr(70)+chr(70)+chr(70)} ,
  chr(116)+chr(101)+chr(99)+chr(104): {chr(98)+chr(103): chr(48)+chr(49)+chr(49)+chr(48)+chr(49)+chr(53), chr(97)+chr(99)+chr(99): chr(48)+chr(57)+chr(68)+chr(65)+chr(70)+chr(70), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(50)+chr(49)+chr(52)+chr(50)+chr(49)+chr(55)} ,
  chr(100)+chr(97)+chr(114)+chr(107): {chr(98)+chr(103): chr(49)+chr(55)+chr(49)+chr(56)+chr(50)+chr(50), chr(97)+chr(99)+chr(99): chr(70)+chr(49)+chr(56)+chr(56)+chr(56)+chr(56), chr(116)+chr(101)+chr(120)+chr(116): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(49)+chr(54)+chr(51)+chr(49)+chr(54)+chr(51)} ,
  chr(108)+chr(105)+chr(103)+chr(104)+chr(116): {chr(98)+chr(103): chr(70)+chr(70)+chr(70)+chr(70)+chr(70)+chr(70), chr(97)+chr(99)+chr(99): chr(48)+chr(57)+chr(56)+chr(55)+chr(70)+chr(66), chr(116)+chr(101)+chr(120)+chr(116): chr(49)+chr(50)+chr(50)+chr(49)+chr(50)+chr(50), chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116): chr(56)+chr(57)+chr(57)+chr(57)+chr(57)+chr(57)} ,
}

def hexc(s):
    return RGBColor(int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))

def set_bg(slide, color):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = hexc(color)

def add_text(slide, left, top, width, height, text, size, color, bold=False, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.color.rgb = hexc(color)
    run.font.bold = bold
    return box

def add_bullets(slide, bullets, color, top=1.5):
    box = slide.shapes.add_textbox(Inches(0.8), Inches(top), Inches(11.7), Inches(5.5))
    tf = box.text_frame
    tf.word_wrap = True
    first = True
    for b in bullets:
        if first:
            p = tf.paragraphs[0]
            first = False
        else:
            p = tf.add_paragraph()
        p.text = b
        p.font.size = Pt(18)
        p.font.color.rgb = hexc(color)
        p.space_after = Pt(8)

def add_table(slide, table, theme):
    headers = table.get(chr(104)+chr(101)+chr(97)+chr(100)+chr(101)+chr(114)+chr(115), [])
    rows = table.get(chr(114)+chr(111)+chr(119)+chr(115), [])
    if not headers:
        return
    ncols = len(headers)
    nrows = len(rows) + 1
    shape = slide.shapes.add_table(nrows, ncols, Inches(0.8), Inches(1.6), Inches(11.7), Inches(4.5))
    tbl = shape.table
    for ci, h in enumerate(headers):
        cell = tbl.cell(0, ci)
        cell.text = str(h)
        cell.fill.solid()
        cell.fill.fore_color.rgb = hexc(theme[chr(97)+chr(99)+chr(99)])
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            if ci < ncols:
                cell = tbl.cell(ri + 1, ci)
                cell.text = str(val)
                cell.fill.solid()
                cell.fill.fore_color.rgb = hexc(theme[chr(98)+chr(103)])

def main():
    data_path = sys.argv[1]
    out_path = sys.argv[2]
    theme_key = sys.argv[3]
    title = sys.argv[4]
    with open(data_path, chr(114), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:
        data = json.load(f)
    theme = THEMES.get(theme_key, THEMES[chr(111)+chr(99)+chr(101)+chr(97)+chr(110)])
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]
    slides = data.get(chr(115)+chr(108)+chr(105)+chr(100)+chr(101)+chr(115), [])
    for idx, s in enumerate(slides):
        slide = prs.slides.add_slide(blank)
        set_bg(slide, theme[chr(98)+chr(103)])
        s_title = str(s.get(chr(116)+chr(105)+chr(116)+chr(108)+chr(101), chr(24037)+chr(24149)+chr(29255)+chr(32)+str(idx + 1)))
        if idx == 0:
            add_text(slide, 0.8, 2.4, 11.7, 1.6, s_title, 44, theme[chr(97)+chr(99)+chr(99)], True, PP_ALIGN.CENTER)
            add_text(slide, 0.8, 4.2, 11.7, 0.8, title, 20, theme[chr(115)+chr(117)+chr(98)+chr(116)+chr(101)+chr(120)+chr(116)], False, PP_ALIGN.CENTER)
        else:
            add_text(slide, 0.8, 0.5, 11.7, 0.9, s_title, 30, theme[chr(97)+chr(99)+chr(99)], True)
            if s.get(chr(116)+chr(97)+chr(98)+chr(108)+chr(101)):
                add_table(slide, s[chr(116)+chr(97)+chr(98)+chr(108)+chr(101)], theme)
            else:
                add_bullets(slide, s.get(chr(98)+chr(117)+chr(108)+chr(108)+chr(101)+chr(116)+chr(115), []), theme[chr(116)+chr(101)+chr(120)+chr(116)])
    prs.save(out_path)
    print(chr(79)+chr(75))

main()