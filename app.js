const WHATSAPP = "573184986724";

const DIAMONDS = [
  { id: "d110", name: "110 diamantes", amount: 110, price: 3000 },
  { id: "d341", name: "341 diamantes", amount: 341, price: 9500 },
  { id: "d572", name: "572 diamantes", amount: 572, price: 15500, tag: "Popular" },
  { id: "d1166", name: "1166 diamantes", amount: 1166, price: 30000 },
  { id: "d2398", name: "2398 diamantes", amount: 2398, price: 59000 },
  { id: "d6160", name: "6160 diamantes", amount: 6160, price: 145000, tag: "Mejor valor" },
];

const PASSES = [
  { id: "weekly", name: "Tarjeta semanal", icon: "📅", price: 6200 },
  { id: "monthly", name: "Tarjeta mensual", icon: "🗓️", price: 34000, tag: "Top" },
  { id: "booyah", name: "Pase Booyah", icon: "🏆", price: 8000 },
];

const cop = (n) => "$" + n.toLocaleString("es-CO");
const all = [...DIAMONDS, ...PASSES];
let selected = null;
let verifiedNick = null; 

// Renderizar tarjetas
function card(item) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "card pkg";
  btn.dataset.id = item.id;
  btn.innerHTML = `
    ${item.tag ? `<span class="tag">${item.tag}</span>` : ""}
    <span class="pkg-icon">${item.icon || "💎"}</span>
    <span class="pkg-name">${item.amount ? item.amount.toLocaleString("es-CO") : item.name}</span>
    <span class="pkg-price">${cop(item.price)}</span>
  `;
  btn.addEventListener("click", () => select(item.id));
  return btn;
}

DIAMONDS.forEach((d) => document.getElementById("diamonds").appendChild(card(d)));
PASSES.forEach((p) => document.getElementById("passes").appendChild(card(p)));

// Selección de paquete
function select(id) {
  selected = all.find((i) => i.id === id);
  document.querySelectorAll(".pkg").forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  document.getElementById("sum-item").textContent = selected.name;
  document.getElementById("sum-price").textContent = cop(selected.price);
  showError("item", false);
  checkFormReady();
}

function showError(field, show) {
  const el = document.querySelector(`.error[data-for="${field}"]`);
  if (el) el.classList.toggle("show", show);
}

// Botón de Verificación de ID
document.getElementById("btn-verify").addEventListener("click", () => {
  const input = document.getElementById("playerId");
  const idValue = input.value.trim();
  
  if (!/^[0-9]{6,13}$/.test(idValue)) {
    showError("playerId", true);
    return;
  }
  
  showError("playerId", false);
  const btn = document.getElementById("btn-verify");
  btn.textContent = "Buscando...";
  btn.disabled = true;

  // SIMULACIÓN DE API: Como Garena no tiene API abierta, simulamos la búsqueda.
  // En un entorno real, aquí harías un fetch() a tu API de recargas.
  setTimeout(() => {
    verifiedNick = "Jugador_" + idValue.slice(-4); // Nombre temporal generado
    
    document.getElementById("player-nick").textContent = verifiedNick;
    document.getElementById("player-info").classList.remove("hidden");
    
    btn.textContent = "Verificado ✓";
    btn.style.background = "var(--wa)";
    btn.style.color = "#000";
    btn.style.borderColor = "var(--wa)";
    input.readOnly = true; 
    
    checkFormReady();
  }, 1200);
});

// Desbloquear botón de enviar solo si todo está listo
function checkFormReady() {
  const isReady = selected !== null && verifiedNick !== null;
  document.getElementById("btn-submit").disabled = !isReady;
}

// Envío a WhatsApp
document.getElementById("order").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const playerId = form.playerId.value.trim();
  const payment = form.payment.value;
  const receipt = form.receipt.files.length > 0;

  if (!verifiedNick) { alert("Debes verificar el ID primero."); return; }
  if (!payment) { showError("payment", true); return; }
  if (!receipt) { alert("Por favor, selecciona la imagen del comprobante de pago."); return; }

  // MENÚ FORMATEADO EXACTAMENTE COMO LO PEDISTE
  const message = `🐺 NUEVO PEDIDO – WOLFKING

🎮 Juego: Free Fire
🆔 ID: ${playerId}
👤 Nick: ${verifiedNick}
📦 Paquete: ${selected.name}
💰 Total: ${cop(selected.price)} COP
💳 Pago: ${payment}`;

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodedMessage}`;
  
  // Abrimos WhatsApp
  window.open(waUrl, "_blank");
});

