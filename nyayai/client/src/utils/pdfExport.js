import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import QRCode from 'qrcode';

const COLORS = {
  obsidian: '#0B1220',
  navy: '#14213D',
  primaryNavy: '#0F172A',
  accentBlue: '#2563EB',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  gold: '#C9A227',
  pearl: '#F8FAFC',
  platinum: '#E5E7EB',
  muted: '#64748B',
  border: '#CBD5E1'
};

const FONT_MAP = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

function hasTtfEntries(value) {
  return !!value && typeof value === 'object' && Object.keys(value).some((k) => /\.ttf$/i.test(k));
}

function resolveVfs(source) {
  if (!source || typeof source !== 'object') return {};
  if (hasTtfEntries(source)) return source;
  if (hasTtfEntries(source.vfs)) return source.vfs;
  if (hasTtfEntries(source.default)) return source.default;
  if (hasTtfEntries(source?.pdfMake?.vfs)) return source.pdfMake.vfs;
  if (hasTtfEntries(source?.default?.pdfMake?.vfs)) return source.default.pdfMake.vfs;
  return {};
}

function initPdfMake() {
  const vfs = resolveVfs(pdfFonts);
  if (hasTtfEntries(vfs)) {
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs);
    } else {
      pdfMake.vfs = vfs;
    }
  }

  if (typeof pdfMake.setFonts === 'function') {
    pdfMake.setFonts(FONT_MAP);
  }
  if (typeof pdfMake.addFonts === 'function') {
    pdfMake.addFonts(FONT_MAP);
  } else {
    pdfMake.fonts = { ...(pdfMake.fonts || {}), ...FONT_MAP };
  }
}

