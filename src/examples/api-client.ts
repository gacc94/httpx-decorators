import { z } from 'zod';
import { BaseHttpClient, GET, POST, PUT, DELETE, Request, Response, Query, Headers, Params, createMapper } from '../index';
import {
    UserSignInSchema,
    CreateUserSchema,
    UpdateUserSchema,
    CreatePostSchema,
    UserResponseSchema,
    PostResponseSchema,
    UserListResponseSchema,
    User,
    Post,
    AuthenticationError,
    ValidationError,
    NotFoundError,
} from './schemas';

/**
 * Cliente API que demuestra el uso de decoradores HTTP con @Request()
 */
export class ApiClient extends BaseHttpClient {
    constructor(baseURL: string) {
        super({
            baseURL,
            timeout: 10000,
            validateResponse: true,
            validateRequest: true,
        });
    }

    /**
     * Autenticación de usuario con @Request() para validar credenciales
     */
    @POST({
        url: '/auth/signin',
        requestSchema: UserSignInSchema,
        responseSchema: UserResponseSchema,
        errorType: AuthenticationError,
        headers: { 'User-Agent': true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) => User.fromApiResponse(response)),
    })
    async signIn(
        @Request() credentials: z.infer<typeof UserSignInSchema>,
        @Query() query: { remember?: boolean },
        @Headers() headers?: { 'User-Agent': string },
        @Response() user?: User
    ): Promise<User> {
        console.log('🔐 Signing in user:', credentials.email);
        console.log('📋 Remember me:', query.remember);
        console.log('🌐 User-Agent:', headers?.['User-Agent']);
        if (user) {
            console.log('✅ Authenticated user:', user.displayName);
        }
        return user!;
    }

    /**
     * Crear usuario con @Request() para validar datos de usuario
     */
    @POST({
        url: '/users',
        requestSchema: CreateUserSchema,
        responseSchema: UserResponseSchema,
        errorType: ValidationError,
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) => User.fromApiResponse(response)),
    })
    async createUser(
        @Request() userData: z.infer<typeof CreateUserSchema>,
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        console.log('👤 Creating user:', userData.name);
        console.log('📧 Email:', userData.email);
        console.log('✅ User created:', user.displayName);
        return user;
    }

    /**
     * Actualizar usuario con @Request() para validar datos de actualización
     */
    @PUT({
        url: '/users/:id',
        requestSchema: UpdateUserSchema,
        responseSchema: UserResponseSchema,
        params: { id: true },
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) => User.fromApiResponse(response)),
    })
    async updateUser(
        @Request() updateData: z.infer<typeof UpdateUserSchema>,
        @Params() params: { id: string },
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        console.log('✏️ Updating user ID:', params.id);
        console.log('📝 Update data:', updateData);
        console.log('✅ User updated:', user.displayName);
        return user;
    }

    /**
     * Obtener usuario por ID (GET sin @Request())
     */
    @GET({
        url: '/users/:id',
        responseSchema: UserResponseSchema,
        errorType: NotFoundError,
        params: { id: true },
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof UserResponseSchema>) => User.fromApiResponse(response)),
    })
    async getUserById(
        @Params() params: { id: string },
        @Headers() headers: { Authorization: string },
        @Response() user: User
    ): Promise<User> {
        console.log('👤 Retrieved user ID:', params.id);
        console.log('✅ User found:', user.displayName);
        return user;
    }

    /**
     * Obtener usuarios con query parameters (GET con @Request() opcional para query)
     */
    @GET({
        url: '/users',
        responseSchema: UserListResponseSchema,
        query: true,
        headers: { Authorization: true },
    })
    async getUsers(
        @Query() query?: { page?: number; limit?: number; search?: string },
        @Headers() headers?: { Authorization: string },
        @Response() usersData?: z.infer<typeof UserListResponseSchema>
    ): Promise<z.infer<typeof UserListResponseSchema>> {
        console.log('👥 Getting users with query:', query);
        console.log('📊 Total users found:', usersData?.total);
        return usersData!;
    }

    /**
     * Crear post con @Request() para validar contenido
     */
    @POST({
        url: '/posts',
        requestSchema: CreatePostSchema,
        responseSchema: PostResponseSchema,
        headers: { Authorization: true },
        mapper: createMapper((response: z.infer<typeof PostResponseSchema>) => Post.fromApiResponse(response)),
    })
    async createPost(
        @Request() postData: z.infer<typeof CreatePostSchema>,
        @Headers() headers: { Authorization: string },
        @Response() post: Post
    ): Promise<Post> {
        console.log('📝 Creating post:', postData.title);
        console.log('📄 Content length:', postData.content.length);
        console.log('🏷️ Tags:', postData.tags?.join(', ') || 'None');
        console.log('✅ Post created:', post.title);
        return post;
    }

    /**
     * Eliminar usuario
     */
    @DELETE({
        url: '/users/:id',
        params: { id: true },
        headers: { Authorization: true },
        errorType: NotFoundError,
    })
    async deleteUser(@Params() params: { id: string }, @Headers() headers: { Authorization: string }): Promise<void> {
        console.log('🗑️ Deleted user with ID:', params.id);
    }

    // Métodos de utilidad
    public setAuthToken(token: string): void {
        this.setDefaultHeader('Authorization', `Bearer ${token}`);
    }

    public clearAuthToken(): void {
        this.removeDefaultHeader('Authorization');
    }

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
