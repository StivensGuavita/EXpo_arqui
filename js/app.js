(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var usd=function(n){return 'US$ '+n.toLocaleString('es-CO')};
var TIERS=['Básico','Recomendado','Extremo'];
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- datos ---------- */
var PARTS=[
{id:'cpu',n:'Procesador (CPU)',short:'CPU',
 role:'Ejecuta las instrucciones de los programas y reparte el trabajo. Es el director de orquesta del computador.',
 why:'Filtrar, clasificar y alinear nubes de puntos, y calcular la fotogrametría de cientos de fotos, se reparte entre muchos hilos de ejecución. Más núcleos acortan esas horas; una frecuencia alta mantiene fluido el manejo del modelo y de QGIS.',
 tags:['DJI Terra','Pix4D','Metashape','QGIS','Planificación de misiones'],
 say:'“Elegimos 8 núcleos y 65 W. El de 16 núcleos rinde cerca del doble, pero cuesta más y consume más de dos veces la energía.”',
 metrics:['Multihilo','Un solo hilo','Ajuste a la empresa'],
 tiers:[
  {model:'Ryzen 5 9600X',lbl:'9600X',price:230,specs:['6 núcleos · 12 hilos','Hasta 5,4 GHz','65 W de consumo'],m:[40,95,55],verdict:'Alcanza para planificar misiones y mapas pequeños. En fotogrametría grande el trabajo se alarga.'},
  {model:'Ryzen 7 9700X',lbl:'9700X',price:330,specs:['8 núcleos · 16 hilos','Hasta 5,5 GHz','65 W de consumo'],m:[54,97,95],verdict:'Equilibrio: 8 núcleos con solo 65 W. Procesa mapeos medianos sin pasarse de presupuesto.'},
  {model:'Ryzen 9 9950X',lbl:'9950X',price:550,specs:['16 núcleos · 32 hilos','Hasta 5,7 GHz','170 W de consumo'],m:[100,100,45],verdict:'Casi duplica el multihilo, pero también el costo y el consumo. Se justifica con proyectos enormes todos los días.'}]},
{id:'gpu',n:'Tarjeta gráfica (GPU)',short:'GPU',
 role:'Miles de núcleos pequeños que calculan en paralelo y dibujan la imagen. Tiene su propia memoria, la VRAM.',
 why:'Las etapas más pesadas de la fotogrametría, como densificar la nube de puntos y generar la malla, se aceleran con CUDA. La VRAM decide cuántos millones de puntos se pueden mostrar sin que el visor se trabe.',
 tags:['CUDA','VRAM','Nube de puntos','Malla 3D','Ortomosaico'],
 say:'“Es el componente donde conviene invertir: más VRAM significa proyectos más grandes sin que el programa falle por falta de memoria.”',
 metrics:['Cómputo (CUDA)','Memoria de video (VRAM)','Ajuste a la empresa'],
 tiers:[
  {model:'GeForce RTX 5060',lbl:'5060',price:300,specs:['8 GB GDDR7','3.840 núcleos CUDA','145 W'],m:[24,25,55],verdict:'Con 8 GB de VRAM las nubes densas se traban o fallan por falta de memoria.'},
  {model:'GeForce RTX 5060 Ti',lbl:'5060 Ti',price:430,specs:['16 GB GDDR7','4.608 núcleos CUDA','180 W'],m:[30,50,95],verdict:'16 GB de VRAM: lo mínimo cómodo para nubes grandes y modelos 3D. Aquí rinde más cada peso.'},
  {model:'GeForce RTX 5090',lbl:'5090',price:2300,specs:['32 GB GDDR7','21.760 núcleos CUDA','575 W'],m:[100,100,35],verdict:'Potencia de sobra, pero cuesta unas cinco veces más y exige fuente de 1000 W. Sobredimensionada para esta empresa.'}]},
{id:'ram',n:'Memoria RAM',short:'RAM',
 role:'Memoria de trabajo: guarda lo que el procesador está usando en este momento. Es rápida, pero se borra al apagar.',
 why:'Un lote de fotos o una nube de puntos se carga casi completo en RAM. Si no cabe, el sistema usa el disco como respaldo y todo se vuelve mucho más lento.',
 tags:['DDR5','Doble canal','Lotes de fotos','Nubes LAS/LAZ'],
 say:'“32 GB cubren los mapeos medianos, y la placa deja espacio para llegar a 64 GB cuando el trabajo lo pida.”',
 metrics:['Capacidad','Velocidad (DDR5)','Ajuste a la empresa'],
 tiers:[
  {model:'16 GB DDR5-5600',lbl:'16 GB',price:90,specs:['2 × 8 GB','DDR5-5600','Poco margen de crecimiento'],m:[25,85,45],verdict:'Se queda corta: con lotes grandes el sistema usa el disco y todo se vuelve lento.'},
  {model:'32 GB DDR5-6000',lbl:'32 GB',price:170,specs:['2 × 16 GB','DDR5-6000','2 ranuras libres para ampliar'],m:[50,92,95],verdict:'Alcanza para mapeos medianos y deja ranuras libres para llegar a 64 GB.'},
  {model:'64 GB DDR5-6000',lbl:'64 GB',price:340,specs:['2 × 32 GB','DDR5-6000','Hasta 128 GB después'],m:[100,92,60],verdict:'Sobra para casi todo. Solo se justifica con proyectos de ciudades o miles de fotos de alta resolución.'}]},
{id:'almacenamiento',n:'Almacenamiento',short:'Almacenamiento',
 role:'Guarda el sistema, los programas y los datos de cada vuelo. Todo en SSD: rápido para trabajar y con capacidad para archivar.',
 why:'Cada vuelo deja cientos de fotos y archivos LAS/LAZ de varios GB. Se trabaja sobre el NVMe, que carga datos en segundos, y se archiva en un SSD SATA de gran capacidad. Una copia en la nube o en un NAS protege el trabajo.',
 tags:['NVMe PCIe','SSD SATA','Respaldo','LAS/LAZ'],
 say:'“Todo el almacenamiento es SSD: el NVMe para trabajar a máxima velocidad y un SSD SATA grande para archivar los vuelos, sin partes móviles que se dañen.”',
 metrics:['Velocidad','Capacidad total','Ajuste a la empresa'],
 tiers:[
  {model:'SSD NVMe 512 GB',lbl:'512 GB',price:50,specs:['NVMe PCIe 3.0','≈ 3.500 MB/s','Sin disco de archivo'],m:[30,10,35],verdict:'Rápido pero pequeño: cada vuelo ocupa decenas de GB y se llena en semanas.'},
  {model:'SSD NVMe 1 TB + SSD SATA 2 TB',lbl:'1 TB + 2 TB',price:200,specs:['NVMe PCIe 4.0','≈ 7.000 MB/s','SSD SATA de 2 TB para archivo'],m:[58,50,95],verdict:'NVMe para trabajar y SSD SATA para archivar los vuelos: todo rápido y sin partes móviles.'},
  {model:'SSD NVMe 2 TB + SSD SATA 4 TB',lbl:'2 TB + 4 TB',price:450,specs:['NVMe PCIe 5.0','≈ 12.000 MB/s','SSD SATA de 4 TB para archivo'],m:[100,100,55],verdict:'Más veloz y grande, pero casi no cambia el tiempo de proceso: el cuello está en CPU y GPU.'}]},
{id:'placa',n:'Placa madre',short:'Placa',
 role:'Conecta todos los componentes y reparte datos y energía entre ellos. Define cuánto se puede ampliar el equipo.',
 why:'Determina cuántos discos NVMe, módulos de RAM y puertos USB se pueden agregar: tarjetas SD de los drones, controles remotos, equipos de radar por red. Una buena placa evita cambiar todo el equipo en dos años.',
 tags:['Socket AM5','PCIe','USB','Ethernet','Ampliación'],
 say:'“La placa no hace más rápido el equipo, pero decide si podemos crecer sin comprar otro computador.”',
 metrics:['Expansión','Conectividad','Ajuste a la empresa'],
 tiers:[
  {model:'Placa A620 (mATX)',lbl:'A620',price:100,specs:['Socket AM5 · DDR5','PCIe 4.0','Pocas ranuras M.2 y USB'],m:[35,40,50],verdict:'Cumple, pero con pocas ranuras M.2 y puertos. Limita ampliaciones futuras.'},
  {model:'Placa B650 (ATX)',lbl:'B650',price:180,specs:['Socket AM5 · DDR5','PCIe 4.0 (algunas 5.0)','Varias M.2 y red 2,5 GbE'],m:[70,65,95],verdict:'Permite llegar a 64–128 GB de RAM y sumar discos, a un precio razonable.'},
  {model:'Placa X870E (ATX)',lbl:'X870E',price:450,specs:['Socket AM5 · DDR5','PCIe 5.0 en GPU y discos','USB4 y Wi-Fi 7'],m:[100,100,40],verdict:'Pensada para overclock y PCIe 5.0 en todo. No aporta velocidad real a este trabajo.'}]},
{id:'fuente',n:'Fuente de poder',short:'Fuente',
 role:'Convierte la corriente de la pared en los voltajes que usa cada componente.',
 why:'Un procesamiento puede durar diez horas seguidas. Con una fuente justa, el equipo se reinicia justo a mitad del trabajo. La GPU es quien más consume, así que la fuente se dimensiona según ella.',
 tags:['Vatios','80+ Gold','Estabilidad','UPS'],
 say:'“La fuente se elige por la GPU, y además protege a todo lo demás.”',
 metrics:['Potencia disponible','Eficiencia','Ajuste a la empresa'],
 tiers:[
  {model:'Fuente 550 W · 80+ Bronze',lbl:'550 W',price:60,specs:['550 W continuos','Eficiencia ≈ 85 %','Poco margen'],m:[55,70,50],verdict:'Alcanza para la GPU básica, sin margen para ampliar.'},
  {model:'Fuente 750 W · 80+ Gold',lbl:'750 W',price:110,specs:['750 W continuos','Eficiencia ≈ 90 %','Margen para cambiar la GPU'],m:[75,85,95],verdict:'Margen amplio y buena eficiencia: estable y silenciosa en procesos de horas.'},
  {model:'Fuente 1000 W · 80+ Platinum',lbl:'1000 W',price:220,specs:['1000 W continuos','Eficiencia ≈ 92 %','Conector 12V-2x6 para GPU extrema'],m:[100,95,45],verdict:'Necesaria si se usa una GPU extrema; para el resto del sistema sobra.'}]},
{id:'refrigeracion',n:'Refrigeración',short:'Refrigeración',
 role:'Saca el calor del procesador para que mantenga su velocidad.',
 why:'Un mapeo grande mantiene la CPU al 100 % durante horas. Si se calienta de más, baja su frecuencia (thermal throttling) y el trabajo tarda más sin avisar.',
 tags:['Throttling','TDP','Ventiladores','Ruido'],
 say:'“Un buen disipador de aire mantiene la velocidad sostenida sin bombas ni líquido, que es menos mantenimiento.”',
 metrics:['Capacidad de enfriamiento','Silencio','Ajuste a la empresa'],
 tiers:[
  {model:'Disipador de aire sencillo',lbl:'',price:30,specs:['1 ventilador de 120 mm','Hasta ≈ 120 W de calor','Más ruido a carga alta'],m:[40,50,55],verdict:'Mantiene una CPU de 65 W, pero con ruido al sostener el 100 % por horas.'},
  {model:'Disipador de aire de torre doble',lbl:'',price:45,specs:['2 ventiladores · torre doble','Hasta ≈ 220 W de calor','Sin bombas ni fugas'],m:[70,80,95],verdict:'Silencioso y sin throttling en procesos largos, con menos piezas que pueden fallar.'},
  {model:'Refrigeración líquida AIO 360 mm',lbl:'',price:140,specs:['3 ventiladores · radiador 360 mm','Más de 250 W de calor','Bomba y líquido: más piezas'],m:[100,65,45],verdict:'Imprescindible para una CPU de 170 W; para una de 65 W es más de lo necesario.'}]}
];
var byId={};PARTS.forEach(function(p){byId[p.id]=p});
var ORDER=PARTS.map(function(p){return p.id});
var SEQ=['torre'].concat(ORDER,['resumen','precios']);
var sel={};ORDER.forEach(function(id){sel[id]=1});
var view='intro',opened=false,SRC='amazon';
var PC2={id:2,monitor3d:{inch:27,kind:'map',logo:'ProArt'},brand:'Estación de Mapeo',company:'',noteTotal:'incluye chasis y monitor; sin licencias',limLabel:'Proyecto cómodo',lim:null,extras:[{n:'Chasis ATX con flujo de aire',model:'Corsair 4000D RS ARGB Frame (torre ATX con frente de malla)',usd:93.28,cop:410000},{n:'Monitor 27" QHD calibrado',model:'ASUS ProArt PA278QV 27 pulgadas 2560 × 1440 IPS, 100 % sRGB',usd:229.03,cop:1189000}],loads:null,parts:PARTS,prices:window.PRICES_DEFAULT,labels3d:null};
var PC=PC2,PKEY='estacion-precios-v3',OLDKEY='estacion-precios-old';

/* ---------- precios (Amazon y tienda local) ---------- */
var PR=loadPrices();
function loadPrices(def,key,old){
  def=def||window.PRICES_DEFAULT;key=key||'estacion-precios-v3';old=old||'estacion-precios-old';
  var d=JSON.parse(JSON.stringify(def));
  try{
    var sv=JSON.parse(localStorage.getItem(key)||'null');
    if(!sv){var o=JSON.parse(localStorage.getItem(old)||'null');if(o)sv={localCOP:o.localCOP,tienda:o.tienda,src:o.src}}
    if(sv){
      if(sv.trm>0)d.trm=sv.trm;if(sv.recargo>=0)d.recargo=sv.recargo;if(sv.tienda)d.tienda=sv.tienda;
      if(sv.src)SRC=sv.src;
      ORDER.forEach(function(id){
        if(sv.localCOP&&sv.localCOP[id])d.localCOP[id]=sv.localCOP[id];
        if(sv.amazonUSD&&sv.amazonUSD[id]&&!(id==='almacenamiento'&&JSON.stringify(sv.amazonUSD[id])==='[50,160,380]'))d.amazonUSD[id]=sv.amazonUSD[id];
      });
    }
  }catch(e){}
  return d;
}
function savePrices(){
  try{localStorage.setItem(PKEY,JSON.stringify({trm:PR.trm,recargo:PR.recargo,tienda:PR.tienda,src:SRC,localCOP:PR.localCOP,amazonUSD:PR.amazonUSD}))}catch(e){}
}
function cop(n){return '$ '+Math.round(n).toLocaleString('es-CO')}
function copS(n){return n>=1e6?'$ '+(n/1e6).toFixed(2).replace('.',',')+' M':'$ '+Math.round(n/1000)+' mil'}
function amz(id,i){return Math.round(PR.amazonUSD[id][i]*PR.trm*(1+PR.recargo/100)/1000)*1000}
function loc(id,i){var v=+PR.localCOP[id][i];return v>0?v:null}
function pr(id,i,src){
  src=src||SRC;var a=amz(id,i),l=loc(id,i);
  if(src==='amazon')return a;
  if(src==='local')return l!==null?l:a;
  return l!==null?Math.min(a,l):a;
}
function extraA(){var t=0;(PC.extras||[]).forEach(function(e){t+=Math.round(e.usd*PR.trm*(1+PR.recargo/100)/1000)*1000});return t}
function extraL(){var t=0;(PC.extras||[]).forEach(function(e){t+=e.cop>0?e.cop:Math.round(e.usd*PR.trm*(1+PR.recargo/100)/1000)*1000});return t}
function extraOne(e,src){src=src||SRC;var a=Math.round(e.usd*PR.trm*(1+PR.recargo/100)/1000)*1000,l=e.cop>0?e.cop:a;return src==='amazon'?a:src==='local'?l:Math.min(a,l)}
function extraCost(src){src=src||SRC;var a=extraA(),l=extraL();return src==='amazon'?a:src==='local'?l:Math.min(a,l)}
function srcName(){return SRC==='amazon'?'Amazon':SRC==='local'?PR.tienda:'La más barata'}
function missingLocal(s){return ORDER.filter(function(id){return loc(id,s[id])===null}).length}
function segHTML(){
  var o=[['amazon','Amazon'],['local','Tienda local'],['min','Más barata']];
  return '<div class="seg" role="group" aria-label="Fuente del precio">'+o.map(function(x){
    return '<button type="button" data-src="'+x[0]+'" aria-pressed="'+(SRC===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>';
}

var LOADS=[
 {t:'Mapeo con LiDAR y fotogrametría',d:'Millones de puntos y miles de fotos por proyecto.',to:['gpu','ram','cpu']},
 {t:'Planificación de fumigación y GIS',d:'Mapas, rutas de vuelo y análisis de cultivos.',to:['cpu','almacenamiento']},
 {t:'Datos de radar y telemetría',d:'Archivos que llegan por red, USB o tarjeta SD.',to:['placa','almacenamiento']},
 {t:'Trabajo continuo de muchas horas',d:'El equipo no puede apagarse ni bajar su velocidad.',to:['refrigeracion','fuente']}
];
PC2.loads=LOADS;

/* ---------- torre 3D ---------- */
var T3=window.Tower3D,glOK=false,exploded=false;
function setupGL(){
  try{glOK=!!T3&&T3.init($('#gl'),{labels:$('#labels'),region:$('#towerCell'),events:$('#towerCell'),
    onOpen:function(){},
    onBackground:function(){if(ORDER.indexOf(view)>=0&&!exploded)go('torre')},
    onPick:function(id){go(id)},
    onHover:function(){}})}catch(e){glOK=false;if(window.console)console.error(e)}
  if(!glOK){$('#glFail').hidden=false}
  else PARTS.forEach(function(p){T3.setLabel(p.id,p.n,tierOf(p.id).model)});
}
function setExplode(on){
  exploded=on;var b=$('#btnExplode');if(b)b.setAttribute('aria-pressed',on?'true':'false');
  if(glOK)T3.explode(on);
}

/* ---------- cálculo ---------- */
function tierOf(id,s){return byId[id].tiers[(s||sel)[id]]}
function calc(s,src){
  var t=function(id){return tierOf(id,s)},total=0;
  PARTS.forEach(function(p){total+=pr(p.id,s[p.id],src)});total+=extraCost(src);
  var perf=Math.round(.35*t('gpu').m[0]+.30*t('cpu').m[0]+.20*t('ram').m[0]+.15*t('almacenamiento').m[0]);
  var limTxt;
  if(PC.lim){limTxt=PC.lim(t)}else{var lim=Math.min(t('ram').m[0],t('gpu').m[1]);
  limTxt=lim<=25?'Parcelas y lotes pequeños':lim<=50?'Fincas y obras medianas':'Ciudades y proyectos grandes'}
  var w=[],trio=['cpu','gpu','ram'];
  var mn=Math.min.apply(null,trio.map(function(i){return s[i]})),mx=Math.max.apply(null,trio.map(function(i){return s[i]}));
  if(mx-mn>=2){
    var low=trio.filter(function(i){return s[i]===mn}).map(function(i){return byId[i].short}).join(' y ');
    w.push({k:'warn',h:'Cuello de botella',t:'El nivel '+TIERS[mn].toLowerCase()+' de '+low+' frena a los componentes más potentes: lo invertido arriba no se aprovecha.'});
  }
  if(s.fuente<s.gpu)w.push({k:'warn',h:'Fuente insuficiente',t:'La fuente de '+t('fuente').lbl+' no alcanza para la GPU '+t('gpu').lbl+'. Puede apagarse con la GPU a plena carga.'});
  if(!PC.noThrottleWarn&&s.cpu===2&&s.refrigeracion<2)w.push({k:'warn',h:'Riesgo de throttling',t:'Una CPU de 170 W necesita refrigeración líquida de 360 mm. Con este disipador bajará su frecuencia en cargas largas.'});
  if(PC.id===2&&s.placa===0&&s.almacenamiento===2)w.push({k:'warn',h:'Disco subutilizado',t:'La placa A620 no tiene M.2 PCIe 5.0, así que el disco extremo trabaja a velocidad PCIe 4.0.'});
  var n2=ORDER.filter(function(i){return s[i]===2}).length,n0=ORDER.filter(function(i){return s[i]===0}).length;
  if(n2>=3)w.push({k:'info',h:'Sobredimensionado',t:'Hay '+n2+' componentes en nivel extremo. Se paga rendimiento que este flujo de trabajo no aprovecha.'});
  if(n0>=3)w.push({k:'info',h:'Ahorro con riesgo',t:'Hay '+n0+' componentes básicos. Se ahorra hoy, pero los proyectos grandes irán lentos.'});
  if(!w.length)w.push({k:'ok',h:'Configuración equilibrada',t:'Ningún componente frena a otro y la fuente y la refrigeración alcanzan.'});
  return {total:total,perf:perf,lim:limTxt,warn:w,ppp:Math.round(total/perf)};
}

/* ---------- plantillas ---------- */
function lvlHTML(n){return '<span class="lvl" title="Nivel '+TIERS[n]+'"><i class="'+(n>=0?'on':'')+'"></i><i class="'+(n>=1?'on':'')+'"></i><i class="'+(n>=2?'on':'')+'"></i></span>'}
function bar(m,v,fit){return '<div class="bar'+(fit?' fit':'')+'"><span>'+m+'</span><b>'+v+'</b><span class="track"><i style="--v:'+v+'"></i></span></div>'}
function tierCard(p,i){
  var t=p.tiers[i],on=sel[p.id]===i,d=pr(p.id,i)-pr(p.id,1),a=amz(p.id,i),l=loc(p.id,i);
  var dt=i===1?'Precio de referencia':(d>0?'+':'−')+copS(Math.abs(d))+' frente al recomendado';
  return '<div class="tier'+(on?' on':'')+(i===1?' rec':'')+'" role="radio" aria-checked="'+on+'" tabindex="0" data-tier="'+i+'">'+
   '<div class="t-top"><span class="chip-t">'+TIERS[i]+'</span>'+(on?'<span class="inuse">En la torre</span>':'')+'</div>'+
   '<h4 class="model">'+t.model+'</h4>'+
   '<div class="price"><div class="pr2"><span class="s a">Amazon</span><b>'+(a>0?cop(a):'Incluido')+'</b></div><div class="pr2"><span class="s l">Local</span><b>'+(l!==null?cop(l):'<em>sin dato</em>')+'</b></div><small>'+dt+'</small></div>'+
   '<ul class="specs">'+t.specs.map(function(s){return '<li>'+s+'</li>'}).join('')+'</ul>'+
   '<div class="bars">'+p.metrics.map(function(m,k){return bar(m,t.m[k],k===2)}).join('')+'</div>'+
   '<p class="verdict">'+t.verdict+'</p></div>';
}
function renderPart(id){
  var p=byId[id],idx=ORDER.indexOf(id);
  return '<div class="p-head"><div class="eyebrow"><span>Componente '+(idx+1)+' de 7</span><span class="pn"><button class="nb" data-nav="-1" aria-label="Anterior">←</button><button class="nb" data-nav="1" aria-label="Siguiente">→</button></span></div>'+
   '<h2>'+p.n+'</h2><p class="role">'+p.role+'</p></div>'+
   '<section class="why"><h3>Por qué importa en esta empresa</h3><p>'+p.why+'</p><div class="tags">'+p.tags.map(function(t){return '<span>'+t+'</span>'}).join('')+'</div></section>'+
   '<section><div class="sec-h"><h3>Compara tres niveles</h3>'+segHTML()+'</div>'+
   '<div class="tier-wrap"><div class="tier-grid" role="radiogroup" aria-label="Nivel de '+p.short+'">'+[0,1,2].map(function(i){return tierCard(p,i)}).join('')+'</div></div></section>'+
   '<section><div class="sec-h"><h3>Precio por fuente</h3></div>'+pairChart([0,1,2].map(function(i){return {label:TIERS[i],a:amz(id,i),l:loc(id,i),on:sel[id]===i}}))+'</section>'+
   '<section class="say"><h3>Para decir en voz alta</h3><blockquote>'+p.say+'</blockquote></section>';
}
function pairChart(items){
  var mx=1;items.forEach(function(x){mx=Math.max(mx,x.a,x.l||0)});
  return '<div class="pairs"><div class="legend"><span><i class="a"></i>Amazon</span><span><i class="l"></i>'+PR.tienda+'</span></div>'+items.map(function(x){
    var dif='';
    if(x.l!==null&&x.l!==undefined&&x.a>0){var d=Math.round((x.l-x.a)/x.a*100);dif='<em class="'+(d<=0?'good':'bad')+'">'+(d<=0?'Local '+Math.abs(d)+' % más barata':'Local '+d+' % más cara')+'</em>'}
    return '<div class="pgrp'+(x.on?' on':'')+'"><div class="pl"><b>'+x.label+'</b>'+dif+'</div>'+
      '<div class="pb"><span class="bar-a" style="--w:'+(x.a/mx*100).toFixed(1)+'%"></span><b>'+copS(x.a)+'</b></div>'+
      '<div class="pb">'+(x.l!==null&&x.l!==undefined?'<span class="bar-l" style="--w:'+(x.l/mx*100).toFixed(1)+'%"></span><b>'+copS(x.l)+'</b>':'<span class="bar-none">sin dato</span>')+'</div></div>'}).join('')+'</div>';
}
function totalsFor(k,src){var s={};ORDER.forEach(function(i){s[i]=k});return calc(s,src).total}
function localTotal(k){var s=0;for(var i=0;i<ORDER.length;i++){var v=loc(ORDER[i],k);if(v===null)return null;s+=v}return s+extraL()}
function chartsHTML(){
  var rows=ORDER.map(function(id){var i=sel[id];return {label:byId[id].short+' · '+TIERS[i],a:amz(id,i),l:loc(id,i)}});
  var tot=[0,1,2].map(function(k){var a=0;ORDER.forEach(function(id){a+=amz(id,k)});a+=extraA();return {label:'Todo '+TIERS[k].toLowerCase(),a:a,l:localTotal(k)}});
  return '<section><h3>Tu configuración, componente por componente</h3>'+pairChart(rows)+'</section>'+
    '<section><h3>Las tres configuraciones completas</h3>'+pairChart(tot)+'</section>';
}
function renderPrecios(){
  var rows=ORDER.map(function(id){var p=byId[id];
    return '<div class="pgroup"><h4>'+p.n+'</h4>'+[0,1,2].map(function(i){var t=p.tiers[i];
      return '<div class="prow" data-row="'+id+'-'+i+'"><span class="pm"><span class="chip-t">'+TIERS[i]+'</span>'+t.model+'</span>'+
        '<label>Amazon US$<input type="number" min="0" step="1" inputmode="decimal" data-k="a" data-id="'+id+'" data-i="'+i+'" value="'+PR.amazonUSD[id][i]+'"></label>'+
        '<span class="cell" data-acop="'+id+'-'+i+'">'+cop(amz(id,i))+'</span>'+
        '<label>Local $ COP<input type="number" min="0" step="1000" inputmode="numeric" data-k="l" data-id="'+id+'" data-i="'+i+'" value="'+(loc(id,i)||'')+'" placeholder="escribe el precio"></label>'+
        '<span class="cell" data-dif="'+id+'-'+i+'"></span>'+
        '<a class="link" target="_blank" rel="noopener" href="https://www.amazon.com/s?k='+encodeURIComponent(t.model)+'">Buscar en Amazon</a></div>'}).join('')+'</div>'}).join('');
  return '<div class="p-head"><div class="eyebrow"><span>Precios en pesos colombianos</span><span class="pn"><button class="nb" data-nav="-1" aria-label="Anterior">←</button></span></div>'+
   '<h2>Amazon frente a la tienda local</h2></div>'+
   '<section><h3>Ajustes</h3><div class="settings">'+
   '<label>Nombre de la tienda local<input type="text" data-k="tienda" value="'+PR.tienda.replace(/"/g,'&quot;')+'"></label>'+
   '<label>TRM (pesos por dólar)<input type="number" min="1" step="10" data-k="trm" value="'+PR.trm+'"></label>'+
   '<label>Recargo de importación (%)<input type="number" min="0" step="1" data-k="recargo" value="'+PR.recargo+'"></label></div>'+
   '</section>'+
   '<div id="pcharts">'+chartsHTML()+'</div>'+
   '<section><h3>Precios por componente</h3><div class="ptable">'+rows+'</div>'+
   '<p class="fine">Precios de Amazon estimados: verifícalos antes de exponer.'+((PC.extras&&PC.extras.length)?' Incluido en los totales: '+PC.extras.map(function(e){return e.n+' (Amazon US$ '+e.usd+' · '+PR.tienda+' '+cop(e.cop)+')'}).join(' · ')+'.':'')+'</p></section>';
}
function refreshPrecios(){
  var c=$('#pcharts');if(c)c.innerHTML=chartsHTML();
  ORDER.forEach(function(id){[0,1,2].forEach(function(i){
    var k=id+'-'+i,a=amz(id,i),l=loc(id,i),ac=$('[data-acop="'+k+'"]'),df=$('[data-dif="'+k+'"]');
    if(ac)ac.textContent=cop(a);
    if(df){if(l===null||a<=0){df.textContent='—';df.className='cell'}else{var d=Math.round((l-a)/a*100);df.textContent=d<=0?'Local '+Math.abs(d)+' % más barata':'Local '+d+' % más cara';df.className='cell '+(d<=0?'good':'bad')}}
  })});
}
function renderOverview(){
  return '<div class="p-head"><div class="eyebrow"><span>Vista general'+(PC.company?' · '+PC.company:'')+'</span><span class="pn"><button class="nb" data-nav="1" aria-label="Siguiente">→</button></span></div>'+
   '<h2>Por dentro de la torre</h2></div>'+
   '<section><h3>Qué le exige la empresa al computador</h3><ul class="loads">'+LOADS.map(function(l){
     return '<li><b>'+l.t+'</b><span>'+l.d+'</span><div class="to">'+l.to.map(function(i){return '<button data-go="'+i+'">'+byId[i].short+'</button>'}).join('')+'</div></li>'}).join('')+'</ul></section>'+
   '<section><h3>Los siete componentes</h3><div class="plist">'+PARTS.map(function(p,i){
     return '<button class="pitem" data-go="'+p.id+'"><span class="n">'+(i+1)+'</span><b>'+p.n+'</b>'+lvlHTML(sel[p.id])+'<small>'+tierOf(p.id).model+'</small></button>'}).join('')+'</div></section>'+
   '<section><button class="cta" data-go="cpu" style="margin-top:0">Empezar por el procesador <span aria-hidden="true">→</span></button></section>';
}
function renderSummary(){
  var c=calc(sel),all=[0,1,2].map(function(k){var s={};ORDER.forEach(function(i){s[i]=k});return calc(s)});
  var miss=SRC!=='amazon'?missingLocal(sel):0;
  var maxT=all[2].total;
  var cur=-1;[0,1,2].forEach(function(k){if(ORDER.every(function(i){return sel[i]===k}))cur=k});
  return '<div class="p-head"><div class="eyebrow"><span>Resumen</span><span class="pn"><button class="nb" data-nav="-1" aria-label="Anterior">←</button><button class="nb" data-nav="1" aria-label="Siguiente">→</button></span></div>'+
   '<h2>Tu configuración</h2><div style="margin-top:14px">'+segHTML()+'</div>'+(miss?'<p class="fine" style="margin-top:8px">Faltan '+miss+' precios de la tienda local en esta configuración: se usa el de Amazon en esos casos. Complétalos en la vista Precios.</p>':'')+'</div>'+
   '<section><div class="kpis">'+
   '<div class="kpi"><small>Total · '+srcName()+'</small><b'+(cop(c.total).length>12?' style="font-size:19px"':'')+'>'+cop(c.total)+'</b><em>'+PC.noteTotal+'</em></div>'+
   '<div class="kpi"><small>Rendimiento</small><b>'+c.perf+' / 100</b><em>'+cop(c.ppp)+' por punto</em></div>'+
   '<div class="kpi"><small>'+PC.limLabel+'</small><b style="font-size:17px;line-height:1.3;margin-top:8px">'+c.lim+'</b><em>según RAM y VRAM</em></div></div></section>'+
   '<section><h3>Alertas</h3><div class="alerts">'+c.warn.map(function(a){return '<div class="alert '+a.k+'"><b>'+a.h+'</b><span>'+a.t+'</span></div>'}).join('')+'</div></section>'+
   '<section><h3>Tres configuraciones completas</h3><div class="presets">'+[0,1,2].map(function(k){var a=all[k];
     return '<button class="preset'+(cur===k?' on':'')+(k===1?' recp':'')+'" data-preset="'+k+'"><b>'+TIERS[k]+'</b>'+
     '<div class="pr-row"><span>Costo</span><span class="track"><i class="cost" style="--v:'+Math.round(a.total/maxT*100)+'"></i></span><b>'+copS(a.total)+'</b></div>'+
     '<div class="pr-row"><span>Rendimiento</span><span class="track"><i class="perf" style="--v:'+a.perf+'"></i></span><b>'+a.perf+'</b></div></button>'}).join('')+'</div></section>'+
   '<section><h3>Lo que hay en la torre</h3><div class="rows">'+PARTS.map(function(p){var t=tierOf(p.id);
     return '<button class="row" data-go="'+p.id+'"><span>'+p.n+'</span><span>'+t.model+'</span><span class="chip-t">'+TIERS[sel[p.id]]+'</span><b>'+cop(pr(p.id,sel[p.id]))+'</b></button>'}).join('')+(PC.extras||[]).map(function(e){return '<div class="row"><span>'+e.n.split(' ')[0]+'</span><span>'+e.model+'</span><span class="chip-t">Fijo</span><b>'+cop(extraOne(e))+'</b></div>'}).join('')+'</div></section>'+
   '<p class="fine">Puntajes orientativos, solo para comparar niveles entre sí.</p>';
}

/* ---------- vistas ---------- */
var panel=$('#panel'),scrollEl=$('#scroll');
function renderPanel(keep){
  var top=scrollEl.scrollTop;
  panel.innerHTML=view==='torre'?renderOverview():view==='resumen'?renderSummary():view==='precios'?renderPrecios():renderPart(view);
  if(view==='precios')refreshPrecios();
  panel.style.animation='none';void panel.offsetWidth;panel.style.animation='';
  scrollEl.scrollTop=keep?top:0;
}
function updateTower(){
  $$('.chip').forEach(function(c){var id=c.dataset.go;if(sel[id]===undefined)return;
    $$('i',c).forEach(function(i,k){i.classList.toggle('on',k<=sel[id])})});
}
function syncTower(){
  if(!glOK)return;
  PARTS.forEach(function(p){T3.setTier(p.id,sel[p.id],tierOf(p.id).model)});
}
function applyView(v,skipAnim){
  view=v;
  var isPart=ORDER.indexOf(v)>=0;
  $$('.chip').forEach(function(c){c.setAttribute('aria-current',c.dataset.go===v?'true':'false')});
  if(isPart&&exploded)setExplode(false);
  if(glOK)T3.focus(isPart?v:null);
  renderPanel(false);
  var chip=$('.chip[aria-current="true"]');
  if(chip&&chip.scrollIntoView)try{chip.scrollIntoView({block:"nearest",inline:"center"})}catch(e){}
}
function go(v){
  if(SEQ.indexOf(v)<0)return;
  if(!opened)return openTower(v);
  try{if(location.hash.slice(1)!==v)location.hash=v}catch(e){}
  applyView(v);
}
function openTower(v,instant){
  if(opened)return;
  opened=true;document.body.classList.add('open');
  if(glOK)T3.open();
  try{if(location.hash.slice(1)!==v)location.hash=v}catch(e){}
  view=v;applyView(v,instant);
}
function setTier(id,i){
  if(sel[id]===i)return;
  sel[id]=i;updateTower();
  if(glOK)T3.setTier(id,i,tierOf(id).model);
  renderPanel(true);
}

function applyPC(n){
  PC=n===3?window.PC3:n===1?window.PC1:PC2;PKEY=n===2?'estacion-precios-v3':'estacion-precios-pc'+n+'-v3';OLDKEY=n===2?'estacion-precios-old':'estacion-precios-pc'+n+'-old';
  PARTS=PC.parts;byId={};PARTS.forEach(function(p){byId[p.id]=p});LOADS=PC.loads;
  PR=loadPrices(PC.prices,PKEY,OLDKEY);
  sel={};ORDER.forEach(function(id){sel[id]=1});
  var b=$('.brand');if(b&&b.lastChild)b.lastChild.textContent=PC.brand;
  document.title=PC.brand+(PC.company?' · '+PC.company:'');
  if(glOK){T3.setPC(PC.labels3d);if(T3.setMonitor)T3.setMonitor(PC.monitor3d||null);PARTS.forEach(function(p){T3.setLabel(p.id,p.n,tierOf(p.id).model)})}
}
/* ---------- navegación ---------- */
var chips=$('#chips');
chips.innerHTML=SEQ.map(function(id){
  var label=id==='torre'?'Torre':id==='resumen'?'Resumen':id==='precios'?'Precios':byId[id].short;
  return '<button class="chip" data-go="'+id+'" aria-current="false">'+label+(sel[id]!==undefined?lvlHTML(1):'')+'</button>';
}).join('');
$('#open').addEventListener('click',function(){applyPC(2);openTower('torre')});
var noteT=0;
Array.prototype.forEach.call(document.querySelectorAll('.pcbtn[data-pc]'),function(b){
  var n=+b.dataset.pc;
  b.addEventListener('pointerenter',function(){if(!glOK||opened)return;T3.nudge(n===1?-.4:n===3?.4:0);T3.wake(n===2)});
  b.addEventListener('pointerleave',function(){if(!glOK||opened)return;T3.nudge(0);T3.wake(false)})});
Array.prototype.forEach.call(document.querySelectorAll('.pcbtn[data-pc]'),function(b){
  if(b.id==='open')return;
  if(b.dataset.pc==='3'||b.dataset.pc==='1'){b.addEventListener('click',function(){applyPC(+b.dataset.pc);openTower('torre')});return}
  b.addEventListener('click',function(){var n=$('#pcnote');n.textContent='PC '+b.dataset.pc+' · todavía sin datos';clearTimeout(noteT);noteT=setTimeout(function(){n.textContent=''},3200)})});
$('#btnExplode').addEventListener('click',function(){if(!opened)return;setExplode(!exploded);if(exploded&&ORDER.indexOf(view)>=0)go('torre')});
$('#btnReset').addEventListener('click',function(){setExplode(false);go('torre');if(glOK)T3.focus(null)});

document.addEventListener('click',function(e){
  var el=e.target.closest&&e.target.closest('[data-go],[data-nav],[data-preset],[data-src],.tier');
  if(!el)return;
  if(el.dataset.src){SRC=el.dataset.src;savePrices();renderPanel(true)}
  else if(el.dataset.go){go(el.dataset.go)}
  else if(el.dataset.nav){var i=SEQ.indexOf(view)+(+el.dataset.nav);if(i>=0&&i<SEQ.length)go(SEQ[i])}
  else if(el.dataset.preset!==undefined){var k=+el.dataset.preset;ORDER.forEach(function(id){sel[id]=k});updateTower();syncTower();renderPanel(true)}
  else if(el.classList.contains('tier')&&ORDER.indexOf(view)>=0){setTier(view,+el.dataset.tier)}
});
document.addEventListener('input',function(e){
  var t=e.target,k=t.dataset&&t.dataset.k;if(!k)return;
  if(k==='tienda'){PR.tienda=t.value.trim()||'Tienda local'}
  else if(k==='trm'){if(+t.value>0)PR.trm=+t.value}
  else if(k==='recargo'){if(+t.value>=0)PR.recargo=+t.value}
  else{var arr=k==='a'?PR.amazonUSD[t.dataset.id]:PR.localCOP[t.dataset.id],v=parseFloat(t.value);arr[+t.dataset.i]=(v>0)?v:(k==='a'?arr[+t.dataset.i]:null)}
  savePrices();refreshPrecios();
});
document.addEventListener('keydown',function(e){
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.target.tagName==='INPUT')return;
  var t=e.target,onTier=t.classList&&t.classList.contains('tier'),onPart=t.classList&&t.classList.contains('part');
  if(!opened)return;
  if((e.key==='Enter'||e.key===' ')&&onTier){e.preventDefault();setTier(view,+t.dataset.tier);return}
  if((e.key==='Enter'||e.key===' ')&&onPart){e.preventDefault();go(t.dataset.id);return}
  if(e.target.tagName==='BUTTON'&&(e.key==='Enter'||e.key===' '))return;
  var i=SEQ.indexOf(view);
  if(e.key==='ArrowRight'&&i<SEQ.length-1){e.preventDefault();go(SEQ[i+1])}
  else if(e.key==='ArrowLeft'&&i>0){e.preventDefault();go(SEQ[i-1])}
  else if(e.key==='Escape'){go('torre')}
  else if(/^[123]$/.test(e.key)&&ORDER.indexOf(view)>=0){setTier(view,+e.key-1)}
});
window.addEventListener('hashchange',function(){var h=location.hash.slice(1);if(SEQ.indexOf(h)>=0&&h!==view){if(opened)applyView(h)}});

setupGL();
updateTower();
var h0=''; try{h0=location.hash.slice(1)}catch(e){}
try{if(h0)history.replaceState(null,'',location.pathname+location.search)}catch(e){}
/* siempre se empieza en el menú: hay que elegir PC 1, 2 o 3 */
$('.brand').style.cursor='pointer';$('.brand').title='Volver al menú';
$('.brand').addEventListener('click',function(){try{history.replaceState(null,'',location.pathname)}catch(e){}location.reload()});

/* enlace directo (para pruebas): ?pc=3&open=1&view=gpu */
(function(){var q=location.search,m=/[?&]pc=([0-9])/.exec(q);if(m&&/[?&]open=1/.test(q)){applyPC(+m[1]);var v=/[?&]view=([a-z]+)/.exec(q);openTower(v?v[1]:'torre',true);if(/[?&]explode=1/.test(q))setExplode(true)}})();
/* ---------- divisor: el usuario ajusta cuánto ocupa la torre frente al texto ---------- */
(function(){
  var stage=$('.stage'),cell=$('#towerCell'),pnl=$('#panel'),KEY='estacion-split',DEF=.56,share=DEF;
  try{var sv=parseFloat(localStorage.getItem(KEY));if(sv>=.3&&sv<=.82)share=sv}catch(e){}
  var bar=document.createElement('div');bar.className='split';bar.setAttribute('role','separator');bar.setAttribute('aria-orientation','vertical');
  bar.setAttribute('aria-label','Ajustar tamaño de la torre');bar.tabIndex=0;bar.title='Arrastra para agrandar la torre o el texto · doble clic para restablecer';
  stage.appendChild(bar);
  function apply(){stage.style.setProperty('--tw',(share*10).toFixed(3)+'fr');stage.style.setProperty('--pw',((1-share)*10).toFixed(3)+'fr')}
  function save(){try{localStorage.setItem(KEY,share.toFixed(3))}catch(e){}}
  function clampShare(v){var w=stage.getBoundingClientRect().width||1000;return Math.min(Math.max(v,Math.max(.3,340/w)),Math.min(.82,1-340/w))}
  apply();
  function place(){
    if(document.body.classList.contains('open')){
      var s=stage.getBoundingClientRect(),r=cell.getBoundingClientRect();
      bar.style.left=(r.right-s.left)+'px';
      var pw=$('.panel').getBoundingClientRect().width,z=Math.min(1,Math.max(.7,pw/640));
      if(pnl.style.zoom!==String(z.toFixed(3)))pnl.style.zoom=z.toFixed(3);
    }
    requestAnimationFrame(place)}
  place();
  var drag=false;
  bar.addEventListener('pointerdown',function(e){drag=true;bar.setPointerCapture(e.pointerId);bar.classList.add('on');stage.classList.add('dragging');e.preventDefault()});
  bar.addEventListener('pointermove',function(e){if(!drag)return;var s=stage.getBoundingClientRect();share=clampShare((e.clientX-s.left)/s.width);apply()});
  function end(){if(!drag)return;drag=false;bar.classList.remove('on');stage.classList.remove('dragging');save()}
  bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
  bar.addEventListener('dblclick',function(){share=DEF;apply();save()});
  bar.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();share=clampShare(share+(e.key==='ArrowRight'?.03:-.03));apply();save()}});
})();

})();
