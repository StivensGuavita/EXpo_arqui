/* Torre 3D construida pieza por pieza con three.js (sin modelos externos).
   Unidades: centímetros. Frente de la torre = +X, vidrio lateral = +Z, placa madre pegada a -Z.
   El canvas cubre todo el escenario y se recorta a la zona de la torre, así que las animaciones
   del diseño nunca cambian el tamaño del canvas (eso causaba los cortes).
   API publica: window.Tower3D */
(function(){
'use strict';
var T=window.THREE;
var API=window.Tower3D={ok:false};
if(!T){return}

/* ---------- utilidades ---------- */
var v3=function(x,y,z){return new T.Vector3(x,y,z)};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function cssVar(n,f){try{var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||f}catch(e){return f}}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function smooth(k){k=Math.max(0,Math.min(1,k));return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2}
function tex(w,h,draw){var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d');draw(g,w,h);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=8;return t}
function txt(g,s,x,y,font,color,align){g.font=font;g.fillStyle=color;g.textAlign=align||'left';g.textBaseline='middle';g.fillText(s,x,y)}

function rrShape(w,h,r){var s=new T.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
var gc={};
function box(w,h,d){var k='b'+[w,h,d];return gc[k]||(gc[k]=new T.BoxGeometry(w,h,d))}
function bb(w,h,d,r){            // caja con bordes biselados (atrapan reflejos como el metal real)
  r=Math.min(r||.16,w*.3,h*.3,d*.3);var k='bb'+[w,h,d,r];
  if(!gc[k]){var s=new T.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-b);s.lineTo(a,-b);s.lineTo(a,b);s.lineTo(-a,b);s.closePath();
    var dep=Math.max(.002,d-2*r),g=new T.ExtrudeGeometry(s,{depth:dep,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelOffset:0,bevelSegments:2,curveSegments:1});
    g.translate(0,0,-dep/2);gc[k]=g}
  return gc[k]}
function rbox(w,h,d,r){var k='r'+[w,h,d,r];if(!gc[k]){var g=new T.ExtrudeGeometry(rrShape(w,h,r),{depth:d,bevelEnabled:false,curveSegments:5});g.translate(0,0,-d/2);gc[k]=g}return gc[k]}
function cyl(rt,rb,h,s){var k='c'+[rt,rb,h,s];return gc[k]||(gc[k]=new T.CylinderGeometry(rt,rb,h,s||28))}
function mesh(g,m,x,y,z){var o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);return o}

/* materiales por pieza (para poder atenuarlos) */
var LBL=null;
function nocache(t){t.flipY=false;return t}
function labelTexture(mname){
  if(!LBL)return null;
  var m=/^(gpu_edge|ihs_top|chipset|ram|nvme|psu)_([0-9])/.exec(mname||'');if(!m)return null;
  var k=m[1],pid={ihs_top:'cpu',chipset:'placa',ram:'ram',nvme:'almacenamiento',gpu_edge:'gpu',psu:'fuente'}[k],t=(tiers&&tiers[pid]!==undefined)?tiers[pid]:+m[2],L;
  if(k==='ihs_top'){L=LBL.cpu&&LBL.cpu[t];if(!L)return null;
    return nocache(tex(256,256,function(c,w,h){for(var i=0;i<256;i++){var v=Math.round(225-40*Math.abs(i-128)/128);c.fillStyle='rgb('+v+','+(v+4)+','+(v+8)+')';c.fillRect(0,i,256,1)}
      txt(c,'AMD',128,64,'bold 38px Arial','#4a5760','center');txt(c,L[0],128,128,'bold 30px Arial','#3a464f','center');txt(c,L[1],128,172,'bold 34px Arial','#3a464f','center');txt(c,L[2]||'AM5',128,214,'24px Arial','#5a6872','center');
      c.fillStyle='#c79a2b';c.beginPath();c.moveTo(10,10);c.lineTo(46,10);c.lineTo(10,46);c.fill()}))}
  if(k==='chipset'){L=LBL.chipset&&LBL.chipset[t];if(!L)return null;
    return nocache(tex(128,128,function(c,w,h){c.fillStyle='#0d1317';c.fillRect(0,0,w,h);txt(c,L,64,64,'bold 34px Arial','#dfe7ec','center')}))}
  if(k==='ram'){L=LBL.ram&&LBL.ram[t];if(!L)return null;
    return nocache(tex(512,128,function(c,w,h){c.fillStyle=t===1?'#1b2227':'#0d1215';c.fillRect(0,0,w,h);txt(c,L,256,64,'bold 46px Arial','#e6edf1','center')}))}
  if(k==='nvme'){L=LBL.nvme&&LBL.nvme[t];if(!L)return null;
    return nocache(tex(512,128,function(c,w,h){c.fillStyle=t===1?'#222a30':'#0e1317';c.fillRect(0,0,w,h);txt(c,L,256,64,'bold 38px Arial','#e6edf1','center')}))}
  if(k==='gpu_edge'){L=LBL.gpu&&LBL.gpu[t];if(!L)return null;
    return nocache(tex(1024,128,function(c,w,h){for(var x=0;x<w;x++){var v=Math.round(14+14*x/w);c.fillStyle='rgb('+v+','+(v+6)+','+(v+9)+')';c.fillRect(x,0,1,h)}
      c.fillStyle=t===2?'#d9480f':'#3ddcc4';c.fillRect(0,h-14,w,6);
      txt(c,(L[2]||'GEFORCE RTX ')+L[0],32,52,'bold 52px Arial','#e8eef2','left');txt(c,L[1],w-32,52,'bold 40px Arial','#8fa1ad','right')}))}
  if(k==='psu'){L=LBL.psu&&LBL.psu[t];if(!L)return null;
    var c1=L[2]||'#c9a54a',c2=L[3]||'#e2c066';
    return nocache(tex(1024,512,function(c,w,h){c.fillStyle='#0e1519';c.fillRect(0,0,w,h);c.fillStyle=c1;c.fillRect(0,0,w,16);
      txt(c,L[0]+' W',60,170,'bold 150px Arial','#eef2f4','left');txt(c,L[1],64,300,'bold 54px Arial',c2,'left');txt(c,'ATX · Modular · Ventilador de 135 mm',64,380,'40px Arial','#8fa1ad','left');
      c.strokeStyle='#26323a';c.lineWidth=3;for(var q=0;q<5;q++){var rr=60+q*30;c.beginPath();c.arc(830,256,rr,0,6.2832);c.stroke()}}))}
  return null}
var curMats=[],curSpin=[];
function M(o){o.envMapIntensity=o.envMapIntensity||1;var m=new T.MeshStandardMaterial(o);curMats.push(m);return m}
function MP(o){var m=new T.MeshPhysicalMaterial(o);curMats.push(m);return m}
function LED(c,i){return M({color:0x050505,emissive:c,emissiveIntensity:i||1.6,roughness:.4})}

var ACC=0xd9480f,REC=0x0b7f73;

/* ---------- texturas ---------- */
var _pcb=null,_mesh=null,_brush=null,_glow=null;
function pcbTex(){
  if(_pcb)return _pcb;
  _pcb=tex(1024,1220,function(g,w,h){
    g.fillStyle='#0a0e12';g.fillRect(0,0,w,h);g.lineWidth=2;
    var r=rng(7);
    for(var i=0;i<160;i++){
      var x=r()*w,y=r()*h;g.strokeStyle=i%5?'#131c23':'#1c2d37';g.beginPath();g.moveTo(x,y);
      var n=2+Math.floor(r()*3);
      for(var k=0;k<n;k++){if(r()<.5)x+=(r()-.5)*260;else y+=(r()-.5)*260;g.lineTo(x,y)}
      g.stroke();g.fillStyle='#8a6b2f';g.beginPath();g.arc(x,y,2.4,0,7);g.fill();
    }
    g.font='500 14px Inter,Arial';g.fillStyle='rgba(220,220,220,.4)';
    for(var q=0;q<26;q++){g.fillText('C'+(100+q*7),r()*w,r()*h)}
  });return _pcb}
function meshTex(){
  if(_mesh)return _mesh;
  _mesh=tex(512,1024,function(g,w,h){g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#000';
    for(var y=8;y<h;y+=16)for(var x=((y/16)%2?8:0)+8;x<w;x+=16){g.beginPath();g.arc(x,y,4.6,0,7);g.fill()}});
  _mesh.encoding=T.LinearEncoding;_mesh.wrapS=_mesh.wrapT=T.RepeatWrapping;return _mesh}
function brushTex(){          // acabado cepillado del aluminio anodizado
  if(_brush)return _brush;
  _brush=tex(512,512,function(g,w,h){g.fillStyle='#808080';g.fillRect(0,0,w,h);var r=rng(3);
    for(var i=0;i<2600;i++){var y=r()*h,l=60+r()*300,x=r()*w,c=Math.floor(110+r()*50);g.strokeStyle='rgba('+c+','+c+','+c+',.35)';g.lineWidth=.6+r()*.8;
      g.beginPath();g.moveTo(x,y);g.lineTo(x+l,y+(r()-.5)*1.2);g.stroke()}});
  _brush.encoding=T.LinearEncoding;_brush.wrapS=_brush.wrapT=T.RepeatWrapping;return _brush}
function glowTex(){
  if(_glow)return _glow;
  _glow=tex(128,128,function(g,w,h){var gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(.6,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(0,0,w,h)});
  return _glow}
function glow(color,size,op){      // halo de luz aditivo alrededor de los LED
  var m=new T.SpriteMaterial({map:glowTex(),color:color,transparent:true,opacity:op||.5,blending:T.AdditiveBlending,depthWrite:false});
  curMats.push(m);var s=new T.Sprite(m);s.scale.set(size,size,1);return s}
function alu(color,rough){return M({color:color,metalness:.85,roughness:rough||.34,bumpMap:brushTex(),bumpScale:.35,envMapIntensity:1.2})}

/* ---------- ventilador (eje local +Z) ---------- */
function fan(size,led,speed,tag){
  var g=new T.Group(),s=size;
  var sh=rrShape(s,s,s*.09),hole=new T.Path();hole.absarc(0,0,s*.455,0,Math.PI*2,true);sh.holes.push(hole);
  var fg=new T.ExtrudeGeometry(sh,{depth:2.5,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:1,curveSegments:28});fg.translate(0,0,-1.25);
  g.add(new T.Mesh(fg,M({color:0x0c0f12,roughness:.45,metalness:.35})));
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){var sc=mesh(cyl(.28,.28,.2,12),M({color:0x2b3238,metalness:.9,roughness:.4}),q[0]*s*.43,q[1]*s*.43,1.28);sc.rotation.x=Math.PI/2;g.add(sc)});
  if(led){var ring=new T.Mesh(new T.TorusGeometry(s*.43,s*.012,8,48),LED(led,2.4));ring.position.z=1.15;g.add(ring);
    var gl=glow(led,s*1.15,.42);gl.position.z=1.6;g.add(gl)}
  var bl=new T.Group(),n=9,bs=new T.Shape();
  bs.moveTo(s*.07,-s*.012);bs.bezierCurveTo(s*.2,-s*.07,s*.38,-s*.05,s*.435,s*.05);bs.bezierCurveTo(s*.34,s*.12,s*.2,s*.11,s*.07,s*.025);bs.closePath();
  var bg=new T.ExtrudeGeometry(bs,{depth:.12,bevelEnabled:false}),bm=M({color:0x1b2328,roughness:.35,metalness:.2,side:T.DoubleSide});
  for(var i=0;i<n;i++){var b=new T.Mesh(bg,bm);b.rotation.x=.5;var pv=new T.Group();pv.rotation.z=i*2*Math.PI/n;pv.add(b);bl.add(pv)}
  var hub=new T.Mesh(cyl(s*.1,s*.1,1.4,28),M({color:0x11181d,roughness:.4,metalness:.5}));hub.rotation.x=Math.PI/2;bl.add(hub);
  var cap=new T.Mesh(cyl(s*.045,s*.045,.1,20),LED(led||0x9fb3c0,1.2));cap.rotation.x=Math.PI/2;cap.position.z=.76;bl.add(cap);
  g.add(bl);curSpin.push({o:bl,s:speed||7,tag:tag});
  return g}
function fanX(size,led,speed,x,y,z,dir){var f=fan(size,led,speed);f.rotation.y=(dir||1)*Math.PI/2;f.position.set(x,y,z);return f}
function fins(w,h,z0,z1,n,mat){      // paquete de aletas (una lámina por aleta)
  var geo=box(w,h,.13),im=new T.InstancedMesh(geo,mat,n),m=new T.Matrix4();
  for(var i=0;i<n;i++){m.makeTranslation(0,0,z0+(z1-z0)*i/(n-1));im.setMatrixAt(i,m)}
  im.instanceMatrix.needsUpdate=true;return im}

/* ---------- caja ---------- */
var caseGroup,caseMats=[],glassPivot,glassMesh,glassMat,glassFrame;
function buildCase(){
  curMats=caseMats;curSpin=[];
  var g=new T.Group(),metal=M({color:0x0c0f12,roughness:.42,metalness:.8,bumpMap:brushTex(),bumpScale:.25,envMapIntensity:1.1}),dk=M({color:0x06080a,roughness:.78,metalness:.25});
  var add=function(geo,mat,x,y,z){var o=mesh(geo,mat,x,y,z);g.add(o);return o};
  if(glb){g.add(cloneGLB('case'))}else{
  add(bb(47.4,.7,21.4,.25),metal,0,-24.35,0);
  add(bb(47.4,.7,21.4,.25),metal,0,24.35,0);
  add(box(47.4,49.4,.7),dk,0,0,-10.35);
  add(bb(.7,49.4,21.4,.2),metal,-23.35,0,0);
  add(bb(.7,.8,21.4,.2),metal,23.35,24.2,0);add(bb(.7,.8,21.4,.2),metal,23.35,-24.1,0);
  add(bb(.7,49.4,.8,.2),metal,23.35,0,10.2);add(bb(.7,49.4,.8,.2),metal,23.35,0,-10.2);
  add(bb(.8,49.4,.8,.2),metal,-23.2,0,10.3);add(bb(.8,49.4,.8,.2),metal,23.2,0,10.3);
  add(bb(47.4,.8,.8,.2),metal,0,24.1,10.3);add(bb(47.4,.8,.8,.2),metal,0,-24.1,10.3);
  add(bb(46.4,.5,20.6,.15),M({color:0x0a0d10,roughness:.45,metalness:.7,bumpMap:brushTex(),bumpScale:.25}),0,-12.55,0);
  var sm=M({color:0x0a0d10,roughness:.45,metalness:.75,bumpMap:brushTex(),bumpScale:.25});
  add(bb(1.5,11.5,.5,.12),sm,-22.25,-18.2,9.75);add(bb(30,11.5,.5,.12),sm,8,-18.2,9.75);
  add(bb(15,2,.5,.12),sm,-14,-13.5,9.75);add(bb(15,1.5,.5,.12),sm,-14,-23.25,9.75);
  add(box(46.4,.15,.15),LED(ACC,1.6),0,-12.2,9.95);
  for(var v=0;v<9;v++)add(box(1.3,.06,15),M({color:0x020304,roughness:.9}),-17+v*2.6,24.72,0);
  add(bb(9,.5,3.2,.1),M({color:0x14181b,roughness:.4,metalness:.7}),16,24.8,5);
  [-2.6,0,2.6].forEach(function(dx,i){add(box(1.1,.2,.5),M({color:i?0x0e5fb0:0x020304,roughness:.5}),14.5+dx*1.4,24.97,5)});
  var pb=mesh(cyl(.9,.9,.5,24),M({color:0x20292f,roughness:.35,metalness:.8}),-14,24.7,6);g.add(pb);
  var pl=mesh(new T.TorusGeometry(.8,.08,8,28),LED(0x35e0c8,2),-14,24.97,6);pl.rotation.x=Math.PI/2;g.add(pl);
  [[-18,-7],[18,-7],[-18,7],[18,7]].forEach(function(p){g.add(mesh(cyl(1.4,1.6,1.1,20),M({color:0x07090b,roughness:.95}),p[0],-25.2,p[1]))});
  }
  var fm=M({color:0x0b0e11,roughness:.5,metalness:.6,alphaMap:meshTex(),transparent:true,side:T.DoubleSide,alphaTest:.5});
  fm.alphaMap.repeat.set(1,2);
  var fr=new T.Mesh(new T.PlaneGeometry(21,49.4),fm);fr.rotation.y=Math.PI/2;fr.position.x=23.35;g.add(fr);
  glassPivot=new T.Group();glassPivot.position.set(-23.4,0,10.55);
  glassMat=MP({color:0x020406,roughness:.02,metalness:0,transparent:true,opacity:.2,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.1,depthWrite:false});
  glassMesh=new T.Mesh(box(46.8,49,.35),glassMat);glassMesh.position.x=23.4;glassPivot.add(glassMesh);
  var frm=M({color:0x070b0d,roughness:.4,metalness:.5});glassFrame=frm;
  glassPivot.add(mesh(box(46.8,.7,.5),frm,23.4,24.4,0));glassPivot.add(mesh(box(46.8,.7,.5),frm,23.4,-24.4,0));
  glassPivot.add(mesh(box(.7,49,.5),frm,.3,0,0));glassPivot.add(mesh(box(.7,49,.5),frm,46.5,0,0));
  [[2,23.6],[44.8,23.6],[2,-23.6],[44.8,-23.6]].forEach(function(p){var sc=mesh(cyl(.9,.9,.5,20),M({color:0x1a2025,metalness:.9,roughness:.3}),p[0],p[1],.4);sc.rotation.x=Math.PI/2;glassPivot.add(sc)});
  g.add(glassPivot);
  caseGroup=g;return g}

/* ---------- piezas ---------- */
var B={};
var glb=null,ready=false,pendingLabels={};
/* ---- modelo de Blender (GLB) ---- */
function cloneGLB(name){
  var src=glb.getObjectByName(name);if(!src){if(window.console)console.warn('Falta en el GLB:',name);return new T.Group()}
  var c=src.clone(true),map={},glows=[];
  if(LBL&&LBL.noSata&&/^almacenamiento/.test(name)){var rm=[];c.traverse(function(o){if(/^hdd/.test(o.name))rm.push(o)});rm.forEach(function(o){if(o.parent)o.parent.remove(o)})}
  c.traverse(function(o){
    if(o.isMesh){
      var cl=function(m){if(!map[m.uuid]){var n=m.clone();n.envMapIntensity=1.1;
        var lt=labelTexture(m.name);if(lt){n.map=lt;if(n.emissiveMap)n.emissiveMap=lt}
        if(n.emissive&&(n.emissive.r+n.emissive.g+n.emissive.b)>0&&!n.emissiveMap){n.emissiveIntensity=Math.max(n.emissiveIntensity,2.4)}
        if(n.metalness>.6&&!n.emissiveMap&&!n.map&&o.geometry.attributes.uv){n.bumpMap=brushTex();n.bumpScale=.25}
        curMats.push(n);map[m.uuid]=n}return map[m.uuid]};
      o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material);
      o.castShadow=true;o.receiveShadow=true;
    }
    var u=o.userData||{};
    if(u.spin){curSpin.push({o:o,s:u.speed||6,axis:new T.Vector3(u.spin[0],u.spin[1],u.spin[2]).normalize(),tag:u.tag})}
    if(u.glow)glows.push(o);
  });
  glows.forEach(function(n){var u=n.userData.glow,sp=glow(u[0],u[1]*.55,u[2]*.5);sp.position.copy(n.position);(n.parent||c).add(sp)});
  return c}
