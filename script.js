let cart = [];
let total = 0;
let tempItem = null;
let currentQuantity = 1; // Usado en el modal de personalización

// SUGERENCIAS DE MARKETING (TODO EL MENÚ)
let recommendations = [];

// Función para recolectar dinámicamente el menú completo desde el HTML
function collectMenuForMarketing() {
  recommendations = []; // Limpiamos

  // 1. Recolectar de las tarjetas principales (Hamburguesas, Tacos, etc.)
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    // Buscar el botón 'add-btn' de la tarjeta (contiene la función onclick con los datos completos)
    const btn = card.querySelector('.add-btn');
    if (btn) {
      const onclickAttr = btn.getAttribute('onclick') || "";
      // Usamos [\s\S]* o [\s]* para atrapar saltos de línea, ya que el onclick está en múltiples líneas
      const match = onclickAttr.match(/openCustomizer\(\s*'([^']+)'\s*,\s*(\d+)/);

      if (match) {
        const name = match[1];
        const price = parseInt(match[2]);

        // En lugar de buscar al final de todo el onclick (que tiene saltos), buscamos el último parámetro en comillas
        // Ej: openCustomizer('Tacos', 23, ['...'], 'taco')
        const argsMatch = onclickAttr.match(/openCustomizer\([\s\S]*?,\s*'([^']+)'\s*\)/);
        const type = argsMatch ? argsMatch[1] : 'general';

        let img = "fa-utensils";
        if (type === 'hamburguesa') img = "fa-burger";
        else if (type === 'taco') img = "fa-utensils";

        // Formateamos para quitar saltos de línea excesivos y funcione en línea en el HTML resultante
        const cleanOnclick = onclickAttr.replace(/\s+/g, ' ').trim();

        recommendations.push({ name, price, type, img, originalOnclick: cleanOnclick });
      }
    }
  });

  // 2. Recolectar Extras
  const extras = document.querySelectorAll('.extra-item');
  extras.forEach(extra => {
    const onclickAttr = extra.getAttribute('onclick') || "";
    const match = onclickAttr.match(/add\(\s*'([^']+)'\s*,\s*(\d+)/);
    if (match) {
      const cleanOnclick = onclickAttr.replace(/\s+/g, ' ').trim();
      recommendations.push({
        name: match[1],
        price: parseInt(match[2]),
        type: 'extra',
        img: 'fa-cheese',
        originalOnclick: cleanOnclick
      });
    }
  });
}
const addonConfig = {
  hamburguesa: ["Catsup", "Mayonesa", "Mostaza", "Chile jalapeño"],
  taco: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro", "Tortilla de maíz", "Tortilla de harina"],
  tacoMaiz: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro"],
  tacoHarina: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro"],
  carneAsada: ["Cebolla picada", "Cilantro", "Tortillas de maíz", "Limón", "Salsa Roja", "Salsa Verde"],
  burrito: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro"],
  TortaN: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro"],
  TortaE: ["Salsa Roja", "Salsa Verde", "Cebolla picada", "Crema", "Cilantro"],
};

// 1. Personalizador Inteligente
function openCustomizer(name, price, ingredients, type = "general") {
  // BLOQUEO DE SEGURIDAD INTERNO
  if (!checkStoreStatus()) return;

  tempItem = { name, price, ingredients, type };
  currentQuantity = 1; // Reseteamos la cantidad a 1
  document.getElementById("modal-title").innerText = name;
  updateQuantityUI(); // Actualizamos el DOM de la cantidad

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
    handleExclusiveChoices(cb);
  };
  div.innerHTML = `
        <label>${text}</label>
        <input type="checkbox" ${isChecked ? "checked" : ""} value="${text}" class="${className}" onclick="event.stopPropagation(); handleExclusiveChoices(this)">
    `;
  return div;
}

