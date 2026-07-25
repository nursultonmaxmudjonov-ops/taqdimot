const USERNAMES = ["Bek_vines","dilnoza.travel","Ozodbek_official","Sardor_life","Kamola_beauty","Jasur_sport","Nigora_cook","Aziz_moto","Malika_dance","Shaxzod_gym","Feruza_style","Otabek_music","Sevinch_art","Diyor_travel","Gulnoza_fit","Bahrom_food","Zarina_makeup","Umid_football","Madina_vlog","Sherzod_car"];
const HASHTAGS = ["seriya","izlanish","tabiat","sport","kulgu","sayohat","oshxona","futbol","raqs","fitness","moda","musiqa","avto","gozallik","kundalik","yangilik","trend","viral","dostlik","motivatsiya"];
const CATEGORIES = ["Barchasi","Trend","Yangi","Sport","Sayohat","Oshxona","Moda","Kulgu","Musiqa"];

const YOUTUBE_IDS = ["dQw4w9WgXcQ","3JZ_D3ELwOQ","kXYiU_JCYtU","fRh_vgS2dFE","JGwWNGJdvx8","9bZkp7q19f0","OPf0YbXqDm0","2Vv-BfVoq4g","RgKAFK5djSk","YQHsXMglC9A","CevxZvSJLk8","hT_nvWreIhg","e-ORhEE9VVg","QH2-TGUlwu4","060ZQvzz9J8","L_jWHffIx5E","tVj0ZTS4WF4","ktvTqknDobU","09R8_2nJtjg","pRpeEdMmmQ0","SlPhMPnQ58k","YykjpeuMNEk","lY2yjAdbvdQ","H5v3kku4y6Q","Zi_XLOBDo_Y","fJ9rUzIMcZQ","2vjPBrBU-TM","ub82Xb1C8os","CdqoNKCCt7A"];

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function fmt(n){ if(n >= 1000000) return (n/1000000).toFixed(1).replace(".0","") + "M"; if(n >= 1000) return (n/1000).toFixed(1).replace(".0","") + "K"; return n; }

const TOTAL = 1000;
const items = [];
for(let i=0; i<TOTAL; i++){
    items.push({ id: i, user: USERNAMES[rand(0, USERNAMES.length-1)], tag: HASHTAGS[rand(0, HASHTAGS.length-1)], category: CATEGORIES[rand(1, CATEGORIES.length-1)], likes: rand(120, 890000), comments: rand(3, 12000), live: Math.random() < 0.06, seed: i, youtubeId: YOUTUBE_IDS[i % YOUTUBE_IDS.length] });
}

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
let visibleCount = 20;

CATEGORIES.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = "chip px-3.5 py-1.5 rounded-full border border-border bg-panel text-txtdim text-[13px] cursor-pointer whitespace-nowrap";
    chip.textContent = cat;
    chip.addEventListener('click', () => { activeCategory = cat; render(); });
    chipRow.appendChild(chip);
});

function render(){
    const filtered = items.filter(it => (activeCategory === "Barchasi" || it.category === activeCategory) && (!query || it.user.toLowerCase().includes(query.toLowerCase())));
    resultCount.textContent = filtered.length;
    grid.innerHTML = filtered.slice(0, visibleCount).map(it => `
        <div class="card-thumb relative rounded-xl overflow-hidden bg-card border border-border cursor-pointer" onclick="openVideo('${it.youtubeId}')">
            <img src="https://i.ytimg.com/vi/${it.youtubeId}/hqdefault.jpg" class="w-full h-full object-cover">
            <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/85 p-2">
                <div class="text-xs text-white">${it.user}</div>
            </div>
        </div>`).join('');
    emptyState.classList.toggle('hidden', filtered.length > 0);
    loadMoreBtn.classList.toggle('hidden', visibleCount >= filtered.length);
}

function openVideo(id){ videoFrame.src = "https://www.youtube.com/embed/" + id; videoModal.classList.remove('hidden'); videoModal.classList.add('flex'); }
closeModalBtn.addEventListener('click', () => { videoModal.classList.add('hidden'); videoFrame.src = ""; });
searchInput.addEventListener('input', (e) => { query = e.target.value; render(); });
loadMoreBtn.addEventListener('click', () => { visibleCount += 20; render(); });
render();