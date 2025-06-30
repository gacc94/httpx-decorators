import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface EndpointMetadata {
    method: HttpMethod;
    path: string;
    responseSchema?: z.ZodSchema;
}

export interface ParameterMetadata {
    index: number;
    type: 'body' | 'header' | 'query' | 'param';
    key?: string;
    schema?: z.ZodSchema;
}

export interface MethodMetadata {
    endpoint?: EndpointMetadata;
    parameters: ParameterMetadata[];
}

export interface HttpClientConfig extends Omit<AxiosRequestConfig, 'method' | 'url' | 'data'> {
    baseURL: string;
    timeout?: number;
    validateResponse?: boolean;
}

export interface RequestContext {
    method: HttpMethod;
    path: string;
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, any>;
    params?: Record<string, any>;
    responseSchema?: z.ZodSchema;
}

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
        public readonly validationErrors: z.ZodError
    ) {
        super(message, 'VALIDATION_ERROR', validationErrors.errors);
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
