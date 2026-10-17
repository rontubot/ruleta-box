// Reglas oficiales "La Velada del Caos"
const RULES_1V1 = [
  {
    id: "el_manco",
    name: "El Manco",
    pts: 10,
    category: "Combate",
    description: "Una mano a la espalda o pegada al cuerpo. Solo se permite pelear con la mano libre.",
    color: "#ff4757",
    icon: "🥊🚫"
  },
  {
    id: "pies_cemento",
    name: "Pies de Cemento",
    pts: 10,
    category: "Combate",
    description: "Prohibido dar pasos o saltos. Solo se permite esquivar con el movimiento del torso y bloquear.",
    color: "#747d8c",
    icon: "🧱🦵"
  },
  {
    id: "solo_jab",
    name: "Solo Jab",
    pts: 10,
    category: "Combate",
    description: "Solo se permiten golpes rectos con la mano adelantada. Ganchos y cruzados están prohibidos.",
    color: "#2ed573",
    icon: "🥊⚡"
  },
  {
    id: "guardia_invertida",
    name: "Guardia Invertida",
    pts: 10,
    category: "Combate",
    description: "Cambio obligatorio de postura (los diestros pasan a zurdos; los zurdos a diestros).",
    color: "#ffa502",
    icon: "🔄👊"
  },
  {
    id: "cuerpo_a_cuerpo",
    name: "Cuerpo a Cuerpo",
    pts: 10,
    category: "Combate",
    description: "Prohibidos estrictamente los golpes a la cabeza. Solo zonas al torso permitidas.",
    color: "#eccc68",
    icon: "🛡️🥊"
  },
  {
    id: "la_zona_segura",
    name: "La Zona Segura",
    pts: 15,
    category: "Combate",
    description: "Se gana el bono si al finalizar los 15 segundos, el peleador mantiene al menos un pie dentro de la marca central del ring.",
    color: "#3742fa",
    icon: "🎯⭐"
  }
];

const RULES_TAG_TEAM_EXTRA = [
  {
    id: "relevo_obligatorio",
    name: "¡Relevo Obligatorio!",
    pts: 0,
    category: "Estructural Tag Team",
    description: "¡Ambos equipos deben hacer el relevo de inmediato! Ir a las esquinas y chocar guantes con su compañero.",
    color: "#9b59b6",
    icon: "🔔🔁"
  },
  {
    id: "cambio_rojo",
    name: "Cambio Forzado: ROJO",
    pts: 0,
    category: "Estructural Tag Team",
    description: "Solo el Equipo Rojo debe hacer relevo obligatorio. El Equipo Azul mantiene a su peleador actual.",
    color: "#ff3838",
    icon: "🔴🔄"
  },
  {
    id: "cambio_azul",
    name: "Cambio Forzado: AZUL",
    pts: 0,
    category: "Estructural Tag Team",
    description: "Solo el Equipo Azul debe hacer relevo obligatorio. El Equipo Rojo mantiene a su peleador actual.",
    color: "#18dcff",
    icon: "🔵🔄"
  },
  {
    id: "entrenador_ciego",
    name: "El Entrenador Ciego",
    pts: 15,
    category: "Estructural Tag Team",
    description: "El peleador solo puede esquivar/bloquear. Solo puede lanzar un golpe cuando su compañero en la esquina grite '¡AHORA!'.",
    color: "#ff9f43",
    icon: "🗣️💥"
  },
  {
    id: "el_sacrificio",
    name: "El Sacrificio",
    pts: 20,
    category: "Estructural Tag Team",
    description: "El peleador en el ring debe resistir 10s acorralado en su esquina bloqueando. Si resiste, su compañero entra sin chocar guantes para un ataque sorpresa.",
    color: "#e84118",
    icon: "🩸⚔️"
  }
];

function getRulesForMode(mode) {
  if (mode === "tag_team") {
    return [...RULES_1V1, ...RULES_TAG_TEAM_EXTRA];
  }
  return [...RULES_1V1];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { RULES_1V1, RULES_TAG_TEAM_EXTRA, getRulesForMode };
}
