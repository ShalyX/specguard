const STATUSES = new Set(['supported', 'contradicted', 'needs-decision', 'unassessed']);
const REFERENCE = /^(?![A-Za-z]:[\\/])(?![/\\])(?!.*(?:^|[\\/])\.\.(?:[\\/]|$)).+?:\d+(?:-\d+)?$/;

function objectReference(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const file = value.file ?? value.path ?? value.source;
  const lines = value.lines ?? value.line ?? value.startLine ?? value.start;
  if (typeof file !== 'string' || (typeof lines !== 'string' && !Number.isInteger(lines))) return null;
  return `${file}:${String(lines).trim()}`;
}

export function normalizeReference(value) {
  if (typeof value === 'string') return value.trim();
  return objectReference(value);
}

export function normalizeReview(input) {
  const review = structuredClone(input);
  review.requirements = Array.isArray(review.requirements) ? review.requirements : [];
  review.findings = Array.isArray(review.findings) ? review.findings : [];
  review.unassessed = Array.isArray(review.unassessed) ? review.unassessed : [];

  for (const requirement of review.requirements) {
    requirement.codeReferences = (Array.isArray(requirement.codeReferences) ? requirement.codeReferences : [])
      .map(normalizeReference)
      .filter(Boolean);
    requirement.evidenceFiles = Array.isArray(requirement.evidenceFiles) ? requirement.evidenceFiles : [];
  }

  for (const finding of review.findings) {
    if (!finding.requirementId && finding.requirement) finding.requirementId = finding.requirement;
    const reference = normalizeReference(finding.codeReference);
    if (reference) finding.codeReference = reference;
  }
  return review;
}

export function validateReview(review) {
  const errors = [];
  if (!review || typeof review !== 'object' || Array.isArray(review)) return ['Review must be an object.'];
  if (typeof review.caseId !== 'string' || !review.caseId.trim()) errors.push('caseId is required.');
  if (!Array.isArray(review.requirements) || !review.requirements.length) errors.push('requirements must be a non-empty array.');

  const ids = new Set();
  for (const [index, requirement] of (review.requirements ?? []).entries()) {
    const key = `requirements[${index}]`;
    if (typeof requirement.id !== 'string' || !requirement.id) errors.push(`${key}.id is required.`);
    else if (ids.has(requirement.id)) errors.push(`${key}.id duplicates ${requirement.id}.`);
    else ids.add(requirement.id);
    if (typeof requirement.requirement !== 'string' || !requirement.requirement) errors.push(`${key}.requirement is required.`);
    if (!STATUSES.has(requirement.status)) errors.push(`${key}.status is invalid.`);
    for (const reference of requirement.codeReferences ?? []) {
      if (typeof reference !== 'string' || !REFERENCE.test(reference)) errors.push(`${key} has invalid code reference ${JSON.stringify(reference)}.`);
    }
    for (const evidence of requirement.evidenceFiles ?? []) {
      if (typeof evidence !== 'string' || !evidence.trim()) errors.push(`${key} has an invalid evidence file.`);
    }
    if (requirement.status === 'needs-decision' && !requirement.humanQuestion) errors.push(`${key}.humanQuestion is required for needs-decision.`);
  }

  for (const [index, finding] of (review.findings ?? []).entries()) {
    if (finding.requirementId != null && !ids.has(finding.requirementId)) errors.push(`findings[${index}] references unknown requirement ${finding.requirementId}.`);
  }
  return errors;
}

export function reviewDisposition(review) {
  if (review.requirements.some(item => item.status === 'contradicted')) return 'blocked';
  if (review.requirements.some(item => item.status === 'needs-decision')) return 'decision';
  if (review.requirements.some(item => item.status === 'unassessed')) return 'incomplete';
  return 'ready';
}
