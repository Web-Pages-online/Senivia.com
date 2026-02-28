let cart = [];
let total = 0;
let tempItem = null;

// SUGERENCIAS DE MARKETING
const recommendations = [
  { name: "Queso Fundido", price: 100 },
  { name: "Dedo de Queso", price: 120 },
  { name: "Tacos", price: 23 },
  { name: "Refresco", price: 25 },
];

// ADEREZOS Y SALSAS POR TIPO
const addonConfig = {
  hamburguesa: ["Catsup", "Mayonesa", "Mostaza"],
  taco: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema"],
};

// 1. Personalizador Inteligente
function openCustomizer(name, price, ingredients, type = "general") {
  tempItem = { name, price, ingredients, type };
  document.getElementById("modal-title").innerText = name;

  const list = document.getElementById("ingredients-list");
  list.innerHTML =
    '<p style="font-weight:700; font-size:14px; margin-bottom:10px;">Ingredientes:</p>';

  ingredients.forEach((ing) => {
    list.appendChild(createItemRow(ing, "ing-checkbox", true));
  });

  const extrasContainer = document.getElementById("extras-container");
  const extrasList = document.getElementById("extras-list");
  extrasList.innerHTML = "";

  if (addonConfig[type]) {
    extrasContainer.style.display = "block";
    addonConfig[type].forEach((extra) => {
      extrasList.appendChild(createItemRow(extra, "extra-checkbox", false));
    });
  } else {
    extrasContainer.style.display = "none";
  }

  document.getElementById("modal-custom").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function createItemRow(text, className, isChecked) {
  const div = document.createElement("div");
  div.className = "ingredient-item";
  div.onclick = function () {
    const cb = this.querySelector("input");
    cb.checked = !cb.checked;
  };
  div.innerHTML = `
        <label>${text}</label>
        <input type="checkbox" ${isChecked ? "checked" : ""} value="${text}" class="${className}" onclick="event.stopPropagation()">
    `;
  return div;
}

function closeModal() {
  document.getElementById("modal-custom").style.display = "none";
  document.body.style.overflow = "auto";
}

function confirmCustomization() {
  const ingCB = document.querySelectorAll(".ing-checkbox");
  let removed = [];
  ingCB.forEach((cb) => {
    if (!cb.checked) removed.push(cb.value);
  });

  const extraCB = document.querySelectorAll(".extra-checkbox");
  let selectedExtras = [];
  extraCB.forEach((cb) => {
    if (cb.checked) selectedExtras.push(cb.value);
  });

  let details = "";
  if (removed.length > 0) details += `SIN: ${removed.join(", ")}. `;
  if (selectedExtras.length > 0)
    details += `CON: ${selectedExtras.join(", ")}.`;

  add(tempItem.name, tempItem.price, details);
  closeModal();
}

// 2. Sistema de Carrito (CRUD)
function add(item, price, details = "") {
  cart.push({ item, price, details });
  total += price;
  updateCartUI();
}

function removeItem(index) {
  total -= cart[index].price;
  cart.splice(index, 1);
  if (cart.length === 0) {
    closeCheckout();
    document.getElementById("cart-bar").style.display = "none";
  } else {
    renderCheckout();
    updateCartUI();
  }
}

function updateCartUI() {
  const cartBar = document.getElementById("cart-bar");
  if (cart.length > 0) {
    cartBar.style.display = "flex";
    document.getElementById("cart-count").innerText = cart.length;
    document.getElementById("cart-total").innerText = `$${total}`;
  }
}

// 3. Checkout y Marketing
function openCheckout() {
  renderCheckout();
  renderMarketing();
  checkStoreStatus();
  document.getElementById("modal-checkout").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  document.getElementById("modal-checkout").style.display = "none";
  document.body.style.overflow = "auto";
}

function renderCheckout() {
  const list = document.getElementById("checkout-list");
  list.innerHTML = "";
  cart.forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
            <div class="checkout-item-info">
                <b>${product.item}</b>
                <p>${product.details || "$" + product.price}</p>
            </div>
            <button class="remove-btn" onclick="removeItem(${index})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
    list.appendChild(div);
  });
}

function renderMarketing() {
  const list = document.getElementById("marketing-list");
  list.innerHTML = "";
  const suggestions = recommendations.filter(
    (r) => !cart.some((c) => c.item === r.name),
  );
  suggestions.forEach((item) => {
    const div = document.createElement("div");
    div.className = "marketing-card";
    div.innerHTML = `
            <b>${item.name}</b>
            <span>$${item.price}</span>
            <button class="mini-add" onclick="add('${item.name}', ${item.price}); renderCheckout(); renderMarketing();">Añadir</button>
        `;
    list.appendChild(div);
  });
}

// --- MEJORA: VERIFICAR SI ESTÁ ABIERTO ---
function checkStoreStatus() {
  const now = new Date();
  const hour = now.getHours();
  const btnContainer = document.querySelector(".whatsapp-final-btn");
  const btnText = btnContainer.querySelector("span");

  // Horario: 19 (7 PM) a 23 (11 PM)
  if (hour >= 19 && hour < 23) {
    btnText.innerText = "Confirmar en WhatsApp";
    btnContainer.style.background = "#25d366";
    btnContainer.onclick = sendOrder;
    return true;
  } else {
    btnText.innerText = "Local Cerrado (Ver Horarios)";
    btnContainer.style.background = "#999";
    btnContainer.onclick = function () {
      closeCheckout();
      openHours();
    };
    return false;
  }
}

// --- MEJORA: EFECTO DE ÉXITO (CONFETI) ---
function launchSuccess() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6d4c41", "#2d6a4f", "#25d366"],
  });
}

// 4. WhatsApp Final (Actualizado con Confeti y Horario)
function sendOrder() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19 || hour >= 23) {
    alert("Lo sentimos, el local está cerrado. Consulta nuestros horarios.");
    return;
  }

  launchSuccess(); 

  setTimeout(() => {
    const phone = "529991505132";
    const deliveryType = document.querySelector(
      'input[name="delivery-type"]:checked',
    ).value;
    const address = document.getElementById("order-address").value;
    const notes = document.getElementById("order-notes").value;

    let msg = `*NUEVO PEDIDO: ${deliveryType.toUpperCase()}* 🔥\n`;
    msg += "--------------------------\n";
    cart.forEach((i) => {
      msg += `• *${i.item}*\n  _${i.details}_\n  $${i.price}\n\n`;
    });
    if (deliveryType === "A domicilio") msg += `📍 *Dirección:* ${address}\n`;
    if (notes) msg += `📝 *Notas:* ${notes}\n`;
    msg += `--------------------------\n*TOTAL: $${total}* 💰`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }, 800);
}

function toggleAddressField(show) {
  document.getElementById("address-section").style.display = show
    ? "block"
    : "none";
}

// 5. Otros
function openLightbox(src) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = src;
  lb.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
  document.body.style.overflow = "auto";
}
function openHours() {
  document.getElementById("modal-hours").style.display = "flex";
}
function closeHours() {
  document.getElementById("modal-hours").style.display = "none";
}

window.onclick = function (event) {
  const mC = document.getElementById("modal-custom");
  const mH = document.getElementById("modal-hours");
  const mK = document.getElementById("modal-checkout");
  const lb = document.getElementById("lightbox");
  if (event.target == mC) closeModal();
  if (event.target == mH) closeHours();
  if (event.target == mK) closeCheckout();
  if (event.target == lb) closeLightbox();
};
