// WOLFKING — catálogo, verificación de jugador y pedidos por WhatsApp.
// Para cambiar el número, usa el código de país y el número, sin "+" ni espacios.
const WHATSAPP = "573184986724";

// Configura aquí tus datos reales de cobro.
// Déjalos vacíos si todavía no quieres mostrarlos.
const PAYMENT_DETAILS = {
  "Nequi": {
    title: "Nequi",
    rows: [
      ["Número", "TU_NUMERO_NEQUI"]
    ]
  },
  "Llave Bre-B": {
    title: "Llave Bre-B",
    rows: [
      ["Llave", "TU_LLAVE_BRE_B"]
    ]
  },
  "Binance (USDT)": {
    title: "Binance Pay",
    rows: [
      ["UID / Pay ID", "TU_UID_BINANCE"]
    ]
  }
};

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
let verifiedPlayer = null;
let lookupTimer = null;
let receiptFile = null;
let receiptObjectUrl = null;

const cop = (value) => "$" + Number(value).toLocaleString("es-CO");

function showError(field, visible) {
  const error = document.querySelector(`.error[data-for="${field}"]`);
  if (error) error.classList.toggle("show", visible);
}

function setPlayerStatus(state, title, text) {
  const box = document.getElementById("player-status");
  const titleEl = document.getElementById("player-status-title");
  const textEl = document.getElementById("player-status-text");
  box.dataset.state = state;
  titleEl.textContent = title;
  textEl.textContent = text;
}

function makeCard(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pkg";
  button.dataset.id = item.id;
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `Seleccionar ${item.name}, ${cop(item.price)} pesos colombianos`);

  const top = document.createElement("span");
  top.className = "pkg-topline";
  const icon = document.createElement("span");
  icon.className = "pkg-icon";
  icon.textContent = item.icon || "◆";
  top.appendChild(icon);

  if (item.tag) {
    const tag = document.createElement("span");
    tag.className = "pkg-tag";
    tag.textContent = item.tag;
    top.appendChild(tag);
  }

  const check = document.createElement("span");
  check.className = "pkg-check";
  check.setAttribute("aria-hidden", "true");
  check.textContent = "✓";

  const name = document.createElement("span");
  name.className = "pkg-name";
  name.textContent = item.amount ? item.amount.toLocaleString("es-CO") : item.name;
  button.append(top, check, name);

  if (item.amount) {
    const sub = document.createElement("span");
    sub.className = "pkg-sub";
    sub.textContent = "diamantes";
    button.appendChild(sub);
  }

  const price = document.createElement("span");
  price.className = "pkg-price";
  price.textContent = cop(item.price);
  button.appendChild(price);
  button.addEventListener("click", () => selectPackage(item.id));
  return button;
}

