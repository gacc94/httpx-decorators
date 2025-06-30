import { z } from 'zod';
import { MetadataManager } from '../metadata';
import { HttpMethod, EndpointMetadata, ParameterMetadata } from '../types';

// Decoradores de métodos HTTP
export function createHttpMethodDecorator(method: HttpMethod) {
    return function (path: string, responseSchema?: z.ZodSchema) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const metadata: EndpointMetadata = {
                method,
                path,
                responseSchema,
            };

            MetadataManager.setEndpointMetadata(target, propertyKey, metadata);
            return descriptor;
        };
    };
}

export const GET = createHttpMethodDecorator('GET');
export const POST = createHttpMethodDecorator('POST');
export const PUT = createHttpMethodDecorator('PUT');
export const DELETE = createHttpMethodDecorator('DELETE');
export const PATCH = createHttpMethodDecorator('PATCH');

// Decoradores de parámetros
export function Body(schema?: z.ZodSchema) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'body',
            schema,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

export function Header(key?: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'header',
            key,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

export function Query(key?: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'query',
            key,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

export function Param(key?: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const metadata: ParameterMetadata = {
            index: parameterIndex,
            type: 'param',
            key,
        };

        MetadataManager.addParameterMetadata(target, propertyKey, metadata);
    };
}

// Decorador de clase para configuración automática
export function HttpClient(config?: { baseURL?: string }) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                // Aquí se puede inyectar configuración adicional si es necesario
            }
        };
    };
}
