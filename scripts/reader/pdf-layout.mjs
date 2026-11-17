/**
 * Layout extraction for the four 2018 Orozbakov volumes. This module contains
 * geometry rules only; callers supply one PDF.js page at a time. Coordinates
 * on returned blocks are PDF points measured down from the top of the page.
 */

const REFERENCE_HEIGHT = 680.315;
const LETTER = /\p{L}/u;
const WORDS = /\p{L}+/gu;

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

function fragmentsFromItems(items, height, styles) {
  const scale = height / REFERENCE_HEIGHT;
  return items.flatMap((item) => {
    if (typeof item.str !== 'string' || !item.str.trim() || !item.transform) return [];
    const [x, baseline] = [item.transform[4], item.transform[5]];
    const size = Math.abs(item.height || item.transform[3] || item.transform[0]);
    const width = Math.abs(item.width);
    if (![x, baseline, size, width].every(Number.isFinite) || size <= 0) return [];
    // Folios and running heads have consistent baselines in these editions.
    if (baseline < 60 * scale || baseline > height - 40 * scale) return [];
    const style = styles[item.fontName] ?? {};
    const ascent = Number.isFinite(style.ascent) ? style.ascent : 0.85;
    const descent = Number.isFinite(style.descent) ? style.descent : -0.2;
    const fontDescription = `${item.fontName ?? ''} ${style.fontFamily ?? ''} ${style.name ?? ''}`;
    return [{
      text: item.str.replace(/[\t\r\n ]+/g, ' ').normalize('NFC'),
      x, right: x + width, baseline, size,
      top: height - baseline - size * ascent,
      bottom: height - baseline - size * descent,
      bold: style.bold === true || Number(style.fontWeight) >= 600 || /bold|black/iu.test(fontDescription),
    }];
  });
}

function assembleLine(fragments) {
  let text = '';
  let previous;
  for (const fragment of fragments) {
    const gap = previous ? fragment.x - previous.right : 0;
    if (previous && gap > Math.min(previous.size, fragment.size) * 0.07
      && !/\s$/u.test(text) && !/^\s/u.test(fragment.text)) text += ' ';
    text += fragment.text;
    previous = fragment;
  }
  return {
    text: text.trim(), x: fragments[0].x,
    right: Math.max(...fragments.map((fragment) => fragment.right)),
    baseline: median(fragments.map((fragment) => fragment.baseline)),
    size: Math.max(...fragments.map((fragment) => fragment.size)),
    top: Math.min(...fragments.map((fragment) => fragment.top)),
    bottom: Math.max(...fragments.map((fragment) => fragment.bottom)),
    bold: fragments.some((fragment) => fragment.bold),
  };
}

function collectRows(fragments, bodySize) {
  const rows = [];
  for (const fragment of [...fragments].sort((a, b) => b.baseline - a.baseline || a.x - b.x)) {
    let row = rows.at(-1);
    if (!row || Math.abs(row.baseline - fragment.baseline) > Math.min(2.5, bodySize * 0.2)) {
      row = { baseline: fragment.baseline, fragments: [] };
      rows.push(row);
    }
    row.fragments.push(fragment);
  }
  return rows.map(({ baseline, fragments: rowFragments }) => {
    const groups = [];
    for (const fragment of rowFragments.sort((a, b) => a.x - b.x)) {
      let group = groups.at(-1);
      const previous = group?.at(-1);
      if (!previous || fragment.x - previous.right > bodySize * 0.9) {
        group = [];
        groups.push(group);
      }
      group.push(fragment);
    }
    return { baseline, lines: groups.map(assembleLine) };
  });
}

function findGutter(rows, width, bodySize) {
  const starts = rows.flatMap((row) => row.lines)
    .filter((line) => line.x > width * 0.45 && line.x < width * 0.62)
    .map((line) => line.x);
  if (!starts.length) return width * 0.49;
  // The right column begins at 233.9 or 248 points on odd/even pages.
  // A modal cluster tolerates PDF text positioning and incidental short lines.
  const clusters = starts.map((x) => starts.filter((other) => Math.abs(other - x) < bodySize * 0.4));
  clusters.sort((a, b) => b.length - a.length);
  return median(clusters[0]) - bodySize * 0.15;
}

function isHeading(line, width, bodySize) {
  const letters = line.text.match(WORDS)?.join('') ?? '';
  const centered = Math.abs((line.x + line.right) / 2 - width / 2) < width * 0.18;
  const uppercase = letters.length >= 4 && letters === letters.toUpperCase()
    && letters !== letters.toLowerCase();
  return centered && (uppercase || line.bold || line.size > bodySize * 1.2);
}

