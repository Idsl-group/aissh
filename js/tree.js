/* ============================================================
   TREE.JS — Neural trees, cursor-origin breeze
   ============================================================

   ╔══════════════════════════════════════════════════════════╗
   ║  CONFIG — edit these values to tune the animation        ║
   ╠══════════════════════════════════════════════════════════╣
   ║  TREE_OPACITY     0–1    Canvas opacity (0=invisible)    ║
   ║  BREEZE_STRENGTH  0–3    Overall wind power multiplier   ║
   ║  BREEZE_REACH     px     Falloff radius — larger number  ║
   ║                          = wind travels further across   ║
   ║                          the canvas before dying out.    ║
   ║  WIND_GUST_COUNT  1-10   Trails emitted per frame        ║
   ║  WIND_OPACITY     0-1    Visibility of the trails        ║
   ╚══════════════════════════════════════════════════════════╝ */

const TREE_OPACITY     = 0.82;   // canvas visibility
const BREEZE_STRENGTH  = 1.0;    // wind power multiplier (1 = natural)
const BREEZE_REACH     = 700;    // px — exponential decay radius
const WIND_GUST_COUNT  = 3;      // number of wind trails (higher = more trails)
const WIND_OPACITY     = 0.50;   // visibility of trails (higher = brighter)

/* ── End of config ──────────────────────────────────────────── */

