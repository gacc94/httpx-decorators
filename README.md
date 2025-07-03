<p align="center">
  <img src="https://img.shields.io/npm/v/httpx-decorators?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/httpx-decorators?style=flat-square" alt="npm downloads" />
</p>

<h1 align="center">HTTPX DECORATORS</h1>

<p align="center">
  <b>Una librería <i>framework-agnostic</i> en <code>TypeScript</code> para peticiones HTTP usando decoradores, con <code>Axios</code> y <code>Zod</code> para validación automática.</b>
</p>

---

## 🚀 Características Principales

| Característica | Descripción |
|:--------------:|:-----------|
| 🎯 <b>Decoradores Unificados</b> | Configuración completa en un solo objeto |
| 📋 <b>@Request()</b> | Validación automática del cuerpo de peticiones |
| 📤 <b>@Response()</b> | Captura de respuestas validadas/mapeadas |
| 🔒 <b>Tipado Fuerte</b> | TypeScript con inferencia automática de tipos Zod |
| ✅ <b>Validación Automática</b> | Request y response validation con Zod |
| 🌐 <b>Framework Agnóstico</b> | Compatible con Angular, React, Node.js, etc. |
| 🪝 <b>Sistema de Hooks</b> | Middlewares personalizables (onRequest, onResponse, onError) |
| ⚡ <b>Basado en Axios</b> | Cliente HTTP robusto y confiable |
| 🛡️ <b>Manejo de Errores</b> | Sistema completo con errores personalizados |
| 📦 <b>Extensible</b> | Arquitectura modular y fácil de extender |

---

## 📦 Instalación

```bash
npm install httpx-decorators axios zod reflect-metadata
```

---

## 🛠️ Configuración

Configura tu <code>tsconfig.json</code>:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

Importa <code>reflect-metadata</code> al inicio de tu aplicación:

```typescript
import 'reflect-metadata';
```

---

## 🎯 Uso Básico

### 1. Definir Schemas con Zod

```typescript
import { z } from 'zod';

// Schema para request
const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2)
});

// Schema para response
const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    token: z.string()
});

// Clase de dominio
class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        public readonly token: string
    ) {}

    static fromApiResponse(data: z.infer<typeof UserResponseSchema>): User {
        return new User(data.id, data.email, data.name, data.token);
    }
}
```

### 2. Crear Cliente API

```typescript
import {
    BaseHttpClient,
    GET, POST, PUT, DELETE,
    Request, Response, Query, Headers, Params,
    createMapper
} from 'httx-decorators';

class ApiClient extends BaseHttpClient {
    constructor() {
        super({
            baseURL: 'https://api.example.com',
            timeout: 10000,
            validateRequest: true,
            validateResponse: true
        });
    }

    /**
     * POST con @Request() para validar el cuerpo de la petición
     */
    @POST({
        url: '/users',
        requestSchema: CreateUserSchema,
        responseSchema: UserResponseSchema,
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) =>
            User.fromApiResponse(response)
        )
    })
    async createUser(
        @Request() userData: z.infer<typeof CreateUserSchema>,
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        console.log('Creating user:', userData.name);
        return user;
    }

    /**
     * GET sin @Request() (típico para métodos GET)
     */
    @GET({
        url: '/users/:id',
        responseSchema: UserResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) =>
            User.fromApiResponse(response)
        )
    })
    async getUserById(
        @Params() params: { id: string },
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        return user;
    }

    /**
     * PUT con @Request() para validar datos de actualización
     */
    @PUT({
        url: '/users/:id',
        requestSchema: UpdateUserSchema,
        responseSchema: UserResponseSchema,
        params: { id: true },
        headers: { Authorization: true }
    })
    async updateUser(
        @Request() updateData: z.infer<typeof UpdateUserSchema>,
        @Params() params: { id: string },
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        return user;
    }
}
```

### 3. Usar el Cliente

```typescript
const api = new ApiClient();

try {
    // Crear usuario con validación automática del @Request()
    const newUser = await api.createUser(
        {
            email: 'user@example.com',
            password: 'password123',
            name: 'John Doe'
        },
        { Authorization: 'Bearer token' },
        undefined as any // @Response() se inyecta automáticamente
    );

    console.log('User created:', newUser.name);

    // Obtener usuario por ID
    const user = await api.getUserById(
        { id: newUser.id },
        { Authorization: 'Bearer token' },
        undefined as any
    );

    console.log('User retrieved:', user.name);

} catch (error) {
    console.error('Error:', error);
}
```

