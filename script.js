/**
 * Urban Fashion Creator - Game Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const layersContainer = document.getElementById('layers-container');
    const categoriesNav = document.querySelector('.categories-nav');
    const itemsGrid = document.getElementById('items-grid');
    const finishBtn = document.getElementById('finish-btn');
    const resetBtn = document.getElementById('reset-btn');
    const characterPreview = document.querySelector('.character-preview');
    const gameBg = document.getElementById('game-bg');
    const completionOverlay = document.getElementById('completion-overlay');

    let inventory = null;
    let currentSelection = {};
    const layerImages = {}; // Keeps track of <img> tags by category ID

    // Initial Configuration
    const INITIAL_STATE = {
        skin: 'skin_gray',
        makeup: 'makeup_none',
        nails: 'nails_neutral',
        shoes: 'shoes_none',
        hair: 'hair_none',
        accessories: 'acc_none'
    };

    /**
     * Initialize the game
     */
    async function init() {
        try {
            const response = await fetch('assets/inventory.json');
            if (!response.ok) throw new Error('Inventory file not found');
            inventory = await response.json();

            renderCategories();
            setupInitialState();

            // Set default category
            if (inventory.categories.length > 0) {
                renderItems(inventory.categories[0].id);
                document.querySelector('.cat-btn').classList.add('active');
            }
        } catch (error) {
            console.error('Failed to init game:', error);
            // Fallback UI or message
        }
    }

    /**
     * Render category navigation buttons
     */
    function renderCategories() {
        categoriesNav.innerHTML = '';
        inventory.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = category.name;
            btn.dataset.id = category.id;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderItems(category.id);
            });

            categoriesNav.appendChild(btn);
        });
    }

    /**
     * Render items for the selected category
     * @param {string} categoryId 
     */
    function renderItems(categoryId) {
        itemsGrid.innerHTML = '';
        const category = inventory.categories.find(c => c.id === categoryId);

        category.items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            if (currentSelection[categoryId] === item.id) {
                itemCard.classList.add('active');
            }

            itemCard.innerHTML = `
                <img src="${item.path}" class="img-thumb" alt="${item.name}" onerror="this.src='https://placehold.co/60x60?text=${item.name}'">
                <p>${item.name}</p>
            `;

            itemCard.addEventListener('click', () => {
                document.querySelectorAll('.item-card').forEach(c => c.classList.remove('active'));
                itemCard.classList.add('active');
                updateCharacterLayer(categoryId, item);
            });

            itemsGrid.appendChild(itemCard);
        });
    }

    /**
     * Update the character visual layer
     * @param {string} categoryId 
     * @param {object} item 
     */
    function updateCharacterLayer(categoryId, item) {
        currentSelection[categoryId] = item.id;
        const category = inventory.categories.find(c => c.id === categoryId);

        if (!layerImages[categoryId]) {
            const img = document.createElement('img');
            img.className = 'layer';
            img.style.zIndex = category.layerIndex;
            layersContainer.appendChild(img);
            layerImages[categoryId] = img;
        }

        // Transition effect
        layerImages[categoryId].style.opacity = '0.5';

        // Change source
        layerImages[categoryId].src = item.path;

        // Error handling for placeholders
        layerImages[categoryId].onerror = () => {
            // Apply a colored block if image fails (helpful for initial setup)
            layerImages[categoryId].style.background = 'rgba(0,0,0,0.1)';
            layerImages[categoryId].style.opacity = '0.3';
        };

        layerImages[categoryId].onload = () => {
            layerImages[categoryId].style.opacity = '1';
        };
    }

    /**
     * Sets the character to its initial neutral state
     */
    function setupInitialState() {
        inventory.categories.forEach(cat => {
            const initialItemId = INITIAL_STATE[cat.id];
            const initialItem = cat.items.find(i => i.id === initialItemId);
            if (initialItem) {
                updateCharacterLayer(cat.id, initialItem);
            }
        });
    }

    /**
     * Handle "Pronta para Sair" action
     */
    function handleFinish() {
        // 1. Character Exit Animation
        characterPreview.classList.add('animate-out');

        // 2. Scene Transition
        setTimeout(() => {
            // Change background
            gameBg.classList.add('city-scene');

            // Re-appear character (implied scene transition)
            characterPreview.classList.remove('animate-out');
            characterPreview.style.opacity = '0';
            characterPreview.style.transform = 'scale(0.8) translateY(20px)';

            setTimeout(() => {
                characterPreview.style.transition = 'all 1s ease';
                characterPreview.style.opacity = '1';
                characterPreview.style.transform = 'scale(1) translateY(0)';

                // 3. Show Completion Message
                completionOverlay.classList.remove('hidden');
            }, 500);

        }, 1500);
    }

    /**
     * Reset the game
     */
    function resetGame() {
        completionOverlay.classList.add('hidden');
        gameBg.classList.remove('city-scene');
        setupInitialState();
        // Re-render current category to update highlights
        const activeCatBtn = document.querySelector('.cat-btn.active');
        if (activeCatBtn) renderItems(activeCatBtn.dataset.id);
    }

    // Event Listeners
    finishBtn.addEventListener('click', handleFinish);
    resetBtn.addEventListener('click', resetGame);

    // Initial load
    init();
});
