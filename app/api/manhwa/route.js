import {NextResponse} from 'next/server';
import {cached} from '../../../lib/cache.js';
import {getManhwa,getManhwaDetail,getManhwaChapter} from '../../../lib/manhwa.js';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req){
  const p=req.nextUrl.searchParams;
  const action=p.get('action')||'list';
  const type=p.get('type')||'latest';
  const page=Number(p.get('page')||1);
  const limit=Math.min(48,Math.max(1,Number(p.get('limit')||24)));
  const q=p.get('q')||'';
  const source=p.get('source')||process.env.SANKA_COMIC_SOURCE||'komiku';
  const slug=p.get('slug')||'';
  const key=`sanka:${action}:${source}:${type}:${page}:${limit}:${q}:${slug}`;
  try{
    const result=await cached(key,async()=>{
      if(action==='detail')return getManhwaDetail(slug,source);
      if(action==='chapter')return getManhwaChapter(slug,source);
      return getManhwa(type,page,limit,q,source);
    },Number(process.env.CACHE_TTL||300));
    return NextResponse.json({ok:true,cached:result.cached,...result.data});
  }catch(error){
    return NextResponse.json({ok:false,error:error?.message||'Sanka API request failed',source,action},{status:502});
  }
}
