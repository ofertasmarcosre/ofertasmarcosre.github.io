const CAT_DATA = {
    "Eletrônicos": "📱",
    "Casa": "🏠",
    "Beleza": "💄",
    "Moda": "👕",
    "Esporte e Lazer": "⚽"
};

window.allProducts = [];

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        window.allProducts = await response.json();
        renderProducts(window.allProducts);
        renderFeaturedCategories();
        document.getElementById('searchInput').addEventListener('input', executeSearch);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        document.getElementById('productGrid').innerHTML =
            '<p class="col-span-full text-center text-xs text-gray-500 py-8">Não foi possível carregar os produtos.</p>';
    }
}

function executeSearch() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    renderProducts(window.allProducts.filter(p => p.title.toLowerCase().includes(term)));
}

function renderFeaturedCategories() {
    const container = document.getElementById('featuredCategories');
    container.innerHTML = '';
    Object.entries(CAT_DATA).forEach(([name, emoji]) => {
        const card = document.createElement('div');
        card.className = "bg-white min-w-[85px] p-2 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ml-yellow transition";
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
    renderProducts(window.allProducts.filter(p => p.category === category));
    document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    if (!products.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-xs text-gray-500 py-8">Nenhum produto encontrado.</p>';
        return;
    }
    products.forEach(p => {
        const a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener sponsored';
        a.className = "product-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col";
        a.innerHTML = `
            <img src="${p.image}" alt="${p.title}" loading="lazy" class="w-full aspect-square object-cover bg-gray-100">
            <div class="p-2 flex flex-col gap-2 flex-grow">
                <h3 class="text-xs font-medium text-gray-800 line-clamp-2">${p.title}</h3>
                <span class="mt-auto bg-ml-blue text-white text-[10px] font-semibold text-center py-1.5 rounded-full">Ver oferta</span>
            </div>
        `;
        grid.appendChild(a);
    });
}

loadProducts();
