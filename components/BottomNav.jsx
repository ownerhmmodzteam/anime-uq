'use client';

const items=[['home','Home'],['anime','Anime'],['manhwa','Manhwa'],['library','Library'],['search','Search']];

export default function BottomNav({active,onChange}){
  return <nav className="bottom">{items.map(([id,label])=><button key={id} className={`nav-item ${active===id?'active':''}`} onClick={()=>onChange(id)}><span className={`nav-icon nav-${id}`}></span><span>{label}</span></button>)}</nav>;
}