function useGLB(){
  ['cpu','gpu','ram','almacenamiento','placa','refrigeracion'].forEach(function(id){
    B[id]=function(t){var c=cloneGLB(id+'_t'+t);
      c.traverse(function(o){if(!c.userData.focusObj&&o.parent===c&&/^cooler(\d+)?$/.test(o.name))c.userData.focusObj=o});return c}});
  var oldPsu=B.fuente;
  B.fuente=function(t){var g=oldPsu(t),old=g.children[0];g.remove(old);g.children.length&&0;g.add(cloneGLB('fuente_t'+t));return g};
}
function heatsink(w,h,d,color,ribs){
  var g=new T.Group(),m=alu(color,.36);
  g.add(mesh(bb(w,h,d,.22),m,0,0,0));
  for(var i=0;i<ribs;i++)g.add(mesh(bb(w*.9,h/(ribs*2.4),.4,.1),m,0,-h/2+(i+.6)*h/ribs,d/2+.12));
  return g}
var BOARD={x0:-20.5,y0:-12,bw:24.4,z:-9.2,sx:-9.5,sy:6.5};
var BOARD_NAME=['A620','B650','X870E'];
var GL=[24,26.5,33],GT=[3.8,4.5,6.4],GH=[11.5,12.4,14.4];

B.placa=function(t){
  var g=new T.Group(),atx=t>0,bh=atx?30.5:24.4,bw=BOARD.bw,bx=BOARD.x0+bw/2,by=BOARD.y0+bh/2,top=BOARD.y0+bh;
  g.add(mesh(box(bw,bh,.18),M({color:[0xb9c3ca,0xdfe6ea,0xffffff][t],map:pcbTex(),roughness:.4,metalness:.3,envMapIntensity:.8}),bx,by,BOARD.z));
  var zb=BOARD.z+.09,sm=M({color:0x070a0c,roughness:.55}),silver=M({color:0xc4ccd2,metalness:.95,roughness:.28}),gold=M({color:0xb99a3a,metalness:1,roughness:.3});
  g.add(mesh(bb(5.7,5.7,.6,.1),M({color:0xb7c2ca,metalness:.9,roughness:.3}),BOARD.sx,BOARD.sy,zb+.3));
  g.add(mesh(box(4.4,4.4,.2),sm,BOARD.sx,BOARD.sy,zb+.45));
  if(t>0){
    var hc=t==2?0x23282c:0x191d21;
    var l=heatsink(4.2,11,2.4,hc,5);l.position.set(-16,BOARD.sy,zb+1.2);g.add(l);
    var tp=heatsink(13,atx?3.6:3.2,2.4,hc,3);tp.position.set(-9.5,atx?top-2.2:top-1.9,zb+1.2);g.add(tp);
    if(t==2){var bar=mesh(box(12,.2,.2),LED(ACC,2),-9.5,top-.9,zb+2.5);g.add(bar);var gl=glow(ACC,9,.3);gl.position.set(-9.5,top-.9,zb+3);g.add(gl)}
  }else{
    for(var i=0;i<5;i++)g.add(mesh(box(2,1.2,.9),sm,-16+(i%2)*1.5,BOARD.sy-5+i*2.3,zb+.45));
    for(var j=0;j<4;j++)g.add(mesh(box(1.2,2,.9),sm,-13+j*2.2,top-1.5,zb+.45));
  }
  for(var c=0;c<6;c++){var cp=mesh(cyl(.42,.42,.95,14),M({color:0x101417,roughness:.5,metalness:.4}),-13.2,BOARD.sy-7+c*2.6,zb+.5);cp.rotation.x=Math.PI/2;g.add(cp);
    var ct=mesh(cyl(.3,.3,.06,14),gold,-13.2,BOARD.sy-7+c*2.6,zb+1);ct.rotation.x=Math.PI/2;g.add(ct)}
  for(var h=0;h<6;h++)g.add(mesh(bb(1.2,1.1,1,.12),M({color:0x7e8a92,metalness:.9,roughness:.4}),-6.4+h*1.15,top-(atx?5.2:3.8),zb+.5));
  for(var r=0;r<4;r++)g.add(mesh(bb(.7,13.8,.8,.1),M({color:r%2?0x0c1115:0x161e24,roughness:.7}),-2.1+r*1.05,BOARD.sy,zb+.4));
  g.add(mesh(bb(9,1.1,1.1,.12),sm,-15.1,-3.5,zb+.55));
  g.add(mesh(bb(3.1,.9,.9,.1),sm,-19,-8.3,zb+.45));
  if(t>0)g.add(mesh(box(9,.45,.2),M({color:0xc8d0d6,metalness:.9,roughness:.2}),-15.1,-3.5,zb+1.15));
  var cs=heatsink(t==0?3.2:5,t==0?3.2:5,1.2,t==2?0x23282c:0x191d21,3);cs.position.set(-5,-9,zb+.6);g.add(cs);
  var ct2=tex(128,128,function(c,w,h){c.fillStyle='#0d1317';c.fillRect(0,0,w,h);txt(c,BOARD_NAME[t],w/2,h/2,'700 34px Inter,Arial','#dfe7ec','center')});
  var cpl=new T.Mesh(new T.PlaneGeometry(t==0?2.6:4.2,t==0?2.6:4.2),M({map:ct2,roughness:.6}));cpl.position.set(-5,-9,zb+1.23);g.add(cpl);
  for(var s2=0;s2<4;s2++)g.add(mesh(bb(2.6,.8,1.1,.1),sm,2.2,-5-s2*1.15,zb+.55));
  var bat=mesh(cyl(1.1,1.1,.5,24),silver,-3.5,-5.6,zb+.4);bat.rotation.x=Math.PI/2;g.add(bat);
  g.add(mesh(bb(1.4,5.6,1.6,.12),M({color:0xe5e9ec,roughness:.65}),3.1,top-8,zb+.8));
  g.add(mesh(bb(3,1.7,1.4,.12),M({color:0xe5e9ec,roughness:.65}),-18,top-.9,zb+.7));
  for(var f=0;f<4;f++)g.add(mesh(box(1.4,.7,.6),sm,-1+f*1.6,-11.1,zb+.3));
  [[-19.2,top-1.2],[2.6,top-1.2],[-19.2,BOARD.y0+1.2],[2.6,BOARD.y0+1.2],[-19.2,BOARD.sy],[2.6,BOARD.sy-3],[-8,BOARD.y0+1.2],[-8,atx?top-9:top-6]].forEach(function(p){
    var sc=mesh(cyl(.36,.36,.25,14),silver,p[0],p[1],zb+.12);sc.rotation.x=Math.PI/2;g.add(sc)});
  var io=mesh(bb(2.8,10.4,7.4,.2),alu(0x424c53,.4),-21.9,top-6.4,BOARD.z+3.8);g.add(io);
  for(var a=0;a<6;a++)for(var b=0;b<3;b++)g.add(mesh(box(.15,1.3,1.5),sm,-23.32,top-10+a*1.55,BOARD.z+1+b*2.1));
  if(t==2)g.add(mesh(box(3,10.6,.25),LED(ACC,1.6),-21.9,top-6.4,BOARD.z+7.6));
  g.userData.top=top;return g};

