import React from 'react';
import DietaryAnchor from './DietaryAnchor';
import { relations, anchorFor } from '../../utils/dietaryRelations';
export default function DietaryLayer({points, selected, onSelect}) {
 const targets = [...new Set(relations.map(r => r.target))];
 return targets.map(target => {const p = anchorFor(relations.find(r => r.target === target),points);
 return p ? <DietaryAnchor key={target} point={p} target={target} selected={selected === target} onSelect={onSelect}/> : null;});
}
