# SurgStream project page

A concise academic project homepage with a 40-second research film, five selected recorded examples and a benchmark overview. The complete 14-task guide is on `benchmark.html`, linked from the homepage. This folder is the complete website. It uses relative paths, local fonts and native media playback; it needs no build process or backend.

## Preview locally

From this folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ .

## Deployment

The public website is [https://surgstream.github.io/](https://surgstream.github.io/). Its source repository is [surgstream/surgstream.github.io](https://github.com/surgstream/surgstream.github.io), under the [SurgStream organization](https://github.com/surgstream). GitHub Pages is configured to use GitHub Actions; pushes to `main` automatically deploy the site.

To deploy another copy:

1. Put the contents of this folder at the root of a GitHub repository on the `main` branch. Include the hidden `.github/` folder and `.nojekyll` file.
2. In repository Settings → Pages, set Source to **GitHub Actions**.
3. The included `pages.yml` workflow deploys on a push to `main`; it can also be run manually from Actions.

Internal navigation, media, styles and scripts use relative paths, so the files can run at either a root URL or a repository subpath. The canonical URLs in `index.html` and `benchmark.html`, and the social-preview URLs in `index.html`, point to the official `https://surgstream.github.io/` domain. Update those metadata URLs when hosting a separate copy.

Styles and interactive scripts include content-hash query versions so a new deployment does not retain older browser-cached code. Update the matching version in both pages when changing those files.

## Content and provenance

The Updates section records the confirmed availability of the project website and research manuscript on 2026-10-25. arXiv and publication updates will be added when confirmed. Main headings, metadata and key descriptions use the manuscript title and wording, including “what to remember and when to respond”.

WAM/DTL flow nodes use 20px text with 26px arrows on desktop and stack vertically on mobile. BibTeX remains expanded with a copy button. Film download links have been removed; native video players use `controlslist="nodownload"` to request that supporting browsers hide the download control.

`media-guard.js` blocks image/video context menus and dragging, with `draggable="false"` and CSS mobile callout restrictions; text selection and BibTeX copying remain available, and public static media can still be saved intentionally.

- `assets/surgstream-promo.mp4`: 40-second silent H.264 film, 1920×1080, 30fps. The original full owl logo and wordmark are prominent in the opening and closing, with a consistent header during demonstrations. Like the supplied reference, its story is carried by on-screen text. English and Chinese captions are included.
- `assets/clip-*.mp4`: continuous excerpts of the source recordings; FP keeps the full 72-second interval.
- `assets/demo-data.json`: exact recorded answers, full RT multiple-choice prompt, source timestamps, question-snapshot hash and model-adapter hash. The RT display removes the option letter and adds spaces to the phase name; the raw output is preserved separately.
- `benchmark.html` and `assets/benchmark-guide.json`: definitions, timing windows, scoring rules and reference examples for T1–T14; the five temporal modes and five clinical scenarios; causal input and procedure-level split handling. The guide page works without JavaScript. Its examples are label-derived targets from CholecT50 VID06, distinct from the selected recorded model outputs. Source code and question-snapshot hashes identify the audited definitions.
- `assets/poster-cm.jpg`: a single actual source frame, displayed as a still image.
- `assets/surgstream-manuscript.pdf`: the research manuscript snapshot linked from the Updates entry.
- `assets/method-wam.svg` and `assets/method-dtl.svg`: vector crops of the manuscript's original framework artwork, displayed as clickable previews with an on-page dialog and Zoom control.
- `assets/surgstream-logo.png`, `surgstream-wordmark.png` and `surgstream-icon.png`: unchanged artwork exported from the manuscript's `SurgStream_Logo.pdf`, with surrounding whitespace cropped. The owl and original burgundy-to-black wordmark are used throughout the page and film. Main colors follow the paper's `#B8324F`, `#1A1A1A` and warm ivory; WAM/DTL retain their respective method colors.
- `assets/surgstream-logo-transparent.png`, `surgstream-icon-transparent.png` and `favicon-transparent.png`: transparent navigation exports from the same original vector artwork, with only its two page-sized white background paths omitted. Internal white details remain opaque. The browser favicon and navigation wordmark use these assets.

These are selected research demonstrations. They do not estimate aggregate performance or establish clinical suitability. The film omits 61 seconds of waiting in the FP example; the source clock jumps from 13:02 to 14:03. Its answer still appears at the recorded 14:06 timestamp. The BM chapter jumps from earlier evidence at 01:40 to the later question at 06:14. The website clips are continuous. Concurrent questions and outputs are omitted from the selected transcript.

The CM phase summary in the recorded demonstration is model-generated; its interval approximates the expert label, and its event counts have not been independently verified. The complete example record preserves this distinction. The separate task guide explains that Summary counts are not separately scored by T14.

The formal benchmark retains categorical multiple-choice questions for T1, T6, T10 and T11. Promotional displays show answer content without choice letters. The guide's split counts are manuscript-reported, not a new dataset recount.

## Credits and media rights

Surgical footage and annotations originate from [Cholec80](https://camma.unistra.fr/datasets/) and [CholecT50](https://github.com/CAMMA-public/cholect50), provided by CAMMA. Shared VID73/VID32 recordings are shown using the project's existing Cholec80 video copies and CholecT50 benchmark labels. Dataset terms continue to govern the excerpts; no new license to the footage or annotations is granted by this package.

Fonts are DM Sans and Newsreader, distributed under the included SIL Open Font License files. The page layout was inspired by [SurgΣ](https://surgsigma.github.io/) and [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template): centered title and author information, a film, modular research sections, resource links and BibTeX. This site's implementation is original and its brand artwork comes from the SurgStream manuscript. No source code, images or claims from the referenced projects are included.

Only this folder is intended for publication. Internal source audits, review records and preparation tools are kept outside it.
