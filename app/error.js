'use client';

import {useEffect} from 'react';

export default function Error({error,reset}){
  useEffect(()=>{console.error(error)},[error]);
  return <main className="error-page"><div className="error-card"><div className="eyebrow">STREAMHUB ERROR</div><h1>Something went wrong.</h1><p>{error?.message||'The page could not be loaded.'}</p><div className="error-actions"><button className="primary" onClick={()=>reset()}>Try again</button><button className="secondary" onClick={()=>location.reload()}>Reload</button></div></div></main>;
}
