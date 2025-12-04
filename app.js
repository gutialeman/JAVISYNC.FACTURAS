// --- CONFIGURACIÓN GLOBAL ---
const IVA_RATE = 0.15;
let productsList = [];
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

class Producto {
    constructor(nombre, cantidad, precio) {
        this.nombre = nombre;
        this.cantidad = parseFloat(cantidad);
        this.precioUnitario = parseFloat(precio);
        this.total = this.cantidad * this.precioUnitario;
    }
}

// *******************************************************************
// 1. LÓGICA DE AUTENTICACIÓN
// *******************************************************************

function checkAuthentication() {
    if (window.location.pathname.endsWith('facturacion.html') &&
        sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

function handleLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('login-error');

        // Credenciales de prueba
        if (username === 'admin' && password === '123') {
            sessionStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'facturacion.html';
        } else {
            errorMsg.textContent = 'Usuario o contraseña incorrectos.';
            errorMsg.style.display = 'block';
        }
    });
}

function handleLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
}

// *******************************************************************
// 2. LÓGICA DE FACTURACIÓN
// *******************************************************************

function recalculateSummary() {
    let subtotal = productsList.reduce((sum, item) => sum + item.total, 0);
    let iva = subtotal * IVA_RATE;
    let total = subtotal + iva;

    document.getElementById('subtotal-val').textContent = formatter.format(subtotal);
    document.getElementById('iva-val').textContent = formatter.format(iva);
    document.getElementById('total-val').textContent = formatter.format(total);
}

function renderProductDetail() {
    const tableBody = document.getElementById('products-detail');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    productsList.forEach((product, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${product.nombre}</td>
            <td>${product.cantidad}</td>
            <td>${formatter.format(product.precioUnitario)}</td>
            <td>${formatter.format(product.total)}</td>
            <td><button class="btn-remove" data-index="${index}">X</button></td>
        `;
    });

    recalculateSummary();

    document.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', removeProduct);
    });
}

function handleAddProduct() {
    const btn = document.getElementById('add-product-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const nombre = document.getElementById('prodNombre').value.trim();
        const cantidad = document.getElementById('prodCantidad').value;
        const precio = document.getElementById('prodPrecio').value;

        if (nombre && cantidad > 0 && precio > 0) {
            productsList.push(new Producto(nombre, cantidad, precio));
            renderProductDetail();

            document.getElementById('prodNombre').value = '';
            document.getElementById('prodCantidad').value = '1';
            document.getElementById('prodPrecio').value = '0.00';
            document.getElementById('prodNombre').focus();
        } else {
            alert('Por favor, introduce datos válidos para el producto.');
        }
    });
}

function removeProduct(event) {
    const index = event.target.getAttribute('data-index');
    if (index !== null) {
        productsList.splice(parseInt(index), 1);
        renderProductDetail();
    }
}

function handlePrintInvoice() {
    const printBtn = document.getElementById('print-invoice-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            alert('Imprimiendo Factura... (Simulación)');
        });
    }
}

// *******************************************************************
// 3. EFECTO DE MOUSE Y ANIMACIONES
// *******************************************************************

function setupMouseInteraction(cardId) {
    const card = document.getElementById(cardId);
    const interactionArea = document.querySelector('.login-body-content');

    if (!interactionArea || !card) return;

    interactionArea.onmousemove = (e) => {
        if (card.classList.contains('hidden')) return;

        const rect = interactionArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        const intensity = 70;
        const rotateX = deltaY / intensity;
        const rotateY = -deltaX / intensity;

        card.style.transform =
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

        const shadowX = -deltaY / 30;
        const shadowY = deltaX / 30;

        card.style.boxShadow =
            `${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.6), 0 0 10px rgba(0,170,255,0.5)`;
    };

    interactionArea.onmouseleave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.boxShadow =
            '0 10px 30px rgba(0,0,0,0.5), 0 0 10px rgba(0,170,255,0.5)';
    };
}

function handleWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const showLoginBtn = document.getElementById('show-login-btn');
    const loginFormContainer = document.getElementById('login-container');

    if (!showLoginBtn || !welcomeScreen || !loginFormContainer) return;

    setupMouseInteraction('welcome-screen');

    showLoginBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');

        setTimeout(() => {
            loginFormContainer.classList.remove('hidden');
            setupMouseInteraction('login-container');
        }, 300);
    });
}

// *******************************************************************
// 4. REGISTRO DE USUARIOS (FUNCIONAL)
// *******************************************************************

function handleRegister() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const pass = document.getElementById('reg-pass').value;

        if (!name || !email || !pass) {
            alert('Por favor completa todos los campos.');
            return;
        }

        let users = JSON.parse(localStorage.getItem('users') || '[]');

        if (users.some(u => u.email === email)) {
            alert('Ya existe una cuenta con ese correo.');
            return;
        }

        users.push({ name, email, password: pass });
        localStorage.setItem('users', JSON.stringify(users));

        registerForm.reset();
        document.getElementById('register-container').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');

        const userField = document.getElementById('username');
        if (userField) {
            userField.value = email;
            userField.focus();
        }

        alert('Registro exitoso. Ahora inicia sesión.');
    });
}

// *******************************************************************
// 5. INICIALIZACIÓN
// *******************************************************************

document.addEventListener('DOMContentLoaded', () => {

    checkAuthentication();

    // Página de LOGIN
    if (document.querySelector('.login-body-content')) {

        handleWelcomeScreen();
        handleLogin();
        handleRegister();

        // Botón para abrir el registro
        const showReg = document.getElementById("show-register-btn");
        if (showReg) {
            showReg.addEventListener("click", () => {
                document.getElementById("welcome-screen").classList.add("hidden");
                document.getElementById("login-container").classList.add("hidden");
                document.getElementById("register-container").classList.remove("hidden");
            });
        }

        // Botón cerrar registro
        const closeReg = document.getElementById("close-register");
        if (closeReg) {
            closeReg.addEventListener("click", () => {
                document.getElementById("register-container").classList.add("hidden");
                document.getElementById("welcome-screen").classList.remove("hidden");
            });
        }
    }

    // Página de FACTURACIÓN
    else if (document.getElementById('products-detail')) {

        document.getElementById('fechaEmision').valueAsDate = new Date();
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        document.getElementById('numFactura').value = `001-2025-${randomNum}`;

        handleAddProduct();
        handlePrintInvoice();
        handleLogout();
        renderProductDetail();
    }
});
