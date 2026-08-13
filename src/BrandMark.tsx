// scripts/generate-icons.py が public/favicon.svg と同じ図形から生成しています。
// 直接編集せず、スクリプトを実行して更新してください。
export default function BrandMark() {
  return <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bm-bg" x1="0" y1="0" x2="0.75" y2="1">
    <stop offset="0" stopColor="#20B6C4"/>
    <stop offset="1" stopColor="#045C6A"/></linearGradient>
    <linearGradient id="bm-amber" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#FFD36B"/>
    <stop offset="1" stopColor="#F59E0B"/></linearGradient>
    <linearGradient id="bm-sheen" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stopColor="#fff" stopOpacity="0.22"/>
    <stop offset="0.6" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#bm-bg)"/>
    <rect width="512" height="512" rx="116" fill="url(#bm-sheen)"/>
    <g fill="#fff">
    <path d="M 138 140 A 118 40 0 0 1 374 140 L 374 196 A 118 40 0 0 1 138 196 Z"/>
    <path d="M 138 312 A 118 40 0 0 0 374 312 L 374 368 A 118 40 0 0 1 138 368 Z"/></g>
    <path fillRule="evenodd" fill="url(#bm-amber)" d="M 138 212 A 118 40 0 0 0 374 212 L 374 300 A 118 40 0 0 1 138 300 Z M 244.0 276.0 A 12.0 12.0 0 0 1 268.0 276.0 L 268.0 286.0 A 12.0 12.0 0 0 1 244.0 286.0 Z M 244 319 A 12 12 0 0 1 268 319 A 12 12 0 0 1 244 319 Z"/>
    <path d="M 138 140 A 118 40 0 0 0 374 140" fill="none" stroke="#0B8494" strokeWidth="13" strokeOpacity="0.45"/>
  </svg>;
}
