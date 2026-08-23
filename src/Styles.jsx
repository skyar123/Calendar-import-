// The whole stylesheet, kept out of App.jsx so the component file stays about
// behaviour. This project has no Tailwind and no CSS build step: one <style>
// tag, plain CSS, custom properties for the palette.

import React from 'react';

export default function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Albert+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

:root {
  --paper:#FBFAF6; --card:#FFFFFF; --ink:#22333B; --ink-soft:#5D6B70; --line:#E3DFD3;
  --pine:#2E5D4E; --pine-deep:#234A3E; --marigold:#E8A33D; --marigold-soft:#FBF0DC;
  --clay:#A9603F; --frp:#EAF2EC;
  --over:#7C2D2D; --soon:#B57A17; --ok:#5D6B70;
}
* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
button, a, select, input, textarea { touch-action:manipulation; }
.app { min-height:100vh; background:var(--paper); color:var(--ink); font-family:'Albert Sans',system-ui,sans-serif; font-size:15px; line-height:1.55; -webkit-font-smoothing:antialiased; }
.shell { max-width:44rem; margin:0 auto; padding:0 1.1rem 4rem; }
/* Client names are arbitrary text. A long unbroken one used to widen the page
   by tens of thousands of pixels, so wrapping is forced everywhere text lands
   rather than trusted to break on spaces. */
.app { overflow-x:hidden; }
.case-name, .case-meta, .pick-name, .pick-meta, .sched-label, .up-label,
.items, .due-chip, .dupe-tag, .absent-box, .preview-line, .toast, .issue {
  overflow-wrap:anywhere; word-break:break-word; min-width:0;
}

.flex { display:flex; } .flex-wrap { flex-wrap:wrap; } .flex-1 { flex:1 1 0%; }
.items-center { align-items:center; } .min-w-0 { min-width:0; }
.gap-2 { gap:8px; } .gap-3 { gap:12px; }
.mt-2 { margin-top:8px; } .mt-3 { margin-top:12px; } .mt-4 { margin-top:16px; } .mt-5 { margin-top:20px; }
.pt-8 { padding-top:32px; } .pb-6 { padding-bottom:24px; }

