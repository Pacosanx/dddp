import { createShader } from 'shaders/js';
const preset = { components: [
  {type:'ChromaFlow',id:'idmuwv2yzxj4dmtswg2',props:{baseColor:'#00ff73',downColor:'#aaff00',leftColor:'#00ffbf',momentum:60,radius:3.2,rightColor:'#e6ff00'}},
  {type:'DataMosh',id:'idmuwv8kf7orbn80cxq',props:{blockSize:53,churn:0.48,drift:0.03,speed:2.2}},
  {type:'Dither',id:'idmuwv5cwlgofe6s0ol',props:{colorB:'#DFFF00',pixelSize:5,threshold:0.47}}
]};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const frameElement = document.querySelector('main');
const canvas = document.createElement('canvas');
canvas.className = 'shared-shader';
canvas.setAttribute('aria-hidden','true');
canvas.dataset.shaderState = 'loading';
canvas.style.width = '100%'; canvas.style.height = '100%';
const svgNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(svgNS,'svg');
svg.setAttribute('width','0'); svg.setAttribute('height','0');
svg.setAttribute('aria-hidden','true'); svg.style.position = 'fixed';
const defs = document.createElementNS(svgNS,'defs');
const clip = document.createElementNS(svgNS,'clipPath');
clip.id = 'paco-shader-windows'; clip.setAttribute('clipPathUnits','userSpaceOnUse');
defs.append(clip); svg.append(defs); document.body.append(svg,canvas);
let shader, pending, frame, visible = false;
const maskRects = [];
function updateWindows() {
  frame = null;
  visible = false;
  const windows = [];
  function addWindow(left,top,right,bottom) {
    const x = Math.max(0,left), y = Math.max(0,top);
    const width = Math.max(0,Math.min(document.documentElement.clientWidth,right)-x);
    const height = Math.max(0,Math.min(innerHeight,bottom)-y);
    if(width && height){windows.push({x,y,width,height});visible=true;}
  }
  for(const area of document.querySelectorAll('.shader-band,.card-void,.intro h1')) {
    const box = area.getBoundingClientRect();
    if(!box.width || !box.height)continue;
    const style = getComputedStyle(area);
    addWindow(box.left + parseFloat(style.borderLeftWidth || 0),box.top + parseFloat(style.borderTopWidth || 0),box.right - parseFloat(style.borderRightWidth || 0),box.bottom - parseFloat(style.borderBottomWidth || 0));
  }
  const page = frameElement.getBoundingClientRect();
  addWindow(0,0,page.left,innerHeight);
  addWindow(page.right,0,document.documentElement.clientWidth,innerHeight);
  while(maskRects.length < windows.length) {
    const rect = document.createElementNS(svgNS,'rect');clip.append(rect);maskRects.push(rect);
  }
  maskRects.forEach((rect,index)=>{
    const box=windows[index] || {x:0,y:0,width:0,height:0};
    for(const [name,value] of Object.entries(box))rect.setAttribute(name,value);
  });
  if (visible && !document.hidden && !reduced.matches) prepare(); else shader?.pause();
}
function scheduleWindows() {if(frame == null)frame=requestAnimationFrame(updateWindows);}
async function prepare() {
  if (!navigator.gpu || reduced.matches) return;
  try {
    pending ??= createShader(canvas,preset,{
      disableTelemetry:true,observeElement:false,
      onError:reason=>{canvas.dataset.shaderState=reason; console.warn('Datita shader:',reason);}
    });
    shader = await pending;
    canvas.dataset.shaderState = shader.getFailureReason() || 'ready';
    if(visible && !document.hidden && !reduced.matches)shader.resume();else shader.pause();
  } catch(error) {canvas.dataset.shaderState='error';console.warn('No se pudo iniciar el shader de Datita:',error);}
}
const resize = new ResizeObserver(scheduleWindows);
document.querySelectorAll('.shader-band,.grid,.intro h1').forEach(area=>resize.observe(area));
resize.observe(document.body);
const changes = new MutationObserver(scheduleWindows);
changes.observe(document.querySelector('.workspace'),{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});
window.addEventListener('scroll',()=>{if(frame != null)cancelAnimationFrame(frame);updateWindows();},{passive:true});
window.addEventListener('resize',()=>{shader?.resize(innerWidth,innerHeight);scheduleWindows();},{passive:true});
document.addEventListener('visibilitychange',scheduleWindows);
document.addEventListener('datita:layout',scheduleWindows);
reduced.addEventListener('change',scheduleWindows);
window.addEventListener('pagehide',event=>{shader?.pause();if(!event.persisted)shader?.destroy();});
window.addEventListener('pageshow',scheduleWindows);
document.fonts.ready.then(scheduleWindows);
scheduleWindows();
