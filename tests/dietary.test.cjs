const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const read=n=>JSON.parse(fs.readFileSync(`source/data/dietary/${n}.json`));
const foods=read('foods'), relations=read('zangfu_relations'),sources=read('dietary_sources');
test('290 original acupoints, model and published assets are byte-identical to baseline',()=>{
 const base='b569fa1b52a8cef4329a6e801564ce5fce580ac7';
 const paths=cp.execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(p=>/^(models\/|static\/|draco\/|hdri\/|index.html$|asset-manifest.json$|source\/data\/)/.test(p));
 for(const p of paths) assert.deepEqual(fs.readFileSync(p),cp.execFileSync('git',['show',`${base}:${p}`],{maxBuffer:8e6}),p);
 assert.equal(JSON.parse(fs.readFileSync('source/data/acupoints_data.json')).length,290);
});
test('three foods have complete source-backed relations and resolve existing IDs',()=>{
 const points=JSON.parse(fs.readFileSync('source/data/acupoints_data.json'));
 assert.equal(foods.length,3);assert.equal(relations.length,3);
 for(const collection of [foods,relations,sources]) assert.equal(new Set(collection.map(x=>x.id)).size,collection.length);
 for(const r of relations){assert(foods.some(f=>f.id===r.foodId));assert(points.some(p=>p.id===r.anchorAcupointId));assert.equal(r.target,'肝');assert.equal(r.confidence,'source_verified');
 for(const id of r.sourceIds){const s=sources.find(s=>s.id===id);assert(s);for(const k of ['book','chapter','entry','quote','repository','path','fileSha256','verification']) assert(s[k],k);}}
});
test('knowledge layer contains no duplicate spatial coordinates or modern textbook excerpts',()=>{
 for(const collection of [foods,relations,sources]) for(const item of collection) for(const key of ['x','y','z','relativePos','position']) assert.equal(item[key],undefined);
 assert(sources.every(s=>s.sourceKind==='classical_text'));assert.deepEqual(read('dietary_recipes'),[]);
});
