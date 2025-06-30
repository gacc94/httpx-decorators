import { ApiClient } from './api-client';
import { ErrorHandler } from '../errors';

async function demonstrateUsage() {
    // Crear instancia del cliente
    const api = new ApiClient('https://jsonplaceholder.typicode.com');

    try {
        console.log('🚀 Iniciando demostración de la librería HTTP Decorators\n');

        // Ejemplo 1: Sign In
        console.log('1. Intentando hacer sign in...');
        try {
            const user = await api.signIn({
                email: 'test@example.com',
                password: 'password123',
            });
            console.log('✅ Usuario autenticado:', user);

            // Configurar token para futuras requests
            api.setAuthToken(user.token);
        } catch (error) {
            console.log('ℹ️ Sign in falló (esperado con JSONPlaceholder)');
        }

        // Ejemplo 2: Obtener usuarios con filtros
        console.log('\n2. Obteniendo lista de usuarios...');
        try {
            const users = await api.getUsers({ page: 1, limit: 5 }, 'Bearer fake-token');
            console.log('✅ Usuarios obtenidos:', users);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 3: Obtener usuario específico
        console.log('\n3. Obteniendo usuario específico...');
        try {
            const user = await api.getUserById('1', 'Bearer fake-token');
            console.log('✅ Usuario obtenido:', user);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        // Ejemplo 4: Crear post
        console.log('\n4. Creando nuevo post...');
        try {
            const post = await api.createPost(
                {
                    title: 'Mi nuevo post',
                    content: 'Este es el contenido de mi post de prueba',
                },
                'Bearer fake-token'
            );
            console.log('✅ Post creado:', post);
        } catch (error) {
            console.log('ℹ️ Error esperado con schema de respuesta');
        }

        console.log('\n✨ Demostración completada');
    } catch (error) {
        ErrorHandler.handle(error);
    }
}

// Ejecutar demostración
demonstrateUsage().catch(console.error);
