// Login page initialization - called by login-renderer.js after Utils is loaded
export async function init() {
    const rememberMe = await window.electronStorage.getItem('rememberMe');
    if(rememberMe) {
        const session = await Utils.findSession(false)
        if(session) {
        window.location.href = './index.html'
        return
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
        clearLoginFields()
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

        const rememberMe = document.getElementById('rememberMe').checked;

        if(userCredentials.username && userCredentials.password) {
            const response = await API.login(userCredentials)
            if (response.success) {
                showSuccess('login efetuado com sucesso!', "login");
                
                // Armazena o token usando nosso sistema
                await window.electronStorage.setItem('token', response.result.data.token)
                
                // Se "Manter-me conectado" estiver marcado, guarda a preferência
                if (rememberMe) {
                    await window.electronStorage.setItem('rememberMe', true)
                } else {
                    await window.electronStorage.removeItem('rememberMe')
                }
                
                window.location.href = './index.html';
            } else {
                showError(response.message, "login");
            }
        }
    });


    // Função para enviar o e-mail de recuperação
    submitRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('emailRecovery').value;

        if (email) {
            API.recoverPasswordEmail(email)
            showSuccess(`Se a conta com o email "${email}" existir, um link para recuperação de senha será enviado.`, "login");
            
            document.getElementById('emailRecovery').value = '';
            let from = ["register", "forgotPassword"];
            for (let i = 0; i < from.length; i++) {
                const successMessage = document.getElementById(from[i]  + "-successMessage");
                if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
                const errorMessage = document.getElementById(from[i]  + "-errorMessage");
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
    const successMessage = document.getElementById(from+ "-successMessage");
    if(!successMessage.classList.contains("hide")) successMessage.classList.add("hide");
    const errorMessage = document.getElementById(from + "-errorMessage");
    errorMessage.textContent = message;
    errorMessage.classList.remove("hide");
}

function showSuccess(message, from) {
    const errorMessage = document.getElementById(from + "-errorMessage");
    if(!errorMessage.classList.contains("hide")) errorMessage.classList.add("hide");
    const successMessage = document.getElementById(from+ "-successMessage");
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