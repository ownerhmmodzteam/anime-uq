import {getComic,getComicDetail,getComicChapter} from './sanka.js';

export async function getManhwa(type='latest',page=1,limit=24,q='',source='komiku'){
  return getComic({type:type==='trending'?'latest':type,page,limit,q,source})
}

export async function getManhwaDetail(slug,source='komiku'){
  return getComicDetail({slug,source})
}

export async function getManhwaChapter(slug,source='komiku'){
  return getComicChapter({slug,source})
}