// Lógica de Opciones Mutuamente Excluyentes (Radio Behaviour)
function handleExclusiveChoices(cb) {
  if (!cb.checked) return;

  // Lista de pares que NO pueden estar seleccionados al mismo tiempo
  const exclusivePairs = [
    ["Tortilla de maíz", "Tortilla de harina"]
    // Más adelante se pueden agregar otros como ["Salsa Verde", "Salsa Roja"] si se desea
  ];

  exclusivePairs.forEach(pair => {
    if (pair.includes(cb.value)) {
      const otherValue = pair.find(v => v !== cb.value);
      // Buscar si el "opuesto" está marcado y desmarcarlo
      const otherCb = document.querySelector(`input[value="${otherValue}"]`);
      if (otherCb && otherCb.checked) {
        otherCb.checked = false;

        // Efecto visual: hacemos un pequeño parpadeo al desmarcar para que el usuario se dé cuenta
        const otherDiv = otherCb.closest('.ingredient-item');
        if (otherDiv) {
          otherDiv.style.opacity = '0.5';
          setTimeout(() => otherDiv.style.opacity = '1', 300);
        }
      }
    }
  });
}

function closeModal() {
  document.getElementById("modal-custom").style.display = "none";
  document.body.style.overflow = "auto";
}

function changeQuantity(val) {
  currentQuantity += val;
  if (currentQuantity < 1) currentQuantity = 1; // Mínimo 1
  if (currentQuantity > 20) currentQuantity = 20; // Límite razonable
  updateQuantityUI();
}

function updateQuantityUI() {
  const qtyEl = document.getElementById("item-quantity");
  const priceTotalEl = document.getElementById("modal-price-total");

  if (qtyEl && tempItem) {
    qtyEl.innerText = currentQuantity;
    priceTotalEl.innerText = `$${tempItem.price * currentQuantity}`;
  }
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

  // Agregamos el producto 'N' veces según la cantidad elegida
  for (let i = 0; i < currentQuantity; i++) {
    add(tempItem.name, tempItem.price, details);
  }

  closeModal();
}

// 2. Sistema de Carrito (CRUD)
// Actualizamos para que `add` pueda opcionalmente recibir cantidad
function add(item, price, details = "", quantity = 1) {
  // BLOQUEO DE SEGURIDAD INTERNO
  if (!checkStoreStatus()) return;

  // Si intentan agregar múltiples desde un botón rápido externo (como extras rápidos)
  for (let i = 0; i < quantity; i++) {
    cart.push({ item, price, details });
    total += price;
  }
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
  // Filtramos para sugerir lo que NO tengan en el carrito ya
  const suggestions = recommendations.filter(
    (r) => !cart.some((c) => c.item === r.name),
  );
  suggestions.forEach((item) => {
    const div = document.createElement("div");
    div.className = "marketing-card";

    // Extraer argumentos del onclick original generado (si existe), sino fallback a add. 
    // Usamos regex solo para atrapar nombre y precio por si queremos forzar cantidad, 
    // pero como en marketing es "al clic", quantity default 1 está bien.
    const onclickAction = item.originalOnclick
      ? item.originalOnclick
      : `add('${item.name}', ${item.price}, '', 1)`;

    div.innerHTML = `
            <i class="fa-solid ${item.img}" style="color: var(--accent-orange); font-size: 20px; margin-bottom: 8px;"></i>
            <b>${item.name}</b>
            <span>$${item.price}</span>
            <button class="mini-add" onclick="closeCheckout(); setTimeout(() => { ${onclickAction}; }, 300);">Añadir</button>
        `;
    list.appendChild(div);
  });
}

