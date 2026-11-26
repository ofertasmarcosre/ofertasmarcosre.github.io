const CAT_DATA = {
    "Eletrônicos": "📱",
    "Casa": "🏠",
    "Beleza": "💄",
    "Moda": "👕",
    "Esporte e Lazer": "⚽"
};

const PAGE_SIZE = 24;   // quantos produtos aparecem por vez
const RANGE_SIZE = 50;  // tamanho de cada faixa (1 a 50, 51 a 100...)

window.allProducts = [];
const state = { category: null, range: null, term: '', visible: PAGE_SIZE };

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        // Se algum produto estiver sem "id", usa a posição dele no arquivo (1, 2, 3...)
        window.allProducts = data
            .map((p, i) => ({ ...p, id: Number(p.id) || i + 1 }))
            .sort((a, b) => b.id - a.id); // mais novo primeiro
        setupExtras();
        renderFeaturedCategories();
        renderRanges();
        document.getElementById('searchInput').addEventListener('input', executeSearch);
        window.addEventListener('hashchange', handleHash);
        if (!handleHash()) render();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        document.getElementById('productGrid').innerHTML =
            '<p class="col-span-full text-center text-xs text-gray-500 py-8">Não foi possível carregar os produtos.</p>';
    }
}

// Cria, sem mexer no index.html, a fila de faixas, a linha de filtros e o botão "Ver mais"
function setupExtras() {
    const grid = document.getElementById('productGrid');
    const parent = grid.parentNode;

    const status = document.createElement('div');
    status.id = 'filterStatus';
    status.className = 'items-center justify-between gap-2 text-xs text-gray-600 mb-2';
    status.style.display = 'none';
    parent.insertBefore(status, grid);

    const ranges = document.createElement('div');
    ranges.id = 'rangeBar';
    ranges.className = 'gap-2 overflow-x-auto pb-2 mb-2';
    ranges.style.display = 'none';
    parent.insertBefore(ranges, status);

    const more = document.createElement('div');
    more.id = 'moreWrap';
    more.className = 'flex justify-center py-4';
    parent.insertBefore(more, grid.nextSibling);
}

function resetView() {
    state.visible = PAGE_SIZE;
}

function executeSearch() {
    state.term = document.getElementById('searchInput').value;
    resetView();
    render();
}

function renderFeaturedCategories() {
    const container = document.getElementById('featuredCategories');
    container.innerHTML = '';
    Object.entries(CAT_DATA).forEach(([name, emoji]) => {
        const card = document.createElement('div');
        card.className = "bg-white min-w-[85px] p-2 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ml-yellow transition";
        if (state.category === name) card.style.borderColor = '#FFE600';
        card.innerHTML = `
            <span class="text-xl">${emoji}</span>
            <h3 class="text-[10px] font-semibold text-ml-dark-blue truncate w-full">${name}</h3>
            <button class="bg-ml-yellow text-ml-dark-blue text-[8px] font-bold py-0.5 px-2 rounded-full hover:bg-yellow-300 transition">Ver</button>
        `;
        card.addEventListener('click', () => filterCategory(name));
        container.appendChild(card);
    });
}

