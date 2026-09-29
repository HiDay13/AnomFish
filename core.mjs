export const normalize = v => String(v ?? '').toLocaleLowerCase('ru').replaceAll('ё','е').trim();
export const categories = { all: 'Весь улов', fish: 'Рыбы', monster: 'Мутанты', deli: 'Деликатесы', item: 'Находки' };
export const depths = { small: 'Небольшая глубина', medium: 'Средняя глубина', bottom: 'Дно' };
export const grounds = { grass:'Трава', sand:'Песок', stone:'Камни' };
export const regions = { kolivan:'Ивановы Колья', 'small-pikes':'Малые Щучки' };
export function formatWeight(g) {
  if (!Number.isFinite(g)) return '—';
  const divisor = g >= 1e6 ? 1e6 : g >= 1000 ? 1000 : 1;
  return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(g/divisor) + (divisor===1e6?' т':divisor===1000?' кг':' г');
}
export function rarityTiers(f, rarities) {
  const span=f.rareWeight-f.maxWeight;
  const starts=[f.minWeight,f.maxWeight,f.maxWeight+span*.5,f.rareWeight,f.maxWeight+span*1.5,f.maxWeight+span*2,f.maxWeight+span*2.5];
  return rarities.map((r,i)=>({...r,min:starts[i],max:starts[i+1]??null,multiplier:[1,2.5,10,24,48,96,256][i]}));
}
export function filterFish(data,state) {
  const terms=normalize(state.query).split(/\s+/).filter(Boolean);
  const places=new Map(data.locations.map(l=>[l.key,l]));
  let rows=data.fish.filter(f=>{
    const locs=f.locations.map(k=>places.get(k));
    return (!state.category||state.category==='all'||f.type===state.category)
      && (!state.favoritesOnly||state.favorites.includes(f.key))
      && (!state.region||locs.some(l=>l.region===state.region))
      && (!state.location||f.locations.includes(state.location))
      && (!state.depth||f.depth===state.depth)
      && (!state.bottom?.length||state.bottom.some(b=>f.bottom.includes(b)))
      && (!state.bait||f.bait.includes(state.bait))
      && (!state.lure||f.lure.includes(state.lure))
      && (!state.method||state.method==='spinning'&&f.tackleBait||state.method==='bait'&&f.bait.length>0)
      && (!state.available||locs.some(l=>l.enabled))
      && (!terms.length||terms.every(t=>normalize([f.name,f.nameEn,f.key,...locs.map(l=>l.name),...f.bait.map(k=>data.items[k].name),...f.lure.map(k=>data.items[k].name)].join(' ')).includes(t)));
  });
  const secondary=(a,b)=>a.name.localeCompare(b.name,'ru');
  const sorts={ name:secondary,weight:(a,b)=>b.maxWeight-a.maxWeight||secondary(a,b),aggression:(a,b)=>b.agressiveRate-a.agressiveRate||secondary(a,b),rarity:(a,b)=>(b['rarity-max']/b.rarity)-(a['rarity-max']/a.rarity)||secondary(a,b) };
  return rows.sort(sorts[state.sort]||secondary);
}
