let user = null;

export async function init() {
    await loadUserData();
    updateBalance();
    loadRecentWithdrawals();
    setupForm();
    setupModal();
}

// ===========================
// USER DATA & BALANCE
// ===========================

async function loadUserData() {
    try {
        const response = await API.getUserData();
        if (response.success) {
            user = response.result.data;
            
            // Add default MBWAY account
            const select = document.getElementById('bankAccount');
            const option = document.createElement('option');
            option.value = "mbway";
            option.textContent = `📱 MBWAY · ${formatPhoneNumber(user.phone)}`;
            select.appendChild(option);
        } else {
            showAlert(response.message || 'Erro ao carregar dados', 'error');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('Erro ao carregar dados do utilizador', 'error');
    }
}

function updateBalance() {
    const balanceValue = user ? user.balance : 0;
    const formattedValue = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(balanceValue);

    document.querySelectorAll('.balance-value').forEach(el => {
        el.textContent = formattedValue;
    });

    // Update amount buttons
    document.querySelectorAll('.amount-btn').forEach(button => {
        const amount = parseFloat(button.getAttribute('data-amount'));
        button.disabled = amount > user.balance;
        
        button.addEventListener('click', () => {
            document.getElementById('amount').value = amount.toFixed(2);
        });
    });
}

// ===========================
// WITHDRAWAL FORM
// ===========================

function setupForm() {
    const form = document.getElementById('withdrawalForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const account = document.getElementById('bankAccount').value;
        
        if (!validateWithdrawal(amount, account)) {
            return;
        }
        
        const success = await processWithdrawal(amount);
        if (success) {
            form.reset();
            updateBalance();
            loadRecentWithdrawals();
        }
    });
}

function validateWithdrawal(amount, account) {
    if (!amount || amount < 10) {
        showAlert('O valor mínimo para levantamento é €10', 'error');
        return false;
    }
    
    if (amount > 2500) {
        showAlert('O valor máximo por transação é €2,500', 'error');
        return false;
    }
    
    if (amount > user.balance) {
        showAlert('Saldo insuficiente', 'error');
        return false;
    }
    
    if (!account) {
        showAlert('Por favor, selecione uma conta bancária', 'error');
        return false;
    }
    
    return true;
}