B.cpu=function(t){
  var g=new T.Group(),z=-8.12,nm=['RYZEN 5','RYZEN 7','RYZEN 9'][t],mod=['9600X','9700X','9950X'][t];
  g.add(mesh(box(4.6,4.6,.2),M({color:0x1c4a3d,roughness:.55}),BOARD.sx,BOARD.sy,-8.4));
  var top=tex(256,256,function(c,w,h){
    var gr=c.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#e1e6ea');gr.addColorStop(.5,'#b8c2ca');gr.addColorStop(1,'#d4dade');
    c.fillStyle=gr;c.fillRect(0,0,w,h);
    txt(c,'AMD',w/2,64,'700 38px Inter,Arial','#4a5760','center');txt(c,nm,w/2,128,'700 30px Inter,Arial','#3a464f','center');
    txt(c,mod,w/2,172,'700 34px Inter,Arial','#3a464f','center');txt(c,'AM5',w/2,214,'500 24px Inter,Arial','#5a6872','center');
    c.fillStyle='#c79a2b';c.beginPath();c.moveTo(10,10);c.lineTo(46,10);c.lineTo(10,46);c.fill()});
  var side=M({color:0xaab5be,metalness:.95,roughness:.25}),tp=M({map:top,metalness:.9,roughness:.28});
  var ih=new T.Mesh(box(4,4,.36),[side,side,side,side,tp,side]);ih.position.set(BOARD.sx,BOARD.sy,z);g.add(ih);
  return g};

B.ram=function(t){
  var g=new T.Group(),h=[3.1,3.3,4.7][t],lab=['16 GB','32 GB','64 GB'][t],sp=['5600','6000','6000'][t];
  [-1.05,1.05].forEach(function(dx){
    var x=dx,z=-8.9+h/2;
    g.add(mesh(box(.18,13.3,h),M({color:0x1d2a22,roughness:.45}),x,BOARD.sy,z));
    g.add(mesh(box(.2,12.4,.4),M({color:0xc2a23c,metalness:1,roughness:.3}),x,BOARD.sy,-8.75));
    if(t==0){for(var c=0;c<4;c++)g.add(mesh(box(.12,2,1.6),M({color:0x0a0d0f,roughness:.4}),x+.12,BOARD.sy-4.5+c*3,z+.2))}
    else{
      var label=tex(512,128,function(c,w,hh){c.fillStyle=t==2?'#0d1215':'#1b2227';c.fillRect(0,0,w,hh);
        txt(c,lab+' DDR5-'+sp,w/2,64,'700 46px Inter,Arial','#e6edf1','center')});
      var side=alu(t==2?0x0c1013:0x1a1f23,.36);
      var lm=M({map:label,roughness:.45,metalness:.4});
      var sp2=new T.Mesh(bb(.55,13.1,h-.2,.12),side);sp2.position.set(x,BOARD.sy,z-.05);g.add(sp2);
      var plate=new T.Mesh(new T.PlaneGeometry(8.6,2.2),lm);plate.rotation.y=Math.PI/2;plate.rotation.z=Math.PI/2;plate.position.set(x+.29,BOARD.sy,z-.3);g.add(plate);
      var col=t==2?ACC:0xcfe8ff;
      g.add(mesh(box(.5,12.2,.28),LED(col,2.2),x,BOARD.sy,-8.9+h-.1));
      var gl=glow(col,6,.35);gl.position.set(x,BOARD.sy,-8.9+h+.8);g.add(gl);
    }
  });return g};

B.gpu=function(t){
  var g=new T.Group(),L=GL[t],TH=GT[t],H=GH[t],nf=[2,2,3][t];
  var x0=-20.2,cx=x0+L/2,cy=-3.5,z0=-8.65,cz=z0+H/2;
  var body=M({color:[0x14181b,0x111518,0x1a1f23][t],metalness:.65,roughness:.36,bumpMap:brushTex(),bumpScale:.2,envMapIntensity:1.2});
  var sh=new T.Mesh(rbox(L,H,TH,.9),body);sh.rotation.x=Math.PI/2;sh.position.set(cx,cy,cz);g.add(sh);
  var fs=Math.min(L/nf*.92,H*.9);
  for(var i=0;i<nf;i++){
    var f=fan(fs,t==2?ACC:null,9,'gpu');f.rotation.x=Math.PI/2;f.position.set(x0+L/nf*(i+.5)+.2,cy-TH/2+.4,cz);
    g.add(f);
  }
  g.add(mesh(bb(L-.4,.25,H-.4,.1),alu(t==2?0x9aa5ad:0x22282d,.32),cx,cy+TH/2+.05,cz));
  g.add(mesh(box(.35,TH+1.1,H+.6),alu(0xaab5be,.35),x0-.15,cy,cz));
  for(var s=0;s<4;s++)g.add(mesh(box(.1,.5,H*.7),M({color:0x090d10}),x0-.34,cy-TH/2+.8+s*.9,cz));
  var sc1=mesh(cyl(.35,.35,.3,14),M({color:0xaab5be,metalness:.95,roughness:.3}),x0-.3,cy+TH/2+.7,cz+H*.32);sc1.rotation.z=Math.PI/2;g.add(sc1);
  var edge=tex(1024,128,function(c,w,h){
    var gr=c.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#0e1317');gr.addColorStop(1,'#1a2228');c.fillStyle=gr;c.fillRect(0,0,w,h);
    c.fillStyle=t==2?'#d9480f':'#3ddcc4';c.fillRect(0,h-14,w,6);
    txt(c,'GEFORCE RTX '+['5060','5060 Ti','5090'][t],32,52,'700 52px Inter,Arial','#e8eef2','left');
    txt(c,['8 GB','16 GB','32 GB'][t]+' GDDR7',w-32,52,'600 40px Inter,Arial','#8fa1ad','right')});
  var ep=new T.Mesh(new T.PlaneGeometry(L-.6,TH-.5),M({map:edge,roughness:.45,metalness:.2,emissiveMap:edge,emissive:0xffffff,emissiveIntensity:.4}));
  ep.position.set(cx,cy,z0+H+.01);g.add(ep);
  var lc=t==2?ACC:0x3ddcc4,gl=glow(lc,L*.9,.28);gl.position.set(cx,cy-TH/2+.9,z0+H+1);g.add(gl);
  var px=x0+L-3.2;
  g.add(mesh(bb(2.4,.7,1.3,.1),M({color:0x0b0f12,roughness:.65}),px,cy+TH/2+.4,z0+H-1.4));
  return g};

B.almacenamiento=function(t){
  var g=new T.Group(),nx=-10.5,ny=1.5,nz=-8.55;
  g.add(mesh(box(8,2.2,.2),M({color:0x1c4a3d,roughness:.5}),nx,ny,nz));
  g.add(mesh(box(.3,2.4,.3),M({color:0xb99a3a,metalness:1,roughness:.3}),nx+4.05,ny,nz-.1));
  var mscrew=mesh(cyl(.3,.3,.4,12),M({color:0xc4ccd2,metalness:.95,roughness:.3}),nx-4.2,ny,nz+.1);mscrew.rotation.x=Math.PI/2;g.add(mscrew);
  if(t==0){
    [[-2.2,.3],[0,.3],[2.1,.3]].forEach(function(c){g.add(mesh(box(1.5,1.4,.14),M({color:0x0a0a0a,roughness:.35}),nx+c[0],ny,nz+.17))});
  }else{
    var w=t==2?10:8.4,hh=t==2?3.4:2.6,dd=t==2?1.1:.7;
    var lt=tex(512,128,function(c,ww,h){c.fillStyle=t==2?'#0e1317':'#222a30';c.fillRect(0,0,ww,h);
      txt(c,['','NVMe 1 TB · PCIe 4.0','NVMe 2 TB · PCIe 5.0'][t],ww/2,64,'700 38px Inter,Arial','#e6edf1','center')});
    var side=alu(t==2?0x0f1316:0x1c2125,.32);
    var hs=new T.Mesh(bb(w,hh,dd,.14),side);hs.position.set(nx,ny,nz+dd/2-.1);g.add(hs);
    var lp=new T.Mesh(new T.PlaneGeometry(w*.82,hh*.7),M({map:lt,metalness:.5,roughness:.4}));lp.position.set(nx,ny,nz+dd-.09);g.add(lp);
    if(t==2){g.add(mesh(box(w*.8,.18,.2),LED(ACC,2),nx,ny-hh/2+.35,nz+dd+.1))}
  }
  var cnt=[0,1,2][t];
  for(var i=0;i<cnt;i++){
    var y=-12.2+1.3+i*2.85,x=10.2,z=-2.9;
    var lab=tex(512,96,function(c,w,h){c.fillStyle='#d9dfe3';c.fillRect(0,0,w,h);txt(c,(t==2?'SSD SATA 4 TB':'SSD SATA 2 TB'),w/2,48,'700 40px Inter,Arial','#1a2228','center')});
    var top=tex(256,256,function(c,w,h){c.fillStyle='#a9b4bc';c.fillRect(0,0,w,h);c.fillStyle='#e4e9ec';c.fillRect(24,60,208,136);
      txt(c,t==2?'4 TB':'2 TB',w/2,110,'700 48px Inter,Arial','#1a2228','center');txt(c,'SATA 6 Gb/s',w/2,160,'500 24px Inter,Arial','#4a5760','center')});
    var m1=M({color:0x9ba7b0,metalness:.9,roughness:.32,bumpMap:brushTex(),bumpScale:.2});
    var d=new T.Mesh(box(14.7,2.6,10.2),[m1,m1,M({map:top,metalness:.6,roughness:.4}),m1,M({map:lab,metalness:.4,roughness:.5}),m1]);
    d.position.set(x,y,z);g.add(d);
    g.add(mesh(box(.9,.5,3),M({color:0x0a0d0f}),x-7.9,y,z-2));
    [[-6.2,-4.2],[-6.2,4.2],[6.2,-4.2],[6.2,4.2]].forEach(function(p){var sc=mesh(cyl(.28,.28,.12,10),M({color:0x2e353b,metalness:.9,roughness:.4}),x+p[0],y+1.34,z+p[1]);g.add(sc)});
  }
  return g};

B.fuente=function(t){
  var g=new T.Group(),W=['550','750','1000'][t],ws=[14,15,16][t];
  var face=tex(1024,512,function(c,w,h){
    c.fillStyle='#0e1519';c.fillRect(0,0,w,h);
    c.fillStyle=t==0?'#a2682f':t==1?'#c9a54a':'#d9dde0';c.fillRect(0,0,w,16);
    txt(c,W+' W',60,170,'700 150px Inter,Arial','#eef2f4','left');
    txt(c,['80 PLUS BRONZE','80 PLUS GOLD','80 PLUS PLATINUM'][t],64,300,'700 54px Inter,Arial',t==0?'#d28b4a':t==1?'#e2c066':'#e7ecee','left');
    txt(c,'ATX · Modular · Ventilador de 135 mm',64,380,'500 40px Inter,Arial','#8fa1ad','left');
    c.strokeStyle='#26323a';c.lineWidth=3;for(var i=0;i<5;i++){c.beginPath();c.arc(830,256,60+i*30,0,7);c.stroke()}});
  var fm=M({color:0x151d22,metalness:.7,roughness:.45});
  var p=new T.Mesh(box(ws,8.6,16),[fm,fm,fm,fm,M({map:face,roughness:.45,metalness:.3}),fm]);
  p.position.set(-22.4+ws/2,-19.1,-9.2+8);g.add(p);
  var cm=M({color:0x080b0d,roughness:.9}),cr=(t==2?.42:.36);
  function cable(pts,r){var c=new T.CatmullRomCurve3(pts.map(function(q){return v3(q[0],q[1],q[2])}));
    return new T.Mesh(new T.TubeGeometry(c,64,r||cr,10,false),cm)}
  var sx=-22.4+ws,top=BOARD.y0+(tiers.placa>0?30.5:24.4),gt=(LBL&&LBL.t3&&LBL.t3.gpu)?LBL.t3.gpu[tiers.gpu]:tiers.gpu;
  g.add(cable([[sx,-19,-4],[-2,-17,-6.5],[4.5,-14,-8.9],[4.6,-6,-9.05],[4.6,2,-9.05],[4.4,top-9,-9],[3.2,top-8,-8.2]],.62));
  if(gt>=0){var z0=-8.65,gz=z0+GH[gt],gx=-20.2+GL[gt]-3.2,gy=-3.5+GT[gt]/2+.7;
  g.add(cable([[sx,-21,2],[-1,-16,gz+1.2],[gx,-9,gz+1.2],[gx,gy+1.6,gz+.9],[gx,gy+.8,gz-1.3]],cr))}
  return g};

