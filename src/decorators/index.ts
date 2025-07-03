import { z } from 'zod';
import { MetadataManager } from '../metadata';
import { HttpMethod, HttpDecoratorConfig, EndpointMetadata, ParameterMetadata } from '../types';

/**
 * Crea un decorador HTTP unificado para el método especificado
 * @param method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
 * @returns Función decoradora que acepta configuración unificada
 */
function createHttpDecorator(method: HttpMethod) {
    return function <
        TRequest extends z.ZodSchema = z.ZodSchema,
        TResponse extends z.ZodSchema = z.ZodSchema,
        TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
        TMapped = any,
    >(config: HttpDecoratorConfig<TRequest, TResponse, TError, TMapped>) {
        /**
         * Decorador de método que configura el endpoint HTTP
         * @param target - Prototipo de la clase
         * @param propertyKey - Nombre del método
         * @param descriptor - Descriptor del método
         */
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const metadata: Omit<EndpointMetadata, 'parameters'> = {
                method,
                config: {
                    validateRequest: true,
                    validateResponse: true,
                    ...config,
                },
            };

            MetadataManager.setEndpointMetadata(target, propertyKey, metadata);

            // Validar configuración después de definir el endpoint
            setTimeout(() => {
                try {
                    MetadataManager.validateMethodConfiguration(target, propertyKey);
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(`Configuration error in ${target.constructor.name}.${propertyKey}:`, error.message);
                    } else {
                        console.error(`Configuration error in ${target.constructor.name}.${propertyKey}:`, error);
                    }
                }
            }, 0);

            return descriptor;
        };
    };
}

/**
 * Decorador para peticiones GET
 * @example
 * ```typescript
 * @GET({
 *   url: '/users/:id',
 *   responseSchema: UserSchema,
 *   params: { id: true }
 * })
 * async getUser(@Response() user: User, @Params() params: { id: string }): Promise<User> {
 *   return user;
 * }
 * ```
 */
export const GET = createHttpDecorator('GET');

/**
 * Decorador para peticiones POST
 * @example
 * ```typescript
 * @POST({
 *   url: '/users',
 *   requestSchema: CreateUserSchema,
 *   responseSchema: UserSchema
 * })
 * async createUser(@Request() userData: CreateUserRequest, @Response() user: User): Promise<User> {
 *   return user;
 * }
 * ```
 */
export const POST = createHttpDecorator('POST');

/**
 * Decorador para peticiones PUT
 * @example
 * ```typescript
 * @PUT({
 *   url: '/users/:id',
 *   requestSchema: UpdateUserSchema,
 *   responseSchema: UserSchema,
 *   params: { id: true }
 * })
 * async updateUser(@Request() userData: UpdateUserRequest, @Response() user: User): Promise<User> {
 *   return user;
 * }
 * ```
 */
export const PUT = createHttpDecorator('PUT');

/**
 * Decorador para peticiones DELETE
 * @example
 * ```typescript
 * @DELETE({
 *   url: '/users/:id',
 *   params: { id: true }
 * })
 * async deleteUser(@Params() params: { id: string }): Promise<void> {
 *   // Lógica adicional si es necesaria
 * }
 * ```
 */
export const DELETE = createHttpDecorator('DELETE');

/**
 * Decorador para peticiones PATCH
 * @example
 * ```typescript
 * @PATCH({
 *   url: '/users/:id',
 *   requestSchema: PatchUserSchema,
 *   responseSchema: UserSchema,
 *   params: { id: true }
 * })
 * async patchUser(@Request() userData: PatchUserRequest, @Response() user: User): Promise<User> {
 *   return user;
 * }
 * ```
 */
export const PATCH = createHttpDecorator('PATCH');

/**
 * Decorador de parámetro para inyectar el cuerpo de la petición validado
 * Se usa principalmente en métodos POST, PUT, PATCH para validar el requestSchema
 * @param schema - Schema Zod opcional para validación adicional del parámetro
 * @example
 * ```typescript
 * @POST({
 *   url: '/users',
 *   requestSchema: CreateUserSchema
 * })
 * async createUser(@Request() userData: z.infer<typeof CreateUserSchema>): Promise<User> {
 *   // userData ya está validado con CreateUserSchema
 *   return userData;
 * }
 * ```
 */