initPdfMake();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = 'Not Available') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function cleanCaseName(value = '') {
  return String(value || '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/^Case\s*Context\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestCaseName(candidates = []) {
  const cleaned = asArray(candidates)
    .map((v) => cleanCaseName(v))
    .filter(Boolean)
    .filter((v) => !/^untitled\s*case$/i.test(v));
  if (cleaned.length === 0) return 'Untitled Case';
  return cleaned.sort((a, b) => b.length - a.length)[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function scoreToLevel(score) {
  if (score >= 75) return 'High';
  if (score >= 45) return 'Moderate';
  return 'Low';
}

function verdictColor(verdict) {
  const v = String(verdict || '').toUpperCase();
  if (v.includes('WIN')) return COLORS.success;
  if (v.includes('LOSE')) return COLORS.danger;
  return COLORS.warning;
}

function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseBulletsFromRange(lines, startRegex, stopRegexList = []) {
  const startIndex = lines.findIndex((l) => startRegex.test(l));
  if (startIndex === -1) return [];
  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (stopRegexList.some((re) => re.test(lines[i]))) {
      endIndex = i;
      break;
    }
  }
  return lines
    .slice(startIndex + 1, endIndex)
    .map((l) => l.replace(/^[-*\u2022]\s*/, '').trim())
    .filter(Boolean);
}

function parseQAPairs(text) {
  const pairs = [];
  const regex = /Q(\d+)\s*:\s*([\s\S]*?)\n\s*A\1\s*:\s*([\s\S]*?)(?=\n\s*Q\d+\s*:|$)/gi;
  let match = regex.exec(text);
  while (match) {
    pairs.push({
      id: Number(match[1]),
      question: String(match[2] || '').replace(/\s+/g, ' ').trim(),
      answer: String(match[3] || '').replace(/\s+/g, ' ').trim()
    });
    match = regex.exec(text);
  }
  return pairs;
}

function parseRoleTranscript(lines) {
  const items = [];
  for (const line of lines) {
    const match = line.match(/^(opponent|user)\s*:\s*(.+)$/i);
    if (match) {
      items.push({ role: match[1].toLowerCase(), text: match[2] });
    }
  }
  return items;
}

function extractMetaFromElement(element) {
  const text = String(element?.innerText || '');
  const lines = splitLines(text);
  const caseLine = text.match(/Case:\s*([^|\n]+)\|\s*Type:\s*([^|\n]+)\|\s*Status:\s*([^\n]+)/i);
  const caseContext = text.match(/Case\s*context\s*:\s*([^\n]+)/i)?.[1] || '';
  const starredContext = text.match(/\*\s*Case\s*Context\s*:\s*([^\n*]+)\*\*/i)?.[1] || '';

  const sessionId = text.match(/Session\s*ID\s*:\s*([^\n]+)/i)?.[1] || '';
  const finalVerdict = text.match(/Final\s*Verdict\s*:\s*([^\n]+)/i)?.[1]
    || text.match(/Winner\s*:\s*([^\n]+)/i)?.[1]
    || '';
  const winningProbability = Number(
    text.match(/Winning\s*Probability\s*:\s*(\d+)%/i)?.[1]
    || text.match(/Chance\s*of\s*Winning\s*:\s*(\d+)%/i)?.[1]
    || text.match(/Confidence\s*:\s*(\d+)%/i)?.[1]
    || 0
  );

  const caseSummary = parseBulletsFromRange(
    lines,
    /Case\s*Summary/i,
    [/Question\s*vs\s*Answer/i, /Transcript/i, /Verdict\s*Engine\s*Output/i, /Applicable\s*Laws/i]
  );

  const favorableLaws = parseBulletsFromRange(lines, /Favorable\s*Laws|Favourable\s*To\s*You/i, [/Laws\s*Against|Possible\s*Sections\s*Against/i]);
  const adverseLaws = parseBulletsFromRange(lines, /Laws\s*Against\s*User|Possible\s*Sections\s*Against/i, [/Strengths/i]);
  const strengths = parseBulletsFromRange(lines, /Strengths/i, [/Weaknesses/i]);
  const weaknesses = parseBulletsFromRange(lines, /Weaknesses/i, [/Suggestions|Recommendations/i]);
  const recommendations = parseBulletsFromRange(lines, /Suggestions|Recommendations/i, [/Full\s*Transcript|Applicable\s*Schemes/i]);
  const applicableLaws = parseBulletsFromRange(lines, /Applicable\s*Laws/i, [/Transcript|Verdict|Strengths|Weaknesses|Suggestions/i]);

  const createdAt = text.match(/Generated\s*Date\s*:\s*([^\n]+)/i)?.[1] || new Date().toLocaleString();
  const caseTitle = pickBestCaseName([caseLine?.[1], caseContext, starredContext]);
  const caseType = caseLine?.[2] || text.match(/Type\s*:\s*([^|\n]+)/i)?.[1] || 'GENERAL_DISPUTE';
  const status = caseLine?.[3] || text.match(/Status\s*:\s*([^\n]+)/i)?.[1] || 'active';

  return {
    caseTitle: safeText(caseTitle),
    caseType: safeText(caseType),
    status: safeText(status),
    sessionId: safeText(sessionId),
    createdAt: safeText(createdAt),
    caseSummary: asArray(caseSummary),
    qaPairs: asArray(parseQAPairs(text)),
    roleTranscript: asArray(parseRoleTranscript(lines)),
    winningProbability: Number.isFinite(winningProbability) ? clamp(winningProbability, 0, 100) : 0,
    finalVerdict: safeText(finalVerdict, 'UNCERTAIN'),
    favorableLaws: asArray(favorableLaws),
    adverseLaws: asArray(adverseLaws),
    strengths: asArray(strengths),
    weaknesses: asArray(weaknesses),
    recommendations: asArray(recommendations),
    applicableLaws: asArray(applicableLaws),
    rawText: text
  };
}

function kpiCard(title, value, color, subtitle = '') {
  return {
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          { text: title, style: 'kpiTitle' },
          { text: value, style: 'kpiValue', color },
          subtitle ? { text: subtitle, style: 'kpiSubtitle' } : null
        ].filter(Boolean),
        fillColor: '#101B31',
        border: [true, true, true, true],
        borderColor: '#25314B'
      }]]
    },
    layout: {
      hLineColor: () => '#25314B',
      vLineColor: () => '#25314B',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    }
  };
}

function meter(label, value, color) {
  const safeValue = clamp(value, 0, 100);
  return {
    stack: [
      { text: `${label} (${safeValue}%)`, style: 'smallLabel', margin: [0, 0, 0, 4] },
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 510, h: 8, color: '#E2E8F0' },
          { type: 'rect', x: 0, y: 0, w: (510 * safeValue) / 100, h: 8, color }
        ],
        margin: [0, 0, 0, 10]
      }
    ]
  };
}

