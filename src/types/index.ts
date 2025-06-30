import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Configuración unificada para decoradores HTTP
export interface HttpDecoratorConfig<
    TRequest extends z.ZodSchema = z.ZodSchema,
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
> {
    url: string;
    requestSchema?: TRequest;
    responseSchema?: TResponse;
    errorType?: TError;
    headers?: boolean | Record<string, boolean>;
    query?: boolean | Record<string, boolean>;
    params?: boolean | Record<string, boolean>;
    timeout?: number;
    validateRequest?: boolean;
    validateResponse?: boolean;
}

// Tipos para parámetros del método
export interface RequestParams<TBody = any, TQuery = Record<string, any>, THeaders = Record<string, any>, TParams = Record<string, any>> {
    body?: TBody;
    query?: TQuery;
    headers?: THeaders;
    params?: TParams;
}

// Metadatos del endpoint
export interface EndpointMetadata {
    method: HttpMethod;
    config: HttpDecoratorConfig;
}

// Configuración del cliente HTTP
export interface HttpClientConfig extends Omit<AxiosRequestConfig, 'method' | 'url' | 'data'> {
    baseURL: string;
    timeout?: number;
    validateResponse?: boolean;
    validateRequest?: boolean;
    onRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
    onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    onError?: (error: any) => any | Promise<any>;
}

// Contexto de la petición
export interface RequestContext {
    method: HttpMethod;
    url: string;
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, any>;
    params?: Record<string, any>;
    requestSchema?: z.ZodSchema;
    responseSchema?: z.ZodSchema;
    errorType?: new (...args: any[]) => Error;
    timeout?: number;
}

// Clases de error
export class HttpDecoratorError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'HttpDecoratorError';
    }
}

export class ValidationError extends HttpDecoratorError {
    constructor(
        message: string,
        public readonly validationErrors: z.ZodError,
        public readonly type: 'request' | 'response' = 'request'
    ) {
        super(message, 'VALIDATION_ERROR', { validationErrors: validationErrors.errors, type });
    }
}

export class NetworkError extends HttpDecoratorError {
    constructor(
        message: string,
        public readonly response?: AxiosResponse,
        public readonly request?: any
    ) {
        super(message, 'NETWORK_ERROR', { response, request });
    }
}

export class CustomError extends HttpDecoratorError {
    constructor(
        message: string,
        public readonly originalError: Error,
        public readonly errorType: string
    ) {
        super(message, 'CUSTOM_ERROR', { originalError, errorType });
    }
}

// Tipos de utilidad para inferencia
export type InferRequestType<T extends HttpDecoratorConfig> = T['requestSchema'] extends z.ZodSchema ? z.infer<T['requestSchema']> : any;

export type InferResponseType<T extends HttpDecoratorConfig> = T['responseSchema'] extends z.ZodSchema ? z.infer<T['responseSchema']> : any;

// Hooks/Middlewares
export interface RequestHook {
    (context: RequestContext): RequestContext | Promise<RequestContext>;
}

export interface ResponseHook {
    (response: any, context: RequestContext): any | Promise<any>;
}

export interface ErrorHook {
    (error: any, context: RequestContext): any | Promise<any>;
}
