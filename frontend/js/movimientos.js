// ==================== INICIALIZACIÓN ====================
async function initMovimientos() {
    await loadUserData();
    await loadResumenMovimientos();
    await loadMovimientos();
    await loadProductosParaSelect();
    setupEventListeners();
}

async function loadUserData() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function setupEventListeners() {
    const showDashboardBtn = document.getElementById('showDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    // Botones de navegación
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
    
    // Botones de movimientos
    document.getElementById('nuevoMovimientoBtn')?.addEventListener('click', openMovimientoModal);
    document.getElementById('buscarMovimientosBtn')?.addEventListener('click', filtrarMovimientos);
    document.getElementById('limpiarFiltrosBtn')?.addEventListener('click', limpiarFiltros);
    document.getElementById('volverListaBtn')?.addEventListener('click', mostrarListaMovimientos);
    document.getElementById('agregarProductoBtn')?.addEventListener('click', agregarProductoRow);
    
    // Modal movimiento
    document.getElementById('cancelMovimientoBtn')?.addEventListener('click', closeMovimientoModal);
    document.querySelector('.close-movimiento')?.addEventListener('click', closeMovimientoModal);
    document.getElementById('movimientoForm')?.addEventListener('submit', guardarMovimiento);
    
    // Modal delete
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
    document.querySelector('.close-delete')?.addEventListener('click', closeDeleteModal);
}

// ==================== CARGAR DATOS ====================
async function loadResumenMovimientos() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/movimientos/resumen`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('movimientosHoy').textContent = data.data.resumen.hoy;
            document.getElementById('movimientosSemana').textContent = data.data.resumen.semana;
            document.getElementById('movimientosMes').textContent = data.data.resumen.mes;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadMovimientos(filtros = {}) {
    const token = getToken();
    let url = `${API_URL}/movimientos`;
    const params = new URLSearchParams(filtros);
    if (params.toString()) url += `?${params.toString()}`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            movimientosData = data.data;
            displayMovimientos(movimientosData);
        }
    } catch (error) {
        showToast('Error al cargar movimientos', 'error');
    }
}

async function loadProductosParaSelect() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/inventario/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            productosDisponibles = data.data.filter(p => !p.delete);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== MOSTRAR DATOS ====================
function displayMovimientos(movimientos) {
    const tbody = document.getElementById('movimientosTableBody');
    if (!movimientos || movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-text">No hay movimientos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = movimientos.map(m => {
        const tipoClass = getTipoClass(m.tipoMovimiento);
        return `
            <tr>
                <td>${m.idmovimiento}</td>
                <td>${new Date(m.fecha).toLocaleString()}</td>
                <td><span class="badge ${tipoClass}">${m.tipoMovimiento}</span></td>
                <td>${escapeHtml(m.referencia)}</td>
                <td>-</td>
                <td>-</td>
                <td>${m.idUsuario}</td>
                <td>
                    <button class="btn-edit" onclick="verDetalleMovimiento(${m.idmovimiento})">Ver Detalle</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getTipoClass(tipo) {
    const tipos = {
        'ENTRADA': 'badge-entrada',
        'SALIDA': 'badge-salida',
        'TRASPASO': 'badge-traspaso',
        'AJUSTE': 'badge-ajuste',
        'DEVOLUCION': 'badge-devolucion'
    };
    return tipos[tipo] || 'badge';
}

// ==================== DETALLE MOVIMIENTO ====================
window.verDetalleMovimiento = async (id) => {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/movimientos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            mostrarDetalleMovimiento(data.data);
        } else {
            showToast('Error al cargar detalle', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
};

function mostrarDetalleMovimiento(movimiento) {
    // Información general
    document.getElementById('detalleId').textContent = movimiento.idmovimiento;
    document.getElementById('detalleFecha').textContent = new Date(movimiento.fecha).toLocaleString();
    document.getElementById('detalleTipo').textContent = movimiento.tipoMovimiento;
    document.getElementById('detalleTipo').className = `badge ${getTipoClass(movimiento.tipoMovimiento)}`;
    document.getElementById('detalleReferencia').textContent = movimiento.referencia;
    document.getElementById('detalleIdUsuario').textContent = movimiento.idUsuario;
    document.getElementById('detalleSucursal').textContent = movimiento.idSucursal;
    document.getElementById('detalleTotalProductos').textContent = movimiento.totalProductos || 0;
    document.getElementById('detalleValorTotal').textContent = `$${Number(movimiento.totalMovimiento || 0).toFixed(2)}`;
    
    // Detalle de productos
    const tbody = document.getElementById('detalleTableBody');
    if (!movimiento.detalles || movimiento.detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No hay productos en este movimiento</td></tr>';
    } else {
        tbody.innerHTML = movimiento.detalles.map(d => `
            <tr>
                <td>${d.idProducto}</td>
                <td>${d.claveProducto}</td>
                <td>${d.codigoBarras}</td>
                <td>${d.producto?.descripcion || 'N/A'}</td>
                <td>${d.cantidad}</td>
                <td>$${Number(d.producto?.precioP || 0).toFixed(2)}</td>
                <td>$${Number(d.subtotal || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    }
    
    // Mostrar vista de detalle
    document.getElementById('listaMovimientosView').style.display = 'none';
    document.getElementById('detalleMovimientoView').style.display = 'block';
}

function mostrarListaMovimientos() {
    document.getElementById('detalleMovimientoView').style.display = 'none';
    document.getElementById('listaMovimientosView').style.display = 'block';
    loadMovimientos();
}

// ==================== FILTROS ====================
function filtrarMovimientos() {
    const filtros = {
        tipoMovimiento: document.getElementById('filtroTipo').value,
        fechaInicio: document.getElementById('filtroFechaInicio').value,
        fechaFin: document.getElementById('filtroFechaFin').value
    };
    
    // Eliminar filtros vacíos
    Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
    });
    
    loadMovimientos(filtros);
}

function limpiarFiltros() {
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroFechaInicio').value = '';
    document.getElementById('filtroFechaFin').value = '';
    loadMovimientos();
}

// ==================== CRUD MOVIMIENTOS ====================
function openMovimientoModal() {
    document.getElementById('movimientoForm').reset();
    productosSeleccionados = [];
    document.getElementById('productosMovimiento').innerHTML = '';
    agregarProductoRow(); // Agregar primera fila
    document.getElementById('movimientoModal').style.display = 'block';
}

function agregarProductoRow() {
    const container = document.getElementById('productosMovimiento');
    const row = document.createElement('div');
    row.className = 'producto-row';
    row.innerHTML = `
        <div class="form-row">
            <div class="input-group">
                <label>Producto</label>
                <select class="producto-select" style="width: 100%">
                    <option value="">Seleccionar producto...</option>
                    ${productosDisponibles.map(p => `<option value="${p.idProducto}" data-clave="${p.claveProducto}" data-codigo="${p.codigoBarras}" data-precio="${p.precioP}">${p.descripcion} (${p.sKU})</option>`).join('')}
                </select>
            </div>
            <div class="input-group">
                <label>Cantidad</label>
                <input type="number" class="producto-cantidad" value="1" min="1">
            </div>
            <div class="input-group">
                <label>Acción</label>
                <button type="button" class="btn-remove-producto btn-danger" style="padding: 8px">Eliminar</button>
            </div>
        </div>
    `;
    
    row.querySelector('.btn-remove-producto').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

async function guardarMovimiento(event) {
    event.preventDefault();
    
    const token = getToken();
    const detalles = [];
    const rows = document.querySelectorAll('.producto-row');
    
    for (const row of rows) {
        const select = row.querySelector('.producto-select');
        const cantidad = row.querySelector('.producto-cantidad').value;
        
        if (select.value && cantidad > 0) {
            const option = select.options[select.selectedIndex];
            detalles.push({
                idProducto: parseInt(select.value),
                claveProducto: parseInt(option.dataset.clave),
                codigoBarras: option.dataset.codigo,
                cantidad: parseInt(cantidad),
                afectoInventario: true,
                stockRegister: 0
            });
        }
    }
    
    if (detalles.length === 0) {
        showToast('Agregue al menos un producto', 'error');
        return;
    }
    
    const movimientoData = {
        tipoMovimiento: document.getElementById('movTipo').value,
        referencia: document.getElementById('movReferencia').value,
        idSucursal: parseInt(document.getElementById('movSucursal').value),
        idUsuario: currentUser?.id || 1,
        idPedido: document.getElementById('movIdPedido').value ? parseInt(document.getElementById('movIdPedido').value) : null,
        detalles
    };
    
    try {
        const response = await fetch(`${API_URL}/movimientos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movimientoData)
        });
        
        if (response.ok) {
            showToast('Movimiento guardado correctamente', 'success');
            closeMovimientoModal();
            loadMovimientos();
            loadResumenMovimientos();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

function closeMovimientoModal() {
    document.getElementById('movimientoModal').style.display = 'none';
    document.getElementById('movimientoForm').reset();
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

// Inicializar
window.initMMovimientos = async function() {
    initMovimientos();
}