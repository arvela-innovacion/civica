# Cívica v6

Prototipo de reporte y gestión municipal de incidencias urbanas, preparado para GitHub Pages.

## Conserva
- Área ciudadana y área municipal separadas.
- Reporte móvil con foto, geolocalización, categoría, descripción y urgencia.
- Mapa Leaflet + OpenStreetMap.
- Detección de posibles duplicados y +1.
- Prioridad explicable 0–100.
- Reputación de demostración.
- Estados, cuadrillas, dashboard municipal, filtros y mapa operativo.
- Historial de la incidencia y evidencia de resolución.

## Nuevo en v6
Se elimina Supabase y se simplifica la persistencia:
- **Firebase Realtime Database** almacena las incidencias como JSON compartido.
- **Cloudinary** almacena las fotografías.
- Firebase solo guarda la URL de cada foto.
- El mapa público se actualiza en tiempo real cuando cambia Firebase.
- Las imágenes se reducen en el navegador antes de subirlas.
- `DEMO_MODE: true` mantiene el fallback localStorage para probar sin configurar nada.

Consulta `SETUP-FIREBASE-CLOUDINARY.md`.

## Seguridad
Las reglas incluidas son deliberadamente simples para una demo sin login. No deben usarse tal cual para un despliegue municipal real. La siguiente fase de endurecimiento sería Firebase Authentication + roles + reglas de escritura diferenciadas.

## Novedades v7
- Dashboard municipal reorientado a la jornada: atención inmediata, validar, asignar y trabajos en curso.
- Nueva vista móvil `cuadrilla.html` para trabajo de campo.
- La cuadrilla puede abrir la ubicación en Maps, iniciar trabajo y finalizarlo.
- Al finalizar puede subir foto posterior y una nota pública.
- Vista ciudadana de resolución con comparación **ANTES / DESPUÉS**.
- Tiempo aproximado hasta resolución y número de confirmaciones.
- Se conserva Firebase Realtime Database + Cloudinary + fallback localStorage.

Nota: la vista de cuadrilla sigue sin autenticación en esta demo. Debe protegerse antes de un despliegue real.

## Novedades v8 — UX y pruebas completas
- Nueva página `pruebas.html` que guía el test de extremo a extremo.
- Escenario reiniciable con incidencias en distintos estados.
- Checklist de observación para pruebas con usuarios.
- Mensajes de progreso y error más claros durante el reporte.
- CTA municipal contextual: “Validar / asignar” cuando corresponde.
- Mejor manejo de errores en la vista de cuadrilla.
- Confirmación antes de resolver sin nota pública.
- Navegación de retorno más clara en gestión municipal.

### Guion recomendado de prueba
1. Reinicia el escenario desde `pruebas.html`.
2. Actúa como ciudadano y reporta/confirmar un problema.
3. Actúa como Ayuntamiento: valida, asigna y revisa prioridad.
4. Actúa como cuadrilla: inicia, documenta y resuelve.
5. Vuelve como ciudadano y comprueba el resultado.
6. Anota cada duda, clic inesperado, texto confuso o paso que necesite explicación.

No expliques la interfaz al participante durante la primera pasada: observa dónde duda. Esas dudas son candidatas prioritarias para la siguiente iteración.

## Novedades v9 — Pre-test
Implementadas las mejoras 1, 2, 3, 4, 5, 8 y 10:
1. Reporte convertido en wizard móvil de 4 pasos.
2. Duplicados integrados como paso propio antes de crear el aviso.
3. Urgencia ciudadana sustituida por una pregunta de riesgo comprensible.
4. Nueva pantalla de éxito para incidencias nuevas y confirmaciones existentes.
5. Dirección aproximada mediante geocodificación inversa de OpenStreetMap/Nominatim, conservando coordenadas.
8. Ayuntamiento puede descartar avisos con motivo o fusionarlos como duplicados, sumando confirmaciones.
10. Pulido de accesibilidad y UX: foco visible, botones táctiles mayores, feedback junto al formulario, confirmaciones en acciones destructivas y terminología más consistente.

### Nota
La geocodificación inversa necesita conexión a Internet. Si falla, el flujo continúa con las coordenadas y “Ubicación seleccionada”.

## Novedades v10 — Confianza, seguimiento y métricas
- Firebase Anonymous Authentication preparado para ciudadanía.
- Una confirmación (+1) por UID/navegador autenticado.
- El botón cambia a “✓ Tú también lo has confirmado”.
- Seguimiento de incidencias con `follows/{uid}/{incidentId}`.
- Las incidencias recién creadas o confirmadas se siguen automáticamente.
- Nueva página `mis-incidencias.html`.
- Nueva página municipal `ayuntamiento/estadisticas.html`.
- KPIs de últimos 30 días: recibidas, resueltas, tasa y tiempo medio.
- Distribución por categoría y estado.
- Reglas Firebase actualizadas para votes/follows por UID.

