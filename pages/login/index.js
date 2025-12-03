// Login page initialization - works in both Electron app and web browser
// Detects environment and uses appropriate storage mechanism

// Storage abstraction - works in both Electron and browser
const Storage = {
    // Check if running in Electron
    isElectron: typeof window !== 'undefined' && window.electronStorage,
    
    async setItem(key, value) {
        if (this.isElectron) {
            // Use Electron encrypted storage
            return await window.electronStorage.setItem(key, value);
        } else {
            // Use browser localStorage
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    },
    
    async getItem(key) {
        if (this.isElectron) {
            // Use Electron encrypted storage
            return await window.electronStorage.getItem(key);
        } else {
            // Use browser localStorage
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage error:', e);
                return null;
            }
        }
    },
    
    async removeItem(key) {
        if (this.isElectron) {
            // Use Electron encrypted storage
            return await window.electronStorage.removeItem(key);
        } else {
            // Use browser localStorage
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    }
};

// Navigation abstraction - works in both Electron and browser
const Navigation = {
    isElectron: typeof window !== 'undefined' && window.electronAPI && window.electronAPI.navigate,
    
    async navigate(path) {
        if (this.isElectron) {
            // Use Electron IPC navigation (prevents FOUC)
            try {
                await window.electronAPI.navigate(path);
            } catch (e) {
                console.error('Electron navigation failed, using fallback:', e);
                window.location.href = path;
            }
        } else {
            // Use browser navigation
            window.location.href = path;
        }
    }
};

export async function init() {
    const rememberMe = await Storage.getItem('rememberMe');
    if(rememberMe) {
        const session = await Utils.findSession(false);
        if(session) {
            await Navigation.navigate('index.html');
            return;
        }
    }

    // Seleciona os elementos
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const forgotPassword = document.getElementById('forgotPassword');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const submitRecovery = document.getElementById('submitRecovery');
    const showLoginFormFromRecovery = document.getElementById('showLoginFormFromRecovery');

    // Validação em tempo real para o formulário de registo
    setupRealtimeValidation();

    // Função para mostrar o formulário de registro e ocultar o de login
    showRegisterForm.addEventListener('click', (e) => {               
        e.preventDefault();
        loginForm.classList.add('hide');
        registerForm.classList.add('show');
        registerForm.classList.remove('hide');
        loginForm.classList.remove('show');
    });

    // Função para mostrar o formulário de login e ocultar o de registro
    showLoginForm.addEventListener('click', (e) => {
        e.preventDefault();
        let from = ["login", "register", "forgotPassword"];
        for (let i = 0; i < from.length; i++) {
            const successMessage = document.getElementById(from[i] + "-successMessage");
            if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
            const errorMessage = document.getElementById(from[i] + "-errorMessage");
            if(!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
        }
        clearLoginFields();
        clearRegisterFields();
        registerForm.classList.add('hide');
        loginForm.classList.add('show');
        loginForm.classList.remove('hide');
        registerForm.classList.remove('show');
    });

    // Função para o link "Esqueci-me da senha"
    forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hide');
        forgotPasswordForm.classList.add('show');
        forgotPasswordForm.classList.remove('hide');
    });

    // Função para o link "Voltar ao Login" na página de recuperação de senha
    showLoginFormFromRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        let from = ["login", "register", "forgotPassword"];
        for (let i = 0; i < from.length; i++) {
            const successMessage = document.getElementById(from[i] + "-successMessage");
            if (!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
            const errorMessage = document.getElementById(from[i] + "-errorMessage");
            if (!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
        }
        clearLoginFields();
        forgotPasswordForm.classList.add('hide');
        loginForm.classList.add('show');
        loginForm.classList.remove('hide');
        forgotPasswordForm.classList.remove('show');
    });

    // Função para o registro de usuário
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userData = {
            username: document.getElementById('regUsername').value,
            password: document.getElementById('regPassword').value,
            fullname: document.getElementById('fullname').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('number').value,
        };

        if (userData.username && userData.password && userData.fullname && userData.email && userData.phone) {
            const response = await API.register(userData);
            if (response.success) {
                showSuccess('Conta criada com sucesso!', "login");
                let from = ["register", "forgotPassword"];
                for (let i = 0; i < from.length; i++) {
                    const successMessage = document.getElementById(from[i] + "-successMessage");
                    if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
                    const errorMessage = document.getElementById(from[i] + "-errorMessage");
                    if(!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
                }
                clearRegisterFields();
                registerForm.classList.add('hide');
                loginForm.classList.add('show');
                loginForm.classList.remove('hide');
                registerForm.classList.remove('show');
            } else {
                showError(response.message, "register");
            }
        } else {
            showError('Por favor, preencha todos os campos corretamente.', "register");
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userCredentials = {
            username: document.querySelector('#username').value,
            password: document.querySelector('#password').value,
        };

        const rememberMeChecked = document.getElementById('rememberMe').checked;

        if(userCredentials.username && userCredentials.password) {
            const response = await API.login(userCredentials);
            if (response.success) {
                showSuccess('Login efetuado com sucesso!', "login");
                
                // Armazena o token usando storage abstraction
                await Storage.setItem('token', response.result.data.token);
                
                // Se "Manter-me conectado" estiver marcado, guarda a preferência
                if (rememberMeChecked) {
                    await Storage.setItem('rememberMe', true);
                } else {
                    await Storage.removeItem('rememberMe');
                }
                
                // Navigate using abstraction (Electron or browser)
                await Navigation.navigate('index.html');
            } else {
                showError(response.message, "login");
            }
        }
    });

    // Função para enviar o e-mail de recuperação
    submitRecovery.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailRecovery').value;

        if (email) {
            await API.recoverPasswordEmail(email);
            showSuccess(`Se a conta com o email "${email}" existir, um link para recuperação de senha será enviado.`, "login");
            
            document.getElementById('emailRecovery').value = '';
            let from = ["register", "forgotPassword"];
            for (let i = 0; i < from.length; i++) {
                const successMessage = document.getElementById(from[i] + "-successMessage");
                if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
                const errorMessage = document.getElementById(from[i] + "-errorMessage");
                if(!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
            }
            forgotPasswordForm.classList.add('hide');
            loginForm.classList.add('show');
            loginForm.classList.remove('hide');
            forgotPasswordForm.classList.remove('show');
        } else {
            showError('Por favor, insira um e-mail válido.', "forgotPassword");
        }
    });
}

