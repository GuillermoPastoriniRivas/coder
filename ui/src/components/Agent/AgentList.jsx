import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid2, Card, CardContent, Typography, Button, Box, Chip, Skeleton, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../../api';
import '../../App.css';
import InfoIcon from '@mui/icons-material/Info';

export default function AgentList() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const email = localStorage.getItem('userEmail');
    const navigate = useNavigate();

    useEffect(() => {
        const loadAgents = async () => {
            try {
                const response = await api.getAgentsByEmail(email);
                setAgents(response.data);
            } catch (error) {
                console.error('Error loading agents:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAgents();
    }, [email]);

    const copyPublicLink = (publicId) => {
        const publicUrl = `${window.location.origin}/public/${publicId}`;
        navigator.clipboard.writeText(publicUrl);
        // Puedes agregar un snackbar/notificación aquí si lo deseas
    };

    const copyID = (id) => {
        navigator.clipboard.writeText(id);
        // Puedes agregar un snackbar/notificación aquí si lo deseas
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header con título y botón Nuevo Agente */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: { xs: 2, sm: 0 } }}>
                    Crea y Gestiona tus Agentes IA
                </Typography>
                <Button
                    component={Link}
                    to="/agents/new"
                    variant="contained"
                    startIcon={<AddCircleIcon />}
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: 'primary.main',
                        '&:hover': { backgroundColor: 'primary.dark' },
                        paddingX: 3,
                        paddingY: 1.5,
                        boxShadow: 3
                    }}
                >
                    Nuevo Agente
                </Button>
            </Box>

            {/* Sección de Pasos */}
            <Box container spacing={3} sx={{ mb: '90px', flexWrap: 'nowrap' }}>
                <Grid2 container spacing={4} sx={{ flexWrap: 'nowrap' }}>
                    <Grid2 item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: 4,
                                borderRadius: 2,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: 6
                                },
                                backgroundColor: 'background.paper'
                            }}
                        >
                            <InfoIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                                    1. Crear un Agente
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Inicia la creación de un agente personalizado adaptado a tus necesidades haciendo clic en "Nuevo Agente".
                                </Typography>
                        </Card>
                    </Grid2>
                    <Grid2 item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: 4,
                                borderRadius: 2,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: 6
                                },
                                backgroundColor: 'background.paper'
                            }}
                        >
                            <InfoIcon color="secondary" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                                    2. Configurar el Agente
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Define la información básica, el prompt del sistema y las herramientas para personalizar el comportamiento de tu agente.
                                </Typography>
                        </Card>
                    </Grid2>
                    <Grid2 item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: 4,
                                borderRadius: 2,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: 6
                                },
                                backgroundColor: 'background.paper'
                            }}
                        >
                            <InfoIcon color="success" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                                    3. Interactuar
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Comienza a conversar con tu agente a través de la interfaz de chat y aprovecha sus capacidades.
                                </Typography>
                        </Card>
                    </Grid2>
                    <Grid2 item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: 4,
                                borderRadius: 2,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: 6
                                },
                                backgroundColor: 'background.paper'
                            }}
                        >
                            <InfoIcon color="warning" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                                    4. Compartir
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Comparte el enlace público de tu agente para que otros puedan interactuar con él fácilmente.
                                </Typography>
                        </Card>
                    </Grid2>
                </Grid2>
            </Box>

            {/* Lista de Agentes */}
            <Box sx={{ mb: 4, mt: 6 }}>
                <Typography variant="h5" sx={{ mt: 6, mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Lista de Agentes
                </Typography>
                <Grid2 container spacing={4}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Grid2 item xs={12} sm={6} lg={3} key={index}>
                                <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
                                    <CardContent>
                                        <Skeleton variant="text" width="80%" height={30} />
                                        <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
                                        <Skeleton variant="rectangular" width="100%" height={150} sx={{ mt: 2 }} />
                                    </CardContent>
                                </Card>
                            </Grid2>
                        ))
                    ) : agents.length > 0 ? (
                        agents.map((agent) => (
                            <Grid2 item xs={12} sm={6} lg={3} key={agent._id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: 3,
                                        borderRadius: 2,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: 6
                                        },
                                        backgroundColor: 'background.paper'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                                            {agent.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            ID: {agent._id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {agent.description}
                                        </Typography>
                                        <Chip
                                            label={`${agent.tools.filter((t) => t.enabled).length} Herramientas activas`}
                                            size="small"
                                            sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 500 }}
                                        />
                                    </CardContent>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            p: 2,
                                            borderTop: 1,
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            borderBottomLeftRadius: 2,
                                            borderBottomRightRadius: 2
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                        <Tooltip title="Copiar ID">
                                                <Button
                                                    size="small"
                                                    startIcon={<ContentCopyIcon />}
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => copyID(agent._id)}
                                                    sx={{
                                                        flex: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 500,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Copiar ID
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Editar Agente">
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => navigate(`/agents/${agent._id}`)}
                                                    sx={{
                                                        flex: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 500,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </Tooltip>
                                            
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                            <Tooltip title="Copiar enlace público">
                                                <Button
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyPublicLink(agent.publicId);
                                                    }}
                                                    startIcon={<LinkIcon />}
                                                    sx={{
                                                        flex: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 500,
                                                        bgcolor: 'primary.main',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: 'primary.dark' },
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Copiar Enlace
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Abrir Chat">
                                                <Button
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/public/${agent.publicId}`, '_blank');
                                                    }}
                                                    sx={{
                                                        flex: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 500,
                                                        bgcolor: 'success.main',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: 'success.dark' },
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Abrir Chat
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid2>
                        ))
                    ) : (
                        <Grid2 item xs={12}>
                            <Typography variant="body1" color="text.secondary" align="center">
                                No tienes agentes creados. Comienza creando uno nuevo.
                            </Typography>
                        </Grid2>
                    )}
                </Grid2>
            </Box>

            {/* Sección de API */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mt: 6, mb: 4, fontWeight: 700, color: 'text.primary' }}>
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