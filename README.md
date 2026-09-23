# Cívica

**Cívica** es un prototipo de plataforma web para comunicar, priorizar, gestionar y cerrar incidencias urbanas conectando ciudadanía, Ayuntamiento y cuadrillas de campo.

La idea central es sencilla: una persona detecta un problema en la vía pública, lo reporta desde el móvil con ubicación, descripción y opcionalmente fotografía; Cívica intenta evitar duplicados y permite que otras personas confirmen la misma incidencia; el Ayuntamiento dispone de una cola operativa priorizada y puede validar y asignar trabajos; la cuadrilla ejecuta la intervención y documenta la resolución; finalmente, la ciudadanía puede consultar el resultado y confirmar si el problema está realmente solucionado.

> **Estado del proyecto:** prototipo / piloto técnico. La versión actual es **v13.1**, revisada y optimizada antes de las pruebas online. No debe considerarse todavía un sistema municipal de producción.

---

## 1. Objetivos

Cívica busca:

- reducir la fricción al reportar desde un móvil;
- evitar que un mismo problema genere decenas de avisos independientes;
- convertir confirmaciones ciudadanas en una señal útil;
- ofrecer una prioridad comprensible y explicable;
- separar claramente ciudadanía, Ayuntamiento y cuadrillas;
- facilitar una interfaz de campo sencilla;
- cerrar el ciclo mostrando qué se hizo;
- conservar trazabilidad;
- funcionar con una arquitectura pequeña y fácil de desplegar.

La prioridad calculada por Cívica es **orientativa**. Ayuda a ordenar trabajo, pero no sustituye criterios técnicos, legales, de emergencia o de planificación municipal.

---

## 2. Arquitectura

Cívica es una web estática publicable directamente en GitHub Pages.

```text
Navegador
   │
   ├── GitHub Pages
   │      └── HTML + CSS + JavaScript
   │
   ├── Firebase Authentication
   │      ├── sesión anónima → ciudadanía
   │      └── email/password → personal profesional
   │
   ├── Firebase Realtime Database
   │      ├── incidents
   │      ├── roles
   │      ├── votes
   │      ├── follows
   │      ├── reviews
   │      └── audit
   │
   ├── Cloudinary
   │      └── fotografías
   │
   ├── Leaflet + OpenStreetMap
   │      └── mapas
   │
   └── Nominatim
          └── dirección aproximada
```

No hay framework de frontend, proceso de compilación ni servidor propio. `js/backend.js` abstrae Firebase frente al modo demo basado en `localStorage`.

### Servicios

- **GitHub Pages:** frontend.
- **Firebase Realtime Database:** datos JSON.
- **Firebase Authentication:** identidad y acceso profesional.
- **Cloudinary:** fotografías.
- **Leaflet + OpenStreetMap:** mapas.
- **Nominatim:** geocodificación inversa del prototipo.

---

## 3. Despliegue previsto

```text
Proyecto Firebase: civica-arvela
Dominio web:       civica.arvelainnova.es
Realtime Database: europe-west1
```

El dominio personalizado debe añadirse también a los dominios autorizados de Firebase Authentication.

**Nunca publiques** contraseñas, claves privadas, `service-account.json`, API Secret de Cloudinary u otros secretos de servidor. La configuración pública de Firebase Web está diseñada para ejecutarse en el navegador; la seguridad real depende de Authentication y Security Rules.

---

## 4. Perfiles

### Ciudadanía

No necesita registro explícito. En modo Firebase se crea una sesión anónima con UID.

Puede:

- consultar incidencias;
- reportar;
- indicar ubicación;
- añadir fotografía;
- detectar posibles duplicados;
- confirmar mediante `+1`;
- seguir incidencias;
- consultar “Mis incidencias”;
- ver historial y resolución;
- confirmar una resolución o solicitar revisión.

### Ayuntamiento

Accede mediante email/contraseña y necesita:

```json
{
  "role": "municipal"
}
```

en `/roles/{uid}`.

Puede:

- consultar la cola operativa;
- filtrar y buscar;
- revisar prioridad;
- validar;
- asignar cuadrillas;
- cambiar estados según el workflow;
- añadir notas internas;
- descartar;
- fusionar duplicados;
- consultar carga, estadísticas y patrones;
- generar auditoría.

### Cuadrilla

Necesita:

```json
{
  "role": "crew",
  "crew": "Viales 2"
}
```

Puede actuar únicamente sobre incidencias asignadas a su cuadrilla.

---

## 5. Flujo ciudadano

El reporte funciona como asistente:

