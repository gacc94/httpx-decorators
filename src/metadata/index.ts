import 'reflect-metadata';
import { EndpointMetadata } from '../types';

const ENDPOINT_METADATA_KEY = Symbol('http-endpoint');

export class MetadataManager {
    static setEndpointMetadata(target: any, propertyKey: string, metadata: EndpointMetadata): void {
        Reflect.defineMetadata(ENDPOINT_METADATA_KEY, metadata, target, propertyKey);
    }

    static getEndpointMetadata(target: any, propertyKey: string): EndpointMetadata | undefined {
        return Reflect.getMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
    }

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

    static hasEndpointMetadata(target: any, propertyKey: string): boolean {
        return Reflect.hasMetadata(ENDPOINT_METADATA_KEY, target, propertyKey);
    }
}
