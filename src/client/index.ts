import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { MetadataManager } from '../metadata';
import {
    HttpClientConfig,
    RequestContext,
    EndpointMetadata,
    ParameterMetadata,
    MethodExecutionContext,
    HttpDecoratorError,
    ValidationError,
    NetworkError,
    CustomError,
    RequestParams,
    RequestHook,
    ResponseHook,
    ErrorHook,
} from '../types';

/**
 * Cliente HTTP base que proporciona funcionalidad de decoradores
 * Maneja automáticamente la validación, inyección de parámetros y ejecución de peticiones
 */
export class BaseHttpClient {
    protected axiosInstance: AxiosInstance;
    protected config: HttpClientConfig;
    private requestHooks: RequestHook[] = [];
    private responseHooks: ResponseHook[] = [];
    private errorHooks: ErrorHook[] = [];

    /**
     * Constructor del cliente HTTP base
     * @param config - Configuración del cliente HTTP
     */
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

    /**
     * Configura los interceptores de Axios para logging y hooks
     * @private
     */
    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);

                if (this.config.onRequest) {
                    const newConfig = await this.config.onRequest(config);
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

                if (this.config.onResponse) {
                    return await this.config.onResponse(response);
                }

                return response;
            },
            async (error) => {
                console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);

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

    /**
     * Vincula métodos decorados con la funcionalidad HTTP
     * @private
     */
    private bindMethods(): void {
        const endpointsMetadata = MetadataManager.getAllEndpointsMetadata(this.constructor);

        for (const [methodName, metadata] of endpointsMetadata) {
            this.createHttpMethod(methodName, metadata);
        }
    }

    /**
     * Crea un método HTTP dinámico basado en los metadatos del decorador
     * @private
     * @param methodName - Nombre del método
     * @param metadata - Metadatos del endpoint
     */
    private createHttpMethod(methodName: string, metadata: EndpointMetadata): void {
        const originalMethod = (this as any)[methodName];

        (this as any)[methodName] = async (...args: any[]) => {
            try {
                // Crear contexto de ejecución
                const executionContext: MethodExecutionContext = {
                    originalArgs: args,
                    injectedArgs: [...args],
                };

                // Construir contexto de request desde argumentos
                const requestContext = this.buildRequestContextFromArgs(metadata, args);

                // Ejecutar hooks de request
                let context = requestContext;
                for (const hook of this.requestHooks) {
                    context = await hook(context);
                }

                // Validar request si está configurado
                if (context.requestSchema && (this.config.validateRequest ?? metadata.config.validateRequest)) {
                    this.validateRequest(context, context.requestSchema);
                }

                // Ejecutar petición HTTP
                const response = await this.executeRequest(context);
                let responseData = response.data;

                // Validar response si está configurado
                if (context.responseSchema && (this.config.validateResponse ?? metadata.config.validateResponse)) {
                    responseData = this.validateResponse(responseData, context.responseSchema);
                }

                // Aplicar mapper si está configurado
                if (context.mapper) {
                    responseData = context.mapper(responseData);
                }

                // Ejecutar hooks de response
                for (const hook of this.responseHooks) {
                    responseData = await hook(responseData, context);
                }

                // Inyectar valores en parámetros decorados
                this.injectParameterValues(metadata, executionContext, {
                    response: responseData,
                    query: context.query,
                    headers: context.headers,
                    params: context.params,
                    request: context.body,
                });

                // Ejecutar método original con parámetros inyectados
                if (originalMethod) {
                    return await originalMethod.apply(this, executionContext.injectedArgs);
                }

                // Si no hay método original, retornar la respuesta directamente
                return responseData;
            } catch (error) {
                // Ejecutar hooks de error
                let processedError = error;
                for (const hook of this.errorHooks) {
                    try {
                        processedError = await hook(processedError, this.buildRequestContextFromArgs(metadata, args));
                    } catch (hookError) {
                        // Si el hook falla, continuar con el error original
                    }
                }

                // Manejar error personalizado si está configurado
                if (metadata.config.errorType && !(error instanceof HttpDecoratorError)) {
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

    /**
     * Construye el contexto de request desde los argumentos del método
     * @private
     * @param metadata - Metadatos del endpoint
     * @param args - Argumentos del método
     * @returns Contexto de request
     */
    private buildRequestContextFromArgs(metadata: EndpointMetadata, args: any[]): RequestContext {
        const { config } = metadata;

        // Si el primer argumento es un objeto con propiedades body, query, etc. (modo legacy)
        const firstArg = args[0];
        if (
            firstArg &&
            typeof firstArg === 'object' &&
            ('body' in firstArg || 'query' in firstArg || 'headers' in firstArg || 'params' in firstArg)
        ) {
            return this.buildRequestContextFromParams(metadata, firstArg as RequestParams);
        }

        // Modo nuevo: extraer valores de argumentos basado en decoradores de parámetros
        const context: RequestContext = {
            method: metadata.method,
            url: config.url,
            requestSchema: config.requestSchema,
            responseSchema: config.responseSchema,
            errorType: config.errorType,
            timeout: config.timeout,
            mapper: config.mapper,
            headers: {},
            query: {},
            params: {},
        };

        // Extraer body desde parámetros @Request() o argumentos no decorados
        const requestParam = metadata.parameters.find((p) => p.type === 'request');
        if (requestParam && args[requestParam.index] !== undefined) {
            context.body = args[requestParam.index];
        } else {
            // Procesar parámetros no decorados como body (para compatibilidad)
            const decoratedIndices = metadata.parameters.map((p) => p.index);
            const bodyArgs = args.filter((_, index) => !decoratedIndices.includes(index));
            if (bodyArgs.length > 0) {
                context.body = bodyArgs.length === 1 ? bodyArgs[0] : bodyArgs;
            }
        }

        return context;
    }

    /**
     * Construye el contexto de request desde parámetros legacy
     * @private
     * @param metadata - Metadatos del endpoint
     * @param params - Parámetros legacy
     * @returns Contexto de request
     */
    private buildRequestContextFromParams(metadata: EndpointMetadata, params: RequestParams): RequestContext {
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
            mapper: config.mapper,
        };
    }

    /**
     * Inyecta valores en los parámetros decorados del método
     * @private
     * @param metadata - Metadatos del endpoint
     * @param executionContext - Contexto de ejecución
     * @param values - Valores a inyectar
     */
    private injectParameterValues(
        metadata: EndpointMetadata,
        executionContext: MethodExecutionContext,
        values: {
            response?: any;
            query?: any;
            headers?: any;
            params?: any;
            request?: any;
        }
    ): void {
        for (const param of metadata.parameters) {
            let valueToInject: any;

            switch (param.type) {
                case 'response':
                    valueToInject = values.response;
                    break;
                case 'query':
                    valueToInject = param.key ? values.query?.[param.key] : values.query;
                    break;
                case 'headers':
                    valueToInject = param.key ? values.headers?.[param.key] : values.headers;
                    break;
                case 'params':
                    valueToInject = param.key ? values.params?.[param.key] : values.params;
                    break;
                case 'request':
                    valueToInject = values.request;
                    break;
            }

            // Validar parámetro si tiene schema
            if (param.schema && valueToInject !== undefined) {
                try {
                    valueToInject = param.schema.parse(valueToInject);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        throw new ValidationError(
                            `Parameter validation failed for @${param.type}${param.key ? `('${param.key}')` : '()'}`,
                            error,
                            'request'
                        );
                    }
                    throw error;
                }
            }

            // Inyectar valor en el argumento correspondiente
            executionContext.injectedArgs[param.index] = valueToInject;
        }
    }

    /**
     * Procesa headers según la configuración
     * @private
     */
    private processHeaders(headers?: Record<string, any>, configHeaders?: boolean | Record<string, boolean>): Record<string, string> {
        if (!configHeaders || !headers) return {};

        if (configHeaders === true) {
            return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, String(v)]));
        }

        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (configHeaders[key]) {
                result[key] = String(value);
            }
        }

        return result;
    }

    /**
     * Procesa query parameters según la configuración
     * @private
     */
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

    /**
     * Procesa parámetros de URL según la configuración
     * @private
     */
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

    /**
     * Valida el request usando el schema configurado
     * @private
     * @param context - Contexto de request
     * @param schema - Schema Zod para validación
     */
    private validateRequest(context: RequestContext, schema: z.ZodSchema): void {
        try {
            if (context.body !== undefined) {
                schema.parse(context.body);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Request validation failed', error, 'request');
            }
            throw error;
        }
    }

    /**
     * Valida la response usando el schema configurado
     * @private
     * @param data - Datos de respuesta
     * @param schema - Schema Zod para validación
     * @returns Datos validados
     */
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

    /**
     * Ejecuta la petición HTTP usando Axios
     * @private
     * @param context - Contexto de request
     * @returns Respuesta de Axios
     */
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

    /**
     * Añade un hook de request
     * @param hook - Función hook a ejecutar antes de cada petición
     */
    public addRequestHook(hook: RequestHook): void {
        this.requestHooks.push(hook);
    }

    /**
     * Añade un hook de response
     * @param hook - Función hook a ejecutar después de cada respuesta
     */
    public addResponseHook(hook: ResponseHook): void {
        this.responseHooks.push(hook);
    }

    /**
     * Añade un hook de error
     * @param hook - Función hook a ejecutar cuando ocurre un error
     */
    public addErrorHook(hook: ErrorHook): void {
        this.errorHooks.push(hook);
    }

    /**
     * Limpia todos los hooks configurados
     */
    public clearHooks(): void {
        this.requestHooks = [];
        this.responseHooks = [];
        this.errorHooks = [];
    }

    // Métodos utilitarios públicos

    /**
     * Establece la URL base para todas las peticiones
     * @param baseURL - Nueva URL base
     */
    public setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    /**
     * Establece un header por defecto para todas las peticiones
     * @param key - Nombre del header
     * @param value - Valor del header
     */
    public setDefaultHeader(key: string, value: string): void {
        this.axiosInstance.defaults.headers.common[key] = value;
    }

    /**
     * Elimina un header por defecto
     * @param key - Nombre del header a eliminar
     */
    public removeDefaultHeader(key: string): void {
        delete this.axiosInstance.defaults.headers.common[key];
    }

    /**
     * Obtiene la instancia de Axios subyacente
     * @returns Instancia de Axios
     */
    public getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}