Pendiente antes de piloto real: autorización fuerte por roles mediante Custom Claims/backend para Ayuntamiento y Cuadrillas.

## Novedades v11 — Ayuntamiento y Cuadrillas
### Ayuntamiento
- Centro de operaciones rediseñado como bandeja de trabajo diaria.
- KPIs accionables: atención inmediata, por validar, sin cuadrilla y en curso.
- Búsqueda y filtros simplificados.
- Cada incidencia muestra prioridad, antigüedad, confirmaciones, dirección y motivo operativo.
- Validación rápida sin abrir la ficha.
- Asignación rápida de cuadrilla desde la propia bandeja.
- Mapa operativo lateral.
- Resumen de carga de cuadrillas.
- Nueva vista de recursos/cuadrillas con sus trabajos y prioridades.
- Ficha de incidencia con contexto de gestión más claro.
- Se conservan descarte, fusión de duplicados, historial y estadísticas.

### Cuadrilla
- Vista móvil reorganizada en Pendientes / En curso / Finalizados.
- Tarjetas de trabajo más claras, con dirección, confirmaciones y prioridad.
- Acceso directo a navegación.
- Flujo explícito Iniciar trabajo → Finalizar trabajo.
- Nota de resolución obligatoria.
- Foto final opcional con confirmación si falta.
- Mensajes tipo toast para confirmar acciones y errores.
- Cambio automático a Finalizados al cerrar un trabajo.

Los roles/permisos fuertes se dejan deliberadamente para la siguiente fase, tal como se acordó.

## Novedades v12 — Roles y acceso
- Nueva puerta de entrada `acceso.html`.
- Tres perfiles: Ciudadanía, Ayuntamiento y Cuadrilla.
- Modo demo permite cambiar de perfil para pruebas.
- Páginas municipales exigen rol municipal.
- Vista de campo exige rol de cuadrilla y fija automáticamente la cuadrilla asignada.
- Backend incorpora `municipalUpdate()` y `crewUpdate()` con comprobaciones de rol.
- Una cuadrilla no puede actualizar desde la aplicación un trabajo asignado a otra.
- Nuevas incidencias guardan `reporterUid`.
- Reglas Firebase v12 incluyen `/roles/{uid}` como autoridad y bloquean la edición de roles desde clientes.
- Ciudadanía conserva autenticación anónima, +1 único y seguimientos.

Para producción, la asignación de roles debe realizarla un administrador/backend; nunca el propio cliente.

## Novedades v13 — Pilot Ready
- Login profesional Email/Password preparado para Ayuntamiento y Cuadrillas.
- Rol real leído desde `/roles/{uid}` cuando Firebase está activo.
- Máquina de estados centralizada por rol.
- Transiciones inválidas bloqueadas en la aplicación.
- Auditoría estructurada y ruta `/audit` append-only en Firebase.
- SLA por categoría, vencimiento y tiempo restante visible en Operaciones.
- Ciudadanía puede confirmar una resolución o solicitar revisión; no reabre directamente.
- Nueva vista municipal `Patrones` para detectar incidencias recurrentes por proximidad/categoría.
- Mantiene modo demo para pruebas de los tres perfiles.

Los SLA incluidos son ejemplos de producto y deben configurarse con el Ayuntamiento piloto.

## v13.1 — revisión y optimización previa a pruebas
- Eliminados scripts antiguos no utilizados (`admin.js`, `crew.js`, `report.js`, `list.js`).
- Unificado el seguimiento ciudadano: Perfil y Mis incidencias usan el mismo Backend.
- Corregida creación de incidencias: `reporterUid` se obtiene correctamente antes de guardar.
- Historial funciona también en DEMO_MODE.
- Ficha municipal reescrita para usar Backend/Workflow en lugar de una segunda lógica localStorage.
- IDs Firebase se tratan como strings.
- La ficha municipal respeta la máquina de estados y ya no ofrece estados arbitrarios.
- La resolución de cuadrilla y la auditoría quedan separadas: historial legible + auditoría estructurada.
- Restaurada la valoración ciudadana de una resolución mediante `/reviews`, sin permitir editar la incidencia.
- Detección de duplicados excluye Resueltas, Descartadas y Duplicadas.
- Reglas Firebase corregidas: se eliminó `.read: true` global, que anulaba la privacidad de roles/follows.
- Auditoría solo es legible por Ayuntamiento; roles/follows/reviews quedan aislados.
- Herramienta de reset limpia las claves actuales de votos/seguimientos/revisiones.
