'use client';

export default function Header({onSearch,onLibrary,count=0}){
  return <header className="topbar">
    <div className="brand"><span className="brand-mark">S</span><span>StreamHub</span></div>
    <div className="actions">
      <button className="pill" onClick={onSearch}><span className="search-icon">⌕</span><span>Search</span></button>
      <button className="library-head" onClick={onLibrary} aria-label="Open library"><span className="heart-icon">♡</span>{count>0?<b>{count}</b>:null}</button>
    </div>
  </header>;
}
