
// autoFit_from_json.js — JSON 기반 자동 스케일러 (v43.html 호환)
(function(){
  const CFG_URL = 'sr_config.json';

  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  async function loadConfig(){
    try{
      const res = await fetch(CFG_URL, {cache:'no-cache'});
      if(!res.ok) throw new Error('config fetch failed: ' + res.status);
      return await res.json();
    }catch(e){
      console.warn('[autoFit] Using defaults because config load failed:', e);
      return {
        maxScale: 1.35,
        minScale: 0.40,
        bottomMarginPx: 16,
        safePadPx: 4,
        paletteMarginPx: 100,
        paletteZIndex: 3,
        stageZIndex: 1,
        centerHorizontally: true
      };
    }
  }

  function makeWrap(target, paletteMarginPx){
    if(!target) return null;
    if(target.parentElement && target.parentElement.id === 'fit-wrap') return target.parentElement;
    const wrap = document.createElement('div');
    wrap.id = 'fit-wrap';
    wrap.style.display = 'inline-block';
    wrap.style.transformOrigin = 'top left';
    wrap.style.willChange = 'transform';
    wrap.style.marginBottom = (paletteMarginPx||0) + 'px'; // 팔레트와 간격
    target.parentElement.insertBefore(wrap, target);
    wrap.appendChild(target);
    return wrap;
  }

  function availHeightFor(container, bottomMarginPx){
    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return Math.max(100, vh - rect.top - (bottomMarginPx||0));
  }

  function install(cfg){
    const systems = document.getElementById('systems');
    if(!systems) return;
    const container = systems.parentElement; // v43에서 #systems를 감싸는 panel
    const wrap = makeWrap(systems, cfg.paletteMarginPx);

    // 팔레트가 위로 보이도록
    const palette = document.getElementById('palettePanel');
    if(palette){
      palette.style.position = 'relative';
      palette.style.zIndex = String(cfg.paletteZIndex ?? 3);
    }
    if(container){
      container.style.overflow = 'visible';
      container.style.position = 'relative';
      container.style.zIndex = String(cfg.stageZIndex ?? 1);
    }

    let rafId = null;
    function update(){
      rafId = null;
      // 자연 크기 측정
      wrap.style.transform = 'none';
      const naturalW = Math.max(systems.scrollWidth, systems.offsetWidth);
      const naturalH = Math.max(systems.scrollHeight, systems.offsetHeight);

      const availW = Math.max(100, container.clientWidth - (cfg.safePadPx||0));
      const availH = Math.max(100, availHeightFor(container, cfg.bottomMarginPx) - (cfg.safePadPx||0));

      const scaleW = availW / naturalW;
      const scaleH = availH / naturalH;
      let scale = Math.min(scaleW, scaleH);
      const maxS = (cfg.maxScale ?? 1.35);
      const minS = (cfg.minScale ?? 0.40);
      scale = Math.max(minS, Math.min(maxS, scale));

      wrap.style.width = naturalW + 'px';
      wrap.style.height = naturalH + 'px';
      wrap.style.transform = 'scale(' + scale.toFixed(4) + ')';

      // 가로 가운데 정렬 옵션
      if(cfg.centerHorizontally){
        const leftover = availW - (naturalW * scale);
        wrap.style.marginLeft = leftover > 0 ? (leftover / 2) + 'px' : '0px';
      }else{
        wrap.style.marginLeft = '0px';
      }
    }

    function schedule(){ if(rafId==null){ rafId = requestAnimationFrame(update); } }

    const ro = new ResizeObserver(schedule);
    ro.observe(container);
    const ro2 = new ResizeObserver(schedule);
    ro2.observe(systems);

    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);

    // 첫 실행
    setTimeout(update, 0);
  }

  ready(async ()=>{
    const cfg = await loadConfig();
    install(cfg);
  });
})();