1. categoría;
2. ubicación;
3. comprobación de duplicados;
4. confirmación de incidencia existente o continuación;
5. fotografía, detalles y riesgo;
6. envío;
7. pantalla de éxito.

Categorías actuales:

- Bache
- Alumbrado
- Limpieza
- Señalización
- Mobiliario urbano
- Agua / alcantarillado
- Otro

### Duplicados

El prototipo busca incidencias abiertas próximas:

- misma categoría dentro de aproximadamente 150 m;
- cualquier categoría dentro de aproximadamente 60 m.

Se excluyen `Resuelta`, `Descartada` y `Duplicada`.

El ciudadano puede elegir **“Sí, es este · Yo también lo he visto”** en vez de crear otro aviso.

### +1

Cada identidad puede confirmar una incidencia una sola vez. En Firebase se registra bajo `/votes/{incidentId}/{uid}`.

### Seguimiento

Los seguimientos se almacenan por UID en `/follows` y alimentan “Mis incidencias” y el perfil.

---

## 6. Operación municipal

El centro de operaciones presenta:

- atención inmediata;
- pendientes de validar;
- sin asignar;
- en curso;
- buscador y filtros;
- mapa;
- carga de cuadrillas;
- prioridad;
- zona aproximada;
- SLA orientativo.

La ficha municipal utiliza la misma capa `Backend` y la máquina de estados centralizada.

---

## 7. Trabajo de cuadrilla

La interfaz está orientada a móvil.

```text
Asignada
   ↓
En curso
   ↓
Resuelta
```

La cuadrilla puede navegar hasta la incidencia, iniciar el trabajo, añadir nota pública y fotografía final y marcar la incidencia como resuelta.

---

## 8. Cierre ciudadano

Una incidencia resuelta puede mostrar:

- fotografía inicial;
- fotografía final;
- nota de resolución;
- tiempo aproximado;
- historial;
- confirmaciones.

El ciudadano puede responder:

- `✓ Sí, está resuelto`
- `Sigue habiendo un problema`

La valoración se almacena en `/reviews`; el ciudadano no modifica directamente la incidencia.

---

## 9. Estados y workflow

Estados:

```text
Reportada
Validada
Asignada
En curso
Resuelta
Reabierta
Descartada
Duplicada
```

Transiciones municipales:

```text
Reportada → Validada | Descartada | Duplicada
Validada  → Asignada | Descartada | Duplicada
Asignada  → En curso | Validada | Descartada
En curso  → Resuelta | Asignada
Resuelta  → Reabierta
Reabierta → Validada | Asignada
```

Cuadrilla:

```text
Asignada → En curso
En curso → Resuelta
```

La lógica está centralizada en `js/workflow-v13.js`.

Para producción convendría garantizar las transiciones sensibles también desde servidor/Cloud Functions.

---

## 10. Prioridad explicable

La prioridad va de 0 a 100:

| Componente | Máximo |
|---|---:|
| Gravedad | 35 |
| Confirmaciones +1 | 25 |
| Reputación | 15 |
| Antigüedad | 15 |
| Riesgo de categoría | 10 |
| **Total** | **100** |

Riesgo actual:

| Categoría | Puntos |
|---|---:|
| Agua / alcantarillado | 10 |
| Señalización | 9 |
| Bache | 8 |
| Alumbrado | 6 |
| Mobiliario urbano | 5 |
| Otro | 4 |
| Limpieza | 3 |

Son parámetros del prototipo y deben validarse con el municipio.

---

## 11. SLA orientativo

Valores actuales de demostración:

| Categoría | Horas |
|---|---:|
| Agua / alcantarillado | 8 |
| Señalización | 8 |
| Bache | 24 |
| Alumbrado | 24 |
| Limpieza | 48 |
| Mobiliario urbano | 72 |
| Otro | 72 |

**No son compromisos de servicio ni valores normativos.**

---

## 12. Patrones

`ayuntamiento/patrones.html` agrupa incidencias históricas cercanas de la misma categoría, aproximadamente dentro de 120 m.

Es una heurística de prototipo, no un GIS ni un heatmap estadístico oficial.

Una evolución debería incorporar ventana temporal, límites administrativos reales y clustering espacial robusto.

---

## 13. Modelo de datos Firebase

```text
/
├── incidents/{incidentId}
├── roles/{uid}
├── votes/{incidentId}/{uid}
├── follows/{uid}/{incidentId}
├── reviews/{incidentId}/{uid}
└── audit/{incidentId}/{eventId}
```

Ejemplo municipal:

