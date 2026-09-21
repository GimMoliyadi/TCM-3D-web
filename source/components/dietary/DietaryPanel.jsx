import React, {useState} from 'react';
import FoodCard from './FoodCard';
import FoodDetail from './FoodDetail';
import {relationsForTarget,foodById,searchFoods,anchorNotice} from '../../utils/dietaryRelations';
export default function DietaryPanel({target,foodId,onFood,onTarget,onClose}) {
 const [query,setQuery] = useState('');
 const matches = searchFoods(query);
 return <aside className="dietary-panel" aria-label="传统食养知识"><header><span>食养知识 · 古籍阅读</span><button aria-label="关闭食养面板" onClick={onClose}>×</button></header>
 <div className="dietary-scroll"><p className="dietary-notice">“肝”为中医藏象知识节点，不等同于现代解剖器官。{anchorNotice}</p>
 {foodId ? <FoodDetail food={foodById(foodId)} onTarget={onTarget} onBack={() => onFood(null)}/> : <><h2>{target} · 传统食养</h2>
 <label>搜索食物<input placeholder="搜索食物名称" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <p className="dietary-muted">3 条原文已核对 · 不代表现代疗效验证</p>
 {relationsForTarget(target).filter(r=>matches.some(f=>f.id===r.foodId)).map(r=><FoodCard key={r.id} food={foodById(r.foodId)} relation={r} onSelect={onFood}/>)}
 {!matches.length && <p role="status">没有已核实的匹配条目。</p>}</>}
 </div></aside>;
}
