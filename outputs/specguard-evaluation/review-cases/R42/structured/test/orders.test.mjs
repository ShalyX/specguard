import test from 'node:test';
import assert from 'node:assert/strict';
import {listOrders, exportOrders} from '../src/orders.ts';
test('list is scoped and paginated',()=>assert.equal(listOrders([{id:'x',workspaceId:'b',status:'paid',total:1}],{workspaceId:'a'}).length,0));
test('CSV contains matching rows and header',()=>{
 const csv=exportOrders([{id:'a1',workspaceId:'a',status:'paid',total:10},{id:'a2',workspaceId:'a',status:'open',total:5}],{workspaceId:'a',status:'paid'});
 assert.equal(csv,'id,status,total\n"a1","paid","10"');
});
test('empty export retains header',()=>assert.equal(exportOrders([],{workspaceId:'a'}),'id,status,total'));
test('CSV escapes quotes and commas',()=>assert.equal(exportOrders([{id:'a,"b',workspaceId:'a',status:'paid',total:1}],{workspaceId:'a'}),'id,status,total\n"a,""b","paid","1"'));