function makeBlock(kind, lines, text) {
  return {
    kind, text,
    top: Math.min(...lines.map((line) => line.top)),
    bottom: Math.max(...lines.map((line) => line.bottom)),
  };
}

function reflowProse(lines, knownWords) {
  let text = lines[0].text;
  for (let index = 1; index < lines.length; index += 1) {
    const next = lines[index].text;
    const previousWord = text.match(/(\p{L}+)[-\u00ad]$/u)?.[1];
    const nextWord = next.match(/^(\p{L}+)/u)?.[1];
    if (previousWord && nextWord) {
      // Soft hyphens explicitly mark discretionary breaks. A printed hyphen
      // is ambiguous (it may belong to a compound), so remove it only when
      // the unhyphenated word is independently present on the same page.
      const joined = (previousWord + nextWord).toLocaleLowerCase('ky');
      if (text.endsWith('\u00ad') || knownWords.has(joined)) text = text.slice(0, -1);
      text += next;
    } else {
      text += ` ${next}`;
    }
  }
  return text.replace(/\u00ad/gu, '');
}

function proseBlocks(lines, bodySize, knownWords) {
  const left = Math.min(...lines.map((line) => line.x));
  const paragraphs = [];
  for (const line of lines) {
    let paragraph = paragraphs.at(-1);
    const previous = paragraph?.at(-1);
    if (!previous || line.x - left > bodySize
      || previous.baseline - line.baseline > bodySize * 1.8) {
      paragraph = [];
      paragraphs.push(paragraph);
    }
    paragraph.push(line);
  }
  return paragraphs.map((paragraph) => makeBlock('prose', paragraph, reflowProse(paragraph, knownWords)));
}

function verseBlocks(lines, gutter, bodySize) {
  return [lines.filter((line) => line.x < gutter), lines.filter((line) => line.x >= gutter)]
    .filter((column) => column.length)
    .map((column) => {
      column.sort((a, b) => b.baseline - a.baseline || a.x - b.x);
      let text = column[0].text;
      for (let index = 1; index < column.length; index += 1) {
        const blankLine = column[index - 1].baseline - column[index].baseline > bodySize * 1.8;
        text += `${blankLine ? '\n\n' : '\n'}${column[index].text}`;
      }
      return makeBlock('verse', column, text);
    });
}

/**
 * Convert PDF.js TextContent items to reading-order blocks. The optional styles
 * are TextContent.styles; callers may enrich them with a font name/bold flag.
 * This is intentionally edition-specific, not a general PDF layout engine.
 */
export function extractPageBlocks(items, { width, height, styles = {} } = {}) {
  if (![width, height].every((value) => Number.isFinite(value) && value > 0)) {
    throw new TypeError('Valid positive page dimensions are required.');
  }
  const fragments = fragmentsFromItems(items, height, styles);
  if (!fragments.length) return [];
  const bodySize = median(fragments.map((fragment) => fragment.size));
  const rows = collectRows(fragments, bodySize);
  const gutter = findGutter(rows, width, bodySize);
  const knownWords = new Set(fragments.flatMap((fragment) => fragment.text.match(WORDS) ?? [])
    .map((word) => word.toLocaleLowerCase('ky')));
  for (const row of rows) {
    row.mode = row.lines.some((line) => isHeading(line, width, bodySize)) ? 'heading'
      : row.lines.some((line) => line.x < gutter && line.right > gutter + bodySize * 0.2) ? 'prose'
        : row.lines.some((line) => line.x >= gutter) ? 'verse' : null;
  }
  // Short final prose lines need the surrounding full-width paragraph, while
  // short verse lines must retain their line breaks.
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.mode) continue;
    const previous = rows[index - 1];
    const next = rows[index + 1];
    const followsProse = previous?.mode === 'prose' && previous.baseline - row.baseline < bodySize * 1.8;
    const precedesProse = next?.mode === 'prose' && row.baseline - next.baseline < bodySize * 1.8;
    row.mode = followsProse || precedesProse ? 'prose' : 'verse';
  }
  const blocks = [];
  let pending = [];
  let mode;
  const flush = () => {
    if (!pending.length) return;
    if (mode === 'heading') blocks.push(makeBlock('heading', pending, pending.map((line) => line.text).join(' ')));
    else if (mode === 'prose') blocks.push(...proseBlocks(pending, bodySize, knownWords));
    else blocks.push(...verseBlocks(pending, gutter, bodySize));
    pending = [];
  };
  for (const row of rows) {
    if (row.mode !== mode || (mode === 'heading' && pending.length
      && pending.at(-1).baseline - row.baseline > bodySize * 1.8)) flush();
    mode = row.mode;
    pending.push(...row.lines);
  }
  flush();
  return blocks.filter((block) => LETTER.test(block.text));
}