function filterCategory(category) {
    state.category = state.category === category ? null : category; // tocar de novo desmarca
    resetView();
    renderFeaturedCategories();
    render();
    document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Faixas automáticas: aparecem quando há mais de 50 produtos
function renderRanges() {
    const bar = document.getElementById('rangeBar');
    if (!bar) return;
    if (window.allProducts.length <= RANGE_SIZE) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    bar.innerHTML = '';
    const maxId = window.allProducts[0].id;
    const top = Math.floor((maxId - 1) / RANGE_SIZE) * RANGE_SIZE + 1;
    for (let start = top; start >= 1; start -= RANGE_SIZE) {
        const end = start + RANGE_SIZE - 1;
        const active = state.range && state.range[0] === start;
        const chip = document.createElement('button');
        chip.className = 'shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border ' +
            (active ? 'bg-ml-dark-blue text-white border-ml-dark-blue'
                    : 'bg-white text-ml-dark-blue border-gray-200');
        chip.textContent = `${start} a ${end}`;
        chip.addEventListener('click', () => {
            state.range = active ? null : [start, end];
            resetView();
            renderRanges();
            render();
        });
        bar.appendChild(chip);
    }
}

function getFiltered() {
    let list = window.allProducts;
    if (state.category) list = list.filter(p => p.category === state.category);
    if (state.range) list = list.filter(p => p.id >= state.range[0] && p.id <= state.range[1]);

    const term = state.term.trim().toLowerCase();
    if (term) {
        // aceita "12", "nº 12" e "#12"
        const m = term.match(/^(?:n[º°o.]*\s*|#\s*)?(\d+)$/);
        if (m) {
            const id = Number(m[1]);
            const exact = list.filter(p => p.id === id);
            list = exact.length ? exact : list.filter(p => p.title.toLowerCase().includes(term));
        } else {
            list = list.filter(p => p.title.toLowerCase().includes(term));
        }
    }
    return list;
}

function createCard(p) {
    const a = document.createElement('a');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener sponsored';
    a.dataset.id = p.id;
    a.className = "product-card relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col";
    a.innerHTML = `
        <span class="absolute top-2 left-2 z-10 bg-ml-dark-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nº ${p.id}</span>
        <img src="${p.image}" alt="${p.title}" loading="lazy" class="w-full aspect-square object-cover bg-gray-100">
        <div class="p-2 flex flex-col gap-2 flex-grow">
            <h3 class="text-xs font-medium text-gray-800 line-clamp-2">${p.title}</h3>
            <span class="mt-auto bg-ml-blue text-white text-[10px] font-semibold text-center py-1.5 rounded-full">Ver oferta</span>
        </div>
    `;
    return a;
}

function render() {
    const grid = document.getElementById('productGrid');
    const list = getFiltered();
    grid.innerHTML = '';
    if (!list.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-xs text-gray-500 py-8">Nenhum produto encontrado.</p>';
    } else {
        list.slice(0, state.visible).forEach(p => grid.appendChild(createCard(p)));
    }
    renderMore(list.length);
    updateStatus();
}

function renderMore(total) {
    const wrap = document.getElementById('moreWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (total > state.visible) {
        const btn = document.createElement('button');
        btn.className = 'bg-ml-yellow text-ml-dark-blue text-xs font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition';
        btn.textContent = `Ver mais (${total - state.visible})`;
        btn.addEventListener('click', () => {
            state.visible += PAGE_SIZE;
            render();
        });
        wrap.appendChild(btn);
    }
}

function updateStatus() {
    const bar = document.getElementById('filterStatus');
    if (!bar) return;
    const parts = [];
    if (state.category) parts.push(state.category);
    if (state.range) parts.push(`${state.range[0]} a ${state.range[1]}`);
    if (state.term.trim()) parts.push(`"${state.term.trim()}"`);
    if (!parts.length) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    bar.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = 'Mostrando: ' + parts.join(' · ');
    const clear = document.createElement('button');
    clear.className = 'text-ml-blue font-semibold';
    clear.textContent = 'Limpar filtros';
    clear.addEventListener('click', () => {
        state.category = null;
        state.range = null;
        state.term = '';
        document.getElementById('searchInput').value = '';
        resetView();
        renderFeaturedCategories();
        renderRanges();
        render();
    });
    bar.appendChild(label);
    bar.appendChild(clear);
}

// Link direto: site/#12 abre já no produto 12
function handleHash() {
    const m = location.hash.match(/^#(\d+)$/);
    if (!m) return false;
    const id = Number(m[1]);
    state.category = null;
    state.range = null;
    state.term = '';
    document.getElementById('searchInput').value = '';
    const idx = window.allProducts.findIndex(p => p.id === id);
    state.visible = idx === -1 ? PAGE_SIZE : Math.max(PAGE_SIZE, idx + 1);
    renderFeaturedCategories();
    renderRanges();
    render();
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 4px #FFE600';
    }
    return true;
}

loadProducts();
