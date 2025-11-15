let casinoaccounts = null;
const casinoLogos = {
    'Betano': 'https://bcibizz.pt/assets/images/betano.png',
    'Betclic': 'https://bcibizz.pt/assets/images/betclic.png',
    'Bwin': 'https://bcibizz.pt/assets/images/bwin.png',
    'Solverde': 'https://bcibizz.pt/assets/images/solverde.png',
    'ESC Online': 'https://bcibizz.pt/assets/images/esc.png',
    'Placard': 'https://bcibizz.pt/assets/images/placard.png',
    'LeBull': 'https://bcibizz.pt/assets/images/lebull.png',
    'default': 'https://bcibizz.pt/assets/images/default-casino.png'
};

// ==============================================
// FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
// ==============================================
export async function init() {
    try {
        await loadCasinoAccounts();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showAlert('Erro ao inicializar o sistema', 'error');
    }
    initEventListeners();
}

// ==============================================
// CARREGAMENTO DE DADOS
// ==============================================
async function loadCasinoAccounts() {
    try {
        const container = document.querySelector('.casinos-container');
        if (!container) {
            console.error('Container de casinos não encontrado');
            return;
        }

        container.innerHTML = '<div class="loading">Carregando...</div>';
        const response = await API.getUserCasinoAccounts();

        if (!response.success) {
            showAlert(response.message || 'Erro ao carregar contas de casino', "error");
            displayNoAccounts();
            return;
        }

        casinoaccounts = response.result?.data || response.result || response;
        container.innerHTML = '';

        if (!casinoaccounts || casinoaccounts.length === 0) {
            displayNoAccounts();
            return;
        }

        renderCasinoAccounts(casinoaccounts);
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        showAlert('Erro ao carregar contas de casino', 'error');
        displayNoAccounts();
    }
}

function displayNoAccounts() {
    const container = document.querySelector('.casinos-container');
    container.innerHTML = `
        <div class="no-accounts">
            <i class="fas fa-user-slash"></i>
            <p>Nenhuma conta de casino encontrada</p>
        </div>
    `;
}

// ==============================================
// RENDERIZAÇÃO
// ==============================================
function renderCasinoAccounts(accounts) {
    const casinos = groupAccountsByCasino(accounts);
    for (const casinoName in casinos) {
        createCasinoElement(casinos[casinoName]);
    }
}

function groupAccountsByCasino(accounts) {
    const casinos = {};
    accounts.forEach(account => {
        const casinoName = account.casino_name || 'Casino Desconhecido';
        if (!casinos[casinoName]) {
            casinos[casinoName] = {
                nome: casinoName,
                logo: getCasinoLogo(casinoName),
                contas: []
            };
        }
        casinos[casinoName].contas.push(account);
    });
    return casinos;
}

function getCasinoLogo(casinoName) {
    return casinoLogos[casinoName] || casinoLogos.default;
}

// ==============================================
// EXPAND/COLLAPSE
// ==============================================
function openCollapse(el) {
    if (!el) return;
    el.classList.add('open');
    el.style.maxHeight = (el.scrollHeight + 15) + 'px';
}

function closeCollapse(el) {
    if (!el) return;
    el.style.maxHeight = el.scrollHeight + 'px';
    requestAnimationFrame(() => {
        el.style.maxHeight = '0px';
        el.classList.remove('open');
    });
}

// ==============================================
// SEARCH UTILS
// ==============================================
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearch(term, el) {
    if (!el) return;
    const original = el.dataset.original || el.textContent;
    if (!term) {
        el.innerHTML = original;
        return;
    }
    const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    el.innerHTML = original.replace(re, '<mark>$1</mark>');
}