.eyebrow { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--pine); font-weight:700; margin-bottom:6px; }
.brand { font-family:'Bricolage Grotesque',sans-serif; font-weight:800; font-size:2.35rem; line-height:1.02; letter-spacing:-0.02em; margin:0 0 10px; }
.tagline { color:var(--ink-soft); font-size:15px; max-width:34rem; margin:0; }
.privacy { background:var(--marigold-soft); border:1px solid #EFD9B4; border-radius:14px; padding:12px 14px; font-size:13.5px; color:#6E5424; }

.tabs { display:flex; gap:6px; flex-wrap:wrap; border-bottom:1px solid var(--line); padding-bottom:10px; }
.tab { display:inline-flex; align-items:center; gap:6px; background:none; border:1px solid transparent; color:var(--ink-soft); font-family:inherit; font-size:14px; font-weight:600; padding:8px 14px; border-radius:999px; cursor:pointer; }
.tab:hover { background:#F0EDE3; color:var(--ink); }
.tab-on { background:var(--pine); color:#fff; }
.tab-on:hover { background:var(--pine-deep); color:#fff; }

.card { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:16px 18px; }
.card-title { display:flex; align-items:center; gap:7px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:16px; color:var(--ink); margin-bottom:6px; }
.card-body { padding-top:6px; }
.hint { color:var(--ink-soft); font-size:13.5px; margin:0; }
.note { background:#F1EFE6; border-radius:12px; padding:9px 12px; font-size:13px; color:var(--ink-soft); }
.muted { color:var(--ink-soft); }
code { background:#F1EFE6; border-radius:5px; padding:1px 5px; font-size:12.5px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }

.ta, .in { width:100%; font-family:inherit; font-size:15px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
.ta:focus, .in:focus { outline:2px solid #CBDDCE; outline-offset:1px; border-color:#CBDDCE; }
.paste { margin-top:10px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; line-height:1.6; resize:vertical; }

.btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:7px; background:var(--pine); color:#fff; border:none; cursor:pointer; padding:12px 18px; border-radius:999px; font-weight:600; font-size:14.5px; font-family:inherit; transition:background .15s,transform .1s; }
.btn-primary:hover { background:var(--pine-deep); }
.btn-primary:active { transform:scale(.985); }
.btn-primary:disabled { opacity:.4; cursor:default; }
.btn-quiet { display:inline-flex; align-items:center; justify-content:center; gap:7px; background:transparent; color:var(--pine); border:1px solid var(--line); cursor:pointer; padding:11px 18px; border-radius:999px; font-weight:600; font-size:14px; font-family:inherit; }
.btn-quiet:hover { background:var(--frp); border-color:#CBDDCE; }
.btn-quiet:disabled { opacity:.4; cursor:default; }
.btn-ghost-solid { display:inline-flex; align-items:center; justify-content:center; gap:7px; background:var(--card); color:var(--ink); border:1px solid var(--line); cursor:pointer; padding:12px 18px; border-radius:999px; font-weight:600; font-size:14.5px; font-family:inherit; }
.btn-ghost-solid:hover { border-color:#CFC9B8; }
.btn-ghost-solid:disabled { opacity:.4; cursor:default; }
.btn-ghost { display:inline-flex; align-items:center; gap:6px; background:none; border:none; color:var(--ink-soft); cursor:pointer; font-family:inherit; font-size:14px; font-weight:600; padding:8px 10px; border-radius:10px; }
.btn-ghost:hover { background:#F0EDE3; color:var(--ink); }
.btn-ghost.danger:hover { background:#FDECEC; color:var(--over); }
.icon-btn { display:inline-flex; align-items:center; justify-content:center; background:none; border:none; color:var(--ink-soft); cursor:pointer; padding:8px; border-radius:10px; text-decoration:none; }
.icon-btn:hover { background:#F0EDE3; color:var(--ink); }
.link-btn { background:none; border:none; padding:2px 0; margin-top:3px; color:var(--pine); font-family:inherit; font-size:12.5px; font-weight:600; cursor:pointer; text-decoration:underline; }
.chip-btn { display:inline-flex; align-items:center; gap:5px; background:var(--paper); border:1px solid var(--line); border-radius:999px; padding:6px 12px; margin:4px 6px 0 0; font-family:inherit; font-size:13px; font-weight:600; color:var(--ink); cursor:pointer; }
.chip-btn:hover { border-color:#CBDDCE; background:var(--frp); }

.empty { border:1.5px dashed var(--line); border-radius:16px; padding:26px 18px; text-align:center; color:var(--ink-soft); font-size:14px; }
.foot { margin-top:40px; padding-top:16px; border-top:1px solid var(--line); color:var(--ink-soft); font-size:13px; }

.case-row { display:flex; align-items:stretch; gap:4px; }
.case-open { flex:1; display:flex; align-items:center; justify-content:space-between; gap:10px; background:none; border:none; padding:0; cursor:pointer; text-align:left; font-family:inherit; min-width:0; color:inherit; }
.case-name { font-weight:700; font-size:15.5px; }
.case-age { font-weight:500; color:var(--ink-soft); }
.case-meta { font-size:12.5px; color:var(--ink-soft); margin-top:2px; }
.chev { color:var(--ink-soft); transition:transform .15s; flex-shrink:0; }
.chev-open { transform:rotate(180deg); }
.client-card { padding:14px 16px; }

.due-chip { display:inline-flex; align-items:center; gap:4px; margin-top:7px; font-size:11.5px; font-weight:600; border-radius:999px; padding:3px 9px; background:#F1EFE6; color:var(--ok); }
.tone-red { color:var(--over); } .tone-amber { color:var(--soon); } .tone-green { color:var(--ok); }
.due-chip.tone-red { background:#FDECEC; } .due-chip.tone-amber { background:var(--marigold-soft); }
.tone-text { font-weight:600; }

.field { display:block; }
.field-label { display:block; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); font-weight:700; margin-bottom:4px; }
.review-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
.review-row { position:relative; border-top:1px solid var(--line); padding:14px 34px 4px 0; margin-top:12px; }
.review-row:first-of-type { border-top:none; }
.review-drop { position:absolute; top:10px; right:0; }

.issues { margin-top:8px; display:flex; flex-direction:column; gap:4px; }
.issue { display:flex; align-items:center; gap:5px; font-size:12.5px; border-radius:9px; padding:5px 9px; }
.issue-error { background:#FDECEC; color:var(--over); }
.issue-warn { background:var(--marigold-soft); color:#6E5424; }
.issue-info { background:#F1EFE6; color:var(--ink-soft); }

.sched { margin-top:10px; border-top:1px solid var(--line); }
.export-choice { display:flex; flex-direction:column; gap:9px; }
.big-btn { display:flex; align-items:flex-start; gap:11px; text-align:left; background:var(--pine); color:#fff; border:1px solid var(--pine); border-radius:16px; padding:14px 16px; font-family:inherit; cursor:pointer; }
.big-btn:hover { background:var(--pine-deep); }
.big-btn:disabled { opacity:.4; cursor:default; }
.big-btn svg { flex-shrink:0; margin-top:2px; }
.big-btn strong { display:block; font-size:14.5px; font-weight:700; }
.big-btn em { display:block; font-style:normal; font-size:12.5px; opacity:.85; margin-top:3px; line-height:1.45; }
.big-btn-quiet { background:var(--card); color:var(--ink); border-color:var(--line); }
.big-btn-quiet:hover { background:var(--paper); border-color:#CFC9B8; }
.pick-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid #F5F3EB; }
.pick-row:last-child { border-bottom:none; }
.pick-main { display:flex; align-items:center; gap:9px; flex:1; min-width:0; cursor:pointer; }
.pick-main input { width:16px; height:16px; flex-shrink:0; accent-color:var(--pine); }
.pick-name { display:block; font-size:14px; font-weight:600; }
.pick-meta { display:block; font-size:11.5px; color:var(--ink-soft); }
.pick-off { opacity:.45; }
.pick-off .pick-name { text-decoration:line-through; }
.pick-meta strong { color:var(--pine); font-weight:700; }
.nick-in { width:104px; flex-shrink:0; font-size:13px; padding:6px 9px; }
.sched-check { width:17px; height:17px; margin-top:11px; flex-shrink:0; accent-color:var(--pine); cursor:pointer; }
.sched-off { opacity:.42; }
.sched-off .sched-label { text-decoration:line-through; }
.bulk { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; background:#F7F5EE; border-radius:12px; padding:8px 11px; }
.bulk-count { font-size:12.5px; font-weight:600; color:var(--ink-soft); }
.bulk-actions { display:flex; gap:6px; flex-wrap:wrap; }
.mini { background:#fff; border:1px solid var(--line); border-radius:999px; padding:5px 11px; font-family:inherit; font-size:12px; font-weight:600; color:var(--ink); cursor:pointer; }
.mini:hover { border-color:#CBDDCE; background:var(--frp); }
.mini:disabled { opacity:.45; cursor:default; }
.mini-strong { border-color:#CBDDCE; color:var(--pine); }
.sched-row { display:flex; align-items:flex-start; gap:12px; padding:11px 0; border-bottom:1px solid #F0EDE3; }
.sched-row:last-child { border-bottom:none; }
.sched-date { width:74px; flex-shrink:0; }
.sched-day { font-weight:700; font-size:13px; }
.sched-year { font-size:11.5px; color:var(--ink-soft); }
/* Not a flex row: the name and label must wrap as one sentence rather than
   breaking into columns on a narrow phone. */
.sched-label { font-weight:600; font-size:14.5px; }
.sched-label svg, .up-label svg { vertical-align:-2px; margin-right:3px; }
.sched-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12px; margin-top:3px; }
.items { margin-top:6px; font-size:12.5px; color:var(--ink-soft); background:#F7F5EE; border-radius:10px; padding:8px 10px; }

.pill { font-size:10.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; border-radius:999px; padding:2px 8px; background:#F1EFE6; color:var(--ink-soft); }
.pill-birthday { background:#FBE9EF; color:#8C3A56; }
.pill-sixMonth { background:#E7EEF8; color:#2C4A73; }
.pill-baseline { background:#EFEAF7; color:#4A3A73; }
.pill-treatmentPlan { background:var(--frp); color:var(--pine); }
.pill-sniff { background:var(--marigold-soft); color:#6E5424; }
.pill-annual { background:#F1EFE6; color:#5D5140; }
.pill-ageWindow { background:#EAF3F4; color:#2C5B60; }
.pill-birthOfChild { background:#EDE9F6; color:#463C73; }

.overdue-card { border-color:#F2C9C9; background:#FFFCFC; }
.week { margin-top:12px; }
.week-label { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--pine); font-weight:700; margin-bottom:2px; }
.up-row { display:flex; align-items:flex-start; gap:12px; padding:9px 0; border-bottom:1px solid #F0EDE3; }
.up-row:last-child { border-bottom:none; }
.up-date { width:74px; flex-shrink:0; font-weight:700; font-size:13px; }
.up-label { font-size:14.5px; }

.lead-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #F5F3EB; }
.lead-row:last-of-type { border-bottom:none; }
.lead-check { display:flex; align-items:center; gap:8px; flex:1; font-size:14px; font-weight:600; cursor:pointer; }
.lead-check input { width:16px; height:16px; accent-color:var(--pine); }
.lead-in { width:110px; flex-shrink:0; font-size:13.5px; padding:7px 10px; text-align:center; }

.steps { margin:6px 0 0; padding-left:20px; font-size:13.5px; color:var(--ink-soft); }
.steps li { margin-bottom:8px; }
.steps strong { color:var(--ink); }
.steps a { color:var(--pine); }
.per-client { border-top:1px solid var(--line); padding-top:12px; }
.seg { background:var(--paper); border:1px solid var(--line); border-radius:999px; padding:7px 15px; font-family:inherit; font-size:13.5px; font-weight:600; color:var(--ink-soft); cursor:pointer; }
.seg:hover { border-color:#CBDDCE; color:var(--ink); }
.seg-on { background:var(--pine); border-color:var(--pine); color:#fff; }
.seg-on:hover { background:var(--pine-deep); color:#fff; }
.removal-card { border-color:#EFD9B4; background:#FFFDF8; }
.heads-up { display:flex; align-items:flex-start; gap:9px; background:var(--frp); border:1px solid #CBDDCE; border-radius:14px; padding:12px 14px; font-size:12.5px; line-height:1.5; color:var(--pine); cursor:pointer; }
.heads-up input { width:16px; height:16px; margin-top:1px; flex-shrink:0; accent-color:var(--pine); }
.heads-up strong { font-size:13.5px; color:var(--pine-deep); }
.heads-up em { font-style:normal; font-weight:600; background:#fff; border-radius:5px; padding:0 4px; }
.skip-past { display:flex; align-items:flex-start; gap:9px; background:var(--marigold-soft); border:1px solid #EFD9B4; border-radius:14px; padding:12px 14px; font-size:12.5px; line-height:1.5; color:#6E5424; cursor:pointer; }
.skip-past input { width:16px; height:16px; margin-top:1px; flex-shrink:0; accent-color:var(--pine); }
.skip-past strong { font-size:13.5px; color:#5A4318; }
.turning { color:var(--ink-soft); font-weight:500; }
.preview-line { font-size:12.5px; color:var(--ink-soft); background:#F7F5EE; border-radius:10px; padding:8px 10px; }
.preview-line strong { color:var(--ink); font-weight:600; }
.absent-box { display:flex; align-items:flex-start; gap:9px; background:var(--marigold-soft); border:1px solid #EFD9B4; border-radius:14px; padding:12px 14px; font-size:12.5px; line-height:1.5; color:#6E5424; cursor:pointer; }
.absent-box input { width:16px; height:16px; margin-top:1px; flex-shrink:0; accent-color:var(--pine); }
.absent-box strong { font-size:13.5px; color:#5A4318; }
.absent-on { background:#FDECEC; border-color:#F2C9C9; color:var(--over); }
.absent-on strong { color:var(--over); }
.review-dupe { background:#FFFCFC; border-left:3px solid #F2C9C9; padding-left:9px; }
.dupe-tag { display:inline-block; font-size:10.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:#2C4A73; background:#E7EEF8; border-radius:999px; padding:2px 8px; margin-bottom:6px; }
.issue-ok { background:var(--frp); color:var(--pine); }

.toast { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); background:var(--ink); color:#fff; font-size:13.5px; font-weight:600; padding:11px 18px; border-radius:999px; box-shadow:0 6px 20px rgba(34,51,59,.22); max-width:calc(100vw - 2rem); text-align:center; z-index:50; }

@media print {
  .tabs, .toast, .btn-primary, .btn-quiet, .btn-ghost, .btn-ghost-solid, .icon-btn, .privacy { display:none !important; }
  .app { background:#fff; }
  .card { border-color:#ccc; break-inside:avoid; }
}
@media (max-width:420px) {
  .brand { font-size:2rem; }
  .sched-date, .up-date { width:62px; }
}
    `}</style>
  );
}
