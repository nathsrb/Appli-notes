import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dirname=path.dirname(fileURLToPath(import.meta.url));
const base=path.join(dirname,'dist');
const publicOrigin='https://eternel-le-jardin-des-intercessions-dgus86.v2.appdeploy.ai';
const cache=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/', 'http://localhost');
 const hdr={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'SAMEORIGIN'};
 const send=(status,body,type='application/json; charset=utf-8',extra={})=>{res.writeHead(status,{...hdr,'Content-Type':type,...extra});res.end(body);};
 if(req.method!=='GET' && req.method!=='HEAD'){send(405,'{"error":"Méthode non autorisée"}');return;}
 if(url.pathname==='/health'){send(200,'{"ok":true}');return;}
 if(url.pathname==='/api/public-prayers'||url.pathname==='/api/public-stats'){
  const target=url.pathname.endsWith('prayers')?'/api/prayers':'/api/stats';
  const prev=cache.get(target);
  if(prev&&prev.exp>Date.now()){send(200,prev.body,'application/json; charset=utf-8',{'Cache-Control':'public, max-age=20'});return;}
  try{
   const upstream=await fetch(publicOrigin+target,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(10000),redirect:'error'});
   if(!upstream.ok){send(502,JSON.stringify({error:'Lecture des prières momentanément indisponible',upstream:upstream.status}));return;}
   const body=await upstream.text();
   if(body.length>1024*1024){send(502,'{"error":"Réponse trop volumineuse"}');return;}
   const parsed=JSON.parse(body);
   if(target==='/api/prayers'&&!Array.isArray(parsed.prayers)){send(502,'{"error":"Format de données inattendu"}');return;}
   const safe=target==='/api/prayers'?JSON.stringify({prayers:parsed.prayers.filter(p=>p&&p.status!=='removed').map(p=>({id:String(p.id||''),title:String(p.title||''),detail:String(p.detail||''),category:String(p.category||''),anonymous:Boolean(p.anonymous),authorName:p.anonymous?'Anonyme':String(p.authorName||'Membre'),createdAt:String(p.createdAt||''),status:String(p.status||''),testimony:p.status==='answered'?String(p.testimony||''):''}))}):JSON.stringify(parsed);
   cache.set(target,{exp:Date.now()+45000,body:safe});
   send(200,safe,'application/json; charset=utf-8',{'Cache-Control':'public, max-age=15'});
  }catch(e){console.error('Public prayer proxy:',e.message);send(503,'{"error":"La source publique des prières ne répond pas actuellement."}');}return;
 }
 let pathname;
 try{pathname=decodeURIComponent(url.pathname)}catch{send(400,'Bad path','text/plain');return;}
 if(pathname.includes('..')||pathname.includes('\\')){send(400,'Invalid path','text/plain');return;}
 let p=path.join(base,pathname==='/'?'index.html':pathname);
 if(!p.startsWith(base+path.sep)){send(403,'Forbidden','text/plain');return;}
 try{const stat=await fs.stat(p);if(stat.isDirectory())p=path.join(p,'index.html');const body=await fs.readFile(p);send(200,body,types[path.extname(p)]||'application/octet-stream',{'Cache-Control':path.basename(p)==='index.html'?'no-cache':'public, max-age=1200'});}
 catch{if(pathname.indexOf('.')===-1){try{send(200,await fs.readFile(path.join(base,'index.html')),'text/html; charset=utf-8');}catch{send(404,'Not found','text/plain');}}else send(404,'Not found','text/plain');}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('ÉTERNEL 3D server ready'));
const checkPublicSource=async()=>{
  try{
    const response=await fetch(publicOrigin+'/api/prayers',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
    if(!response.ok){console.warn('[ÉTERNEL] source des prières publiques indisponible:',response.status);return;}
    const data=await response.json();
    const count=Array.isArray(data?.prayers)?data.prayers.length:null;
    console.log('[ÉTERNEL] accès aux prières publiques vérifié :',count===null?'format inattendu':count+' sujets visibles');
  }catch(error){
    console.warn('[ÉTERNEL] vérification du flux public impossible :',error?.message||String(error));
  }
};
setTimeout(checkPublicSource,2500);
