import { demoCases } from './demo-data.js';

const state = { cases: [...demoCases], active: 2, expanded: false };
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const dispositionCopy = {
  ready: { symbol: '✓', title: 'Ready to merge', summary: 'Every stated requirement is supported by the evidence collected in this review.' },
  blocked: { symbol: '×', title: 'Merge blocked', summary: 'At least one written requirement is contradicted by reproduced behavior.' },
  decision: { symbol: '?', title: 'Decision required', summary: 'The implementation is understood, but the written intent does not select one correct behavior.' },
  incomplete: { symbol: '…', title: 'Assessment incomplete', summary: 'At least one requirement could not be established from the available evidence.' }
};

function normalizeReference(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return null;
  const file = value.file ?? value.path ?? value.source;
  const lines = value.lines ?? value.line ?? value.startLine ?? value.start;
  return typeof file === 'string' && lines != null ? `${file}:${lines}` : null;
}

function normalizeImportedReview(input) {
  const review = structuredClone(input);
  if (!Array.isArray(review.requirements) || !review.requirements.length) throw new Error('The review needs at least one requirement.');
  const allowed = new Set(['supported','contradicted','needs-decision','unassessed']);
  for (const item of review.requirements) {
    if (!item.id || !item.requirement || !allowed.has(item.status)) throw new Error('A requirement is missing its ID, text, or valid status.');
    item.codeReferences = (Array.isArray(item.codeReferences) ? item.codeReferences : []).map(normalizeReference).filter(Boolean);
    item.evidenceFiles = Array.isArray(item.evidenceFiles) ? item.evidenceFiles : [];
    if (item.status === 'needs-decision' && !item.humanQuestion) throw new Error(`${item.id} needs a humanQuestion.`);
  }
  review.findings = Array.isArray(review.findings) ? review.findings : [];
  review.unassessed = Array.isArray(review.unassessed) ? review.unassessed : [];
  return review;
}

function deriveDisposition(review) {
  if (review.requirements.some(item => item.status === 'contradicted')) return 'blocked';
  if (review.requirements.some(item => item.status === 'needs-decision')) return 'decision';
  if (review.requirements.some(item => item.status === 'unassessed')) return 'incomplete';
  return 'ready';
}

function renderCases() {
  $('#case-list').innerHTML = state.cases.map((item, index) => `<button class="case-button ${index === state.active ? 'active' : ''}" data-case="${index}" type="button"><span class="case-dot ${item.disposition}"></span><span><strong>${escapeHtml(item.id)} · ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span></button>`).join('');
}

function receiptMarkup(item, receipts) {
  return item.evidenceFiles.map(file => {
    const name = file.split(/[\\/]/).pop();
    const receipt = receipts[name];
    if (!receipt) return `<div class="receipt"><strong>${escapeHtml(name)}</strong><span>Receipt not loaded</span></div>`;
    const outcome = receipt.exitCode === 0 ? 'PASS' : 'REPRODUCED FAILURE';
    const command = Array.isArray(receipt.command) ? receipt.command.join(' ') : 'Captured execution';
    return `<div class="receipt"><strong>${outcome} · ${escapeHtml(name)}</strong><span>${escapeHtml(command)} · ${escapeHtml(receipt.elapsedMilliseconds)} ms</span></div>`;
  }).join('');
}

function renderRequirements(item) {
  $('#requirements').innerHTML = item.review.requirements.map((requirement, index) => `<details class="requirement" ${state.expanded || requirement.status !== 'supported' || index === 0 ? 'open' : ''}><summary><span class="req-id">${escapeHtml(requirement.id)}</span><span class="req-title">${escapeHtml(requirement.requirement)}</span><span class="status ${escapeHtml(requirement.status)}">${escapeHtml(requirement.status.replace('-', ' '))}</span></summary><div class="requirement-body"><p>${escapeHtml(requirement.observation)}</p><div class="reference-row">${requirement.codeReferences.map(reference => `<span class="reference">${escapeHtml(reference)}</span>`).join('') || '<span class="reference">No source reference</span>'}</div>${receiptMarkup(requirement, item.receipts)}${requirement.humanQuestion ? `<p><strong>Decision question:</strong> ${escapeHtml(requirement.humanQuestion)}</p>` : ''}</div></details>`).join('');
}

