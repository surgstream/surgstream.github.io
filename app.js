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
  const tabs = [...document.querySelectorAll('[role="tab"][data-mode]')];
  const video = document.getElementById('example-video');
  const still = document.getElementById('example-still');
  const panel = document.getElementById('example-panel');

  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text == null ? '' : String(text);
  };

  function formatTime(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'string' && value.includes(':')) return value;
    const seconds = Math.max(0, Math.floor(Number(value)));
    if (!Number.isFinite(seconds)) return String(value);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return (hours ? String(hours).padStart(2, '0') + ':' : '') + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
  }

  function renderRecords(records) {
    const container = document.getElementById('example-records');
    container.replaceChildren();
    const entries = Array.isArray(records) ? records : [];
    container.hidden = !entries.length;
    entries.forEach(record => {
      const row = document.createElement('div');
      row.className = 'record-entry';
      if (typeof record === 'string') {
        row.textContent = record;
      } else if (record && typeof record === 'object') {
        const time = formatTime(record.time ?? record.t ?? record.timestamp);
        const type = record.type || record.state || '';
        const text = record.text || record.content || record.answer || '';
        row.textContent = [time && '[' + time + ']', type, text].filter(Boolean).join(' · ');
      }
      container.append(row);
    });
  }

  function selectMode(mode, moveFocus = false) {
    const descriptor = modes[mode] || modes.RT;
    const example = examples.find(item => String(item.mode).toUpperCase() === mode);
    tabs.forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });
    panel.setAttribute('aria-labelledby', 'tab-' + mode);
    setText('example-mode', descriptor.name);
    setText('example-title', example?.title || descriptor.title);
    setText('mode-description', descriptor.description);
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
      return;
    }
    if (example.clip) {
      video.src = example.clip;
      video.hidden = false;
      if (example.poster) video.poster = example.poster;
    } else if (example.poster) {
      still.src = example.poster;
      still.alt = [example.title || descriptor.title, example.source].filter(Boolean).join(' — ');
      still.hidden = false;
    }
    video.load();
    setText('example-source', example.source || 'Recorded surgical footage');
    const range = example.start === example.end ? formatTime(example.start) : [formatTime(example.start), formatTime(example.end)].filter(Boolean).join(' — ');
    setText('example-range', range);
    setText('example-caption', example.caption || 'Edited replay. Source timestamps refer to the original surgical recording.');
    setText('example-query', example.query || 'No user query: this mode uses a proactive output.');
    setText('example-answer', example.display_answer || example.answer || 'No recorded response in the selected window.');
    setText('query-time', formatTime(example.query_time));
    setText('answer-time', formatTime(example.response_time));
    renderRecords(example.records);
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
  if (data.sourceNote) setText('source-note', data.sourceNote);
  const firstMode = examples[0] && String(examples[0].mode).toUpperCase();
  selectMode(modes[firstMode] ? firstMode : 'RT');

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
