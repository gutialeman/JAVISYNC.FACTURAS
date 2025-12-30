/* --- CONFIGURACIÓN GLOBAL --- */
const IVA_RATE = 0.15;
let productsList = [];
let invoiceCounter = 1; // contador de facturas automático
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

/* --- CONSTANTES DEL BACKEND --- */
const API_BASE_URL = 'http://localhost:3000';

/* --- MODELO --- */
class Producto {
    constructor(nombre, cantidad, precio) {
        this.nombre = nombre;
        this.cantidad = parseFloat(cantidad) || 0;
        this.precioUnitario = parseFloat(precio) || 0;
        this.total = this.cantidad * this.precioUnitario;
    }
}

/* ===============================
    1. AUTENTICACIÓN (LOGIN / LOGOUT)
    =============================== */
function checkAuthentication() {
    if (window.location.pathname.includes('facturacion.html') &&
        sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

function handleLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = (document.getElementById('username')?.value || '').trim();
        const password = (document.getElementById('password')?.value || '').trim();
        const errorMsg = document.getElementById('login-error');

        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }

        if (!username || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Por favor, completa todos los campos.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            // Nota: En un entorno de producción, la API Key iría en un header o body.
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_empresa: username, password: password })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userName', data.nombre_empresa || username);
                window.location.href = 'facturacion.html';
            } else {
                if (errorMsg) {
                    errorMsg.textContent = data.error || 'Usuario o contraseña incorrectos.';
                    errorMsg.style.display = 'block';
                } else {
                    // Usar modal en lugar de alert en el futuro
                    console.error(data.error || 'Usuario o contraseña incorrectos.');
                }
            }
        } catch (err) {
            console.error('Error conexión:', err);
            if (errorMsg) {
                errorMsg.textContent = 'Error al conectar con el servidor.';
                errorMsg.style.display = 'block';
            } else {
                 // Usar modal en lugar de alert en el futuro
                console.error('Error al conectar con el servidor.');
            }
        }
    });
}

function handleLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
}

/* ===============================
    2. LÓGICA DE FACTURACIÓN
    =============================== */
function recalculateSummary() {
    const subtotal = productsList.reduce((sum, p) => sum + (p.total || 0), 0);
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    const subtotalEl = document.getElementById('subtotal-val');
    const ivaEl = document.getElementById('iva-val');
    const totalEl = document.getElementById('total-val');

    if (subtotalEl) subtotalEl.textContent = formatter.format(subtotal);
    if (ivaEl) ivaEl.textContent = formatter.format(iva);
    if (totalEl) totalEl.textContent = formatter.format(total);
}

function renderProductDetail() {
    const tableBody = document.getElementById('products-detail');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    productsList.forEach((p, i) => {
        const row = tableBody.insertRow();
        const cellNombre = row.insertCell();
        const cellCant = row.insertCell();
        const cellPU = row.insertCell();
        const cellTotal = row.insertCell();
        const cellAcc = row.insertCell();

        cellNombre.textContent = p.nombre;
        cellCant.textContent = p.cantidad;
        cellPU.textContent = formatter.format(p.precioUnitario);
        cellTotal.textContent = formatter.format(p.total);
        cellAcc.innerHTML = `<button class="btn-remove" data-index="${i}" aria-label="Eliminar producto ${p.nombre}">X</button>`;
    });

    recalculateSummary();

    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.onclick = removeProduct;
    });
}

function handleAddProduct() {
    const btn = document.getElementById('add-product-btn');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const nombre = (document.getElementById('prodNombre')?.value || '').trim();
        const cantidad = parseFloat(document.getElementById('prodCantidad')?.value) || 0;
        const precio = parseFloat(document.getElementById('prodPrecio')?.value) || 0;

        if (!nombre || cantidad <= 0 || precio <= 0) {
            // Usar modal en lugar de alert en el futuro
            console.warn('Por favor ingresa nombre, cantidad (>0) y precio (>0).');
            return;
        }

        productsList.push(new Producto(nombre, cantidad, precio));
        renderProductDetail();

        document.getElementById('prodNombre').value = '';
        document.getElementById('prodCantidad').value = '1';
        document.getElementById('prodPrecio').value = '0.00';
        document.getElementById('prodNombre').focus();
    });
}

function removeProduct(evt) {
    const index = Number(evt.target?.dataset?.index);
    if (!Number.isNaN(index)) {
        productsList.splice(index, 1);
        renderProductDetail();
    }
}