function selectPackage(id) {
  selected = all.find((item) => item.id === id) || null;

  document.querySelectorAll(".pkg").forEach((element) => {
    const active = element.dataset.id === id;
    element.classList.toggle("active", active);
    element.setAttribute("aria-pressed", String(active));
  });

  document.getElementById("sum-item").textContent = selected ? selected.name : "Ningún paquete";
  document.getElementById("sum-price").innerHTML = selected
    ? `${cop(selected.price)} <small>COP</small>`
    : '$0 <small>COP</small>';
  showError("item", false);
  updateSubmitState();

  if (window.matchMedia("(max-width: 700px)").matches) {
    document.querySelector(".order-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectPayment(payment) {
  document.getElementById("payment").value = payment;
  document.querySelectorAll(".payment-option").forEach((button) => {
    const active = button.dataset.payment === payment;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
    const indicator = button.querySelector("i");
    if (indicator) indicator.textContent = active ? "●" : "○";
  });

  const details = PAYMENT_DETAILS[payment];
  const box = document.getElementById("payment-details");
  if (!details) {
    box.hidden = true;
    box.innerHTML = "";
  } else {
    box.hidden = false;
    box.innerHTML = `<strong>💳 ${escapeHtml(details.title)}</strong>` + details.rows.map(([label, value]) =>
      `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`
    ).join("");
  }

  document.getElementById("sum-payment").textContent = payment || "—";
  showError("payment", false);
  updateSubmitState();
}

function updateSubmitState() {
  const button = document.getElementById("submit-order");
  const id = document.getElementById("playerId").value.trim();
  const payment = document.getElementById("payment").value;
  const ready = Boolean(verifiedPlayer && verifiedPlayer.id === id && selected && payment);
  button.disabled = !ready;
}

async function lookupPlayer() {
  const input = document.getElementById("playerId");
  const uid = input.value.trim();
  const spinner = document.getElementById("lookup-spinner");
  const nick = document.getElementById("nick");
  const submit = document.getElementById("submit-order");

  verifiedPlayer = null;
  nick.value = "";
  document.getElementById("sum-id").textContent = uid || "—";
  document.getElementById("sum-nick").textContent = "—";
  submit.disabled = true;

  if (!/^\d{6,13}$/.test(uid)) {
    spinner.classList.remove("show");
    setPlayerStatus("idle", "Verificación automática", "Escribe un ID de 6 a 13 números.");
    return;
  }

  spinner.classList.add("show");
  setPlayerStatus("loading", "Buscando jugador…", "Estamos verificando el ID en Free Fire.");

  try {
    const response = await fetch(`/.netlify/functions/player-info?uid=${encodeURIComponent(uid)}`, {
      headers: { Accept: "application/json" }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok || !data.player?.nickname) {
      throw new Error(data.message || data.error || "player_not_found");
    }

    verifiedPlayer = data.player;
    nick.value = data.player.nickname;
    document.getElementById("sum-id").textContent = data.player.id;
    document.getElementById("sum-nick").textContent = data.player.nickname;
    setPlayerStatus(
      "success",
      "JUGADOR ENCONTRADO",
      `${data.player.nickname}${data.player.region ? ` · Región ${data.player.region}` : ""}`
    );
    showError("playerId", false);
    updateSubmitState();
  } catch (error) {
    setPlayerStatus("error", "No encontramos el jugador", "Revisa el ID e inténtalo nuevamente.");
    showError("playerId", true);
  } finally {
    spinner.classList.remove("show");
  }
}

function queuePlayerLookup() {
  clearTimeout(lookupTimer);
  lookupTimer = setTimeout(lookupPlayer, 650);
}

function handleReceipt(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return;
  }
  receiptFile = file;
  if (receiptObjectUrl) URL.revokeObjectURL(receiptObjectUrl);
  receiptObjectUrl = URL.createObjectURL(file);
  document.getElementById("receipt-image").src = receiptObjectUrl;
  document.getElementById("receipt-preview").hidden = false;
}

function removeReceipt() {
  receiptFile = null;
  document.getElementById("receipt").value = "";
  document.getElementById("receipt-preview").hidden = true;
  if (receiptObjectUrl) {
    URL.revokeObjectURL(receiptObjectUrl);
    receiptObjectUrl = null;
  }
}

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function init() {
  const diamondsContainer = document.getElementById("diamonds");
  const passesContainer = document.getElementById("passes");
  DIAMONDS.forEach((item) => diamondsContainer.appendChild(makeCard(item)));
  PASSES.forEach((item) => passesContainer.appendChild(makeCard(item)));

  const generalMessage = "Hola WOLFKING 🐺, quiero información sobre recargas de Free Fire.";
  document.getElementById("wa-float").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(generalMessage)}`;
  document.getElementById("year").textContent = new Date().getFullYear();

  const playerIdInput = document.getElementById("playerId");
  playerIdInput.addEventListener("input", () => {
    playerIdInput.value = playerIdInput.value.replace(/\D/g, "").slice(0, 13);
    document.getElementById("sum-id").textContent = playerIdInput.value || "—";
    queuePlayerLookup();
  });
  playerIdInput.addEventListener("blur", lookupPlayer);

  document.querySelectorAll(".payment-option").forEach((button) => {
    button.setAttribute("aria-checked", "false");
    button.addEventListener("click", () => selectPayment(button.dataset.payment));
  });

  document.getElementById("receipt").addEventListener("change", handleReceipt);
  document.getElementById("remove-receipt").addEventListener("click", removeReceipt);

  document.getElementById("order").addEventListener("submit", (event) => {
    event.preventDefault();
    const playerId = document.getElementById("playerId").value.trim();
    const payment = document.getElementById("payment").value;

    const idValid = /^\d{6,13}$/.test(playerId);
    const playerValid = Boolean(verifiedPlayer && verifiedPlayer.id === playerId);
    const paymentValid = Boolean(payment);

    showError("playerId", !idValid || !playerValid);
    showError("payment", !paymentValid);
    showError("item", !selected);

    if (!idValid || !playerValid || !paymentValid || !selected) {
      if (!playerValid) document.getElementById("playerId").focus();
      return;
    }

    const lines = [
      "🐺 *NUEVO PEDIDO – WOLFKING*",
      "",
      "🎮 *Juego:* Free Fire",
      `🆔 *ID:* ${playerId}`,
      `👤 *Jugador:* ${verifiedPlayer.nickname}`,
      verifiedPlayer.region ? `🌎 *Región:* ${verifiedPlayer.region}` : null,
      `📦 *Paquete:* ${selected.name}`,
      `💰 *Total:* ${cop(selected.price)} COP`,
      `💳 *Pago:* ${payment}`,
      receiptFile ? `📸 *Comprobante:* seleccionado (${receiptFile.name})` : "📸 *Comprobante:* no adjunto",
      "",
      receiptFile
        ? "Abriré el chat. Por favor adjunta en WhatsApp la imagen del comprobante que seleccionaste."
        : "Hola, quiero confirmar mi pedido. Gracias."
    ].filter(Boolean);

    openWhatsApp(lines.join("\n"));
  });

  updateSubmitState();
}

document.addEventListener("DOMContentLoaded", init);
