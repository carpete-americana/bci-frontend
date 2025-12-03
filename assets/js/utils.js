const Utils = {
    findSession: async function(redirectLogin = true) {
        const token = await window.electronStorage.getItem('token'); 

        if (token) {
            try {
                const response = await API.validateToken(); // Certifique-se de passar o token
                if (response.success) {
                    return true;
                } else {
                    await window.electronStorage.removeItem('token');
                    await window.electronStorage.removeItem('rememberMe');
                    if(redirectLogin) window.location.href = './login.html';
                    return false;
                }
            } catch (error) {
                console.error("Error validating token:", error);
                await window.electronStorage.removeItem('token');
                await window.electronStorage.removeItem('rememberMe');
                if(redirectLogin) window.location.href = './login.html';
                return false;
            }
        } else {
            if(redirectLogin) window.location.href = './login.html';
            return false;
        }
    },

    findAdminSession: async function(redirectLogin = true) {
        const token = await window.electronStorage.getItem('token');
    
        if (token) {
            const response = await API.validateAdminToken();
            if (response.success) {
                return true;
            } else {
                await window.electronStorage.removeItem('token');
                if(redirectLogin) window.location.href = './login.html';
                return false;
            }
        } else {
            if(redirectLogin) window.location.href = './login.html';
            return false;
        }        
    },

    logout: async function() {
        await window.electronStorage.removeItem('token')
        await window.electronStorage.removeItem('rememberMe')
        window.location.href = './login.html'
    },

        notification: async function() {
        // Evitar duplicação se já existir
        if (document.querySelector(".notification-container")) return;

        // Injetar HTML da notificação
        const container = document.createElement("div");
        container.innerHTML = `
            <div class="notification-container">
                <div class="notification" id="notification">
                    <div class="notification-icon info">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title" id="notif-title">Notificação</div>
                        <div class="notification-message" id="notif-message">Mensagem</div>
                    </div>
                    <button class="notification-close" id="close-notification">×</button>
                </div>
            </div>
            <canvas id="confetti-canvas"></canvas>
        `;
        document.body.appendChild(container);

        // Lógica
        const notification = document.getElementById('notification');
        const closeButton = document.getElementById('close-notification');
        const titleElement = document.getElementById('notif-title');
        const messageElement = document.getElementById('notif-message');
        const icon = notification.querySelector('.notification-icon');
        const iconElement = icon.querySelector('i');

        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
        });

        // Função para criar efeito de confetes
        function createConfetti() {
            const canvas = document.getElementById('confetti-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const confetti = [];
            const confettiCount = 150;
            const gravity = 0.5;
            const terminalVelocity = 5;
            const drag = 0.075;
            const colors = [
                { front: '#ff0000', back: '#cc0000' }, { front: '#00ff00', back: '#00cc00' },
                { front: '#0000ff', back: '#0000cc' }, { front: '#ffff00', back: '#cccc00' },
                { front: '#ff00ff', back: '#cc00cc' }, { front: '#00ffff', back: '#00cccc' },
                { front: '#ffffff', back: '#cccccc' }
            ];

            // Inicializar confetes
            for (let i = 0; i < confettiCount; i++) {
                confetti.push({
                    color: colors[Math.floor(Math.random() * colors.length)],
                    dimensions: {
                        x: Math.random() * 10 + 5,
                        y: Math.random() * 10 + 5
                    },
                    position: {
                        x: Math.random() * canvas.width,
                        y: -Math.random() * canvas.height
                    },
                    rotation: Math.random() * 2 * Math.PI,
                    scale: {
                        x: 1,
                        y: 1
                    },
                    velocity: {
                        x: Math.random() * 20 - 10,
                        y: Math.random() * 10 + 5
                    }
                });
            }

            // Função de animação
            function update() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                confetti.forEach((confetto, index) => {
                    let width = confetto.dimensions.x * confetto.scale.x;
                    let height = confetto.dimensions.y * confetto.scale.y;
                    
                    // Aplicar física
                    confetto.velocity.x -= confetto.velocity.x * drag;
                    confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
                    confetto.velocity.y -= confetto.velocity.y * drag;
                    
                    confetto.position.x += confetto.velocity.x;
                    confetto.position.y += confetto.velocity.y;
                    
                    // Rotação
                    confetto.rotation += confetto.velocity.x * 0.01;
                    
                    // Desenhar confete
                    ctx.save();
                    ctx.translate(confetto.position.x, confetto.position.y);
                    ctx.rotate(confetto.rotation);
                    
                    ctx.fillStyle = confetto.color.front;
                    ctx.fillRect(-width / 2, -height / 2, width, height);
                    
                    ctx.restore();
                    
                    // Remover confetes que saíram da tela
                    if (confetto.position.y >= canvas.height) {
                        confetti.splice(index, 1);
                    }
                });
                
                if (confetti.length > 0) {
                    requestAnimationFrame(update);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            
            update();
        }

        // Função global
        window.showNotification = function(type, title, message) {
            // atualizar estilo
            notification.className = "notification";
            icon.className = "notification-icon " + type;
            
            switch(type) {
                case "info": 
                    iconElement.className = "fas fa-info-circle"; 
                    break;
                case "success": 
                    iconElement.className = "fas fa-check-circle"; 
                    break;
                case "warning": 
                    iconElement.className = "fas fa-exclamation-triangle"; 
                    break;
                case "error": 
                    iconElement.className = "fas fa-exclamation-circle"; 
                    break;
                case "congrats": 
                    iconElement.className = "fas fa-trophy"; 
                    notification.classList.add("congrats");
                    createConfetti(); // Ativar confetes
                    break;
            }

            titleElement.textContent = title;
            messageElement.textContent = message;

            notification.classList.add("show");

            // Auto-fechar após 4s (opcional)
            // setTimeout(() => {
            //     notification.classList.remove("show");
            // }, 4000);
        };
    }
}

export default Utils;