```json
{
  "roles": {
    "UID_FIREBASE": {
      "role": "municipal"
    }
  }
}
```

Ejemplo cuadrilla:

```json
{
  "roles": {
    "UID_FIREBASE": {
      "role": "crew",
      "crew": "Viales 2"
    }
  }
}
```

Los roles no deben asignarse desde el cliente público.

---

## 14. Authentication

Se utilizan:

### Anonymous

Ciudadanía. Proporciona UID sin obligar a crear una cuenta.

### Email/Password

Ayuntamiento y cuadrillas.

Un profesional necesita además su entrada en `/roles/{uid}`.

Para este despliegue debe autorizarse:

```text
civica.arvelainnova.es
```

en Firebase Authentication.

---

## 15. Security Rules

`firebase-rules.json` contiene las reglas de v13.1.

Principios:

- sin lectura global de toda la base;
- incidencias públicamente legibles;
- roles no modificables desde el cliente;
- votos por UID;
- seguimientos por UID;
- reviews por UID;
- auditoría restringida a perfiles profesionales;
- acciones profesionales condicionadas por rol.

Antes de un piloto real deben probarse tanto operaciones permitidas como denegadas.

---

## 16. Fotografías / Cloudinary

Las imágenes no se guardan en Realtime Database.

```text
foto
 ↓
compresión en navegador
 ↓
Cloudinary
 ↓
secure_url
 ↓
Firebase guarda la URL
```

La compresión limita aproximadamente el lado mayor a 1600 px y genera JPEG comprimido.

Para el prototipo se contempla un **unsigned upload preset**. Para exposición pública conviene estudiar carga firmada mediante backend/Cloud Function, límites y controles antiabuso.

Nunca publiques el **Cloudinary API Secret**.

---

## 17. Configuración

Archivo:

```text
js/config.js
```

Esquema:

```js
window.CIVICA_CONFIG = {
  DEMO_MODE: true,

  FIREBASE: {
    apiKey: "...",
    authDomain: "...",
    databaseURL: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  },

  CLOUDINARY: {
    cloudName: "...",
    uploadPreset: "..."
  },

  AUTH: {
    MUNICIPAL_UIDS: [],
    CREW_UIDS: {},
    DEMO_DEFAULT_ROLE: "citizen"
  }
};
```

`DEMO_MODE: true` usa `localStorage`.

`DEMO_MODE: false` utiliza Firebase.

En Firebase real, la autoridad de roles reside en `/roles`.

---

## 18. GitHub Pages

No existe build step. El repositorio puede publicarse directamente.

Dominio previsto:

```text
https://civica.arvelainnova.es
```

Este paquete incluye un archivo:

```text
CNAME
```

con ese dominio.

Además hay que:

1. configurar Pages en GitHub;
2. configurar el DNS del subdominio;
3. establecer el Custom domain;
4. activar HTTPS;
5. añadir el dominio a Firebase Authorized domains.

---

## 19. Estructura del repositorio

```text
/
├── index.html
├── reportar.html
├── mapa.html
├── incidencia.html
├── mis-incidencias.html
├── perfil.html
├── acceso.html
├── cuadrilla.html
├── pruebas.html
│
├── ayuntamiento/
│   ├── index.html
│   ├── incidencia.html
│   ├── cuadrillas.html
│   ├── estadisticas.html
│   └── patrones.html
│
├── js/
│   ├── config.js
│   ├── app.js
│   ├── backend.js
│   ├── auth.js
│   ├── workflow-v13.js
│   ├── report-v9.js
│   ├── detail.js
│   ├── map-list.js
│   ├── ops-v11.js
│   ├── admin-detail.js
│   ├── crew-v11.js
│   ├── analytics.js
│   ├── patterns-v13.js
│   ├── home.js
│   └── test-tools.js
│
├── css/
├── firebase-rules.json
├── SETUP-FIREBASE-CLOUDINARY.md
├── CNAME
└── README.md
```

---

## 20. Modo demo

El modo demo permite:

- presentar sin infraestructura;
- probar interfaces;
- ejecutar un recorrido guiado;
- desarrollar sin escribir en Firebase.

Utiliza `localStorage`.

`pruebas.html` incluye el recorrido de QA y `js/test-tools.js` permite reinicializar datos.

Las pruebas en demo no sustituyen la validación de permisos reales de Firebase.

---

## 21. Auditoría

Cívica diferencia:

### Historial legible

Ejemplos:

```text
Estado: Validada → Asignada
Nueva confirmación ciudadana
Ciudadanía solicita revisión
```