function showError(message, from) {
    const successMessage = document.getElementById(from + "-successMessage");
    if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
    const errorMessage = document.getElementById(from + "-errorMessage");
    errorMessage.textContent = message;
    errorMessage.classList.remove("hide");
}

function showSuccess(message, from) {
    const errorMessage = document.getElementById(from + "-errorMessage");
    if(!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
    const successMessage = document.getElementById(from + "-successMessage");
    successMessage.textContent = message;
    successMessage.classList.remove("hide");
} 

function clearLoginFields() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function clearRegisterFields() {
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('fullname').value = '';
    document.getElementById('email').value = '';
    document.getElementById('number').value = '';
}

/**
 * Configuração de validação em tempo real
 */
function setupRealtimeValidation() {
    // Validação de username (registo)
    const regUsername = document.getElementById('regUsername');
    if (regUsername) {
        regUsername.addEventListener('blur', function() {
            validateUsername(this.value, 'regUsername');
        });
    }

    // Validação de password (registo)
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('blur', function() {
            validatePassword(this.value, 'regPassword');
        });
        regPassword.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }

    // Validação de email
    const email = document.getElementById('email');
    if (email) {
        email.addEventListener('blur', function() {
            validateEmail(this.value, 'email');
        });
    }

    // Validação de telefone
    const phone = document.getElementById('number');
    if (phone) {
        phone.addEventListener('input', function() {
            // Permite apenas números
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        phone.addEventListener('blur', function() {
            validatePhone(this.value, 'number');
        });
    }

    // Validação de email de recuperação
    const emailRecovery = document.getElementById('emailRecovery');
    if (emailRecovery) {
        emailRecovery.addEventListener('blur', function() {
            validateEmail(this.value, 'emailRecovery');
        });
    }
}

/**
 * Valida username
 * @param {string} username 
 * @param {string} fieldId 
 * @returns {boolean}
 */
function validateUsername(username, fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    removeFieldError(field);

    if (username.length < 3) {
        setFieldError(field, 'Username deve ter pelo menos 3 caracteres');
        return false;
    }
    if (username.length > 20) {
        setFieldError(field, 'Username não pode ter mais de 20 caracteres');
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setFieldError(field, 'Username só pode conter letras, números e underscore');
        return false;
    }

    setFieldSuccess(field);
    return true;
}

/**
 * Valida password
 * @param {string} password 
 * @param {string} fieldId 
 * @returns {boolean}
 */
function validatePassword(password, fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    removeFieldError(field);

    if (password.length < 6) {
        setFieldError(field, 'Password deve ter pelo menos 6 caracteres');
        return false;
    }
    if (password.length > 50) {
        setFieldError(field, 'Password muito longa');
        return false;
    }

    setFieldSuccess(field);
    return true;
}

/**
 * Atualiza indicador visual de força da password
 * @param {string} password 
 */
function updatePasswordStrength(password) {
    const field = document.getElementById('regPassword');
    if (!field) return;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Remove indicadores anteriores
    const parent = field.closest('.input-group');
    const oldIndicator = parent.querySelector('.password-strength');
    if (oldIndicator) oldIndicator.remove();

    if (password.length > 0) {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        indicator.style.cssText = 'margin-top: 5px; font-size: 0.75rem;';
        
        if (strength <= 2) {
            indicator.innerHTML = '<span style="color: #ff0000;">⚠️ Fraca</span>';
        } else if (strength <= 3) {
            indicator.innerHTML = '<span style="color: #ff9800;">⚡ Média</span>';
        } else {
            indicator.innerHTML = '<span style="color: #4caf50;">✓ Forte</span>';
        }
        
        parent.appendChild(indicator);
    }
}

/**
 * Valida email
 * @param {string} email 
 * @param {string} fieldId 
 * @returns {boolean}
 */
function validateEmail(email, fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    removeFieldError(field);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setFieldError(field, 'Email inválido');
        return false;
    }

    setFieldSuccess(field);
    return true;
}

/**
 * Valida número de telefone português
 * @param {string} phone 
 * @param {string} fieldId 
 * @returns {boolean}
 */
function validatePhone(phone, fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    removeFieldError(field);

    if (phone.length !== 9) {
        setFieldError(field, 'Número deve ter 9 dígitos');
        return false;
    }
    if (!/^[0-9]{9}$/.test(phone)) {
        setFieldError(field, 'Número inválido');
        return false;
    }
    // Validação adicional para números portugueses (começa com 9, 2 ou 3)
    if (!/^[239]/.test(phone)) {
        setFieldError(field, 'Número de telefone português inválido');
        return false;
    }

    setFieldSuccess(field);
    return true;
}

/**
 * Define erro num campo
 * @param {HTMLElement} field 
 * @param {string} message 
 */
function setFieldError(field, message) {
    const parent = field.closest('.input-group');
    
    field.style.borderColor = '#ff0000';
    
    // Remove mensagem anterior se existir
    const oldError = parent.querySelector('.field-error');
    if (oldError) oldError.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #ff0000; font-size: 0.75rem; margin-top: 3px; position: relative;';
    parent.appendChild(errorDiv);
}

/**
 * Define sucesso num campo
 * @param {HTMLElement} field 
 */
function setFieldSuccess(field) {
    field.style.borderColor = '#4caf50';
}

/**
 * Remove erro de um campo
 * @param {HTMLElement} field 
 */
function removeFieldError(field) {
    field.style.borderColor = '';
    const parent = field.closest('.input-group');
    const errorDiv = parent.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
}
