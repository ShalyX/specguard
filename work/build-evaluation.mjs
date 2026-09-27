import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('outputs/specguard-evaluation');
fs.mkdirSync(root,{recursive:true});
function put(p,s){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);}
const shared=`export interface Order { id: string; workspaceId: string; status: string; total: number }
export interface Query { workspaceId: string; status?: string; offset?: number; limit?: number }
export function listOrders(orders: Order[], query: Query): Order[] {
  const matching = orders.filter(o => o.workspaceId === query.workspaceId && (!query.status || o.status === query.status));
  return matching.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
}
`;
const functions={
  'R17':`export function exportOrders(orders: Order[], query: Query): string {
  const rows = orders.filter(o => o.workspaceId === query.workspaceId && (!query.status || o.status === query.status));
  return serialize(rows);
}`,
  'R42':`export function exportOrders(orders: Order[], query: Query): string {
  const rows = orders.filter(o => !query.status || o.status === query.status);
  return serialize(rows);
}`,
  'R68':`export function exportOrders(orders: Order[], query: Query): string {
  return serialize(listOrders(orders, query));
}`
};
const serializer=`
function serialize(rows: Order[]): string {
  return ['id,status,total', ...rows.map(o => [o.id, o.status, o.total].map(v => '"' + String(v).replaceAll('"', '""') + '"').join(','))].join('\\n');
}
`;
const tests=`import test from 'node:test';
import assert from 'node:assert/strict';
import {listOrders, exportOrders} from '../src/orders.ts';
test('list is scoped and paginated',()=>assert.equal(listOrders([{id:'x',workspaceId:'b',status:'paid',total:1}],{workspaceId:'a'}).length,0));
test('CSV contains matching rows and header',()=>{
 const csv=exportOrders([{id:'a1',workspaceId:'a',status:'paid',total:10},{id:'a2',workspaceId:'a',status:'open',total:5}],{workspaceId:'a',status:'paid'});
 assert.equal(csv,'id,status,total\\n"a1","paid","10"');
});
test('empty export retains header',()=>assert.equal(exportOrders([],{workspaceId:'a'}),'id,status,total'));
test('CSV escapes quotes and commas',()=>assert.equal(exportOrders([{id:'a,"b',workspaceId:'a',status:'paid',total:1}],{workspaceId:'a'}),'id,status,total\\n"a,""b","paid","1"'));
`;
const capture=`import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
const probe=process.argv[2];
if(probe && !/^probes\\/[a-zA-Z0-9_-]+\\.test\\.mjs$/.test(probe)) throw Error('Use a file in probes/name.test.mjs');
const args=['--test',probe ?? 'test/orders.test.mjs'];
const run=spawnSync(process.execPath,args,{encoding:'utf8',timeout:30000});
const sha='synthetic-snapshot';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const record={capturedAt:new Date().toISOString(),commit:sha,node:process.version,command:['node',...args],exitCode:run.status,error:run.error?.message??null,sourceHash:hash('src/orders.ts'),testHash:hash(probe??'test/orders.test.mjs'),stdout:run.stdout,stderr:run.stderr};
fs.mkdirSync('review-results',{recursive:true});
const file='review-results/run-'+Date.now()+'.json';
fs.writeFileSync(file,JSON.stringify(record,null,2));
console.log(file);console.log(run.stdout);process.exitCode=run.status??1;
`;
const baselinePrompt=`Review this proposed change against REQUIREMENTS.md and repository context. baseline/orders.ts is the original source; src/orders.ts is the proposed source and test/ contains added tests. This is a synthetic PR fixture without a Git remote. Use the issue as the source of intent; do not assume changed code defines intended behavior. Find material defects and ambiguities, substantiate findings, and give the maintainer an actionable review decision. You may run existing tests and add targeted probes under probes/. Do not modify src/, baseline/, test/, or REQUIREMENTS.md. Record executed checks with node capture.mjs (existing tests) or node capture.mjs probes/name.test.mjs. Save your natural-format review to review-results/review.md. Work only inside this folder. Stop after 10 minutes or a recorded 4-Bobcoin budget, whichever comes first; if usage cannot be observed, record it as unavailable and use the time cap. No source repairs during review. Capture your actual Bob task summary screenshot separately.\n`;
const structuredPrompt=`Review this proposed change against REQUIREMENTS.md and repository context. baseline/orders.ts is the original source; src/orders.ts is the proposed source and test/ contains added tests. This is a synthetic PR fixture without a Git remote. Work only inside this folder. Do not modify src/, baseline/, test/, or REQUIREMENTS.md. Use the issue as the source of intent; do not infer intent from changed code.
For each requirement, identify implementation evidence, investigate contradictions, and add targeted executable probes under probes/ where useful. Run checks using node capture.mjs or node capture.mjs probes/name.test.mjs. Do not fabricate execution evidence.
Save review-results/review.json with {caseId, commit, requirements:[{id, requirement, source, status, codeReferences:[], evidenceFiles:[], observation, humanQuestion}], findings:[], unassessed:[], recommendation}.
Statuses: supported (limited to the checks shown), contradicted (reproduced or specific cited evidence), needs-decision (intent ambiguous), unassessed (not established). References must use repository-relative paths and one-based line numbers. evidenceFiles must point to actual capture output. Each finding must identify its requirement and evidence. Retain uncertainty; no global safety score. Do not silently omit unmet or untested requirements. State assumptions and omitted scope. No source repairs during review.
Stop after 10 minutes or a recorded 4-Bobcoin budget, whichever comes first; if usage cannot be observed, record it as unavailable and use the time cap. Capture your actual Bob task summary screenshot separately.\n`;
const results=[];
for(const [id,fn] of Object.entries(functions)){
 for(const arm of ['baseline','structured']){
  const dir=path.join(root,'review-cases',id,arm);
  if(fs.existsSync(path.join(dir,'review-results')))throw Error('Refusing to overwrite an existing evaluation run: '+dir);
  const scope=id==='R68'?'Export records matching the current view filters.':'Export every matching record across all pages, regardless of the current page offset or limit.';
  put(path.join(dir,'REQUIREMENTS.md'),`# Issue: CSV export for workspace orders\n\nAdd a CSV export function for the order-list screen.\n\n- R1: Export only records belonging to the active workspace.\n- R2: Respect the selected status filter. ${scope}\n- R3: Empty exports contain the header row.\n- R4: Quote CSV values and escape embedded quotation marks.\n\nExisting context: the order-list screen passes its filters and current pagination in a Query object. Order totals and identifiers are supplied by trusted upstream code; this change does not process spreadsheet formulas or calculate totals.\n`);
  put(path.join(dir,'README.md'),'# Orders service\n\nSynthetic, local-only review fixture. Requires Node 24; no installation or network needed.\nRun `node --test --test-isolation=none test/orders.test.mjs`. Compare baseline/orders.ts to src/orders.ts. This fixture has no Git remote.\nExisting checks are a starting point, not a completeness guarantee. Add investigation tests under probes/. Run `node capture.mjs probes/name.test.mjs` for execution receipts.\n');
  put(path.join(dir,'baseline/orders.ts'),shared);
  put(path.join(dir,'.gitignore'),'review-results/\nprobes/\n');
  put(path.join(dir,'src/orders.ts'),shared+fn+serializer);
  put(path.join(dir,'test/orders.test.mjs'),tests);
  put(path.join(dir,'capture.mjs'),capture);
  put(path.join(dir,'REVIEW-PROMPT.txt'),arm==='baseline'?baselinePrompt:structuredPrompt);
  results.push({id,arm,validation:'pending direct test run'});
 }
}
put(path.join(root,'facilitator','fixture-validation.json'),JSON.stringify(results,null,2));
put(path.join(root,'facilitator','answer-key.md'),`# Facilitator only — never open this folder as Bob's workspace\n\nThese are synthetic authored fixtures, not discovered production defects.\n\nR17: Correct within the four explicit acceptance criteria. Cross-workspace and cross-page probes should pass. Do not reward speculative defects as confirmed.\nR42: Seeded workspace-isolation defect. exportOrders filters status but omits workspaceId. A paid order from another workspace is exported. Existing tests all pass. A new failing assertion should identify the foreign order.\nR68: Pagination ambiguity. listOrders enforces pagination, so only the current page is exported. The issue deliberately does not specify export scope. Request a product decision; do not label either interpretation a proven requirement violation. Workspace isolation, status filtering, empty results, and escaping should hold.\n\nCredit other findings only if independently reproduced and within explicit fixture scope. A test failure caused by a broken probe is not a detected product defect. The small source intentionally tests basic workflow correctness, not performance on large PRs.\n`);
console.log(JSON.stringify({root,cases:results.length}));
