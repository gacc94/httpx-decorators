import { CustomError, HttpDecoratorError, NetworkError, ValidationError } from '../types';

export * from '../types';

export class ErrorHandler {
    static handle(error: unknown): never {
        if (error instanceof HttpDecoratorError) {
            console.error(`[${error.code}] ${error.message}`);
            if (error.details) {
                console.error('Details:', error.details);
            }
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }

    static isValidationError(error: unknown): error is ValidationError {
        return error instanceof ValidationError;
    }

    static isNetworkError(error: unknown): error is NetworkError {
        return error instanceof NetworkError;
    }

    static isCustomError(error: unknown): error is CustomError {
        return error instanceof CustomError;
    }

    static getValidationErrors(error: unknown): any[] {
        if (this.isValidationError(error)) {
            return error.details?.validationErrors || [];
        }
        return [];
    }

    static getNetworkStatus(error: unknown): number | undefined {
        if (this.isNetworkError(error)) {
            return error.details?.response?.status;
        }
        return undefined;
    }
}
