import React from 'react';
import { Box, Typography, Card, Divider } from '@mui/material';

export default function Docs() {
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Nueva Sección: Integración del Widget */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mt: 1, mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Cómo Integrar tu Agente en tu Página Web mediante el Widget
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Para facilitar la interacción de los usuarios con tu agente IA directamente desde tu página web, puedes integrar el widget proporcionado. Sigue estos sencillos pasos:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        1. Incluir el Script del Widget
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Añade el siguiente fragmento de código dentro de la etiqueta &lt;head&gt; o antes de la etiqueta &lt;/body&gt; en tu página web. Asegúrate de reemplazar <strong>tu-agent-id</strong> con el ID de tu agente.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Código del Widget:</strong>
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            mb: 2,
                            ml: 2,
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflowX: 'auto'
                        }}
                    >
                        {`<script src="/widget.js" data-agent-id="tu-agent-id"></script>`}
                    </Box>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        2. Personalizar la Posición del Widget
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        El widget se posicionará de forma fija en la esquina inferior derecha de tu página web. Puedes personalizar su posición modificando las propiedades de estilo en el archivo <strong>widget.js</strong>.
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        3. Probar la Integración
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Una vez incluido el script, carga tu página web y deberías ver el widget del chat en la posición especificada. Haz clic en él para iniciar una conversación con tu agente.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Ejemplo de inclusión en HTML:</strong>
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            mb: 2,
                            ml: 2,
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflowX: 'auto'
                        }}
                    >
                        {`<!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mi Página Web</title>
            <!-- Incluir el script del widget -->
            <script src="/widget.js" data-agent-id="tu-agent-id"></script>
        </head>
        <body>
            <!-- Contenido de tu página web -->

        </body>
    </html>`}
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Siguiendo estos pasos, podrás ofrecer una experiencia interactiva y personalizada a los visitantes de tu página web, permitiéndoles comunicarse directamente con tu agente IA a través del widget.
                    </Typography>
                </Card>
            </Box>
            {/* Sección de API */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mt: 4, mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Cómo Interactuar con tu Agente usando la API
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Puedes integrar tu agente IA en otras aplicaciones o servicios utilizando nuestras llamadas a la API. A continuación, te mostramos cómo hacerlo con ejemplos
                        prácticos y pasos sencillos:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        1. Obtener el enlace público de tu agente
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Ve a la lista de agentes y haz clic en "Copiar Enlace" para obtener la URL pública de tu agente.
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        2. Realizar una solicitud a la API
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Envía una solicitud POST a la siguiente URL:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'monospace', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
                        POST https://tudominio.com/api/call
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Incluye en el cuerpo de la solicitud los siguientes parámetros:
                    </Typography>
                    <Box component="div" sx={{ mb: 2, ml: 2 }}>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                            phone:
                        </Typography>{' '}
                        Tu número de teléfono
                        <br />
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                            message:
                        </Typography>{' '}
                        El mensaje que quieres enviar al agente
                        <br />
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                            agentId:
                        </Typography>{' '}
                        El ID de tu agente
                    </Box>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        3. Manejar la respuesta de la API
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        La API responderá con el mensaje generado por el agente, que puedes utilizar en tu aplicación.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Ejemplo de solicitud usando fetch:</strong>
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            mb: 2,
                            ml: 2,
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflowX: 'auto'
                        }}
                    >
                        {`fetch('https://tudominio.com/api/call', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        phone: '1234567890',
        message: 'Hola, ¿puedes ayudarme?',
        agentId: 'tu-agent-id'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Respuesta del agente:', data.response);
})
.catch(error => {
    console.error('Error:', error);
});`}
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Con estos simples pasos, puedes comenzar a integrar y aprovechar las capacidades de tu agente IA en cualquier aplicación que desees.
                    </Typography>
                </Card>
            </Box>

            
        </Box>
    );
}