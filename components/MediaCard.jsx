'use client';

function Icon({name}){
  if(name==='heart') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z"/></svg>;
}

export default function MediaCard({item,onClick,isWatchlisted=false,isFavorite=false,onWatchlist,onFavorite}){
  return <article className="card">
    <button className="card-open" onClick={()=>onClick?.(item)} aria-label={`Open ${item.title}`}>
      <div className="poster">
        {item.cover?<img src={item.cover} alt="" loading="lazy" onError={e=>e.currentTarget.style.display='none'}/>:null}
        <span className="badge">{item.type||'Media'}</span>
        <span className="source-badge">{item.source||'stream'}</span>
      </div>
      <div className="card-title">{item.title}</div>
      <div className="card-meta">{item.status||item.latestChapter||item.chapter||'Explore'}</div>
    </button>
    <div className="card-actions">
      <button className={`mini-action ${isWatchlisted?'active':''}`} onClick={()=>onWatchlist?.(item)} aria-label={isWatchlisted?'Remove from watchlist':'Add to watchlist'}><Icon name="bookmark"/><span>{isWatchlisted?'Saved':'Watchlist'}</span></button>
      <button className={`mini-action ${isFavorite?'active':''}`} onClick={()=>onFavorite?.(item)} aria-label={isFavorite?'Remove from favorites':'Add to favorites'}><Icon name="heart"/><span>{isFavorite?'Liked':'Favorite'}</span></button>
    </div>
  </article>
}
