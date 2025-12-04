// ===========================================
// CASINO ACCOUNTS - CLEAN & ORGANIZED
// ===========================================

// Logo mapping for casinos
const CASINO_LOGOS = {
    'Betano': 'https://bcibizz.pt/assets/images/betano.png',
    'Betclic': 'https://bcibizz.pt/assets/images/betclic.png',
    'Bwin': 'https://bcibizz.pt/assets/images/bwin.png',
    'Solverde': 'https://bcibizz.pt/assets/images/solverde.png',
    'ESC Online': 'https://bcibizz.pt/assets/images/esc.png',
    'Placard': 'https://bcibizz.pt/assets/images/placard.png',
    'LeBull': 'https://bcibizz.pt/assets/images/lebull.png',
    'default': 'https://bcibizz.pt/assets/images/default-casino.png'
};

// Global state
let allAccounts = [];

// ===========================================
// INITIALIZATION
// ===========================================
export async function init() {
    await loadAccounts();
    setupSearch();
}

// ===========================================
// LOAD ACCOUNTS FROM API
// ===========================================
async function loadAccounts() {
    const container = document.getElementById('casinosContainer');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const response = await API.getUserCasinoAccounts();
        
        if (!response.success) {
            showError(response.message || 'Erro ao carregar contas');
            return;
        }
        
        allAccounts = response.result?.data || response.result || [];
        
        if (!allAccounts || allAccounts.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        renderAccounts(allAccounts);
        emptyState.style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        showError('Erro ao carregar contas de casino');
    }
}

// ===========================================
// RENDER ACCOUNTS
// ===========================================
function renderAccounts(accounts) {
    const container = document.getElementById('casinosContainer');
    const groupedAccounts = groupByCasino(accounts);
    
    container.innerHTML = '';
    
    Object.keys(groupedAccounts).forEach(casinoName => {
        const casinoGroup = createCasinoGroup(casinoName, groupedAccounts[casinoName]);
        container.appendChild(casinoGroup);
    });
}

// ===========================================
// GROUP ACCOUNTS BY CASINO
// ===========================================
function groupByCasino(accounts) {
    return accounts.reduce((groups, account) => {
        const casino = account.casino_name || 'Casino Desconhecido';
        if (!groups[casino]) {
            groups[casino] = [];
        }
        groups[casino].push(account);
        return groups;
    }, {});
}

// ===========================================
// CREATE CASINO GROUP ELEMENT
// ===========================================
function createCasinoGroup(casinoName, accounts) {
    const group = document.createElement('div');
    group.className = 'casino-group';
    
    const logo = CASINO_LOGOS[casinoName] || CASINO_LOGOS.default;
    const count = accounts.length;
    const countText = count === 1 ? 'conta' : 'contas';
    
    group.innerHTML = `
        <div class="casino-header">
            <img src="${logo}" alt="${casinoName}" class="casino-logo">
            <h2>${casinoName}</h2>
            <span class="accounts-count">${count} ${countText}</span>
            <button class="btn-icon toggle-btn">
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
        <div class="accounts-list"></div>
    `;
    
    const accountsList = group.querySelector('.accounts-list');
    accounts.forEach(account => {
        accountsList.appendChild(createAccountCard(account));
    });
    
    setupToggle(group);
    
    return group;
}

// ===========================================
// CREATE ACCOUNT CARD
// ===========================================
function createAccountCard(account) {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.dataset.accountId = account.account_id;
    
    const statusInfo = getStatusInfo(account.status);
    const accountName = account.full_name ? `Conta de ${account.full_name}` : `Conta #${account.account_id}`;
    
    card.innerHTML = `
        <div class="account-header">
            <h3>${accountName}</h3>
            <span class="status-badge ${statusInfo.class}">
                <i class="${statusInfo.icon}"></i> ${statusInfo.text}
            </span>
        </div>
        <div class="account-details">
            <div class="detail-item">
                <span class="detail-label">Proprietário</span>
                <span class="detail-value">${account.full_name || 'Não especificado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">NIF</span>
                <span class="detail-value">${account.nif || 'Não especificado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Cartão de Cidadão</span>
                <span class="detail-value">${account.numero_cartao_cidadao || 'Não especificado'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">IBAN</span>
                <span class="detail-value">${account.IBAN || 'Não especificado'}</span>
            </div>
        </div>
        <div class="account-actions">
            <button class="btn-icon" title="Ver detalhes" data-action="details">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
    `;
    
    setupAccountActions(card, account);
    
    return card;
}

