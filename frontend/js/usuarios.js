// Función de inicialización para usuarios
window.initUsuarios = async function() {
    console.log('Inicializando usuarios...');
    
    // Verificar permisos
    if (currentUserRole !== 'admin') {
        showToast('No tienes permisos para acceder a esta página', 'error');
        setTimeout(async () => {
            await loadPage('dashboard');
        }, 1500);
        return;
    }
    
    // Actualizar información del usuario en header
    if (currentUser) {
        const userNameElem = document.getElementById('userName');
        const userEmailElem = document.getElementById('userEmail');
        if (userNameElem) userNameElem.textContent = currentUser.name;
        if (userEmailElem) userEmailElem.textContent = currentUser.email;
    }
    
    // Cargar lista de usuarios
    await loadUsers();
    
    // Event Listeners
    const showDashboardBtn = document.getElementById('showDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    
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
    
    if (addUserBtn) {
        const newAddUserBtn = addUserBtn.cloneNode(true);
        addUserBtn.parentNode.replaceChild(newAddUserBtn, addUserBtn);
        newAddUserBtn.addEventListener('click', openAddUserModal);
    }
    
    // Configurar modales
    setupModals();
};

// Cargar lista de usuarios
async function loadUsers() {
    const token = getToken();
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Cargando usuarios...</td></tr>';
        
        const response = await fetch(`${API_URL}/auth/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users);
        } else if (response.status === 403) {
            showToast('No tienes permisos de administrador', 'error');
            await loadPage('dashboard');
        } else {
            throw new Error('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        if (tbody) {
            tbody.innerHTML = '</tr><td colspan="6" class="loading-text">Error al cargar usuarios</td></tr>';
        }
        showToast('Error al cargar usuarios', 'error');
    }
}

// Mostrar usuarios en la tabla
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">No hay usuarios registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
            <td><span class="badge ${user.isActive ? 'badge-active' : 'badge-inactive'}">${user.isActive ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="window.editUser(${user.id})">Editar</button>
                    <button class="btn-delete" onclick="window.deleteUser(${user.id}, '${escapeHtml(user.name)}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para agregar usuario
function openAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHelp').style.display = 'block';
    document.getElementById('userStatus').value = 'true';
    document.getElementById('userModal').style.display = 'block';
}

// Editar usuario
window.editUser = async function(userId) {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('modalTitle').textContent = 'Editar Usuario';
                document.getElementById('userId').value = user.id;
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userRole').value = user.role;
                document.getElementById('userStatus').value = user.isActive.toString();
                document.getElementById('userPassword').required = false;
                document.getElementById('userPassword').value = '';
                document.getElementById('passwordHelp').style.display = 'block';
                document.getElementById('userModal').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar datos del usuario', 'error');
    }
};

// Variables para eliminación
let userToDelete = null;

// Eliminar usuario
window.deleteUser = function(userId, userName) {
    userToDelete = { id: userId, name: userName };
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteModal').style.display = 'block';
};

// Confirmar eliminación
async function confirmDelete() {
    if (!userToDelete) return;
    
    const token = getToken();
    
    try {
        const response = await fetch(`${API_URL}/auth/users/${userToDelete.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Usuario eliminado correctamente', 'success');
            closeDeleteModal();
            await loadUsers();
        } else if (response.status === 403) {
            showToast('No tienes permisos para eliminar usuarios', 'error');
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al eliminar usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar usuario', 'error');
    }
}

// Guardar usuario (crear o editar)
async function saveUser(event) {
    event.preventDefault();
    
    const token = getToken();
    const userId = document.getElementById('userId').value;
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        isActive: document.getElementById('userStatus').value === 'true'
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }
    
    const url = userId ? `${API_URL}/auth/users/${userId}` : `${API_URL}/auth/register`;
    const method = userId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            showToast(userId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');
            closeModal();
            await loadUsers();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar usuario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar usuario', 'error');
    }
}

// Configurar modales
function setupModals() {
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    const closeBtn = document.querySelector('.close');
    const closeDeleteBtn = document.querySelector('.close-delete');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const userForm = document.getElementById('userForm');
    
    // Remover event listeners anteriores clonando y reemplazando
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = closeModal;
    }
    
    if (closeDeleteBtn) {
        const newCloseDeleteBtn = closeDeleteBtn.cloneNode(true);
        closeDeleteBtn.parentNode.replaceChild(newCloseDeleteBtn, closeDeleteBtn);
        newCloseDeleteBtn.onclick = closeDeleteModal;
    }
    
    if (cancelModalBtn) {
        const newCancelModalBtn = cancelModalBtn.cloneNode(true);
        cancelModalBtn.parentNode.replaceChild(newCancelModalBtn, cancelModalBtn);
        newCancelModalBtn.onclick = closeModal;
    }
    
    if (cancelDeleteBtn) {
        const newCancelDeleteBtn = cancelDeleteBtn.cloneNode(true);
        cancelDeleteBtn.parentNode.replaceChild(newCancelDeleteBtn, cancelDeleteBtn);
        newCancelDeleteBtn.onclick = closeDeleteModal;
    }
    
    if (confirmDeleteBtn) {
        const newConfirmDeleteBtn = confirmDeleteBtn.cloneNode(true);
        confirmDeleteBtn.parentNode.replaceChild(newConfirmDeleteBtn, confirmDeleteBtn);
        newConfirmDeleteBtn.onclick = confirmDelete;
    }
    
    if (userForm) {
        const newUserForm = userForm.cloneNode(true);
        userForm.parentNode.replaceChild(newUserForm, userForm);
        newUserForm.onsubmit = saveUser;
    }
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        if (event.target === userModal) closeModal();
        if (event.target === deleteModal) closeDeleteModal();
    };
}

// Cerrar modales
function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'none';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
    userToDelete = null;
}