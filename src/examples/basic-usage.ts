import { ApiClient } from './api-client';
import { ErrorHandler } from '../errors';

/**
 * Demostración completa de la librería httx-decorators con @Request()
 */
async function demonstrateHttpDecorators() {
    console.log('🚀 Demostración de httx-decorators con @Request()\n');

    const api = new ApiClient('https://jsonplaceholder.typicode.com');
    api.setupAuthHooks();

    try {
        // Ejemplo 1: POST con @Request() para validar credenciales
        console.log('1. 🔐 Sign in con @Request() para validar credenciales...');
        try {
            const user = await api.signIn(
                { email: 'test@example.com', password: 'password123' }, // @Request()
                { remember: true }, // @Query()
                { 'User-Agent': 'httx-decorators/1.0' }, // @Headers()
                undefined as any // @Response() se inyecta automáticamente
            );

            console.log('✅ Usuario autenticado:', user.displayName);
            console.log('🔑 Token válido:', user.isTokenValid);
            api.setAuthToken(user.token);
        } catch (error) {
            console.log('ℹ️ Sign in falló (esperado con JSONPlaceholder)');
            api.setAuthToken('fake-jwt-token');
        }

        // Ejemplo 2: POST con @Request() para crear usuario
        console.log('\n2. 👤 Crear usuario con @Request() para validar datos...');
        try {
            const newUser = await api.createUser(
                {
                    // @Request()
                    email: 'newuser@example.com',
                    password: 'securepass123',
                    name: 'John Doe',
                    age: 25,
                },
                { Authorization: 'Bearer fake-token' }, // @Headers()
                undefined as any // @Response()
            );

            console.log('✅ Usuario creado:', newUser.displayName);
        } catch (error) {
            console.log('ℹ️ Error esperado con JSONPlaceholder');
            if (ErrorHandler.isValidationError(error)) {
                console.log('📋 Errores de validación:', ErrorHandler.getValidationErrors(error));
            }
        }

        // Ejemplo 3: GET sin @Request() (típico para GET)
        console.log('\n3. 👤 Obtener usuario por ID (GET sin @Request())...');
        try {
            const user = await api.getUserById(
                { id: '1' }, // @Params()
                { Authorization: 'Bearer fake-token' }, // @Headers()
                undefined as any // @Response()
            );

            console.log('✅ Usuario obtenido:', user.displayName);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 4: GET con query parameters
        console.log('\n4. 👥 Obtener usuarios con query parameters...');
        try {
            const users = await api.getUsers(
                { page: 1, limit: 5, search: 'john' }, // @Query()
                { Authorization: 'Bearer fake-token' }, // @Headers()
                undefined as any // @Response()
            );

            console.log('✅ Usuarios obtenidos:', users.total);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 5: PUT con @Request() para actualizar
        console.log('\n5. ✏️ Actualizar usuario con @Request()...');
        try {
            const updatedUser = await api.updateUser(
                { name: 'John Doe Updated', age: 26 }, // @Request()
                { id: '1' }, // @Params()
                { Authorization: 'Bearer fake-token' }, // @Headers()
                undefined as any // @Response()
            );

            console.log('✅ Usuario actualizado:', updatedUser.displayName);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 6: POST con @Request() para crear post
        console.log('\n6. 📝 Crear post con @Request() para validar contenido...');
        try {
            const post = await api.createPost(
                {
                    // @Request()
                    title: 'Mi post con @Request()',
                    content:
                        'Este post demuestra el uso del decorador @Request() para validar automáticamente el cuerpo de la petición usando Zod schemas.',
                    tags: ['typescript', 'decorators', 'validation'],
                    published: true,
                },
                { Authorization: 'Bearer fake-token' }, // @Headers()
                undefined as any // @Response()
            );

            console.log('✅ Post creado:', post.title);
            console.log('📄 Excerpt:', post.excerpt);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 7: DELETE sin @Request()
        console.log('\n7. 🗑️ Eliminar usuario...');
        try {
            await api.deleteUser(
                { id: '1' }, // @Params()
                { Authorization: 'Bearer fake-token' } // @Headers()
            );

            console.log('✅ Usuario eliminado correctamente');
        } catch (error) {
            console.log('ℹ️ Error esperado con JSONPlaceholder');
        }

        console.log('\n✨ Demostración completada exitosamente');
    } catch (error) {
        console.error('\n💥 Error inesperado en la demostración:');
        ErrorHandler.handle(error);
    }
}

/**
 * Demostración de validación de errores
 */
async function demonstrateValidation() {
    console.log('\n🔍 Demostración de validación con @Request()\n');

    const api = new ApiClient('https://jsonplaceholder.typicode.com');

    try {
        // Intentar crear usuario con datos inválidos
        console.log('❌ Intentando crear usuario con datos inválidos...');

        await api.createUser(
            {
                // @Request() - datos inválidos
                email: 'invalid-email', // Email inválido
                password: '123', // Password muy corto
                name: 'A', // Nombre muy corto
                age: 15, // Edad menor a 18
            },
            { Authorization: 'Bearer fake-token' },
            undefined as any
        );
    } catch (error) {
        if (ErrorHandler.isValidationError(error)) {
            console.log('✅ Validación funcionó correctamente');
            console.log('📋 Errores encontrados:');
            const validationErrors = ErrorHandler.getValidationErrors(error);
            validationErrors.forEach((err: any) => {
                console.log(`  - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            if (typeof error === 'object' && error !== null && 'message' in error) {
                console.log('⚠️ Error inesperado:', (error as { message: string }).message);
            } else {
                console.log('⚠️ Error inesperado:', error);
            }
        }
    }
}

// Ejecutar demostraciones
async function runDemo() {
    await demonstrateHttpDecorators();
    await demonstrateValidation();
}

runDemo().catch(console.error);
