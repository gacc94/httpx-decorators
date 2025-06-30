import { z } from 'zod';

// Schemas de request
export const UserSignInSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const UserSignUpSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().min(18, 'Must be at least 18 years old').optional(),
});

export const CreatePostSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    tags: z.array(z.string()).optional(),
    published: z.boolean().default(false),
});

export const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    age: z.number().min(18).optional(),
});

// Schemas de response
export const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    token: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

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

export const UserListResponseSchema = z.object({
    users: z.array(UserResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
});

export const PostListResponseSchema = z.object({
    posts: z.array(PostResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
});

// Schemas de error
export const ApiErrorSchema = z.object({
    message: z.string(),
    code: z.string(),
    details: z.any().optional(),
});

// Clases de error personalizadas
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
