import 'reflect-metadata';
import { EndpointMetadata, ParameterMetadata, ConfigurationError } from '../types';

const ENDPOINT_METADATA_KEY = Symbol('http-endpoint');
const PARAMETER_METADATA_KEY = Symbol('http-parameter');

/**
 * Gestor de metadatos para decoradores HTTP
 * Maneja el almacenamiento y recuperación de información de endpoints y parámetros
 */
export class MetadataManager {
    /**
     * Establece metadatos de endpoint para un método
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     * @param metadata - Metadatos del endpoint (sin parámetros)
     */
    static setEndpointMetadata(target: any, propertyKey: string, metadata: Omit<EndpointMetadata, 'parameters'>): void {
        const existingParameters = this.getParameterMetadata(target, propertyKey);
        const fullMetadata: EndpointMetadata = {
            ...metadata,
            parameters: existingParameters,
        };

        Reflect.defineMetadata(ENDPOINT_METADATA_KEY, fullMetadata, target, propertyKey);
    }

    /**
     * Añade metadatos de parámetro decorado
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     * @param parameterMetadata - Metadatos del parámetro
     */
    static addParameterMetadata(target: any, propertyKey: string, parameterMetadata: ParameterMetadata): void {
        const existingParameters = this.getParameterMetadata(target, propertyKey);

        // Verificar que no haya duplicados del mismo tipo en el mismo índice
        const duplicate = existingParameters.find((p) => p.index === parameterMetadata.index && p.type === parameterMetadata.type);

        if (duplicate) {
            throw new ConfigurationError(
                `Duplicate parameter decorator @${parameterMetadata.type} at index ${parameterMetadata.index} in method ${propertyKey}`
            );
        }

        existingParameters.push(parameterMetadata);
        Reflect.defineMetadata(PARAMETER_METADATA_KEY, existingParameters, target, propertyKey);

        // Actualizar endpoint metadata si existe
        const endpointMetadata = Reflect.getMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
        if (endpointMetadata) {
            endpointMetadata.parameters = existingParameters;
            Reflect.defineMetadata(ENDPOINT_METADATA_KEY, endpointMetadata, target, propertyKey);
        }
    }

    /**
     * Obtiene metadatos de endpoint para un método específico
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     * @returns Metadatos del endpoint o undefined
     */
    static getEndpointMetadata(target: any, propertyKey: string): EndpointMetadata | undefined {
        return Reflect.getMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
    }

    /**
     * Obtiene metadatos de parámetros para un método específico
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     * @returns Array de metadatos de parámetros
     */
    static getParameterMetadata(target: any, propertyKey: string): ParameterMetadata[] {
        return Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];
    }

    /**
     * Obtiene todos los metadatos de endpoints de una clase
     * @param target - Clase o constructor
     * @returns Mapa de métodos y sus metadatos
     */
    static getAllEndpointsMetadata(target: any): Map<string, EndpointMetadata> {
        const endpoints = new Map<string, EndpointMetadata>();
        const prototype = target.prototype || target;

        const propertyNames = Object.getOwnPropertyNames(prototype);

        for (const propertyName of propertyNames) {
            if (propertyName === 'constructor') continue;

            const metadata = this.getEndpointMetadata(prototype, propertyName);
            if (metadata) {
                endpoints.set(propertyName, metadata);
            }
        }

        return endpoints;
    }

    /**
     * Valida la configuración de un método
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     */
    static validateMethodConfiguration(target: any, propertyKey: string): void {
        const metadata = this.getEndpointMetadata(target, propertyKey);
        if (!metadata) return;

        const { parameters, config } = metadata;

        // Validar que si hay @Response, debe haber responseSchema o mapper
        const hasResponseParam = parameters.some((p) => p.type === 'response');
        if (hasResponseParam && !config.responseSchema && !config.mapper) {
            throw new ConfigurationError(`Method ${propertyKey} uses @Response() but has no responseSchema or mapper configured`);
        }

        // Validar que los parámetros requeridos estén configurados
        const hasQueryParam = parameters.some((p) => p.type === 'query');
        const hasHeadersParam = parameters.some((p) => p.type === 'headers');
        const hasParamsParam = parameters.some((p) => p.type === 'params');

        if (hasQueryParam && !config.query) {
            console.warn(`Method ${propertyKey} uses @Query() but query is not enabled in config`);
        }

        if (hasHeadersParam && !config.headers) {
            console.warn(`Method ${propertyKey} uses @Headers() but headers is not enabled in config`);
        }

        if (hasParamsParam && !config.params) {
            console.warn(`Method ${propertyKey} uses @Params() but params is not enabled in config`);
        }
    }

    /**
     * Verifica si existe metadatos de endpoint para un método
     * @param target - Prototipo de la clase
     * @param propertyKey - Nombre del método
     * @returns boolean
     */
    static hasEndpointMetadata(target: any, propertyKey: string): boolean {
        return Reflect.hasMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
    }
}
