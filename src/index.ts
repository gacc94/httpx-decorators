import 'reflect-metadata';

// Exportar todo lo necesario para usar la librería
export * from './types';
export * from './decorators';
export * from './client';
export * from './metadata';
export * from './errors';

// Re-exportar zod para conveniencia
export { z } from 'zod';

// Exportar tipos de utilidad
export type { InferRequestType, InferResponseType, RequestParams, HttpDecoratorConfig } from './types';
