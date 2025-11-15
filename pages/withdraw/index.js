let user = null
let withdrawals = null

export async function init() {
    await getUserData();
    updateAllBalanceValues();
    preencherHistoricoLevantamentos();
    initAddAccountModal();

    const select = document.getElementById('bankAccount');
    const option = document.createElement('option');
    option.value = "mbway";
    option.textContent = `📱 MBWAY · ${formatPhoneNumber(user.phone)}`;
    select.appendChild(option);

    // Função para formatar número de telemóvel
    function formatPhoneNumber(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    // Validação do formulário
    const form = document.getElementById('withdrawalForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amountInput = document.getElementById('amount')
        const amount = parseFloat(amountInput.value);
        const bankAccount = document.getElementById('bankAccount').value;
        
        if (!amount || amount < 10) {
            showAlert('O valor mínimo para levantamento é €10', "error");
            return;
        }
        
        if (!bankAccount) {
            showAlert('Por favor, selecione uma conta bancária', "error");
            return;
        }
        
        // Simular envio do formulário
        if(withdraw(amount)) {
            updateAllBalanceValues()
            preencherHistoricoLevantamentos()
        }
        form.reset();
    });
}

async function getUserData() {
    const response = await API.getUserData()
    if (response.success) {
        user = response.result.data
    } else {
        showAlert(response.message || 'Error loading User Data', "error");
    }
}

async function withdraw(amount) {
    const response = await API.withdraw(amount)
    if (response.success) {
        showAlert('Levantamento efetuado com Sucesso', "success");
        return true;
    } else {
        showAlert('Falha no levantamento. Por favor, contacte o suporte ou tente novamente', "error");
        return false;
    }
}

async function getUserWithdrawals() {
    const response = await API.getUserWithdrawals()
    if (response.success) {
        withdrawals = response.result.data
        return withdrawals
    } else {
        showAlert(response.message || 'Error loading User Withdrawals', "error");
    }
}

function getlast3(withdrawsdata) {
    const withdrawsOrdenados = withdrawsdata.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });
    return withdrawsOrdenados.slice(0, 3);
}

async function preencherHistoricoLevantamentos() {
    let withdrawsdata = await getUserWithdrawals();
    const ultimosWithdraws = getlast3(withdrawsdata);

    if(ultimosWithdraws.length == 0) return;
    else document.querySelector('.withdrawal-history').style.display = 'block';

    const historyList = document.querySelector('.history-list');
    
    // Limpar o conteúdo atual
    historyList.innerHTML = '';
    
    ultimosWithdraws.forEach(withdraw => {
        const historyItem = criarItemHistorico(withdraw);
        historyList.appendChild(historyItem);
    });
}

function criarItemHistorico(withdraw) {

    const item = document.createElement('div');
    item.className = `history-item ${withdraw.status.toLowerCase()}`;
    
    const status = withdraw.status.toLowerCase();
    const statusTexto = withdraw.status === 'COMPLETED' ? 'Concluído' : 'Processando';
    const statusIcon = withdraw.status === 'COMPLETED' ? 'fas fa-check-circle' : 'fas fa-clock';
    
    item.innerHTML = `
        <div class="history-details">
            <div class="history-amount">${parseFloat(withdraw.amount).toFixed(2)} €</div>
            <div class="history-date">${formatarDataPortugues(withdraw.created_at)}</div>
        </div>
        <div class="history-status">
            <span class="status-badge ${status}">
                <i class="fas ${statusIcon}"></i> ${statusTexto}
            </span>
        </div>
    `;
    
    return item;
}

function formatarDataPortugues(dataISO) {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffTempo = agora - data;
    const diffDias = Math.floor(diffTempo / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) {
        return `Hoje, ${data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDias === 1) {
        return `Ontem, ${data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDias < 7) {
        return data.toLocaleDateString('pt-PT', { 
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return data.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}



async function updateAllBalanceValues() {
    try {
        // 1. Obter o valor do storage (uma única chamada)
        await getUserData()

        const balanceValue = user ? user.balance : null
        
        // 2. Formatando o valor (exemplo: €1,000.50)
        const formattedValue = new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(balanceValue || 0);

        // 3. Atualizar todos os elementos
        document.querySelectorAll(".balance-value").forEach(label => {
            label.textContent = formattedValue;
        });

        document.querySelectorAll(".amount-btn").forEach(button => {
            const buttonAmount = parseFloat(button.getAttribute('data-amount'));
            button.disabled = buttonAmount > user.balance;

            button.addEventListener('click', function() {
                
                // Ou se quiseres atualizar um input field:
                const inputField = document.querySelector('#amount');
                if (inputField) {
                    inputField.value = buttonAmount.toFixed(2);
                }
            });
        });

    } catch (error) {
        console.error("Erro ao atualizar saldos:", error);
        // Fallback: Mostra valor padrão em caso de erro
        document.querySelectorAll(".balance-value").forEach(label => {
            label.textContent = "€---";
        });
    }
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// Inicialização do modal
function initAddAccountModal() {
    const addAccountLink = document.querySelector('.add-account-link');
    const modal = document.getElementById('addAccountModal');
    const closeButtons = document.querySelectorAll('.modal-close, #cancelAddAccount');
    const typeOptions = document.querySelectorAll('.type-option');
    const saveButton = document.getElementById('saveAccount');
    const form = document.getElementById('addAccountForm');

    // Abrir modal
    addAccountLink.addEventListener('click', function(e) {
        e.preventDefault();
        openAddAccountModal();
    });

    // Fechar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAddAccountModal);
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddAccountModal();
        }
    });

    // Trocar tipo de conta
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            switchAccountType(type);
        });
    });

    // Formatar número de telefone
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', function(e) {
        formatPhoneNumberInput(e.target);
    });

    // Formatar IBAN
    const ibanInput = document.getElementById('ibanNumber');
    ibanInput.addEventListener('input', function(e) {
        formatIBANInput(e.target);
    });

    // Salvar conta
    saveButton.addEventListener('click', saveAccount);
}