---
## 🎛️ Decoradores Disponibles

---

### 🟢 Decoradores de Método HTTP

> Todos los decoradores HTTP reciben un objeto de configuración unificado:

```typescript
interface HttpDecoratorConfig {
    url: string; // URL del endpoint
    requestSchema?: ZodSchema; // Schema para validar request
    responseSchema?: ZodSchema; // Schema para validar response
    errorType?: ErrorClass; // Clase de error personalizada
    headers?: boolean | object; // Configuración de headers
    query?: boolean | object; // Configuración de query params
    params?: boolean | object; // Configuración de URL params
    timeout?: number; // Timeout específico
    validateRequest?: boolean; // Habilitar validación de request
    validateResponse?: boolean; // Habilitar validación de response
    mapper?: (response: any) => any; // Función de transformación
}
```

---

#### <span style="color:#1abc9c">@GET(config)</span>

```typescript
// Para peticiones GET. Normalmente no requiere @Request().
@GET({
    url: '/users/:id',
    responseSchema: UserSchema,
    params: { id: true }
})
async getUser(
    @Params() params: { id: string },
    @Response() user: User
): Promise<User> {
    return user;
}
```

#### <span style="color:#e67e22">@POST(config)</span>

```typescript
// Para peticiones POST. Usar con @Request() para validar el cuerpo.
@POST({
    url: '/users',
    requestSchema: CreateUserSchema,
    responseSchema: UserSchema
})
async createUser(
    @Request() userData: CreateUserRequest,
    @Response() user: User
): Promise<User> {
    return user;
}
```

#### <span style="color:#e74c3c">@PUT(config), @PATCH(config), @DELETE(config)</span>

```typescript
// Similar a POST, usar con @Request() cuando sea necesario validar el cuerpo.
@PUT({
    url: '/users/:id',
    requestSchema: UpdateUserSchema,
    responseSchema: UserSchema,
    params: { id: true }
})
async updateUser(
    @Request() updateData: UpdateUserRequest,
    @Params() params: { id: string },
    @Response() user: User
): Promise<User> {
    return user;
}
```

---

### 🟣 Decoradores de Parámetros

---

#### <b>@Request(schema?)</b>

> ⚠️ <b>Recomendación importante:</b> Usar principalmente en métodos <code>POST</code>, <code>PUT</code>, <code>PATCH</code>.

```typescript
@POST({
    url: '/users',
    requestSchema: CreateUserSchema
})
async createUser(
    @Request() userData: z.infer<typeof CreateUserSchema>
): Promise<User> {
    // userData ya está validado con CreateUserSchema
    return userData;
}
```

#### <b>@Response(schema?)</b>

> 🏁 <b>Debe colocarse al final del método</b> para asegurar que toda la validación se complete.

```typescript
@GET({
    url: '/users/:id',
    responseSchema: UserSchema,
    mapper: (data) => new User(data)
})
async getUser(
    @Params() params: { id: string },
    @Response() user: User
): Promise<User> {
    // user ya está validado y mapeado
    return user;
}
```

#### <b>@Query(key?, schema?)</b>

```typescript
// Para inyectar query parameters.
@GET({
    url: '/users',
    query: true
})
async getUsers(
    @Query() query: { page?: number; limit?: number }
): Promise<User[]> {
    // query contiene todos los query parameters
}
```

#### <b>@Headers(key?, schema?)</b>

```typescript
// Para inyectar headers.
@POST({
    url: '/users',
    headers: { Authorization: true }
})
async createUser(
    @Headers() headers: { Authorization: string }
): Promise<User> {
    // headers contiene los headers configurados
}
```

#### <b>@Params(key?, schema?)</b>

```typescript
// Para inyectar parámetros de URL.
@GET({
    url: '/users/:id',
    params: { id: true }
})
async getUser(
    @Params() params: { id: string }
): Promise<User> {
    // params contiene los parámetros de URL
}
```

---

