// WOLFKING — Netlify Function para consultar el nickname de Free Fire.
// La consulta se hace desde el servidor para evitar depender de CORS del navegador.

exports.handler = async (event) => {
  const uid = String(event.queryStringParameters?.uid || "").replace(/\D/g, "");

  if (!/^\d{6,13}$/.test(uid)) {
    return json(400, { ok: false, error: "invalid_uid" });
  }

  try {
    const response = await fetch(
      `https://api2.nftoken.info/player-info?uid=${encodeURIComponent(uid)}`,
      { headers: { Accept: "application/json" } }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(response.status, {
        ok: false,
        error: "player_api_error",
        message: data?.message || data?.error || "No fue posible consultar el jugador."
      });
    }

    const basic = data?.basicInfo || data?.basicinfo || data?.result?.basicInfo || data?.result?.basicinfo || {};
    const nickname = basic.nickname || data?.nickname || data?.player_nickname || data?.result?.nickname;
    const region = basic.region || data?.region || data?.player_region || data?.result?.region || "";

    if (!nickname) {
      return json(404, { ok: false, error: "player_not_found" });
    }

    return json(200, {
      ok: true,
      player: {
        id: uid,
        nickname: String(nickname),
        region: String(region || "").toUpperCase()
      }
    });
  } catch (error) {
    return json(502, {
      ok: false,
      error: "lookup_failed",
      message: "El servicio de consulta no respondió. Intenta nuevamente."
    });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
