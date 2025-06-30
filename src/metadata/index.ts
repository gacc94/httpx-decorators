import 'reflect-metadata';
import { MethodMetadata, ParameterMetadata, EndpointMetadata } from '../types';

const ENDPOINT_METADATA_KEY = Symbol('endpoint');
const PARAMETER_METADATA_KEY = Symbol('parameter');

export class MetadataManager {
    static setEndpointMetadata(target: any, propertyKey: string, metadata: EndpointMetadata): void {
        const existingMetadata = this.getMethodMetadata(target, propertyKey);
        existingMetadata.endpoint = metadata;
        Reflect.defineMetadata(ENDPOINT_METADATA_KEY, existingMetadata, target, propertyKey);
    }

    static addParameterMetadata(target: any, propertyKey: string, parameterMetadata: ParameterMetadata): void {
        const existingMetadata = this.getMethodMetadata(target, propertyKey);
        existingMetadata.parameters.push(parameterMetadata);
        Reflect.defineMetadata(PARAMETER_METADATA_KEY, existingMetadata, target, propertyKey);
    }

    static getMethodMetadata(target: any, propertyKey: string): MethodMetadata {
        const endpointMetadata = Reflect.getMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
        const parameterMetadata = Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey);

        return endpointMetadata || parameterMetadata || { parameters: [] };
    }

    static getAllMethodsMetadata(target: any): Map<string, MethodMetadata> {
        const methods = new Map<string, MethodMetadata>();
        const prototype = target.prototype || target;

        const propertyNames = Object.getOwnPropertyNames(prototype);

        for (const propertyName of propertyNames) {
            if (propertyName === 'constructor') continue;

            const metadata = this.getMethodMetadata(prototype, propertyName);
            if (metadata.endpoint || metadata.parameters.length > 0) {
                methods.set(propertyName, metadata);
            }
        }

        return methods;
    }

    static hasMetadata(target: any, propertyKey: string): boolean {
        return (
            Reflect.hasMetadata(ENDPOINT_METADATA_KEY, target, propertyKey) ||
            Reflect.hasMetadata(PARAMETER_METADATA_KEY, target, propertyKey)
        );
    }
}
