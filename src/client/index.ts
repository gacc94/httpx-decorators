import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import { MetadataManager } from '../metadata';
import {
    HttpClientConfig,
    RequestContext,
    MethodMetadata,
    ParameterMetadata,
    HttpDecoratorError,
    ValidationError,
    NetworkError,
} from '../types';

export class BaseHttpClient {
    protected axiosInstance: AxiosInstance;
    protected config: HttpClientConfig;

    constructor(config: HttpClientConfig) {
        this.config = { validateResponse: true, ...config };
        this.axiosInstance = axios.create(config);
        this.setupInterceptors();
        this.bindMethods();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => {
                console.log(`✅ ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);
                return Promise.reject(new NetworkError(error.message, error.response, error.request));
            }
        );
    }

    private bindMethods(): void {
        const methodsMetadata = MetadataManager.getAllMethodsMetadata(this.constructor);

        for (const [methodName, metadata] of methodsMetadata) {
            if (metadata.endpoint) {
                this.createHttpMethod(methodName, metadata);
            }
        }
    }

    private createHttpMethod(methodName: string, metadata: MethodMetadata): void {
        const originalMethod = (this as any)[methodName];

        (this as any)[methodName] = async (...args: any[]) => {
            try {
                const context = this.buildRequestContext(metadata, args);
                const response = await this.executeRequest(context);

                // Validar respuesta si hay schema
                if (context.responseSchema && this.config.validateResponse) {
                    return this.validateResponse(response.data, context.responseSchema);
                }

                return response.data;
            } catch (error) {
                if (error instanceof HttpDecoratorError) {
                    throw error;
                }
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                throw new HttpDecoratorError(
                    `Error executing ${methodName}: ${errorMessage}`,
                    'EXECUTION_ERROR',
                    error instanceof Error ? error : new Error(errorMessage)
                );
            }
        };
    }

    private buildRequestContext(metadata: MethodMetadata, args: any[]): RequestContext {
        if (!metadata.endpoint) {
            throw new HttpDecoratorError('No endpoint metadata found', 'MISSING_ENDPOINT_METADATA');
        }

        const context: RequestContext = {
            method: metadata.endpoint.method,
            path: metadata.endpoint.path,
            responseSchema: metadata.endpoint.responseSchema,
            headers: {},
            query: {},
            params: {},
        };

        // Procesar parámetros
        for (const paramMetadata of metadata.parameters) {
            const value = args[paramMetadata.index];

            if (value === undefined) continue;

            switch (paramMetadata.type) {
                case 'body':
                    context.body = this.validateParameter(value, paramMetadata.schema);
                    break;
                case 'header':
                    if (paramMetadata.key) {
                        context.headers![paramMetadata.key] = value;
                    } else if (typeof value === 'object') {
                        Object.assign(context.headers!, value);
                    }
                    break;
                case 'query':
                    if (paramMetadata.key) {
                        context.query![paramMetadata.key] = value;
                    } else if (typeof value === 'object') {
                        Object.assign(context.query!, value);
                    }
                    break;
                case 'param':
                    if (paramMetadata.key) {
                        context.params![paramMetadata.key] = value;
                    } else if (typeof value === 'object') {
                        Object.assign(context.params!, value);
                    }
                    break;
            }
        }

        return context;
    }

    private validateParameter(value: any, schema?: z.ZodSchema): any {
        if (!schema) return value;

        try {
            return schema.parse(value);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Parameter validation failed', error);
            }
            throw error;
        }
    }

    private validateResponse(data: any, schema: z.ZodSchema): any {
        try {
            return schema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Response validation failed', error);
            }
            throw error;
        }
    }

    private async executeRequest(context: RequestContext): Promise<AxiosResponse> {
        let url = context.path;

        // Reemplazar parámetros en la URL
        for (const [key, value] of Object.entries(context.params || {})) {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        }

        const config: AxiosRequestConfig = {
            method: context.method,
            url,
            headers: context.headers,
            params: context.query,
            data: context.body,
        };

        return this.axiosInstance.request(config);
    }

    // Métodos utilitarios públicos
    public setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    public setDefaultHeader(key: string, value: string): void {
        this.axiosInstance.defaults.headers.common[key] = value;
    }

    public removeDefaultHeader(key: string): void {
        delete this.axiosInstance.defaults.headers.common[key];
    }
}
