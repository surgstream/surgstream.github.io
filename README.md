# SurgStream project page

A concise academic project homepage with a 114-second research film, five selected recorded examples, a benchmark overview and research resources. The benchmark covers various tasks across five temporal modes and five clinical scenarios. Detailed task-guide entry points and the results summary have been removed. The legacy `benchmark.html` address redirects to the homepage overview. This folder is the complete website. It uses relative paths, local fonts and native media playback; it needs no build process or backend.

## Preview locally

From this folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ .

For video seeking during development, the preparation workspace also provides `tools/preview_site.py`: run it from the parent `web-promo/` folder and open http://127.0.0.1:4175/site/ . It supports HTTP byte ranges, which Python's basic `http.server` does not. GitHub Pages handles range requests in production.

## Deployment

The public website is [https://surgstream.github.io/](https://surgstream.github.io/). Its source repository is [surgstream/surgstream.github.io](https://github.com/surgstream/surgstream.github.io), under the [SurgStream organization](https://github.com/surgstream). GitHub Pages is configured to use GitHub Actions; pushes to `main` automatically deploy the site.

To deploy another copy:

1. Put the contents of this folder at the root of a GitHub repository on the `main` branch. Include the hidden `.github/` folder and `.nojekyll` file.
2. In repository Settings → Pages, set Source to **GitHub Actions**.
3. The included `pages.yml` workflow deploys on a push to `main`; it can also be run manually from Actions.

Internal navigation, media, styles and scripts use relative paths, so the files can run at either a root URL or a repository subpath. The canonical URLs in `index.html` and `benchmark.html`, and the social-preview URLs in `index.html`, point to the official `https://surgstream.github.io/` domain. Update those metadata URLs when hosting a separate copy.

Styles and interactive scripts include content-hash query versions so a new deployment does not retain older browser-cached code. Update the matching version in the homepage when changing those files.

## Content and provenance

The Updates section contains a single announcement dated 2026-10-25: “The project website and research manuscript are now available.” arXiv and publication updates will be added when confirmed. Main headings, metadata and key descriptions use the manuscript title and wording, including “what to remember and when to respond”.

The sticky navigation highlights the current homepage section and collapses into a Menu on smaller screens. The five-mode player provides a source-video clock, event timeline, Replay and Jump to response controls. Recorded outputs appear at their source timestamps: the PA alert at 31:14 and the CM summary at 16:54. These two output cards are placed above the no-question description. In BM, Earlier memory switches to real footage around 12:08, while Back to question returns to 16:10. Other events outside an excerpt remain labeled, non-seekable markers. All five modes have continuous footage; CM's memory write is 11 seconds into its 15-second excerpt. A URL such as `index.html?mode=FP#examples` opens a particular mode.

The benchmark overview lists its five temporal modes and five clinical scenarios without task-by-task guide links. Research resources follow it as section 05. Quantitative comparisons remain available in the linked manuscript.

WAM/DTL flow nodes use 20px text with 26px arrows on desktop and stack vertically on mobile. BibTeX remains expanded with a copy button. Film download links have been removed; native video players use `controlslist="nodownload"` to request that supporting browsers hide the download control.

`media-guard.js` blocks image/video context menus and dragging, with `draggable="false"` and CSS mobile callout restrictions; text selection and BibTeX copying remain available, and public static media can still be saved intentionally.

- `assets/surgstream-promo.mp4`: 114-second silent H.264 film, 1920×1080, 30fps. The v3 film gives each mode a three-second introduction followed by real continuous surgical footage and a recorded response or memory write. BM includes a separately labeled earlier-memory replay with its own source clock. Mode names and descriptions fit on single lines, with RT blue, BM purple, FP orange, PA yellow and CM green matching the paper and website. Tracked titles share a font baseline, including the hyphen in Real-time. The original full owl logo and wordmark remain prominent in the opening and closing. English and Chinese captions are included.
- `assets/clip-*.mp4`: continuous excerpts of the source recordings; FP keeps the full 72-second interval.
- `assets/clip-bm-memory.mp4` and `assets/poster-bm-memory.jpg`: VID73's 12:03–12:14 continuous recall excerpt and its actual 12:08 source frame. The website can switch to this footage from the BM timeline and return to the 16:10 question.
- `assets/demo-data.json`: exact recorded answers, full RT multiple-choice prompt, source timestamps, question-snapshot hash and model-adapter hash. The RT display removes the option letter and adds spaces to the phase name. Displayed triplets replace underscores with spaces; raw outputs remain preserved.
- `benchmark.html`: a compatibility redirect to the homepage benchmark overview. The previous detailed guide is no longer linked or displayed. Existing reference metadata is retained for source verification.
- `assets/clip-cm.mp4` and `assets/poster-cm.jpg`: a continuous 15-second source excerpt, 16:43–16:58, and its actual source poster. The recorded Summary is written at 16:54.
- `assets/surgstream-manuscript.pdf`: the research manuscript PDF downloaded directly after a fresh Overleaf compilation on 2026-10-26 at 22:46:02 HKT (build `1a178acee62-9e3a971a35321666`); 5 pages, 2,014,686 bytes, SHA256 `3596d8e868db963e884329d6db57de8a533583639470e9ccec54fb30af7ef1bb`. The first four pages contain the technical paper, followed by ethics, acknowledgements and references on page 5.
- `assets/method-wam.svg` and `assets/method-dtl.svg`: vector crops of the manuscript's original framework artwork, displayed as clickable previews with an on-page dialog and Zoom control.
- `assets/surgstream-logo.png`, `surgstream-wordmark.png` and `surgstream-icon.png`: unchanged artwork exported from the manuscript's `SurgStream_Logo.pdf`, with surrounding whitespace cropped. The owl and original burgundy-to-black wordmark are used throughout the page and film. Main colors follow the paper's `#B8324F`, `#1A1A1A` and warm ivory; WAM/DTL retain their respective method colors.
- `assets/surgstream-logo-transparent.png`, `surgstream-icon-transparent.png` and `favicon-transparent.png`: transparent navigation exports from the same original vector artwork, with only its two page-sized white background paths omitted. Internal white details remain opaque. The browser favicon and navigation wordmark use these assets.

These are selected research demonstrations. They do not estimate aggregate performance or establish clinical suitability. The current-stream clips and BM recall excerpt are continuous source footage at 1×. BM, PA and CM hold their last frame for reading; each hold is labeled and its source clock stops. The FP film excerpt runs continuously from 13:51 to 14:11 and labels the earlier 13:00 request as pending; the response appears at the recorded 14:06 timestamp. After the BM question at 16:10, the film shows current footage and the 12:03–12:14 earlier-memory replay side by side, with separate source clocks. The website clips are also continuous, including the full 72-second FP interval. Concurrent questions and outputs are omitted from the selected transcript.

The CM phase summary is a recorded model-generated memory write, displayed when the source video reaches 16:54.

The formal benchmark retains categorical multiple-choice questions where applicable. Promotional displays show answer content without choice letters. Split counts are manuscript-reported, not a new dataset recount.

## Credits and media rights

Surgical footage and annotations originate from [Cholec80](https://camma.unistra.fr/datasets/) and [CholecT50](https://github.com/CAMMA-public/cholect50), provided by CAMMA. Shared VID73/VID32 recordings are shown using the project's existing Cholec80 video copies and CholecT50 benchmark labels. Dataset terms continue to govern the excerpts; no new license to the footage or annotations is granted by this package.

Fonts are DM Sans and Newsreader, distributed under the included SIL Open Font License files. Page template: [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template). Brand artwork comes from the SurgStream manuscript, and comparison values come from the linked manuscript.

Only this folder is intended for publication. Internal source audits, review records and preparation tools are kept outside it.