function sectionTitle(text) {
  return { text, style: 'sectionTitle', pageBreak: 'before' };
}

function buildCover(meta, qrData) {
  const verdict = safeText(meta.finalVerdict, 'UNCERTAIN').toUpperCase();
  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: 'NYAYAI', style: 'coverBrand' },
            { text: 'AI LEGAL INTELLIGENCE REPORT', style: 'coverTitle', margin: [0, 10, 0, 22] },
            {
              canvas: [{ type: 'line', x1: 0, y1: 0, x2: 512, y2: 0, lineWidth: 1, lineColor: COLORS.gold }],
              margin: [0, 0, 0, 18]
            },
            {
              table: {
                widths: ['32%', '68%'],
                body: [
                  [{ text: 'Case Name', style: 'coverLabel' }, { text: safeText(meta.caseTitle), style: 'coverValue' }],
                  [{ text: 'Case Type', style: 'coverLabel' }, { text: safeText(meta.caseType), style: 'coverValue' }],
                  [{ text: 'Session ID', style: 'coverLabel' }, { text: safeText(meta.sessionId), style: 'coverValue' }],
                  [{ text: 'Generated On', style: 'coverLabel' }, { text: safeText(meta.createdAt), style: 'coverValue' }]
                ]
              },
              layout: {
                fillColor: () => '#0E1B35',
                hLineColor: () => '#243552',
                vLineColor: () => '#243552',
                paddingLeft: () => 10,
                paddingRight: () => 10,
                paddingTop: () => 8,
                paddingBottom: () => 8
              },
              margin: [0, 0, 0, 20]
            },
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { text: verdict, style: 'coverVerdict', fillColor: verdictColor(verdict), alignment: 'center', margin: [0, 0, 0, 4] },
                    { text: `Winning Probability: ${meta.winningProbability}%`, style: 'coverMeta', alignment: 'center' }
                  ]
                },
                qrData ? { width: 90, image: qrData, fit: [80, 80], alignment: 'right' } : { text: '' }
              ]
            },
            { text: 'Confidential Judicial Intelligence Dossier', style: 'coverFooter', margin: [0, 36, 0, 0] }
          ],
          fillColor: COLORS.obsidian,
          border: [false, false, false, false],
          margin: [18, 70, 18, 70]
        }]]
      },
      layout: 'noBorders'
    }
  ];
}

function buildExecutiveSummary(meta, metrics) {
  const verdict = safeText(meta.finalVerdict, 'UNCERTAIN').toUpperCase();
  return [
    sectionTitle('1. Executive Summary'),
    { text: metrics.summarySentence, style: 'body', margin: [0, 0, 0, 14] },
    {
      columns: [
        { width: '33%', stack: [kpiCard('Final Verdict', verdict, verdictColor(verdict))] },
        { width: '33%', stack: [kpiCard('Winning Probability', `${meta.winningProbability}%`, COLORS.accentBlue)] },
        { width: '34%', stack: [kpiCard('Risk Level', scoreToLevel(metrics.riskScore), metrics.riskScore > 66 ? COLORS.danger : metrics.riskScore > 40 ? COLORS.warning : COLORS.success)] }
      ],
      columnGap: 10,
      margin: [0, 0, 0, 10]
    },
    {
      columns: [
        { width: '33%', stack: [kpiCard('Case Strength', `${metrics.caseStrength}%`, COLORS.success)] },
        { width: '33%', stack: [kpiCard('Evidence Quality', `${metrics.evidenceScore}%`, COLORS.accentBlue)] },
        { width: '34%', stack: [kpiCard('Opponent Pressure', `${metrics.pressureScore}%`, COLORS.warning)] }
      ],
      columnGap: 10,
      margin: [0, 0, 0, 12]
    },
    meter('Winning Probability', meta.winningProbability, COLORS.accentBlue),
    meter('Risk Exposure', metrics.riskScore, metrics.riskScore > 66 ? COLORS.danger : COLORS.warning),
    meter('Evidence Strength', metrics.evidenceScore, COLORS.success)
  ];
}

