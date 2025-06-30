# HTTPX decorators

Una librería TypeScript agnóstica para realizar peticiones HTTP usando decoradores con validación automática mediante Zod. Compatible con Angular, React, Vue y cualquier framework.

## 🚀 Características

- ✅ **Decoradores HTTP**: `@GET`, `@POST`, `@PUT`, `@DELETE`, `@PATCH`
- ✅ **Validación automática**: Request y Response con Zod
- ✅ **TypeScript**: Tipos inferidos automáticamente
- ✅ **Framework agnóstico**: Angular, React, Vue, Node.js
- ✅ **Cliente HTTP robusto**: Basado en Axios
- ✅ **Interceptors**: Logging y manejo de errores
- ✅ **Path parameters**: Reemplazo automático en URLs
- ✅ **Query parameters**: Configuración flexible

## 📦 Instalación

```bash
npm install httpx-decorators
```

## 🔧 Configuración Inicial

### TypeScript Configuration

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "target": "ES2020",
        "lib": ["ES2020", "DOM"]
    }
}
```

### Importar reflect-metadata

```typescript
// En tu archivo principal (main.ts, index.ts, app.ts)
import 'reflect-metadata';
```

## 📖 Definición de Schemas

```typescript
import { z } from 'zod';

// Schema de usuario
export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
    createdAt: z.string().datetime(),
    role: z.enum(['admin', 'user', 'moderator']),
});

// Schema para crear usuario
export const CreateUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['user', 'moderator']).default('user'),
});

// Schema para actualizar usuario
export const UpdateUserSchema = CreateUserSchema.partial();

// Schema de respuesta paginada
export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        data: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
        hasNext: z.boolean(),
    });

// Schema de parámetros de búsqueda
export const SearchParamsSchema = z.object({
    q: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    sort: z.enum(['name', 'email', 'createdAt']).optional(),
});

// Tipos inferidos
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type PaginatedUsers = z.infer<ReturnType<typeof PaginatedResponse>>;
```

## 🏗️ Servicio Base

```typescript
import { POST, GET, PUT, DELETE, PATCH, HttpService } from 'httpx-decorators';

