export * from '../types';

export class ErrorHandler {
    static handle(error: any): never {
        if (error.name === 'HttpDecoratorError') {
            console.error(`[${error.code}] ${error.message}`);
            if (error.details) {
                console.error('Details:', error.details);
            }
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }

    static isValidationError(error: any): boolean {
        return error.code === 'VALIDATION_ERROR';
    }

    static isNetworkError(error: any): boolean {
        return error.code === 'NETWORK_ERROR';
    }
}
