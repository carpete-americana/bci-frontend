const API_BASE_URL = "https://bcibizz.pt/api"; // URL base da API

/**
 * Função genérica para fazer requisições à API
 * @param {string} endpoint - O endpoint da API (ex: "/users")
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object|null} data - Dados a serem enviados no corpo da requisição (opcional)
 * @param {Object} headers - Headers adicionais (opcional)
 * @returns {Promise<{success: boolean, result?: any, message?: string}>} - Resposta da API
 * @throws {Error} - Lança erro se a requisição falhar completamente
 */
async function apiRequest(endpoint, method = "GET", data = null, headers = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Headers padrão
    const defaultHeaders = {
        "Content-Type": "application/json",
        ...headers,
    };

    // Se houver um token salvo (autenticação)
    const token = await window.electronStorage.getItem('token');
    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Configuração do fetch
    const options = {
        method,
        headers: defaultHeaders,
    };

    // Se não for um GET, adiciona o body
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        // Tenta fazer parse do JSON mesmo em caso de erro
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            // Se não conseguir fazer parse, retorna erro genérico
            return { 
                success: false, 
                message: `Erro de comunicação com o servidor (${response.status})` 
            };
        }

        // Verifica o código de status
        if (response.ok) {
            // Se a resposta foi bem-sucedida (status 200-299)
            return { success: true, result };
        } else {
            // Caso contrário, retorna erro com mensagem do servidor
            return { 
                success: false, 
                message: result.message || `Erro ${response.status}: ${response.statusText}` 
            };
        }
    } catch (error) {
        // Erros de rede ou outros erros de fetch
        console.error(`Erro na API (${method} ${endpoint}):`, error.message);
        return { 
            success: false, 
            message: error.message || "Erro de conexão com o servidor" 
        };
    }
}


/**
 * Métodos específicos para cada funcionalidade da API
 * @namespace API
 */
const API = {
    /**
     * Registra um novo utilizador
     * @param {Object} userData - Dados do utilizador
     * @param {string} userData.username - Nome de utilizador
     * @param {string} userData.password - Palavra-passe
     * @param {string} userData.fullname - Nome completo
     * @param {string} userData.email - Email
     * @param {string} userData.phone - Número de telefone
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    register: function(userData) {
        return apiRequest("/auth/register", "POST", userData);
    },

    /**
     * Faz login com credenciais do utilizador
     * @param {Object} userCredentials - Credenciais de login
     * @param {string} userCredentials.username - Nome de utilizador
     * @param {string} userCredentials.password - Palavra-passe
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    login: function(userCredentials) {
        return apiRequest("/auth/login", "POST", userCredentials);
    },

    /**
     * Valida o token de autenticação atual
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    validateToken: function() {
        return apiRequest("/auth/validateToken", "GET");
    },

    /**
     * Valida se o utilizador tem permissões de administrador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    validateAdminToken: function() {
        return apiRequest("/auth/adminAuthenticated", "GET")
    },

    /**
     * Obtém os dados do utilizador autenticado
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getUserData: function() {
        return apiRequest("/users/me", "GET");
    },

    /**
     * Obtém dados para gráficos do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getChartData: function() {
        return apiRequest("/users/me/chart-data", "GET");
    },

    /**
     * Obtém perfil através do número de telefone
     * @param {string} phone - Número de telefone
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getProfileByPhone: function(phone) {
        return apiRequest(`/profiles/by-phone/${phone}`, "GET"); 
    },

    /**
     * Obtém contas de casino do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getUserCasinoAccounts: function() {
        return apiRequest("/users/me/casino-accounts", "GET");
    },

    /**
     * Obtém transações do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getUserTransactions: function() {
        return apiRequest("/users/me/transactions", "GET");
    },

    /**
     * Obtém dívidas do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getUserDebts: function() {
        return apiRequest("/users/me/debts", "GET");
    },

    /**
     * Obtém levantamentos do utilizador
     * @param {number} [page=1] - Número da página
     * @param {number} [limit=100000] - Limite de resultados
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getUserWithdrawals: function(page = 1, limit = 100000) {
        return apiRequest(`/users/me/withdrawals?page=${page}&limit=${limit}`, "GET");
    },

    /**
     * Obtém lucros do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getProfits: function() {
        return apiRequest("/users/me/profits", "GET"); 
    },

    /**
     * Obtém preferências do utilizador
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    getPreferences: function() {
        return apiRequest("/users/me/preferences", "GET");
    },

    /**
     * Atualiza preferências do utilizador
     * @param {Object} preferences - Preferências a atualizar
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    updatePreferences: function(preferences) {
        return apiRequest("/users/me/preferences", "PUT", preferences);
    },

    /**
     * Realiza um levantamento
     * @param {number} amount - Valor a levantar
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    withdraw: function(amount) {
        return apiRequest("/users/me/withdraw", "POST", { amount });
    },

    /**
     * Envia email de recuperação de senha
     * @param {string} email - Email para recuperação
     * @returns {Promise<{success: boolean, result?: any, message?: string}>}
     */
    recoverPasswordEmail: function(email) {
        return apiRequest("/auth/forgot-password", "POST", { email });
    }
    
}

// Export as default for ES modules
export default API;
