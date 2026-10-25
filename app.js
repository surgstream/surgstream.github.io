(() => {
  'use strict';

  const modes = {
    RT: { name: 'Real-time perception', title: 'What is happening now?', description: 'Answer questions about the visible surgical scene as frames arrive.' },
    BM: { name: 'Backward memory', title: 'What happened earlier?', description: 'Retrieve earlier events, durations and first appearances from the procedural history.' },
    FP: { name: 'Forward proactive QA', title: 'Watch for what comes next.', description: 'Keep a pending question and respond when the relevant evidence appears.' },
    PA: { name: 'Proactive alert', title: 'Recognize the moment that matters.', description: 'Issue event-related alerts within the task’s annotation-derived response window.' },
    CM: { name: 'Caption memory', title: 'Keep the procedure in context.', description: 'Connect structured surgical events with a memory of the completed workflow.' }
  };

  const data = window.SURGSTREAM_DEMO || { cases: [] };
  const examples = Array.isArray(data.cases) ? data.cases : [];
  const mediaVersions = new Map([
    ['assets/clip-rt.mp4', '5952579a7428'],
    ['assets/clip-bm.mp4', '0bc3e94c1af4'],
    ['assets/poster-bm.jpg', 'aa5d72fc8430']
  ]);
  const mediaURL = path => mediaVersions.has(path) ? path + '?v=' + mediaVersions.get(path) : path;
  const tabs = [...document.querySelectorAll('[role="tab"][data-mode]')];
  const video = document.getElementById('example-video');
  const still = document.getElementById('example-still');
  const panel = document.getElementById('example-panel');
  const clock = document.getElementById('example-clock');
  const timeline = document.getElementById('example-timeline');
  const replayButton = document.getElementById('replay-example');
  const jumpButton = document.getElementById('jump-response');
  const taskLink = document.getElementById('example-task-link');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let activeMode = 'RT';
  let activeExample = null;
  let timelineEvents = [];
  let pendingSeek = null;
  let playbackGeneration = 0;
  let playbackNotice = '';

  const setText = (id, text) => {
    const node = document.getElementById(id);
    const value = text == null ? '' : String(text);
    if (node && node.textContent !== value) node.textContent = value;
  };

  function timeInSeconds(value) {
    if (value == null || value === '') return null;
    const seconds = typeof value === 'string' && value.includes(':')
      ? value.split(':').reduce((total, part) => total * 60 + Number(part), 0)
      : Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }

  function formatTime(value) {
    const parsed = timeInSeconds(value);
    if (parsed == null) return '';
    const seconds = Math.floor(parsed);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return (hours ? String(hours).padStart(2, '0') + ':' : '') + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
  }

  function renderRecords(records) {
    const container = document.getElementById('example-records');
    if (!container) return;
    container.replaceChildren();
    const entries = Array.isArray(records) ? records : [];
    container.hidden = !entries.length;
    entries.forEach(record => {
      const row = document.createElement('div');
      row.className = 'record-entry';
      const structured = record && typeof record === 'object';
      const meta = document.createElement('div');
      meta.className = 'record-meta';
      const type = document.createElement('strong');
      type.className = 'record-type';
      type.textContent = structured ? record.type || record.state || 'Memory record' : 'Memory record';
      meta.append(type);
      const sourceTime = structured ? timeInSeconds(record.time ?? record.t ?? record.timestamp) : null;
      if (sourceTime != null) {
        const time = document.createElement('time');
        time.className = 'record-time';
        time.dateTime = 'PT' + sourceTime + 'S';
        time.textContent = 'Source ' + formatTime(sourceTime);
        meta.append(time);
      }
      const emitted = structured ? timeInSeconds(record.emitted_at) : null;
      if (emitted != null && emitted !== sourceTime) {
        const written = document.createElement('span');
        written.className = 'record-emitted';
        written.textContent = 'Written ' + formatTime(emitted);
        meta.append(written);
      }
      const text = document.createElement('p');
      text.className = 'record-text';
      text.textContent = structured ? record.text || record.content || record.answer || '' : String(record ?? '');
      row.append(meta, text);
      container.append(row);
    });
  }

  function validMode(value) {
    const mode = String(value || '').toUpperCase();
    return Object.prototype.hasOwnProperty.call(modes, mode) ? mode : null;
  }

  function modeFromURL() {
    try { return validMode(new URL(window.location.href).searchParams.get('mode')); }
    catch { return null; }
  }

  function rememberMode(mode, hash) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', mode);
      if (hash != null) url.hash = hash;
      window.history.replaceState(window.history.state, '', url.href);
    } catch {
      // Local file previews may disallow history changes; the controls still work.
    }
  }

  function excerptRange(example = activeExample) {
    const start = timeInSeconds(example?.start) ?? 0;
    return { start, end: timeInSeconds(example?.end) ?? start };
  }

  function canSeekTo(sourceTime) {
    if (!activeExample?.clip || sourceTime == null) return false;
    const { start, end } = excerptRange();
    return sourceTime >= start && sourceTime <= end;
  }

  function renderTimeline(example) {
    timelineEvents = [];
    if (!timeline) return;
    timeline.replaceChildren();
    if (!example) return;
    const add = (kind, label, value) => {
      const time = timeInSeconds(value);
      if (time != null) timelineEvents.push({ kind, label, time });
    };
    const { start } = excerptRange(example);
    (Array.isArray(example.records) ? example.records : []).forEach(record => {
      if (!record || typeof record !== 'object') return;
      const time = timeInSeconds(record.time ?? record.t ?? record.timestamp);
      if (time != null && time < start) add('memory', 'Earlier memory', time);
    });
    add('query', 'Question', example.query_time);
    add('evidence', 'Evidence available', example.evidence_time);
    add('response', activeMode === 'PA' ? 'Automatic alert' : activeMode === 'CM' ? 'Memory write' : 'Recorded response', example.response_time);
    add('deadline', 'Deadline', example.deadline);
    timelineEvents.sort((a, b) => a.time - b.time);
    timelineEvents.forEach(event => {
      const row = document.createElement('li');
      row.className = 'timeline-event';
      row.dataset.event = event.kind;
      const seekable = canSeekTo(event.time);
      row.classList.toggle('is-outside', Boolean(example.clip) && !seekable);
      const marker = document.createElement(seekable ? 'button' : 'span');
      marker.className = seekable ? 'timeline-seek' : 'timeline-marker';
      if (seekable) {
        marker.type = 'button';
        const action = event.kind === 'query' ? 'question' : event.kind === 'response' ? 'response' : event.kind;
        marker.setAttribute('aria-label', 'Seek to ' + action + ' at ' + formatTime(event.time));
        marker.addEventListener('click', () => seekToSource(event.time));
      }
      const label = document.createElement('strong');
      label.className = 'timeline-label';
      label.textContent = event.label;
      const time = document.createElement('time');
      time.className = 'timeline-time';
      time.dateTime = 'PT' + event.time + 'S';
      time.textContent = formatTime(event.time);
      marker.append(label, time);
      if (!seekable) {
        const note = document.createElement('span');
        note.className = 'timeline-note';
        note.textContent = example.clip ? 'Outside this excerpt' : 'Still frame';
        marker.append(note);
      }
      row.append(marker);
      timeline.append(row);
      event.node = row;
    });
  }

  function replayState(sourceTime) {
    if (!activeExample) return 'No recorded example is available.';
    const response = timeInSeconds(activeExample.response_time);
    if (!activeExample.clip) return 'Still frame · Model-generated memory write at ' + formatTime(response) + '.';
    if (video?.ended || sourceTime >= excerptRange().end) {
      const label = activeMode === 'CM' ? 'Summary written' : activeMode === 'PA' ? 'Automatic alert' : 'Response';
      return 'Recorded playback complete · ' + label + ' at ' + formatTime(response) + (activeMode === 'CM' || activeMode === 'PA' ? '; no user question.' : '.');
    }
    const query = timeInSeconds(activeExample.query_time);
    const evidence = timeInSeconds(activeExample.evidence_time);
    const deadline = timeInSeconds(activeExample.deadline);
    if (activeMode === 'FP') {
      if (query != null && sourceTime < query) return 'Recorded replay · Before the question at ' + formatTime(query) + '.';
      if (evidence != null && sourceTime < evidence) return 'Recorded replay · Waiting for evidence after the question.';
      if (response != null && sourceTime < response) return 'Recorded replay · Evidence available; response not yet emitted.';
      if (deadline != null && sourceTime > deadline) return 'Recorded replay · Response window ended; reply was emitted at ' + formatTime(response) + '.';
      return 'Recorded replay · Response emitted at ' + formatTime(response) + '.';
    }
    if (activeMode === 'PA') {
      return response != null && sourceTime >= response
        ? 'Recorded replay · Automatic alert emitted at ' + formatTime(response) + '; no user question.'
        : 'Recorded replay · Before the phase-transition alert; no user question.';
    }
    if (activeMode === 'CM') {
      return response != null && sourceTime >= response
        ? 'Recorded replay · Summary written at ' + formatTime(response) + '; no user question.'
        : 'Recorded replay · Waiting for memory write at ' + formatTime(response) + '; no user question.';
    }
    if (activeMode === 'BM') {
      return response != null && sourceTime >= response
        ? 'Recorded replay · Response emitted using earlier procedural memory.'
        : 'Recorded replay · Earlier memory is available; the question arrives at ' + formatTime(query) + '.';
    }
    return response != null && sourceTime >= response
      ? 'Recorded replay · Current-scene response emitted at ' + formatTime(response) + '.'
      : 'Recorded replay · Before the current-scene question at ' + formatTime(query) + '.';
  }

  function updateReplay() {
    const { start } = excerptRange();
    const offset = activeExample?.clip && Number.isFinite(video?.currentTime) ? video.currentTime : 0;
    const sourceTime = start + offset;
    if (clock) {
      clock.textContent = activeExample ? formatTime(sourceTime) + (activeExample.clip ? '' : ' · Still frame') : '—';
      if (activeExample) clock.dateTime = 'PT' + Math.floor(sourceTime) + 'S';
      else clock.removeAttribute('datetime');
    }
    let current = -1;
    timelineEvents.forEach((event, index) => { if (event.time <= sourceTime) current = index; });
    timelineEvents.forEach((event, index) => {
      const state = index === current ? 'current' : event.time <= sourceTime ? 'past' : 'upcoming';
      event.node.classList.toggle('is-current', state === 'current');
      event.node.classList.toggle('is-past', state === 'past');
      event.node.classList.toggle('is-upcoming', state === 'upcoming');
      event.node.dataset.state = state;
      if (state === 'current') event.node.setAttribute('aria-current', 'step');
      else event.node.removeAttribute('aria-current');
    });
    setText('replay-status', playbackNotice || replayState(sourceTime));
  }

  function applyPendingSeek() {
    if (!pendingSeek || !activeExample?.clip || !video || video.readyState < 1) return;
    const request = pendingSeek;
    if (request.generation !== playbackGeneration) { pendingSeek = null; return; }
    const duration = Number.isFinite(video.duration) ? video.duration : excerptRange().end - excerptRange().start;
    try {
      video.currentTime = Math.max(0, Math.min(request.offset, duration));
    } catch {
      // Keep the request until metadata/canplay makes the new source seekable.
      return;
    }
    pendingSeek = null;
    playbackNotice = '';
    updateReplay();
    if (!request.play) return;
    try {
      const playing = video.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => {
        if (request.generation !== playbackGeneration) return;
        playbackNotice = 'Recorded replay is paused. Use the video controls to start playback.';
        updateReplay();
      });
    } catch {
      playbackNotice = 'Recorded replay is paused. Use the video controls to start playback.';
      updateReplay();
    }
  }

  function seekToSource(sourceTime, play = false) {
    if (!video || !canSeekTo(sourceTime)) return;
    video.pause();
    playbackNotice = '';
    pendingSeek = { offset: sourceTime - excerptRange().start, play, generation: playbackGeneration };
    if (video.readyState < 1) playbackNotice = 'Loading recorded footage; the transcript remains available.';
    applyPendingSeek();
    updateReplay();
  }

  function selectMode(value, moveFocus = false, updateURL = true) {
    const mode = validMode(value) || 'RT';
    const descriptor = modes[mode];
    const example = examples.find(item => String(item.mode).toUpperCase() === mode);
    activeMode = mode;
    activeExample = example || null;
    playbackGeneration += 1;
    pendingSeek = null;
    playbackNotice = '';
    if (updateURL) rememberMode(mode);
    tabs.forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });
    panel?.setAttribute('aria-labelledby', 'tab-' + mode);
    setText('example-mode', descriptor.name);
    setText('example-title', example?.title || descriptor.title);
    setText('mode-description', descriptor.description);
    setText('query-label', mode === 'PA' ? 'Automatic alert' : mode === 'CM' ? 'Memory write' : 'Question');
    if (replayButton) replayButton.disabled = !example?.clip;
    if (jumpButton) jumpButton.disabled = !canSeekTo(timeInSeconds(example?.response_time));
    if (taskLink) {
      taskLink.hidden = !/^T(?:[1-9]|1[0-4])$/.test(example?.task || '');
      if (!taskLink.hidden) {
        taskLink.href = 'benchmark.html#task-' + example.task;
        taskLink.textContent = 'Task ' + example.task + ' · Benchmark guide';
      } else taskLink.removeAttribute('href');
    }
    renderTimeline(example);
    if (!video || !still) { updateReplay(); return; }
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.hidden = true;
    still.hidden = true;
    still.removeAttribute('src');
    still.alt = '';
    if (!example) {
      video.load();
      setText('example-source', 'Recorded surgical footage');
      setText('example-range', '');
      setText('example-caption', 'A recorded example for this mode has not been included in this selection.');
      setText('example-query', 'No selected recorded question for this mode.');
      setText('example-answer', 'No recorded response is displayed.');
      setText('query-time', '');
      setText('answer-time', '');
      renderRecords([]);
      updateReplay();
      return;
    }
    if (example.clip) {
      video.src = mediaURL(example.clip);
      video.hidden = false;
      if (example.poster) video.poster = mediaURL(example.poster);
    } else if (example.poster) {
      still.src = mediaURL(example.poster);
      still.alt = [example.title || descriptor.title, example.source].filter(Boolean).join(' — ');
      still.hidden = false;
    }
    video.load();
    setText('example-source', example.source || 'Recorded surgical footage');
    const range = example.start === example.end ? formatTime(example.start) : [formatTime(example.start), formatTime(example.end)].filter(Boolean).join(' — ');
    setText('example-range', range);
    setText('example-caption', example.caption || 'Edited replay. Source timestamps refer to the original surgical recording.');
    const proactiveText = mode === 'CM'
      ? 'No user question. The model writes a phase summary to memory.'
      : mode === 'PA' ? 'No user question. The model issues an automatic phase-transition alert.' : null;
    setText('example-query', example.query || proactiveText || example.caption || 'No user question: this mode writes a proactive output.');
    setText('example-answer', example.display_answer || example.answer || 'No recorded response in the selected window.');
    setText('query-time', formatTime(example.query_time));
    setText('answer-time', formatTime(example.response_time));
    renderRecords(example.records);
    updateReplay();
  }

  replayButton?.addEventListener('click', () => seekToSource(excerptRange().start, true));
  jumpButton?.addEventListener('click', () => seekToSource(timeInSeconds(activeExample?.response_time)));
  if (video) {
    ['loadedmetadata', 'durationchange', 'canplay'].forEach(event => video.addEventListener(event, applyPendingSeek));
    ['timeupdate', 'seeked', 'play', 'pause', 'ended', 'loadedmetadata'].forEach(event => video.addEventListener(event, updateReplay));
    video.addEventListener('play', () => { playbackNotice = ''; updateReplay(); });
    video.addEventListener('error', () => {
      if (!activeExample?.clip) return;
      pendingSeek = null;
      playbackNotice = 'This recorded clip could not be loaded. Its question and response remain available.';
      updateReplay();
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectMode(tab.dataset.mode));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next == null) return;
      event.preventDefault();
      selectMode(tabs[next].dataset.mode, true);
    });
  });
  document.querySelectorAll('a[data-example-mode]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const mode = validMode(link.dataset.exampleMode);
      if (!mode) return;
      event.preventDefault();
      selectMode(mode, true, false);
      rememberMode(mode, '#examples');
      document.getElementById('examples')?.scrollIntoView({ behavior: reducedMotion?.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });
  if (data.sourceNote) setText('source-note', data.sourceNote);
  const firstMode = examples[0] && String(examples[0].mode).toUpperCase();
  selectMode(modeFromURL() || validMode(firstMode) || 'RT', false, false);
  window.addEventListener('popstate', () => selectMode(modeFromURL() || validMode(firstMode) || 'RT', false, false));

  const navToggle = document.getElementById('nav-toggle');
  const projectNav = document.getElementById('project-nav');
  if (navToggle && projectNav) {
    const header = navToggle.closest('header');
    const navLinks = [...projectNav.querySelectorAll('a')];
    const setNavOpen = open => {
      navToggle.setAttribute('aria-expanded', String(open));
      projectNav.classList.toggle('is-open', open);
      header?.classList.toggle('nav-open', open);
    };
    document.body.classList.add('has-site-nav');
    setNavOpen(false);
    navToggle.addEventListener('click', () => setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
    navLinks.forEach(link => link.addEventListener('click', () => setNavOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || navToggle.getAttribute('aria-expanded') !== 'true') return;
      setNavOpen(false);
      navToggle.focus({ preventScroll: true });
    });
    const sectionLinks = navLinks.map(link => {
      const hash = link.getAttribute('href');
      if (!hash?.startsWith('#')) return null;
      const id = hash === '#approach' ? 'overview' : hash.slice(1);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    }).filter(Boolean);
    const setCurrentSection = section => {
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      const match = sectionLinks.find(item => item.section === section);
      match?.link.setAttribute('aria-current', 'location');
    };
    const updateCurrentSection = () => {
      const headerBottom = header?.getBoundingClientRect().bottom || 0;
      const scrollPaddingTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const readingMarker = Math.max(headerBottom + 24, scrollPaddingTop + 1);
      const current = sectionLinks.find(({ section }) => {
        const { top, bottom } = section.getBoundingClientRect();
        return top <= readingMarker && bottom > readingMarker;
      });
      setCurrentSection(current?.section || null);
    };
    let navUpdatePending = false;
    const scheduleNavUpdate = () => {
      if (navUpdatePending) return;
      navUpdatePending = true;
      requestAnimationFrame(() => {
        navUpdatePending = false;
        updateCurrentSection();
      });
    };
    window.addEventListener('scroll', scheduleNavUpdate, { passive: true });
    window.addEventListener('resize', scheduleNavUpdate, { passive: true });
    updateCurrentSection();
  }

  const copyButton = document.getElementById('copy-citation');
  const copyLabel = copyButton?.querySelector('span');
  let resetCopyLabel;
  copyButton?.addEventListener('click', async () => {
    const text = document.getElementById('bibtex').textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      if (copyLabel) copyLabel.textContent = 'Copied';
      setText('copy-status', 'BibTeX copied to clipboard.');
    } catch {
      if (copyLabel) copyLabel.textContent = 'Select text to copy';
      setText('copy-status', 'Please select and copy the citation text.');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('bibtex'));
      selection.removeAllRanges();
      selection.addRange(range);
    }
    clearTimeout(resetCopyLabel);
    resetCopyLabel = setTimeout(() => { if (copyLabel) copyLabel.textContent = 'Copy BibTeX'; }, 2500);
  });

  const diagramDialog = document.getElementById('method-diagram-dialog');
  const expandedDiagram = document.getElementById('expanded-method-diagram');
  const diagramScroll = diagramDialog.querySelector('.method-diagram-scroll');
  const diagramZoom = document.getElementById('zoom-method-diagram');
  document.querySelectorAll('[data-method-diagram]').forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      expandedDiagram.src = image.getAttribute('src');
      expandedDiagram.alt = image.alt;
      setText('method-diagram-title', button.dataset.methodDiagram === 'wam'
        ? 'Workflow-Anchored Memory' : 'Deadline-aware Transition Learning');
      diagramScroll.classList.remove('is-zoomed');
      diagramZoom.setAttribute('aria-pressed', 'false');
      diagramZoom.textContent = 'Zoom in';
      diagramDialog.showModal();
      diagramScroll.scrollTo(0, 0);
    });
  });
  diagramZoom.addEventListener('click', () => {
    const zoomed = diagramScroll.classList.toggle('is-zoomed');
    diagramZoom.setAttribute('aria-pressed', String(zoomed));
    diagramZoom.textContent = zoomed ? 'Fit to screen' : 'Zoom in';
  });
  document.getElementById('close-method-diagram').addEventListener('click', () => diagramDialog.close());
  diagramDialog.addEventListener('click', event => {
    if (event.target !== diagramDialog) return;
    const bounds = diagramDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) diagramDialog.close();
  });
})();