B.refrigeracion=function(t){
  var g=new T.Group(),cooler=new T.Group(),sx=BOARD.sx,sy=BOARD.sy;
  var fin=M({color:0xaab5bd,metalness:.9,roughness:.3,envMapIntensity:1.2}),cu=M({color:0xb8693b,metalness:.95,roughness:.22});
  var dk=M({color:0x12191e,metalness:.55,roughness:.4,bumpMap:brushTex(),bumpScale:.25});
  var led=t>=1?0xcfe8ff:null;
  g.add(fanX(12,null,5.5,-21.6,18,3,-1));
  if(t<2){
    cooler.add(mesh(bb(4.4,4.4,.5,.1),cu,sx,sy,-7.65));
    [-3.6,-1.2,1.2,3.6].forEach(function(dy){cooler.add(mesh(cyl(.3,.3,3.4,12),cu,sx,sy+dy,-5.9).rotateX(Math.PI/2))});
    if(t==0){
      var st=fins(4.2,11.6,-5.2,7,26,fin);st.position.set(sx-2.6,sy,0);cooler.add(st);
      cooler.add(mesh(bb(4.2,11.6,.5,.12),dk,sx-2.6,sy,7.2));
      cooler.add(fanX(12,null,6,sx+1.6,sy,.9,1));
    }else{
      var a=fins(3.2,11.6,-5.2,7,30,fin);a.position.set(sx-4.1,sy,0);cooler.add(a);
      var b2=fins(3.2,11.6,-5.2,7,30,fin);b2.position.set(sx+2.1,sy,0);cooler.add(b2);
      cooler.add(fanX(12,led,6.5,sx-1.0,sy,.9,1));
      cooler.add(fanX(12,led,6.5,sx+4.4,sy,.9,1));
      cooler.add(mesh(bb(3.2,11.8,.5,.12),dk,sx-4.1,sy,7.2));cooler.add(mesh(bb(3.2,11.8,.5,.12),dk,sx+2.1,sy,7.2));
      for(var k=0;k<3;k++)g.add(fanX(12,led,5.5,21,-6+k*12,0,1));
    }
  }else{
    var pump=mesh(cyl(3.9,3.9,3.2,40),dk,sx,sy,-6).rotateX(Math.PI/2);cooler.add(pump);
    var cap=tex(256,256,function(c,w,h){c.fillStyle='#0b1013';c.fillRect(0,0,w,h);c.strokeStyle='#d9480f';c.lineWidth=14;c.beginPath();c.arc(w/2,h/2,96,0,7);c.stroke();txt(c,'AIO',w/2,h/2,'700 64px Inter,Arial','#e8eef2','center')});
    var cp=new T.Mesh(new T.CircleGeometry(3.7,40),M({map:cap,roughness:.35,metalness:.4}));cp.position.set(sx,sy,-4.37);cooler.add(cp);
    var ring=new T.Mesh(new T.TorusGeometry(3.85,.12,10,48),LED(ACC,2.4));ring.position.set(sx,sy,-4.4);cooler.add(ring);
    var gl=glow(ACC,11,.4);gl.position.set(sx,sy,-3.6);cooler.add(gl);
    function tube(pts){var c=new T.CatmullRomCurve3(pts.map(function(q){return v3(q[0],q[1],q[2])}));
      return new T.Mesh(new T.TubeGeometry(c,60,.6,12,false),M({color:0x0a0e11,roughness:.8}))}
    cooler.add(tube([[sx+3.4,sy+1.5,-5.5],[2,13,-4.5],[10,21,-3.5],[17.6,23,-3.2]]));
    cooler.add(tube([[sx+3.4,sy-1.5,-5.5],[3,6,-5],[11,15,-3],[17.6,21,-1.2]]));
    var rad=fins(2.6,35,-5.9,5.9,60,fin);rad.rotation.y=Math.PI/2;rad.position.set(18.4,6,0);g.add(rad);
    g.add(mesh(bb(2.8,36,12,.25),M({color:0x12181c,metalness:.8,roughness:.4}),18.4,6,0));
    for(var q=0;q<3;q++)g.add(fanX(12,ACC,6,20.9,-6+q*12,0,1));
  }
  cooler.userData.focus=true;g.add(cooler);g.userData.focusObj=cooler;
  return g};

