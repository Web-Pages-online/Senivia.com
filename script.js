let cart = [];
let total = 0;
let tempItem = null;

// Abre el modal para hamburguesas
function openCustomizer(name, price, ingredients) {
    tempItem = { name, price, ingredients };
    document.getElementById('modal-title').innerText = name;
    const list = document.getElementById('ingredients-list');
    list.innerHTML = '';

    ingredients.forEach(ing => {
        list.innerHTML += `
            <div class="ingredient-row">
                <span>${ing}</span>
                <input type="checkbox" checked value="${ing}" class="ing-checkbox">
            </div>
        `;
    });

    document.getElementById('modal-custom').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-custom').style.display = 'none';
}

// Procesa la hamburguesa personalizada
function confirmCustomization() {
    const checkboxes = document.querySelectorAll('.ing-checkbox');
    let removed = [];
    
    checkboxes.forEach(cb => {
        if (!cb.checked) removed.push(cb.value);
    });

    let finalName = tempItem.name;
    if (removed.length > 0) {
        finalName += ` (Sin: ${removed.join(', ')})`;
    }

    add(finalName, tempItem.price);
    closeModal();
}

// Agrega cualquier item al carrito
function add(item, price) {
    cart.push({ item, price });
    total += price;
    updateCartUI();
}

function updateCartUI() {
    const cartBar = document.getElementById('cart-bar');
    cartBar.style.display = 'flex';
    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('cart-total').innerText = `$${total}`;
}

function sendOrder() {
    const phone = "529991505132";
    let msg = "¡Hola Senivia! 🍔🌮\nQuisiera hacer un pedido:\n\n";
    cart.forEach((i, idx) => {
        msg += `${idx + 1}. ${i.item} ($${i.price})\n`;
    });
    msg += `\n*Total: $${total}*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openHours() {
    document.getElementById('modal-hours').style.display = 'flex';
}

function closeHours() {
    document.getElementById('modal-hours').style.display = 'none';
}

// Cierra modales si se hace clic fuera de la caja blanca
window.onclick = function(event) {
    const modalCustom = document.getElementById('modal-custom');
    const modalHours = document.getElementById('modal-hours');
    if (event.target == modalCustom) closeModal();
    if (event.target == modalHours) closeHours();
}