// --- VERIFICACIÓN DE HORARIO Y BLOQUEO DE INTERACCIÓN ---
function checkStoreStatus() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado

  const btnContainer = document.querySelector(".whatsapp-final-btn");
  const btnText = btnContainer.querySelector("span");
  const lockModal = document.getElementById("modal-closed-lock");
  const appContainer = document.querySelector(".app-container");
  const addButtons = document.querySelectorAll(".add-btn");

  // Días que el negocio NO trabaja (0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb)
  // Ejemplo: Si está cerrado los Lunes y Martes, cambia esto a [1, 2]
  const diasCerrados = [2, 3];
  const esDiaCerrado = diasCerrados.includes(day);

  const minutes = now.getMinutes();

  // Horario: 6:30 PM (18:30) a 11:15 PM (23:15)
  const currentTimeInMinutes = hour * 60 + minutes;
  const openTimeInMinutes = 18 * 60 + 30; // 6:30 PM
  const closeTimeInMinutes = 23 * 60 + 15; // 11:15 PM

  const isTimeOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;

  const isOpen = isTimeOpen && !esDiaCerrado;

  const titleEl = document.getElementById("closed-title");
  const subtitleEl = document.getElementById("closed-subtitle");

  if (esDiaCerrado) {
    if (titleEl) titleEl.innerText = "¡Hoy descansamos!";
    if (subtitleEl) subtitleEl.innerText = "Laboramos Lunes, Jueves, Viernes, Sábado y Domingo de 6:30 PM a 11:15 PM";
  } else {
    if (titleEl) titleEl.innerText = "¡Volvemos pronto!";
    if (subtitleEl) subtitleEl.innerText = "Abrimos hoy a las 6:30 PM";
  }

  if (isOpen) {
    appContainer.classList.remove("menu-blocked");
    btnText.innerText = "Confirmar en WhatsApp";
    btnContainer.style.background = "#25d366";
    btnContainer.onclick = sendOrder;

    // Restaurar Iconos Originales (+)
    addButtons.forEach((btn) => {
      btn.innerHTML = "+";
    });

    return true;
  } else {
    // BLOQUEO VISUAL DEL CONTENEDOR
    appContainer.classList.add("menu-blocked");

    // Cambiar iconos de botones a candado
    addButtons.forEach((btn) => {
      btn.innerHTML =
        '<i class="fa-solid fa-lock" style="font-size: 14px;"></i>';
    });

    if (!sessionStorage.getItem("closedModalShown")) {
      lockModal.style.display = "flex";
      document.body.style.overflow = "hidden";
      sessionStorage.setItem("closedModalShown", "true");
    }

    btnText.innerText = "Local Cerrado (Ver Horarios)";
    btnContainer.style.background = "#999";
    btnContainer.onclick = function () {
      closeCheckout();
      openHours();
    };
    return false;
  }
}

function closeClosedModal() {
  document.getElementById("modal-closed-lock").style.display = "none";
  document.body.style.overflow = "auto";
}

function toggleAddressField(show) {
  document.getElementById("address-section").style.display = show
    ? "block"
    : "none";
}

// --- EFECTO CONFETI ---
function launchSuccess() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6d4c41", "#2d6a4f", "#25d366"],
  });
}

function removeError(el) {
  el.parentElement.classList.remove("input-error");
}

