export async function init() {
        document.querySelectorAll('.rules-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Atualizar navegação
            document.querySelectorAll('.rules-nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
            
            // Mostrar seção correspondente
            const sectionId = this.getAttribute('data-section');
            document.querySelectorAll('.rules-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${sectionId}-section`).classList.add('active');
        });
    });
}