# HTTP Decorators

Una librería framework-agnostic en TypeScript que permite realizar peticiones HTTP usando decoradores unificados, con Axios para las llamadas y Zod para validación automática de request y response.

## 🚀 Características Principales

- **🎯 Decoradores Unificados**: Configuración completa en un solo objeto
- **🔒 Tipado Fuerte**: TypeScript con inferencia automática de tipos Zod
- **✅ Validación Automática**: Request y response validation con Zod
- **🌐 Framework Agnóstico**: Compatible con Angular, React, Node.js, etc.
- **🪝 Sistema de Hooks**: Middlewares personalizables (onRequest, onResponse, onError)
- **⚡ Basado en Axios**: Cliente HTTP robusto y confiable
- **🛡️ Manejo de Errores**: Sistema completo con errores personalizados
- **📦 Extensible**: Arquitectura modular y fácil de extender

## 📦 Instalación

npm install http-decorators axios zod reflect-metadata

## 🛠️ Configuración

Configura tu `tsconfig.json`:

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

Importa `reflect-metadata` al inicio de tu aplicación:

```typescript
import 'reflect-metadata';
```

## 🎯 Nueva API con Decoradores Unificados

### Sintaxis Anterior vs Nueva

**❌ Sintaxis Anterior (v1.x):**

@POST('auth/signin', UserResponseSchema)
async signIn(
@Body(UserRequestSchema) payload: UserRequest,
@Header('Authorization') token: string
): Promise<UserResponse> { ... }

**✅ Nueva Sintaxis (v2.x):**

@POST({
url: '/auth/signin',
requestSchema: UserRequestSchema,
responseSchema: UserResponseSchema,
errorType: AuthError,
headers: { Authorization: true }
})
async signIn(params: {
body: UserRequest;
headers: { Authorization: string };
}): Promise<UserResponse> { ... }

## 📖 Uso Básico

### 1. Definir Schemas con Zod

```typescript
import { z } from 'zod';

const UserSignInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    token: z.string(),
});

// Error personalizado
class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
```

### 2. Crear Cliente API

```typescript
import { BaseHttpClient, GET, POST, PUT, DELETE } from 'http-decorators';

class ApiClient extends BaseHttpClient {
    constructor() {
        super({
            baseURL: 'https://api.example.com',
            timeout: 10000,
            validateRequest: true,
            validateResponse: true,
        });
    }

    @POST({
        url: '/auth/signin',
        requestSchema: UserSignInSchema,
        responseSchema: UserResponseSchema,
        errorType: AuthenticationError,
        validateRequest: true,
        validateResponse: true,
    })
    async signIn(params: {
        body: z.infer<typeof UserSignInSchema>;
        headers?: { 'User-Agent'?: string };
    }): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    @GET({
        url: '/users/:id',
        responseSchema: UserResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
        errorType: NotFoundError,
    })
    async getUserById(params: { params: { id: string }; headers: { Authorization: string } }): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    @GET({
        url: '/users',
        responseSchema: UserListResponseSchema,
        query: true,
        headers: { Authorization: true },
    })
    async getUsers(params: {
        query?: { page?: number; limit?: number };
        headers: { Authorization: string };
    }): Promise<z.infer<typeof UserListResponseSchema>> {
        return {} as z.infer<typeof UserListResponseSchema>;
    }
}
```

### 3. Usar el Cliente

```typescript
const api = new ApiClient();

try {
    // Sign in con nueva sintaxis
    const user = await api.signIn({
        body: {
            email: 'user@example.com',
            password: 'password123',
        },
        headers: {
            'User-Agent': 'MyApp/1.0',
        },
    });

    // Configurar token para futuras requests
    api.setAuthToken(user.token);

    // Obtener usuario específico
    const userDetails = await api.getUserById({
        params: { id: '123' },
        headers: { Authorization: `Bearer ${user.token}` },
    });

    // Obtener lista de usuarios con filtros
    const users = await api.getUsers({
        query: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${user.token}` },
    });
} catch (error) {
    console.error('Error:', error);
}
```

## 🎛️ Configuración de Decoradores

### Opciones Disponibles

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
}
```

