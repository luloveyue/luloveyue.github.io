const body = document.body;
const openingScene = document.getElementById('openingScene');
const openingTitle = document.getElementById('openingTitle');
const openingSubtitle = document.getElementById('openingSubtitle');
const openLetter = document.getElementById('openLetter');
const envelopeRecipient = document.getElementById('envelopeRecipient');
const letterPage = document.getElementById('letterPage');
const letterHeading = document.getElementById('letterHeading');
const heroCopy = document.getElementById('heroCopy');
const letterContent = document.getElementById('letterContent');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isOpening = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function parseBlocks(lines) {
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, '').trimEnd());
        index += 1;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length
      && lines[index].trim()
      && lines[index].trim() !== '---'
      && !/^>\s?/.test(lines[index])
      && !/^-\s+/.test(lines[index])
      && !/^#{1,3}\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function parseDocument(markdown) {
  const source = markdown
    .replace(/^\uFEFF/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const introLines = [];
  const sections = [];
  let recipient = '';
  let currentSection = null;

  lines.forEach((line) => {
    if (/^#\s+/.test(line) && !recipient) {
      recipient = line.replace(/^#\s+/, '').trim();
      return;
    }

    if (/^##\s+/.test(line)) {
      currentSection = {
        title: line.replace(/^##\s+/, '').trim(),
        lines: [],
      };
      sections.push(currentSection);
      return;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else if (recipient) {
      introLines.push(line);
    }
  });

  return {
    recipient,
    intro: parseBlocks(introLines),
    sections,
  };
}

function splitAtDivider(lines) {
  const dividerIndex = lines.findIndex((line) => line.trim() === '---');
  if (dividerIndex === -1) return [lines, []];
  return [lines.slice(0, dividerIndex), lines.slice(dividerIndex + 1)];
}

function splitSubsections(lines) {
  const intro = [];
  const items = [];
  let currentItem = null;

  lines.forEach((line) => {
    if (/^###\s+/.test(line)) {
      currentItem = {
        title: line.replace(/^###\s+/, '').trim(),
        lines: [],
      };
      items.push(currentItem);
    } else if (currentItem) {
      currentItem.lines.push(line);
    } else {
      intro.push(line);
    }
  });

  return { intro, items };
}

function blockText(block) {
  if (!block) return '';
  if (block.type === 'paragraph') return block.text;
  if (block.type === 'quote') return block.lines.join('\n');
  return '';
}

function blocksToHtml(blocks, { salutation = false } = {}) {
  let paragraphIndex = 0;

  return blocks.map((block) => {
    if (block.type === 'paragraph') {
      const className = salutation && paragraphIndex === 0 ? ' class="salutation"' : '';
      paragraphIndex += 1;
      return `<p${className}>${formatInline(block.text)}</p>`;
    }

    if (block.type === 'quote') {
      return `<blockquote class="paper-quote">${formatInline(block.lines.join('\n'))}</blockquote>`;
    }

    if (block.type === 'list') {
      const items = block.items.map((item) => `<li>${formatInline(item)}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    return '';
  }).join('');
}

function sectionId(number) {
  return `section-${String(number).padStart(2, '0')}`;
}

function renderPaperSection(section, number, recipient, isFirstSection) {
  const id = sectionId(number);
  const [bodyLines, signatureLines] = splitAtDivider(section.lines);
  const bodyBlocks = parseBlocks(bodyLines);
  const signatureTexts = parseBlocks(signatureLines)
    .map(blockText)
    .filter(Boolean);
  const signature = signatureTexts.length
    ? `
      <div class="signature">
        ${signatureTexts.length > 1 ? `<span>${formatInline(signatureTexts.slice(0, -1).join(' '))}</span>` : ''}
        <strong>${formatInline(signatureTexts.at(-1))}</strong>
      </div>`
    : '';

  return `
    <section class="letter-section" aria-labelledby="${id}">
      <p class="section-number">${String(number).padStart(2, '0')}</p>
      <h2 class="section-title" id="${id}">${escapeHtml(section.title)}</h2>
      <article class="letter-paper">
        <div class="paper-mark" aria-hidden="true">${escapeHtml(recipient.charAt(0))}</div>
        ${blocksToHtml(bodyBlocks, { salutation: isFirstSection })}
        ${signature}
      </article>
    </section>`;
}

function renderCardSection(section, number) {
  const id = sectionId(number);
  const { intro, items } = splitSubsections(section.lines);
  const symbols = ['◌', '◇', '∞', '✦', '○', '△'];
  const introHtml = blocksToHtml(parseBlocks(intro));
  const cards = items.map((item, index) => `
    <article class="meaning-card">
      <span class="card-number">${String(index + 1).padStart(2, '0')}</span>
      <div class="card-symbol" aria-hidden="true">${symbols[index % symbols.length]}</div>
      <h3>${escapeHtml(item.title)}</h3>
      ${blocksToHtml(parseBlocks(item.lines))}
    </article>`).join('');

  return `
    <section class="meaning-section" aria-labelledby="${id}">
      <p class="section-number">${String(number).padStart(2, '0')}</p>
      <h2 class="section-title" id="${id}">${escapeHtml(section.title)}</h2>
      ${introHtml ? `<div class="section-intro">${introHtml}</div>` : ''}
      <div class="meaning-grid">${cards}</div>
    </section>`;
}

function renderPromiseSection(section) {
  const blocks = parseBlocks(section.lines);
  const quote = blocks.find((block) => block.type === 'quote');
  const caption = blocks.find((block) => block.type === 'paragraph');

  return `
    <section class="promise-section" aria-label="${escapeHtml(section.title)}">
      <div class="promise-flower" aria-hidden="true">❀</div>
      <blockquote>${quote ? formatInline(quote.lines.join('\n')) : escapeHtml(section.title)}</blockquote>
      ${caption ? `<p>${formatInline(caption.text)}</p>` : ''}
    </section>`;
}

function getAuthor(documentData) {
  const firstSection = documentData.sections[0];
  if (!firstSection) return '';
  const [, signatureLines] = splitAtDivider(firstSection.lines);
  const signature = parseBlocks(signatureLines).map(blockText).filter(Boolean);
  return signature.at(-1) || '';
}

function renderDocument(documentData) {
  if (!documentData.recipient || !documentData.sections.length) {
    throw new Error('content.md 至少需要一个 # 收信人和一个 ## 章节');
  }

  const { recipient, intro, sections } = documentData;
  const author = getAuthor(documentData);
  const introTexts = intro.map(blockText).filter(Boolean);

  openingTitle.textContent = `给${recipient}的一封信`;
  openingSubtitle.textContent = introTexts[0] || openingSubtitle.textContent;
  envelopeRecipient.textContent = recipient;
  openLetter.setAttribute('aria-label', `打开写给${recipient}的信`);
  letterHeading.textContent = recipient;
  heroCopy.textContent = introTexts[1] || heroCopy.textContent;

  const waxSeal = document.querySelector('.wax-seal');
  if (author && waxSeal) waxSeal.textContent = author.charAt(0);

  document.title = author ? `写给${recipient}｜${author}` : `写给${recipient}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `写给${recipient}的一封信，一份被认真收藏的温柔。`;

  let number = 1;
  const html = sections.map((section, index) => {
    const { items } = splitSubsections(section.lines);

    if (section.title.includes('约定') && parseBlocks(section.lines).some((block) => block.type === 'quote')) {
      return renderPromiseSection(section);
    }

    const rendered = items.length
      ? renderCardSection(section, number)
      : renderPaperSection(section, number, recipient, index === 0);
    number += 1;
    return rendered;
  }).join('');

  letterContent.innerHTML = html;
}

async function loadContent() {
  try {
    const response = await fetch('content.md', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`无法读取 content.md：${response.status}`);
    renderDocument(parseDocument(await response.text()));
  } catch (error) {
    console.warn('已使用 index.html 中的备用内容。', error);
  }
}

function finishOpening() {
  body.classList.add('is-open');
  body.classList.remove('is-locked');
  letterPage.setAttribute('aria-hidden', 'false');
  window.scrollTo(0, 0);

  window.setTimeout(() => {
    openingScene.hidden = true;
    try {
      letterHeading.focus({ preventScroll: true });
    } catch (error) {
      letterHeading.focus();
    }
  }, reducedMotion ? 20 : 850);
}

openLetter.addEventListener('click', () => {
  if (isOpening) return;

  isOpening = true;
  openLetter.disabled = true;
  body.classList.add('is-opening');
  window.setTimeout(finishOpening, reducedMotion ? 80 : 2050);
});

void loadContent();
