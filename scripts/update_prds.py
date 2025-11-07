#!/usr/bin/env python3
import os
from pathlib import Path
from docx import Document
from docx.enum.text import WD_BREAK
from docx.shared import Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path('PRDs/2025-11')
HEADERS = [
    '1. Customer Problem',
    '2. Customer Research',
    '3. Our Solution',
    '4. Product Metrics',
    'Appendix: Additional Links',
    'Appendix: Quick prototype'
]

ENTERPRISE_SENTENCE = (
    'This capability was requested as feedback from an enterprise-level accounting firm, '
    'reflecting needs observed in large multi-entity audit workflows.'
)

COMPETITIVE_SENTENCE = (
    'We are also building this to achieve competitive parity with Wolters Kluwer ProSystem fx Engagement, '
    'which offers similar functionality.'
)

def insert_empty_paragraph_before(paragraph):
    new_p = OxmlElement('w:p')
    paragraph._p.addprevious(new_p)

def insert_empty_paragraph_after(paragraph):
    new_p = OxmlElement('w:p')
    paragraph._p.addnext(new_p)

def paragraph_is_header(p):
    txt = (p.text or '').strip()
    return any(txt.startswith(h) for h in HEADERS)


def ensure_header_style(p):
    # Make entire paragraph bold
    if not p.runs:
        run = p.add_run('')
    for r in p.runs:
        r.bold = True
    # Ensure a blank line before and after
    prev = p._p.getprevious()
    if prev is None or ''.join(t.text for t in prev.iter(qn('w:t'))).strip() != '':
        insert_empty_paragraph_before(p)
    nxt = p._p.getnext()
    if nxt is None or ''.join(t.text for t in nxt.iter(qn('w:t'))).strip() != '':
        insert_empty_paragraph_after(p)
    fmt = p.paragraph_format
    fmt.space_before = Pt(6)
    fmt.space_after = Pt(6)


def add_research_sentences(doc: Document, is_div_or_cons: bool):
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip().startswith('2. Customer Research'):
            # Insert a paragraph after the header with the required sentences
            new_para = p.insert_paragraph_after(ENTERPRISE_SENTENCE)
            if is_div_or_cons:
                new_para.add_run(' ').add_break(WD_BREAK.LINE)
                new_para.add_run(COMPETITIVE_SENTENCE)
            return True
    return False


def process_docx(path: Path):
    print(f'Processing {path}')
    doc = Document(str(path))

    name_lower = path.name.lower()
    is_div_or_cons = ('division' in name_lower) or ('consolidation' in name_lower)

    for p in doc.paragraphs:
        if paragraph_is_header(p):
            ensure_header_style(p)

    add_research_sentences(doc, is_div_or_cons)

    doc.save(str(path))


def main():
    if not ROOT.exists():
        print('No PRDs directory found; skipping.')
        return
    for f in ROOT.glob('*.docx'):
        process_docx(f)

if __name__ == '__main__':
    main()