### Ejemplos de Configuración

```typescript
// Configuración básica
@GET({ url: '/users' })

// Con validación de response
@GET({
  url: '/users',
  responseSchema: UserListSchema
})

// Con headers específicos
@POST({
  url: '/posts',
  requestSchema: CreatePostSchema,
  responseSchema: PostResponseSchema,
  headers: { Authorization: true, 'Content-Type': true }
})

// Con parámetros de URL
@GET({
  url: '/users/:id/posts/:postId',
  responseSchema: PostSchema,
  params: { id: true, postId: true },
  headers: { Authorization: true }
})

// Con query parameters
@GET({
  url: '/search',
  responseSchema: SearchResultsSchema,
  query: { q: true, page: true, limit: true }
})

// Con error personalizado
@POST({
  url: '/auth/login',
  requestSchema: LoginSchema,
  responseSchema: AuthResponseSchema,
  errorType: AuthenticationError
})
```

## 🪝 Sistema de Hooks/Middlewares

```typescript
const api = new ApiClient('https://api.example.com');

// Hook de request
api.addRequestHook(async (context) => {
    console.log(`Making request to ${context.url}`);

    // Agregar timestamp
    if (!context.headers) context.headers = {};
    context.headers['X-Request-Time'] = new Date().toISOString();

    return context;
});

// Hook de response
api.addResponseHook(async (response, context) => {
    console.log(`Received response from ${context.url}`);

    // Procesar respuesta
    if (typeof response === 'object') {
        response._requestTime = new Date().toISOString();
    }

    return response;
});

// Hook de error
api.addErrorHook(async (error, context) => {
    console.error(`Error in ${context.url}:`, error.message);

    // Log para analytics
    analytics.track('api_error', {
        url: context.url,
        error: error.message,
    });

    return error;
});
```

## 🛡️ Manejo de Errores

```typescript
import { ErrorHandler, ValidationError, NetworkError } from 'http-decorators';

try {
  const result = await api.someMethod({ ... });
} catch (error) {
  if (ErrorHandler.isValidationError(error)) {
    console.error('Validation errors:', ErrorHandler.getValidationErrors(error));
  } else if (ErrorHandler.isNetworkError(error)) {
    console.error('Network error:', ErrorHandler.getNetworkStatus(error));
  } else if (ErrorHandler.isCustomError(error)) {
    console.error('Custom error:', error.originalError);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## 🏗️ Arquitectura

```
src/
├── types/          # Interfaces y tipos TypeScript
├── decorators/     # Decoradores HTTP unificados
├── metadata/       # Sistema de metadatos simplificado
├── client/         # Cliente HTTP base con hooks
├── errors/         # Manejo de errores
└── examples/       # Ejemplos de uso
```

## 🔄 Migración desde v1.x

### Cambios Principales

1. **Decoradores Unificados**: Un solo objeto de configuración
2. **Parámetros Unificados**: Un solo parámetro `params` en lugar de múltiples
3. **Configuración Explícita**: Headers, query, params deben declararse
4. **Hooks Sistema**: Nuevos hooks para request/response/error

### Guía de Migración

**Antes (v1.x):**

@POST('users', UserResponseSchema)
async createUser(
@Body(UserRequestSchema) user: UserRequest,
@Header('Authorization') token: string
): Promise<UserResponse> { ... }

**Después (v2.x):**

@POST({
url: '/users',
requestSchema: UserRequestSchema,
responseSchema: UserResponseSchema,
headers: { Authorization: true }
})
async createUser(params: {
body: UserRequest;
headers: { Authorization: string };
}): Promise<UserResponse> { ... }

## 📝 Ejemplos Completos

Ver los archivos de ejemplo en `/src/examples/` para casos de uso completos y avanzados.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🔗 Enlaces

- [Documentación completa](https://github.com/your-repo/http-decorators)
- [Ejemplos avanzados](https://github.com/your-repo/http-decorators/tree/main/examples)
- [Changelog](https://github.com/your-repo/http-decorators/blob/main/CHANGELOG.md)

---

**HTTP Decorators v2.0** - Simplificando las peticiones HTTP con decoradores unificados y tipado fuerte.
