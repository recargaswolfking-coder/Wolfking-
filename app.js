// WOLFKING — catálogo y pedidos por WhatsApp
// Número en formato internacional: código de país + número, sin "+" ni espacios.
const WHATSAPP = "573184986724";

const DIAMONDS = [
  { id: "d110", name: "110 diamantes", amount: 110, price: 3000 },
  { id: "d341", name: "341 diamantes", amount: 341, price: 9500 },
  { id: "d572", name: "572 diamantes", amount: 572, price: 15500, tag: "Popular" },
  { id: "d1166", name: "1166 diamantes", amount: 1166, price: 30000 },
  { id: "d2398", name: "2398 diamantes", amount: 2398, price: 59000 },
  { id: "d6160", name: "6160 diamantes", amount: 6160, price: 145000, tag: "Mejor valor" }
];

const PASSES = [
  { id: "weekly", name: "Tarjeta semanal", icon: "📅", price: 6200 },
  { id: "monthly", name: "Tarjeta mensual", icon: "🗓️", price: 34000, tag: "Top" },
  { id: "booyah", name: "Pase Booyah", icon: "🏆", price: 8000 }
];

const all = [...DIAMONDS, ...PASSES];
let selected = null;

const cop = (amount) => "$" + amount.toLocaleString("es-CO");

function makeCard(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "product-card";
  button.dataset.id = item.id;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `Seleccionar ${item.name}, ${cop(item.price)} COP`);

  const tag = item.tag ? `<span class="product-tag">${item.tag}</span>` : "";
  const icon = item.icon || "💎";
  const title = item.amount ? item.amount.toLocaleString("es-CO") : item.name;
  const subtitle = item.amount ? "DIAMANTES" : "FREE FIRE";
  button.innerHTML = `
    ${tag}
    <span class="product-icon" aria-hidden="true">${icon}</span>
    <span class="product-name">${title}</span>
    <span class="product-subtitle">${subtitle}</span>
    <span class="product-price">${cop(item.price)} <small>COP</small></span>
    <span class="product-select">SELECCIONAR <b aria-hidden="true">↗</b></span>
  `;
  button.addEventListener("click", () => selectPackage(item.id));
  return button;
}

function showError(field, visible) {
  const error = document.querySelector(`.error[data-for="${field}"]`);
  if (error) error.classList.toggle("show", visible);
}

function selectPackage(id) {
  selected = all.find((item) => item.id === id) || null;
  if (!selected) return;

  document.querySelectorAll(".product-card").forEach((button) => {
    const active = button.dataset.id === id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.getElementById("sum-item").textContent = selected.name;
  document.getElementById("sum-caption").textContent = selected.amount
    ? `${selected.amount.toLocaleString("es-CO")} diamantes`
    : "Producto seleccionado";
  document.getElementById("sum-price").innerHTML = `${cop(selected.price)} <small>COP</small>`;
  showError("item", false);

  // En móviles, desplaza al formulario para que el cliente pueda completar el pedido.
  if (window.matchMedia("(max-width: 899px)").matches) {
    document.querySelector(".order-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function init() {
  const diamondsRoot = document.getElementById("diamonds");
  const passesRoot = document.getElementById("passes");
  DIAMONDS.forEach((item) => diamondsRoot.appendChild(makeCard(item)));
  PASSES.forEach((item) => passesRoot.appendChild(makeCard(item)));

  const greeting = "Hola WOLFKING 🐺, quiero información sobre recargas de Free Fire.";
  document.getElementById("wa-float").href = buildWhatsAppUrl(greeting);
  document.getElementById("year").textContent = new Date().getFullYear();

  const form = document.getElementById("order");
  const playerIdInput = form.elements.playerId;
  playerIdInput.addEventListener("input", () => {
    playerIdInput.value = playerIdInput.value.replace(/\D/g, "").slice(0, 13);
    if (/^[0-9]{6,13}$/.test(playerIdInput.value)) showError("playerId", false);
  });
  form.elements.payment.addEventListener("change", () => {
    if (form.elements.payment.value) showError("payment", false);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const playerId = playerIdInput.value.trim();
    const nick = form.elements.nick.value.trim();
    const payment = form.elements.payment.value;
    const idValid = /^[0-9]{6,13}$/.test(playerId);

    showError("playerId", !idValid);
    showError("payment", !payment);
    showError("item", !selected);

    if (!idValid || !payment || !selected) {
      const firstError = document.querySelector(".error.show");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const lines = [
      "🐺 *NUEVO PEDIDO — WOLFKING*",
      "",
      "🎮 *Juego:* Free Fire",
      `🆔 *ID de jugador:* ${playerId}`,
      nick ? `👤 *Nickname:* ${nick}` : null,
      `📦 *Paquete:* ${selected.name}`,
      `💰 *Total estimado:* ${cop(selected.price)} COP`,
      `💳 *Método de pago elegido:* ${payment}`,
      "",
      "Hola, quiero confirmar disponibilidad, precio y datos de pago antes de realizar la transferencia. ¡Gracias!"
    ].filter((line) => line !== null);

    // Abrimos WhatsApp con el pedido preparado; el cliente debe revisar y enviarlo.
    const url = buildWhatsAppUrl(lines.join("\n"));
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  });
}

document.addEventListener("DOMContentLoaded", init);
