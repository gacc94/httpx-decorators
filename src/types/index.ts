import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

/**
 * Métodos HTTP soportados por la librería
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Configuración unificada para decoradores HTTP
 * @template TRequest - Schema Zod para validación de request
 * @template TResponse - Schema Zod para validación de response
 * @template TError - Clase de error personalizada
 * @template TMapped - Tipo del resultado después del mapper
 */
export interface HttpDecoratorConfig<
    TRequest extends z.ZodSchema = z.ZodSchema,
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    TMapped = any,
> {
    /** URL del endpoint (puede incluir parámetros como :id) */
    url: string;
    /** Schema Zod para validar el cuerpo de la petición */
    requestSchema?: TRequest;
    /** Schema Zod para validar la respuesta */
    responseSchema?: TResponse;
    /** Clase de error personalizada para este endpoint */
    errorType?: TError;
    /** Configuración de headers permitidos */
    headers?: boolean | Record<string, boolean>;
    /** Configuración de query parameters permitidos */
    query?: boolean | Record<string, boolean>;
    /** Configuración de parámetros de URL permitidos */
    params?: boolean | Record<string, boolean>;
    /** Timeout específico para este endpoint en milisegundos */
    timeout?: number;
    /** Habilitar validación de request (por defecto: true) */
    validateRequest?: boolean;
    /** Habilitar validación de response (por defecto: true) */
    validateResponse?: boolean;
    /** Función para transformar la respuesta validada */
    mapper?: (response: z.infer<TResponse>) => TMapped;
}

/**
 * Tipos de decoradores de parámetros disponibles
 */
export type ParameterType = 'response' | 'query' | 'headers' | 'params' | 'request';

/**
 * Metadatos de parámetros decorados
 */
export interface ParameterMetadata {
    /** Índice del parámetro en la función */
    index: number;
    /** Tipo de decorador aplicado */
    type: ParameterType;
    /** Clave específica para extraer del objeto (opcional) */
    key?: string;
    /** Schema Zod para validar el parámetro (opcional) */
    schema?: z.ZodSchema;
}

/**
 * Metadatos completos del endpoint
 */
export interface EndpointMetadata {
    /** Método HTTP del endpoint */
    method: HttpMethod;
    /** Configuración del decorador HTTP */
    config: HttpDecoratorConfig;
    /** Lista de parámetros decorados */
    parameters: ParameterMetadata[];
}

/**
 * Configuración del cliente HTTP base
 */
export interface HttpClientConfig extends Omit<AxiosRequestConfig, 'method' | 'url' | 'data'> {
    /** URL base para todas las peticiones */
    baseURL: string;
    /** Timeout por defecto en milisegundos */
    timeout?: number;
    /** Habilitar validación de response por defecto */
    validateResponse?: boolean;
    /** Habilitar validación de request por defecto */
    validateRequest?: boolean;
    /** Hook ejecutado antes de cada petición */
    onRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
    /** Hook ejecutado después de cada respuesta exitosa */
    onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    /** Hook ejecutado cuando ocurre un error */
    onError?: (error: any) => any | Promise<any>;
}

/**
 * Contexto de la petición HTTP
 */
export interface RequestContext {
    /** Método HTTP */
    method: HttpMethod;
    /** URL completa del endpoint */
    url: string;
    /** Cuerpo de la petición */
    body?: any;
    /** Headers de la petición */
    headers?: Record<string, string>;
    /** Query parameters */
    query?: Record<string, any>;
    /** Parámetros de URL */
    params?: Record<string, any>;
    /** Schema para validar request */
    requestSchema?: z.ZodSchema;
    /** Schema para validar response */
    responseSchema?: z.ZodSchema;
    /** Clase de error personalizada */
    errorType?: new (...args: any[]) => Error;
    /** Timeout específico */
    timeout?: number;
    /** Función mapper */
    mapper?: (response: any) => any;
}

/**
 * Contexto de ejecución del método decorado
 */