## 🔄 Mappers

> Los mappers transforman automáticamente las respuestas validadas a objetos de dominio.

```typescript
@GET({
    url: '/users/:id',
    responseSchema: UserResponseSchema,
    mapper: createMapper((response: z.infer<typeof UserResponseSchema>) =>
        User.fromApiResponse(response)
    )
})
async getUser(
    @Response() user: User
): Promise<User> {
    // user ya es una instancia de la clase User
    return user;
}
```

---

## 🛡️ Validación y Manejo de Errores

### ✅ Validación Automática

```typescript
// El @Request() valida automáticamente con el requestSchema
@POST({
    url: '/users',
    requestSchema: CreateUserSchema // Validación automática
})
async createUser(
    @Request() userData: z.infer<typeof CreateUserSchema>
): Promise<User> {
    // Si userData no cumple el schema, se lanza ValidationError automáticamente
    return userData;
}
```

### 🚨 Manejo de Errores

```typescript
import { ErrorHandler, ValidationError, NetworkError } from 'httx-decorators';

try {
    const result = await api.createUser(invalidData);
} catch (error) {
    if (ErrorHandler.isValidationError(error)) {
        console.error('Validation errors:', ErrorHandler.getValidationErrors(error));
    } else if (ErrorHandler.isNetworkError(error)) {
        console.error('Network error:', ErrorHandler.getNetworkStatus(error));
    } else {
        console.error('Unknown error:', error);
    }
}
```

---


## 🪝 Sistema de Hooks

```typescript
const api = new ApiClient();

// Hook de request
api.addRequestHook(async (context) => {
    console.log(`Making request to ${context.url}`);
    return context;
});

// Hook de response
api.addResponseHook(async (response, context) => {
    console.log(`Received response from ${context.url}`);
    return response;
});

// Hook de error
api.addErrorHook(async (error, context) => {
    console.error(`Error in ${context.url}:`, error.message);
    return error;
});
```

---

## 📝 Buenas Prácticas

---

### 1️⃣ Uso de <code>@Request()</code>
- <b>POST, PUT, PATCH</b>: Usar <code>@Request()</code> para validar el cuerpo de la petición
- <b>GET, DELETE</b>: Normalmente no requieren <code>@Request()</code>

### 2️⃣ Posición de <code>@Response()</code>
- <b>Siempre al final</b>: Colocar <code>@Response()</code> como último parámetro del método

### 3️⃣ Validación Request/Response
- <b>requestSchema</b>: Define el schema para validar <code>@Request()</code>
- <b>responseSchema</b>: Define el schema para validar <code>@Response()</code>
- <b>mapper</b>: Transforma la respuesta validada a objetos de dominio

### 4️⃣ Configuración de Decoradores

```typescript
// ✅ Buena práctica
@POST({
    url: '/users',
    requestSchema: CreateUserSchema, // Valida @Request()
    responseSchema: UserResponseSchema, // Valida @Response()
    headers: { Authorization: true }, // Habilita headers específicos
    errorType: ValidationError // Error personalizado
})
async createUser(
    @Request() userData: CreateUserRequest,
    @Headers() headers: { Authorization: string },
    @Response() user: User // Al final
): Promise<User> {
    return user;
}
```

---

## 🏗️ Arquitectura

```text
src/
├── types/       # Interfaces y tipos TypeScript con JSDoc
├── decorators/  # Decoradores HTTP con @Request() y JSDoc completo
├── metadata/    # Sistema de metadatos con validación
├── client/      # Cliente HTTP con soporte para @Request()
├── errors/      # Manejo de errores
└── examples/    # Ejemplos ejecutables completos
```

---

## 🚀 Ejemplo Ejecutable

Ejecuta el ejemplo completo:

```bash
npm run dev
```

Este comando ejecuta <code>src/examples/basic-usage.ts</code> que demuestra:

- Uso de <code>@Request()</code> para validar peticiones POST/PUT
- Uso de <code>@Response()</code> para capturar respuestas
- Validación automática con Zod
- Manejo de errores
- Mappers para transformar respuestas

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License

---

<p align="center">
  <b>httx-decorators</b> - Simplificando las peticiones HTTP con decoradores unificados, validación automática y tipado fuerte.
</p>
