const BASE_URL=(process.env.SANKA_BASE_URL||'https://www.sankavollerei.web.id').replace(/\/$/,'');
const SOURCE=process.env.SANKA_COMIC_SOURCE||'komiku';

function collect(value,out=[]){
  if(Array.isArray(value)){for(const item of value)collect(item,out);return out}
  if(!value||typeof value!=='object')return out
  const keys=['data','results','items','comics','manga','list','result','content','entries']
  let found=false
  for(const key of keys){if(Array.isArray(value[key])){found=true;collect(value[key],out)}}
  if(!found&&('title' in value||'name' in value||'judul' in value||'slug' in value||'url' in value||'link' in value))out.push(value)
  return out
}

function first(...values){return values.find(v=>v!==undefined&&v!==null&&String(v).trim()!=='')}

function normalize(item){
  const genres=first(item.genres,item.genre,item.tags,[])
  return {
    id:first(item.id,item.slug,item.slug_name,item.url,item.link,item.title,item.name),
    title:first(item.title,item.name,item.judul,item.comic_title,'Untitled'),
    slug:first(item.slug,item.slug_name,''),
    url:first(item.url,item.link,item.detail_url,''),
    cover:first(item.cover,item.image,item.thumbnail,item.poster,item.thumb,item.cover_url,item.image_url,''),
    description:first(item.description,item.synopsis,item.sinopsis,item.desc,''),
    type:first(item.type,item.kind,'Manhwa'),
    status:first(item.status,''),
    latestChapter:first(item.latestChapter,item.latest_chapter,item.chapter,item.chapter_latest,item.eps,''),
    rating:first(item.rating,item.score,''),
    genres:Array.isArray(genres)?genres:typeof genres==='string'?genres.split(',').map(x=>x.trim()).filter(Boolean):[],
    source:`sanka:${SOURCE}`
  }
}

async function request(path){
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),Number(process.env.SANKA_TIMEOUT||10000))
  try{
    const response=await fetch(`${BASE_URL}${path}`,{
      signal:controller.signal,
      headers:{Accept:'application/json','User-Agent':'StreamHub/1.0'},
      cache:'no-store'
    })
    const text=await response.text()
    if(!response.ok)throw new Error(`Sanka API ${response.status}`)
    let data
    try{data=JSON.parse(text)}catch{throw new Error('Sanka API returned invalid JSON')}
    return data
  }finally{clearTimeout(timer)}
}

function encode(value){return encodeURIComponent(String(value||'').trim())}

export async function getComic({type='latest',page=1,limit=24,q='',source=SOURCE,slug=''}){
  const selected=source||SOURCE
  let path
  if(type==='search'&&q)path=`/comic/${encode(selected)}/search/${encode(q)}`
  else if(type==='popular')path=`/comic/${encode(selected)}/popular`
  else if(type==='latest')path=`/comic/${encode(selected)}/latest`
  else path='/comic/homepage'
  const raw=await request(path)
  const all=collect(raw).map(normalize)
  const seen=new Set()
  const data=all.filter(item=>{
    const key=String(item.id||item.slug||item.url||item.title).toLowerCase()
    if(seen.has(key))return false
    seen.add(key)
    return true
  })
  const pageNumber=Math.max(1,Number(page)||1)
  const size=Math.min(48,Math.max(1,Number(limit)||24))
  const start=(pageNumber-1)*size
  return {page:pageNumber,limit:size,total:data.length,data:data.slice(start,start+size),source:`sanka:${selected}`,endpoint:path}
}

export async function getComicDetail({source=SOURCE,slug}){
  if(!slug)throw new Error('Comic slug is required')
  const raw=await request(`/comic/${encode(source)}/manga/${encode(slug)}`)
  const items=collect(raw).map(normalize)
  return {source:`sanka:${source}`,data:items[0]||normalize(raw),raw}
}

export async function getComicChapter({source=SOURCE,slug}){
  if(!slug)throw new Error('Chapter slug is required')
  const raw=await request(`/comic/${encode(source)}/chapter/${encode(slug)}`)
  return {source:`sanka:${source}`,data:raw}
}
