
// ==================== INICIALIZACIÓN ====================
window.initInventarios = async function() {
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
    setupEventListeners();
    loadInventarioData();
}

function setupEventListeners() {
    // Botones principales
    document.getElementById('showDashboardBtn')?.addEventListener('click', async () => {
            await loadPage('dashboard');
        });
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
            removeToken();
            showToast('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
        //===============================================================================================
    document.getElementById('refreshResumenBtn')?.addEventListener('click', () => loadResumen());
    document.getElementById('filtroProducto')?.addEventListener('input', filtrarProductos);
    document.getElementById('filtroExistencia')?.addEventListener('input', filtrarExistencias);
    document.getElementById('filtroSucursalExistencia')?.addEventListener('change', filtrarExistencias);
        document.getElementById('productoSelectLote')?.addEventListener('change', (e) => {
        if (e.target.value) loadLotesByProducto(e.target.value);
        else document.getElementById('lotesTableBody').innerHTML = '<tr><td colspan="9" class="loading-text">Seleccione un producto</td></tr>';
    });
    // Modales
    document.getElementById('cancelProductoBtn')?.addEventListener('click', closeProductoModal);
    document.getElementById('cancelExistenciaBtn')?.addEventListener('click', closeExistenciaModal);
    document.getElementById('cancelLoteBtn')?.addEventListener('click', closeLoteModal);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);

    document.querySelectorAll('.close-producto, .close-existencia, .close-lote, .close-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            closeProductoModal();
            closeExistenciaModal();
            closeLoteModal();
            closeDeleteModal();
        });
    });

        // Forms
    document.getElementById('productoForm')?.addEventListener('submit', saveProducto);
    document.getElementById('existenciaForm')?.addEventListener('submit', saveExistencia);
    document.getElementById('loteForm')?.addEventListener('submit', saveLote);
    //+===================================================================================================
    //Sub-tabs de inventario
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.subtab-content').forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(`subtab${subtab.charAt(0).toUpperCase() + subtab.slice(1)}`).style.display = 'block';
            
            // Cargar datos según subtab
            if (subtab === 'productos') loadProductos();
            else if (subtab === 'existencias') loadExistencias();
            else if (subtab === 'resumen') loadResumen();
        });
    });
    
    // Botones de inventario
    document.getElementById('addProductoBtn')?.addEventListener('click', () => openProductoModal());
    document.getElementById('addLoteBtn')?.addEventListener('click', () => openLoteModal());
    document.getElementById('filtroProducto')?.addEventListener('input', filtrarProductos);
    document.getElementById('filtroExistencia')?.addEventListener('input', filtrarExistencias);
    document.getElementById('filtroSucursalExistencia')?.addEventListener('change', filtrarExistencias);
    document.getElementById('productoSelectLote')?.addEventListener('change', (e) => {
        if (e.target.value) loadLotesByProducto(e.target.value);
    });
    
    // Modales
    setupModals();
}

// ==================== FUNCIONES DE INVENTARIO ====================
async function loadInventarioData() {
    await loadProductos();
    await loadExistencias();
    await loadResumen();
    await loadProductosSelect();
}

async function loadProductos() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            productosData = data.data;
            //console.log(productoData);
            displayProductos(productosData);
        }
    } catch (error) {
        showToast('Error al cargar productos', 'error');
    }
}

