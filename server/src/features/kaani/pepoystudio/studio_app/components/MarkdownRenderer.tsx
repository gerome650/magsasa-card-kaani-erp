import React from 'react';

type ParsedTable = {
  headers: string[];
  rows: string[][];
  title?: string;
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const processLine = (line: string): React.ReactElement => {
  // Escape HTML first, then apply simple markdown (**bold**, *italic*)
  const escaped = escapeHtml(line);
  const html = escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const buildTableHtml = (headers: string[], rows: string[][]): string => {
  let tableHTML =
    "<table border='1' style='border-collapse: collapse; width: 100%; font-size: 10px; table-layout: fixed;'>";

  // Headers
  tableHTML += '<thead><tr>';
  headers.forEach((header) => {
    tableHTML += `<th style="padding: 4px; background-color: #f2f2f2; font-size: 10px;">${escapeHtml(
      header
    )}</th>`;
  });
  tableHTML += '</tr></thead>';

  // Body
  tableHTML += '<tbody>';
  rows.forEach((cells) => {
    tableHTML += '<tr>';
    cells.forEach((cell) => {
      tableHTML += `<td style="padding: 4px; font-size: 10px;">${escapeHtml(
        cell
      )}</td>`;
    });
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody></table>';

  return tableHTML;
};

const wrapInWordHtml = (bodyHTML: string): string => {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Agri Table</title>
      </head>
      <body>${bodyHTML}</body>
    </html>
  `;
};

const triggerWordDownload = (fullHTML: string, filename: string) => {
  const blob = new Blob(['\ufeff', fullHTML], {
    type: 'application/msword',
  });

  const downloadLink = document.createElement('a');
  document.body.appendChild(downloadLink);

  if ((navigator as any).msSaveOrOpenBlob) {
    // IE / old Edge
    (navigator as any).msSaveOrOpenBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(url);
  }

  document.body.removeChild(downloadLink);
};

const downloadTableAsDoc = (headers: string[], rows: string[][]) => {
  const tableHTML = buildTableHtml(headers, rows);
  const fullHTML = wrapInWordHtml(tableHTML);
  triggerWordDownload(fullHTML, 'agri_table.doc');
};

const downloadAllCostTablesAsDoc = (tables: ParsedTable[]) => {
  if (!tables.length) return;

  let bodyHTML = '';

  tables.forEach((table, index) => {
    const sectionTitle = table.title || `Cost Table ${index + 1}`;

    bodyHTML += `<h3 style="font-size:14px; margin-top:16px; margin-bottom:4px;">${escapeHtml(
      sectionTitle
    )}</h3>`;
    bodyHTML += buildTableHtml(table.headers, table.rows);
  });

  const fullHTML = wrapInWordHtml(bodyHTML);
  triggerWordDownload(fullHTML, 'agri_cost_tables.doc');
};

const downloadFullReportAsDoc = (content: string) => {
  const lines = content.split('\n');
  let bodyHTML = '<div style="font-family: Arial, sans-serif; font-size: 11pt;">';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Basic Markdown to HTML conversion for the DOC file
    const escaped = escapeHtml(trimmed)
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>');    // Italic

    if (trimmed.startsWith('PLANTING ADVISORY') || trimmed.startsWith('TECHNICAL BULLETIN') || trimmed.startsWith('Risk Score Report') || trimmed.startsWith('Loan Program Profile')) {
         bodyHTML += `<h1 style="font-size: 16pt; color: #2E7D32; border-bottom: 2px solid #2E7D32; margin-top: 20px;">${escaped}</h1>`;
    } else if (KNOWN_HEADERS.some(h => trimmed.startsWith(h)) || trimmed.startsWith('##')) {
         bodyHTML += `<h3 style="font-size: 13pt; color: #1565C0; margin-top: 15px;">${escaped.replace(/#/g, '')}</h3>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
         bodyHTML += `<div style="margin-left: 20px; margin-bottom: 4px;">• ${escaped.replace(/^[-•*]\s*/, '')}</div>`;
    } else if (trimmed.startsWith('|')) {
         // Skip table rows in text view (you already have specific table exports)
         bodyHTML += `<pre style="background: #f0f0f0; padding: 2px;">${escaped}</pre>`;
    } else {
         bodyHTML += `<p style="margin-bottom: 8px;">${escaped}</p>`;
    }
  });

  bodyHTML += '</div>';
  const fullHTML = wrapInWordHtml(bodyHTML);
  triggerWordDownload(fullHTML, 'KaAni_Full_Report.doc');
};

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const KNOWN_HEADERS = [
  // Farmer (Tagalog)
  'Pagtukoy sa Problema',
  'Mga Praktikal na Solusyon',
  'Mga Natural o Biyolohikal na Solusyon',
  'Mga Kemikal na Solusyon',
  'BUOD NG REKOMENDASYON',
  'BUOD NG MGA HAKBANG',
  'Mga Mungkahing Itanim',
  'Paghahanda ng Lupa',
  'Mga Hakbang sa Pagtatanim',
  'Paalala sa Pangangalaga',
  // Loan Matching (Tagalog)
  'Loan Program Profile',
  'Pangalan ng Programa',
  'Layunin',
  'Sino ang Pwedeng Umasa (Eligible Borrowers)',
  'Mga Pangunahing Kondisyon (Key Conditions)',
  'Mahalagang Paalala',
  'Paalala sa Lupa',
  'Paghahanda (Preparation)',
  'Pagtatanim (Planting)',
  'Pangangalaga at Pag-aabono (Crop Care & Fertilization)',
  'Pag-aani (Harvesting)',
  'Para Kanino Ito? (Eligible Borrowers/Conduits)',
  'Mga Pangkalahatang Kondisyon (General Conditions)',
  'Mga Tiyak na Kinakailangan (Specific Requirements)',
  'Para sa mga End-User/Sub-Borrowers',
  'Sino ang HINDI Kwalipikado? (Exclusions and Disqualifications)',
  'Mga Kailangang Dokumento at Proseso ng Aplikasyon (Documentation and Application Process)',
  'Saan Pwedeng Magtanong?',
  // Technician (English)
  'TECHNICAL BULLETIN',
  'FERTILIZATION PROGRAM',
  'I. SOIL ANALYSIS RECOMMENDATION',
  'II. STAGE-BY-STAGE FERTILIZER APPLICATION',
  'III. NOTES ON ORGANIC ALTERNATIVES',
  'IV. GENERAL REMINDERS',
  'NUTRIENT DEFICIENCY ANALYSIS',
  'I. OBSERVED SYMPTOMS',
  'II. PROBABLE DEFICIENCY',
  'III. CORRECTIVE FERTILIZER RECOMMENDATIONS',
  'IV. PREVENTATIVE MANAGEMENT',
  'PEST MANAGEMENT',
  'BIOLOGY AND IDENTIFICATION',
  'INTEGRATED PEST MANAGEMENT (IPM) STRATEGIES',
  'Cultural Control',
  'Biological Control',
  'Chemical Control',
  'Baseline Risk Score Report',
  'Climate Risk Breakdown',
  'Soil Analysis Details',
  'Risk Implications & Commentary',
  'SOIL AND CLIMATE ADVISORY',
  'I. GENERAL CLIMATE PROFILE',
  'II. TYPICAL SOIL CHARACTERISTICS',
  'III. KEY AGRONOMIC CONSIDERATIONS',
  'IV. RECOMMENDATION',
  'Disclaimer',
  // Planting Advisory
  'PLANTING ADVISORY',
  'I. SITE CONDITION ANALYSIS',
  'II. RECOMMENDED CROP VARIETIES',
  'III. SOIL PREPARATION & AMENDMENT PLAN',
  'IV. PLANTING & CROP MANAGEMENT STRATEGY',
  'V. POTENTIAL CHALLENGES & MITIGATION',
  'VI. FERTILIZER COST TABLE - Produkto, Bilang ng sako/bote, halaga (with total at bottom of table)',
];

const COST_KEYWORDS = [
  'cost',
  'price',
  'amount',
  'total',
  'presyo',
  'halaga',
  'gastos',
  'cost table',
];

// ⬇⬇⬇ ONLY CHANGE HERE: accept isFinalModelMessage and gate the button ⬇⬇⬇
export const MarkdownRenderer: React.FC<{ content: string; isFinalModelMessage?: boolean }> = ({
  content,
  isFinalModelMessage,
}) => {
  const upperContent = content.toUpperCase();
  const isReport = 
    content.includes('PLANTING ADVISORY') || 
    content.includes('TECHNICAL BULLETIN') || 
    content.includes('Risk Score Report') || 
    content.includes('Loan Program Profile');

  // Only show the full download button when this is the **final** model message AND the content is a report
  const showFullReportButton = Boolean(isFinalModelMessage) && isReport;

  // 1) Insert blank lines before known headers
  let processedContent = content;
  KNOWN_HEADERS.forEach((header) => {
    const escapedHeader = escapeRegExp(header);
    const regex = new RegExp(
      `([^\\n])(\\*{0,2}\\s*${escapedHeader}\\s*\\*{0,2})`,
      'g'
    );
    processedContent = processedContent.replace(
      regex,
      '$1\n\n$2'
    );
  });

  // 2) Split into lines and filter out empty / junk
  const lines = processedContent
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return false;
      if (trimmed === '*' || trimmed === '-') return false;
      if (trimmed.match(/^#+$/)) return false;
      return true;
    });

  const elements: React.ReactElement[] = [];
  const costTables: ParsedTable[] = [];
  let lastCostTableElementIndex: number | null = null;

  const renderDownloadAllButton = (key: string) => (
    <div
      key={key}
      className="mt-2 mb-3 flex justify-end"
    >
      <button
        onClick={() => downloadAllCostTablesAsDoc(costTables)}
        className="flex items-center px-3 py-1.5 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          ></path>
        </svg>
        Download all cost tables (.doc)
      </button>
    </div>
  );

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // TABLE DETECTION
    if (
      line.trim().startsWith('|') &&
      lines[i + 1]?.trim().match(/^\|[:-\s|]+$/)
    ) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }

      const headerCells = tableLines[0]
        .split('|')
        .slice(1, -1)
        .map((s) => s.trim());

      const parsedRows: string[][] = tableLines.slice(2).map((row) =>
        row
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );

      // Heuristic: detect cost tables by header text
      const headerJoined = headerCells.join(' ').toLowerCase();
      const isCostTable = COST_KEYWORDS.some((kw) =>
        headerJoined.includes(kw)
      );

      if (isCostTable) {
        costTables.push({
          headers: headerCells,
          rows: parsedRows,
          title: 'Cost Table',
        });
      }

      const tableElementIndex = elements.length;

      elements.push(
        <div key={`table-${i}`} className="my-4 inline-block max-w-full">
          {/* Table container */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="table-fixed bg-white text-xs">
              <thead>
                <tr>
                  {headerCells.map((header, index) => (
                    <th
                      key={index}
                      className="px-3 py-2 text-[11px] font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50"
                    >
                      {processLine(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedRows.map((cells, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }
                  >
                    {cells.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 text-[11px] text-gray-700 whitespace-pre-wrap align-top"
                      >
                        {processLine(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-table download button */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={() =>
                downloadTableAsDoc(headerCells, parsedRows)
              }
              className="flex items-center px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Download .doc
            </button>
          </div>
        </div>
      );

      if (isCostTable) {
        lastCostTableElementIndex = tableElementIndex;
      }

      i = j;
      continue;
    }

    // HEADERS / LISTS / PARAGRAPHS
    const trimmedLine = line.trim();
    const cleanedLine = trimmedLine.replace(/\*\*/g, '');
    const isKnownHeader = KNOWN_HEADERS.some((h) =>
      cleanedLine.startsWith(h)
    );

    if (isKnownHeader) {
      elements.push(
        <h3
          key={`h-${i}`}
          className="text-md font-bold text-gray-800 mt-4 mb-1"
        >
          {processLine(trimmedLine)}
        </h3>
      );
    } else if (
      trimmedLine.startsWith('* ') ||
      trimmedLine.startsWith('- ') ||
      trimmedLine.startsWith('• ')
    ) {
      const content = trimmedLine.substring(
        trimmedLine.indexOf(' ') + 1
      );
      elements.push(
        <div key={i} className="flex items-start my-1.5">
          <span className="text-green-600 mr-2 mt-1">
            &#8226;
          </span>
          <p className="flex-1 text-gray-700 text-sm">
            {processLine(content)}
          </p>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="my-2 text-gray-700 text-sm">
          {processLine(line)}
        </p>
      );
    }

    i++;
  }

  // After all content is processed, insert the "Download all cost tables" button
  // right AFTER the last cost table element, if any.
  let finalElements = elements;

  if (
    costTables.length > 0 &&
    lastCostTableElementIndex !== null
  ) {
    finalElements = [
      ...elements.slice(0, lastCostTableElementIndex + 1),
      renderDownloadAllButton('download-all-cost-tables'),
      ...elements.slice(lastCostTableElementIndex + 1),
    ];
  }

  return (
    <div className="prose prose-sm max-w-none text-[13px]">
      {showFullReportButton && (
        <div className="mb-4 flex justify-end">
           <button
            onClick={() => downloadFullReportAsDoc(content)}
            className="flex items-center px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download full response (.doc)
          </button>
        </div>
      )}

      {finalElements}
    </div>
  );
};
