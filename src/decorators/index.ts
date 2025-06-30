import { z } from 'zod';
import { MetadataManager } from '../metadata';
import { HttpMethod, HttpDecoratorConfig, EndpointMetadata } from '../types';

// Función para crear decoradores HTTP unificados
function createHttpDecorator(method: HttpMethod) {
    return function <
        TRequest extends z.ZodSchema = z.ZodSchema,
        TResponse extends z.ZodSchema = z.ZodSchema,
        TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
    >(config: HttpDecoratorConfig<TRequest, TResponse, TError>) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const metadata: EndpointMetadata = {
                method,
                config: {
                    validateRequest: true,
                    validateResponse: true,
                    ...config,
                },
            };

            MetadataManager.setEndpointMetadata(target, propertyKey, metadata);
            return descriptor;
        };
    };
}

// Decoradores HTTP exportados
export const GET = createHttpDecorator('GET');
export const POST = createHttpDecorator('POST');
export const PUT = createHttpDecorator('PUT');
export const DELETE = createHttpDecorator('DELETE');
export const PATCH = createHttpDecorator('PATCH');

// Decorador de clase para configuración del cliente
export function HttpClient(config?: { baseURL?: string; timeout?: number; validateResponse?: boolean; validateRequest?: boolean }) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                // Configuración adicional si es necesario
                if (config) {
                    Object.assign(this, { _httpClientConfig: config });
                }
            }
        };
    };
}

// Tipos de utilidad para los decoradores
export type GetConfig<
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
> = Omit<HttpDecoratorConfig<z.ZodSchema, TResponse, TError>, 'requestSchema'>;

export type PostConfig<
    TRequest extends z.ZodSchema = z.ZodSchema,
    TResponse extends z.ZodSchema = z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
> = HttpDecoratorConfig<TRequest, TResponse, TError>;

// Funciones helper para crear configuraciones tipadas
export function createGetConfig<
    TResponse extends z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
>(config: GetConfig<TResponse, TError>): GetConfig<TResponse, TError> {
    return config;
}

export function createPostConfig<
    TRequest extends z.ZodSchema,
    TResponse extends z.ZodSchema,
    TError extends new (...args: any[]) => Error = new (...args: any[]) => Error,
>(config: PostConfig<TRequest, TResponse, TError>): PostConfig<TRequest, TResponse, TError> {
    return config;
}