/* ---------- escena ---------- */
var renderer,scene,camera,controls,container,labelBox,regionEl,evEl,clock=new T.Clock(),canvas;
var parts={},ORDER=['cpu','gpu','ram','almacenamiento','placa','fuente','refrigeracion'];
var tiers={},meta={},opened=false,exploded=false,focusId=null,hoverId=null,openK=0,userMoved=false,tw=null,tmp=new T.Group(),selBox=null;
var hooks={},ray=new T.Raycaster(),ptr=new T.Vector2(),lastW=0,lastH=0,reg={x:0,y:0,w:300,h:300};
var POSE={
  cpu:{pres:{p:[0,0,16],r:[-.35,0,0]},expl:{p:[0,21.5,36],r:[-.3,0,0],s:2},dir:[.3,.28,1]},
  gpu:{pres:{p:[0,2,15],r:[-Math.PI/2,0,0]},expl:{p:[9,-3,36],r:[-Math.PI/2,0,0]},dir:[.25,.2,1]},
  ram:{pres:{p:[0,0,13],r:[0,-1.05,0]},expl:{p:[26,21,22],r:[0,-1.05,0],s:1.4},dir:[.2,.15,1]},
  almacenamiento:{pres:{p:[0,0,0],r:[0,0,0]},expl:{p:[26.5,2,27],r:[0,0,0]},dir:[.3,.4,1]},
  placa:{pres:{p:[0,0,0],r:[0,0,0]},expl:{p:[0,32.7,-16.5],r:[0,0,0]},dir:[.3,.2,1]},
  fuente:{pres:{p:[0,3,14],r:[0,.6,0]},expl:{p:[-15.5,14.5,23.5],r:[0,.5,0]},dir:[.3,.22,1]},
  refrigeracion:{pres:{p:[0,0,0],r:[0,0,0]},expl:{p:[-29,17,12],r:[0,0,0]},dir:[.45,.25,1]}
};
function anchorFor(id){
  var t=tiers[id];
  switch(id){
    case 'cpu':return v3(BOARD.sx,BOARD.sy,-7.5);
    case 'gpu':{var tg=(LBL&&LBL.t3&&LBL.t3.gpu)?LBL.t3.gpu[t]:t;if(tg<0)return v3(BOARD.sx+4,BOARD.sy-5,-7.5);return v3(-20.2+GL[tg]*.5,-3.5,-8.65+GH[tg]+.5)}
    case 'ram':return v3(0,BOARD.sy+8.4,-6.5);
    case 'almacenamiento':return (LBL&&LBL.noSata)?v3(-10.5,1.5,-6):v3(10.2,-9.6,1.5);
    case 'placa':return v3(-17,t>0?15.5:9.5,-8.7);
    case 'fuente':return v3(-15,-19,7.4);
    default:return v3(-8,12.8,6.5);
  }
}
function shadows(o){o.traverse(function(m){if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}

function emptyPart(id){var g=new T.Group(),m=new T.Mesh(new T.BoxGeometry(.3,.3,.3),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.position.copy(anchorFor(id));g.add(m);return g}
function buildPart(id){
  var p=parts[id],t=tiers[id];
  if(p.content){p.root.remove(p.content);p.mats.forEach(function(m){m.dispose()})}
  curMats=[];curSpin=[];
  var t3=(LBL&&LBL.t3&&LBL.t3[id])?LBL.t3[id][t]:t;
  var c=(t3<0)?emptyPart(id):B[id](t3);
  p.mats=curMats;p.spin=curSpin;p.base=p.mats.map(function(m){return{t:m.transparent,o:m.opacity,w:m.depthWrite}});
  tmp.add(c);tmp.updateMatrixWorld(true);
  var box3=new T.Box3().setFromObject(tmp),ctr=box3.getCenter(new T.Vector3()),sph=box3.getBoundingSphere(new T.Sphere());
  var fo=c.userData.focusObj,fr=sph.radius;
  if(fo){var s2=new T.Box3().setFromObject(fo).getBoundingSphere(new T.Sphere());fr=s2.radius}
  c.position.sub(ctr);c.userData.anchor=anchorFor(id).sub(ctr);
  p.fans=[];p.nv=[];
  if(id==='almacenamiento'&&c.children.some(function(o){return /^hdd/.test(o.name)})){c.children.forEach(function(o){if(/^nvme_/.test(o.name))p.nv.push({o:o,b:o.position.clone()})})}
  if(id==='refrigeracion'){var seenF=[];c.traverse(function(o){if(/^(ventilador_trasero|frontal[0-9]|rad_fan[0-9])/.test(o.name)&&!seenF.some(function(a){var q=o.parent;while(q){if(q===a)return true;q=q.parent}return false})){seenF.push(o);p.fans.push({o:o,b:o.position.clone()})}});
    p.fanMats=[];
    p.fans.forEach(function(f){f.o.traverse(function(m){
      if(m.isMesh){var cl=function(x){var n=x.clone();p.mats.push(n);var b={t:n.transparent,o:n.opacity,w:n.depthWrite};p.base.push(b);p.fanMats.push({m:n,b:b});return n};
        m.material=Array.isArray(m.material)?m.material.map(cl):cl(m.material)}})})}
  p.root.add(c);p.content=c;p.rest=ctr.clone();p.R=fr;p.anchor=c.userData.anchor;
  shadows(c);
  p.root.userData.partId=id;
  p.spinners=curSpin;
  if(!p.placed){p.root.position.copy(ctr);p.placed=true}
}
function setupPart(id){
  parts[id]={id:id,root:new T.Group(),dim:0,pulse:0,sc:1,placed:false,pos:v3(0,0,0),rot:new T.Euler()};
  scene.add(parts[id].root);buildPart(id);
}
function targetPose(id){
  var P=POSE[id],z={p:[0,0,0],r:[0,0,0]};
  if(exploded)return P.expl;
  if(focusId===id)return P.pres;
  return z}

/* entorno: HDR incrustado (reflejos reales) o, si falla, un estudio procedural */
function makeEnv(){
  var pm=new T.PMREMGenerator(renderer);
  try{
    if(window.ENV_HDR_B64&&T.RGBELoader){
      var bin=atob(window.ENV_HDR_B64),u8=new Uint8Array(bin.length);
      for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      var d=new T.RGBELoader().parse(u8.buffer);
      var tx=new T.DataTexture(d.data,d.width,d.height,d.format,d.type);
      tx.encoding=T.LinearEncoding;tx.minFilter=T.LinearFilter;tx.magFilter=T.LinearFilter;tx.generateMipmaps=false;tx.flipY=true;tx.needsUpdate=true;
      var env=pm.fromEquirectangular(tx).texture;tx.dispose();pm.dispose();return env;
    }
  }catch(e){if(window.console)console.warn('HDR no disponible, uso estudio procedural',e)}
  var s=new T.Scene();s.background=new T.Color(0x0a1015);
  function add(w,h,pos,c,i){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));
    m.position.set(pos[0],pos[1],pos[2]);m.lookAt(0,0,0);s.add(m)}
  add(60,30,[0,60,20],0xffffff,2.2);add(40,50,[-60,10,20],0xe8f2ff,.9);add(40,50,[60,5,-10],0xffd9c2,1.0);add(90,18,[0,-8,70],0xcfe8ff,.6);
  var t=pm.fromScene(s,.025).texture;pm.dispose();return t}

var sao=null,bgMat=null,composer=null,bloom=null,finalPass=null;
function setupPost(){
  if(!T.EffectComposer||!T.UnrealBloomPass||!T.ShaderPass||!renderer.capabilities.isWebGL2)return;
  try{
    var rt=new T.WebGLRenderTarget(4,4,{type:T.HalfFloatType,format:T.RGBAFormat,samples:4});
    composer=new T.EffectComposer(renderer,rt);
    bgMat=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{reg:{value:new T.Vector4(0,0,1,1)},pr:{value:1}},vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:['uniform vec4 reg;uniform float pr;void main(){',
  'vec2 p=gl_FragCoord.xy;vec2 q=(p-reg.xy)/reg.zw;',
  'vec2 d=(q-vec2(.5,.48))/vec2(.75,.65);float g=clamp(length(d),0.,1.);',
  'vec3 bg=mix(mix(vec3(.133,.2,.247),vec3(.059,.102,.133),smoothstep(0.,.55,g)),vec3(.027,.043,.059),smoothstep(.55,1.,g));',
  'bg=pow(bg,vec3(2.2))*2.2;',
  'vec2 gp=mod(p-reg.xy,32.*pr);float gl=step(gp.x,pr)+step(gp.y,pr);bg+=vec3(.0035)*min(gl,1.);',
  'gl_FragColor=vec4(bg,1.);}'].join(' ')});
    var bgS=new T.Scene();bgS.add(new T.Mesh(new T.PlaneGeometry(2,2),bgMat));bgMat.side=T.DoubleSide;
    var bgP=new T.RenderPass(bgS,new T.OrthographicCamera(-1,1,1,-1,0,1));composer.addPass(bgP);
    var scP=new T.RenderPass(scene,camera);scP.clear=false;composer.addPass(scP);
    if(T.SAOPass){
      sao=new T.SAOPass(scene,camera,false,true,new T.Vector2(512,512));
      var sp=sao.params;sp.output=0;sp.saoBias=.6;sp.saoIntensity=.009;sp.saoScale=40;sp.saoKernelRadius=26;sp.saoMinResolution=0;sp.saoBlur=true;sp.saoBlurRadius=6;sp.saoBlurStdDev=4;sp.saoBlurDepthCutoff=.012;
      var orig=sao.render.bind(sao);
      sao.render=function(){var hid=[];scene.traverse(function(o){if(o.visible&&(o.isSprite||o.isReflector||o.userData.noAO)){o.visible=false;hid.push(o)}});
        if(glassPivot&&glassPivot.visible){glassPivot.visible=false;hid.push(glassPivot)}
        orig.apply(null,arguments);hid.forEach(function(o){o.visible=true})};
      composer.addPass(sao);
    }
    bloom=new T.UnrealBloomPass(new T.Vector2(512,512),.32,.5,1.15);
    composer.addPass(bloom);
    finalPass=new T.ShaderPass({
      uniforms:{tDiffuse:{value:null},reg:{value:new T.Vector4(0,0,1,1)},res:{value:new T.Vector2(1,1)},exposure:{value:1.1},pr:{value:1}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:[
      'uniform sampler2D tDiffuse;uniform vec4 reg;uniform vec2 res;uniform float exposure;uniform float pr;varying vec2 vUv;',
      'vec3 aces(vec3 x){x*=exposure;const float a=2.51,b=.03,c=2.43,d=.59,e=.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.);}',
      'vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}',
      'void main(){',
      ' vec4 t=texture2D(tDiffuse,vUv);',
      ' vec2 p=vUv*res; vec2 q=(p-reg.xy)/reg.zw; q.y=1.-q.y;',
      ' vec2 d=(q-vec2(.5,.52))/vec2(.75,.65);float g=clamp(length(d),0.,1.);',
      ' vec3 bg=mix(mix(vec3(.133,.2,.247),vec3(.059,.102,.133),smoothstep(0.,.55,g)),vec3(.027,.043,.059),smoothstep(.55,1.,g));',
      '',
      ' vec2 gp=mod(p-reg.xy,32.*pr);float gl=step(gp.x,pr)+step(gp.y,pr);bg+=vec3(.04)*min(gl,1.)*.6;',
      ' float a=clamp(t.a,0.,1.);',
      ' vec3 col=srgb(aces(t.rgb));',
      '',
      ' float v=smoothstep(1.25,.45,length((q-.5)));col*=mix(.82,1.,v);',
      ' gl_FragColor=vec4(col,1.);}'].join(' ')});
    composer.addPass(finalPass);
  }catch(e){if(window.console)console.warn('Sin postproceso',e);composer=null}
}
function draw(){
  if(composer){
    var pr=renderer.getPixelRatio();
    bgMat.uniforms.pr.value=pr;bgMat.uniforms.reg.value.set(reg.x*pr,(lastH-reg.y-reg.h)*pr,reg.w*pr,reg.h*pr);finalPass.uniforms.pr.value=pr;finalPass.uniforms.res.value.set(lastW*pr,lastH*pr);
    finalPass.uniforms.reg.value.set(reg.x*pr,(lastH-reg.y-reg.h)*pr,reg.w*pr,reg.h*pr);
    composer.render();
  }else renderer.render(scene,camera);
}
function init(el,hk){
  container=el;hooks=hk||{};labelBox=hooks.labels;regionEl=hooks.region||el;evEl=hooks.events||regionEl;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){return false}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);
  canvas=renderer.domElement;el.appendChild(canvas);
  canvas.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;opacity:0';
  ACC=new T.Color(cssVar('--accent','#d9480f')).getHex();REC=new T.Color(cssVar('--rec','#0b7f73')).getHex();

  scene=new T.Scene();scene.environment=makeEnv();
  camera=new T.PerspectiveCamera(30,1,6,900);camera.position.set(80,25,110);
  setupPost();
  controls=new T.OrbitControls(camera,evEl);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=26;controls.maxDistance=280;
  controls.rotateSpeed=.7;controls.minPolarAngle=.25;controls.maxPolarAngle=2.5;controls.enabled=false;
  controls.addEventListener('start',function(){userMoved=true;tw=null});

  scene.add(new T.HemisphereLight(0xb8cfe0,0x0c1115,.32));
  var key=new T.DirectionalLight(0xfff1e0,2.1);key.position.set(55,70,105);key.target.position.set(0,0,0);key.castShadow=true;
  key.shadow.mapSize.set(4096,4096);var sc=key.shadow.camera;sc.left=-80;sc.right=80;sc.top=80;sc.bottom=-80;sc.near=10;sc.far=320;
  key.shadow.bias=-.0004;key.shadow.normalBias=.04;key.shadow.radius=4;scene.add(key);scene.add(key.target);
  var ra=new T.PointLight(ACC,.6,0,2);ra.position.set(-80,25,-30);scene.add(ra);
  var rb=new T.PointLight(0x5fa8ff,.55,0,2);rb.position.set(90,10,-20);scene.add(rb);
  var fill=new T.PointLight(0xffffff,1.0,140,1.2);fill.position.set(0,18,24);scene.add(fill);
  var teal=new T.PointLight(0x8fd0ff,.45,80,1.5);teal.position.set(-6,-6,4);scene.add(teal);

  // pedestal brillante con reflejo real y anillos de topografía
  var refl=new T.Reflector(new T.CircleGeometry(96,72),{textureWidth:1024,textureHeight:1024,color:0x6b7378,clipBias:.003});
  refl.rotation.x=-Math.PI/2;refl.position.y=-25.95;scene.add(refl);
  var sheen=new T.Mesh(new T.CircleGeometry(96,72),new T.MeshBasicMaterial({color:0x04070a,transparent:true,opacity:.72,depthWrite:false}));
  sheen.rotation.x=-Math.PI/2;sheen.position.y=-25.9;scene.add(sheen);
  var shad=new T.Mesh(new T.CircleGeometry(96,72),new T.ShadowMaterial({opacity:.5}));shad.rotation.x=-Math.PI/2;shad.position.y=-25.85;shad.receiveShadow=true;scene.add(shad);
  var lc=new T.Color(0x5d7484);
  [38,58,80].forEach(function(r,i){var rg=new T.Mesh(new T.RingGeometry(r,r+.25,128),new T.MeshBasicMaterial({color:lc,transparent:true,opacity:.5-i*.12,side:T.DoubleSide,depthWrite:false}));
    rg.rotation.x=-Math.PI/2;rg.position.y=-25.8;scene.add(rg)});

  ORDER.forEach(function(id){tiers[id]=1});
  function finishInit(){
  scene.add(buildCase());
  ORDER.forEach(function(id){setupPart(id)});
  caseMats.splice(caseMats.indexOf(glassMat),1);caseMats.splice(caseMats.indexOf(glassFrame),1);glassFrame.transparent=true;
  caseGroup.traverse(function(o){if(o.isMesh&&o!==glassMesh&&o.parent!==glassPivot){o.castShadow=true;o.receiveShadow=true}});
  caseMats.forEach(function(m){m.userData.o=m.opacity;m.userData.t=m.transparent;m.userData.w=m.depthWrite});

  ORDER.forEach(function(id,i){
    var b=document.createElement('button');b.className='lbl';b.type='button';b.dataset.id=id;b.dataset.state='hidden';
    b.innerHTML='<u class="pt"></u><s class="ln"></s><em class="tg"><i>'+(i+1)+'</i><span><b></b><small></small></span></em>';
    b.addEventListener('click',function(e){e.stopPropagation();if(hooks.onPick)hooks.onPick(id)});
    labelBox.appendChild(b);meta[id]={el:b};
    if(pendingLabels[id])setLabel(id,pendingLabels[id][0],pendingLabels[id][1]);
  });
  ready=true;
  if(monCfg)setMonitor(monCfg);
  dust=makeDust();scene.add(dust);litDirty=true;
  canvas.style.transition='opacity 1.4s ease';canvas.style.opacity=1;
  }

  var down=null;
  evEl.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY}});
  evEl.addEventListener('pointerup',function(e){
    if(!down)return;var moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(moved>5)return;
    if(!opened){if(hooks.onOpen)hooks.onOpen();return}
    if(e.target.closest&&e.target.closest('.tools,.lbl'))return;
    var id=pick(e);if(id){if(hooks.onPick)hooks.onPick(id)}else if(hooks.onBackground)hooks.onBackground()});
  evEl.addEventListener('pointermove',function(e){
    if(e.buttons)return;var id=opened?pick(e):null;
    if(id!==hoverId){hoverId=id;evEl.style.cursor=id?'pointer':opened?'grab':'default';if(hooks.onHover)hooks.onHover(id)}});
  evEl.addEventListener('pointerleave',function(){if(hoverId){hoverId=null;if(hooks.onHover)hooks.onHover(null)}});
  updateRegion();
  var g0=goal();camera.position.copy(g0.pos);controls.target.copy(g0.tgt);
  API.ok=true;clock.start();loop();
  if(window.PC_GLB_B64&&T.GLTFLoader){
    try{
      var bin=atob(window.PC_GLB_B64),u8=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      new T.GLTFLoader().parse(u8.buffer,'',function(gl){glb=gl.scene;useGLB();finishInit()},function(e){if(window.console)console.warn('GLB no se pudo leer, uso el modelo simple',e);finishInit()});
    }catch(e){if(window.console)console.warn(e);finishInit()}
  }else finishInit();
  return true}

/* El canvas cubre todo el escenario; solo se dibuja (y se recorta) en la zona de la torre. */
function updateRegion(){
  var cr=canvas.getBoundingClientRect(),rr=regionEl.getBoundingClientRect(),W=Math.round(cr.width),H=Math.round(cr.height);
  if(!W||!H)return;
  if(W!==lastW||H!==lastH){renderer.setSize(W,H,false);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(W,H);bloom.resolution.set(W,H)}lastW=W;lastH=H;reg.w=-1}
  var rx=rr.left-cr.left,ry=rr.top-cr.top,rw=Math.max(rr.width,60),rh=Math.max(rr.height,60);
  if(Math.abs(rx-reg.x)+Math.abs(ry-reg.y)+Math.abs(rw-reg.w)+Math.abs(rh-reg.h)>.2){
    reg.x=rx;reg.y=ry;reg.w=rw;reg.h=rh;
    camera.aspect=rw/rh;camera.setViewOffset(rw,rh,-rx,-ry,W,H);camera.updateProjectionMatrix();
    var clip='inset('+Math.max(0,ry)+'px '+Math.max(0,W-rx-rw)+'px '+Math.max(0,H-ry-rh)+'px '+Math.max(0,rx)+'px)';
    canvas.style.clipPath=clip;canvas.style.webkitClipPath=clip;
    if(labelBox){labelBox.style.clipPath=clip;labelBox.style.webkitClipPath=clip}
  }
}

function pick(e){
  if(!ready)return null;
  var r=canvas.getBoundingClientRect();
  ptr.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ptr,camera);
  var roots=ORDER.map(function(id){return parts[id].root}),hit=ray.intersectObjects(roots,true);
  for(var i=0;i<hit.length;i++){
    var o=hit[i].object;if(o.isSprite)continue;
    var mt=o.material&&!Array.isArray(o.material)?o.material:null;
    if(mt&&mt.opacity<.3)continue;
    while(o&&!o.userData.partId)o=o.parent;if(o)return o.userData.partId}
  return null}

/* ---------- cámara ---------- */
function fitDist(R,k){
  var vf=camera.fov*Math.PI/180,tv=Math.tan(vf/2),th=tv*camera.aspect;
  return Math.max(R/tv,R/th)*(k||1.1)}
function goal(){
  var t=performance.now()/1000,d,dir,tgt;
  if(!opened){
    dir=v3(.62,.16,.77).normalize();if(!reduce)dir.applyAxisAngle(v3(0,1,0),Math.sin(t*.3)*.32+nudgeC);
    tgt=v3(0,-1,0);d=fitDist(32,1.04);
  }else if(focusId&&!exploded&&ready){
    var P=POSE[focusId],p=parts[focusId];
    dir=v3(P.dir[0],P.dir[1],P.dir[2]).normalize();
    tgt=p.rest.clone().add(p.anchor).add(v3(P.pres.p[0],P.pres.p[1],P.pres.p[2]));
    if(focusId==='refrigeracion')tgt=v3(-7,6.5,1);
    if(focusId==='almacenamiento'&&!(LBL&&LBL.noSata))tgt.add(v3(-6,-1,2));
    d=fitDist(focusId==='almacenamiento'&&!(LBL&&LBL.noSata)?11:Math.max(p.R,9),1.4);
  }else if(exploded){
    dir=v3(.35,.16,1).normalize();tgt=v3(0,10,10);d=fitDist(66,1.08);
  }else if(monCfg){
    var mr=28.7+61.4*monCfg.inch/27;dir=v3(.3,.16,.95).normalize();tgt=v3((mr-23.7)/2+7,-1,-4);d=fitDist((mr+23.7)/2+9,1.0);
  }else{
    dir=v3(.4,.14,.95).normalize();tgt=v3(0,-1,0);d=fitDist(31,1.0);
  }
  return {pos:tgt.clone().add(dir.clone().multiplyScalar(d)),tgt:tgt,dir:dir.clone().normalize(),d:d}}
