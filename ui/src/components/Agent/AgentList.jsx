import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid2, Card, CardContent, Typography, Button, Box, Chip, IconButton, Skeleton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LinkIcon from '@mui/icons-material/Link';
import api from '../../api';

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

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Header con título y botón Nuevo Agente */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>Mis Agentes</Typography>
                <Button 
                    component={Link} 
                    to="/agents/new" 
                    variant="contained" 
                    startIcon={<AddCircleIcon />} 
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Nuevo Agente
                </Button>
            </Box>

            <Grid2 container spacing={3} sx={{ mb: '60px', flexWrap: 'nowrap',  }}>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', height: '100%', transform: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>1. Crear un nuevo agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Haz clic en "Nuevo Agente" para iniciar la creación de un agente personalizado que se adapte a tus necesidades.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', height: '100%', transform: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>2. Configurar el agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Define la información básica, el prompt del sistema y la base de conocimientos para personalizar el comportamiento de tu agente.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', height: '100%', transform: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>3. Interactuar con el agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Abre la interfaz de chat para comenzar a conversar con tu agente y aprovechar sus capacidades.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2, textAlign: 'center', height: '100%', transform: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>4. Compartir tu agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Copia el enlace público de tu agente para que otros puedan interactuar con él fácilmente.
                        </Typography>
                    </Card>
                </Grid2>
            </Grid2>

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>Lista de agentes</Typography>

            <Grid2 container spacing={3}>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Grid2 item xs={12} sm={6} lg={3} key={index}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Skeleton variant="text" width="60%" height={40} />
                                    <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" width="100%" height={100} />
                                </CardContent>
                            </Card>
                        </Grid2>
                    ))
                ) : (
                    agents.map((agent) => (
                        <Grid2 item xs={12} sm={6} lg={3} key={agent._id}>
                            <Card sx={{ 
                                cursor: 'pointer', 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': { 
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}>
                                <CardContent onClick={() => navigate(`/agents/${agent._id}`)}>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {agent.name}
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
                                
                                <Box sx={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper'
                                }}>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyPublicLink(agent.publicId);
                                        }}
                                        startIcon={<LinkIcon />}
                                        sx={{ textTransform: 'none', fontWeight: 500 }}
                                    >
                                        Copiar Enlace
                                    </Button>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`/public/${agent.publicId}`, '_blank');
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 500 }}
                                    >
                                        Abrir Chat
                                    </Button>
                                </Box>
                            </Card>
                        </Grid2>
                    ))
                )}
            </Grid2>
        </Box>
    );
}