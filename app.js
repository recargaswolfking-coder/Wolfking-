const WHATSAPP = "573184986724";

const DIAMONDS = [
  { id: "d110", name: "110 diamantes", amount: 110, price: 3000 },
  { id: "d341", name: "341 diamantes", amount: 341, price: 9500 },
  { id: "d572", name: "572 diamantes", amount: 572, price: 15500 },
  { id: "d1166", name: "1166 diamantes", amount: 1166, price: 30000 },
  { id: "d2398", name: "2398 diamantes", amount: 2398, price: 59000 },
  { id: "d6160", name: "6160 diamantes", amount: 6160, price: 145000 },
];

const PASSES = [
  { id: "weekly", name: "Tarjeta semanal", icon: "📅", price: 6200 },
  { id: "monthly", name: "Tarjeta mensual", icon: "🗓️", price: 34000 },
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
    <span class="pkg-icon">${item.icon || "💎"}</span>
    <span class="pkg-name">${item.amount ? item.amount.toLocaleString("es-CO") : item.name}</span>
    <span class="pkg-price">${cop(item.price)}</span>
  `;
  btn.addEventListener("click", () => select(item.id));
  return btn;
}

DIAMONDS.forEach((d) => document.getElementById("diamonds").appendChild(card(d)));
PASSES.forEach((p) => document.getElementById("passes").appendChild(card(p)));

// Seleccionar paquete
function select(id) {
  selected = all.find((i) => i.id === id);
  document.querySelectorAll(".pkg").forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  document.getElementById("sum-item").textContent = selected.name;
  document.getElementById("sum-price").textContent = cop(selected.price);
  checkFormReady();
}

function showError(field, show) {
  const el = document.querySelector(`.error[data-for="${field}"]`);
  if (el) el.classList.toggle("show", show);
}

// Búsqueda real en la API de Free Fire
document.getElementById("btn-verify").addEventListener("click", async () => {
  const input = document.getElementById("playerId");
  const idValue = input.value.trim();
  
  if (!/^[0-9]{6,13}$/.test(idValue)) {
    showError("playerId", true);
    return;
  }
  
  showError("playerId", false);
  const btn = document.getElementById("btn-verify");
  const infoBox = document.getElementById("player-info");
  
  btn.innerHTML = "⏳ Buscando...";
  btn.disabled = true;
  infoBox.classList.add("hidden");

  try {
    // Consulta a API de Garena (a través de AllOrigins para evitar bloqueos)
    const apiUrl = `https://free-ff-api-src-5plp.onrender.com/api/v1/account?region=US&uid=${idValue}`;
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
    const result = await response.json();
    const data = JSON.parse(result.contents);
    
    let nickname = null;
    let region = "US";
    
    // Extraer datos
    if (data && data.basicInfo && data.basicInfo.nickname) {
        nickname = data.basicInfo.nickname;
        if(data.basicInfo.region) region = data.basicInfo.region;
    } else if (data && data.AccountName) {
        nickname = data.AccountName;
    }

    if (nickname) {
      verifiedNick = nickname;
      document.getElementById("player-nick").textContent = nickname;
      document.getElementById("player-region").textContent = region;
      
      // Mostrar recuadro verde
      infoBox.classList.remove("hidden");
      btn.innerHTML = "✓ Verificado";
      btn.style.background = "var(--wa)";
      btn.style.color = "#000";
      
      checkFormReady();
      return;
    }
    throw new Error("ID no encontrado");

  } catch(e) {
    // Plan B: Si la API gratuita está saturada o caída, le pide el nombre al usuario
    btn.innerHTML = "🔍 Verificar";
    btn.disabled = false;
    
    const manualNick = prompt("⚠️ Los servidores de búsqueda están saturados.\n\nPor favor, escribe tu nombre/nickname de Free Fire manualmente para continuar:");
    
    if (manualNick && manualNick.trim() !== "") {
      verifiedNick = manualNick.trim();
      document.getElementById("player-nick").textContent = verifiedNick;
      document.getElementById("player-region").textContent = "US";
      infoBox.classList.remove("hidden");
      btn.innerHTML = "✓ Ingresado";
      btn.disabled = true;
      checkFormReady();
    }
  }
});

// Desbloquear botón de enviar
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

  if (!verifiedNick) { alert("Verifica el ID primero."); return; }
  if (!payment) { showError("payment", true); return; }
  if (!receipt) { alert("Sube el comprobante de pago."); return; }

  // Mensaje exacto solicitado
  const message = `🐺 NUEVO PEDIDO – WOLFKING

🎮 Juego: Free Fire
🆔 ID: ${playerId}
👤 Nick: ${verifiedNick}
📦 Paquete: ${selected.name}
💰 Total: ${cop(selected.price)} COP
💳 Pago: ${payment}`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP}?text=${encodedMessage}`, "_blank");
});
