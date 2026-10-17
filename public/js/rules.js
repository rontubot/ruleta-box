// Reglas oficiales "La Velada del Caos"
const RULES_1V1 = [
  {
    id: "el_manco",
    name: "El Manco",
    pts: 10,
    targetTeam: null, // Afecta a ambos
    category: "Combate",
    description: "Una mano a la espalda o pegada al cuerpo. Solo se permite pelear con la mano libre.",
    color: "#ff4757",
    icon: "🥊🚫"
  },
  {
    id: "pies_cemento",
    name: "Pies de Cemento",
    pts: 10,
    targetTeam: null,
    category: "Combate",
    description: "Prohibido dar pasos o saltos. Solo se permite esquivar con el movimiento del torso y bloquear.",
    color: "#747d8c",
    icon: "🧱🦵"
  },
  {
    id: "solo_jab",
    name: "Solo Jab",
    pts: 10,
    targetTeam: null,
    category: "Combate",
    description: "Solo se permiten golpes rectos con la mano adelantada. Ganchos y cruzados están prohibidos.",
    color: "#2ed573",
    icon: "🥊⚡"
  },
  {
    id: "guardia_invertida",
    name: "Guardia Invertida",
    pts: 10,
    targetTeam: null,
    category: "Combate",
    description: "Cambio obligatorio de postura (los diestros pasan a zurdos; los zurdos a diestros).",
    color: "#ffa502",
    icon: "🔄👊"
  },
  {
    id: "cuerpo_a_cuerpo",
    name: "Cuerpo a Cuerpo",
    pts: 10,
    targetTeam: null,
    category: "Combate",
    description: "Prohibidos estrictamente los golpes a la cabeza. Solo zonas al torso permitidas.",
    color: "#eccc68",
    icon: "🛡️🥊"
  },
  {
    id: "la_zona_segura",
    name: "La Zona Segura",
    pts: 15,
    targetTeam: null,
    category: "Combate",
    description: "Se gana el bono si al finalizar el tiempo del reto, el peleador mantiene al menos un pie dentro de la marca central del ring.",
    color: "#3742fa",
    icon: "🎯⭐"
  }
];

const RULES_TAG_TEAM_EXTRA = [
  {
    id: "relevo_obligatorio",
    name: "¡Relevo Obligatorio!",
    pts: 0,
    targetTeam: null, // Ambos
    category: "Estructural Tag Team",
    description: "¡Ambos equipos deben hacer el relevo de inmediato! Ir a las esquinas y chocar guantes con su compañero.",
    color: "#9b59b6",
    icon: "🔔🔁"
  },
  {
    id: "cambio_rojo",
    name: "Cambio: ROJO",
    pts: 0,
    targetTeam: "red",
    category: "Estructural Tag Team",
    description: "Solo el Equipo Rojo debe hacer relevo obligatorio. El Equipo Azul mantiene a su peleador actual en el ring.",
    color: "#ff3838",
    icon: "🔴🔄"
  },
  {
    id: "cambio_azul",
    name: "Cambio: AZUL",
    pts: 0,
    targetTeam: "blue",
    category: "Estructural Tag Team",
    description: "Solo el Equipo Azul debe hacer relevo obligatorio. El Equipo Rojo mantiene a su peleador actual en el ring.",
    color: "#18dcff",
    icon: "🔵🔄"
  },
  {
    id: "entrenador_ciego_rojo",
    name: "Ciego: ROJO",
    fullName: "El Entrenador Ciego (ROJO)",
    pts: 15,
    targetTeam: "red",
    category: "Reto Equipo Rojo",
    description: "¡Reto exclusivo para EQUIPO ROJO! El peleador Rojo en el ring solo esquiva o bloquea. Solo puede golpear cuando su compañero en la esquina grite '¡AHORA!'. Si conecta tras el grito, gana los puntos.",
    color: "#ff4757",
    icon: "🔴🗣️"
  },
  {
    id: "entrenador_ciego_azul",
    name: "Ciego: AZUL",
    fullName: "El Entrenador Ciego (AZUL)",
    pts: 15,
    targetTeam: "blue",
    category: "Reto Equipo Azul",
    description: "¡Reto exclusivo para EQUIPO AZUL! El peleador Azul en el ring solo esquiva o bloquea. Solo puede golpear cuando su compañero en la esquina grite '¡AHORA!'. Si conecta tras el grito, gana los puntos.",
    color: "#00d2d3",
    icon: "🔵🗣️"
  },
  {
    id: "el_sacrificio_rojo",
    name: "Sacrificio: ROJO",
    fullName: "El Sacrificio (ROJO)",
    pts: 20,
    targetTeam: "red",
    category: "Reto Equipo Rojo",
    description: "¡Reto exclusivo para EQUIPO ROJO! El peleador Rojo en el ring debe resistir 10s acorralado en su esquina bloqueando golpes del rival. Si resiste sin salir, gana +20 pts y su compañero entra sin chocar guantes para ataque sorpresa.",
    color: "#c0392b",
    icon: "🔴🩸"
  },
  {
    id: "el_sacrificio_azul",
    name: "Sacrificio: AZUL",
    fullName: "El Sacrificio (AZUL)",
    pts: 20,
    targetTeam: "blue",
    category: "Reto Equipo Azul",
    description: "¡Reto exclusivo para EQUIPO AZUL! El peleador Azul en el ring debe resistir 10s acorralado en su esquina bloqueando golpes del rival. Si resiste sin salir, gana +20 pts y su compañero entra sin chocar guantes para ataque sorpresa.",
    color: "#0984e3",
    icon: "🔵🩸"
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
