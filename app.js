const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const COLORS=['#e3342f','#f59e0b','#facc15','#22a559','#2563eb','#7c3aed','#ec4899','#f5f5f4','#1f2937','#8b5a2b'];
const DEFS=[['1×1',1,1,3],['1×2',1,2,3],['2×2',2,2,3],['1×4',1,4,3],['2×4',2,4,3],['แผ่น 2×2',2,2,1],['แผ่น 2×4',2,4,1],['แผ่น 4×4',4,4,1],['แผ่นใหญ่ 8×8',8,8,1]];
let curC=COLORS[0],sel=null;const P=new Map(),M=new Map();
// ---------- three ----------
const R=(()=>{const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.shadowMap.enabled=true;document.body.prepend(r.domElement);return r})();
const cv=R.domElement,S=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,1,.1,500);
S.add(new THREE.HemisphereLight(0xffffff,0xbbbbbb,.95));
const sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:80});S.add(sun);
const gr=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.15}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;S.add(gr);
const grid=new THREE.GridHelper(48,48,0xcfcfca,0xdeded9);grid.position.y=.002;S.add(grid);
let th=.8,ph=1,dist=26;const tg=new THREE.Vector3(4,0,4);
function camUp(){cam.position.set(tg.x+dist*Math.sin(ph)*Math.sin(th),tg.y+dist*Math.cos(ph),tg.z+dist*Math.sin(ph)*Math.cos(th));cam.lookAt(tg)}
function resize(){R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();camUp();
S.background=new THREE.Color(matchMedia('(prefers-color-scheme:dark)').matches?0x1c1c1e:0xf3f2ef);
// ---------- bricks ----------
const fp=p=>p.r%2?[p.d,p.w]:[p.w,p.d];
function baseY(p){const[a,b]=fp(p);let y=0;for(const q of P.values()){if(q===p)continue;const[c,d]=fp(q);if(p.x<q.x+c&&p.x+a>q.x&&p.z<q.z+d&&p.z+b>q.z)y=Math.max(y,q.y+q.h)}return y}
const stud=new THREE.CylinderGeometry(.3,.3,.17,16);
function build(p){
 if(M.has(p.id)){S.remove(M.get(p.id))}
 const[fw,fd]=fp(p),H=p.h*.4,g=new THREE.Group(),
 mat=new THREE.MeshStandardMaterial({color:p.c,roughness:.45}),sm=new THREE.MeshStandardMaterial({color:p.c,roughness:.45});
 if(p.tex)new THREE.TextureLoader().load(p.tex,t=>{mat.map=t;mat.color.set(0xffffff);mat.needsUpdate=true});
 const b=new THREE.Mesh(new THREE.BoxGeometry(fw,H,fd),mat);b.position.set(fw/2,H/2,fd/2);b.castShadow=b.receiveShadow=true;g.add(b);
 for(let i=0;i<fw;i++)for(let j=0;j<fd;j++){const s=new THREE.Mesh(stud,sm);s.position.set(i+.5,H+.085,j+.5);s.castShadow=true;g.add(s)}
 const ol=new THREE.Mesh(new THREE.BoxGeometry(fw+.14,H+.14,fd+.14),new THREE.MeshBasicMaterial({color:0x2563eb,side:THREE.BackSide}));ol.position.copy(b.position);ol.visible=p.id===sel;g.add(ol);
 g.userData={id:p.id,ol};g.position.set(p.x,p.y*.4,p.z);S.add(g);M.set(p.id,g)}
function setP(p){P.set(p.id,p);build(p)}
function delP(id){const g=M.get(id);if(g)S.remove(g);M.delete(id);P.delete(id);if(sel===id)select(null)}
function select(id){sel=id;M.forEach(g=>g.userData.ol.visible=g.userData.id===id);$('#ring').style.display=id?'block':'none';if(!id)$('#tex').style.display='none'}
function ringUp(){const p=P.get(sel);if(!p)return;const[fw,fd]=fp(p),v=new THREE.Vector3(p.x+fw/2,p.y*.4+p.h*.2,p.z+fd/2).project(cam),x=(v.x+1)/2*innerWidth,y=(1-v.y)/2*innerHeight,r=Math.max(52,Math.min(110,innerWidth/7));
 $$('#ring button').forEach((b,i)=>{const a=[[0,-1],[1,0],[0,1],[-1,0]][i];b.style.left=x+a[0]*r+'px';b.style.top=y+a[1]*r+'px'})}
// ---------- actions (local + network) ----------
const rid=()=>Math.random().toString(36).slice(2,10);
function commit(p,t='upd'){setP(p);send({t,p})}
function groundAt(cx,cy){const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1),cam);const v=new THREE.Vector3();return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),v)?v:null}
function spawn(def,at){const p={id:rid(),w:def[1],d:def[2],h:def[3],c:curC,tex:null,x:0,y:0,z:0,r:0};const g=at||groundAt(innerWidth/2,innerHeight/2)||tg;
 p.x=Math.round(g.x-p.w/2);p.z=Math.round(g.z-p.d/2);p.y=baseY(p);select(p.id);commit(p,'add')}