### Auditoría estructurada

Eventos técnicos en `/audit/{incidentId}`.

Para trazabilidad regulatoria, la auditoría debería generarse en servidor con garantías adicionales de identidad e inmutabilidad.

---

## 22. Reputación

Etiquetas actuales:

- ≥ 80: Muy fiable
- ≥ 60: Fiable
- ≥ 40: En desarrollo
- < 40: Nueva cuenta

Es todavía un mecanismo demostrativo. Faltan reglas reales de evolución, resistencia al abuso, privacidad y validación.

La intención es utilizarla como señal interna, no como ranking público.

---

## 23. Privacidad y RGPD

Antes de despliegue público deben definirse, entre otros:

- responsable del tratamiento;
- base jurídica;
- política de privacidad;
- plazos de conservación;
- procedimiento de supresión;
- tratamiento de fotografías;
- personas, matrículas o domicilios captados accidentalmente;
- EXIF;
- ubicación;
- logs;
- proveedores;
- gestión de cuentas profesionales.

El prototipo técnico no sustituye este análisis.

---

## 24. Seguridad: estado y pendientes

Existe:

- Firebase Authentication;
- roles;
- Security Rules;
- UID para acciones ciudadanas;
- restricciones de cuadrilla;
- votos únicos;
- reviews separadas;
- auditoría;
- ausencia de secretos de servidor en frontend.

Pendiente para producción:

- transiciones sensibles validadas en servidor;
- Cloud Functions/backend;
- uploads firmados;
- rate limiting;
- anti-spam;
- moderación;
- validación estricta de esquemas;
- App Check si procede;
- backups;
- monitorización;
- tests automatizados de reglas;
- altas/bajas profesionales;
- logs de seguridad.

---

## 25. Mapas y geocodificación

El navegador puede solicitar ubicación y el usuario puede ajustar la posición.

Leaflet representa mapas basados en OpenStreetMap.

Nominatim obtiene una dirección aproximada.

Para un servicio con volumen debe revisarse la política de uso y elegir una estrategia/proveedor adecuado. No debe diseñarse una carga masiva contra el Nominatim público.

---

## 26. Zonas

`Workflow.zone(i)` usa:

1. `i.zone`, si existe;
2. información aproximada de dirección;
3. `Sin zona`.

No equivale a distritos municipales oficiales.

Una evolución correcta sería incorporar límites GeoJSON oficiales y resolver cada coordenada contra esos polígonos.

---

## 27. Estadísticas

El panel municipal incluye métricas aproximadas de los últimos 30 días:

- recibidas;
- resueltas;
- tasa de resolución;
- tiempo medio;
- categorías;
- estados.

Deben validarse con datos reales antes de convertirse en indicadores de gestión.

---

## 28. Accesibilidad y UX

El proyecto incorpora:

- flujo móvil;
- asistente paso a paso;
- categorías visuales;
- feedback de formularios;
- jerarquía municipal;
- interfaz de cuadrilla;
- confirmaciones;
- mejoras básicas de accesibilidad.

Antes de despliegue público conviene una auditoría WCAG y pruebas con teclado, lector de pantalla, contraste, zoom y dispositivos reales.

---

## 29. QA recomendado

### Ciudadanía

1. abrir ventana privada;
2. crear incidencia sin foto;
3. comprobar `/incidents`;
4. crear otra cercana;
5. comprobar duplicado;
6. usar +1;
7. intentar repetir +1;
8. seguir;
9. comprobar “Mis incidencias”.

### Ayuntamiento

1. entrar por `acceso.html`;
2. iniciar sesión municipal;
3. comprobar rol;
4. localizar incidencia;
5. validar;
6. revisar prioridad;
7. revisar mapa;
8. añadir nota;
9. probar filtros;
10. revisar estadísticas/patrones.

### Cuadrilla

Cuando exista:

1. crear usuario crew;
2. asignar cuadrilla;
3. asignar incidencia;
4. iniciar sesión;
5. comprobar aislamiento;
6. iniciar trabajo;
7. finalizar;
8. añadir foto y nota.

### Cierre

1. volver como ciudadano;
2. comprobar `Resuelta`;
3. comprobar antes/después;
4. confirmar;
5. solicitar revisión en otra prueba;
6. comprobar `/reviews`.

### Seguridad

Intentar explícitamente:

- leer roles ajenos;
- escribir roles;
- votar dos veces;
- modificar incidencia como ciudadano;
- operar como cuadrilla sobre incidencia ajena;
- transición no permitida;
- escribir auditoría sin rol.

---