function fly(ms){
  userMoved=false;
  var off=camera.position.clone().sub(controls.target);
  tw={t0:performance.now(),ms:reduce?1:ms,fromT:controls.target.clone(),fromD:off.length(),fromDir:off.normalize()};
  controls.enabled=false}

/* ---------- monitor (se arma con código, sin modelos externos) ----------
   cfg: {inch:27|22, kind:'map'|'hotel', logo:'ProArt', res:'2560 × 1440'}. Se ubica a la derecha de la torre. */
var monCfg=null,monGroup=null,monMats=[],monK=0;
function mapScreen(g,w,h){
  var r=rng(7);
  g.fillStyle='#16191d';g.fillRect(0,0,w,h);
  // barra superior
  g.fillStyle='#22262c';g.fillRect(0,0,w,46);
  ['#ff5f57','#febc2e','#28c840'].forEach(function(c,i){g.fillStyle=c;g.beginPath();g.arc(22+i*22,23,7,0,7);g.fill()});
  txt(g,'Mapeo · Finca La Esperanza (Meta) · Ortomosaico + nube de puntos',100,23,'600 19px Segoe UI, Arial','#c9d1d9');
  ['Vuelo','Procesar','Clasificar','Exportar'].forEach(function(s,i){g.fillStyle=i===1?'#d9480f':'#2d333b';g.fillRect(w-520+i*128,9,118,28);txt(g,s,w-461+i*128,23,'600 15px Segoe UI, Arial','#fff','center')});
  // panel de capas
  var sx=280;g.fillStyle='#1c2025';g.fillRect(0,46,sx,h-82);
  txt(g,'CAPAS',20,76,'700 14px Segoe UI, Arial','#7d8590');
  var layers=[['Ortomosaico RGB','#3fb950'],['Modelo digital (DSM)','#d29922'],['Nube de puntos LAS','#58a6ff'],['Curvas de nivel 1 m','#f0f6fc'],['Plan de vuelo DJI','#d9480f'],['Lotes de cultivo','#a371f7'],['Zonas de fumigación','#f778ba']];
  layers.forEach(function(L,i){var y=108+i*40;g.fillStyle=i===2?'#2d333b':'transparent';g.fillRect(8,y-17,sx-16,34);
    g.strokeStyle='#8b949e';g.lineWidth=2;g.strokeRect(20,y-8,16,16);g.fillStyle=L[1];g.fillRect(23,y-5,10,10);txt(g,L[0],48,y,'16px Segoe UI, Arial','#c9d1d9')});
  txt(g,'PROCESO',20,410,'700 14px Segoe UI, Arial','#7d8590');
  [['Alinear fotos',1],['Nube densa',1],['Malla 3D',.72],['Ortomosaico',0]].forEach(function(s,i){var y=444+i*48;txt(g,s[0],20,y,'15px Segoe UI, Arial','#c9d1d9');
    g.fillStyle='#30363d';g.fillRect(20,y+14,sx-40,8);g.fillStyle=s[1]>=1?'#3fb950':'#d9480f';g.fillRect(20,y+14,(sx-40)*s[1],8)});
  // mapa: lotes de cultivo
  var mx=sx,my=46,mw=w-sx-420,mh=h-82;
  g.save();g.beginPath();g.rect(mx,my,mw,mh);g.clip();
  g.fillStyle='#4b5a2e';g.fillRect(mx,my,mw,mh);
  var cols=['#5f7a33','#7a8b3a','#8a7a45','#4e6b2c','#6d8f3c','#9a8a52','#567d36','#3f5f2a'];
  for(var i=0;i<7;i++)for(var j=0;j<6;j++){var x0=mx+i*mw/7+(r()-.5)*20,y0=my+j*mh/6+(r()-.5)*20;
    g.fillStyle=cols[Math.floor(r()*cols.length)];g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+mw/7+r()*14,y0+(r()-.5)*16);g.lineTo(x0+mw/7+(r()-.5)*16,y0+mh/6+r()*14);g.lineTo(x0+(r()-.5)*14,y0+mh/6);g.closePath();g.fill();
    g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=1;for(var k=0;k<14;k++){g.beginPath();g.moveTo(x0+k*mw/98,y0);g.lineTo(x0+k*mw/98+8,y0+mh/6);g.stroke()}}
  // río y vía
  g.strokeStyle='#2f6f8f';g.lineWidth=16;g.beginPath();g.moveTo(mx,my+mh*.78);g.bezierCurveTo(mx+mw*.3,my+mh*.55,mx+mw*.55,my+mh*.98,mx+mw,my+mh*.7);g.stroke();
  g.strokeStyle='#c2b59b';g.lineWidth=7;g.beginPath();g.moveTo(mx+mw*.12,my);g.lineTo(mx+mw*.25,my+mh);g.stroke();
  // curvas de nivel
  g.strokeStyle='rgba(240,246,252,.35)';g.lineWidth=1.3;
  for(var c=0;c<9;c++){g.beginPath();for(var a=0;a<=64;a++){var t=a/64*Math.PI*2,rr=40+c*34+Math.sin(t*3+c)*12;var x=mx+mw*.62+Math.cos(t)*rr*1.3,y=my+mh*.38+Math.sin(t)*rr*.8;a?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
  // plan de vuelo (líneas en zigzag) y puntos de paso
  var fx=mx+mw*.35,fy=my+mh*.12,fw=mw*.5,fh=mh*.56;g.fillStyle='rgba(217,72,15,.12)';g.fillRect(fx,fy,fw,fh);
  g.strokeStyle='#ff7b3a';g.lineWidth=3;g.beginPath();for(var s=0;s<=10;s++){var X=fx+s*fw/10;if(s%2){g.lineTo(X,fy+fh);g.lineTo(X,fy)}else{g.lineTo(X,fy);g.lineTo(X,fy+fh)}}g.stroke();
  for(s=0;s<=10;s++){g.fillStyle='#fff';g.beginPath();g.arc(fx+s*fw/10,s%2?fy:fy+fh,5,0,7);g.fill()}
  g.fillStyle='#ff7b3a';g.beginPath();g.moveTo(fx+fw*.6,fy+fh*.4);g.lineTo(fx+fw*.6+16,fy+fh*.4+26);g.lineTo(fx+fw*.6-16,fy+fh*.4+26);g.fill();
  // zona de fumigación
  g.strokeStyle='#f778ba';g.setLineDash([10,7]);g.lineWidth=3;g.strokeRect(mx+mw*.05,my+mh*.08,mw*.24,mh*.3);g.setLineDash([]);
  g.restore();
  // escala y norte
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(mx+16,my+mh-56,190,40);g.fillStyle='#fff';g.fillRect(mx+30,my+mh-30,120,5);txt(g,'100 m',mx+160,my+mh-28,'14px Segoe UI, Arial','#fff');
  // vista 3D de la nube de puntos
  var px=w-420,pw=420;g.fillStyle='#0d1117';g.fillRect(px,46,pw,h-82);
  txt(g,'NUBE DE PUNTOS · 3D',px+20,76,'700 14px Segoe UI, Arial','#7d8590');
  for(i=0;i<9000;i++){var u=r()*2-1,v=r()*2-1,hgt=Math.sin(u*3)*Math.cos(v*2.4)*.5+.5+(r()-.5)*.08;
    var X2=px+pw/2+(u-v)*170,Y2=46+(h-82)*.5+(u+v)*60-hgt*120;
    var col=hgt<.33?[47,129,247]:hgt<.66?[63,185,80]:[248,81,73];g.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+',.85)';g.fillRect(X2,Y2,2,2)}
  for(i=0;i<3;i++){var bx=px+40+i*120;g.fillStyle='#161b22';g.fillRect(bx,h-150,108,70);txt(g,['186,4 M','2.431','2,1 cm'][i],bx+54,h-125,'700 20px Segoe UI, Arial','#f0f6fc','center');txt(g,['puntos','fotos','por píxel'][i],bx+54,h-98,'13px Segoe UI, Arial','#7d8590','center')}
  // barra de estado
  g.fillStyle='#22262c';g.fillRect(0,h-36,w,36);
  txt(g,'GPU RTX 5060 Ti · CUDA activo  ·  VRAM 11,2 / 16 GB  ·  RAM 24 / 32 GB  ·  EPSG:3116 MAGNA-SIRGAS',18,h-18,'15px Segoe UI, Arial','#8b949e');
  txt(g,'4.13° N  73.63° O',w-18,h-18,'15px Segoe UI, Arial','#8b949e','right');
}
function hotelScreen(g,w,h){
  g.fillStyle='#f4f6f8';g.fillRect(0,0,w,h);
  g.fillStyle='#0b7f73';g.fillRect(0,0,w,58);txt(g,'Hotel · Recepción y reservas',24,29,'700 24px Segoe UI, Arial','#fff');
  txt(g,'Noviembre 2026',w-24,29,'600 19px Segoe UI, Arial','#e6fffa','right');
  var sx=220,days=14,cw=(w-sx-20)/days,rows=14,rh=(h-150)/rows;
  for(var d=0;d<days;d++){txt(g,String(16+d),sx+d*cw+cw/2,82,'600 15px Segoe UI, Arial','#57606a','center')}
  var r=rng(3),cols=['#2da44e','#0969da','#bf8700','#8250df','#cf222e'];
  for(var i=0;i<rows;i++){var y=100+i*rh;g.fillStyle=i%2?'#fff':'#eef1f4';g.fillRect(0,y,w,rh);
    txt(g,'Habitación '+(101+i),20,y+rh/2,'16px Segoe UI, Arial','#24292f');
    var d0=0;while(d0<days){d0+=Math.floor(r()*3);var len=1+Math.floor(r()*4);if(d0>=days)break;
      g.fillStyle=cols[Math.floor(r()*cols.length)];g.fillRect(sx+d0*cw+3,y+5,Math.min(len,days-d0)*cw-6,rh-10);d0+=len}}
  g.fillStyle='#24292f';g.fillRect(0,h-40,w,40);txt(g,'Ocupación 78 %  ·  12 llegadas hoy  ·  Factura electrónica DIAN: en línea',20,h-20,'15px Segoe UI, Arial','#c9d1d9');
}
function gameScreen(g,w,h){
  var r=rng(11);
  g.fillStyle='#151515';g.fillRect(0,0,w,h);
  // barra superior del editor
  g.fillStyle='#1f1f1f';g.fillRect(0,0,w,44);
  txt(g,'Llanero Games · Proyecto "Leyendas del Llano" · Nivel_Sabana',18,22,'600 18px Segoe UI, Arial','#d0d0d0');
  ['Compilar','Jugar','Empaquetar'].forEach(function(s,i){g.fillStyle=i===1?'#2e9e4f':'#333';g.fillRect(w-420+i*136,8,126,28);txt(g,(i===1?'▶ ':'')+s,w-357+i*136,22,'600 15px Segoe UI, Arial','#fff','center')});
  var lx=250,rx=w-300,top=44,bot=h-230;
  // vista del juego: atardecer llanero
  var vw=rx-lx,vh=bot-top;g.save();g.beginPath();g.rect(lx,top,vw,vh);g.clip();
  var sky=g.createLinearGradient(0,top,0,top+vh*.62);sky.addColorStop(0,'#2b3a6b');sky.addColorStop(.55,'#e0734a');sky.addColorStop(1,'#f6c46a');
  g.fillStyle=sky;g.fillRect(lx,top,vw,vh);
  g.fillStyle='#ffe3a1';g.beginPath();g.arc(lx+vw*.68,top+vh*.56,44,0,7);g.fill();
  var gr=g.createLinearGradient(0,top+vh*.6,0,top+vh);gr.addColorStop(0,'#5c6b2d');gr.addColorStop(1,'#2c3a18');
  g.fillStyle=gr;g.fillRect(lx,top+vh*.6,vw,vh*.4);
  // río y palmas (morichales)
  g.fillStyle='#e9a25a';g.beginPath();g.moveTo(lx+vw*.2,top+vh);g.quadraticCurveTo(lx+vw*.45,top+vh*.7,lx+vw*.62,top+vh*.62);g.lineTo(lx+vw*.66,top+vh*.62);g.quadraticCurveTo(lx+vw*.52,top+vh*.75,lx+vw*.42,top+vh);g.fill();
  for(var i=0;i<9;i++){var px=lx+r()*vw,py=top+vh*(.6+r()*.04),ph=60+r()*90;g.strokeStyle='#1b2410';g.lineWidth=5;g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+8,py-ph/2,px+3,py-ph);g.stroke();
    g.fillStyle='#1b2410';for(var k=0;k<7;k++){var a=k/7*Math.PI*2;g.beginPath();g.ellipse(px+3+Math.cos(a)*20,py-ph+Math.sin(a)*8,22,5,a,0,7);g.fill()}}
  // personaje (jinete) en silueta
  g.fillStyle='#120d08';g.beginPath();g.ellipse(lx+vw*.35,top+vh*.8,46,18,0,0,7);g.fill();g.fillRect(lx+vw*.35-40,top+vh*.8,8,40);g.fillRect(lx+vw*.35+30,top+vh*.8,8,40);
  g.beginPath();g.arc(lx+vw*.35-8,top+vh*.8-44,12,0,7);g.fill();g.fillRect(lx+vw*.35-16,top+vh*.8-34,16,30);
  g.restore();
  // gizmo, FPS y estadísticas
  g.strokeStyle='#e04040';g.lineWidth=4;g.beginPath();g.moveTo(lx+vw*.35,top+vh*.78);g.lineTo(lx+vw*.35+70,top+vh*.78);g.stroke();
  g.strokeStyle='#40c040';g.beginPath();g.moveTo(lx+vw*.35,top+vh*.78);g.lineTo(lx+vw*.35,top+vh*.78-70);g.stroke();
  g.strokeStyle='#4080ff';g.beginPath();g.moveTo(lx+vw*.35,top+vh*.78);g.lineTo(lx+vw*.35-45,top+vh*.78+40);g.stroke();
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(lx+12,top+12,300,96);
  txt(g,'200 FPS  ·  5,0 ms',lx+26,top+36,'700 22px Consolas, monospace','#7CFC7C');
  txt(g,'Ray tracing: activado  ·  DLSS 4',lx+26,top+66,'15px Consolas, monospace','#ddd');
  txt(g,'VRAM 10,8 / 16 GB',lx+26,top+90,'15px Consolas, monospace','#ddd');
  // paneles laterales
  g.fillStyle='#1b1b1b';g.fillRect(0,top,lx,h-top);g.fillRect(rx,top,w-rx,h-top);
  txt(g,'ESCENA',16,top+26,'700 13px Segoe UI, Arial','#8a8a8a');
  ['Cielo_Atardecer','Terreno_Sabana','Rio_Meta','Morichal_01','Morichal_02','Jinete_Jugador','Caballo_IA','Luz_Sol','PostProceso'].forEach(function(s,i){var y=top+60+i*32;
    if(i===5){g.fillStyle='#2b4a7a';g.fillRect(6,y-14,lx-12,28)}txt(g,'▸ '+s,18,y,'15px Segoe UI, Arial','#cfcfcf')});
  txt(g,'DETALLES',rx+16,top+26,'700 13px Segoe UI, Arial','#8a8a8a');
  [['Posición','120 · 34 · 0'],['Rotación','0 · 0 · 90'],['Escala','1 · 1 · 1'],['Malla','SK_Jinete'],['Material','M_Poncho'],['Física','Activada']].forEach(function(p,i){var y=top+60+i*34;
    txt(g,p[0],rx+16,y,'15px Segoe UI, Arial','#9a9a9a');g.fillStyle='#262626';g.fillRect(rx+120,y-13,w-rx-136,26);txt(g,p[1],rx+128,y,'14px Segoe UI, Arial','#e0e0e0')});
  // explorador de contenido
  g.fillStyle='#202020';g.fillRect(lx,bot,rx-lx,h-bot);txt(g,'CONTENIDO',lx+16,bot+22,'700 13px Segoe UI, Arial','#8a8a8a');
  var cols=['#7a5c3a','#3f6b2c','#2f5f8f','#8f4a2f','#6b6b6b','#a07a2a','#4a3f7a'];
  for(i=0;i<7;i++){var bx=lx+16+i*((rx-lx-32)/7);g.fillStyle=cols[i];g.fillRect(bx,bot+44,(rx-lx-32)/7-14,110);
    txt(g,['T_Barro','T_Pasto','T_Agua','SK_Toro','M_Metal','T_Arena','FX_Polvo'][i],bx+((rx-lx-32)/7-14)/2,bot+172,'13px Segoe UI, Arial','#bbb','center')}
  g.fillStyle='#111';g.fillRect(0,h-34,w,34);
  txt(g,'Compilando shaders: 1.284 / 1.284  ✓   ·   Ryzen 9 9900X 24 hilos   ·   RTX 5070 Ti',16,h-17,'14px Consolas, monospace','#9be29b');
}
function buildMonitor(cfg){
  curMats=monMats=[];
  var s=cfg.inch/27,W=61.4*s,H=36.4*s,g=new T.Group(),p=new T.Group();g.add(p);
  var shell=M({color:0x141619,roughness:.62,metalness:.15,envMapIntensity:.5}),dark=M({color:0x0b0c0e,roughness:.7,metalness:.2}),
      steel=M({color:0x1e2125,roughness:.45,metalness:.7,bumpMap:brushTex(),bumpScale:.2,envMapIntensity:.45});
  var add=function(o,par){(par||g).add(o);return o};
  // panel: marco frontal, parte trasera abultada y pantalla
  add(mesh(bb(W,H,1.3,.28),shell,0,0,0),p);
  add(mesh(bb(W*.72,H*.7,3.4,1.1),shell,0,-H*.05,-1.9),p);
  var sw=W-1.6,sh=H-.8-2.1*s,scr=tex(1600,Math.round(1600*sh/sw),cfg.kind==='hotel'?hotelScreen:cfg.kind==='game'?gameScreen:mapScreen);
  var sm=M({color:0x050607,emissive:0xffffff,emissiveMap:scr,emissiveIntensity:cfg.kind==='hotel'?.62:.95,roughness:.32,metalness:0});
  add(mesh(new T.PlaneGeometry(sw,sh),sm,0,H/2-.8-sh/2,.66),p).userData.noAO=true;
  // logo en el borde inferior y LED de encendido
  var lg=tex(512,64,function(c,w,h){c.clearRect(0,0,w,h);txt(c,cfg.logo||'',w/2,h/2,'600 40px Segoe UI, Arial','rgba(200,205,212,.85)','center')});
  var lgm=new T.MeshBasicMaterial({map:lg,transparent:true,depthWrite:false});monMats.push(lgm);add(mesh(new T.PlaneGeometry(8*s,1),lgm,0,-H/2+1.05*s,.66),p);
  add(mesh(box(.35,.18,.1),LED(0xffffff,1.2),W/2-3,-H/2+.5,.66),p);
  // soporte: columna con ajuste de altura, cuello y base rectangular
  var baseY=-25.9,bottom=baseY+(cfg.inch>=27?11.5:9.5);
  p.position.set(0,bottom+H/2,0);
  var colH=(bottom+H*.45)-(baseY+1.2);
  add(mesh(bb(6.6,colH,2.4,.5),steel,0,baseY+1.2+colH/2,-5.2));
  add(mesh(bb(9,5,1.6,.5),dark,0,bottom+H*.45-2.5,-3.9));
  add(mesh(bb(25*s+2,1.1,19*s+1,.45),steel,0,baseY+.55,-3.5));
  add(mesh(bb(5,.4,5,.2),dark,0,baseY+1.25,-5.2));
  g.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  g.position.set(23.7+5+W/2,0,-5);g.rotation.y=-.08;
  monMats.forEach(function(m){m.userData.o=m.opacity;m.userData.t=m.transparent;m.transparent=true;m.opacity=0});
  return g}