function rotate(id){const p=P.get(id);if(!p)return;const[a,b]=fp(p),cx=p.x+a/2,cz=p.z+b/2;p.r=(p.r+1)%4;const[c,d]=fp(p);p.x=Math.round(cx-c/2);p.z=Math.round(cz-d/2);p.y=baseY(p);commit(p)}
function remove(id){delP(id);send({t:'del',id})}
// ---------- input ----------
const pts=new Map();let drag=null,orb=false,moved=0,lastD=0;
const ray=new THREE.Raycaster();
function ground(e){return groundAt(e.clientX,e.clientY)}
function pick(e){ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1),cam);const h=ray.intersectObjects([...M.values()],true)[0];if(!h)return null;let o=h.object;while(o&&!o.userData.id)o=o.parent;return o?o.userData.id:null}
function startDrag(id,e){const p=P.get(id),g=ground(e);if(p&&g)drag={id,ox:g.x-p.x,oz:g.z-p.z}}
const pd=()=>{const a=[...pts.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};
cv.addEventListener('pointerdown',e=>{if(e.button===2)return;hideCtx();pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;
 if(pts.size===2){drag=null;orb=true;lastD=pd();return}
 const id=pick(e);if(id){select(id);startDrag(id,e)}else orb=true});
addEventListener('pointermove',e=>{const o=pts.get(e.pointerId);if(!o)return;const dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
 if(pts.size===2){const d=pd();dist=Math.max(6,Math.min(80,dist*lastD/d));lastD=d;camUp();return}
 if(drag){const p=P.get(drag.id),g=ground(e);if(!p||!g)return;const x=Math.round(g.x-drag.ox),z=Math.round(g.z-drag.oz);if(x!==p.x||z!==p.z){p.x=x;p.z=z;p.y=baseY(p);M.get(p.id).position.set(p.x,p.y*.4,p.z);send({t:'upd',p})}}
 else if(orb){th-=dx*.008;ph=Math.max(.15,Math.min(1.5,ph-dy*.008));camUp()}});
const up=e=>{if(!pts.delete(e.pointerId))return;if(!pts.size){if(orb&&moved<6&&!drag)select(null);drag=null;orb=false}};
addEventListener('pointerup',up);addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(6,Math.min(80,dist*(1+e.deltaY*.001)));camUp()},{passive:false});
addEventListener('keydown',e=>{if(!sel||/INPUT/.test(e.target.tagName))return;if(e.key.toLowerCase()==='r')rotate(sel);if(e.key==='Delete'||e.key==='Backspace')remove(sel)});
$$('#ring button').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const a=b.dataset.a;
 if(a==='mov'){pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;startDrag(sel,e)}
 else if(a==='rot')rotate(sel);else if(a==='del')remove(sel);else if(a==='tex')$('#tex').style.display=$('#tex').style.display==='block'?'none':'block'})});
// ---------- context menu (desktop) ----------
const ctx=$('#ctx');function hideCtx(){ctx.style.display='none'}
cv.addEventListener('contextmenu',e=>{e.preventDefault();const id=pick(e),g=ground(e);if(id)select(id);ctx.innerHTML='';
 const add=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{hideCtx();f()};ctx.appendChild(b)};
 if(id){add('หมุน (R)',()=>rotate(id));add('สี / รูปภาพ',()=>$('#tex').style.display='block');add('ลบ',()=>remove(id));}
 DEFS.forEach(d=>add('＋ '+d[0],()=>spawn(d,g)));
 ctx.style.display='block';ctx.style.left=Math.min(e.clientX,innerWidth-170)+'px';ctx.style.top=Math.min(e.clientY,innerHeight-ctx.offsetHeight-10)+'px'});
// ---------- panel ----------
const mob=()=>matchMedia('(max-width:700px)').matches;
const icon=(w,d)=>{const s=Math.min(60/w,36/d,12);return `<svg width="${w*s+4}" height="${d*s+4}"><rect x="2" y="2" width="${w*s}" height="${d*s}" rx="3" fill="${curC}"/>${Array.from({length:w*d},(_,i)=>`<circle cx="${2+(i%w+.5)*s}" cy="${2+(Math.floor(i/w)+.5)*s}" r="${s*.3}" fill="#fff5"/>`).join('')}</svg>`};
function drawPanel(){$('#pcol').innerHTML=COLORS.map(c=>`<button class="c${c===curC?' on':''}" style="background:${c}" data-c="${c}"></button>`).join('');
 $$('#pcol .c').forEach(b=>b.onclick=()=>{curC=b.dataset.c;drawPanel()});
 $('#plist').innerHTML='';DEFS.forEach(d=>{const b=document.createElement('button');b.className='pc';b.innerHTML=icon(d[1],d[2])+d[0];b.onclick=()=>{spawn(d);if(mob())togglePanel(false)};$('#plist').appendChild(b)})}