function renderDecision(item) {
  const copy = dispositionCopy[item.disposition];
  const counts = item.review.requirements.reduce((result, requirement) => { result[requirement.status] = (result[requirement.status] ?? 0) + 1; return result; }, {});
  $('#decision-panel').className = `decision-panel ${item.disposition}`;
  $('#decision-symbol').textContent = copy.symbol;
  $('#decision-title').textContent = copy.title;
  $('#decision-summary').textContent = copy.summary;
  $('#decision-counts').innerHTML = Object.entries(counts).map(([status, count]) => `<div class="count-pill"><strong>${count}</strong><span>${escapeHtml(status.replace('-', ' '))}</span></div>`).join('');
}

function renderEvidence(item) {
  const citations = item.review.requirements.reduce((sum, requirement) => sum + requirement.codeReferences.length, 0);
  const evidence = new Set(item.review.requirements.flatMap(requirement => requirement.evidenceFiles));
  const loaded = [...evidence].filter(file => item.receipts[file.split(/[\\/]/).pop()]).length;
  const coverage = evidence.size ? Math.round(loaded / evidence.size * 100) : 0;
  $('#evidence-score').textContent = `${coverage}% loaded`;
  $('#evidence-meter').style.width = `${coverage}%`;
  $('#evidence-stats').innerHTML = `<div><dt>Requirements</dt><dd>${item.review.requirements.length}</dd></div><div><dt>Source citations</dt><dd>${citations}</dd></div><div><dt>Execution receipts</dt><dd>${loaded} / ${evidence.size}</dd></div><div><dt>Commit</dt><dd>${escapeHtml(item.review.commit ?? 'unavailable')}</dd></div>`;
}

function renderHumanDecision(item) {
  const requirement = item.review.requirements.find(entry => entry.status === 'needs-decision');
  const panel = $('#human-decision');
  panel.hidden = !requirement;
  if (!requirement) return;
  $('#human-question').textContent = requirement.humanQuestion;
  const storageKey = `specguard:${item.id}:${requirement.id}`;
  const selected = localStorage.getItem(storageKey);
  const options = ['Export all matching records', 'Export only the visible page'];
  $('#decision-actions').innerHTML = options.map(option => `<button type="button" class="${selected === option ? 'selected' : ''}" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('');
  $('#resolved-note').textContent = selected ? `Decision recorded locally: ${selected}` : '';
  document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    localStorage.setItem(storageKey, button.dataset.answer);
    showToast('Decision recorded. The evidence remains unchanged.');
    renderHumanDecision(item);
  }));
}

function render() {
  const item = state.cases[state.active];
  $('#case-id').textContent = item.id;
  $('#case-title').textContent = item.title;
  renderCases(); renderDecision(item); renderRequirements(item); renderEvidence(item); renderHumanDecision(item);
  $('#recommendation').textContent = item.review.recommendation;
}

let toastTimer;
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }

$('#expand-all').addEventListener('click', () => { state.expanded = !state.expanded; $('#expand-all').textContent = state.expanded ? 'Collapse all' : 'Expand all'; renderRequirements(state.cases[state.active]); });
$('#case-list').addEventListener('click', event => {
  const button = event.target.closest('[data-case]');
  if (!button) return;
  state.active = Number(button.dataset.case);
  state.expanded = false;
  $('#expand-all').textContent = 'Expand all';
  render();
});
$('#import-trigger').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    const review = normalizeImportedReview(JSON.parse(await file.text()));
    const disposition = deriveDisposition(review);
    state.cases.push({ id: review.caseId, title: 'Imported review', subtitle: 'Receipts not loaded', baseline: 'Unavailable', disposition, review, receipts: {} });
    state.active = state.cases.length - 1;
    render(); showToast('Review normalized and imported.');
  } catch (error) { showToast(error.message); }
  event.target.value = '';
});

render();