function setMonitor(cfg){
  monCfg=cfg||null;if(!ready)return;
  if(monGroup){scene.remove(monGroup);monGroup=null;monK=0}
  if(monCfg){monGroup=buildMonitor(monCfg);monGroup.visible=false;scene.add(monGroup)}}
function updateMonitor(dt){
  if(!monGroup)return;var want=opened&&!exploded&&!focusId?1:0;
  monK+=(want-monK)*(1-Math.exp(-dt*4));monGroup.visible=monK>.01;
  var op=monK<.995;monMats.forEach(function(m){m.transparent=op||m.userData.t;m.opacity=(m.userData.o||1)*(op?monK:1);m.depthWrite=!op||monK>.6});
  monGroup.position.y=(1-monK)*-3}

/* ---------- API ---------- */
API.init=init;
API.open=function(){if(opened)return;opened=true;tw=null;fly(1700)};
API.focus=function(id){focusId=ORDER.indexOf(id)>=0?id:null;fly(1100);updateLabelStates()};
API.explode=function(on){exploded=!!on;fly(1300);updateLabelStates()};
API.isExploded=function(){return exploded};
API.rests=function(){var o={};ORDER.forEach(function(id){var r=parts[id].rest;o[id]=[+r.x.toFixed(1),+r.y.toFixed(1),+r.z.toFixed(1),+parts[id].R.toFixed(1)]});return JSON.stringify(o)};
API.setPC=function(lb){
  LBL=lb||null;
  if(!ready)return;
  ORDER.forEach(function(id){buildPart(id)});litDirty=true};
API.setMonitor=function(c){var was=!!monCfg;setMonitor(c);if(was!==!!monCfg&&opened)fly(900)};
API.nudge=function(a){nudgeT=a||0};
API.wake=function(on){if(!opened)powerT=on?.75:.3};
API.setTier=function(id,i,model){
  if(tiers[id]===i)return;tiers[id]=i;
  if(!ready){if(model!==undefined)pendingLabels[id]=[undefined,model];return}
  buildPart(id);litDirty=true;
  if(id==='placa'||id==='gpu')buildPart('fuente');
  parts[id].pulse=1;if(model!==undefined)setLabel(id,undefined,model)};
API.setLabel=function(id,name,model){setLabel(id,name,model)};
function setLabel(id,name,model){var m=meta[id];if(!m){var p=pendingLabels[id]||[];if(name!==undefined)p[0]=name;if(model!==undefined)p[1]=model;pendingLabels[id]=p;return}if(name!==undefined)m.name=name;if(model!==undefined)m.model=model;
  m.el.querySelector('b').textContent=m.name||id;m.el.querySelector('small').textContent=m.model||''}
API.pulse=function(id){if(parts[id])parts[id].pulse=1};
API.isOpen=function(){return opened};
API.debug=function(){return JSON.stringify({monK:monK,monN:monMats.length,monOp:monMats.map(function(m){return +m.opacity.toFixed(2)+(m.transparent?"t":"")}).join(","),cam:camera.position.toArray().map(Math.round),tgt:controls.target.toArray().map(Math.round),asp:camera.aspect,ready:ready,opened:opened,tw:!!tw,um:userMoved,reg:reg,fov:camera.fov,view:camera.view&&camera.view.enabled,nodes:glb?glb.children.length:-1})};

function labelState(id){
  if(!opened)return 'hidden';
  if(exploded)return 'full';
  if(focusId)return id===focusId?'full':'hidden';
  return hoverId===id?'full':'dot'}
function updateLabelStates(){if(!ready)return;ORDER.forEach(function(id){meta[id].el.dataset.state=labelState(id)})}

/* ---------- bucle ---------- */
var tmpV=new T.Vector3();
var POWER=.3,powerT=.3,nudgeT=0,nudgeC=0,lit=[],litDirty=true,dust=null;
function collectLit(){
  lit=[];var seen={};
  scene.traverse(function(o){
    if(o.isSprite&&o.material&&!seen[o.material.uuid]){seen[o.material.uuid]=1;if(o.material._op===undefined)o.material._op=o.material.opacity;lit.push({m:o.material,sp:true,b:o.material._op,ph:Math.random()*6.28})}
    else if(o.isMesh){var ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(function(m){if(m&&m.emissive&&!seen[m.uuid]&&(m.emissive.r+m.emissive.g+m.emissive.b)>0){seen[m.uuid]=1;if(m._ei===undefined)m._ei=m.emissiveIntensity;lit.push({m:m,b:m._ei,ph:Math.random()*6.28})}})}
  });litDirty=false}
function makeDust(){
  var n=160,pos=new Float32Array(n*3),i;
  for(i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*110;pos[i*3+1]=(Math.random()-.5)*80;pos[i*3+2]=(Math.random()-.5)*90}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
  var m=new T.PointsMaterial({color:0xcfe3ff,size:.42,sizeAttenuation:true,transparent:true,opacity:.32,depthWrite:false,blending:T.AdditiveBlending});
  var p=new T.Points(g,m);p.userData.noAO=true;p.frustumCulled=false;return p}
