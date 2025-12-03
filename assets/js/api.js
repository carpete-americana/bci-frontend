const API_BASE_URL = "https://bcibizz.pt/api"; // URL base da API

/**
 * Função genérica para fazer requisições à API
 * @param {string} endpoint - O endpoint da API (ex: "/users")
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} data - Dados a serem enviados no corpo da requisição (opcional)
 * @param {Object} headers - Headers adicionais (opcional)
 * @returns {Promise<Object>} - Resposta da API
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
        const result = await response.json();

        // Verifica o código de status
        if (response.ok) {
            // Se a resposta foi bem-sucedida (status 200-299)
            return { success: true, result };
        } else {
            // Caso contrário, assume que há um erro
            return { success: false, message: result.message || "Erro na requisição" };
        }
    } catch (error) {
        //console.error(error)
        console.error(`Erro na API (${method} ${endpoint}):`, error.message);
        return { success: false, message: error.message };
    }
}


/**
 * Métodos específicos para cada funcionalidade
*/

const API = {   
    register: function(userData) {
        return apiRequest("/auth/register", "POST", userData);
    },

    login: function(userCredentials) {
        return apiRequest("/auth/login", "POST", userCredentials);
    },

    validateToken: function() {
        return apiRequest("/auth/validateToken", "GET");
    },

    validateAdminToken: function() {
        return apiRequest("/auth/adminAuthenticated", "GET")
    },

    getUserData: function() {
        return apiRequest("/users/me", "GET");
    },

    getChartData: function() {
        return apiRequest("/users/me/chart-data", "GET");
    },

    getProfileByPhone: function(phone) {
        return apiRequest(`/profiles/by-phone/${phone}`, "GET"); 
    },

    getUserCasinoAccounts: function() {
        return apiRequest("/users/me/casino-accounts", "GET");
    },

    getUserTransactions: function() {
        return apiRequest("/users/me/transactions", "GET");
    },

    getUserDebts: function() {
        return apiRequest("/users/me/debts", "GET");
    },

    getUserWithdrawals: function(page = 1, limit = 100000) {
        return apiRequest(`/users/me/withdrawals?page=${page}&limit=${limit}`, "GET");
    },

    getProfits: function() {
        return apiRequest("/users/me/profits", "GET"); 
    },

    getPreferences: function() {
        return apiRequest("/users/me/preferences", "GET");  //FALTA FZR
    },

    updatePreferences: function(preferences) {
        return apiRequest("/users/me/preferences", "PUT", preferences);  //FALTA FZR
    },

    withdraw: function(amount) {
        return apiRequest("/users/me/withdraw", "POST", { amount });
    },

    recoverPasswordEmail: function(email) {
        return apiRequest("/auth/forgot-password", "POST", { email });
    }
    
}

// Export as default for ES modules
export default API;
