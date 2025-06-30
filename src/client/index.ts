import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { MetadataManager } from '../metadata';
import {
    HttpClientConfig,
    RequestContext,
    EndpointMetadata,
    HttpDecoratorError,
    ValidationError,
    NetworkError,
    CustomError,
    RequestParams,
    RequestHook,
    ResponseHook,
    ErrorHook,
} from '../types';

export class BaseHttpClient {
    protected axiosInstance: AxiosInstance;
    protected config: HttpClientConfig;
    private requestHooks: RequestHook[] = [];
    private responseHooks: ResponseHook[] = [];
    private errorHooks: ErrorHook[] = [];

    constructor(config: HttpClientConfig) {
        this.config = {
            validateResponse: true,
            validateRequest: true,
            ...config,
        };
        this.axiosInstance = axios.create(config);
        this.setupInterceptors();
        this.bindMethods();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);

                // Ejecutar hook onRequest si existe
                if (this.config.onRequest) {
                    const newConfig = await this.config.onRequest(config);
                    // We must return an InternalAxiosRequestConfig. The main difference is that
                    // headers must be defined. We ensure they are, using original headers as a fallback.
                    newConfig.headers = newConfig.headers ?? config.headers;
                    return newConfig as InternalAxiosRequestConfig;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            async (response) => {
                console.log(`✅ ${response.status} ${response.config.url}`);

                // Ejecutar hook onResponse si existe
                if (this.config.onResponse) {
                    return await this.config.onResponse(response);
                }

                return response;
            },
            async (error) => {
                console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);

                // Ejecutar hook onError si existe
                if (this.config.onError) {
                    try {
                        return await this.config.onError(error);
                    } catch (hookError) {
                        // Si el hook falla, continuar con el error original
                    }
                }

                return Promise.reject(new NetworkError(error.message, error.response, error.request));
            }
        );
    }

    private bindMethods(): void {
        const endpointsMetadata = MetadataManager.getAllEndpointsMetadata(this.constructor);

        for (const [methodName, metadata] of endpointsMetadata) {
            this.createHttpMethod(methodName, metadata);
        }
    }

    private createHttpMethod(methodName: string, metadata: EndpointMetadata): void {
        (this as any)[methodName] = async (params: RequestParams = {}) => {
            try {
                // Ejecutar hooks de request
                let context = this.buildRequestContext(metadata, params);
                for (const hook of this.requestHooks) {
                    context = await hook(context);
                }

                // Validar request si está configurado
                if (context.requestSchema && (this.config.validateRequest ?? metadata.config.validateRequest)) {
                    this.validateRequest(params, context.requestSchema);
                }

                // Ejecutar petición
                const response = await this.executeRequest(context);
                let responseData = response.data;

                // Validar response si está configurado
                if (context.responseSchema && (this.config.validateResponse ?? metadata.config.validateResponse)) {
                    responseData = this.validateResponse(responseData, context.responseSchema);
                }

                // Ejecutar hooks de response
                for (const hook of this.responseHooks) {
                    responseData = await hook(responseData, context);
                }

                return responseData;
            } catch (error) {
                // Ejecutar hooks de error
                let processedError = error;
                for (const hook of this.errorHooks) {
                    try {
                        processedError = await hook(processedError, this.buildRequestContext(metadata, params));
                    } catch (hookError) {
                        // Si el hook falla, continuar con el error original
                    }
                }

                // Manejar error personalizado si está configurado
                if (metadata.config.errorType) {
                    const originalError = error instanceof Error ? error : new Error(String(error));
                    throw new CustomError(
                        `Custom error in ${methodName}: ${originalError.message}`,
                        originalError,
                        metadata.config.errorType.name
                    );
                }

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

    private buildRequestContext(metadata: EndpointMetadata, params: RequestParams): RequestContext {
        const { config } = metadata;

        return {
            method: metadata.method,
            url: config.url,
            body: params.body,
            headers: this.processHeaders(params.headers, config.headers),
            query: this.processQuery(params.query, config.query),
            params: this.processParams(params.params, config.params),
            requestSchema: config.requestSchema,
            responseSchema: config.responseSchema,
            errorType: config.errorType,
            timeout: config.timeout,
        };
    }

    private processHeaders(headers?: Record<string, any>, configHeaders?: boolean | Record<string, boolean>): Record<string, string> {
        if (!configHeaders || !headers) return {};

        if (configHeaders === true) {
            return headers;
        }

        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (configHeaders[key]) {
                result[key] = String(value);
            }
        }

        return result;
    }

    private processQuery(query?: Record<string, any>, configQuery?: boolean | Record<string, boolean>): Record<string, any> {
        if (!configQuery || !query) return {};

        if (configQuery === true) {
            return query;
        }

        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(query)) {
            if (configQuery[key]) {
                result[key] = value;
            }
        }

        return result;
    }

    private processParams(params?: Record<string, any>, configParams?: boolean | Record<string, boolean>): Record<string, any> {
        if (!configParams || !params) return {};

        if (configParams === true) {
            return params;
        }

        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(params)) {
            if (configParams[key]) {
                result[key] = value;
            }
        }

        return result;
    }

    private validateRequest(params: RequestParams, schema: z.ZodSchema): void {
        try {
            // Validar el body si existe
            if (params.body !== undefined) {
                schema.parse(params.body);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Request validation failed', error, 'request');
            }
            throw error;
        }
    }

    private validateResponse(data: any, schema: z.ZodSchema): any {
        try {
            return schema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Response validation failed', error, 'response');
            }
            throw error;
        }
    }

    private async executeRequest(context: RequestContext): Promise<AxiosResponse> {
        let url = context.url;

        // Reemplazar parámetros en la URL
        for (const [key, value] of Object.entries(context.params || {})) {
            url = url.replace(`:${key}`, encodeURIComponent(String(value)));
        }

        const config: AxiosRequestConfig = {
            method: context.method,
            url,
            headers: context.headers,
            params: context.query,
            data: context.body,
            timeout: context.timeout,
        };

        return this.axiosInstance.request(config);
    }

    // Métodos públicos para hooks
    public addRequestHook(hook: RequestHook): void {
        this.requestHooks.push(hook);
    }

    public addResponseHook(hook: ResponseHook): void {
        this.responseHooks.push(hook);
    }

    public addErrorHook(hook: ErrorHook): void {
        this.errorHooks.push(hook);
    }

    public clearHooks(): void {
        this.requestHooks = [];
        this.responseHooks = [];
        this.errorHooks = [];
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

    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}