export function Request(schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'request',
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

/**
 * Decorador de parámetro para inyectar la respuesta validada/mapeada
 * DEBE colocarse al final del método para asegurar que toda la validación se complete
 * @param schema - Schema Zod opcional para validación adicional del parámetro
 * @example
 * ```typescript
 * @GET({
 *   url: '/users/:id',
 *   responseSchema: UserSchema,
 *   mapper: (data) => new User(data)
 * })
 * async getUser(@Params() params: { id: string }, @Response() user: User): Promise<User> {
 *   // user ya está validado y mapeado
 *   return user;
 * }
 * ```
 */
export function Response(schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'response',
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

/**
 * Decorador de parámetro para inyectar query parameters
 * @param key - Clave específica del query parameter (opcional)
 * @param schema - Schema Zod opcional para validación del parámetro
 * @example
 * ```typescript
 * @GET({
 *   url: '/users',
 *   query: true
 * })
 * async getUsers(@Query() query: { page?: number; limit?: number }): Promise<User[]> {
 *   // query contiene todos los query parameters
 * }
 *
 * // O para un query parameter específico:
 * async getUsers(@Query('page') page: number): Promise<User[]> {
 *   // page contiene solo el valor del query parameter 'page'
 * }
 * ```
 */
export function Query(key?: string, schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'query',
            key,
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

/**
 * Decorador de parámetro para inyectar headers
 * @param key - Clave específica del header (opcional)
 * @param schema - Schema Zod opcional para validación del parámetro
 * @example
 * ```typescript
 * @POST({
 *   url: '/users',
 *   headers: { Authorization: true }
 * })
 * async createUser(@Headers() headers: { Authorization: string }): Promise<User> {
 *   // headers contiene todos los headers configurados
 * }
 *
 * // O para un header específico:
 * async createUser(@Headers('Authorization') token: string): Promise<User> {
 *   // token contiene solo el valor del header 'Authorization'
 * }
 * ```
 */
export function Headers(key?: string, schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'headers',
            key,
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

/**
 * Decorador de parámetro para inyectar parámetros de URL
 * @param key - Clave específica del parámetro de URL (opcional)
 * @param schema - Schema Zod opcional para validación del parámetro
 * @example
 * ```typescript
 * @GET({
 *   url: '/users/:id/posts/:postId',
 *   params: { id: true, postId: true }
 * })
 * async getUserPost(@Params() params: { id: string; postId: string }): Promise<Post> {
 *   // params contiene todos los parámetros de URL
 * }
 *
 * // O para un parámetro específico:
 * async getUserPost(@Params('id') userId: string, @Params('postId') postId: string): Promise<Post> {
 *   // userId y postId contienen los valores específicos
 * }
 * ```
 */
export function Params(key?: string, schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'params',
            key,
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

/**
 * Decorador de clase para configuración global del cliente HTTP
 * @param config - Configuración base del cliente
 * @example
 * ```typescript
 * @HttpClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 *   validateResponse: true
 * })
 * class ApiClient extends BaseHttpClient {
 *   // métodos del cliente
 * }
 * ```
 */
export function HttpClient(config?: { baseURL?: string; timeout?: number; validateResponse?: boolean; validateRequest?: boolean }) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                if (config) {
                    Object.assign(this, { _httpClientConfig: config });
                }
            }
        };
    };
}

/**
 * Configuración tipada para decoradores GET (sin requestSchema)
 */
export type GetConfig<
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    TMapped = any,
> = Omit<HttpDecoratorConfig<z.ZodSchema, TResponse, TError, TMapped>, 'requestSchema'>;

/**
 * Configuración tipada para decoradores POST/PUT/PATCH (con requestSchema)
 */
export type PostConfig<
    TRequest extends z.ZodSchema = z.ZodSchema,
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    TMapped = any,
> = HttpDecoratorConfig<TRequest, TResponse, TError, TMapped>;

/**
 * Helper para crear configuraciones GET tipadas
 * @param config - Configuración del decorador GET
 * @returns Configuración tipada
 */
export function createGetConfig<
    TResponse extends z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    TMapped = any,
>(config: GetConfig<TResponse, TError, TMapped>): GetConfig<TResponse, TError, TMapped> {
    return config;
}

/**
 * Helper para crear configuraciones POST/PUT/PATCH tipadas
 * @param config - Configuración del decorador
 * @returns Configuración tipada
 */
export function createPostConfig<
    TRequest extends z.ZodSchema,
    TResponse extends z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    TMapped = any,
>(config: PostConfig<TRequest, TResponse, TError, TMapped>): PostConfig<TRequest, TResponse, TError, TMapped> {
    return config;
}

/**
 * Helper para crear mappers tipados
 * @param mapper - Función de transformación
 * @returns Función mapper tipada
 * @example
 * ```typescript
 * const userMapper = createMapper((data: UserApiResponse) => new User(data));
 *
 * @GET({
 *   url: '/users/:id',
 *   responseSchema: UserApiResponseSchema,
 *   mapper: userMapper
 * })
 * async getUser(@Response() user: User): Promise<User> {
 *   return user;
 * }
 * ```
 */
export function createMapper<TInput, TOutput>(mapper: (input: TInput) => TOutput): (input: TInput) => TOutput {
    return mapper;
}
