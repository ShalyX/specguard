import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeReview, reviewDisposition, validateReview } from '../lib/review-contract.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(projectRoot, '..');
const dist = path.join(projectRoot, 'dist');
const parseJsonFile = async file => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const cases = [
  { id: 'R17', title: 'Clean export', subtitle: 'All requirements supported', baseline: 'Incorrectly blocked', path: 'outputs/specguard-evaluation/review-cases/R17/structured' },
  { id: 'R42', title: 'Workspace leak', subtitle: 'Tenant boundary violated', baseline: 'Correctly blocked', path: 'outputs/specguard-evaluation/review-cases/R42/structured' },
  { id: 'R68', title: 'Pagination intent', subtitle: 'Product decision required', baseline: 'Incorrectly blocked', path: 'outputs/specguard-evaluation/review-cases/R68/structured' }
];

await mkdir(dist, { recursive: true });
const firstReview = path.join(repoRoot, cases[0].path, 'review-results/review.json');
// Vercel reserves /vercel/outputs for its own build artifacts. Because the
// project is deployed from this subdirectory, always use the packaged,
// validated demo data there instead of probing outside the project root.
const evidenceAvailable = !process.env.VERCEL && await access(firstReview).then(() => true, () => false);
if (evidenceAvailable) {
  const output = [];
  for (const entry of cases) {
    const caseRoot = path.join(repoRoot, entry.path);
    const raw = await parseJsonFile(path.join(caseRoot, 'review-results/review.json'));
    const review = normalizeReview(raw);
    const errors = validateReview(review);
    if (errors.length) throw new Error(`${entry.id} failed validation:\n${errors.join('\n')}`);

    const receipts = {};
    const evidence = new Set(review.requirements.flatMap(item => item.evidenceFiles));
    for (const relative of evidence) {
      const absolute = path.resolve(caseRoot, relative);
      if (!absolute.startsWith(`${caseRoot}${path.sep}`)) throw new Error(`${entry.id}: evidence path escapes its case.`);
      receipts[path.basename(relative)] = await parseJsonFile(absolute);
    }
    output.push({ ...entry, disposition: reviewDisposition(review), review, receipts });
  }
  const data = `export const demoCases = ${JSON.stringify(output, null, 2)};\n`;
  await writeFile(path.join(projectRoot, 'src', 'demo-data.js'), data);
  await writeFile(path.join(dist, 'demo-data.js'), data);
  console.log(`Built SpecGuard with ${output.length} freshly validated Bob reviews.`);
} else {
  await cp(path.join(projectRoot, 'src', 'demo-data.js'), path.join(dist, 'demo-data.js'));
  console.log('Built SpecGuard with the packaged validated Bob reviews.');
}
for (const file of ['index.html', 'styles.css', 'app.js']) await cp(path.join(projectRoot, 'src', file), path.join(dist, file));