function buildCaseSnapshot(meta, metrics) {
  const timeline = meta.caseSummary.length > 0
    ? meta.caseSummary.slice(0, 10)
    : ['Case intake completed', 'Evidence summary generated', 'Legal simulation finalized'];

  return [
    sectionTitle('2. Case Snapshot'),
    {
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [
            { text: 'Case Type', style: 'tableHead' },
            { text: 'Status', style: 'tableHead' },
            { text: 'Complexity', style: 'tableHead' },
            { text: 'Session ID', style: 'tableHead' }
          ],
          [
            { text: safeText(meta.caseType), style: 'tableCell' },
            { text: safeText(meta.status), style: 'tableCell' },
            { text: `${metrics.complexity}%`, style: 'tableCell' },
            { text: safeText(meta.sessionId), style: 'tableCell' }
          ]
        ]
      },
      layout: {
        fillColor: (row) => (row === 0 ? '#EFF6FF' : '#FFFFFF'),
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border
      },
      margin: [0, 0, 0, 12]
    },
    { text: 'Timeline', style: 'subTitle' },
    {
      ol: timeline.map((item) => safeText(item)),
      style: 'body'
    }
  ];
}

function buildDetailedAnalysis(meta) {
  const laws = meta.adverseLaws.length > 0 ? meta.adverseLaws : meta.applicableLaws;
  if (laws.length === 0) {
    return [sectionTitle('3. Detailed Legal Analysis'), { text: 'No detailed legal mapping available.', style: 'body' }];
  }

  return [
    sectionTitle('3. Detailed Legal Analysis'),
    ...laws.map((law, idx) => ({
      table: {
        widths: ['30%', '70%'],
        body: [
          [{ text: `Law Analysis ${idx + 1}`, style: 'lawBlockTitle', colSpan: 2 }, {}],
          [{ text: 'Law', style: 'lawLabel' }, { text: safeText(law), style: 'lawValue' }],
          [{ text: 'Meaning', style: 'lawLabel' }, { text: 'Legal provision potentially connected to the allegations and evidence context.', style: 'lawValue' }],
          [{ text: 'Why Applicable', style: 'lawLabel' }, { text: 'Mapped from case narrative, transcript signals, and legal ingredient overlap.', style: 'lawValue' }],
          [{ text: 'Punishment Exposure', style: 'lawLabel' }, { text: 'Severity depends on proof quality, procedural compliance, and court findings.', style: 'lawValue' }],
          [{ text: 'Defense Possibility', style: 'lawLabel' }, { text: 'Challenge ingredient mapping, evidence admissibility, and burden-of-proof sufficiency.', style: 'lawValue' }]
        ]
      },
      layout: {
        fillColor: (row) => (row === 0 ? '#FEE2E2' : '#FFFFFF'),
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border
      },
      margin: [0, 0, 0, 10]
    }))
  ];
}

function buildTranscript(meta) {
  const qa = meta.qaPairs.length > 0
    ? meta.qaPairs
    : meta.roleTranscript.map((r, idx) => ({ id: idx + 1, question: `${r.role.toUpperCase()} statement`, answer: r.text }));

  return [
    sectionTitle('4. Courtroom Q&A Transcript'),
    ...(qa.length === 0 ? [{ text: 'No transcript available.', style: 'body' }] : qa.map((item, idx) => ({
      stack: [
        {
          table: {
            widths: ['*'],
            body: [[{
              text: `Q${item.id || idx + 1}: ${safeText(item.question)}`,
              style: 'questionStrip',
              fillColor: COLORS.navy,
              color: '#FFFFFF',
              border: [false, false, false, false]
            }]]
          },
          layout: 'noBorders'
        },
        {
          table: {
            widths: ['*'],
            body: [[{
              text: safeText(item.answer),
              style: 'answerCard',
              fillColor: '#FFFFFF',
              border: [true, true, true, true],
              borderColor: COLORS.border
            }]]
          },
          layout: {
            hLineColor: () => COLORS.border,
            vLineColor: () => COLORS.border
          },
          margin: [0, 0, 0, 10]
        }
      ]
    })))
  ];
}

