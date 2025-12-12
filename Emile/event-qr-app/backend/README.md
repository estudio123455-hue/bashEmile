# Event QR App - Backend API

Backend API para la aplicación de eventos con QR y pagos PayPal.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
PORT=3001
JWT_SECRET=tu-clave-secreta-muy-segura
PAYPAL_CLIENT_ID=tu-client-id-de-paypal
PAYPAL_CLIENT_SECRET=tu-client-secret-de-paypal
PAYPAL_MODE=sandbox
```

### 3. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📋 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| PUT | `/api/auth/profile` | Actualizar perfil |

### Eventos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/events` | Listar eventos |
| GET | `/api/events/:id` | Obtener evento |

### PayPal

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/paypal/create-order` | Crear orden de pago |
| POST | `/api/paypal/capture-order` | Capturar pago |
| GET | `/api/paypal/order/:id` | Estado de orden |
| POST | `/api/paypal/demo-payment` | Pago demo (testing) |

### Tickets

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/tickets/generate` | Generar ticket |
| GET | `/api/tickets` | Listar mis tickets |
| GET | `/api/tickets/:id` | Obtener ticket |
| POST | `/api/tickets/:id/refresh-qr` | Refrescar QR |
| POST | `/api/tickets/:id/validate` | Validar ticket |

### Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/webhooks/paypal` | Webhook de PayPal |

## 🔐 Autenticación

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

## 💳 Configurar PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com/dashboard/applications)
2. Crea una aplicación Sandbox
3. Copia el Client ID y Secret
4. Configura las variables de entorno

## 🧪 Modo Demo

Si no configuras PayPal, el backend funciona en modo demo:
- Los pagos se simulan automáticamente
- Útil para desarrollo y testing

## 📁 Estructura

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── paypal.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Ticket.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── paypal.js
│   │   ├── tickets.js
│   │   └── webhooks.js
│   └── index.js
├── .env.example
├── package.json
└── README.md
```

## 🔄 Flujo de Pago

```
1. Frontend: Usuario selecciona evento y cantidad
2. POST /api/paypal/create-order
3. Backend: Crea orden en PayPal, devuelve approvalUrl
4. Frontend: Redirige a PayPal para pago
5. PayPal: Usuario aprueba pago
6. POST /api/paypal/capture-order
7. Backend: Captura pago, actualiza orden
8. POST /api/tickets/generate
9. Backend: Genera ticket con QR
10. Frontend: Muestra ticket al usuario
```

## 🛡️ Seguridad

- Passwords hasheados con bcrypt
- JWT para autenticación
- QR tokens temporales (30 segundos)
- Validación de webhooks PayPal
- CORS configurado

## 📝 Notas

- En desarrollo usa almacenamiento en memoria
- Para producción, configura MongoDB
- Los QR se regeneran cada 30 segundos para seguridad
