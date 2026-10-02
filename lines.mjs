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
  const count = eligibleLines(fish).length;
  return `<div class="line-card-hint"><span>Леска по толщине</span><strong>${count === fishingLines.length ? 'Любая' : `Подходят ${count} из ${fishingLines.length}`}</strong></div>`;
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
  const anyLine = lines.length === fishingLines.length;
  return `<section class="detail-section line-section"><${headingTag}>Леска для поклёвки</${headingTag}><p class="line-limit"><strong>${anyLine ? 'По толщине подходит любая леска.' : 'Подходящие по толщине лески — в списке ниже.'}</strong></p><p class="note">${anyLine ? 'Все модели в каталоге проходят ограничение по толщине. ' : 'Слишком толстые модели исключены из списка. '}Прочность для вываживания подбирайте под вес и агрессивность рыбы.</p><details class="line-picker"${anyLine ? '' : ' open'}><summary>${anyLine ? 'Все модели лесок' : 'Подходящие модели'} (${lines.length})</summary><p class="note">Для поклёвки нужны также подходящие удочка, наживка и условия ловли. Список проверяет только ограничение по толщине лески.</p><h4>Магазинные</h4>${lineList(lines.filter(l=>!l.handmade),fish)}<h4>Самодельные</h4>${lineList(lines.filter(l=>l.handmade),fish)}</details><details class="line-explanation"><summary>Как определяется подходящая леска</summary><p class="note">Игра сравнивает нижний вес лески, делённый на 6, с максимальным обычным весом вида. Для этого вида: ${weight(fish.maxWeight)} × 6 = ${weight(lineLowerWeightLimit(fish))}. Это предел для первого числа в весовом диапазоне лески, а не требуемая прочность.</p><p class="note">Слишком толстая леска исключает вид ещё до определения трофея. Улучшение «+» не меняет нижний порог. Если порог отсекает часть мелких экземпляров, это отмечено у модели.</p></details></section>`;
}