function buildApplicableLaws(meta) {
  const favorable = meta.favorableLaws.map((law) => ({
    section: safeText(law),
    description: 'Likely to support defense/user position',
    side: 'Favourable',
    severity: 'Moderate'
  }));
  const adverse = meta.adverseLaws.map((law) => ({
    section: safeText(law),
    description: 'Likely to be pressed against user',
    side: 'Against',
    severity: 'High'
  }));
  const rows = [...favorable, ...adverse];

  return [
    sectionTitle('5. Applicable Laws'),
    {
      table: {
        headerRows: 1,
        widths: ['34%', '34%', '16%', '16%'],
        body: [
          [
            { text: 'Section', style: 'tableHead' },
            { text: 'Description', style: 'tableHead' },
            { text: 'Position', style: 'tableHead' },
            { text: 'Severity', style: 'tableHead' }
          ],
          ...(rows.length === 0
            ? [[{ text: 'No laws mapped', colSpan: 4, alignment: 'center', style: 'tableCell' }, {}, {}, {}]]
            : rows.map((row) => [
              { text: row.section, style: 'tableCell' },
              { text: row.description, style: 'tableCell' },
              { text: row.side, style: 'tableCell', color: row.side === 'Against' ? COLORS.danger : COLORS.success, bold: true },
              { text: row.severity, style: 'tableCell' }
            ]))
        ]
      },
      layout: {
        fillColor: (row) => {
          if (row === 0) return '#E2E8F0';
          return row % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
        },
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border
      }
    }
  ];
}

function buildRiskMatrix(meta, metrics) {
  return [
    sectionTitle('6. Risk Matrix'),
    meter('Risk Exposure', metrics.riskScore, metrics.riskScore > 66 ? COLORS.danger : COLORS.warning),
    meter('Evidence Pressure', metrics.evidenceScore, COLORS.accentBlue),
    meter('Opponent Pressure', metrics.pressureScore, COLORS.warning),
    meter('Defense Capacity', metrics.caseStrength, COLORS.success)
  ];
}

function buildRecommendations(meta) {
  return [
    sectionTitle('7. Strategy Recommendations'),
    { text: 'Immediate Actions', style: 'subTitle' },
    {
      ul: (meta.recommendations.length > 0 ? meta.recommendations : ['Preserve all original records and consult legal counsel immediately.'])
        .slice(0, 8)
        .map((x) => safeText(x)),
      style: 'body'
    },
    { text: 'Critical Weaknesses', style: 'subTitle', margin: [0, 8, 0, 4] },
    {
      ul: (meta.weaknesses.length > 0 ? meta.weaknesses : ['No weaknesses captured in current case data.'])
        .slice(0, 6)
        .map((x) => safeText(x)),
      style: 'body'
    }
  ];
}

function buildFinalVerdict(meta, metrics) {
  const verdict = safeText(meta.finalVerdict, 'UNCERTAIN').toUpperCase();
  const factors = [...meta.weaknesses.slice(0, 3), ...meta.strengths.slice(0, 2)];

  return [
    sectionTitle('8. Final Verdict Summary'),
    {
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: 'FINAL OUTCOME ESTIMATE', style: 'finalLabel', alignment: 'center' },
            { text: verdict, style: 'finalBadge', alignment: 'center', fillColor: verdictColor(verdict), color: '#FFFFFF', margin: [100, 8, 100, 10] },
            { text: `${meta.winningProbability}%`, style: 'finalPercent', alignment: 'center', color: verdictColor(verdict) },
            { text: 'Winning Probability', style: 'smallLabel', alignment: 'center', margin: [0, 0, 0, 8] }
          ],
          border: [true, true, true, true],
          borderColor: COLORS.border,
          fillColor: '#F8FAFC'
        }]]
      },
      layout: {
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border
      },
      margin: [0, 0, 0, 12]
    },
    meter('Confidence Index', metrics.confidenceIndex, COLORS.accentBlue),
    { text: 'Top Deciding Factors', style: 'subTitle' },
    {
      ul: (factors.length > 0 ? factors : ['No decisive factor captured.']).map((x) => safeText(x)),
      style: 'body'
    }
  ];
}

function buildAppendix(meta) {
  return [
    sectionTitle('9. Appendix'),
    {
      table: {
        widths: ['30%', '70%'],
        body: [
          [{ text: 'Case Title', style: 'tableHead' }, { text: safeText(meta.caseTitle), style: 'tableCell' }],
          [{ text: 'Case Type', style: 'tableHead' }, { text: safeText(meta.caseType), style: 'tableCell' }],
          [{ text: 'Status', style: 'tableHead' }, { text: safeText(meta.status), style: 'tableCell' }],
          [{ text: 'Session ID', style: 'tableHead' }, { text: safeText(meta.sessionId), style: 'tableCell' }],
          [{ text: 'Generated On', style: 'tableHead' }, { text: safeText(meta.createdAt), style: 'tableCell' }]
        ]
      },
      layout: {
        fillColor: (row) => (row % 2 === 0 ? '#F8FAFC' : '#FFFFFF'),
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border
      }
    },
    { text: 'Generated by NyayAI Intelligence Engine', style: 'meta', margin: [0, 10, 0, 0] }
  ];
}

