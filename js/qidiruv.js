const USERNAMES = ["Bek_vines","dilnoza.travel","Ozodbek_official","Sardor_life","Kamola_beauty","Jasur_sport","Nigora_cook","Aziz_moto","Malika_dance","Shaxzod_gym","Feruza_style","Otabek_music","Sevinch_art","Diyor_travel","Gulnoza_fit","Bahrom_food","Zarina_makeup","Umid_football","Madina_vlog","Sherzod_car"];
const HASHTAGS = ["seriya","izlanish","tabiat","sport","kulgu","sayohat","oshxona","futbol","raqs","fitness","moda","musiqa","avto","gozallik","kundalik","yangilik","trend","viral","dostlik","motivatsiya"];
const CATEGORIES = ["Barchasi","Trend","Yangi","Sport","Sayohat","Oshxona","Moda","Kulgu","Musiqa"];
const VIDEO_IDS = ["dQw4w9WgXcQ", "jNQXAC9IVRw", "kJQP7kiw5Fk", "9bZkp7q19f0"];

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function fmt(n){
  if(n >= 1000000) return (n/1000000).toFixed(1).replace(".0","") + "M";
  if(n >= 1000) return (n/1000).toFixed(1).replace(".0","") + "K";
  return n;
}

// Ma'lumotlarni yaratish
const items = Array.from({length: 1000}, (_, i) => ({
  id: i,
  user: USERNAMES[rand(0, USERNAMES.length-1)] + (Math.random() > 0.5 ? "" : rand(1,99)),
  tag: HASHTAGS[rand(0, HASHTAGS.length-1)],
  category: CATEGORIES[rand(1, CATEGORIES.length-1)],
  likes: rand(120, 890000),
  comments: rand(3, 12000),
  live: Math.random() < 0.06,
  seed: i,
  vidId: VIDEO_IDS[rand(0, VIDEO_IDS.length-1)]
}));

// DOM elementlar
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const chipRow = document.getElementById('chipRow');
const videoModal = document.getElementById('videoModal');
const videoFrame = document.getElementById('videoFrame');
const closeModalBtn = document.getElementById('closeModalBtn');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');

let activeCategory = "Barchasi";
let query = "";
let visibleCount = 60;
const PAGE = 60;

// Ovozli qidiruv
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'uz-UZ';
  micBtn.addEventListener('click', () => recognition.start());
  recognition.onstart = () => micStatus.classList.remove('hidden');
  recognition.onresult = (e) => {
    query = e.results[0][0].transcript;
    searchInput.value = query;
    render();
  };
  recognition.onend = () => micStatus.classList.add('hidden');
}

// Modal boshqaruv
function openModal(vidId) {
  videoFrame.src = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
  videoModal.classList.remove('hidden');
  videoModal.classList.add('flex');
}
closeModalBtn.addEventListener('click', () => {
  videoFrame.src = "";
  videoModal.classList.remove('flex');
  videoModal.classList.add('hidden');
});

// Render qilish
function render() {
  const filtered = items.filter(it => {
    const matchesCat = activeCategory === "Barchasi" || it.category === activeCategory;
    const q = query.toLowerCase().trim();
    return matchesCat && (!q || it.user.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q));
  });

  resultCount.textContent = filtered.length;
  grid.innerHTML = filtered.slice(0, visibleCount).map(it => `
    <div onclick="openModal('${it.vidId}')" class="card-thumb relative rounded-xl overflow-hidden bg-card border border-border cursor-pointer hover:-translate-y-0.5 hover:border-golddim transition">
      <img src="https://picsum.photos/seed/zar${it.seed}/300/500" loading="lazy" class="w-full h-full object-cover">
      <div class="absolute top-2 left-2 ${it.live ? 'bg-red-500' : 'hidden'} text-[10px] font-bold px-1.5 py-0.5 rounded text-white">JONLI</div>
      <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <div class="text-xs font-semibold truncate">${it.user}</div>
        <div class="text-[10px] text-txtdim">#${it.tag} • ${fmt(it.likes)} layk</div>
      </div>
    </div>`).join('');

  emptyState.classList.toggle('hidden', filtered.length !== 0);
  grid.classList.toggle('hidden', filtered.length === 0);
  loadMoreBtn.classList.toggle('hidden', visibleCount >= filtered.length);
  clearBtn.classList.toggle('hidden', query === "");
}

// Chiplarni yaratish
CATEGORIES.forEach(cat => {
  const div = document.createElement('div');
  div.className = "px-3.5 py-1.5 rounded-full border cursor-pointer text-sm transition";
  div.textContent = cat;
  div.onclick = () => {
    activeCategory = cat;
    document.querySelectorAll('#chipRow div').forEach(c => c.classList.toggle('bg-gold/10', c.textContent === cat));
    visibleCount = PAGE;
    render();
  };
  chipRow.appendChild(div);
});

searchInput.addEventListener('input', (e) => { query = e.target.value; visibleCount = PAGE; render(); });
clearBtn.addEventListener('click', () => { searchInput.value = ""; query = ""; render(); });
loadMoreBtn.addEventListener('click', () => { visibleCount += PAGE; render(); });

render();