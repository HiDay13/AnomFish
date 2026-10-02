import { formatWeight as weight } from './core.mjs';
import { fishingLines } from './lines-data.mjs';

const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rarities = {
  poor: ['Низкая', '#a5b8c3'], common: ['Обычная', '#ffffff'],
  uncommon: ['Необычная', '#04bc04'], rare: ['Редкая', '#2196f3'],
  epic: ['Эпическая', '#e562fb'], legendary: ['Легендарная', '#ff9800'],
  mythic: ['Мифическая', '#ffd93b'], world: ['Мировая', '#3fffba']
};

// Native selection: fish.maxWeight >= line.minWeight / 6.
// This is the lower-bound condition only; the rod/line upper bound is separate.
export const lineLowerWeightLimit = fish => fish.maxWeight * 6;
export function eligibleLines(fish) {
  return fishingLines.filter(line => line.minWeight <= lineLowerWeightLimit(fish))
    .sort((a,b) => a.minWeight-b.minWeight || a.maxWeight-b.maxWeight || a.key.localeCompare(b.key));
}

export function lineCardHint(fish) {
  return `<div class="line-card-hint"><span>Леска · нижний вес</span><strong>≤ ${weight(lineLowerWeightLimit(fish))}</strong></div>`;
}

function lineList(lines, fish) {
  return `<ul class="line-models">${lines.map(line => {
    const [label,color] = rarities[line.rarity];
    const cutsSmall = line.minWeight > fish.minWeight*6;
    return `<li><div class="line-model-title"><strong>${E(line.name)}</strong><span class="line-rarity"><i style="background:${color}" aria-hidden="true"></i>${label}</span></div><div class="line-model-info"><span>Нижний вес: <b>${weight(line.minWeight)}</b></span><span>${cutsSmall?'Отсекает часть мелких экземпляров':'Не отсекает мелкие экземпляры'}</span></div></li>`;
  }).join('')}</ul>`;
}

export function lineDetails(fish, headingTag='h3') {
  const lines=eligibleLines(fish);
  return `<section class="detail-section line-section"><${headingTag}>Леска для поклёвки</${headingTag}><p class="line-limit">Нижний вес лески <strong>не более ${weight(lineLowerWeightLimit(fish))}</strong></p><p class="note">Смотрите первое число в весовом диапазоне самой лески. Правило одинаково для магазинных и самодельных моделей.</p><details class="line-picker"><summary>Подходят по нижнему порогу: ${lines.length} моделей</summary><p class="note">Список проверяет нижний порог лески. Для поклёвки нужны также подходящие удочка, наживка и условия ловли; для вываживания — достаточная прочность всей снасти.</p><h4>Магазинные</h4>${lineList(lines.filter(l=>!l.handmade),fish)}<h4>Самодельные</h4>${lineList(lines.filter(l=>l.handmade),fish)}</details><p class="note">Расчёт: максимальный обычный вес вида × 6. Слишком толстая леска исключает вид ещё до определения трофея. Улучшение «+» не меняет этот нижний порог.</p></section>`;
}
