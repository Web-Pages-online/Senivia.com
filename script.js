let cart = [];
let total = 0;
let tempItem = null;

// SUGERENCIAS PARA EL MARKETING
const recommendations = [
  { name: "Queso Fundido", price: 100 },
  { name: "Dedo de Queso", price: 120 },
  { name: "Tacos", price: 23 },
  { name: "Refresco", price: 25 },
];

// 1. Personalizador de Hamburguesas
function openCustomizer(name, price, ingredients) {
  tempItem = { name, price, ingredients };
  document.getElementById("modal-title").innerText = name;

  const list = document.getElementById("ingredients-list");
  list.innerHTML = "";

  ingredients.forEach((ing) => {
    const div = document.createElement("div");
    div.className = "ingredient-item";
    div.onclick = function () {
      const cb = this.querySelector("input");
      cb.checked = !cb.checked;
    };
    div.innerHTML = `
            <label>${ing}</label>
            <input type="checkbox" checked value="${ing}" class="ing-checkbox" onclick="event.stopPropagation()">
        `;
    list.appendChild(div);
  });

  document.getElementById("modal-custom").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modal-custom").style.display = "none";
  document.body.style.overflow = "auto";
}

function confirmCustomization() {
  const checkboxes = document.querySelectorAll(".ing-checkbox");
  let removed = [];
  checkboxes.forEach((cb) => {
    if (!cb.checked) removed.push(cb.value);
  });

  let finalName = tempItem.name;
  let details = removed.length > 0 ? `(SIN: ${removed.join(", ")})` : "";

  add(finalName, tempItem.price, details);
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

// 3. Sistema de Checkout y Marketing
function openCheckout() {
  renderCheckout();
  renderMarketing();
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

  // Filtramos para no sugerir algo que ya está en el carrito
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

// 4. WhatsApp
function sendOrder() {
  const phone = "529991505132";
  let msg = "*PEDIDO SENIVIA* 🔥\n--------------------------\n";
  cart.forEach((i, idx) => {
    msg += `• *${i.item}* ${i.details} - $${i.price}\n`;
  });
  msg += `\n--------------------------\n*TOTAL A PAGAR: $${total}* 💰`;
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
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