(function () {
  const canvas = document.getElementById('tree-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* Apply opacity from config */
  canvas.style.opacity = TREE_OPACITY;

  /* ── Palette ─────────────────────────────────────────────── */
  const NC = ['#1C0A03','#3A1A08','#5C2E10','#7A4020','#9B6035','#B8844A','#3A7A5A','#52A878','#74C69D'];
  const EC = ['rgba(58,26,8,.80)','rgba(80,40,15,.70)','rgba(110,60,25,.60)','rgba(140,85,40,.50)',
              'rgba(165,110,60,.40)','rgba(55,140,90,.45)','rgba(70,170,110,.35)','rgba(90,200,140,.28)'];
  const NR = [11,10,9,8,7,5.5,4.5,3.5,3];
  function ci(a,i){ return a[Math.min(i,a.length-1)]; }

  /* ── Seeded RNG ──────────────────────────────────────────── */
  let _s=137;
  function rng(){ _s=(_s*9301+49297)%233280; return _s/233280; }
  function rr(a,b){ return a+rng()*(b-a); }

  /* ── State ───────────────────────────────────────────────── */
  let nodes=[],edges=[],pulses=[],wind=[];
  let W=0,H=0,MD=7,T=0,nid=0;
  let mx=-9999,my=-9999,inHero=false,windTimer=0;

  /* ── Tree configs (responsive) ───────────────────────────── */
  function treeCfgs(){
    if(H < 600) return [{sx:0.18,scale:1.00,seed:137}]; // Inner page headers: just 1 tree on the left
    if(W>900)  return [{sx:0.10,scale:0.75,seed:137},{sx:0.28,scale:1.00,seed:291},{sx:0.82,scale:0.82,seed:417}];
    if(W>500)  return [{sx:0.15,scale:0.90,seed:137},{sx:0.75,scale:0.75,seed:291}];
    return             [{sx:0.18,scale:1.00,seed:137}];
  }

  /* ── Tree growth ─────────────────────────────────────────── */
  function mkNode(rx,ry,d){ const n={id:nid++,rx,ry,x:rx,y:ry,vx:0,vy:0,depth:d}; nodes.push(n); return n; }

  function grow(parent,x,y,angle,len,d){
    const n=mkNode(x,y,d);
    if(parent) edges.push({from:parent,to:n,depth:d-1});
    if(d>=MD) return;
    let kids,spread,fl;
    if(d<2)       {kids=1;spread=0;   fl=0.82;}
    else if(d===2){kids=2;spread=0.55;fl=0.74;}
    else if(d<=4) {kids=2;spread=0.65;fl=0.70;}
    else          {kids=3;spread=0.80;fl=0.62;}
    for(let i=0;i<kids;i++){
      const t=kids===1?0:(i/(kids-1))-0.5;
      const a=angle+spread*t+rr(-0.07,0.07);
      const l=len*fl*rr(0.92,1.08);
      grow(n,x+Math.cos(a)*l,y+Math.sin(a)*l,a,l,d+1);
    }
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init(){
    /* getBoundingClientRect on the parent is more reliable than
       offsetWidth/Height for absolute-positioned canvases in flex containers */
    const parent = canvas.parentElement;
    const rect   = parent ? parent.getBoundingClientRect() : null;
    W = (rect && rect.width  > 0) ? rect.width  : (canvas.offsetWidth  || window.innerWidth);
    H = (rect && rect.height > 0) ? rect.height : (canvas.offsetHeight || 420);
    const pr=window.devicePixelRatio||1;
    canvas.width=W*pr; canvas.height=H*pr;
    ctx.setTransform(pr,0,0,pr,0,0);
    MD  = 7;   // always full depth — tree always looks impressive
    nid = 0; _s=137; nodes=[]; edges=[]; pulses=[]; wind=[];
    const rootLen = Math.max(H * 0.25, 140); // min 140px for visible tree
    for(const c of treeCfgs()){ _s=c.seed; grow(null,W*c.sx,H*0.97,-Math.PI/2,rootLen*c.scale,0); }
  }

  /* ── Ambient breeze (when cursor is outside hero) ────────── */
  function ambient(t){
    return Math.sin(t*0.5)*0.6+Math.sin(t*0.87)*0.3+Math.sin(t*1.6)*0.1;
  }

  /* ── Wind Swirls (Breeze Animation) ──────────────────────── */
  function emitWind(){
    for(let i=0; i<WIND_GUST_COUNT; i++){
      if(Math.random() > 0.75) continue; // slight randomization of emission
      
      const a = Math.random() * Math.PI * 2;
      // Fast initial speed to shoot out
      const spd = 200 + Math.random() * 250;
      
      wind.push({
        x: mx, y: my,
        vx: Math.cos(a) * spd, 
        vy: Math.sin(a) * spd,
        life: 0,
        ml: 2.5 + Math.random() * 3.0, // Live for a few seconds
        // Swirl factor determines how sharply the wind curls (radians per second)
        swirl: (Math.random() - 0.5) * 4.0,
        points: [{x: mx, y: my}],
        isGreen: Math.random() > 0.6
      });
    }
  }

  /* ── Physics update ──────────────────────────────────────── */
  function update(dt){
    T+=dt;

    /* Emit wind particles continuously while cursor is in hero */
    if(inHero){
      windTimer+=dt;
      // Emit roughly 10 bursts per second
      while(windTimer>1/10){ emitWind(); windTimer-=1/10; }
    } else { windTimer=0; }

    /* Advance wind swirls */
    for(let i=wind.length-1;i>=0;i--){
      const p=wind[i];
      
      // Calculate current speed and angle
      const currentAngle = Math.atan2(p.vy, p.vx);
      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy) * 0.985; // friction
      
      // Apply swirl (curl the wind over time)
      const newAngle = currentAngle + p.swirl * dt;
      p.vx = Math.cos(newAngle) * speed;
      p.vy = Math.sin(newAngle) * speed;
      
      p.x += p.vx * dt; 
      p.y += p.vy * dt;
      p.life += dt;
      
      // Record trail points for the sweeping line
      p.points.push({x: p.x, y: p.y});
      if(p.points.length > 20) p.points.shift(); // Trail length
      
      if(p.life >= p.ml) wind.splice(i,1);
    }

    /* Tree node physics */
    const bAmb=inHero?0:ambient(T);

    for(const n of nodes){
      const sf=Math.pow(n.depth/MD,1.9); // 0=trunk, 1=leaf tip
      const k=0.10+(1-sf)*0.28;          // spring stiffness (stiffer at root)

      let fx=bAmb*sf*8*BREEZE_STRENGTH+(n.rx-n.x)*k;
      let fy=(n.ry-n.y)*(k+0.08);

      if(inHero){
        const dx=n.x-mx, dy=n.y-my;
        const dist=Math.sqrt(dx*dx+dy*dy)||1;

        /*  Exponential falloff:
            • At dist=0   → exp(0)=1.0  (full force)
            • At dist=R   → exp(-1)≈0.37 (37% force)
            • At dist=2R  → exp(-2)≈0.14 (14% force)
            • At dist=3R  → exp(-3)≈0.05  (5% force, still visible)
            Even trees at the far canvas edge feel a gentle push.        */
        const falloff = Math.exp(-dist / BREEZE_REACH);
        const str     = BREEZE_STRENGTH * 55 * sf * falloff;

        fx += (dx/dist) * str;
        fy += (dy/dist) * str * 0.45;  // slightly less vertical than horizontal
      }

      n.vx=(n.vx+fx*dt)*0.87;
      n.vy=(n.vy+fy*dt)*0.87;
      n.x+=n.vx; n.y+=n.vy;
    }

    /* Data pulses */
    for(let i=pulses.length-1;i>=0;i--){
      pulses[i].t+=pulses[i].spd*dt;
      if(pulses[i].t>=1) pulses.splice(i,1);
    }
  }

  function spawnPulse(){
    if(!edges.length) return;
    const e=edges[Math.floor(Math.random()*edges.length)];
    pulses.push({edge:e,t:0,spd:0.5+Math.random()*0.7});
  }
  setInterval(spawnPulse,240);

  /* ── Render ──────────────────────────────────────────────── */
  function render(){
    ctx.clearRect(0,0,W,H);

    /* Wind swirls (curved trails) */
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for(const p of wind){
      if(p.points.length < 2) continue;
      
      // Fade in and fade out smoothly
      const prog = p.life / p.ml;
      const alpha = prog < 0.15 ? (prog/0.15) : (prog > 0.7 ? (1-prog)/0.3 : 1);
      
      ctx.beginPath();
      ctx.moveTo(p.points[0].x, p.points[0].y);
      // Create a smooth path through recorded points
      for(let i=1; i<p.points.length; i++){
        // Use quadratic curve for slightly smoother trails, or just lineTo
        ctx.lineTo(p.points[i].x, p.points[i].y);
      }
      
      // Subtle colours for the wind
      ctx.strokeStyle = p.isGreen 
        ? `rgba(116, 198, 157, ${alpha * WIND_OPACITY})`              // Sage
        : `rgba(253, 252, 248, ${alpha * (WIND_OPACITY * 0.55)})`;    // Off-white
        
      ctx.stroke();
    }
    ctx.restore();

    /* Edges */
    for(const e of edges){
      ctx.beginPath(); ctx.moveTo(e.from.x,e.from.y); ctx.lineTo(e.to.x,e.to.y);
      ctx.strokeStyle=ci(EC,e.depth);
      ctx.lineWidth=Math.max(0.5,5-e.depth*0.55);
      ctx.lineCap='round'; ctx.stroke();
    }

    /* Data pulses */
    ctx.save();
    for(const p of pulses){
      const{from,to,depth}=p.edge;
      const px=from.x+(to.x-from.x)*p.t, py=from.y+(to.y-from.y)*p.t;
      const col=depth>=5?'#74C69D':'#E07B39';
      ctx.beginPath(); ctx.arc(px,py,2.8,0,Math.PI*2);
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12; ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();

    /* Nodes */
    for(const n of nodes){
      const r=ci(NR,n.depth), col=ci(NC,n.depth), lf=n.depth>=6;
      if(lf){ctx.shadowColor='#74C69D'; ctx.shadowBlur=10;}
      ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
      ctx.strokeStyle=lf?'rgba(116,198,157,.35)':'rgba(255,255,255,.10)';
      ctx.lineWidth=1; ctx.stroke();
      if(lf) ctx.shadowBlur=0;
    }
  }

  /* ── Cursor tracking ─────────────────────────────────────── */
  window.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    mx=e.clientX-r.left; my=e.clientY-r.top;
    inHero=(mx>=0&&mx<=r.width&&my>=0&&my<=r.height);
  });

  /* ── Animation loop ──────────────────────────────────────── */
  let last=null;
  function frame(now){
    const dt=last?Math.min((now-last)/1000,0.05):0.016; last=now;
    update(dt); render(); requestAnimationFrame(frame);
  }

  let rt;
  window.addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(init,120); });
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){ init(); render(); return; }

  /* Wait for layout before measuring canvas size */
  function start(){ requestAnimationFrame(()=>{ init(); requestAnimationFrame(frame); }); }
  if(document.readyState==='complete'){ start(); }
  else{ window.addEventListener('load',start); }
})();