// 4. WhatsApp Final (Ticket de Texto Estructurado)
function sendOrder() {
  const now = new Date();
  const hour = now.getHours();

  // if (hour < 19 || hour >= 23) {
  //   alert("Lo sentimos, el local está cerrado.");
  //   return;
  // }

  const deliveryType = document.querySelector(
    'input[name="delivery-type"]:checked'
  ).value;

  // Datos del Cliente
  const name = document.getElementById("order-name").value.trim();
  const phoneInput = document.getElementById("order-phone").value.trim();

  // Datos de Dirección
  const street = document.getElementById("order-street") ? document.getElementById("order-street").value.trim() : "";
  const number = document.getElementById("order-number") ? document.getElementById("order-number").value.trim() : "";
  const colonia = document.getElementById("order-colonia") ? document.getElementById("order-colonia").value.trim() : "";
  const references = document.getElementById("order-references") ? document.getElementById("order-references").value.trim() : "";

  const notes = document.getElementById("order-notes").value.trim();

  // Validaciones Visuales
  let hasError = false;

  const validateField = (id) => {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.parentElement.classList.add("input-error");
      hasError = true;
    } else {
      el.parentElement.classList.remove("input-error");
    }
  };

  validateField("order-name");

  if (deliveryType === "A domicilio") {
    // Si no se compartió ubicación, calle y colonia son obligatorios
    const lat = document.getElementById("order-lat").value;
    if (!lat) {
      validateField("order-street");
      validateField("order-colonia");
    } else {
      // Si hay GPS, limpiamos errores pre-existentes de calle/colonia
      document.getElementById("order-street").parentElement.classList.remove("input-error");
      document.getElementById("order-colonia").parentElement.classList.remove("input-error");
    }
  }

  if (hasError) {
    // Hacer scroll arriba para que el usuario vea el error
    document.querySelector('.checkout-sheet').scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }


  // 1. Efecto Visual de Éxito
  launchSuccess();

  // 2. Construir el Ticket de Texto Estructurado
  let msg = `*Nombre:* ${name}\n`;
  if (phoneInput) msg += `*Celular:* ${phoneInput}\n`;
  msg += `\n---\n`;

  // Bloque Dirección
  if (deliveryType === "A domicilio") {
    msg += `📍 Dirección\n`;
    msg += `* *Calle:* ${street}\n`;
    msg += `* *Número:* ${number}\n`;
    msg += `* *Colonia:* ${colonia}\n`;
    if (references) msg += `* *Referencias:* ${references}\n`;

    // Obteniendo las coordenadas GPS (Si las hay)
    const lat = document.getElementById("order-lat") ? document.getElementById("order-lat").value : "";
    const lng = document.getElementById("order-lng") ? document.getElementById("order-lng").value : "";
    if (lat && lng) {
      msg += `* *Mapa:* https://maps.google.com/?q=${lat},${lng}\n`;
    }

    msg += `\n---\n`;
  } else {
    msg += `🛍️ Pedido: *PASARÉ A RECOGER*\n`;
    msg += `\n---\n`;
  }

  // Bloque Resumen Económico
  msg += `💵 Resumen\n`;
  msg += `* *Productos:* $${total}\n`;
  if (deliveryType === "A domicilio") {
    msg += `* *Envío:* 🚨 Por definir 🚨\n`;
    msg += `* *Total:* $${total} + envío en EFECTIVO\n`;
  } else {
    msg += `* *Total:* $${total} en EFECTIVO\n`;
  }
  msg += `\n---\n`;

  // Bloque Pedido Detallado
  msg += `📋 Pedido\n`;

  // Agrupar items idénticos basándonos en el nombre y detalles exactos
  let orderMap = {};
  cart.forEach(item => {
    // Usamos el nombre y los detalles como clave única para agrupar
    const detailKey = item.details ? item.details : "";
    const key = `${item.item}|${detailKey}`;
    if (orderMap[key]) {
      orderMap[key].quantity += 1;
      orderMap[key].subtotal += item.price;
    } else {
      orderMap[key] = {
        name: item.item,
        price: item.price,
        details: detailKey,
        quantity: 1,
        subtotal: item.price
      };
    }
  });

  // Imprimir cada línea del pedido agrupado
  for (const key in orderMap) {
    const p = orderMap[key];
    msg += `*${p.quantity}x* ${p.name} ($${p.subtotal})\n`;

    // Si tiene detalles (ingredientes o extras), imprimirlos como viñetas debajo
    if (p.details) {
      // Intentamos separar los detalles por coma o punto para que se vean como viñetas
      const detailParts = p.details.split(/[,.]+/);
      detailParts.forEach(part => {
        let cleanPart = part.trim();
        if (cleanPart) {
          msg += `‣ _${cleanPart}_\n`;
        }
      });
    }
    msg += `\n`; // Salto de línea extra equivalente a tu ejemplo visual
  }

  // Notas Adicionales Finales (Si las hay)
  if (notes) {
    msg += `---\n📝 *Notas/Cambios:*\n_${notes}_\n`;
  }

  const phone = "529992725039";

  // 3. Enviar a WhatsApp
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");

  // Recargar la página después de enviarlo para limpiar el carrito y reiniciar todo
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// --- COMPARTIR UBICACIÓN (MAPA INTERACTIVO) ---
let map = null;

function requestLocation() {
  openMapModal();
}

function openMapModal() {
  const modal = document.getElementById("modal-map");
  modal.style.display = "flex";

  // Retraso súper leve para asegurar que el contenedor es visible antes de inicializar Leaflet
  setTimeout(() => {
    if (!map) {
      // Coordenadas base (Progreso, Yucatán según tu captura, o puedes cambiarlo)
      const baseLat = 21.2828;
      const baseLng = -89.6644;

      map = L.map("leaflet-map", {
        zoomControl: false, // Quitamos zoom predeterminado para diseño más limpio
      }).setView([baseLat, baseLng], 15);

      // Usamos el diseño de mapa limpio oficial de CartoDB / OSM
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Agregamos botón de zoom abajo a la izquierda para no tapar cabeceras
      L.control.zoom({
        position: 'bottomleft'
      }).addTo(map);

      // Intentar centrar en el usuario apenas carga
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 17),
          (err) => console.log("GPS no permitido de inicio", err)
        );
      }
    } else {
      // Si el mapa ya existía, forzamos que recalcule su tamaño porque estaba oculto
      map.invalidateSize();
    }
  }, 100);
}

