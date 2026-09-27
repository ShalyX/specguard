import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { normalizeReview, validateReview } from './lib/review-contract.mjs';

const [source, destination] = process.argv.slice(2);
if (!source) {
  console.error('Usage: node specguard-validate.mjs <review.json> [normalized.json]');
  process.exit(2);
}

const sourcePath = path.resolve(source);
const workspace = path.dirname(path.dirname(sourcePath));
const raw = (await readFile(sourcePath, 'utf8')).replace(/^\uFEFF/, '');
const review = normalizeReview(JSON.parse(raw));
const errors = validateReview(review);

for (const [index, requirement] of review.requirements.entries()) {
  for (const evidenceFile of requirement.evidenceFiles) {
    const evidencePath = path.resolve(workspace, evidenceFile);
    if (!evidencePath.startsWith(`${workspace}${path.sep}`)) {
      errors.push(`requirements[${index}] evidence escapes the workspace: ${evidenceFile}.`);
      continue;
    }
    try { await access(evidencePath); }
    catch { errors.push(`requirements[${index}] evidence does not exist: ${evidenceFile}.`); }
  }
}

if (errors.length) {
  console.error('SpecGuard rejected the review:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (destination) await writeFile(path.resolve(destination), `${JSON.stringify(review, null, 2)}\n`);
console.log(`SpecGuard accepted ${review.caseId}: ${review.requirements.length} requirements, ${review.findings.length} findings.`);
