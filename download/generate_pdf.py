#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CET4 Part III Section A 词汇匹配 · 标注题型总结报告 PDF Generator
Uses ReportLab for body + HTML/Playwright for cover + pypdf for merge
"""

import os
import sys
import subprocess

# ━━ Color Palette (cascade, teal accent) ━━
from reportlab.lib import colors

PAGE_BG       = colors.HexColor('#f6f6f5')
SECTION_BG    = colors.HexColor('#edecea')
CARD_BG       = colors.HexColor('#eae9e6')
TABLE_STRIPE  = colors.HexColor('#f0f0ee')
HEADER_FILL   = colors.HexColor('#1c7796')  # Teal accent for headers
COVER_BLOCK   = colors.HexColor('#635c47')
BORDER        = colors.HexColor('#c3c0b4')
ICON          = colors.HexColor('#9d8d5c')
ACCENT        = colors.HexColor('#1c7796')  # Teal
ACCENT_2      = colors.HexColor('#4bc44b')
TEXT_PRIMARY   = colors.HexColor('#201f1d')
TEXT_MUTED     = colors.HexColor('#7c7a73')
SEM_SUCCESS   = colors.HexColor('#4a7f5c')
SEM_WARNING   = colors.HexColor('#a8894a')
SEM_ERROR     = colors.HexColor('#97473f')
SEM_INFO      = colors.HexColor('#577593')

# Table colors
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ━━ Font Registration ━━
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Chinese fonts
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC-Bold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))

# English fonts
pdfmetrics.registerFont(TTFont('Tinos', '/usr/share/fonts/truetype/chinese/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))

# Symbol/Formula font
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSC-Bold')
registerFontFamily('Tinos', normal='Tinos', bold='Tinos-Bold')
registerFontFamily('Carlito', normal='Carlito', bold='Carlito')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# Install font fallback for mixed CJK/Latin
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)

from pdf import install_font_fallback
install_font_fallback()

# ━━ Imports ━━
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
import hashlib

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 2.0 * cm
RIGHT_MARGIN = 2.0 * cm
TOP_MARGIN = 2.5 * cm
BOTTOM_MARGIN = 2.5 * cm
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━ Styles ━━
styles = {}

styles['h1'] = ParagraphStyle(
    name='H1', fontName='NotoSansSC', fontSize=18, leading=28,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10,
    wordWrap='CJK', alignment=TA_LEFT,
)

styles['h2'] = ParagraphStyle(
    name='H2', fontName='NotoSansSC', fontSize=14, leading=22,
    textColor=ACCENT, spaceBefore=14, spaceAfter=8,
    wordWrap='CJK', alignment=TA_LEFT,
)

styles['h3'] = ParagraphStyle(
    name='H3', fontName='NotoSansSC', fontSize=12, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6,
    wordWrap='CJK', alignment=TA_LEFT,
)

styles['body'] = ParagraphStyle(
    name='Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6,
    wordWrap='CJK', alignment=TA_LEFT, firstLineIndent=21,
)

styles['body_no_indent'] = ParagraphStyle(
    name='BodyNoIndent', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6,
    wordWrap='CJK', alignment=TA_LEFT,
)

styles['caption'] = ParagraphStyle(
    name='Caption', fontName='NotoSerifSC', fontSize=9, leading=14,
    textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6,
    wordWrap='CJK', alignment=TA_CENTER,
)

styles['example'] = ParagraphStyle(
    name='Example', fontName='NotoSerifSC', fontSize=10, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=4, spaceAfter=4,
    wordWrap='CJK', alignment=TA_LEFT, leftIndent=18,
    borderColor=ACCENT, borderWidth=0, borderPadding=0,
)

styles['example_label'] = ParagraphStyle(
    name='ExampleLabel', fontName='NotoSansSC', fontSize=10.5, leading=16,
    textColor=ACCENT, spaceBefore=6, spaceAfter=2,
    wordWrap='CJK', alignment=TA_LEFT, leftIndent=8,
)

# Table styles
styles['th'] = ParagraphStyle(
    name='TableHeader', fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK',
)

styles['td'] = ParagraphStyle(
    name='TableCell', fontName='NotoSerifSC', fontSize=9, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK',
)

styles['td_left'] = ParagraphStyle(
    name='TableCellLeft', fontName='NotoSerifSC', fontSize=9, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
)

styles['toc_h1'] = ParagraphStyle(
    name='TOCHeading1', fontName='NotoSansSC', fontSize=13, leading=22,
    leftIndent=20, wordWrap='CJK', textColor=TEXT_PRIMARY,
)

styles['toc_h2'] = ParagraphStyle(
    name='TOCHeading2', fontName='NotoSerifSC', fontSize=11, leading=18,
    leftIndent=40, wordWrap='CJK', textColor=TEXT_MUTED,
)

styles['toc_title'] = ParagraphStyle(
    name='TOCTitle', fontName='NotoSansSC', fontSize=18, leading=28,
    alignment=TA_CENTER, textColor=ACCENT, spaceBefore=24, spaceAfter=18,
    wordWrap='CJK',
)

# ━━ Helper Functions ━━
MAX_KEEP_HEIGHT = PAGE_H * 0.4

def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        w, h = el.wrap(AVAILABLE_WIDTH, PAGE_H)
        total_h += h
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    else:
        return list(elements)


class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))


def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def make_table(data, col_widths, has_header=True):
    """Create a styled table with the standard color scheme."""
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    if has_header:
        style_cmds.append(('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR))
        style_cmds.append(('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT))
        # Alternating row colors
        for i in range(1, len(data)):
            bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


def add_page_number(canvas, doc):
    """Add page number to footer."""
    canvas.saveState()
    canvas.setFont('NotoSerifSC', 9)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    text = "- %d -" % page_num
    canvas.drawCentredString(PAGE_W / 2, BOTTOM_MARGIN / 2, text)
    canvas.restoreState()


# ━━ Build Body PDF ━━
def build_body_pdf(output_path):
    doc = TocDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title='大学英语四级 Part III Section A 词汇匹配 标注题型总结报告',
        author='Z.ai',
    )

    story = []

    # ── TOC ──
    toc = TableOfContents()
    toc.levelStyles = [styles['toc_h1'], styles['toc_h2']]
    story.append(Paragraph('<b>目  录</b>', styles['toc_title']))
    story.append(toc)
    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 1: 标注体系说明
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(add_heading('<b>一、标注体系说明</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '本报告基于 2015 年 6 月大学英语四级考试 Part III Section A 词汇匹配题型，共 3 套题、30 个空格、约 60 条知识点标注。数据采用 4 层 JSON 结构存储：metadata（考试元数据）→ sets（套题数组）→ passage（文章）→ segments（原文 + 空格交替序列）。',
        styles['body']
    ))

    story.append(Paragraph(
        '每个空格节点的 annotations 包含三个核心字段：<b>correct_answer</b>（正确选项字母）、<b>correct_word</b>（正确单词）、<b>knowledge_points[]</b>（知识点数组）。知识点采用双层分类体系：第一层为 <b>category</b>（语法/语义），第二层为 <b>sub_category</b>（具体子类）+ <b>description</b>（针对该空的具体解释）。通常每个空格标注 2 个知识点，一语法 + 一语义，形成互补的判断维度。',
        styles['body']
    ))

    story.append(Paragraph(
        '标注过程中已进行去噪处理：移除了题目指令语（Directions 段落）、重复标题段落和套题编号分隔符，保留了完整的原文内容和段落换行标记，确保数据可直接用于前端词汇学习系统的题目加载与知识点检索。',
        styles['body']
    ))

    # Data structure table
    story.append(Spacer(1, 12))
    ds_data = [
        [Paragraph('<b>层级</b>', styles['th']),
         Paragraph('<b>字段</b>', styles['th']),
         Paragraph('<b>说明</b>', styles['th'])],
        [Paragraph('第1层', styles['td']),
         Paragraph('metadata', styles['td']),
         Paragraph('考试年份/月份/套数/版本号', styles['td_left'])],
        [Paragraph('第2层', styles['td']),
         Paragraph('sets[]', styles['td']),
         Paragraph('3套题数组，每套含set_id/theme/word_bank/passage', styles['td_left'])],
        [Paragraph('第3层', styles['td']),
         Paragraph('passage.segments[]', styles['td']),
         Paragraph('原文text + 空格blank交替序列', styles['td_left'])],
        [Paragraph('第4层', styles['td']),
         Paragraph('annotations', styles['td']),
         Paragraph('correct_answer + correct_word + knowledge_points[]', styles['td_left'])],
    ]
    ds_table = make_table(ds_data, [AVAILABLE_WIDTH * 0.12, AVAILABLE_WIDTH * 0.28, AVAILABLE_WIDTH * 0.60])
    story.append(ds_table)
    story.append(Paragraph('表1  数据结构层次说明', styles['caption']))
    story.append(Spacer(1, 12))

    # Stats table
    stat_data = [
        [Paragraph('<b>套题</b>', styles['th']),
         Paragraph('<b>题号范围</b>', styles['th']),
         Paragraph('<b>空格数</b>', styles['th']),
         Paragraph('<b>知识点条数</b>', styles['th'])],
        [Paragraph('Set 1', styles['td']),
         Paragraph('36-45', styles['td']),
         Paragraph('10', styles['td']),
         Paragraph('20', styles['td'])],
        [Paragraph('Set 2', styles['td']),
         Paragraph('26-35', styles['td']),
         Paragraph('10', styles['td']),
         Paragraph('20', styles['td'])],
        [Paragraph('Set 3', styles['td']),
         Paragraph('26-35', styles['td']),
         Paragraph('10', styles['td']),
         Paragraph('20', styles['td'])],
        [Paragraph('<b>合计</b>', styles['td']),
         Paragraph('--', styles['td']),
         Paragraph('<b>30</b>', styles['td']),
         Paragraph('<b>~60</b>', styles['td'])],
    ]
    stat_table = make_table(stat_data, [AVAILABLE_WIDTH * 0.20, AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.30])
    story.append(stat_table)
    story.append(Paragraph('表2  标注统计', styles['caption']))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 2: 语法知识点分类
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>二、语法知识点分类</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '30 个空格共产生约 30 条语法知识点标注，归纳为 20 个子类。下表按出现频次排列，涵盖从固定搭配到词性判断的全部语法考点。',
        styles['body']
    ))

    # Grammar sub-category table
    story.append(Spacer(1, 10))
    grammar_data = [
        [Paragraph('<b>编号</b>', styles['th']),
         Paragraph('<b>子类名称</b>', styles['th']),
         Paragraph('<b>说明</b>', styles['th']),
         Paragraph('<b>次数</b>', styles['th'])],
        [Paragraph('G03', styles['td']), Paragraph('固定搭配', styles['td_left']),
         Paragraph('词与介词/词的固定组合', styles['td_left']), Paragraph('7', styles['td'])],
        [Paragraph('G06', styles['td']), Paragraph('动词不定式', styles['td_left']),
         Paragraph('have/opportunity/likely to do 结构', styles['td_left']), Paragraph('3', styles['td'])],
        [Paragraph('G15', styles['td']), Paragraph('动词不定式表目的', styles['td_left']),
         Paragraph('to do 表目的状语', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G05', styles['td']), Paragraph('形容词修饰名词', styles['td_left']),
         Paragraph('空格位于限定词与名词之间', styles['td_left']), Paragraph('3', styles['td'])],
        [Paragraph('G08', styles['td']), Paragraph('副词修饰动词', styles['td_left']),
         Paragraph('修饰sitting/published等动词', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G09', styles['td']), Paragraph('副词修饰分词', styles['td_left']),
         Paragraph('修饰过去分词published', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G17', styles['td']), Paragraph('副词作状语', styles['td_left']),
         Paragraph('句子主干完整，插入副词修饰', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G19', styles['td']), Paragraph('副词修饰形容词', styles['td_left']),
         Paragraph('空格修饰形容词（critically important）', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G02', styles['td']), Paragraph('形容词作表语', styles['td_left']),
         Paragraph('be动词后/感叹句how adj.结构', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G18', styles['td']), Paragraph('形容词+介词结构', styles['td_left']),
         Paragraph('adj + 特定介词（aware of / involved in）', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G10', styles['td']), Paragraph('动名词结构', styles['td_left']),
         Paragraph('spend time doing / by doing结构', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G11', styles['td']), Paragraph('名词单复数', styles['td_left']),
         Paragraph('a/these 后的数的限制', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G20', styles['td']), Paragraph('名词（单）', styles['td_left']),
         Paragraph('a/the 后名词', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G12', styles['td']), Paragraph('动词时态与主谓一致', styles['td_left']),
         Paragraph('需判断时态（过去时/进行时）', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('G01', styles['td']), Paragraph('词性判断与并列结构', styles['td_left']),
         Paragraph('与前后词并列，判断需填词性', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G04', styles['td']), Paragraph('介词后接名词', styles['td_left']),
         Paragraph('介词宾语位置需名词', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G07', styles['td']), Paragraph('名词作宾语', styles['td_left']),
         Paragraph('及物动词后宾语位置', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G13', styles['td']), Paragraph('名词并列', styles['td_left']),
         Paragraph('and连接平行结构，判断词性', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G14', styles['td']), Paragraph('动词原形作谓语', styles['td_left']),
         Paragraph('will/can后接动词原形', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('G16', styles['td']), Paragraph('动词原形并列', styles['td_left']),
         Paragraph('与其他动词并列，需原形', styles['td_left']), Paragraph('1', styles['td'])],
    ]
    gw = [AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.22, AVAILABLE_WIDTH * 0.52, AVAILABLE_WIDTH * 0.08]
    # Adjust: sum should be 0.90, need 0.10 left
    gw = [AVAILABLE_WIDTH * 0.09, AVAILABLE_WIDTH * 0.22, AVAILABLE_WIDTH * 0.56, AVAILABLE_WIDTH * 0.09]
    g_table = make_table(grammar_data, gw)
    story.append(g_table)
    story.append(Paragraph('表3  语法知识点子类全览（20类，按频次排列）', styles['caption']))
    story.append(Spacer(1, 14))

    # High-frequency grammar TOP 5
    story.append(add_heading('<b>2.1 高频语法考点 TOP 5</b>', styles['h2'], level=1))
    story.append(Spacer(1, 4))

    top5_grammar = [
        [Paragraph('<b>排名</b>', styles['th']),
         Paragraph('<b>考点</b>', styles['th']),
         Paragraph('<b>次数</b>', styles['th']),
         Paragraph('<b>典型例题</b>', styles['th'])],
        [Paragraph('1', styles['td']), Paragraph('固定搭配（G03）', styles['td_left']),
         Paragraph('7', styles['td']),
         Paragraph('country of origin / be made aware of / be involved in', styles['td_left'])],
        [Paragraph('2', styles['td']), Paragraph('动词不定式（G06+G15）', styles['td_left']),
         Paragraph('5', styles['td']),
         Paragraph('have the opportunity to do / to do表目的', styles['td_left'])],
        [Paragraph('3', styles['td']), Paragraph('形容词修饰名词（G05）', styles['td_left']),
         Paragraph('3', styles['td']),
         Paragraph('up-to-date information / effective way', styles['td_left'])],
        [Paragraph('4', styles['td']), Paragraph('副词类（G08/09/17/19）', styles['td_left']),
         Paragraph('5', styles['td']),
         Paragraph('passively sitting / critically important / especially', styles['td_left'])],
        [Paragraph('5', styles['td']), Paragraph('并列结构（G01/13/16）', styles['td_left']),
         Paragraph('3', styles['td']),
         Paragraph('resources and assets / recruit, support and retain', styles['td_left'])],
    ]
    t5g_widths = [AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.28, AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.56]
    t5g_table = make_table(top5_grammar, t5g_widths)
    story.append(t5g_table)
    story.append(Paragraph('表4  高频语法考点 TOP 5', styles['caption']))
    story.append(Spacer(1, 10))

    # Example for 固定搭配
    story.append(Paragraph('<b>典型例题：固定搭配</b>', styles['example_label']))
    story.append(Paragraph(
        '<b>原文</b>：Immigrant parents could talk about their country of ___(38)___',
        styles['example']
    ))
    story.append(Paragraph(
        '<b>答案</b>：L - origin　<b>语法</b>：country of origin（原籍国），固定介词搭配　<b>语义</b>：固定地理/法律用语',
        styles['example']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph('<b>典型例题：动词不定式</b>', styles['example_label']))
    story.append(Paragraph(
        '<b>原文</b>：Many students do not have the opportunity to ___(40)___ concerts',
        styles['example']
    ))
    story.append(Paragraph(
        '<b>答案</b>：B - attend　<b>语法</b>：have the opportunity to do结构，需动词原形　<b>语义</b>：attend concerts与visit museums并列',
        styles['example']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph('<b>典型例题：副词修饰</b>', styles['example_label']))
    story.append(Paragraph(
        '<b>原文</b>：spending so many hours sitting ___(26)___ can lead to obesity',
        styles['example']
    ))
    story.append(Paragraph(
        '<b>答案</b>：H - passively　<b>语法</b>：空格修饰sitting，需副词　<b>语义</b>：passively（被动地）描述久坐不动状态',
        styles['example']
    ))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 3: 语义知识点分类
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>三、语义知识点分类</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '语义知识点共 15 个子类，涵盖从动宾搭配到上下文语义推断的多个维度。与语法知识点互补，语义层关注的是"为什么选这个词"而非"为什么这个词性"。',
        styles['body']
    ))

    # Semantic sub-category table
    story.append(Spacer(1, 10))
    semantic_data = [
        [Paragraph('<b>编号</b>', styles['th']),
         Paragraph('<b>子类名称</b>', styles['th']),
         Paragraph('<b>说明</b>', styles['th']),
         Paragraph('<b>次数</b>', styles['th'])],
        [Paragraph('S05', styles['td']), Paragraph('动宾搭配', styles['td_left']),
         Paragraph('动词与宾语的语义匹配', styles['td_left']), Paragraph('7', styles['td'])],
        [Paragraph('S02', styles['td']), Paragraph('词义搭配', styles['td_left']),
         Paragraph('词与搭配成分的常见语义组合', styles['td_left']), Paragraph('4', styles['td'])],
        [Paragraph('S03', styles['td']), Paragraph('语义逻辑', styles['td_left']),
         Paragraph('根据上下文逻辑选词（递进/转折/对比）', styles['td_left']), Paragraph('4', styles['td'])],
        [Paragraph('S08', styles['td']), Paragraph('固定搭配（语义层）', styles['td_left']),
         Paragraph('固定短语的语义整体性', styles['td_left']), Paragraph('4', styles['td'])],
        [Paragraph('S01', styles['td']), Paragraph('语义衔接', styles['td_left']),
         Paragraph('与上下文语义场一致，近义并列', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('S07', styles['td']), Paragraph('研究/报告用语', styles['td_left']),
         Paragraph('学术文体常用词（outcomes/determine）', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('S11', styles['td']), Paragraph('语义场', styles['td_left']),
         Paragraph('词与所在主题场的一致性', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('S12', styles['td']), Paragraph('上下文语义', styles['td_left']),
         Paragraph('通过前后文推断空格词义', styles['td_left']), Paragraph('2', styles['td'])],
        [Paragraph('S04', styles['td']), Paragraph('逻辑关系', styles['td_left']),
         Paragraph('因果/递进/举例逻辑', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S06', styles['td']), Paragraph('近义词辨析', styles['td_left']),
         Paragraph('同义词中选最符合语境者', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S09', styles['td']), Paragraph('概括性语义', styles['td_left']),
         Paragraph('空格词概括前后段落语义', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S10', styles['td']), Paragraph('特殊语义（略带贬义）', styles['td_left']),
         Paragraph('褒义词在特定语境中反用', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S13', styles['td']), Paragraph('核心语义', styles['td_left']),
         Paragraph('主旨句/主题句关键词', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S14', styles['td']), Paragraph('语义逻辑链', styles['td_left']),
         Paragraph('词在连续动作/逻辑链中的位置', styles['td_left']), Paragraph('1', styles['td'])],
        [Paragraph('S15', styles['td']), Paragraph('抽象名词搭配', styles['td_left']),
         Paragraph('形容词 + 抽象名词的固定语义', styles['td_left']), Paragraph('1', styles['td'])],
    ]
    sw = [AVAILABLE_WIDTH * 0.09, AVAILABLE_WIDTH * 0.26, AVAILABLE_WIDTH * 0.52, AVAILABLE_WIDTH * 0.09]
    s_table = make_table(semantic_data, sw)
    story.append(s_table)
    story.append(Paragraph('表5  语义知识点子类全览（15类，按频次排列）', styles['caption']))
    story.append(Spacer(1, 14))

    # High-frequency semantic TOP 5
    story.append(add_heading('<b>3.1 高频语义考点 TOP 5</b>', styles['h2'], level=1))
    story.append(Spacer(1, 4))

    top5_semantic = [
        [Paragraph('<b>排名</b>', styles['th']),
         Paragraph('<b>考点</b>', styles['th']),
         Paragraph('<b>次数</b>', styles['th']),
         Paragraph('<b>典型例子</b>', styles['th'])],
        [Paragraph('1', styles['td']), Paragraph('动宾搭配（S05）', styles['td_left']),
         Paragraph('7', styles['td']),
         Paragraph('attend concerts / consume them / develop solutions', styles['td_left'])],
        [Paragraph('2', styles['td']), Paragraph('词义搭配（S02）', styles['td_left']),
         Paragraph('4', styles['td']),
         Paragraph('excellent teachers / previously published', styles['td_left'])],
        [Paragraph('3', styles['td']), Paragraph('语义逻辑（S03）', styles['td_left']),
         Paragraph('4', styles['td']),
         Paragraph('passively（被动地）/ up-to-date（最新的）', styles['td_left'])],
        [Paragraph('4', styles['td']), Paragraph('固定搭配语义（S08）', styles['td_left']),
         Paragraph('4', styles['td']),
         Paragraph('country of origin / reach full potential', styles['td_left'])],
        [Paragraph('5', styles['td']), Paragraph('研究用语（S07）', styles['td_left']),
         Paragraph('2', styles['td']),
         Paragraph('outcomes / determine whether', styles['td_left'])],
    ]
    t5s_widths = [AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.26, AVAILABLE_WIDTH * 0.08, AVAILABLE_WIDTH * 0.58]
    t5s_table = make_table(top5_semantic, t5s_widths)
    story.append(t5s_table)
    story.append(Paragraph('表6  高频语义考点 TOP 5', styles['caption']))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 4: 知识点组合统计
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>四、知识点组合统计</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '每个空格通常同时涉及语法和语义两个维度的知识点。分析 30 个空格的知识点组合模式，发现最常见的组合类型如下表所示。语法定位与语义筛选相结合是解题的核心策略。',
        styles['body']
    ))

    # Combination table
    story.append(Spacer(1, 10))
    combo_data = [
        [Paragraph('<b>组合类型</b>', styles['th']),
         Paragraph('<b>频率</b>', styles['th']),
         Paragraph('<b>典型例子</b>', styles['th'])],
        [Paragraph('语法：固定搭配 + 语义：动宾搭配', styles['td_left']),
         Paragraph('6次', styles['td']),
         Paragraph('attend (G06+S05)', styles['td_left'])],
        [Paragraph('语法：形容词修饰名词 + 语义：词义搭配', styles['td_left']),
         Paragraph('4次', styles['td']),
         Paragraph('excellent (G02+S02)', styles['td_left'])],
        [Paragraph('语法：副词类 + 语义：语义逻辑', styles['td_left']),
         Paragraph('4次', styles['td']),
         Paragraph('passively (G08+S03)', styles['td_left'])],
        [Paragraph('语法：并列结构 + 语义：逻辑链', styles['td_left']),
         Paragraph('3次', styles['td']),
         Paragraph('retain (G16+S14)', styles['td_left'])],
        [Paragraph('语法：固定搭配 + 语义：固定搭配', styles['td_left']),
         Paragraph('3次', styles['td']),
         Paragraph('aware (G03+S08)', styles['td_left'])],
    ]
    combo_widths = [AVAILABLE_WIDTH * 0.42, AVAILABLE_WIDTH * 0.12, AVAILABLE_WIDTH * 0.46]
    combo_table = make_table(combo_data, combo_widths)
    story.append(combo_table)
    story.append(Paragraph('表7  最常见知识点组合模式', styles['caption']))
    story.append(Spacer(1, 14))

    # POS distribution
    story.append(add_heading('<b>4.1 词性分布</b>', styles['h2'], level=1))
    story.append(Spacer(1, 4))

    story.append(Paragraph(
        '30 个空格的正确答案按词性统计如下：动词（含分词/动名词）占比最高，达到 40%；名词次之，占 33%；形容词和副词分别占 17% 和 10%。这一分布与四级词汇匹配题"以实词为主"的命题特点一致。',
        styles['body']
    ))

    story.append(Spacer(1, 10))
    pos_data = [
        [Paragraph('<b>词性</b>', styles['th']),
         Paragraph('<b>数量</b>', styles['th']),
         Paragraph('<b>占比</b>', styles['th']),
         Paragraph('<b>代表词</b>', styles['th'])],
        [Paragraph('动词（含分词/动名词）', styles['td_left']),
         Paragraph('12', styles['td']),
         Paragraph('40%', styles['td']),
         Paragraph('attend, consume, climbed, retain, volunteering', styles['td_left'])],
        [Paragraph('名词', styles['td_left']),
         Paragraph('10', styles['td']),
         Paragraph('33%', styles['td']),
         Paragraph('assets, origin, guidelines, outcomes, potential', styles['td_left'])],
        [Paragraph('形容词', styles['td_left']),
         Paragraph('5', styles['td']),
         Paragraph('17%', styles['td']),
         Paragraph('excellent, up-to-date, harmful, effective, beneficial', styles['td_left'])],
        [Paragraph('副词', styles['td_left']),
         Paragraph('3', styles['td']),
         Paragraph('10%', styles['td']),
         Paragraph('passively, previously, critically, especially', styles['td_left'])],
    ]
    pos_widths = [AVAILABLE_WIDTH * 0.28, AVAILABLE_WIDTH * 0.10, AVAILABLE_WIDTH * 0.10, AVAILABLE_WIDTH * 0.52]
    pos_table = make_table(pos_data, pos_widths)
    story.append(pos_table)
    story.append(Paragraph('表8  词性分布统计', styles['caption']))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 5: 典型例题精析
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>五、典型例题精析</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '以下按知识点分类选取 5 道典型题进行详细解析，展示语法定位与语义筛选相结合的解题思路。',
        styles['body']
    ))

    # 5.1 固定搭配类
    story.append(Spacer(1, 12))
    story.append(add_heading('<b>5.1 固定搭配类</b>', styles['h2'], level=1))

    story.append(Paragraph('<b>例1：country of origin（固定介词搭配）</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：Immigrant parents could talk about their country of ___(38)___',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：L - origin',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：country of origin（原籍国），介词 of 后接名词，构成固定搭配。语义分析：country of origin 是固定的地理/法律用语，指移民的"原籍国"，与上文"Immigrant parents"语义呼应。',
        styles['body']
    ))

    story.append(Paragraph('<b>例2：be made aware of（形容词+介词结构）</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：Families must be made ___(42)___ of field trips',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：C - aware',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：be made aware of（使......知晓），固定搭配结构。aware 与 of 构成形容词+介词的固定搭配。语义分析：此句要求家长"知晓"实地考察信息，aware + of 强调信息的告知义务。',
        styles['body']
    ))

    story.append(Paragraph('<b>例3：be involved in（固定搭配）</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：students can learn to be ___(43)___ in community projects',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：H - involved',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：be involved in（参与），过去分词作形容词，与 in 构成固定搭配。语义分析：学生"参与"社区项目，involved 与 community projects 语义匹配，体现主动参与精神。',
        styles['body']
    ))

    # 5.2 动词不定式类
    story.append(Spacer(1, 12))
    story.append(add_heading('<b>5.2 动词不定式类</b>', styles['h2'], level=1))

    story.append(Paragraph('<b>例1：have the opportunity to do</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：Many students do not have the opportunity to ___(40)___ concerts or visit museums',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：B - attend',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：have the opportunity to do 结构，to 后需动词原形。语义分析：attend concerts（参加音乐会）与 visit museums 并列，构成"参加文化活动"的语义场。',
        styles['body']
    ))

    story.append(Paragraph('<b>例2：to do 表目的</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：they didn\'t compare different sedentary activities to ___(35)___ whether...',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：D - determine',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：to 后接动词原形，引导目的状语。语义分析：determine whether...（确定是否......），学术研究常用语，表明比较活动的目的是"确定"电视观看的独立风险。',
        styles['body']
    ))

    # 5.3 副词修饰类
    story.append(Spacer(1, 12))
    story.append(add_heading('<b>5.3 副词修饰类</b>', styles['h2'], level=1))

    story.append(Paragraph('<b>例1：副词修饰动词</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：spending so many hours sitting ___(26)___ can lead to obesity',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：H - passively',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：空格修饰 sitting，需副词。语义分析：passively（被动地）描述久坐的不活跃状态，与健康风险形成因果链——被动久坐→肥胖→疾病。',
        styles['body']
    ))

    story.append(Paragraph('<b>例2：副词修饰形容词</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：It is ___(28)___ important that we provide teachers...',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：G - critically',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：空格修饰 important，需副词。语义分析：critically important（至关重要的）构成固定强调用语，凸显教育公平的紧迫性。',
        styles['body']
    ))

    # 5.4 并列结构类
    story.append(Spacer(1, 12))
    story.append(add_heading('<b>5.4 并列结构类</b>', styles['h2'], level=1))

    story.append(Paragraph('<b>例1：动词原形并列</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：how to better recruit, support and ___(33)___ effective teachers',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：O - retain',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：与 recruit、support 并列，需动词原形。语义分析：招聘→支持→留住，构成人力资源管理的完整逻辑链，retain（留住）是逻辑链末端的关键环节。',
        styles['body']
    ))

    story.append(Paragraph('<b>例2：名词并列</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：Your students\' parents are resources and ___(36)___',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：A - assets',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：与 resources 由 and 连接，需复数名词，构成并列结构。语义分析：assets（财富/资产）与 resources（资源）近义并列，共同描述父母对教育的价值。',
        styles['body']
    ))

    # 5.5 语义逻辑类
    story.append(Spacer(1, 12))
    story.append(add_heading('<b>5.5 语义逻辑类</b>', styles['h2'], level=1))

    story.append(Paragraph('<b>例1：近义词同义复现</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：the odds of dying prematurely ___(31)___ 13%',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：A - climbed',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：句子缺谓语，上下文为过去时，需动词过去式。语义分析：climbed（攀升）与上文 rose、increased 同义复现，三个动词共同描述数据上升趋势，形成修辞上的"三重递进"。',
        styles['body']
    ))

    story.append(Paragraph('<b>例2：概括性语义</b>', styles['example_label']))
    story.append(Paragraph(
        '原文：All of these ___(32)___ are linked to a lack of physical activity',
        styles['example']
    ))
    story.append(Paragraph(
        '答案：G - outcomes',
        styles['example']
    ))
    story.append(Paragraph(
        '语法分析：these 后需复数名词作主语。语义分析：outcomes（结果）概括上文所列的具体患病风险数据（糖尿病风险上升 20%、心脏病风险上升 15%、早逝风险上升 13%），是从具体到抽象的语义概括。',
        styles['body']
    ))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 6: 备考策略总结
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>六、备考策略总结</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(add_heading('<b>6.1 解题优先级</b>', styles['h2'], level=1))

    priority_data = [
        [Paragraph('<b>步骤</b>', styles['th']),
         Paragraph('<b>操作</b>', styles['th']),
         Paragraph('<b>说明</b>', styles['th'])],
        [Paragraph('第一步', styles['td']),
         Paragraph('语法定位', styles['td_left']),
         Paragraph('判断空格所需词性（名词/动词/形容词/副词）', styles['td_left'])],
        [Paragraph('第二步', styles['td']),
         Paragraph('语法约束', styles['td_left']),
         Paragraph('利用固定搭配/并列结构/时态等进一步缩小范围', styles['td_left'])],
        [Paragraph('第三步', styles['td']),
         Paragraph('语义筛选', styles['td_left']),
         Paragraph('通过动宾搭配/语义逻辑/上下文确认词义', styles['td_left'])],
        [Paragraph('第四步', styles['td']),
         Paragraph('排除验证', styles['td_left']),
         Paragraph('词库中剩余词逐一排除，确保无遗漏', styles['td_left'])],
    ]
    pri_widths = [AVAILABLE_WIDTH * 0.12, AVAILABLE_WIDTH * 0.18, AVAILABLE_WIDTH * 0.70]
    pri_table = make_table(priority_data, pri_widths)
    story.append(pri_table)
    story.append(Paragraph('表9  解题优先级步骤', styles['caption']))
    story.append(Spacer(1, 14))

    story.append(add_heading('<b>6.2 高频考点快查</b>', styles['h2'], level=1))

    quick_data = [
        [Paragraph('<b>考点</b>', styles['th']),
         Paragraph('<b>判断信号</b>', styles['th'])],
        [Paragraph('固定搭配', styles['td_left']),
         Paragraph('be + adj + of/in/to；country of；channel surfing', styles['td_left'])],
        [Paragraph('并列结构', styles['td_left']),
         Paragraph('A, B, and ___；A and ___', styles['td_left'])],
        [Paragraph('动词不定式', styles['td_left']),
         Paragraph('opportunity to ___；to ___（目的状语）', styles['td_left'])],
        [Paragraph('副词', styles['td_left']),
         Paragraph('修饰动词/形容词，句子主干已完整', styles['td_left'])],
        [Paragraph('研究学术用语', styles['td_left']),
         Paragraph('determine, outcomes, previously 等', styles['td_left'])],
    ]
    quick_widths = [AVAILABLE_WIDTH * 0.25, AVAILABLE_WIDTH * 0.75]
    quick_table = make_table(quick_data, quick_widths)
    story.append(quick_table)
    story.append(Paragraph('表10  高频考点快查表', styles['caption']))
    story.append(Spacer(1, 14))

    story.append(add_heading('<b>6.3 词库使用策略</b>', styles['h2'], level=1))

    story.append(Paragraph(
        '<b>先定性</b>：通过语法分析确定空格词性，从 15 个选项中圈出 5-7 个候选词。例如，判断空格需副词，则先排除名词、动词等，仅保留副词选项。',
        styles['body_no_indent']
    ))
    story.append(Paragraph(
        '<b>再定义</b>：通过语义分析将候选词缩小到 2-3 个。结合动宾搭配、语义逻辑、上下文语境进行二次筛选。',
        styles['body_no_indent']
    ))
    story.append(Paragraph(
        '<b>最后排除</b>：利用"已用词不重复"原则，将已确定答案的词从候选列表中划去，逐空验证。若某空有两个候选词，先跳过，完成其他空后再回来确认。',
        styles['body_no_indent']
    ))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Section 7: 本批次题目完整索引
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 24))
    story.append(add_heading('<b>七、本批次题目完整索引</b>', styles['h1'], level=0))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        '本批次为 2015 年 6 月 CET4 考试，共 3 套 Part III Section A 词汇匹配题。下表列出每套题的主题、题号范围和完整答案序列，便于快速检索和对照练习。',
        styles['body']
    ))

    story.append(Spacer(1, 10))
    index_data = [
        [Paragraph('<b>套次</b>', styles['th']),
         Paragraph('<b>主题</b>', styles['th']),
         Paragraph('<b>题号范围</b>', styles['th']),
         Paragraph('<b>答案序列</b>', styles['th'])],
        [Paragraph('Set 1', styles['td']),
         Paragraph('将社区资源带入课堂', styles['td_left']),
         Paragraph('36-45', styles['td']),
         Paragraph('A  E  L  N  B  G  C  H  D  O', styles['td'])],
        [Paragraph('Set 2', styles['td']),
         Paragraph('看电视的健康危害', styles['td_left']),
         Paragraph('26-35', styles['td']),
         Paragraph('H  F  I  L  C  A  G  E  B  D', styles['td'])],
        [Paragraph('Set 3', styles['td']),
         Paragraph('教育公平倡议', styles['td_left']),
         Paragraph('26-35', styles['td']),
         Paragraph('A  K  G  L  D  H  J  O  E  C', styles['td'])],
    ]
    idx_widths = [AVAILABLE_WIDTH * 0.10, AVAILABLE_WIDTH * 0.28, AVAILABLE_WIDTH * 0.15, AVAILABLE_WIDTH * 0.47]
    idx_table = make_table(index_data, idx_widths)
    story.append(idx_table)
    story.append(Paragraph('表11  本批次题目完整索引', styles['caption']))

    # ── Build ──
    doc.multiBuild(story, onLaterPages=add_page_number, onFirstPage=add_page_number)
    print(f"Body PDF built: {output_path}")


# ━━ Cover HTML Generation ━━
def create_cover_html(output_path):
    """Create cover HTML using teal accent theme, Layout 01 style."""
    html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400;700&display=swap" rel="stylesheet">
<style>
@page { size: 794px 1123px; margin: 0; }
html, body { margin: 0; padding: 0; width: 794px; height: 1123px; background: #f6f6f5; font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif; }
.cover { position: relative; width: 100%; height: 100%; overflow: hidden; }
/* Accent bar */
.accent-bar { position: absolute; top: 0; left: 0; width: 8px; height: 100%; background: #1c7796; }
/* Geometric accent - horizontal line */
.geo-line { position: absolute; top: 320px; left: 80px; width: 240px; height: 2px; background: #1c7796; opacity: 0.6; }
.geo-line-2 { position: absolute; top: 326px; left: 80px; width: 160px; height: 1px; background: #1c7796; opacity: 0.3; }
/* Content */
.kicker { position: absolute; top: 200px; left: 80px; font-size: 16px; font-weight: 400; color: #7c7a73; letter-spacing: 4px; text-transform: uppercase; }
.title { position: absolute; top: 250px; left: 80px; width: 634px; font-family: 'Noto Serif SC', serif; font-size: 36px; font-weight: 700; color: #201f1d; line-height: 1.5; }
.subtitle { position: absolute; top: 410px; left: 80px; width: 540px; font-size: 18px; font-weight: 300; color: #7c7a73; line-height: 1.7; }
/* Meta */
.meta { position: absolute; bottom: 160px; left: 80px; font-size: 14px; color: #7c7a73; line-height: 2; }
.meta span { color: #1c7796; font-weight: 700; }
/* Bottom bar */
.bottom-bar { position: absolute; bottom: 120px; left: 80px; width: 634px; height: 1px; background: #c3c0b4; }
/* Watermark year */
.watermark { position: absolute; top: 600px; right: 40px; font-size: 120px; font-weight: 700; color: #e5e3df; opacity: 0.5; letter-spacing: -4px; font-family: 'Times New Roman', serif; }
</style>
</head>
<body>
<div class="cover">
  <div class="accent-bar"></div>
  <div class="kicker">CET-4 VOCABULARY MATCHING</div>
  <div class="title">大学英语四级<br>Part III Section A<br>词汇匹配 · 标注题型总结报告</div>
  <div class="geo-line"></div>
  <div class="geo-line-2"></div>
  <div class="subtitle">基于 2015 年 6 月真题 · 3 套题 · 30 个空格 · 60 条知识点标注<br>语法 20 子类 + 语义 15 子类全覆盖分析</div>
  <div class="meta">
    考试年份：<span>2015 年 6 月</span><br>
    标注版本：<span>v1.0</span><br>
    数据来源：<span>201506P3SA.json</span>
  </div>
  <div class="bottom-bar"></div>
  <div class="watermark">2015</div>
</div>
</body>
</html>'''
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Cover HTML created: {output_path}")


def render_cover(html_path, pdf_path):
    """Render cover HTML to PDF using html2poster.js."""
    scripts_dir = os.path.join(PDF_SKILL_DIR, 'scripts')
    result = subprocess.run(
        ['node', os.path.join(scripts_dir, 'html2poster.js'),
         html_path, '--output', pdf_path, '--width', '794px'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Cover render error: {result.stderr}")
        raise RuntimeError(f"html2poster.js failed: {result.stderr}")
    print(f"Cover PDF rendered: {pdf_path}")


def merge_pdfs(cover_pdf, body_pdf, output_pdf):
    """Merge cover + body into single output PDF."""
    from pypdf import PdfReader, PdfWriter, Transformation

    A4_W, A4_H = 595.28, 841.89

    def normalize_page(page):
        box = page.mediabox
        w, h = float(box.width), float(box.height)
        if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
            sx, sy = A4_W / w, A4_H / h
            page.add_transformation(Transformation().scale(sx=sx, sy=sy))
            page.mediabox.lower_left = (0, 0)
            page.mediabox.upper_right = (A4_W, A4_H)
        return page

    writer = PdfWriter()
    # Cover as page 1
    cover_page = PdfReader(cover_pdf).pages[0]
    writer.add_page(normalize_page(cover_page))
    # Body pages follow
    for page in PdfReader(body_pdf).pages:
        writer.add_page(normalize_page(page))

    writer.add_metadata({
        '/Title': '大学英语四级 Part III Section A 词汇匹配 标注题型总结报告',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': 'CET4 词汇匹配标注题型分析',
    })
    with open(output_pdf, 'wb') as f:
        writer.write(f)
    print(f"Final PDF merged: {output_pdf}")


# ━━ Main ━━
if __name__ == '__main__':
    base_dir = '/home/z/my-project/download'
    body_pdf = os.path.join(base_dir, '_body.pdf')
    cover_html = os.path.join(base_dir, '_cover.html')
    cover_pdf = os.path.join(base_dir, '_cover.pdf')
    final_pdf = os.path.join(base_dir, 'CET4_P3SA_标注题型总结报告.pdf')

    # Step 1: Build body PDF
    print("=== Step 1: Building body PDF ===")
    build_body_pdf(body_pdf)

    # Step 2: Create cover HTML
    print("\\n=== Step 2: Creating cover HTML ===")
    create_cover_html(cover_html)

    # Step 3: Render cover PDF
    print("\\n=== Step 3: Rendering cover PDF ===")
    render_cover(cover_html, cover_pdf)

    # Step 4: Merge
    print("\\n=== Step 4: Merging PDFs ===")
    merge_pdfs(cover_pdf, body_pdf, final_pdf)

    # Cleanup temp files
    for f in [body_pdf, cover_html, cover_pdf]:
        if os.path.exists(f):
            os.remove(f)

    print(f"\\n=== Done! Final PDF: {final_pdf} ===")
    # Report size
    size = os.path.getsize(final_pdf)
    print(f"File size: {size / 1024:.1f} KB")