export interface MethodExecutionContext {
    /** Argumentos originales pasados al método */
    originalArgs: any[];
    /** Argumentos con valores inyectados */
    injectedArgs: any[];
    /** Valor de respuesta inyectado */
    responseValue?: any;
    /** Valor de query inyectado */
    queryValue?: any;
    /** Valor de headers inyectado */
    headersValue?: any;
    /** Valor de params inyectado */
    paramsValue?: any;
    /** Valor de request inyectado */
    requestValue?: any;
}

/**
 * Error base de la librería HTTP Decorators
 */
export class HttpDecoratorError extends Error {
    /**
     * @param message - Mensaje de error
     * @param code - Código de error
     * @param details - Detalles adicionales del error
     */
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'HttpDecoratorError';
    }
}

/**
 * Error de validación con Zod
 */
export class ValidationError extends HttpDecoratorError {
    /**
     * @param message - Mensaje de error
     * @param validationErrors - Errores de validación de Zod
     * @param type - Tipo de validación (request o response)
     */
    constructor(
        message: string,
        public readonly validationErrors: z.ZodError,
        public readonly type: 'request' | 'response' = 'request'
    ) {
        super(message, 'VALIDATION_ERROR', { validationErrors: validationErrors.errors, type });
    }
}

/**
 * Error de red/HTTP
 */
export class NetworkError extends HttpDecoratorError {
    /**
     * @param message - Mensaje de error
     * @param response - Respuesta de Axios (si existe)
     * @param request - Request de Axios (si existe)
     */
    constructor(
        message: string,
        public readonly response?: AxiosResponse,
        public readonly request?: any
    ) {
        super(message, 'NETWORK_ERROR', { response, request });
    }
}

/**
 * Error personalizado del usuario
 */
export class CustomError extends HttpDecoratorError {
    /**
     * @param message - Mensaje de error
     * @param originalError - Error original
     * @param errorType - Tipo de error personalizado
     */
    constructor(
        message: string,
        public readonly originalError: Error,
        public readonly errorType: string
    ) {
        super(message, 'CUSTOM_ERROR', { originalError, errorType });
    }
}

/**
 * Error de configuración de decoradores
 */
export class ConfigurationError extends HttpDecoratorError {
    /**
     * @param message - Mensaje de error
     * @param details - Detalles del error de configuración
     */
    constructor(message: string, details?: any) {
        super(message, 'CONFIGURATION_ERROR', details);
    }
}

/**
 * Infiere el tipo de request desde la configuración del decorador
 */
export type InferRequestType<T extends HttpDecoratorConfig> = T['requestSchema'] extends z.ZodSchema ? z.infer<T['requestSchema']> : any;

/**
 * Infiere el tipo de response desde la configuración del decorador
 */
export type InferResponseType<T extends HttpDecoratorConfig> = T['responseSchema'] extends z.ZodSchema ? z.infer<T['responseSchema']> : any;

/**
 * Infiere el tipo mapeado desde la configuración del decorador
 */
export type InferMappedType<T extends HttpDecoratorConfig> = T['mapper'] extends (response: any) => infer R ? R : InferResponseType<T>;

/**
 * Hook ejecutado antes de cada petición
 */
export interface RequestHook {
    (context: RequestContext): RequestContext | Promise<RequestContext>;
}

/**
 * Hook ejecutado después de cada respuesta
 */
export interface ResponseHook {
    (response: any, context: RequestContext): any | Promise<any>;
}

/**
 * Hook ejecutado cuando ocurre un error
 */
export interface ErrorHook {
    (error: any, context: RequestContext): any | Promise<any>;
}

/**
 * Parámetros de request (compatibilidad con versiones anteriores)
 */
export interface RequestParams<TBody = any, TQuery = Record<string, any>, THeaders = Record<string, any>, TParams = Record<string, any>> {
    /** Cuerpo de la petición */
    body?: TBody;
    /** Query parameters */
    query?: TQuery;
    /** Headers */
    headers?: THeaders;
    /** Parámetros de URL */
    params?: TParams;
}
