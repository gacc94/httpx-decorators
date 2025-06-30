import { z } from 'zod';

// Schemas de ejemplo
export const UserRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const UserResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    token: z.string(),
    createdAt: z.string().datetime(),
});

export const UserListResponseSchema = z.object({
    users: z.array(UserResponseSchema),
    total: z.number(),
    page: z.number(),
});

export const CreatePostSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(10),
    tags: z.array(z.string()).optional(),
});

export const PostResponseSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    authorId: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