function buildMetrics(meta) {
  const evidenceScore = clamp((meta.adverseLaws.length * 12) + (meta.weaknesses.length * 9) - (meta.strengths.length * 6), 5, 95);
  const riskScore = clamp(100 - meta.winningProbability, 0, 100);
  const pressureScore = clamp((meta.adverseLaws.length * 8) + (meta.weaknesses.length * 7), 10, 98);
  const caseStrength = clamp((meta.strengths.length * 14) - (meta.weaknesses.length * 7) + 55, 5, 96);
  const confidenceIndex = clamp(meta.winningProbability + (meta.strengths.length * 4) - (meta.weaknesses.length * 3), 5, 96);
  const complexity = clamp((meta.qaPairs.length * 5) + (meta.adverseLaws.length * 8), 20, 98);
  const summarySentence = meta.weaknesses.length > meta.strengths.length
    ? 'This matter presents elevated legal exposure due to stronger prosecution-facing indicators.'
    : 'This matter presents manageable legal exposure with meaningful defense pathways identified.';

  return { evidenceScore, riskScore, pressureScore, caseStrength, confidenceIndex, complexity, summarySentence };
}

async function buildDocDefinition(meta) {
  const metrics = buildMetrics(meta);

  let qrData = null;
  try {
    qrData = await QRCode.toDataURL(`NyayAI Session: ${safeText(meta.sessionId)}`, {
      margin: 0,
      width: 160,
      color: { dark: '#0B1220', light: '#F8FAFC' }
    });
  } catch {
    qrData = null;
  }

  return {
    pageSize: 'A4',
    pageMargins: [34, 42, 34, 38],
    info: {
      title: `NyayAI Report - ${meta.caseTitle}`,
      author: 'NyayAI Intelligence Engine',
      subject: 'Premium Legal Intelligence Report',
      creator: 'NyayAI'
    },
    header: (currentPage) => (currentPage === 1 ? null : {
      margin: [34, 10, 34, 0],
      columns: [
        { text: 'NyayAI Confidential', color: COLORS.primaryNavy, fontSize: 9, bold: true },
        { text: safeText(meta.sessionId), color: COLORS.muted, fontSize: 8, alignment: 'right' }
      ]
    }),
    footer: (currentPage, pageCount) => ({
      margin: [34, 0, 34, 12],
      columns: [
        { text: 'NyayAI Confidential Legal Intelligence Report', color: COLORS.muted, fontSize: 8 },
        { text: `Page ${currentPage} / ${pageCount}`, alignment: 'right', color: COLORS.muted, fontSize: 8 }
      ]
    }),
    content: [
      ...buildCover(meta, qrData),
      ...buildExecutiveSummary(meta, metrics),
      ...buildCaseSnapshot(meta, metrics),
      ...buildDetailedAnalysis(meta),
      ...buildTranscript(meta),
      ...buildApplicableLaws(meta),
      ...buildRiskMatrix(meta, metrics),
      ...buildRecommendations(meta),
      ...buildFinalVerdict(meta, metrics),
      ...buildAppendix(meta)
    ],
    styles: {
      coverBrand: { fontSize: 30, bold: true, color: COLORS.gold, alignment: 'center' },
      coverTitle: { fontSize: 21, bold: true, color: '#F8FAFC', alignment: 'center' },
      coverLabel: { fontSize: 10, bold: true, color: '#93C5FD' },
      coverValue: { fontSize: 11, color: '#F8FAFC' },
      coverVerdict: { fontSize: 13, bold: true, color: '#FFFFFF' },
      coverMeta: { fontSize: 10, color: '#CBD5E1' },
      coverFooter: { fontSize: 9, color: '#94A3B8', alignment: 'center' },

      sectionTitle: { fontSize: 22, bold: true, color: COLORS.primaryNavy, margin: [0, 0, 0, 10] },
      subTitle: { fontSize: 14, bold: true, color: COLORS.primaryNavy, margin: [0, 6, 0, 6] },
      body: { fontSize: 11.5, lineHeight: 1.35, color: '#0F172A' },
      meta: { fontSize: 9, color: COLORS.muted },
      smallLabel: { fontSize: 9.5, color: '#334155' },

      kpiTitle: { fontSize: 10, bold: true, color: '#93C5FD', margin: [8, 8, 8, 3] },
      kpiValue: { fontSize: 19, bold: true, margin: [8, 0, 8, 2] },
      kpiSubtitle: { fontSize: 9, color: '#CBD5E1', margin: [8, 0, 8, 8] },

      tableHead: { fontSize: 10, bold: true, color: '#0F172A' },
      tableCell: { fontSize: 10, color: '#1E293B' },

      lawBlockTitle: { fontSize: 11, bold: true, color: '#7F1D1D' },
      lawLabel: { fontSize: 10, bold: true, color: '#0F172A' },
      lawValue: { fontSize: 10, color: '#1E293B' },

      questionStrip: { fontSize: 11, bold: true, margin: [8, 8, 8, 8] },
      answerCard: { fontSize: 10.7, margin: [8, 8, 8, 8], lineHeight: 1.3, color: '#0F172A' },

      finalLabel: { fontSize: 14, bold: true, color: COLORS.primaryNavy },
      finalBadge: { fontSize: 22, bold: true },
      finalPercent: { fontSize: 44, bold: true }
    },
    defaultStyle: {
      font: 'Roboto',
      color: '#0F172A'
    }
  };
}

