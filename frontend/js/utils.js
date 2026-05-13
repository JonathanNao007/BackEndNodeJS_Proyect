// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentUser = null;
let currentUserRole = null;

// Mostrar notificaciones
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Guardar token en localStorage
function setToken(token) {
    localStorage.setItem('authToken', token);
}

// Obtener token
function getToken() {
    return localStorage.getItem('authToken');
}

// Eliminar token
function removeToken() {
    localStorage.removeItem('authToken');
}

// Verificar si está autenticado
function isAuthenticated() {
    return !!getToken();
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Limpiar event listeners anteriores (para evitar duplicados)
function cleanPageScripts() {
    // Remover scripts específicos de página que se agregaron dinámicamente
    const scriptsToRemove = ['auth.js', 'dashboard.js', 'usuarios.js'];
    scriptsToRemove.forEach(scriptName => {
        const script = document.querySelector(`script[src*="${scriptName}"]`);
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    });
}

// Cargar página
async function loadPage(pageName) {
    const container = document.getElementById('app');
    if (!container) return;
    
    try {
        // Limpiar scripts anteriores
        cleanPageScripts();
        
        const response = await fetch(`../pages/${pageName}.html`);
        if (!response.ok) throw new Error('Página no encontrada');
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Cargar el JavaScript específico de la página
        const script = document.createElement('script');
        script.src = `../js/${pageName}.js`;
        script.onload = () => {
            console.log(`${pageName}.js cargado correctamente`);
            // Inicializar la página si tiene función de inicialización
            if (pageName === 'login' && typeof window.initLogin === 'function') {
                window.initLogin();
            } else if (pageName === 'dashboard' && typeof window.initDashboard === 'function') {
                window.initDashboard();
            } else if (pageName === 'usuarios' && typeof window.initUsuarios === 'function') {
                window.initUsuarios();
            }
        };
        script.onerror = () => {
            console.error(`Error al cargar ${pageName}.js`);
        };
        document.body.appendChild(script);
        
        return true;
    } catch (error) {
        console.error('Error loading page:', error);
        container.innerHTML = '<div class="error" style="text-align:center;padding:50px;color:#EF5350;">Error al cargar la página</div>';
        return false;
    }
}

// Redirigir según sesión
async function checkAuthAndRedirect() {
    if (!isAuthenticated()) {
        await loadPage('login');
        return false;
    }
    
    // Verificar token con el backend
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            currentUserRole = data.user.role;
            await loadPage('dashboard');
            return true;
        } else {
            removeToken();
            await loadPage('login');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        await loadPage('login');
        return false;
    }
}