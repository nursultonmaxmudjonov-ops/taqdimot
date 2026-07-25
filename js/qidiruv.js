const USERNAMES = ["Bek_vines","dilnoza.travel","Ozodbek_official","Sardor_life","Kamola_beauty","Jasur_sport","Nigora_cook","Aziz_moto","Malika_dance","Shaxzod_gym","Feruza_style","Otabek_music","Sevinch_art","Diyor_travel","Gulnoza_fit","Bahrom_food","Zarina_makeup","Umid_football","Madina_vlog","Sherzod_car"];
const HASHTAGS = ["seriya","izlanish","tabiat","sport","kulgu","sayohat","oshxona","futbol","raqs","fitness","moda","musiqa","avto","gozallik","kundalik","yangilik","trend","viral","dostlik","motivatsiya"];
const CATEGORIES = ["Barchasi","Trend","Yangi","Sport","Sayohat","Oshxona","Moda","Kulgu","Musiqa"];

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

function fmt(n){
  if(n >= 1000000) return (n/1000000).toFixed(1).replace(".0","") + "M";
  if(n >= 1000) return (n/1000).toFixed(1).replace(".0","") + "K";
  return n;
}

const TOTAL = 1000;
const items = [];
for(let i=0; i<TOTAL; i++){
  const user = USERNAMES[rand(0, USERNAMES.length-1)];
  const tag = HASHTAGS[rand(0, HASHTAGS.length-1)];
  const cat = CATEGORIES[rand(1, CATEGORIES.length-1)];
  items.push({
    id: i,
    user: user + (Math.random() > 0.5 ? "" : rand(1,99)),
    tag: tag,
    category: cat,
    likes: rand(120, 890000),
    comments: rand(3, 12000),
    live: Math.random() < 0.06,
    seed: i
  });
}

const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const chipRow = document.getElementById('chipRow');

let activeCategory = "Barchasi";
let query = "";
let visibleCount = 60;
const PAGE = 60;

function chipClasses(active){
  return active
    ? "chip px-3.5 py-1.5 rounded-full border border-golddim bg-gold/10 text-gold text-[13px] cursor-pointer whitespace-nowrap transition"
    : "chip px-3.5 py-1.5 rounded-full border border-border bg-panel text-txtdim text-[13px] cursor-pointer whitespace-nowrap hover:text-txt hover:border-txtfaint transition";
}

CATEGORIES.forEach(cat => {
  const chip = document.createElement('div');
  chip.className = chipClasses(cat === activeCategory);
  chip.textContent = cat;
  chip.dataset.cat = cat;
  chip.addEventListener('click', () => {
    activeCategory = cat;
    document.querySelectorAll('.chip').forEach(c => {
      c.className = chipClasses(c.dataset.cat === activeCategory);
    });
    visibleCount = PAGE;
    render();
  });
  chipRow.appendChild(chip);
});

function getFiltered(){
  return items.filter(it => {
    const matchesCat = activeCategory === "Barchasi" || it.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || it.user.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}

function cardHTML(it){
  const initial = it.user.charAt(0).toUpperCase();
  return `
    <div class="card-thumb relative rounded-xl overflow-hidden bg-card border border-border cursor-pointer hover:-translate-y-0.5 hover:border-golddim transition">
      <img src="https://picsum.photos/seed/zar${it.seed}/300/500" loading="lazy" alt="${it.user}" class="w-full h-full object-cover block">
      <div class="absolute top-0 left-0 right-0 p-2 flex justify-between items-start bg-gradient-to-b from-black/55 to-transparent">
        ${it.live ? '<div class="flex items-center gap-1 bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">JONLI</div>' : '<span></span>'}
        <div class="bg-black/55 text-gold text-[11px] font-bold px-1.5 py-0.5 rounded">#${it.id+1}</div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-2 pt-3 bg-gradient-to-t from-black/85 to-transparent">
        <div class="flex items-center gap-1.5 text-xs font-semibold mb-1">
          <div class="w-4 h-4 rounded-full bg-gold text-[#221a08] text-[9px] font-extrabold flex items-center justify-center flex-shrink-0">${initial}</div>
          <span class="truncate">${it.user}</span>
        </div>
        <div class="flex gap-2.5 text-[11px] text-gray-200">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2 4.5 5.5 3.6 8 3 10.3 4 12 6.3 13.7 4 16 3 18.5 3.6 22 4.5 23.2 8.4 21.5 12 19 16.5 12 21 12 21z"/></svg>
            ${fmt(it.likes)}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H7l-3 3V4z"/></svg>
            ${fmt(it.comments)}
          </span>
        </div>
      </div>
    </div>`;
}

function render(){
  const filtered = getFiltered();
  resultCount.textContent = filtered.length;
  const slice = filtered.slice(0, visibleCount);
  grid.innerHTML = slice.map(cardHTML).join('');
  emptyState.classList.toggle('hidden', filtered.length !== 0);
  emptyState.classList.toggle('flex', filtered.length === 0);
  grid.classList.toggle('hidden', filtered.length === 0);
  loadMoreBtn.classList.toggle('hidden', visibleCount >= filtered.length);
  clearBtn.classList.toggle('hidden', !query);
}

let debounceTimer;
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    query = e.target.value;
    visibleCount = PAGE;
    render();
  }, 150);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = "";
  query = "";
  visibleCount = PAGE;
  render();
  searchInput.focus();
});

loadMoreBtn.addEventListener('click', () => {
  visibleCount += PAGE;
  render();
});
render();