// ==============================================
// CRIAÇÃO DE ELEMENTOS
// ==============================================
function createCasinoElement(casino) {
    const container = document.querySelector('.casinos-container');
    const casinoDiv = document.createElement('div');
    casinoDiv.className = 'casino-group';

    casinoDiv.innerHTML = `
        <div class="casino-header">
            <img src="${casino.logo}" alt="${casino.nome}" class="casino-logo">
            <h2>${casino.nome}</h2>
            <span class="accounts-count">${casino.contas.length} ${casino.contas.length === 1 ? 'conta' : 'contas'}</span>
            <button class="btn-icon toggle-btn"><i class="fas fa-chevron-down"></i></button>
        </div>
        <div class="accounts-list"></div>
    `;

    const accountsList = casinoDiv.querySelector('.accounts-list');
    accountsList.style.maxHeight = '0px';

    casino.contas.forEach(account => {
        const accountElement = createAccountElement(account);
        accountsList.appendChild(accountElement);
    });

    const header = casinoDiv.querySelector('.casino-header');
    const toggleBtn = casinoDiv.querySelector('.toggle-btn');
    const icon = toggleBtn.querySelector('i');

    const doToggle = () => {
        if (accountsList.classList.contains('open')) {
            closeCollapse(accountsList);
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            casinoDiv.classList.remove('open');
        } else {
            openCollapse(accountsList);
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            casinoDiv.classList.add('open');
        }
    };

    header.addEventListener('click', (e) => {
        if (e.target.closest('.btn-icon')) return;
        doToggle();
    });

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        doToggle();
    });

    container.appendChild(casinoDiv);
}

function createAccountElement(account) {
    const statusInfo = getStatusInfo(account.status);
    const accountName = account.full_name ? `Conta de ${account.full_name}` : `Conta #${account.account_id}`;

    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-card';
    accountDiv.dataset.accountId = account.account_id;

    accountDiv.innerHTML = `
        <div class="account-header">
            <h3>${accountName}</h3>
            <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
        </div>
        <div class="account-details">
            <div class="detail-item"><span class="detail-label">Proprietário:</span><span class="detail-value">${account.full_name || 'Não especificado'}</span></div>
            <div class="detail-item"><span class="detail-label">NIF:</span><span class="detail-value">${account.nif || 'Não especificado'}</span></div>
            <div class="detail-item"><span class="detail-label">Cartão de Cidadão:</span><span class="detail-value">${account.numero_cartao_cidadao || 'Não especificado'}</span></div>
            <div class="detail-item"><span class="detail-label">IBAN:</span><span class="detail-value">${account.IBAN || 'Não especificado'}</span></div>
        </div>
        <div class="account-actions">
            <button class="btn-icon details-btn" title="Ver detalhes" data-account-id="${account.account_id}"><i class="fas fa-info-circle"></i></button>
        </div>
    `;

    const titleEl = accountDiv.querySelector('.account-header h3');
    if (titleEl) titleEl.dataset.original = titleEl.textContent;

    addAccountEventListeners(accountDiv, account);
    return accountDiv;
}

function addAccountEventListeners(accountElement, account) {
    accountElement.querySelector('.details-btn')?.addEventListener('click', () => viewDetails(account.account_id));
}

// ==============================================
// MODAL DE DETALHES
// ==============================================
function viewDetails(accountId) {
    const accountData = getAccountDetails(accountId);
    if (!accountData) {
        showAlert('Conta não encontrada', 'error');
        return;
    }

    const statusInfo = getStatusInfo(accountData.status);

    const modal = document.createElement('div');
    modal.className = 'account-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Detalhes da Conta</h2>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="account-info">
                    <div class="info-section">
                        <h3>Informações da Conta</h3>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">ID da Conta:</span><span class="info-value">${accountData.account_id}</span></div>
                            <div class="info-item"><span class="info-label">Casino:</span><span class="info-value">${accountData.casino_name}</span></div>
                            <div class="info-item"><span class="info-label">Estado:</span><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></div>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>Informações Pessoais</h3>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">Nome Completo:</span><span class="info-value">${accountData.full_name || 'Não especificado'}</span></div>
                            <div class="info-item"><span class="info-label">NIF:</span><span class="info-value">${accountData.nif || 'Não especificado'}</span></div>
                            <div class="info-item"><span class="info-label">Cartão de Cidadão:</span><span class="info-value">${accountData.numero_cartao_cidadao || 'Não especificado'}</span></div>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>Informações Bancárias</h3>
                        <div class="info-grid">
                            <div class="info-item"><span class="info-label">IBAN:</span><span class="info-value">${accountData.IBAN || 'Não especificado'}</span></div>
                        </div>
                    </div>
                    ${accountData.status === 'INACTIVE' || accountData.status === 'BLOCKED' ? `
                        <div class="info-section">
                            <h3>Ações Necessárias</h3>
                            <div class="action-required">
                                <i class="fas fa-exclamation-circle"></i>
                                <p>Esta conta necessita de verificação adicional para ser ativada.</p>
                                <button class="btn btn-primary verify-btn" data-account-id="${accountData.account_id}">
                                    <i class="fas fa-check-circle"></i> Iniciar Verificação
                                </button>
                            </div>
                        </div>` : ''
                    }
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal-btn">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    addModalEventListeners(modal, accountData);

    const closeOnEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', closeOnEsc);
    modal._closeOnEsc = closeOnEsc;
}