function displayProductos(productos) {
    const tbody = document.getElementById('productosTableBody');
    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-text">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td>${p.idProducto}</td>
            <td>${p.claveProducto}</td>
            <td>${p.codigoBarras}</td>
            <td>${escapeHtml(p.descripcion.substring(0, 40))}${p.descripcion.length > 40 ? '...' : ''}</td>
            <td>${p.sKU}</td>
            <td>${(p.existencias[0]? p.existencias[0].existencia : 0)}</td>
            <td>$${parseFloat(p.precioP).toFixed(2)}</td>
            <td><span class="badge ${p.delete ? 'badge-danger' : 'badge-good'}">${p.delete ? 'Eliminado' : 'Activo'}</span></td>
            <td>
                <button class="btn-edit" onclick="editProducto(${p.idProducto})">Editar</button>
                ${!p.delete ? `<button class="btn-delete" onclick="deleteProducto(${p.idProducto}, '${escapeHtml(p.descripcion)}')">Eliminar</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function filtrarProductos() {
    const filtro = document.getElementById('filtroProducto').value.toLowerCase();
    const filtered = productosData.filter(p => 
        p.descripcion.toLowerCase().includes(filtro) ||
        p.sKU.toLowerCase().includes(filtro) ||
        p.codigoBarras.toLowerCase().includes(filtro)
    );
    displayProductos(filtered);
}

async function loadExistencias() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/existencias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            existenciasData = data.data;
            displayExistencias(existenciasData);
        }
    } catch (error) {
        showToast('Error al cargar existencias', 'error');
    }
}

function displayExistencias(existencias) {
    const tbody = document.getElementById('existenciasTableBody');
    if (!existencias || existencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No hay existencias registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = existencias.map(e => {
        const disponible = e.existencia - (e.porEntregar || 0);
        let stockStatus = '';
        if (disponible <= 0) stockStatus = '<span class="badge badge-danger">Agotado</span>';
        else if (disponible < 5) stockStatus = '<span class="badge badge-warning">Bajo stock</span>';
        else stockStatus = '<span class="badge badge-good">Normal</span>';
        
        return `
            <tr>
                <td>${e.id}</td>
                <td>${e.claveProducto}</td>
                <td>${e.producto?.descripcion || 'N/A'}</td>
                <td>${e.existencia}</td>
                <td>${disponible}</td>
                <td>${stockStatus}</td>
                <td><button class="btn-edit" onclick="editExistencia(${e.id}, '${e.producto?.descripcion || ''}', ${e.claveProducto}, ${e.existencia}, ${e.porEntregar || 0})">Actualizar</button></td>
            </tr>
        `;
    }).join('');
}

function filtrarExistencias() {
    const filtro = document.getElementById('filtroExistencia').value.toLowerCase();
    const sucursal = document.getElementById('filtroSucursalExistencia').value;
    
    let filtered = existenciasData;
    if (filtro) {
        filtered = filtered.filter(e => e.producto?.descripcion?.toLowerCase().includes(filtro));
    }
    if (sucursal) {
        filtered = filtered.filter(e => e.idSucursal == sucursal);
    }
    displayExistencias(filtered);
}

async function loadLotesByProducto(claveProducto) {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/lotes/${claveProducto}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            displayLotes(data.data);
        }
    } catch (error) {
        showToast('Error al cargar lotes', 'error');
    }
}

function displayLotes(lotes) {
    const tbody = document.getElementById('lotesTableBody');
    if (!lotes || lotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No hay lotes para este producto</td></tr>';
        return;
    }
    
    tbody.innerHTML = lotes.map(l => {
        let estadoBadge = '';
        if (l.estado === 'vencido') estadoBadge = '<span class="badge badge-vencido">Vencido</span>';
        else if (l.estado === 'warning') estadoBadge = '<span class="badge badge-warning">Por vencer</span>';
        else estadoBadge = '<span class="badge badge-good">Vigente</span>';
        
        return `
            <tr>
                <td>${l.idLote}</td>
                <td>${l.lote}</td>
                <td>${l.existencia}</td>
                <td>${new Date(l.caducidad).toLocaleDateString()}</td>
                <td>${l.diasRestantes}</td>
                <td>${estadoBadge}</td>
                <td><button class="btn-delete" onclick="deleteLote(${l.idLote}, '${l.lote}')">Eliminar</button></td>
            </tr>
        `;
    }).join('');
}

async function loadResumen() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/resumen`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalProductos').textContent = data.data.resumen.totalProductos;
            document.getElementById('totalExistencia').textContent = data.data.resumen.totalExistencia;
            document.getElementById('valorInventario').textContent = `$${data.data.resumen.valorInventario.toFixed(2)}`;
            
            // Bajo stock
            const bajoStockTbody = document.getElementById('bajoStockTableBody');
            bajoStockTbody.innerHTML = data.data.productosBajoStock.map(p => `
                <tr><td>${p.descripcion}</td><td>${p.existencia}</td><td>${p.minStock}</td></tr>
            `).join('');
            
            // Lotes por vencer
            const lotesVencerTbody = document.getElementById('lotesVencerTableBody');
            lotesVencerTbody.innerHTML = data.data.lotesPorVencer.map(l => `
                <tr><td>${l.producto?.descripcion || 'N/A'}</td><td>${l.lote}</td><td>${new Date(l.caducidad).toLocaleDateString()}</td><td>${Math.ceil((new Date(l.caducidad) - new Date()) / (1000*60*60*24))}</td></tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadProductosSelect() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('productoSelectLote');
            select.innerHTML = '<option value="">Seleccionar producto</option>' + 
                data.data.map(p => `<option value="${p.claveProducto}">${p.claveProducto} - ${p.descripcion}</option>`).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== CRUD PRODUCTOS ====================
function openProductoModal(producto = null) {
    const modal = document.getElementById('productoModal');
    const title = document.getElementById('productoModalTitle');
    
    if (producto) {
        title.textContent = 'Editar Producto';
        document.getElementById('productoId').value = producto.idProducto;
        document.getElementById('prodClave').value = producto.claveProducto;
        document.getElementById('prodCodigoBarras').value = producto.codigoBarras;
        document.getElementById('prodSKU').value = producto.sKU;
        document.getElementById('prodSKUFabricante').value = producto.skuFabricante;
        document.getElementById('prodUpcEan').value = producto.upcEan;
        document.getElementById('prodUnidad').value = producto.unidad;
        document.getElementById('prodDescripcion').value = producto.descripcion;
        document.getElementById('prodPrecioVenta').value = producto.precioP;
        document.getElementById('prodCosto').value = producto.costoP;
        document.getElementById('prodUtilidad').value = producto.utilidad;
    } else {
        title.textContent = 'Nuevo Producto';
        document.getElementById('productoForm').reset();
        document.getElementById('productoId').value = '';
    }
    modal.style.display = 'block';
}

window.editProducto = async (idProducto) => {
    const producto = productosData.find(p => p.idProducto === idProducto);
    if (producto) openProductoModal(producto);
};

async function saveProducto(event) {
    event.preventDefault();
    const token = getToken();
    const id = document.getElementById('productoId').value;
    const productoData = {
        descripcion: document.getElementById('prodDescripcion').value,
        codigoBarras: document.getElementById('prodCodigoBarras').value,
        claveProducto: parseInt(document.getElementById('prodClave').value),
        sKU: document.getElementById('prodSKU').value,
        skuFabricante: document.getElementById('prodSKUFabricante').value,
        upcEan: document.getElementById('prodUpcEan').value,
        unidad: document.getElementById('prodUnidad').value,
        precioP: parseFloat(document.getElementById('prodPrecioVenta').value),
        costoP: parseFloat(document.getElementById('prodCosto').value),
        utilidad: parseInt(document.getElementById('prodUtilidad').value),
        idSucursal: 1,
        idEmpresa: 1,
        idUsuario: currentUser?.id || 1,
        idCategoria: 1
    };
    
    const url = id ? `${API_URL}/inventario/productos/${id}` : `${API_URL}/inventario/productos`;
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(productoData)
        });
        if (response.ok) {
            showToast(id ? 'Producto actualizado' : 'Producto creado', 'success');
            closeProductoModal();
            loadProductos();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

window.deleteProducto = (id, nombre) => {
    currentDeleteType = 'producto';
    currentDeleteId = id;
    document.getElementById('deleteMessage').textContent = `¿Eliminar producto "${nombre}"?`;
    document.getElementById('deleteModal').style.display = 'block';
};

// ==================== CRUD EXISTENCIAS ====================
window.editExistencia = (id, producto, clave, existencia, porEntregar) => {
    document.getElementById('existenciaId').value = id;
    document.getElementById('existenciaProducto').value = producto;
    document.getElementById('existenciaClave').value = clave;
    document.getElementById('existenciaCantidad').value = existencia;
    document.getElementById('existenciaPorEntregar').value = porEntregar;
    document.getElementById('existenciaModal').style.display = 'block';
};

async function saveExistencia(event) {
    event.preventDefault();
    const token = getToken();
    const id = document.getElementById('existenciaId').value;
    
    try {
        const response = await fetch(`${API_URL}/inventario/existencias/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                existencia: parseInt(document.getElementById('existenciaCantidad').value),
                porEntregar: parseInt(document.getElementById('existenciaPorEntregar').value)
            })
        });
        if (response.ok) {
            showToast('Existencia actualizada', 'success');
            closeExistenciaModal();
            loadExistencias();
        }
    } catch (error) {
        showToast('Error al actualizar', 'error');
    }
}