// Abrir modal
function openAddAccountModal() {
    const modal = document.getElementById('addAccountModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Reset do formulário
    document.getElementById('addAccountForm').reset();
    switchAccountType('mbway');
}

// Fechar modal
function closeAddAccountModal() {
    const modal = document.getElementById('addAccountModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Trocar tipo de conta
function switchAccountType(type) {
    // Atualizar seleção visual
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.type-option[data-type="${type}"]`).classList.add('active');

    // Mostrar formulário correto
    document.querySelectorAll('.account-form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector(`.${type}-form`).classList.add('active');
}

// Formatar número de telefone enquanto digita
function formatPhoneNumberInput(input) {
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

// Formatar IBAN enquanto digita
function formatIBANInput(input) {
    let value = input.value.replace(/\s/g, '').toUpperCase();
    
    if (value.length > 2) {
        value = value.substring(0, 2) + value.substring(2).replace(/\D/g, '');
    }
    
    if (value.length > 25) {
        value = value.substring(0, 25);
    }
    
    // Adicionar espaços a cada 4 caracteres
    value = value.replace(/(.{4})/g, '$1 ').trim();
    
    input.value = value;
}

// Validar formulário
function validateAccountForm(type) {
    if (type === 'mbway') {
        const phoneNumber = document.getElementById('phoneNumber').value.replace(/\s/g, '');
        if (phoneNumber.length !== 9 || !/^9[1236]\d{7}$/.test(phoneNumber)) {
            showAlert('Por favor, insira um número de telemóvel português válido (9 dígitos começando com 91, 92, 93 ou 96)', 'error');
            return false;
        }
    } else {
        const iban = document.getElementById('ibanNumber').value.replace(/\s/g, '');
        if (iban.length !== 25 || !/^PT50\d{21}$/.test(iban)) {
            showAlert('Por favor, insira um IBAN português válido no formato PT50 seguido de 21 dígitos', 'error');
            return false;
        }
    }
    return true;
}

// Salvar conta
async function saveAccount() {
    const saveButton = document.getElementById('saveAccount');
    const activeType = document.querySelector('.type-option.active').getAttribute('data-type');
    
    // Validar formulário
    if (!validateAccountForm(activeType)) {
        return;
    }

    // Mostrar estado de carregamento
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    try {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let accountData;
        
        if (activeType === 'mbway') {
            const phoneNumber = document.getElementById('phoneNumber').value.replace(/\s/g, '');
            const accountName = document.getElementById('accountNameMBWAY').value || `MBWAY ${phoneNumber}`;
            
            accountData = {
                type: 'mbway',
                phoneNumber: phoneNumber,
                accountName: accountName,
                displayName: `📱 MBWAY · ${formatPhoneNumber(phoneNumber)}`
            };
        } else {
            const iban = document.getElementById('ibanNumber').value.replace(/\s/g, '');
            const accountName = document.getElementById('accountNameIBAN').value || 'Conta Bancária';
            const bankName = document.getElementById('bankName').value || '';
            
            accountData = {
                type: 'iban',
                iban: iban,
                accountName: accountName,
                bankName: bankName,
                displayName: `🏦 ${bankName || 'Banco'} · ${formatIBAN(iban)}`
            };
        }
        
        // Adicionar conta ao dropdown
        addAccountToDropdown(accountData);
        
        // Fechar modal e mostrar sucesso
        closeAddAccountModal();
        showAlert('Conta adicionada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao adicionar conta:', error);
        showAlert('Erro ao adicionar conta. Por favor, tente novamente.', 'error');
    } finally {
        // Remover estado de carregamento
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    }
}

// Adicionar conta ao dropdown
function addAccountToDropdown(accountData) {
    const select = document.getElementById('bankAccount');
    const option = document.createElement('option');
    option.value = accountData.type === 'mbway' ? `mbway_${accountData.phoneNumber}` : `iban_${accountData.iban}`;
    option.textContent = accountData.displayName;
    option.setAttribute('data-account-data', JSON.stringify(accountData));
    select.appendChild(option);
    
    // Selecionar a nova conta
    select.value = option.value;
}

// Formatar número de telefone para exibição
function formatPhoneNumber(phone) {
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

// Formatar IBAN para exibição
function formatIBAN(iban) {
    return iban.replace(/(.{4})/g, '$1 ').trim();
}