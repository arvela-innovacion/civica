# Cívica v6: Firebase Realtime Database + Cloudinary

## 1. Firebase
1. Crea un proyecto en Firebase Console.
2. Añade una aplicación Web.
3. Activa **Realtime Database**.
4. Para una demo pública, importa `firebase-rules.json` en la pestaña Rules.
5. Copia `apiKey`, `authDomain`, `databaseURL`, `projectId` y `appId` en `js/config.js`.

IMPORTANTE: las reglas incluidas permiten escritura pública para que el prototipo funcione sin cuentas. Son adecuadas solo para demo/hackathon. Para producción hay que añadir Firebase Authentication y reglas que separen ciudadanía y ayuntamiento.

## 2. Cloudinary
1. Crea una cuenta.
2. Copia tu **Cloud name**.
3. Crea un **unsigned upload preset** limitado a imágenes.
4. Pon `cloudName` y el nombre del preset en `js/config.js`.
5. No pongas API Secret en JavaScript.

El navegador reduce la foto a un máximo de 1600 px y JPEG ~78% antes de subirla. Firebase solo guarda la URL HTTPS devuelta por Cloudinary.

## 3. Activar modo online
En `js/config.js`, cambia:
`DEMO_MODE: true`
por:
`DEMO_MODE: false`

## Arquitectura
GitHub Pages -> HTML/CSS/JS
- Firebase Realtime Database: JSON de incidencias, estados, +1 e historial
- Cloudinary: fotografías
- En Firebase solo se guarda `photoUrl`

## Nota de seguridad
La v6 prioriza simplicidad y demostración. Con escritura pública cualquiera que conozca la base podría intentar modificar datos. Antes de uso municipal real, activa autenticación y reglas por roles.

## v10: Authentication
Activa **Authentication → Sign-in method → Anonymous** en Firebase. La aplicación usa una identidad anónima por navegador para evitar confirmaciones +1 repetidas y para guardar seguimientos personales.

Las reglas v10 requieren `auth != null` para escribir incidencias y restringen `votes` y `follows` al UID del usuario.

### Importante sobre roles
La interfaz ya separa Ciudadanía, Ayuntamiento y Cuadrilla, pero una autorización municipal fuerte necesita Custom Claims o un backend/Cloud Function que asigne roles. No uses la lista de UIDs del JavaScript como mecanismo de seguridad. Para un piloto real, este es el siguiente endurecimiento obligatorio.

## v12: roles y permisos

### Modelo
- `citizen`: identidad anónima. Puede crear avisos, confirmar una vez y seguir incidencias.
- `municipal`: puede validar, asignar, descartar, fusionar y gestionar incidencias.
- `crew`: solo puede modificar incidencias cuya `crew` coincide con su cuadrilla.

### Demo
Con `DEMO_MODE: true`, abre `acceso.html` y cambia libremente entre Ciudadanía, Ayuntamiento y Cuadrilla. Esto sirve para pruebas de UX.

### Firebase real
La seguridad real se basa en `/roles/{uid}` dentro de Realtime Database, no en ocultar botones.

Ejemplo de datos que un administrador debe crear desde consola/backend:
```
roles/
  UID_OPERADOR_1/
    role: municipal
  UID_CUADRILLA_1/
    role: crew
    crew: "Viales 2"
```
Las reglas incluidas bloquean la escritura de `/roles` desde clientes.

IMPORTANTE: el frontend actual usa las listas `MUNICIPAL_UIDS` / `CREW_UIDS` para decidir qué interfaz abrir, mientras que las reglas de Firebase usan `/roles` como autoridad de seguridad. Para un despliegue real, sincroniza ambos o sustituye la detección de interfaz por una lectura segura de `/roles/{uid}` / Custom Claims. Nunca confíes en una lista JavaScript como barrera de seguridad.

## v13 Pilot Ready

### Login profesional
Activa Firebase Authentication → Email/Password para operadores y cuadrillas. Crea las cuentas desde Firebase y asigna su UID en `/roles`.

### Roles reales
```
roles/{uid}/role = "municipal"
roles/{uid}/role = "crew"
roles/{uid}/crew = "Viales 2"
```
El cliente lee únicamente su propio rol. `/roles` no puede escribirse desde el navegador.

### Auditoría
La v13 añade `/audit/{incidentId}/{eventId}`. Las reglas solo permiten crear eventos nuevos, no editarlos ni borrarlos desde cliente. Para un entorno regulado, la opción más fuerte sigue siendo escribir auditoría y transiciones desde Cloud Functions/Admin SDK.

### SLA
Los objetivos actuales son configurables en `js/workflow-v13.js`: agua y señalización 8h, bache/alumbrado 24h, limpieza 48h, mobiliario/otro 72h. Son valores de demostración, no compromisos normativos.

### Patrones recurrentes
`ayuntamiento/patrones.html` agrupa incidencias de la misma categoría a menos de ~120m. Es una heurística de prototipo, no un análisis GIS oficial.