var XOFF={cpu:[-8,-24,1],placa:[-8,26,1],ram:[10,-14,0],refrigeracion:[10,-30,0]};
function loop(){
  requestAnimationFrame(loop);
  var dt=Math.min(clock.getDelta(),.05),k=1-Math.exp(-dt*5.5);
  updateRegion();
  if(!ready){var g1=goal();controls.target.copy(g1.tgt);camera.position.copy(g1.pos);controls.update();draw();return}
  if(opened&&openK<1){openK=Math.min(1,openK+dt/(reduce?.01:1.3))}
  var tn=performance.now()/1000;
  powerT=opened?1:Math.max(powerT>.3?powerT:.3,.3);
  POWER+=(powerT-POWER)*(1-Math.exp(-dt*(opened?1.4:2.5)));
  nudgeC+=(nudgeT-nudgeC)*(1-Math.exp(-dt*3));
  if(litDirty)collectLit();
  var pw=POWER;
  lit.forEach(function(L){var f=.14+.86*pw,br=1+.07*Math.sin(tn*2.1+L.ph);
    if(L.sp)L.m.opacity=L.b*f*br;else L.m.emissiveIntensity=L.b*f*br});
  if(dust){var pa=dust.geometry.attributes.position.array;
    for(var di=0;di<pa.length;di+=3){pa[di+1]+=dt*(.5+(di%7)*.08);pa[di]+=Math.sin(tn*.4+di)*dt*.25;if(pa[di+1]>40)pa[di+1]=-40}
    dust.geometry.attributes.position.needsUpdate=true;dust.material.opacity=.14+.22*pw}
  var ok=smooth(openK);
  if(glassPivot){
    glassPivot.position.set(-23.4,ok*16,10.55+ok*26);glassPivot.rotation.x=-ok*.18;
    var fa=1-smooth(openK/.55);glassMat.opacity=.2*fa;glassFrame.opacity=fa;glassPivot.visible=openK<1}
  ORDER.forEach(function(id){parts[id].spinners.forEach(function(s){var sk=.12+.88*pw*pw;if(s.axis)s.o.rotateOnAxis(s.axis,-s.s*dt*sk);else s.o.rotation.z-=s.s*dt*sk})});
  var dimCase=(exploded?.8:focusId?.7:0);
  caseMats.forEach(function(m){var d=m._dim||0;d+=(dimCase-d)*k;m._dim=d;var base=m.userData.o;
    if(d>.01){m.transparent=true;m.opacity=base*(1-d*.82);m.depthWrite=d<.5&&m.userData.w}else{m.transparent=m.userData.t;m.opacity=base;m.depthWrite=m.userData.w}});
  updateMonitor(dt);
  ORDER.forEach(function(id){
    var p=parts[id],pose=targetPose(id),tp=pose.p,tr=pose.r;
    p.pos.x+=(tp[0]-p.pos.x)*k;p.pos.y+=(tp[1]-p.pos.y)*k;p.pos.z+=(tp[2]-p.pos.z)*k;
    p.rot.x+=(tr[0]-p.rot.x)*k;p.rot.y+=(tr[1]-p.rot.y)*k;p.rot.z+=(tr[2]-p.rot.z)*k;
    p.root.position.set(p.rest.x+p.pos.x,p.rest.y+p.pos.y,p.rest.z+p.pos.z);
    p.root.rotation.set(p.rot.x,p.rot.y,p.rot.z);
    if(p.fans&&p.fans.length){p.fans.forEach(function(f){f.o.position.set(f.b.x-p.pos.x,f.b.y-p.pos.y,f.b.z-p.pos.z)})}
    if(p.nv&&p.nv.length){p.nvK=(p.nvK||0)+((((exploded||focusId==='almacenamiento')&&p.nv.length)?1:0)-(p.nvK||0))*k;var ke=p.nvK;p.nv.forEach(function(f){f.o.position.set(f.b.x+10*ke,f.b.y-11*ke,f.b.z+14.5*ke)})}
    var ts=exploded?(POSE[id].expl.s||1):1;p.sc+=(ts-p.sc)*k;var pu=0;
    if(p.pulse>0){p.pulse=Math.max(0,p.pulse-dt*2.2);pu=.06*Math.sin(p.pulse*Math.PI)}
    p.root.scale.setScalar(p.sc*(1+pu));
    var dt2=(focusId&&!exploded&&focusId!==id)?1:0;p.dim+=(dt2-p.dim)*k;
    var strong=id==='placa'?.55:.95,a=p.dim*strong;
    if(p.fans&&p.fans.length){p.fans.forEach(function(f){f.o.traverse(function(o){if(o.isSprite)o.visible=!exploded})})}
    p.mats.forEach(function(m,i){var b=p.base[i];
      if(a>.01){m.transparent=true;m.opacity=b.o*(1-a);m.depthWrite=a<.45&&b.w}else{m.transparent=b.t;m.opacity=b.o;m.depthWrite=b.w}});
    if(exploded&&p.fanMats&&p.fanMats.length){p.fanMats.forEach(function(q){q.m.transparent=true;q.m.opacity=q.b.o*.16;q.m.depthWrite=false})}
  });
  var g=goal();
  if(tw){
    var kk=smooth((performance.now()-tw.t0)/tw.ms);
    var tgt=tw.fromT.clone().lerp(g.tgt,kk),dir=tw.fromDir.clone().lerp(g.dir,kk).normalize(),d=tw.fromD+(g.d-tw.fromD)*kk;
    controls.target.copy(tgt);camera.position.copy(tgt).add(dir.multiplyScalar(d));
    if(kk>=1){tw=null;controls.enabled=opened}
  }else if(!userMoved){controls.target.copy(g.tgt);camera.position.copy(g.pos);controls.enabled=opened}
  controls.update();
  var wantSel=focusId&&!exploded?focusId:null;
  if(wantSel){
    if(!selBox||selBox.userData.id!==wantSel){if(selBox)scene.remove(selBox);
      var sb=new T.BoxHelper(parts[wantSel].root,ACC);sb.userData.id=wantSel;sb.material.transparent=true;sb.material.opacity=.9;selBox=sb;scene.add(sb)}
    selBox.update()
  }else if(selBox){scene.remove(selBox);selBox=null}
  draw();
  updateLabels();
}

var caseBox=new T.Box3(),cbv=[];for(var cbi=0;cbi<8;cbi++)cbv.push(new T.Vector3());
function updateLabels(){
  if(!opened)return;
  var w=lastW,h=lastH,items=[];
  // silueta de la caja en pantalla, para sacar los rótulos fuera de la torre
  if(!caseBox._d){caseBox.set(new T.Vector3(-23.7,-24.7,-10.7),new T.Vector3(23.7,24.7,10.7));caseBox._d=1}
  var mn=caseBox.min,mx=caseBox.max,minX=1e9,maxX=-1e9,q=0;
  for(var xi=0;xi<2;xi++)for(var yi=0;yi<2;yi++)for(var zi=0;zi<2;zi++){
    cbv[q].set(xi?mx.x:mn.x,yi?mx.y:mn.y,zi?mx.z:mn.z).project(camera);
    var px=(cbv[q].x*.5+.5)*w;minX=Math.min(minX,px);maxX=Math.max(maxX,px);q++}
  var cx=reg.x+reg.w/2,padL=reg.x+16,padR=reg.x+reg.w-16;
  ORDER.forEach(function(id){
    var m=meta[id],p=parts[id],st=labelState(id);
    if(m.el.dataset.state!==st)m.el.dataset.state=st;
    if(st==='hidden')return;
    tmpV.copy(p.anchor);p.root.localToWorld(tmpV);
    if(id==='cpu'||id==='ram')tmpV.z+=2;
    tmpV.project(camera);
    var x=(tmpV.x*.5+.5)*w,y=(-tmpV.y*.5+.5)*h;
    m.el.style.visibility=tmpV.z>1?'hidden':'visible';
    items.push({id:id,m:m,x:x,y:y,st:st,side:x<cx?-1:1});
  });
  var leader=!!(focusId||exploded);
  labelBox.classList.toggle('ex',!!exploded);
  if(exploded){
    minX=1e9;maxX=-1e9;
    ORDER.forEach(function(id){var b=new T.Box3().setFromObject(parts[id].root);
      for(var a1=0;a1<2;a1++)for(var a2=0;a2<2;a2++)for(var a3=0;a3<2;a3++){
        var pv=new T.Vector3(a1?b.max.x:b.min.x,a2?b.max.y:b.min.y,a3?b.max.z:b.min.z).project(camera),sx=(pv.x*.5+.5)*w;minX=Math.min(minX,sx);maxX=Math.max(maxX,sx)}});
    items.sort(function(a,b){return a.x-b.x});
    items.forEach(function(it,k){it.side=k<Math.ceil(items.length/2)?-1:1});
  }
  if(!leader){
    items.forEach(function(i){
      var o=exploded?(XOFF[i.id]||[0,0]):[0,0],el=i.m.el;
      el.classList.remove('ld');el.classList.toggle('tl',!!(exploded&&XOFF[i.id]&&XOFF[i.id][2]));
      el.style.transform='translate('+(i.x+o[0]).toFixed(1)+'px,'+(i.y+o[1]).toFixed(1)+'px)';
      var ln=el.firstChild.nextSibling;ln.style.width='0px';ln.nextSibling.style.transform='none'});
    return}
  if(focusId&&!exploded&&items.length===1){
    var it=items[0],pb=new T.Box3().setFromObject(parts[focusId].root),bx0=1e9,bx1=-1e9,by0=1e9,by1=-1e9,pq=0,cv=[];
    for(var a1=0;a1<2;a1++)for(var a2=0;a2<2;a2++)for(var a3=0;a3<2;a3++){
      var pv=new T.Vector3(a1?pb.max.x:pb.min.x,a2?pb.max.y:pb.min.y,a3?pb.max.z:pb.min.z).project(camera);
      var sx=(pv.x*.5+.5)*w,sy=(-pv.y*.5+.5)*h;bx0=Math.min(bx0,sx);bx1=Math.max(bx1,sx);by0=Math.min(by0,sy);by1=Math.max(by1,sy)}
    var spEl=it.m.el.querySelector('span'),tw=(spEl&&spEl.offsetWidth)||190,th=46,rx0=reg.x+14,rx1=reg.x+reg.w-14,ry0=reg.y+14,ry1=reg.y+reg.h-64;
    function hit(cx,cy,left){var x0=left?cx-tw-34:cx-16,x1=left?cx+16:cx+tw+34,y0=cy-th/2,y1=cy+th/2;
      if(x0<rx0||x1>rx1||y0<ry0||y1>ry1)return true;return !(x1<bx0-6||x0>bx1+6||y1<by0-6||y0>by1+6)}
    var cands=[[Math.min(Math.max(it.x,rx0+20),rx1-tw-40),by0-34,0],[Math.min(Math.max(it.x,rx0+20),rx1-tw-40),by1+34,0],
      [bx1+34,it.y,0],[bx0-34,it.y,1],[rx0+26,ry0+26,0],[rx1-26,ry0+26,1],[rx0+26,ry1-26,0],[rx1-26,ry1-26,1]],pick2=cands[4];
    for(var ci=0;ci<cands.length;ci++){if(!hit(cands[ci][0],cands[ci][1],cands[ci][2])){pick2=cands[ci];break}}
    var ddx=pick2[0]-it.x,ddy=pick2[1]-it.y,el0=it.m.el,ln0=el0.firstChild.nextSibling;
    el0.style.transform='translate('+it.x.toFixed(1)+'px,'+it.y.toFixed(1)+'px)';
    ln0.style.width=Math.hypot(ddx,ddy).toFixed(1)+'px';ln0.style.transform='rotate('+Math.atan2(ddy,ddx).toFixed(4)+'rad)';
    ln0.nextSibling.style.transform='translate('+ddx.toFixed(1)+'px,'+ddy.toFixed(1)+'px)';
    el0.classList.add('ld');el0.classList.toggle('tl',!!pick2[2]);
    return}
  if(items.length===1){ // un solo rótulo: del lado con más espacio
    var it0=items[0];it0.side=(it0.x-padL)>(padR-it0.x)?-1:1}
  [-1,1].forEach(function(sd){
    var g=items.filter(function(i){return i.side===sd}).sort(function(a,b){return a.y-b.y});
    var gap=g.some(function(i){return i.st==='full'})?50:34,k;
    g.forEach(function(i){i.ty=i.y});
    for(k=1;k<g.length;k++)if(g[k].ty-g[k-1].ty<gap)g[k].ty=g[k-1].ty+gap;
    var over=g.length?g[g.length-1].ty-(reg.y+reg.h-30):0;
    if(over>0)g.forEach(function(i){i.ty-=over});
    var under=g.length?(reg.y+30)-g[0].ty:0;
    if(under>0)g.forEach(function(i){i.ty+=under});
    g.forEach(function(i){
      var tx=sd<0?Math.max(padL+26,minX-34):Math.min(padR-26,maxX+34);
      var dx=tx-i.x,dy=i.ty-i.y,len=Math.hypot(dx,dy),el=i.m.el;
      el.style.transform='translate('+i.x.toFixed(1)+'px,'+i.y.toFixed(1)+'px)';
      var ln=el.firstChild.nextSibling,tg=ln.nextSibling;
      ln.style.width=len.toFixed(1)+'px';ln.style.transform='rotate('+Math.atan2(dy,dx).toFixed(4)+'rad)';
      tg.style.transform='translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px)';
      var tw2=(i.m.el.querySelector('span').offsetWidth)||150,tlv=sd<0?(tx-tw2-40>=padL):!(tx+tw2+40<=padR);el.classList.add('ld');el.classList.toggle('tl',tlv)});
  });
}
})();
