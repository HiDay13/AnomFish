import { lineDetails } from '../lines.mjs';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {categories, depths, grounds, regions, formatWeight as weight, rarityTiers} from '../core.mjs';

// Regenerate after editing data.json. No build tools are needed on the host.
const root = new URL('../', import.meta.url);
const base = 'https://hiday13.github.io/AnomFish/';
const data = JSON.parse(await readFile(new URL('data.json', root), 'utf8'));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = v => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4}).format(v);
const fishes = [...data.fish].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
const locations = new Map(data.locations.map(l=>[l.key,l]));
const date = new Date(data.meta.fetchedAt).toLocaleDateString('ru-RU', {timeZone:'UTC'});
const pathFor = f => `fish/${f.key}.html`;
const image = (item, eager=false) => item.image ? `<img src="../${esc(item.image)}" alt="${esc(item.name)}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">` : '';
const items = (keys, type) => keys.length ? `<ul class="seo-items">${keys.map(k=>{const i=data.items[k];return `<li>${image(i)}<span>${esc(i.name)}${type==='lure'&&i.baitRate!=null?`<small>Поклёвки: +${esc(i.baitRate)}%</small>`:''}</span></li>`;}).join('')}</ul>` : `<p class="note">Не реагирует на ${type==='bait'?'наживки':'прикормки'}.</p>`;

