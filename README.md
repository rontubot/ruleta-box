# 🥊 LA VELADA DEL CAOS — Aplicación Oficial de Stream & Control

Sistema web en tiempo real desarrollado para eventos de boxeo en vivo con ruleta aleatoria, cronometraje oficial y mesa de jueces moderadora.

---

## 🚀 Inicio Rápido

1. **Instalar dependencias** (si aún no lo hiciste):
   ```bash
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm start
   ```

3. **Acceder a las interfaces**:
   - 📺 **Overlay para Stream (OBS / Espectadores)**: [http://localhost:3000/overlay](http://localhost:3000/overlay)
   - 🎛️ **Panel del Moderador / Jueces**: [http://localhost:3000/admin](http://localhost:3000/admin)

> 💡 **Nota de red local:** El moderador puede abrir el panel desde un celular, tablet o laptop conectada al mismo Wi-Fi ingresando a `http://TU_IP_LOCAL:3000/admin` (por ejemplo `http://192.168.1.50:3000/admin`).

---

## 📜 Mecánicas y Reglamento Implementado

### ⏱️ Estructura de Rounds y Pausas
- **3 Rounds Oficiales** de **1 minuto y medio (90 segundos)** de combate activo.
- **Pausa de Descanso de 1 minuto (60 segundos)** entre rounds.
- **Aviso "¡Segundos Afuera!"**: Suena y se muestra automáticamente cuando quedan 10 segundos de descanso para evacuar el ring y colocar bucales.
- **Campana de Boxeo**: Sonidos reales de campana metálica al inicio y cierre de cada asalto.
- **Tag Team**: Al sonar la campana de nuevo asalto, se exige el cambio de peleador obligatorio.

### 🎰 Ruleta del Caos (Giro cada 15 segundos)
- Gira de manera automática y obligatoria cada **15 segundos** (6 giros por round = 90s).
- Rueda animada en Canvas con efecto desacelerado y clics mecánicos.
- **Modalidad 1v1**: 6 reglas de combate (+10 y +15 pts):
  1. *El Manco (+10 pts)*: Una mano a la espalda.
  2. *Pies de Cemento (+10 pts)*: Prohibido dar pasos o saltos.
  3. *Solo Jab (+10 pts)*: Solo golpes rectos mano adelantada.
  4. *Guardia Invertida (+10 pts)*: Diestros a zurdos y viceversa.
  5. *Cuerpo a Cuerpo (+10 pts)*: Prohibidos golpes a la cabeza.
  6. *La Zona Segura (+15 pts)*: Mantener al menos un pie en el centro al sonar los 15s.
- **Modalidad Tag Team**: Incluye además los 5 eventos estructurales:
  7. *¡Relevo Obligatorio! (0 pts)*: Relevo en ambas esquinas.
  8. *Cambio Forzado Rojo (0 pts)*: Relevo obligatorio solo para Rojo.
  9. *Cambio Forzado Azul (0 pts)*: Relevo obligatorio solo para Azul.
  10. *El Entrenador Ciego (+15 pts)*: Golpea solo cuando su esquina grita "¡AHORA!".
  11. *El Sacrificio (+20 pts)*: Bloquea 10s acorralado en su esquina para ataque sorpresa del compañero.

### 🥊 Puntuación y Arbitraje
- **Golpes Limpios**: +1 Punto por golpe conectado en el ring.
- **Bonos de Ruleta**: Botones directos para asignar los +10, +15 o +20 pts según la regla activa a la Esquina Roja, Azul o a Ambos.
- **Penalizaciones y Faltas**: Botón de falta técnica que otorga automáticamente **+5 Puntos al rival**.
- **Cuenta de Protección (Standing 8-Count)**: Pausa el combate e inicia la cuenta regresiva de 8 segundos reglamentaria.
- **Recuperación por Golpe Bajo / Falta Accidental**: Pausa de hasta 1 minuto.

### 🏆 Deliberación de Jueces y Proclamación del Ganador
- Al completarse los 3 asaltos (o en cualquier momento por **TKO / Descalificación**):
  1. La pantalla de administración muestra el resumen de puntos, golpes y bonos.
  2. El moderador selecciona al ganador: **Rojo**, **Azul** o **Empate**.
  3. Selecciona el método: *Decisión Unánime, Decisión Dividida, TKO o Descalificación*.
  4. Presiona **"PROCLAMAR GANADOR AL STREAM"**.
  5. En el overlay de los espectadores se desata la celebración oficial con confeti de alta fidelidad en pantalla, fanfarria triunfal, banner gigante del vencedor y desglose de tarjetas.

---

## 🎥 Configuración en OBS Studio

1. En OBS, añade una nueva fuente de tipo **Navegador (Browser Source)**.
2. Configura la URL: `http://localhost:3000/overlay`
3. Ancho: `1920` / Alto: `1080` (o la resolución de tu lienzo de stream).
4. Marca la casilla **"Controlar el audio a través de OBS"** si deseas monitorear las campanas y efectos sonoros por el mezclador de OBS.
5. Haz clic en el botón flotante "Activar Audio" si tu navegador o navegador interno de OBS requiere interacción previa para reproducir sonido.
