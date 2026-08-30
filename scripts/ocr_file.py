import sys, os
import fitz
from rapidocr_onnxruntime import RapidOCR

def main():
    pdf_path = sys.argv[1]
    out_path = sys.argv[2]
    ocr = RapidOCR()
    doc = fitz.open(pdf_path)
    parts = []
    tmp_dir = os.path.dirname(out_path)
    for pi, page in enumerate(doc):
        pix = page.get_pixmap(dpi=200)
        tmp = os.path.join(tmp_dir, chr(95) + chr(111) + chr(99) + chr(114) + chr(95) + str(pi) + chr(46) + chr(112) + chr(110) + chr(103))
        pix.save(tmp)
        try:
            result, _ = ocr(tmp)
            if result:
                for line in result:
                    try:
                        parts.append(str(line[1]))
                    except Exception:
                        pass
        except Exception:
            pass
        parts.append(chr(32))
        try:
            os.remove(tmp)
        except Exception:
            pass
    with open(out_path, chr(119), encoding=chr(117)+chr(116)+chr(102)+chr(45)+chr(56)) as f:
        f.write(chr(10).join(parts))
    print(chr(79)+chr(67)+chr(82)+chr(95)+chr(68)+chr(79)+chr(78)+chr(69))

main()