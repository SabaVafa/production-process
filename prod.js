/* ══ METZLER · Produktionsprozess — supplemental interactions (prod.js) ══
   Hero, trust strip and the journey (about-craft + msty sticky chrome) are
   driven by the About-us scripts already in the page. This file only adds:
   the FAQ accordion, click-to-play film, and the ?stage deep-link marker. */
(function(){
  'use strict';

  /* (The FAQ uses native <details>/<summary> — no script needed.) */

  /* ── Film player: independent, interactive control bar ── */
  var film = document.getElementById('prodFilm');
  var vid  = document.getElementById('prodVideo');
  if(film && vid){
    var stage   = document.getElementById('prodFilmStage');
    var nav     = document.getElementById('prodFilmNav');
    var playBtn = document.getElementById('prodFilmPlay');
    var toggle  = document.getElementById('prodFilmToggle');
    var muteBtn = document.getElementById('prodFilmMute');
    var fsBtn   = document.getElementById('prodFilmFs');
    var scrub   = document.getElementById('prodFilmScrub');
    var bar     = document.getElementById('prodFilmBar');
    var buffer  = document.getElementById('prodFilmBuffer');
    var tip     = document.getElementById('prodFilmTip');
    var curEl   = document.getElementById('prodFilmCur');
    var durEl   = document.getElementById('prodFilmDur');
    var chapters = Array.prototype.slice.call((nav || film).querySelectorAll('.prod-film__chapter'));

    var I_PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    var I_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    var I_MUTE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    var I_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
    var I_FS    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
    var I_FSX   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3"/></svg>';

    var scrubbing = false;

    function fmt(t){ if(!isFinite(t) || t < 0) return '0:00'; t = Math.floor(t); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
    function syncToggle(){ if(toggle){ toggle.innerHTML = vid.paused ? I_PLAY : I_PAUSE; toggle.setAttribute('aria-label', vid.paused ? 'Abspielen' : 'Pause'); } }
    function syncMute(){ if(muteBtn){ muteBtn.innerHTML = vid.muted ? I_MUTE : I_SOUND; muteBtn.setAttribute('aria-label', vid.muted ? 'Ton einschalten' : 'Ton ausschalten'); } }
    function play(){ var p = vid.play(); if(p && p.catch) p.catch(function(){}); }
    function paint(prog){
      if(bar) bar.style.width = (prog * 100) + '%';
      if(scrub) scrub.setAttribute('aria-valuenow', Math.round(prog * 100));
      if(curEl && vid.duration) curEl.textContent = fmt(prog * vid.duration);
    }
    function setDuration(){ if(durEl && vid.duration) durEl.textContent = fmt(vid.duration); }

    /* chapter tick marks rendered onto the rail */
    if(scrub && chapters.length > 1){
      for(var t = 1; t < chapters.length; t++){
        var tk = document.createElement('i');
        tk.className = 'prod-film__tick';
        tk.style.left = (t / chapters.length * 100) + '%';
        scrub.appendChild(tk);
      }
    }

    vid.addEventListener('loadedmetadata', setDuration);
    if(vid.readyState >= 1) setDuration();
    vid.addEventListener('play',  function(){ film.classList.add('playing'); syncToggle(); });
    vid.addEventListener('pause', function(){ film.classList.remove('playing'); syncToggle(); });
    vid.addEventListener('volumechange', syncMute);
    vid.addEventListener('timeupdate', function(){
      if(!vid.duration) return;
      var prog = vid.currentTime / vid.duration;
      if(!scrubbing) paint(prog);   /* while dragging, the pointer owns the bar */
      var idx = Math.min(chapters.length - 1, Math.floor(prog * chapters.length));
      chapters.forEach(function(c,i){ var on = i === idx; c.classList.toggle('is-active', on); if(on) c.setAttribute('aria-current','true'); else c.removeAttribute('aria-current'); });
    });
    vid.addEventListener('progress', function(){
      if(buffer && vid.duration && vid.buffered.length){ buffer.style.width = (vid.buffered.end(vid.buffered.length - 1) / vid.duration * 100) + '%'; }
    });

    if(playBtn) playBtn.addEventListener('click', function(e){ e.stopPropagation(); play(); });
    if(toggle)  toggle.addEventListener('click', function(){ if(vid.paused) play(); else vid.pause(); });
    if(muteBtn) muteBtn.addEventListener('click', function(){ vid.muted = !vid.muted; });
    chapters.forEach(function(c,i){ c.addEventListener('click', function(){ if(vid.duration){ vid.currentTime = (i / chapters.length) * vid.duration; play(); } }); });
    film.addEventListener('click', function(){ if(vid.paused) play(); else vid.pause(); });

    /* ── Fullscreen ── */
    function fsElement(){ return document.fullscreenElement || document.webkitFullscreenElement; }
    function toggleFs(){
      var el = stage || film;
      if(fsElement()){
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if(exit){ var r = exit.call(document); if(r && r.catch) r.catch(function(){}); }
      } else {
        var req = el.requestFullscreen || el.webkitRequestFullscreen;
        if(req){ var r2 = req.call(el); if(r2 && r2.catch) r2.catch(function(){}); }
        /* iPhone Safari can't fullscreen a <div> — only the <video> element,
           via its own API. Fall back to that so the button works on mobile. */
        else if(vid.webkitEnterFullscreen){ try{ vid.webkitEnterFullscreen(); }catch(_){} }
      }
    }
    function syncFs(){ if(fsBtn){ var on = !!fsElement(); fsBtn.innerHTML = on ? I_FSX : I_FS; fsBtn.setAttribute('aria-label', on ? 'Vollbild verlassen' : 'Vollbild'); } }
    if(fsBtn) fsBtn.addEventListener('click', toggleFs);
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);

    /* ── Interactive scrub bar: click to jump, drag to scrub, hover-preview, keyboard ── */
    if(scrub){
      function fracAt(clientX){ var r = scrub.getBoundingClientRect(); return r.width ? Math.max(0, Math.min(1, (clientX - r.left) / r.width)) : 0; }
      function seekTo(frac){ if(!vid.duration) return; vid.currentTime = frac * vid.duration; paint(frac); }
      function nudge(delta){ if(!vid.duration) return; var nt = Math.max(0, Math.min(vid.duration, vid.currentTime + delta)); vid.currentTime = nt; paint(nt / vid.duration); }
      function showTip(clientX){ if(!tip || !vid.duration) return; var f = fracAt(clientX); tip.textContent = fmt(f * vid.duration); tip.style.left = (f * 100) + '%'; }

      scrub.addEventListener('pointerdown', function(e){
        e.preventDefault();
        scrubbing = true;
        if(scrub.setPointerCapture){ try{ scrub.setPointerCapture(e.pointerId); }catch(_){} }
        seekTo(fracAt(e.clientX));
      });
      scrub.addEventListener('pointermove', function(e){ showTip(e.clientX); if(scrubbing) seekTo(fracAt(e.clientX)); });
      function endScrub(){ scrubbing = false; }
      scrub.addEventListener('pointerup', endScrub);
      scrub.addEventListener('pointercancel', endScrub);
      scrub.addEventListener('keydown', function(e){
        if(!vid.duration) return;
        var step = Math.max(1, vid.duration * 0.05);   /* ±5 % of the film, min 1 s */
        if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ nudge(step); e.preventDefault(); }
        else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ nudge(-step); e.preventDefault(); }
        else if(e.key === 'Home'){ seekTo(0); e.preventDefault(); }
        else if(e.key === 'End'){ seekTo(1); e.preventDefault(); }
      });

      /* ── Player-wide keyboard shortcuts (Tab to the player first): Space/K, M, F, ←/→ ── */
      if(stage){
        stage.setAttribute('tabindex', '0');
        stage.addEventListener('keydown', function(e){
          if(e.target === scrub) return;                       /* rail owns its arrows */
          if(e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;  /* let buttons self-activate */
          var k = e.key.toLowerCase();
          if(e.key === ' ' || k === 'k'){ if(vid.paused) play(); else vid.pause(); e.preventDefault(); }
          else if(k === 'm'){ vid.muted = !vid.muted; e.preventDefault(); }
          else if(k === 'f'){ toggleFs(); e.preventDefault(); }
          else if(e.key === 'ArrowRight' && vid.duration){ vid.currentTime = Math.min(vid.duration, vid.currentTime + 5); e.preventDefault(); }
          else if(e.key === 'ArrowLeft' && vid.duration){ vid.currentTime = Math.max(0, vid.currentTime - 5); e.preventDefault(); }
        });
      }
    }

    syncToggle(); syncMute(); syncFs();
  }

  /* ── Order-status deep-link: ?stage=N (1–6) marks the current step
        "Sie sind hier" and scrolls to it (e.g. from the delay e-mail). ── */
  var stage = parseInt(new URLSearchParams(location.search).get('stage'), 10);
  if(!isNaN(stage) && stage >= 1 && stage <= 6){
    var ch = document.querySelector('.craft-chapter[data-chapter="' + stage + '"]');
    if(ch){
      ch.classList.add('is-here');
      window.addEventListener('load', function(){
        setTimeout(function(){ ch.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
      });
    }
  }
})();