// ==================== CRUD LOTES ====================
function openLoteModal() {
    const loteModalOP = document.getElementById('loteModal');
    const productoSelect = document.getElementById('productoSelectLote');
    const selectedProducto = productoSelect.value;
    
    if (!selectedProducto) {
        showToast('Seleccione un producto primero', 'error');
        return;
    }
    
    const producto = productosData.find(p => p.claveProducto == selectedProducto);
    if (producto) {
        document.getElementById('loteClaveProducto').value = producto.claveProducto;
        document.getElementById('loteProductoNombre').value = producto.descripcion;
        document.getElementById('loteCodigoBarras').value = producto.codigoBarras;
    }
    else{
        document.getElementById('loteForm').reset();
        document.getElementById('loteModalTitle').textContent = 'Agregar Lote';
        document.getElementById('loteId').value = '';
    }
    loteModalOP.style.display = 'block';
}

async function saveLote(event) {
    event.preventDefault();
    const token = getToken();
    const loteData = {
        idSucursal: parseInt(document.getElementById('loteSucursal').value),
        claveProducto: parseInt(document.getElementById('loteClaveProducto').value),
        lote: document.getElementById('loteNumero').value,
        caducidad: document.getElementById('loteCaducidad').value,
        existencia: parseInt(document.getElementById('loteCantidad').value),
        recibidos: parseInt(document.getElementById('loteRecibidos').value) || parseInt(document.getElementById('loteCantidad').value),
        codigoBarras: document.getElementById('loteCodigoBarras').value
    };
    
    try {
        const response = await fetch(`${API_URL}/inventario/lotes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(loteData)
        });
        if (response.ok) {
            showToast('Lote agregado correctamente', 'success');
            closeLoteModal();
            loadLotesByProducto(loteData.claveProducto);
            loadExistencias();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

window.deleteLote = (id, lote) => {
    currentDeleteType = 'lote';
    currentDeleteId = id;
    document.getElementById('deleteMessage').textContent = `¿Eliminar lote "${lote}"? Se descontará la existencia.`;
    document.getElementById('deleteModal').style.display = 'block';
};

// ==================== ELIMINACIÓN ====================
async function confirmDelete() {
    const token = getToken();
    let url = '';
    
    if (currentDeleteType === 'producto') {
        url = `${API_URL}/inventario/productos/${currentDeleteId}`;
    } else if (currentDeleteType === 'lote') {
        url = `${API_URL}/inventario/lotes/${currentDeleteId}`;
    }
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            showToast('Eliminado correctamente', 'success');
            closeDeleteModal();
            if (currentDeleteType === 'producto') loadProductos();
            if (currentDeleteType === 'lote') {
                loadExistencias();
                const selected = document.getElementById('productoSelectLote').value;
                if (selected) loadLotesByProducto(selected);
            }
        } else {
            showToast('Error al eliminar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

// ==================== MODALES ====================
function setupModals() {
    // Cerrar modales
    document.querySelectorAll('.close-producto, #cancelProductoBtn').forEach(btn => {
        btn?.addEventListener('click', closeProductoModal);
    });
    document.querySelectorAll('.close-existencia, #cancelExistenciaBtn').forEach(btn => {
        btn?.addEventListener('click', closeExistenciaModal);
    });
    document.querySelectorAll('.close-lote, #cancelLoteBtn').forEach(btn => {
        btn?.addEventListener('click', closeLoteModal);
    });
    document.querySelectorAll('.close-delete, #cancelDeleteBtn').forEach(btn => {
        btn?.addEventListener('click', closeDeleteModal);
    });
    
    // Cerrar al hacer clic fuera
    window.onclick = (event) => {
        if (event.target === document.getElementById('productoModal')) closeProductoModal();
        if (event.target === document.getElementById('existenciaModal')) closeExistenciaModal();
        if (event.target === document.getElementById('loteModal')) closeLoteModal();
        if (event.target === document.getElementById('deleteModal')) closeDeleteModal();
    };
}

function closeProductoModal() {
    document.getElementById('productoModal').style.display = 'none';
    document.getElementById('productoForm').reset();
}
function closeExistenciaModal() {
    document.getElementById('existenciaModal').style.display = 'none';
}
function closeLoteModal() {
    document.getElementById('loteModal').style.display = 'none';
    document.getElementById('loteForm').reset();
}
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteType = null;
    currentDeleteId = null;
}

// Inicializar
if (document.getElementById('showInventarioBtn')) {
    if (currentUserRole !== 'admin') {
        showToast('No tienes permisos para acceder a esta página', 'error');
        setTimeout(async () => {
            await loadPage('dashboard');
        }, 1500);
    }
    initDashboard();
}