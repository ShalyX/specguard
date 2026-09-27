import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const results=[];
for(const id of ['R17','R42','R68']) for(const arm of ['baseline','structured']) {
  const base=new URL(`../review-cases/${id}/${arm}/`,import.meta.url);
  await import(new URL('test/orders.test.mjs',base));
  const {exportOrders}=await import(new URL('src/orders.ts',base));
  const rows=[{id:'local-1',workspaceId:'a',status:'paid',total:10},{id:'foreign-1',workspaceId:'b',status:'paid',total:20},{id:'local-2',workspaceId:'a',status:'paid',total:30}];
  const csv=exportOrders(rows,{workspaceId:'a',status:'paid',limit:1});
  const leaks=csv.includes('foreign-1');
  const second=csv.includes('local-2');
  assert.equal(leaks,id==='R42',`${id} isolation oracle`);
  assert.equal(second,id!=='R68',`${id} pagination oracle`);
  const source=fs.readFileSync(new URL('src/orders.ts',base));
  results.push({id,arm,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),workspaceIsolationAssertion:leaks?'FAIL':'PASS',secondMatchingRecordPresent:second,output:csv,expectedFixtureBehaviorConfirmed:true});
}
for(const id of ['R17','R42','R68']) assert.equal(results.find(r=>r.id===id&&r.arm==='baseline').sourceSha256,results.find(r=>r.id===id&&r.arm==='structured').sourceSha256);
fs.writeFileSync(fileURLToPath(new URL('oracle-results.json',import.meta.url)),JSON.stringify({generatedAt:new Date().toISOString(),provenance:'Local Node execution by Codex; not a Bob evaluation',cases:results},null,2));
console.log('Fixture oracle confirmed: R17 correct, R42 leaks foreign records, R68 scope requires a decision. Baseline/structured source pairs identical.');
