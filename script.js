// Armazena temporariamente os dados retornados pela busca atual da API
let currentSearchResults = [];

// Carrega os favoritos salvos assim que a estrutura do documento estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    renderFavorites();
});

// ===================================================
// LÓGICA DE BUSCA, ENVIO DE PARÂMETROS E VALIDAÇÃO
// ===================================================
document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita o reload da página

    const input = document.getElementById('search-input');
    const query = input.value.trim();
    const errorMsg = document.getElementById('error-msg');
    const loadingMsg = document.getElementById('loading-msg');
    const resultsContainer = document.getElementById('search-results');

    // Validação obrigatória: impede busca com menos de 3 caracteres (Critério 4)
    if (query.length < 3) {
        errorMsg.style.display = 'block'; // Exibe mensagem (Critério 5)
        return;
    }

    // Oculta mensagem de erro caso passe na validação
    errorMsg.style.display = 'none';
    loadingMsg.style.display = 'block';
    resultsContainer.innerHTML = ''; 

    try {
        // Envio de parâmetros por AJAX utilizando a API Fetch (Critério 3)
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=12`);
        const data = await response.json();

        currentSearchResults = data.items || [];
        
        loadingMsg.style.display = 'none';
        renderResults(currentSearchResults, resultsContainer, false);

    } catch (error) {
        loadingMsg.style.display = 'none';
        resultsContainer.innerHTML = '<p style="color: #ff4d4d;">Ocorreu um erro ao consultar a API. Tente novamente.</p>';
        console.error(error);
    }
});

// ===================================================
// INSERÇÃO DINÂMICA DOS ELEMENTOS NA INTERFACE (SPA)
// ===================================================
function renderResults(repos, container, isFavoritesView) {
    if (!repos || repos.length === 0) {
        container.innerHTML = '<p>Nenhum repositório para exibir.</p>';
        return;
    }

    container.innerHTML = '';

    repos.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';

        // Trata textos de descrição longos ou ausentes
        const desc = repo.description ? repo.description.substring(0, 90) + '...' : 'Sem descrição cadastrada.';

        // Define dinamicamente o botão com base no bloco correspondente
        let buttonHTML = '';
        if (isFavoritesView) {
            buttonHTML = `<button class="btn-fav btn-remove" onclick="removeFavorite(${repo.id})"><i class="fas fa-trash-alt"></i> Remover</button>`;
        } else {
            buttonHTML = `<button class="btn-fav" onclick="saveFavorite(${repo.id})"><i class="fas fa-star"></i> Favoritar</button>`;
        }

        card.innerHTML = `
            <div>
                <h3>${repo.full_name}</h3>
                <p>${desc}</p>
                <div class="repo-stats">
                    <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                    <span><i class="fas fa-code"></i> ${repo.language || 'Outra'}</span>
                </div>
            </div>
            ${buttonHTML}
        `;

        container.appendChild(card);
    });
}

// ===================================================
// PERSISTÊNCIA LOCAL (localStorage)
// ===================================================

// Salva o repositório selecionado no localStorage
function saveFavorite(repoId) {
    const repoToSave = currentSearchResults.find(r => r.id === repoId);
    if (!repoToSave) return;

    let favorites = JSON.parse(localStorage.getItem('bitfix_favorites')) || [];

    // Impede duplicabilidade de um mesmo item nos favoritos
    const alreadyExists = favorites.some(r => r.id === repoId);
    
    if (!alreadyExists) {
        favorites.push(repoToSave);
        localStorage.setItem('bitfix_favorites', JSON.stringify(favorites));
        renderFavorites(); // Atualiza o bloco de favoritos instantaneamente na tela (SPA)
    } else {
        alert('Este repositório já está na sua lista de favoritos.');
    }
}

// Carrega e exibe a lista atualizada de favoritos
function renderFavorites() {
    const favoritesContainer = document.getElementById('favorites-results');
    const favorites = JSON.parse(localStorage.getItem('bitfix_favorites')) || [];

    renderResults(favorites, favoritesContainer, true);
}

// Remove o item do localStorage
function removeFavorite(repoId) {
    let favorites = JSON.parse(localStorage.getItem('bitfix_favorites')) || [];
    
    favorites = favorites.filter(r => r.id !== repoId);
    localStorage.setItem('bitfix_favorites', JSON.stringify(favorites));
    
    renderFavorites(); // Redesenha a lista atualizada sem recarregar a página
}