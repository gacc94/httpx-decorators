import { z } from 'zod';

/**
 * Schema para datos de sign in
 */
export const UserSignInSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Schema para crear usuario
 */
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().min(18, 'Must be at least 18 years old').optional(),
});

/**
 * Schema para actualizar usuario
 */
export const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    age: z.number().min(18).optional(),
});

/**
 * Schema para crear post
 */
export const CreatePostSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    tags: z.array(z.string()).optional(),
    published: z.boolean().default(false),
});

/**
 * Schema de respuesta de usuario
 */
export const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    token: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Schema de respuesta de post
 */
export const PostResponseSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    authorId: z.string(),
    tags: z.array(z.string()),
    published: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Schema de lista de usuarios
 */
export const UserListResponseSchema = z.object({
    users: z.array(UserResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
});

/**
 * Clase de dominio User
 */
export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        public readonly token: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static fromApiResponse(data: z.infer<typeof UserResponseSchema>): User {
        return new User(data.id, data.email, data.name, data.token, new Date(data.createdAt), new Date(data.updatedAt));
    }

    get displayName(): string {
        return this.name || this.email;
    }

    get isTokenValid(): boolean {
        return typeof this.token === 'string' && this.token.length > 0;
    }
}

/**
 * Clase de dominio Post
 */
export class Post {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly content: string,
        public readonly authorId: string,
        public readonly tags: string[],
        public readonly published: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static fromApiResponse(data: z.infer<typeof PostResponseSchema>): Post {
        return new Post(
            data.id,
            data.title,
            data.content,
            data.authorId,
            data.tags,
            data.published,
            new Date(data.createdAt),
            new Date(data.updatedAt)
        );
    }

    get excerpt(): string {
        return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
    }
}

/**
 * Errores personalizados
 */
export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends Error {
    constructor(message: string = 'Validation failed') {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
