// Variables globales de inventario
let productosData = [];
let existenciasData = [];
let currentDeleteType = null;
let currentDeleteId = null;

// Función de inicialización para dashboard
window.initDashboard = async function() {
    console.log('Inicializando dashboard...');
    
    // Actualizar información del usuario
    if (currentUser) {
        const userNameElem = document.getElementById('userName');
        const userEmailElem = document.getElementById('userEmail');
        const userRoleElem = document.getElementById('userRole');
        const userIdElem = document.getElementById('userId');
        
        if (userNameElem) userNameElem.textContent = currentUser.name;
        if (userEmailElem) userEmailElem.textContent = currentUser.email;
        if (userRoleElem) userRoleElem.textContent = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
        if (userIdElem) userIdElem.textContent = currentUser.id;
        
        // Mostrar/ocultar botón de usuarios según rol
        const showUsersBtn = document.getElementById('showUsersBtn');
        if (showUsersBtn) {
            showUsersBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        }
    }
    
    // Event Listeners
    const showUsersBtn = document.getElementById('showUsersBtn');
    const showDashboardBtn = document.getElementById('showDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (showUsersBtn) {
        const newShowUsersBtn = showUsersBtn.cloneNode(true);
        showUsersBtn.parentNode.replaceChild(newShowUsersBtn, showUsersBtn);
        newShowUsersBtn.addEventListener('click', async () => {
            await loadPage('usuarios');
        });
    }
    
    if (showDashboardBtn) {
        const newShowDashboardBtn = showDashboardBtn.cloneNode(true);
        showDashboardBtn.parentNode.replaceChild(newShowDashboardBtn, showDashboardBtn);
        newShowDashboardBtn.addEventListener('click', async () => {
            await loadPage('dashboard');
        });
    }
    
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', () => {
            removeToken();
            showToast('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
};

// Si el script se carga directamente y ya existe el container, inicializar
if (document.getElementById('showDashboardBtn')) {
    window.initDashboard();
}