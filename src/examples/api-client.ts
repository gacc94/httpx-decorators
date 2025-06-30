import { z } from 'zod';
import { BaseHttpClient, GET, POST, PUT, DELETE, RequestParams } from '../index';
import {
    UserSignInSchema,
    UserSignUpSchema,
    CreatePostSchema,
    UpdateUserSchema,
    UserResponseSchema,
    PostResponseSchema,
    UserListResponseSchema,
    PostListResponseSchema,
    AuthenticationError,
    ValidationError,
    NotFoundError,
} from './schemas';

export class ApiClient extends BaseHttpClient {
    constructor(baseURL: string) {
        super({
            baseURL,
            timeout: 10000,
            validateResponse: true,
            validateRequest: true,
        });
    }

    // Autenticación
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

    @POST({
        url: '/auth/signup',
        requestSchema: UserSignUpSchema,
        responseSchema: UserResponseSchema,
        errorType: ValidationError,
        headers: { 'Content-Type': true },
    })
    async signUp(params: {
        body: z.infer<typeof UserSignUpSchema>;
        headers?: { 'Content-Type'?: string };
    }): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    // Usuarios
    @GET({
        url: '/users',
        responseSchema: UserListResponseSchema,
        query: true,
        headers: { Authorization: true },
    })
    async getUsers(params: {
        query?: { page?: number; limit?: number; search?: string };
        headers: { Authorization: string };
    }): Promise<z.infer<typeof UserListResponseSchema>> {
        return {} as z.infer<typeof UserListResponseSchema>;
    }

    @GET({
        url: '/users/:id',
        responseSchema: UserResponseSchema,
        errorType: NotFoundError,
        params: { id: true },
        headers: { Authorization: true },
    })
    async getUserById(params: { params: { id: string }; headers: { Authorization: string } }): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    @PUT({
        url: '/users/:id',
        requestSchema: UpdateUserSchema,
        responseSchema: UserResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
    })
    async updateUser(params: {
        params: { id: string };
        body: z.infer<typeof UpdateUserSchema>;
        headers: { Authorization: string };
    }): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    @DELETE({
        url: '/users/:id',
        params: { id: true },
        headers: { Authorization: true },
        errorType: NotFoundError,
    })
    async deleteUser(params: { params: { id: string }; headers: { Authorization: string } }): Promise<void> {
        return;
    }

    // Posts
    @POST({
        url: '/posts',
        requestSchema: CreatePostSchema,
        responseSchema: PostResponseSchema,
        headers: { Authorization: true },
    })
    async createPost(params: {
        body: z.infer<typeof CreatePostSchema>;
        headers: { Authorization: string };
    }): Promise<z.infer<typeof PostResponseSchema>> {
        return {} as z.infer<typeof PostResponseSchema>;
    }

    @GET({
        url: '/posts',
        responseSchema: PostListResponseSchema,
        query: true,
        headers: { Authorization: true },
    })
    async getPosts(params: {
        query?: { page?: number; limit?: number; authorId?: string };
        headers: { Authorization: string };
    }): Promise<z.infer<typeof PostListResponseSchema>> {
        return {} as z.infer<typeof PostListResponseSchema>;
    }

    @GET({
        url: '/posts/:id',
        responseSchema: PostResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
        errorType: NotFoundError,
    })
    async getPostById(params: { params: { id: string }; headers: { Authorization: string } }): Promise<z.infer<typeof PostResponseSchema>> {
        return {} as z.infer<typeof PostResponseSchema>;
    }

    @PUT({
        url: '/posts/:id',
        requestSchema: CreatePostSchema,
        responseSchema: PostResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
    })
    async updatePost(params: {
        params: { id: string };
        body: Partial<z.infer<typeof CreatePostSchema>>;
        headers: { Authorization: string };
    }): Promise<z.infer<typeof PostResponseSchema>> {
        return {} as z.infer<typeof PostResponseSchema>;
    }

    @DELETE({
        url: '/posts/:id',
        params: { id: true },
        headers: { Authorization: true },
        errorType: NotFoundError,
    })
    async deletePost(params: { params: { id: string }; headers: { Authorization: string } }): Promise<void> {
        return;
    }

    // Métodos de utilidad
    public setAuthToken(token: string): void {
        this.setDefaultHeader('Authorization', `Bearer ${token}`);
    }

    public clearAuthToken(): void {
        this.removeDefaultHeader('Authorization');
    }

    // Configurar hooks personalizados
    public setupAuthHooks(): void {
        this.addRequestHook(async (context) => {
            console.log(`🔐 Authenticating request to ${context.url}`);
            return context;
        });

        this.addErrorHook(async (error, context) => {
            if (error.code === 'NETWORK_ERROR' && error.details?.response?.status === 401) {
                console.log('🚫 Authentication expired, clearing token');
                this.clearAuthToken();
            }
            return error;
        });
    }
}