function closeMapModal() {
  document.getElementById("modal-map").style.display = "none";
}

function centerToCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta GPS.");
    return;
  }

  // Animación del botón gps (opcional visual)
  const btn = document.querySelector(".btn-my-location i");
  btn.classList.add("fa-beat-fade");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { animate: true, duration: 1 });
      btn.classList.remove("fa-beat-fade");
    },
    (err) => {
      alert("No pudimos obtener tu ubicación. Verifica tus permisos.");
      btn.classList.remove("fa-beat-fade");
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

function saveMapLocation() {
  // El centro actual del mapa se vuelve la "ubicación exacta" (Puntero fijo)
  const center = map.getCenter();

  // Guardar en inputs ocultos
  document.getElementById("order-lat").value = center.lat;
  document.getElementById("order-lng").value = center.lng;

  // Cambiar estado visual del botón del checkout
  const btn = document.getElementById("btn-share-location");
  const btnText = document.getElementById("location-btn-text");

  btn.classList.remove("error");
  btn.classList.add("success");
  btnText.innerText = "Ubicación guardada";
  btn.querySelector("i").className = "fa-solid fa-check";

  // Cerrar modal
  closeMapModal();
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

function openPayment() {
  document.getElementById("modal-payment").style.display = "flex";
}

function closePayment() {
  document.getElementById("modal-payment").style.display = "none";
}

// --- GENERADOR DE PATRÓN DE FONDO ---
function generateBackgroundPattern() {
  const container = document.getElementById("bg-pattern");
  if (!container) return;

  // Iconos relacionados con comida y asador de FontAwesome
  const icons = [
    "fa-burger",
    "fa-hotdog",
    "fa-pizza-slice",
    "fa-fire",
    "fa-utensils",
    "fa-cheese",
    "fa-pepper-hot"
  ];

  // Llenar el fondo holgadamente
  // Usar Math.max para cubrir el scroll si fuera necesario, y dividir por un número menor
  // para generar íconos de sobra, ya que overflow: hidden los oculta si sobran.
  const screenWidth = window.innerWidth;
  const screenHeight = Math.max(window.innerHeight, document.documentElement.scrollHeight);

  // Cada icono ocupa ~75px (35px + 40px gap). Dividimos por 50 para asegurar de que siempre sobren iconos.
  const cols = Math.floor(screenWidth / 50) + 1;
  const rows = Math.floor(screenHeight / 50) + 1;
  const totalIcons = cols * rows;

  let patternHTML = "";
  for (let i = 0; i < totalIcons; i++) {
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    patternHTML += `<i class="fa-solid ${randomIcon}"></i>`;
  }
  container.innerHTML = patternHTML;
}

// Escuchar redimensionamiento para regenerar la grilla si cambia mucho
window.addEventListener("resize", () => {
  clearTimeout(window.bgResizeTimer);
  window.bgResizeTimer = setTimeout(generateBackgroundPattern, 200);
});

window.onload = () => {
  checkStoreStatus();
  generateBackgroundPattern();
  collectMenuForMarketing(); // Recolecta el menú del HTML para el carrusel de upsell

  // Remover Splash Screen con un pequeño retraso estético
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("hidden");
      // Esperar a que termine la transición CSS (0.6s) para removerlo del DOM
      setTimeout(() => {
        splash.style.display = "none";
      }, 600);
    }
  }, 1200); // 1.2 segundos de animación inicial
};

window.onclick = function (event) {
  const mC = document.getElementById("modal-custom");
  const mH = document.getElementById("modal-hours");
  const mP = document.getElementById("modal-payment");
  const mK = document.getElementById("modal-checkout");
  const mLock = document.getElementById("modal-closed-lock");
  const lb = document.getElementById("lightbox");

  if (event.target == mC) closeModal();
  if (event.target == mH) closeHours();
  if (event.target == mP) closePayment();
  if (event.target == mK) closeCheckout();
  if (event.target == mLock) closeClosedModal();
  if (event.target == lb) closeLightbox();
};