function togglePanel(v){const o=$('#panel');o.classList.toggle('open',v===undefined?!o.classList.contains('open'):v);if(o.classList.contains('open'))drawPanel()}
$('#cap').onclick=()=>togglePanel();$('#pclose').onclick=()=>togglePanel(false);
// ---------- texture ----------
$('#sw').innerHTML=COLORS.map(c=>`<button class="c" style="background:${c}" data-c="${c}"></button>`).join('');
const setTex=f=>{const p=P.get(sel);if(p){f(p);commit(p)}};
$$('#sw .c').forEach(b=>b.onclick=()=>setTex(p=>{p.c=b.dataset.c;p.tex=null}));
$('#colIn').oninput=e=>setTex(p=>{p.c=e.target.value;p.tex=null});
$('#clrImg').onclick=()=>setTex(p=>p.tex=null);$('#texX').onclick=()=>$('#tex').style.display='none';
$('#imgIn').onchange=e=>{const f=e.target.files[0];if(!f)return;const i=new Image;i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(i,0,0,256,256);setTex(p=>p.tex=c.toDataURL('image/jpeg',.8))};i.src=URL.createObjectURL(f);e.target.value=''};
// ---------- save / load ----------
function toast(t){const o=$('#toast');o.textContent=t;o.style.display='block';clearTimeout(o._t);o._t=setTimeout(()=>o.style.display='none',2400)}
$('#bSave').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({v:1,pieces:[...P.values()]})],{type:'application/json'}));a.download='voblock.json';a.click();toast('บันทึกแล้ว')};
$('#bLoad').onclick=()=>$('#fileIn').click();
function loadAll(ps){[...P.keys()].forEach(delP);ps.forEach(setP)}
$('#fileIn').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const ps=JSON.parse(t).pieces;loadAll(ps);send({t:'full',ps});toast('โหลดแล้ว')}catch{toast('ไฟล์ไม่ถูกต้อง')}});e.target.value=''};
// ---------- multiplayer (PeerJS, host relays) ----------
let peer=null,conns=[],isHost=false;
function send(m,except){conns.forEach(c=>c!==except&&c.open&&c.send(m))}
function recv(m,from){if(m.t==='full')loadAll(m.ps);else if(m.t==='del')delP(m.id);else if(m.p)setP(m.p);if(isHost)send(m,from)}
function count(){$('#cnt').textContent=conns.length||isHost?`(${conns.length+1})`:''}
function wire(c){conns.push(c);c.on('open',()=>{if(isHost)c.send({t:'full',ps:[...P.values()]});count()});c.on('data',m=>recv(m,c));c.on('close',()=>{conns=conns.filter(x=>x!==c);count()})}
function host(){isHost=true;const code=rid().slice(0,5);peer=new Peer('brick-'+code);
 peer.on('open',()=>{const link=location.origin+location.pathname+'?room='+code;count();navigator.clipboard?.writeText(link).catch(()=>{});toast('คัดลอกลิงก์ห้องแล้ว ส่งให้เพื่อนได้เลย');if(navigator.share)navigator.share({title:'VOBLOCK',url:link}).catch(()=>{})});
 peer.on('connection',wire);peer.on('error',e=>{if(e.type==='unavailable-id'){peer=null;host()}else toast('เชื่อมต่อไม่ได้: '+e.type)})}
function join(code){peer=new Peer();peer.on('open',()=>{wire(peer.connect('brick-'+code,{reliable:true}));toast('กำลังเข้าห้อง '+code)});peer.on('error',e=>toast('เข้าห้องไม่ได้: '+e.type))}
$('#bInv').onclick=()=>{if(!peer)host();else if(isHost){const l=location.origin+location.pathname+'?room='+peer.id.slice(6);navigator.clipboard?.writeText(l);toast('คัดลอกลิงก์แล้ว')}};
const rm=new URLSearchParams(location.search).get('room');if(rm)join(rm);
$("#bName").onclick=()=>$("#credit").classList.add("open");$("#crX").onclick=()=>$("#credit").classList.remove("open");
// ---------- loop ----------
(function loop(){requestAnimationFrame(loop);if(sel)ringUp();R.render(S,cam)})();
if(!P.size&&!rm){spawn(DEFS[6],{x:4,z:4});spawn(DEFS[4],{x:4,z:4});select(null)}