// ===========================================
// SETUP TOGGLE FUNCTIONALITY
// ===========================================
function setupToggle(group) {
    const header = group.querySelector('.casino-header');
    const toggleBtn = group.querySelector('.toggle-btn');
    const accountsList = group.querySelector('.accounts-list');
    const icon = toggleBtn.querySelector('i');
    
    const toggle = () => {
        const isOpen = group.classList.toggle('open');
        accountsList.classList.toggle('open');
        icon.classList.toggle('fa-chevron-down', !isOpen);
        icon.classList.toggle('fa-chevron-up', isOpen);
    };
    
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.toggle-btn')) {
            toggle();
        }
    });
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
    });
}

// ===========================================
// SETUP ACCOUNT ACTIONS
// ===========================================
function setupAccountActions(card, account) {
    card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleAction(action, account);
        });
    });
}

// ===========================================
// HANDLE ACTIONS
// ===========================================
function handleAction(action, account) {
    switch(action) {
        case 'details':
            showAccountDetails(account);
            break;
        default:
            console.log(`Action "${action}" not implemented`);
    }
}

// ===========================================
// SHOW ACCOUNT DETAILS
// ===========================================
function showAccountDetails(account) {
    const statusInfo = getStatusInfo(account.status);
    
    alert(`Detalhes da Conta\n\n` +
          `ID: ${account.account_id}\n` +
          `Casino: ${account.casino_name}\n` +
          `Status: ${statusInfo.text}\n` +
          `Proprietário: ${account.full_name || 'N/A'}\n` +
          `NIF: ${account.nif || 'N/A'}\n` +
          `CC: ${account.numero_cartao_cidadao || 'N/A'}\n` +
          `IBAN: ${account.IBAN || 'N/A'}`);
}

// ===========================================
// GET STATUS INFO
// ===========================================
function getStatusInfo(status) {
    const statusMap = {
        'ACTIVE': { 
            class: 'status-active', 
            text: 'Ativa',
            icon: 'fas fa-check-circle'
        },
        'INACTIVE': { 
            class: 'status-inactive', 
            text: 'Inativa',
            icon: 'fas fa-times-circle'
        },
        'PENDING': { 
            class: 'status-pending', 
            text: 'Pendente',
            icon: 'fas fa-clock'
        },
        'BLOCKED': { 
            class: 'status-blocked', 
            text: 'Bloqueada',
            icon: 'fas fa-ban'
        }
    };
    
    return statusMap[status] || { 
        class: 'status-inactive', 
        text: 'Desconhecido',
        icon: 'fas fa-question-circle'
    };
}

// ===========================================
// SEARCH FUNCTIONALITY
// ===========================================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        searchTimeout = setTimeout(() => {
            if (!query) {
                renderAccounts(allAccounts);
                return;
            }
            
            const filtered = allAccounts.filter(account => {
                const searchText = `
                    ${account.casino_name || ''}
                    ${account.full_name || ''}
                    ${account.nif || ''}
                    ${account.numero_cartao_cidadao || ''}
                    ${account.IBAN || ''}
                `.toLowerCase();
                
                return searchText.includes(query);
            });
            
            if (filtered.length > 0) {
                renderAccounts(filtered);
                document.getElementById('emptyState').style.display = 'none';
            } else {
                document.getElementById('casinosContainer').innerHTML = '';
                document.getElementById('emptyState').style.display = 'block';
            }
        }, 300);
    });
}

// ===========================================
// SHOW ERROR
// ===========================================
function showError(message) {
    const container = document.getElementById('casinosContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro</h3>
            <p>${message}</p>
        </div>
    `;
}