@HttpService({
    baseURL: 'https://api.example.com/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})
export class UserService {
    @GET('/users', PaginatedResponse(UserSchema))
    async getUsers(params?: SearchParams): Promise<PaginatedUsers> {
        return {} as PaginatedUsers;
    }

    @GET('/users/:id', UserSchema)
    async getUserById(id: number): Promise<User> {
        return {} as User;
    }

    @POST('/users', UserSchema, CreateUserSchema)
    async createUser(payload: CreateUser): Promise<User> {
        return {} as User;
    }

    @PUT('/users/:id', UserSchema, UpdateUserSchema)
    async updateUser(id: number, payload: UpdateUser): Promise<User> {
        return {} as User;
    }

    @PATCH('/users/:id/avatar', UserSchema, z.object({ avatar: z.string().url() }))
    async updateAvatar(id: number, payload: { avatar: string }): Promise<User> {
        return {} as User;
    }

    @DELETE('/users/:id', z.object({ success: z.boolean(), message: z.string() }))
    async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
        return {} as { success: boolean; message: string };
    }

    @GET('/users/search', z.array(UserSchema), undefined, {
        validateQuery: SearchParamsSchema,
    })
    async searchUsers(params: SearchParams): Promise<User[]> {
        return [] as User[];
    }
}
```

## 🅰️ Integración con Angular

### Service Injectable

```typescript
// user.service.ts
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AngularUserService extends UserService {
    // Wrapper para convertir Promise a Observable
    getUsers$(params?: SearchParams): Observable<PaginatedUsers> {
        return from(this.getUsers(params));
    }

    getUserById$(id: number): Observable<User> {
        return from(this.getUserById(id));
    }

    createUser$(payload: CreateUser): Observable<User> {
        return from(this.createUser(payload));
    }

    updateUser$(id: number, payload: UpdateUser): Observable<User> {
        return from(this.updateUser(id, payload));
    }

    deleteUser$(id: number): Observable<{ success: boolean; message: string }> {
        return from(this.deleteUser(id));
    }
}
```

### Component

```typescript
// user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { AngularUserService } from './user.service';

@Component({
    selector: 'app-user-list',
    template: `
        <div class="user-list">
            <button (click)="loadUsers()" [disabled]="loading">
                {{ loading ? 'Loading...' : 'Load Users' }}
            </button>

            <div *ngFor="let user of users" class="user-card">
                <h3>{{ user.name }}</h3>
                <p>{{ user.email }}</p>
                <span class="role">{{ user.role }}</span>
            </div>
        </div>
    `,
})
export class UserListComponent implements OnInit {
    users: User[] = [];
    loading = false;

    constructor(private userService: AngularUserService) {}

    ngOnInit() {
        this.loadUsers();
    }

    async loadUsers() {
        this.loading = true;
        try {
            const response = await this.userService.getUsers({ page: 1, limit: 10 });
            this.users = response.data;
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            this.loading = false;
        }
    }
}
```

## ⚛️ Integración con React

### Custom Hook

```typescript
// hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = useCallback(async (params?: SearchParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await userService.getUsers(params);
            setUsers(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = useCallback(async (payload: CreateUser) => {
        try {
            const newUser = await userService.createUser(payload);
            setUsers((prev) => [...prev, newUser]);
            return newUser;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
            throw err;
        }
    }, []);

    const updateUser = useCallback(async (id: number, payload: UpdateUser) => {
        try {
            const updatedUser = await userService.updateUser(id, payload);
            setUsers((prev) => prev.map((user) => (user.id === id ? updatedUser : user)));
            return updatedUser;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
            throw err;
        }
    }, []);

    const deleteUser = useCallback(async (id: number) => {
        try {
            await userService.deleteUser(id);
            setUsers((prev) => prev.filter((user) => user.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            throw err;
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    return {
        users,
        loading,
        error,
        loadUsers,
        createUser,
        updateUser,
        deleteUser,
    };
};
```

### Component

```tsx
// components/UserList.tsx
import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';

export const UserList: React.FC = () => {
    const { users, loading, error, createUser, deleteUser } = useUsers();
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            await createUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as 'user' | 'moderator',
            });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="user-list">
            <div className="header">
                <h2>Users</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? 'Cancel' : 'Add User'}</button>
            </div>

            {showCreateForm && (
                <form onSubmit={handleCreateUser} className="create-form">
                    <input name="name" placeholder="Name" required />
                    <input name="email" type="email" placeholder="Email" required />
                    <select name="role">
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                    </select>
                    <button type="submit">Create User</button>
                </form>
            )}

            <div className="users">
                {users.map((user) => (
                    <div key={user.id} className="user-card">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <span className={`role role-${user.role}`}>{user.role}</span>
                        <button onClick={() => deleteUser(user.id)} className="delete-btn">
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## 🟢 Integración con Vue 3

### Composable

```typescript
// composables/useUsers.ts
import { ref, computed } from 'vue';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const useUsers = () => {
    const users = ref<User[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const totalUsers = computed(() => users.value.length);

    const loadUsers = async (params?: SearchParams) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await userService.getUsers(params);
            users.value = response.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'An error occurred';
        } finally {
            loading.value = false;
        }
    };

    const createUser = async (payload: CreateUser) => {
        try {
            const newUser = await userService.createUser(payload);
            users.value.push(newUser);
            return newUser;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to create user';
            throw err;
        }
    };

    const updateUser = async (id: number, payload: UpdateUser) => {
        try {
            const updatedUser = await userService.updateUser(id, payload);
            const index = users.value.findIndex((user) => user.id === id);
            if (index !== -1) {
                users.value[index] = updatedUser;
            }
            return updatedUser;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to update user';
            throw err;
        }
    };

    const deleteUser = async (id: number) => {
        try {
            await userService.deleteUser(id);
            users.value = users.value.filter((user) => user.id !== id);
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to delete user';
            throw err;
        }
    };

    return {
        users: readonly(users),
        loading: readonly(loading),
        error: readonly(error),
        totalUsers,
        loadUsers,
        createUser,
        updateUser,
        deleteUser,
    };
};
```

### Component

```vue
<!-- components/UserList.vue -->
<template>
    <div class="user-list">
        <div class="header">
            <h2>Users ({{ totalUsers }})</h2>
            <button @click="showCreateForm = !showCreateForm">
                {{ showCreateForm ? 'Cancel' : 'Add User' }}
            </button>
        </div>

        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="error" class="error">Error: {{ error }}</div>

        <form v-if="showCreateForm" @submit.prevent="handleCreateUser" class="create-form">
            <input v-model="newUser.name" placeholder="Name" required />
            <input v-model="newUser.email" type="email" placeholder="Email" required />
            <select v-model="newUser.role">
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
            </select>
            <button type="submit" :disabled="loading">Create User</button>
        </form>

        <div class="users">
            <div v-for="user in users" :key="user.id" class="user-card">
                <h3>{{ user.name }}</h3>
                <p>{{ user.email }}</p>
                <span :class="`role role-${user.role}`">{{ user.role }}</span>
                <button @click="handleDeleteUser(user.id)" class="delete-btn">Delete</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUsers } from '../composables/useUsers';
import type { CreateUser } from '../schemas/user.schema';

const { users, loading, error, totalUsers, loadUsers, createUser, deleteUser } = useUsers();

const showCreateForm = ref(false);
const newUser = ref<CreateUser>({
    name: '',
    email: '',
    role: 'user',
});

const handleCreateUser = async () => {
    try {
        await createUser(newUser.value);
        newUser.value = { name: '', email: '', role: 'user' };
        showCreateForm.value = false;
    } catch (error) {
        console.error('Failed to create user:', error);
    }
};

const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
        await deleteUser(id);
    }
};

onMounted(() => {
    loadUsers();
});
</script>
```

## 🔐 Autenticación y Configuración Avanzada

### Configuración Global

```typescript
// config/http.config.ts
import { configureHttpClient, HttpClient } from 'httpx-decorators';

const httpClient = new HttpClient({
    baseURL: process.env.REACT_APP_API_URL || 'https://api.example.com/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Interceptor para autenticación
httpClient.addRequestInterceptor((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejo de errores
httpClient.addResponseInterceptor(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

configureHttpClient(httpClient);
```

### Servicio de Autenticación

```typescript
// services/auth.service.ts
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
    expiresIn: z.number(),
});

@HttpService({
    baseURL: 'https://api.example.com/v1/auth',
})
export class AuthService {
    @POST('/login', AuthResponseSchema, LoginSchema)
    async login(credentials: z.infer<typeof LoginSchema>): Promise<z.infer<typeof AuthResponseSchema>> {
        return {} as z.infer<typeof AuthResponseSchema>;
    }

    @POST('/logout', z.object({ success: z.boolean() }))
    async logout(): Promise<{ success: boolean }> {
        return {} as { success: boolean };
    }

    @GET('/me', UserSchema)
    async getCurrentUser(): Promise<User> {
        return {} as User;
    }
}
```

## 🧪 Testing

### Jest + TypeScript

```typescript
// __tests__/user.service.test.ts
import 'reflect-metadata';
import { UserService } from '../services/user.service';

// Mock axios
jest.mock('axios');

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();
    });

    test('should get users with valid response', async () => {
        const mockUsers = [{ id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', createdAt: new Date().toISOString() }];

        // Mock the HTTP response
        const mockResponse = {
            data: mockUsers,
            total: 1,
            page: 1,
            pageSize: 10,
            hasNext: false,
        };

        jest.spyOn(userService, 'getUsers').mockResolvedValue(mockResponse);

        const result = await userService.getUsers();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('John Doe');
    });

    test('should validate schema on create user', async () => {
        const invalidUser = {
            name: '', // Invalid: empty name
            email: 'invalid-email', // Invalid: not an email
            role: 'invalid-role', // Invalid: not in enum
        };

        await expect(userService.createUser(invalidUser as any)).rejects.toThrow();
    });
});
```

## 📚 API Reference

### Decoradores HTTP

| Decorador                                                | Descripción     | Parámetros                      |
| -------------------------------------------------------- | --------------- | ------------------------------- |
| `@GET(url, responseSchema?, requestSchema?, config?)`    | Petición GET    | url, schemas opcionales, config |
| `@POST(url, responseSchema?, requestSchema?, config?)`   | Petición POST   | url, schemas opcionales, config |
| `@PUT(url, responseSchema?, requestSchema?, config?)`    | Petición PUT    | url, schemas opcionales, config |
| `@DELETE(url, responseSchema?, requestSchema?, config?)` | Petición DELETE | url, schemas opcionales, config |
| `@PATCH(url, responseSchema?, requestSchema?, config?)`  | Petición PATCH  | url, schemas opcionales, config |

### Configuración de Request

```typescript
interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
    validateQuery?: ZodSchema; // Para validar query parameters
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
}
```

### HttpService Decorator

```typescript
@HttpService({
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
})
```

## 🚀 Características Avanzadas

### Path Parameters

```typescript
@GET('/users/:id/posts/:postId', PostSchema)
async getUserPost(userId: number, postId: number): Promise<Post> {
  return {} as Post;
}
```

### Query Parameters con Validación

```typescript
@GET('/users', z.array(UserSchema), undefined, {
  validateQuery: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    search: z.string().optional()
  })
})
async getUsers(params: { page: number; limit: number; search?: string }): Promise<User[]> {
  return [] as User[];
}
```

### Transformaciones Personalizadas

```typescript
@POST('/users', UserSchema, CreateUserSchema, {
  transformRequest: (data) => ({
    ...data,
    createdAt: new Date().toISOString()
  }),
  transformResponse: (data) => ({
    ...data,
    fullName: `${data.firstName} ${data.lastName}`
  })
})
async createUser(payload: CreateUser): Promise<User> {
  return {} as User;
}
```

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features, por favor abre un [issue](https://github.com/tu-usuario/httpx-decorators/issues).