async function processWithdrawal(amount) {
    try {
        const response = await API.withdraw(amount);
        if (response.success) {
            showAlert('Levantamento efetuado com sucesso!', 'success');
            return true;
        } else {
            showAlert(response.message || 'Erro ao processar levantamento', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showAlert('Erro ao processar levantamento. Tente novamente.', 'error');
        return false;
    }
}

// ===========================
// WITHDRAWAL HISTORY
// ===========================

async function loadRecentWithdrawals() {
    try {
        const response = await API.getUserWithdrawals();
        if (response.success) {
            const withdrawals = response.result.data;
            renderHistory(withdrawals);
        }
    } catch (error) {
        console.error('Error loading withdrawals:', error);
    }
}

function renderHistory(withdrawals) {
    const historySection = document.querySelector('.withdrawal-history');
    const historyList = document.querySelector('.history-list');
    
    if (!withdrawals || withdrawals.data.length === 0) {
        historySection.classList.remove('show');
        return;
    }
    
    // Sort by date and get last 3
    const recent = withdrawals.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
    
    historyList.innerHTML = recent.map(w => createHistoryItem(w)).join('');
    historySection.classList.add('show');
}

function createHistoryItem(withdrawal) {
    const status = withdrawal.status.toLowerCase();
    const statusText = withdrawal.status === 'COMPLETED' ? 'Concluído' : 'Processando';
    const statusIcon = withdrawal.status === 'COMPLETED' ? 'fas fa-check-circle' : 'fas fa-clock';
    const formattedDate = formatDate(withdrawal.created_at);
    const formattedAmount = parseFloat(withdrawal.amount).toFixed(2);
    
    return `
        <div class="history-item ${status}">
            <div class="history-details">
                <div class="history-amount">${formattedAmount} €</div>
                <div class="history-date">${formattedDate}</div>
            </div>
            <div class="history-status">
                <span class="status-badge">
                    <i class="${statusIcon}"></i> ${statusText}
                </span>
            </div>
        </div>
    `;
}

function formatDate(dateISO) {
    const date = new Date(dateISO);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `Hoje, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Ontem, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
        return date.toLocaleDateString('pt-PT', { 
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
}

// ===========================
// MODAL MANAGEMENT
// ===========================

function setupModal() {
    const modal = document.getElementById('addAccountModal');
    const openBtn = document.querySelector('.add-account-link');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelAddAccount');
    const saveBtn = document.getElementById('saveAccount');
    const typeOptions = document.querySelectorAll('.type-option');
    
    // Open modal
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Switch account type
    typeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const type = option.getAttribute('data-type');
            switchAccountType(type);
        });
    });
    
    // Input formatting
    document.getElementById('phoneNumber').addEventListener('input', (e) => {
        formatPhoneInput(e.target);
    });
    
    document.getElementById('ibanNumber').addEventListener('input', (e) => {
        formatIBANInput(e.target);
    });
    
    // Save account
    saveBtn.addEventListener('click', saveAccount);
}

function openModal() {
    const modal = document.getElementById('addAccountModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('addAccountForm').reset();
    switchAccountType('mbway');
}

function closeModal() {
    const modal = document.getElementById('addAccountModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function switchAccountType(type) {
    document.querySelectorAll('.type-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`.type-option[data-type="${type}"]`).classList.add('active');
    
    document.querySelectorAll('.account-form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector(`.${type}-form`).classList.add('active');
}

function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 9) {
        value = value.substring(0, 9);
    }
    
    if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{3})/, '$1 $2');
    }
    
    input.value = value;
}

function formatIBANInput(input) {
    let value = input.value.replace(/\s/g, '').toUpperCase();
    
    if (value.length > 2) {
        value = value.substring(0, 2) + value.substring(2).replace(/\D/g, '');
    }
    
    if (value.length > 25) {
        value = value.substring(0, 25);
    }
    
    value = value.replace(/(.{4})/g, '$1 ').trim();
    input.value = value;
}

function validateAccountForm(type) {
    if (type === 'mbway') {
        const phone = document.getElementById('phoneNumber').value.replace(/\s/g, '');
        if (phone.length !== 9 || !/^9[1236]\d{7}$/.test(phone)) {
            showAlert('Número de telemóvel inválido (deve começar com 91, 92, 93 ou 96)', 'error');
            return false;
        }
    } else {
        const iban = document.getElementById('ibanNumber').value.replace(/\s/g, '');
        if (iban.length !== 25 || !/^PT50\d{21}$/.test(iban)) {
            showAlert('IBAN português inválido (formato: PT50 + 21 dígitos)', 'error');
            return false;
        }
    }
    return true;
}

async function saveAccount() {
    const activeType = document.querySelector('.type-option.active').getAttribute('data-type');
    
    if (!validateAccountForm(activeType)) {
        return;
    }
    
    const saveBtn = document.getElementById('saveAccount');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A guardar...';
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let accountData;
        
        if (activeType === 'mbway') {
            const phone = document.getElementById('phoneNumber').value.replace(/\s/g, '');
            const name = document.getElementById('accountNameMBWAY').value || `MBWAY ${phone}`;
            accountData = {
                type: 'mbway',
                phone: phone,
                name: name,
                display: `📱 MBWAY · ${formatPhoneNumber(phone)}`
            };
        } else {
            const iban = document.getElementById('ibanNumber').value.replace(/\s/g, '');
            const name = document.getElementById('accountNameIBAN').value || 'Conta Bancária';
            const bank = document.getElementById('bankName').value || '';
            accountData = {
                type: 'iban',
                iban: iban,
                name: name,
                bank: bank,
                display: `🏦 ${bank || 'Banco'} · ${formatIBAN(iban)}`
            };
        }
        
        addAccountToDropdown(accountData);
        closeModal();
        showAlert('Conta adicionada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error saving account:', error);
        showAlert('Erro ao adicionar conta', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Guardar Conta';
    }
}

function addAccountToDropdown(accountData) {
    const select = document.getElementById('bankAccount');
    const option = document.createElement('option');
    option.value = accountData.type === 'mbway' ? `mbway_${accountData.phone}` : `iban_${accountData.iban}`;
    option.textContent = accountData.display;
    select.appendChild(option);
    select.value = option.value;
}

// ===========================
// UTILITIES
// ===========================

function formatPhoneNumber(phone) {
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

function formatIBAN(iban) {
    return iban.replace(/(.{4})/g, '$1 ').trim();
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}
