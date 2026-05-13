// Función de inicialización para login
window.initLogin = function() {
    console.log('Inicializando login...');
    
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    // Mostrar formulario de registro
    function showRegisterForm() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (registerContainer) registerContainer.style.display = 'block';
        if (registerForm) registerForm.reset();
    }
    
    // Mostrar formulario de login
    function showLoginForm() {
        if (loginContainer) loginContainer.style.display = 'block';
        if (registerContainer) registerContainer.style.display = 'none';
        if (loginForm) loginForm.reset();
    }
    
    // Manejar Login
    async function handleLogin(email, password) {
        const loginBtn = document.querySelector('#loginForm button');
        const originalText = loginBtn?.textContent || 'Iniciar Sesión';
        
        try {
            if (loginBtn) {
                loginBtn.textContent = 'Iniciando...';
                loginBtn.disabled = true;
            }
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                setToken(data.token);
                showToast(`¡Bienvenido ${data.user.name}!`, 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(data.message || 'Credenciales inválidas', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con el servidor', 'error');
        } finally {
            if (loginBtn) {
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
            }
        }
    }
    
    // Manejar Registro
    async function handleRegister(name, email, password) {
        const registerBtn = document.querySelector('#registerForm button');
        const originalText = registerBtn?.textContent || 'Registrarse';
        
        try {
            if (registerBtn) {
                registerBtn.textContent = 'Registrando...';
                registerBtn.disabled = true;
            }
            
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                setToken(data.token);
                showToast('¡Registro exitoso! Bienvenido', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast(data.message || 'Error en el registro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con el servidor', 'error');
        } finally {
            if (registerBtn) {
                registerBtn.textContent = originalText;
                registerBtn.disabled = false;
            }
        }
    }
    
    // Event Listeners
    if (loginForm) {
        // Remover event listener anterior si existe
        const newLoginForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newLoginForm, loginForm);
        
        newLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            if (email && password) await handleLogin(email, password);
        });
    }
    
    if (registerForm) {
        const newRegisterForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        
        newRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName')?.value;
            const email = document.getElementById('regEmail')?.value;
            const password = document.getElementById('regPassword')?.value;
            
            if (name && name.length < 3) {
                showToast('El nombre debe tener al menos 3 caracteres', 'error');
                return;
            }
            
            if (password && password.length < 6) {
                showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            if (name && email && password) await handleRegister(name, email, password);
        });
    }
    
    if (showRegister) {
        const newShowRegister = showRegister.cloneNode(true);
        showRegister.parentNode.replaceChild(newShowRegister, showRegister);
        newShowRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (showLogin) {
        const newShowLogin = showLogin.cloneNode(true);
        showLogin.parentNode.replaceChild(newShowLogin, showLogin);
        newShowLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Mostrar login por defecto
    showLoginForm();
};

// Si el script se carga directamente y ya existe el container, inicializar
if (document.getElementById('loginContainer')) {
    window.initLogin();
}