(() => {
  'use strict';

  const mediaSelector = 'img, video, picture';
  document.querySelectorAll(mediaSelector).forEach(media => {
    media.setAttribute('draggable', 'false');
    if (media.tagName === 'VIDEO') media.controlsList?.add('nodownload');
  });
  document.querySelectorAll('a').forEach(link => {
    if (link.querySelector(mediaSelector)) link.setAttribute('draggable', 'false');
  });

  // Keep ordinary text selection, links and the BibTeX copy control available.
  const preventMediaSave = event => {
    if (event.target instanceof Element && event.target.closest(mediaSelector)) {
      event.preventDefault();
    }
  };
  document.addEventListener('contextmenu', preventMediaSave, true);
  document.addEventListener('dragstart', preventMediaSave, true);
})();
