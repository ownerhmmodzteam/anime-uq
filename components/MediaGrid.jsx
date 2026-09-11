'use client';
import MediaCard from './MediaCard';

export default function MediaGrid({items=[],loading=false,onSelect,watchlist=[],favorites=[],onWatchlist,onFavorite}){
  if(loading)return <div className="cards">{Array.from({length:12},(_,i)=><div className="card" key={i}><div className="poster skeleton"/><div className="card-title skeleton" style={{height:17,marginTop:9,borderRadius:6}}/><div className="card-meta skeleton" style={{height:14,width:'60%',marginTop:6,borderRadius:6}}/></div>)}</div>;
  if(!items.length)return <div className="empty">Tidak ada data untuk ditampilkan.</div>;
  const has=(list,item)=>list.some(x=>x.key===item.key);
  return <div className="cards">{items.map((x,i)=><MediaCard key={x.key||x.id||i} item={x} onClick={onSelect} isWatchlisted={has(watchlist,x)} isFavorite={has(favorites,x)} onWatchlist={onWatchlist} onFavorite={onFavorite}/>)}</div>;
}