function addModalEventListeners(modal, accountData) {
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
    modal.querySelector('.close-modal-btn')?.addEventListener('click', closeModal);

    modal.querySelector('.verify-btn')?.addEventListener('click', () => {
        closeModal();
        verifyAccount(accountData.account_id);
    });
}

function closeModal() {
    const modal = document.querySelector('.account-modal');
    if (modal) {
        document.removeEventListener('keydown', modal._closeOnEsc);
        modal.remove()
        document.body.style.overflow = '';
    }
}

function closeNewAccountModal() {
    const newAccountModal = document.getElementById('new-account-modal');
    if (newAccountModal) {
        newAccountModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ==============================================
// HELPERS
// ==============================================
function getAccountDetails(accountId) {
    if (!casinoaccounts) return null;
    return casinoaccounts.find(acc => acc.account_id === accountId) || null;
}

function getStatusInfo(status) {
    const statusMap = {
        'ACTIVE': { class: 'status-active', text: 'Ativa' },
        'INACTIVE': { class: 'status-suspended', text: 'Inativa' },
        'PENDING': { class: 'status-pending', text: 'Pendente' },
        'BLOCKED': { class: 'status-suspended', text: 'Bloqueada' }
    };
    return statusMap[status] || { class: 'status-suspended', text: 'Desconhecido' };
}

// ==============================================
// AÇÕES
// ==============================================
function verifyAccount(accountId) {
    console.log('Verificar conta:', accountId);
    showAlert('Processo de verificação iniciado', 'info');
}

// ==============================================
// ALERTA
// ==============================================
function showAlert(message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// ==============================================
// EVENTOS GERAIS
// ==============================================
function initEventListeners() {
    // 🔎 Pesquisa
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', function () {
        clearTimeout(searchTimeout);
        const term = this.value.toLowerCase();
        searchTimeout = setTimeout(() => {
            document.querySelectorAll('.casino-group').forEach(group => {
                const casinoName = group.querySelector('h2').textContent.toLowerCase();
                const accounts = group.querySelectorAll('.account-card');
                let match = casinoName.includes(term);

                accounts.forEach(acc => {
                    const text = acc.textContent.toLowerCase();
                    if (text.includes(term)) {
                        acc.style.display = '';
                        match = true;
                        highlightSearch(term, acc.querySelector('.account-header h3'));
                    } else {
                        acc.style.display = 'none';
                    }
                });

                group.style.display = match ? '' : 'none';
            });
        }, 250);
    });

    // ➕ Modal Nova Conta
    const newAccountBtn = document.getElementById('new-account-btn');
    const newAccountModal = document.getElementById('new-account-modal');
    const newAccountForm = document.getElementById('new-account-form');

    if (newAccountBtn && newAccountModal) {
        newAccountBtn.addEventListener('click', () => {
            newAccountModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        newAccountModal.querySelector('.modal-close')?.addEventListener('click', closeNewAccountModal);
        newAccountModal.querySelector('.modal-overlay')?.addEventListener('click', closeNewAccountModal);

        if (newAccountForm) {
            newAccountForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(this));

                console.log("Nova conta submetida:", formData);
                showAlert("Conta criada com sucesso!", "success");
                closeNewAccountModal();

                // await API.createCasinoAccount(formData);
                // loadCasinoAccounts();
            });
        }
    }
}
