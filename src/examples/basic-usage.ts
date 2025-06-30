import { ApiClient } from './api-client';
import { ErrorHandler } from '../errors';

async function demonstrateNewAPI() {
    console.log('🚀 Demostración de la nueva API con decoradores unificados\n');

    // Crear instancia del cliente
    const api = new ApiClient('https://jsonplaceholder.typicode.com');

    // Configurar hooks de autenticación
    api.setupAuthHooks();

    try {
        // Ejemplo 1: Sign In con nueva sintaxis
        console.log('1. 🔐 Intentando hacer sign in...');
        try {
            const user = await api.signIn({
                body: {
                    email: 'test@example.com',
                    password: 'password123',
                },
                headers: {
                    'User-Agent': 'HttpDecorators/2.0',
                },
            });

            console.log('✅ Usuario autenticado:', user);
            api.setAuthToken(user.token);
        } catch (error) {
            console.log('ℹ️ Sign in falló (esperado con JSONPlaceholder)');
            // Usar token fake para continuar con la demo
            api.setAuthToken('fake-jwt-token');
        }

        // Ejemplo 2: Obtener usuarios con filtros
        console.log('\n2. 👥 Obteniendo lista de usuarios...');
        try {
            const users = await api.getUsers({
                query: {
                    page: 1,
                    limit: 5,
                    search: 'john',
                },
                headers: {
                    Authorization: 'Bearer fake-token',
                },
            });
            console.log('✅ Usuarios obtenidos:', users);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
            if (ErrorHandler.isValidationError(error)) {
                console.log('📋 Errores de validación:', ErrorHandler.getValidationErrors(error));
            }
        }

        // Ejemplo 3: Obtener usuario específico
        console.log('\n3. 👤 Obteniendo usuario específico...');
        try {
            const user = await api.getUserById({
                params: { id: '1' },
                headers: { Authorization: 'Bearer fake-token' },
            });
            console.log('✅ Usuario obtenido:', user);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 4: Crear post con validación
        console.log('\n4. 📝 Creando nuevo post...');
        try {
            const post = await api.createPost({
                body: {
                    title: 'Mi nuevo post con decoradores unificados',
                    content: 'Este es el contenido de mi post usando la nueva API con configuración unificada en los decoradores.',
                    tags: ['typescript', 'decorators', 'http'],
                    published: true,
                },
                headers: { Authorization: 'Bearer fake-token' },
            });
            console.log('✅ Post creado:', post);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 5: Actualizar usuario
        console.log('\n5. ✏️ Actualizando usuario...');
        try {
            const updatedUser = await api.updateUser({
                params: { id: '1' },
                body: {
                    name: 'John Doe Updated',
                    age: 30,
                },
                headers: { Authorization: 'Bearer fake-token' },
            });
            console.log('✅ Usuario actualizado:', updatedUser);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 6: Manejo de errores personalizados
        console.log('\n6. ❌ Probando manejo de errores...');
        try {
            await api.getUserById({
                params: { id: 'nonexistent' },
                headers: { Authorization: 'Bearer fake-token' },
            });
        } catch (error) {
            if (ErrorHandler.isCustomError(error)) {
                console.log('🔧 Error personalizado capturado:', error.message);
            } else if (ErrorHandler.isNetworkError(error)) {
                console.log('🌐 Error de red:', ErrorHandler.getNetworkStatus(error));
            } else if (error instanceof Error) {
                console.log('⚠️ Error general:', error.message);
            } else {
                console.log('⚠️ Error general:', String(error));
            }
        }

        console.log('\n✨ Demostración completada exitosamente');
    } catch (error) {
        console.error('\n💥 Error inesperado en la demostración:');
        ErrorHandler.handle(error);
    }
}

// Función para demostrar hooks personalizados
async function demonstrateHooks() {
    console.log('\n🪝 Demostración de hooks personalizados\n');

    const api = new ApiClient('https://jsonplaceholder.typicode.com');

    // Agregar hook de request personalizado
    api.addRequestHook(async (context) => {
        console.log(`📤 Request Hook: ${context.method} ${context.url}`);

        // Agregar timestamp a headers
        if (!context.headers) context.headers = {};
        context.headers['X-Request-Time'] = new Date().toISOString();

        return context;
    });

    // Agregar hook de response personalizado
    api.addResponseHook(async (response, context) => {
        console.log(`📥 Response Hook: Received response for ${context.url}`);

        // Agregar metadata a la respuesta
        if (typeof response === 'object' && response !== null) {
            response._metadata = {
                requestTime: new Date().toISOString(),
                endpoint: context.url,
            };
        }

        return response;
    });

    // Agregar hook de error personalizado
    api.addErrorHook(async (error, context) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`🚨 Error Hook: Error in ${context.url} - ${errorMessage}`);

        // Log del error para analytics
        console.log('📊 Logging error for analytics...');

        return error;
    });

    try {
        const users = await api.getUsers({
            query: { page: 1, limit: 3 },
            headers: { Authorization: 'Bearer fake-token' },
        });

        console.log('✅ Respuesta con hooks aplicados:', users);
    } catch (error) {
        console.log('ℹ️ Error manejado por hooks');
    }
}

// Ejecutar demostraciones
async function runDemo() {
    await demonstrateNewAPI();
    await demonstrateHooks();
}

runDemo().catch(console.error);
