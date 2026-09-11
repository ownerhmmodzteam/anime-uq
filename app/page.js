'use client';

import {useEffect,useMemo,useState} from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MediaGrid from '../components/MediaGrid';

const STORAGE_WATCH='streamhub_watchlist_v1';
const STORAGE_FAV='streamhub_favorites_v1';

function mediaKey(item){return String(item?.source||'local')+'::'+String(item?.id||item?.slug||item?.url||item?.title||'unknown').toLowerCase()}
function hydrate(list){return Array.isArray(list)?list.map(x=>({...x,key:x.key||mediaKey(x)})):[]}
function readStorage(name){try{return hydrate(JSON.parse(localStorage.getItem(name)||'[]'))}catch{return[]}}

export default function Home(){
  const [tab,setTab]=useState('home');
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState('');
  const [search,setSearch]=useState(false);
  const [selected,setSelected]=useState(null);
  const [watchlist,setWatchlist]=useState([]);
  const [favorites,setFavorites]=useState([]);
  const [libraryTab,setLibraryTab]=useState('watchlist');
  const [libraryFilter,setLibraryFilter]=useState('all');
  const [toast,setToast]=useState('');
  const [apiError,setApiError]=useState('');

  useEffect(()=>{setWatchlist(readStorage(STORAGE_WATCH));setFavorites(readStorage(STORAGE_FAV))},[]);

  useEffect(()=>{
    try{localStorage.setItem(STORAGE_WATCH,JSON.stringify(watchlist))}catch{}
  },[watchlist]);

  useEffect(()=>{
    try{localStorage.setItem(STORAGE_FAV,JSON.stringify(favorites))}catch{}
  },[favorites]);

  function notify(message){setToast(message);window.clearTimeout(window.__streamhub_toast);window.__streamhub_toast=window.setTimeout(()=>setToast(''),1800)}

  function toggleList(item,type){
    const key=mediaKey(item);
    const normalized={...item,key};
    if(type==='watchlist'){
      setWatchlist(current=>{
        const exists=current.some(x=>x.key===key);
        notify(exists?'Removed from watchlist':'Added to watchlist');
        return exists?current.filter(x=>x.key!==key):[normalized,...current];
      });
    }else{
      setFavorites(current=>{
        const exists=current.some(x=>x.key===key);
        notify(exists?'Removed from favorites':'Added to favorites');
        return exists?current.filter(x=>x.key!==key):[normalized,...current];
      });
    }
  }

  async function load(){
    setLoading(true);
    setApiError('');
    try{
      let url='/api/manhwa?type=latest&page=1&limit=24';
      if(tab==='manhwa')url='/api/manhwa?type=latest&page=1&limit=24';
      if(tab==='anime')url='/api/media?source=sokuja&action=latest&page=1';
      if(tab==='dracin')url='/api/media?source=dracin&action=home&page=1';
      if(tab==='drakor')url='/api/media?source=drakor&action=home&page=1';
      if(tab==='donghua')url='/api/media?source=donghua&action=home&page=1';
      const r=await fetch(url,{cache:'no-store'});
      const j=await r.json();
      if(!j.ok)throw new Error(j.error||'API request failed');
      const data=(j.data||[]).map(x=>({...x,key:mediaKey(x)}));
      setItems(data);
    }catch(error){setItems([]);setApiError(error?.message||'Unable to load data')}finally{setLoading(false)}
  }

  useEffect(()=>{if(!['library','search'].includes(tab))load()},[tab]);

  async function doSearch(e){
    e?.preventDefault();
    if(!query.trim())return;
    setLoading(true);setSearch(true);setTab('home');
    setApiError('');
    try{
      const [m,a]=await Promise.allSettled([
        fetch(`/api/manhwa?type=latest&q=${encodeURIComponent(query)}&page=1&limit=24`).then(r=>r.json()),
        fetch(`/api/media?source=sokuja&action=search&q=${encodeURIComponent(query)}&page=1`).then(r=>r.json())
      ]);
      const manhwa=m.status==='fulfilled'?(m.value.data||[]):[];
      const anime=a.status==='fulfilled'?(a.value.data||[]):[];
      const merged=[...anime,...manhwa].map(x=>({...x,key:mediaKey(x)}));
      if(!merged.length)throw new Error('No results found');
      const seen=new Set();
      setItems(merged.filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return true}));
    }catch(error){setItems([]);setApiError(error?.message||'Search failed')}finally{setLoading(false)}
  }

  function navigate(id){
    setSearch(false);
    if(id==='search'){setSearch(true);setTab('home');return}
    setTab(id);
    if(id==='library')setSelected(null);
  }

  const libraryItems=useMemo(()=>{
    const base=libraryTab==='watchlist'?watchlist:favorites;
    if(libraryFilter==='all')return base;
    return base.filter(x=>(x.type||'').toLowerCase().includes(libraryFilter));
  },[libraryTab,libraryFilter,watchlist,favorites]);

  const activeList=selected?(watchlist.some(x=>x.key===mediaKey(selected))?'watchlist':null):null;
  const isSelectedWatch=selected?watchlist.some(x=>x.key===mediaKey(selected)):false;
  const isSelectedFavorite=selected?favorites.some(x=>x.key===mediaKey(selected)):false;
  const libraryCount=watchlist.length+favorites.length;

  return <>
    <div className="shell">
      <Header onSearch={()=>{setSearch(true);setTab('home')}} onLibrary={()=>setTab('library')} count={libraryCount}/>

      {!search&&tab==='home'?<section className="hero">
        <div className="hero-bg" style={{backgroundImage:`url(${items[0]?.cover||''})`}}/>
        <div className="hero-content">
          <div className="eyebrow">YOUR PERSONAL STREAM LIBRARY</div>
          <h1>{items[0]?.title||'Discover something new.'}</h1>
          <p>{items[0]?.description||'Simpan tontonan favoritmu dari anime, manhwa, drama, dan donghua dalam satu tempat.'}</p>
          <div className="hero-actions"><button className="primary" onClick={()=>setTab('anime')}>Explore anime</button><button className="secondary" onClick={()=>setTab('library')}>My library</button></div>
        </div>
      </section>:null}

      {!search&&tab==='home'?<div className="source-row">
        {[['anime','Anime'],['manhwa','Manhwa'],['dracin','Dracin'],['drakor','Drakor'],['donghua','Donghua']].map(([id,label])=><button key={id} className={`source-chip ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>)}
      </div>:null}

      {search?<section className="section"><form className="search" onSubmit={doSearch}><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anime, manhwa, drama..."/><button>Search</button></form></section>:null}

      {apiError?<div className="api-error"><span>{apiError}</span><button onClick={()=>load()}>Retry</button></div>:null}

      {tab==='library'?<section className="section library-section">
        <div className="library-hero"><div><div className="eyebrow">MY LIBRARY</div><h1>Saved for later.</h1><p>Watchlist dan favorit tersimpan langsung di browser ini.</p></div><div className="library-count"><strong>{libraryCount}</strong><span>saved</span></div></div>
        <div className="library-tabs"><button className={libraryTab==='watchlist'?'active':''} onClick={()=>setLibraryTab('watchlist')}>Watchlist <b>{watchlist.length}</b></button><button className={libraryTab==='favorites'?'active':''} onClick={()=>setLibraryTab('favorites')}>Favorites <b>{favorites.length}</b></button></div>
        <div className="filter-row">{[['all','All'],['anime','Anime'],['manhwa','Manhwa'],['dracin','Dracin'],['drakor','Drakor'],['donghua','Donghua']].map(([id,label])=><button key={id} className={libraryFilter===id?'active':''} onClick={()=>setLibraryFilter(id)}>{label}</button>)}</div>
        <MediaGrid items={libraryItems} watchlist={watchlist} favorites={favorites} onSelect={setSelected} onWatchlist={x=>toggleList(x,'watchlist')} onFavorite={x=>toggleList(x,'favorites')}/>
      </section>:<section className="section">
        <div className="section-head"><div><div className="section-title">{search?'Search results':tab==='anime'?'Latest anime':tab==='manhwa'?'Latest manhwa':tab==='dracin'?'Latest dracin':tab==='drakor'?'Latest drakor':tab==='donghua'?'Latest donghua':'Trending now'}</div><div className="section-sub">Tap the bookmark or heart to save any title.</div></div></div>
        <MediaGrid items={items} loading={loading} watchlist={watchlist} favorites={favorites} onSelect={setSelected} onWatchlist={x=>toggleList(x,'watchlist')} onFavorite={x=>toggleList(x,'favorites')}/>
      </section>}

      {selected?<div className="sheet" onClick={()=>setSelected(null)}><div className="sheet-card" onClick={e=>e.stopPropagation()}>
        <div className="sheet-cover">{selected.cover&&<img src={selected.cover} alt=""/>}</div>
        <div className="sheet-info"><div className="eyebrow">{selected.type||'MEDIA'} · {selected.source||'stream'}</div><h2>{selected.title}</h2><p>{selected.description||'Simpan judul ini ke watchlist atau favorit untuk menemukannya lagi.'}</p><div className="sheet-actions"><button className={`save-button ${isSelectedWatch?'saved':''}`} onClick={()=>toggleList(selected,'watchlist')}>{isSelectedWatch?'✓ In watchlist':'＋ Watchlist'}</button><button className={`save-button ${isSelectedFavorite?'saved':''}`} onClick={()=>toggleList(selected,'favorites')}>{isSelectedFavorite?'♥ Favorited':'♡ Favorite'}</button></div><button className="close-button" onClick={()=>setSelected(null)}>Close</button></div>
      </div></div>:null}
    </div>
    {toast?<div className="toast">{toast}</div>:null}
    <BottomNav active={tab} onChange={navigate}/>
  </>;
}