## 30. Revisión v13.1

La v13.1 realizó una pasada de estabilidad y coherencia:

- eliminó scripts antiguos;
- unificó seguimiento;
- corrigió `reporterUid`;
- corrigió historial demo;
- unificó ficha municipal sobre `Backend` + `Workflow`;
- corrigió IDs Firebase string;
- restringió estados arbitrarios;
- separó historial y auditoría;
- movió feedback ciudadano a `/reviews`;
- excluyó cerradas de duplicados;
- corrigió reglas que podían exponer nodos privados;
- endureció permisos básicos de cuadrilla;
- limpió claves de test actuales.

Comprobaciones estáticas:

```text
JavaScript syntax:   OK
Rules JSON:          válido
Referencias locales: sin rutas rotas detectadas
JS huérfano:         no detectado
```

No sustituyen pruebas reales en navegador.

---

## 31. Limitaciones conocidas

- prototipo sin backend propio;
- transiciones no garantizadas completamente por servidor;
- Cloudinary unsigned solo para piloto;
- reputación demostrativa;
- zonas no oficiales;
- SLA de demostración;
- patrones heurísticos;
- analítica básica;
- geocodificación externa;
- sin moderación;
- sin rate limiting;
- sin notificaciones;
- sin PWA/offline;
- sin API/exportación municipal;
- sin gestión avanzada de usuarios;
- sin tests E2E automatizados;
- privacidad/RGPD pendiente de formalización.

---

## 32. Roadmap

### Fase 1 — Piloto técnico

- GitHub Pages;
- Firebase real;
- incidencias reales de prueba;
- login municipal;
- Cloudinary;
- pruebas E2E;
- corrección de fricciones.

### Fase 2 — Piloto controlado

- cuadrillas;
- permisos endurecidos;
- zonas oficiales;
- SLA/categorías municipales;
- moderación;
- privacidad;
- backups;
- métricas validadas.

### Fase 3 — Preparación pública

- backend/Cloud Functions;
- operaciones sensibles server-side;
- uploads firmados;
- App Check/rate limiting;
- anti-spam;
- observabilidad;
- accesibilidad formal;
- cumplimiento y retención;
- tests automatizados;
- recuperación ante incidencias.

---

## 33. Principios de producto

1. Reportar debe ser rápido.
2. Un duplicado debe convertirse en confirmación, no en ruido.
3. La prioridad debe poder explicarse.
4. El Ayuntamiento debe saber qué requiere atención ahora.
5. La cuadrilla necesita interfaz de campo, no un panel administrativo.
6. El antes/después aporta confianza.
7. “Resuelta” administrativamente no garantiza que el ciudadano la perciba resuelta.
8. La reputación no debe convertirse en ranking público.
9. La simplicidad técnica es una ventaja mientras no comprometa seguridad.
10. Antes de añadir funciones, hay que probar el flujo completo.

---

## 34. Desarrollo local

No existe build step.

Utiliza un servidor HTTP estático para desarrollo local. Evita depender de `file://` cuando pruebes autenticación, geolocalización u otras APIs de origen.

Modificar `firebase-rules.json` en GitHub **no actualiza Firebase automáticamente**: las reglas deben publicarse también en Firebase Console.

---

## 35. Qué no es todavía

Cívica no es todavía:

- un sistema de emergencias;
- un gestor oficial de expedientes;
- un GIS municipal;
- un CRM;
- un sistema certificado de identidad;
- una plataforma de órdenes de trabajo completa;
- una aplicación preparada para información sensible;
- un producto listo para exposición pública masiva.

El producto final debe indicar claramente qué hacer ante un peligro inmediato o una emergencia.

---

## 36. Versión

**Cívica v13.1**

Objetivo inmediato:

```text
Ciudadanía
   ↓
Reporte
   ↓
Firebase
   ↓
Ayuntamiento
   ↓
Asignación
   ↓
Cuadrilla
   ↓
Resolución
   ↓
Ciudadanía
```

La prioridad ahora es validar este recorrido y corregir errores, estados imposibles y fricciones antes de aumentar funcionalidades.

---

## 37. Documentación adicional

- `SETUP-FIREBASE-CLOUDINARY.md` — configuración técnica.
- `firebase-rules.json` — reglas de Realtime Database.
- `pruebas.html` — recorrido de QA.

---

## 38. Licencia

El repositorio no incluye actualmente una licencia explícita. Antes de publicarlo como proyecto abierto o permitir reutilización por terceros, añade `LICENSE` con la licencia elegida y revisa las condiciones de dependencias y servicios externos.
