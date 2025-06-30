import { z } from 'zod';
import { BaseHttpClient, GET, POST, PUT, DELETE, Body, Header, Query, Param } from '../index';
import { UserRequestSchema, UserResponseSchema, UserListResponseSchema, CreatePostSchema, PostResponseSchema } from './schemas';

export class ApiClient extends BaseHttpClient {
    constructor(baseURL: string) {
        super({
            baseURL,
            timeout: 10000,
            validateResponse: true,
        });
    }

    // Autenticación
    @POST('auth/signin', UserResponseSchema)
    async signIn(
        @Body(UserRequestSchema) payload: z.infer<typeof UserRequestSchema>,
        @Header('User-Agent') userAgent: string = 'HttpDecorators/1.0'
    ): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    @POST('auth/signup', UserResponseSchema)
    async signUp(@Body(UserRequestSchema) payload: z.infer<typeof UserRequestSchema>): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    // Usuarios
    @GET('users', UserListResponseSchema)
    async getUsers(
        @Query() filters: { page?: number; limit?: number; search?: string },
        @Header('Authorization') token: string
    ): Promise<z.infer<typeof UserListResponseSchema>> {
        return {} as z.infer<typeof UserListResponseSchema>;
    }

    @GET('users/:id', UserResponseSchema)
    async getUserById(@Param('id') userId: string, @Header('Authorization') token: string): Promise<z.infer<typeof UserResponseSchema>> {
        return {} as z.infer<typeof UserResponseSchema>;
    }

    // Posts
    @POST('posts', PostResponseSchema)
    async createPost(
        @Body(CreatePostSchema) payload: z.infer<typeof CreatePostSchema>,
        @Header('Authorization') token: string
    ): Promise<z.infer<typeof PostResponseSchema>> {
        return {} as z.infer<typeof PostResponseSchema>;
    }

    @PUT('posts/:id', PostResponseSchema)
    async updatePost(
        @Param('id') postId: string,
        @Body(CreatePostSchema) payload: Partial<z.infer<typeof CreatePostSchema>>,
        @Header('Authorization') token: string
    ): Promise<z.infer<typeof PostResponseSchema>> {
        return {} as z.infer<typeof PostResponseSchema>;
    }

    @DELETE('posts/:id')
    async deletePost(@Param('id') postId: string, @Header('Authorization') token: string): Promise<void> {
        return;
    }

    // Método para configurar token de autorización
    public setAuthToken(token: string): void {
        this.setDefaultHeader('Authorization', `Bearer ${token}`);
    }

    public clearAuthToken(): void {
        this.removeDefaultHeader('Authorization');
    }
}