function handleSaveInvoice() {
    const saveBtn = document.getElementById('save-invoice-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Usar modal en lugar de alert en el futuro
        console.log('Factura guardada con éxito');

        const numFacturaEl = document.getElementById('numFactura');
        if (numFacturaEl) {
            invoiceCounter++;
            numFacturaEl.value = invoiceCounter;
        }

        document.getElementById('vendedorNombre').value = "";
        document.getElementById('vendedorCargo').value = "";
        document.getElementById('nombreCliente').value = "";
        document.getElementById('identificacion').value = "";
        document.getElementById('prodNombre').value = "";
        document.getElementById('prodCantidad').value = "1";
        document.getElementById('prodPrecio').value = "0.00";

        productsList = [];
        renderProductDetail();

        const fechaEl = document.getElementById('fechaEmision');
        if (fechaEl) fechaEl.valueAsDate = new Date();
    });
}

function handlePrintInvoice() {
    const printBtn = document.getElementById('print-invoice-btn');
    if (!printBtn) return;
    printBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
    });
}

/* ===============================
    3. UTILIDADES DE LOGIN
    =============================== */

/**
 * Muestra una tarjeta específica y oculta las demás.
 * @param {string} targetId - ID de la tarjeta a mostrar ('welcome-screen', 'login-container', 'register-container').
 */
function showCard(targetId) {
    const welcomeScreen = document.getElementById('welcome-screen');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    [welcomeScreen, loginContainer, registerContainer].forEach(card => {
        if (card) card.classList.add('hidden');
    });
    
    setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) targetElement.classList.remove('hidden');
    }, 10);
}

/**
 * Vuelve a la pantalla de bienvenida.
 * Usado por los botones ATRÁS en Login y Cancelar en Registro.
 */
function irAtras() {
    showCard('welcome-screen');
}

/**
 * Toggle la visibilidad de un campo de contraseña.
 * @param {Event} event - Evento de click.
 */
function togglePassword(event) {
    const targetId = event.target.getAttribute('data-target');
    const input = document.getElementById(targetId);

    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
            event.target.textContent = '🙈'; // Ocultar
        } else {
            input.type = 'password';
            event.target.textContent = '👁️'; // Mostrar
        }
    }
}


/* ===============================
    4. REGISTRO DE USUARIOS
    =============================== */
function handleRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('reg-name')?.value || '').trim();
        const pass = (document.getElementById('reg-pass')?.value || '').trim();

        if (!name || !pass) {
            // Usar modal en lugar de alert en el futuro
            console.warn('Completa todos los campos.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_empresa: name, password: pass })
            });

            const data = await response.json();

            if (!response.ok) {
                // Usar modal en lugar de alert en el futuro
                console.error(`Error en registro: ${data.error || 'El nombre ya está en uso.'}`);
                return;
            }

            // Usar modal en lugar de alert en el futuro
            console.log('Registro exitoso. Ya podés iniciar sesión.');
            form.reset();

            showCard('login-container');
            const userField = document.getElementById('username');
            if (userField) {
                userField.value = name;
                userField.focus();
            }
        } catch (err) {
            console.error('Error registrar:', err);
             // Usar modal en lugar de alert en el futuro
            console.error('No se pudo conectar con el servidor.');
        }
    });
}


/* ===============================
    5. HORA AUTOMÁTICA EN EMPLEADO
    =============================== */
function updateClock() {
  const hourEl = document.getElementById('vendedorHora');
  if (!hourEl) return;

  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  hourEl.value = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
}

// Ejecuta cada segundo
setInterval(updateClock, 1000);
updateClock(); // Inicializa al cargar



/* ===============================
    6. INICIALIZACIÓN
    =============================== */