await mkdir(new URL('fish/',root),{recursive:true});
for (const [index,f] of fishes.entries()) {
  if (!/^[a-z0-9-]+$/.test(f.key)) throw new Error(`Unsafe key: ${f.key}`);
  const url=base+pathFor(f), title=`${f.name} — где и на что ловить | Аномальная рыбалка`;
  const description=`${f.name} (${f.nameEn}) в Аномальной рыбалке: наживки, прикормки, водоёмы, ${depths[f.depth].toLocaleLowerCase('ru')}, вес ${weight(f.minWeight)}–${weight(f.maxWeight)}, пороги редкости и агрессивность.`;
  const tiers=rarityTiers(f,data.rarities);
  const locs=f.locations.map(k=>locations.get(k)).sort((a,b)=>Number(b.enabled)-Number(a.enabled)||a.rank-b.rank);
  const structured={'@context':'https://schema.org','@type':'WebPage',name:title,description,url,inLanguage:'ru',isPartOf:{'@type':'WebSite',name:'Атлас рыб AnomFish',url:base},mainEntity:{'@type':'Thing',name:f.name,alternateName:f.nameEn,image:base+f.image,description}};
  const body=`<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101c26">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="Атлас рыб AnomFish"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${base+esc(f.image)}"><meta property="og:image:alt" content="${esc(f.name)}">
<link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../seo.css"><link rel="stylesheet" href="../lines.css">
<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<','\\u003c')}</script>
</head><body>
<a class="skip-link" href="#fish-content">К описанию улова</a>
<header class="topbar"><a class="brand" href="../"><span class="brand-mark">A<span>+</span></span><span>ANOM<span class="mint">FISH</span><small>АТЛАС РЫБ</small></span></a><a class="seo-back" href="../">← Каталог</a></header>
<main class="seo-page" id="fish-content">
<nav class="seo-breadcrumb" aria-label="Навигационная цепочка"><a href="../">Атлас рыб</a><span> / ${esc(f.name)}</span></nav>
<div class="detail-top"><div class="detail-portrait">${image(f,true)}<span class="specimen-code">ВИД № ${String(f.uid).padStart(3,'0')}</span></div><div class="detail-heading"><span class="detail-category">${categories[f.type]}</span><h1>${esc(f.name)}</h1><p class="name-en">${esc(f.nameEn)}</p><div class="detail-actions"><a class="secondary-button" href="../#fish=${f.key}">Открыть в интерактивном атласе</a></div></div></div>
<div class="detail-layout"><div class="detail-left">
<section class="detail-section"><h2>Условия ловли</h2><div class="depth-chart">${Object.entries(depths).map(([k,v])=>`<div class="depth-row ${k===f.depth?'active':''}"><span>${v}</span><b>${k===f.depth?'✓':'—'}</b></div>`).join('')}</div><div class="habitat-tags">${f.bottom.map(b=>`<span><i class="ground ${b}" aria-hidden="true"></i>${grounds[b]}</span>`).join('')}</div><p class="note">Глубина указана относительно глубины водоёма в точке заброса.</p><p class="method-label">${f.tackleBait?'Ловится на спиннинг':'На спиннинг не ловится'}</p></section>
<section class="detail-section"><h2>Агрессивность</h2><div class="meter-title"><span>Множитель сопротивления</span><strong>×${number(f.agressiveRate/100)}</strong></div><p class="metric-note">Базовая сила сопротивления: вес × ${number(f.agressiveRate/100)}. Разница уровней рыбы и снасти может увеличить нагрузку.</p><h2>Коэффициент выбора</h2><p>${f.rarity} / ${f['rarity-max']} = ${number(f.rarity/f['rarity-max'])}</p><p class="metric-note">Это вес вида при выборе улова с учётом условий ловли, а не вероятность поклёвки в процентах.</p></section>
<section class="detail-section"><h2>Данные каталога</h2><p class="note">Снимок данных от ${date}. Автоматического обновления нет. Для специальных находок могут действовать дополнительные условия снастей.</p></section>
</div><div class="detail-right">
<section class="detail-section"><h2>Вес и редкость</h2><div class="weight-summary"><strong>${weight(f.minWeight)} — ${weight(f.maxWeight)}</strong><span>обычный диапазон</span></div><div class="tier-grid">${tiers.map((t,i)=>`<div class="tier-cell" style="--rarity:${t.color}"><span class="tier-name">${esc(t.name)}</span><span class="tier-weight">${i===0?`${weight(t.min)} – &lt; ${weight(t.max)}`:`от ${weight(t.min)}`}</span></div>`).join('')}</div><p class="note">Порог следующей редкости завершает предыдущий диапазон. Трофей — вес строго больше ${weight(f.maxWeight)}. ${weight(f.rareWeight)} — опорный порог эпической редкости, а не максимальный возможный вес.</p></section>
${lineDetails(f,'h2')}
<section class="detail-section"><h2>Наживки</h2>${items(f.bait,'bait')}</section>
<section class="detail-section"><h2>Прикормки</h2>${items(f.lure,'lure')}</section>
<section class="detail-section"><h2>Водоёмы</h2>${locs.length?`<ul class="seo-locations">${locs.map(l=>`<li>${image(l)}<div><h3>${esc(l.name)}</h3><p>${esc(regions[l.region]||l.region)} · ${l.minFishLevel}–${l.maxFishLevel} ур.</p><p class="note">${l.enabled?`Разряд ${l.rank} · ${l.radTypes.includes('cold')?'Холод':'Радиация'} ${l.radRate}`:'Отключён в данных игры'}</p></div></li>`).join('')}</ul>`:'<p class="note">В списках водоёмов клиента этот вид не указан. Постоянное место ловли по этим данным определить нельзя.</p>'}</section>
<details class="raw-details"><summary>Исходные параметры</summary><table class="raw-table"><tbody>${Object.entries(f).filter(([k])=>!['locations','image','name','nameEn','bottom','bait','lure'].includes(k)).map(([k,v])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table><p class="note">price — исходный параметр, а не итоговая цена продажи.</p></details>
</div></div>
<nav class="seo-neighbors" aria-label="Другие виды">${index>0?`<a href="${fishes[index-1].key}.html">← ${esc(fishes[index-1].name)}</a>`:'<span></span>'}${index<fishes.length-1?`<a href="${fishes[index+1].key}.html">${esc(fishes[index+1].name)} →</a>`:''}</nav>
<footer class="page-footer"><a href="../">AnomFish · Весь каталог</a><span>Независимый справочник</span></footer>
</main></body></html>\n`;
  await writeFile(new URL(pathFor(f),root),body);
}

let index=await readFile(new URL('index.html',root),'utf8');
const links=`<!-- SEO-CATALOG:START -->\n<details class="seo-directory"><summary>Все виды улова — отдельные страницы</summary><ul>${fishes.map(f=>`<li><a href="${pathFor(f)}">${esc(f.name)}</a></li>`).join('')}</ul></details>\n<!-- SEO-CATALOG:END -->`;
index=index.includes('<!-- SEO-CATALOG:START -->')?index.replace(/<!-- SEO-CATALOG:START -->[\s\S]*?<!-- SEO-CATALOG:END -->/,links):index.replace('    <footer class="page-footer">',`    ${links}\n    <footer class="page-footer">`);
await writeFile(new URL('index.html',root),index);
const urls=[base,...fishes.map(f=>base+pathFor(f))];
await writeFile(new URL('sitemap.xml',root),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${esc(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${fishes.length} pages and ${urls.length} sitemap URLs in ${fileURLToPath(root)}`);