function buildFallbackDocDefinition(meta, element, reason = '') {
  const rawLines = splitLines(String(element?.innerText || ''));
  return {
    pageSize: 'A4',
    pageMargins: [36, 42, 36, 36],
    content: [
      { text: 'NYAYAI REPORT (Fallback Export)', fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      { text: `Case: ${safeText(meta.caseTitle)}`, fontSize: 11 },
      { text: `Type: ${safeText(meta.caseType)}`, fontSize: 11 },
      { text: `Session ID: ${safeText(meta.sessionId)}`, fontSize: 11 },
      { text: `Prepared On: ${safeText(meta.createdAt)}`, fontSize: 11, margin: [0, 0, 0, 8] },
      ...(reason ? [{ text: `Fallback Reason: ${safeText(reason)}`, fontSize: 9.5, color: COLORS.danger, margin: [0, 0, 0, 8] }] : []),
      { text: '---', color: COLORS.muted, margin: [0, 0, 0, 8] },
      ...rawLines.slice(0, 400).map((line) => ({ text: safeText(line, ''), fontSize: 10.4, margin: [0, 0, 0, 3] }))
    ],
    defaultStyle: { font: 'Roboto' }
  };
}

async function downloadDoc(docDefinition, filename) {
  const pdfDoc = pdfMake.createPdf(docDefinition);
  await new Promise((resolve, reject) => {
    let done = false;
    try {
      const maybe = pdfDoc.download(filename, () => {
        done = true;
        resolve();
      });
      if (maybe && typeof maybe.then === 'function') {
        maybe.then(() => {
          if (!done) resolve();
        }).catch(reject);
      } else if (pdfDoc.download.length <= 1) {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}

function toFileSafe(value) {
  return String(value || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function defaultFilename(meta) {
  const caseName = toFileSafe(meta?.caseTitle || 'Case');
  const date = new Date().toISOString().slice(0, 10);
  return `NyayAI_Report_${caseName || 'Case'}_${date}.pdf`;
}

export async function exportElementToPdf(element, filename) {
  if (!element) {
    throw new Error('No content found to export.');
  }

  initPdfMake();
  const meta = extractMetaFromElement(element);
  const preferredName = filename || defaultFilename(meta);
  const normalizedName = String(preferredName).endsWith('.pdf') ? preferredName : `${preferredName}.pdf`;

  try {
    const docDefinition = await buildDocDefinition(meta);
    await downloadDoc(docDefinition, normalizedName);
  } catch (error) {
    console.error('NyayAI premium PDF render failed:', error);
    const fallback = buildFallbackDocDefinition(meta, element, String(error?.message || 'Unknown render error'));
    await downloadDoc(fallback, normalizedName);
  }
}