document.addEventListener('DOMContentLoaded', () => {
  // Pantallas principales
  const welcome = document.getElementById('welcome-screen');
  const login = document.getElementById('login-container');
  const register = document.getElementById('register-container');

  const showLoginBtn = document.getElementById('show-login-btn');
  const showRegisterBtn = document.getElementById('show-register-btn');

  // Menú de Ajustes
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const infoBtn = document.getElementById('info-btn');

  // Modales
  const infoModal = document.getElementById('info-modal');
  const recoveryModal = document.getElementById('recovery-modal');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // Cerrar modales (botones con .close-modal)
  const closeButtons = document.querySelectorAll('.close-modal');

  // Utilidades de visibilidad (consistentes)
  const showFlex = (el) => {
    el.classList.remove('hidden');
    el.style.display = 'flex';
  };

  const hideEl = (el) => {
    el.style.display = 'none';
    el.classList.add('hidden');
  };

  const showBlock = (el) => {
    el.classList.remove('hidden');
    el.style.display = 'block';
  };

  // Navegación: Bienvenida -> Login / Registro
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      welcome.classList.add('hidden');
      welcome.style.display = 'none';
      showBlock(login);
    });
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      welcome.classList.add('hidden');
      welcome.style.display = 'none';
      showBlock(register);
    });
  }

  // Función global irAtras (si la llamas desde HTML)
  window.irAtras = function () {
    hideEl(login);
    hideEl(register);
    showBlock(welcome);
  };

  // Menú de Ajustes (toggle)
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', () => {
      const visible = settingsMenu.style.display === 'flex';
      settingsMenu.style.display = visible ? 'none' : 'flex';
    });

    // Cerrar menú si se hace clic fuera
    document.addEventListener('click', (e) => {
      if (
        settingsMenu.style.display === 'flex' &&
        !settingsMenu.contains(e.target) &&
        e.target !== settingsBtn
      ) {
        settingsMenu.style.display = 'none';
      }
    });
  }

  // Abrir modal de Información
  if (infoBtn && infoModal) {
    infoBtn.addEventListener('click', () => showFlex(infoModal));
  }

  // Abrir modal de Recuperación
  if (forgotPasswordLink && recoveryModal) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showFlex(recoveryModal);
    });
  }

  // Cerrar modales con botones .close-modal
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) hideEl(modal);
    });
  });

  // Cerrar modal al hacer clic en overlay (fuera del contenido)
  [infoModal, recoveryModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideEl(modal);
    });
  });

  // Cerrar modales con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [infoModal, recoveryModal].forEach((modal) => {
        if (modal && modal.style.display === 'flex') hideEl(modal);
      });
      // También cierra el menú de ajustes
      if (settingsMenu && settingsMenu.style.display === 'flex') {
        settingsMenu.style.display = 'none';
      }
    }
  });

  // Toggle de visibilidad de contraseña (ojito)
document.querySelectorAll('.toggle-password').forEach((eye) => {
  const targetId = eye.getAttribute('data-target');
  const input = document.getElementById(targetId);
  if (!input) return;

  eye.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});
  });
    

    // --- Lógica de Facturación (si estamos en la pantalla de facturación) ---
    if (document.getElementById('products-detail')) {
        const fechaEl = document.getElementById('fechaEmision');
        if (fechaEl) fechaEl.valueAsDate = new Date();

        const empresaEl = document.getElementById('empresaSesion');
        if (empresaEl) empresaEl.value = sessionStorage.getItem('userName') || '';

        const numFacturaEl = document.getElementById('numFactura');
        if (numFacturaEl) numFacturaEl.value = invoiceCounter;

        handleAddProduct();
        handleSaveInvoice();
        handlePrintInvoice();
        handleLogout();

        renderProductDetail();
    }
    const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const settingsMenu = document.getElementById('settings-menu');

if (infoBtn && infoModal) {
  infoBtn.addEventListener('click', () => {
    // Oculta el menú de ajustes
    if (settingsMenu) settingsMenu.style.display = 'none';

    // Muestra el modal de información
    infoModal.classList.remove('hidden');
    infoModal.style.display = 'flex';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const user = document.getElementById('username')?.value.trim();
      const pass = document.getElementById('password')?.value.trim();

      // Validación básica
      if (!user || !pass) {
        alert("Por favor ingresa usuario y contraseña.");
        return;
      }

      // Aquí podrías validar contra tu backend o datos guardados
      // Si todo está correcto, redirige a la pantalla de facturación
      sessionStorage.setItem('userName', user);
      window.location.href = "facturacion.html";
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Regresa al login
      window.location.href = "login.html";
    });
  }
  document.getElementById('print-invoice-btn').addEventListener('click', () => {
  // Datos básicos
  document.getElementById('ticketFecha').textContent = document.getElementById('fechaEmision').value;
  document.getElementById('ticketHora').textContent = document.getElementById('vendedorHora').value;
  document.getElementById('ticketEmpresa').textContent = document.getElementById('empresaSesion').value;
  document.getElementById('ticketVendedor').textContent = document.getElementById('vendedorNombre').value;
  document.getElementById('ticketCliente').textContent = document.getElementById('nombreCliente').value;

  // Totales
  document.getElementById('ticketSubtotal').textContent = document.getElementById('subtotal-val').textContent;
  document.getElementById('ticketIVA').textContent = document.getElementById('iva-val').textContent;
  document.getElementById('ticketTotal').textContent = document.getElementById('total-val').textContent;

  // Productos
  const detalle = document.getElementById('products-detail').cloneNode(true);
  const ticketBody = document.getElementById('ticketProductos');
  ticketBody.innerHTML = '';
  detalle.querySelectorAll('tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      const tr = document.createElement('tr');
      for (let i = 0; i < 4; i++) {
        const td = document.createElement('td');
        td.textContent = cells[i].textContent;
        tr.appendChild(td);
      }
      ticketBody.appendChild(tr);
    }
  });

  // Imprimir
  window.print();
});
});
});





