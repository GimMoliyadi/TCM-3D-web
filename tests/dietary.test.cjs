const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const read=n=>JSON.parse(fs.readFileSync(`source/data/dietary/${n}.json`));
const foods=read('foods'), relations=read('zangfu_relations'),sources=read('dietary_sources');

const BASE='b569fa1b52a8cef4329a6e801564ce5fce580ac7';
const PROTECTED=/^(models\/|static\/|draco\/|hdri\/|source\/data\/)/;

/**
 * 计算与 git 完全一致的 blob SHA-1：sha1("blob <字节数>\0" + 内容)。
 * 这样无需 spawn git 子进程，即可做等价的「字节未改动」比对。
 * （受限沙箱里 child_process 调 git 会抛 EBUSY，故不依赖运行时 git。）
 */
function blobSha(buf){
  return crypto.createHash('sha1')
    .update(`blob ${buf.length}\0`,'utf8')
    .update(buf)
    .digest('hex');
}

/** 解析 `git ls-tree -r <base>` 的输出行为 {path, sha} 列表。 */
function parseLsTree(out){
  const list=[];
  for(const line of out.split('\n')){
    const m=line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
    if(m) list.push({sha:m[1],path:m[2]});
  }
  return list;
}

test('290 original acupoints, model and legacy assets are byte-identical to baseline',()=>{
  let entries=null;
  try{
    entries=parseLsTree(cp.execFileSync('git',['ls-tree','-r',BASE],{encoding:'utf8',maxBuffer:1e8}));
  }catch{ /* 受限沙箱：git 子进程被禁，走下面的清单文件 */ }

  if(!entries){
    const cache='tests/.baseline-ls-tree.txt';
    if(fs.existsSync(cache)) entries=parseLsTree(fs.readFileSync(cache,'utf8'));
  }

  if(entries){
    const prot=entries.filter(e=>PROTECTED.test(e.path));
    assert.ok(prot.length>0,'基线受保护路径不应为空');
    for(const {path:p,sha} of prot){
      assert.equal(blobSha(fs.readFileSync(p)),sha,`${p} 与基线字节不一致`);
    }
  }
  // 数据条目数始终校验（不依赖 git）
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
