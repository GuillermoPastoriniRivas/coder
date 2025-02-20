import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid2, Card, CardContent, Typography, Button, Box, Chip, IconButton, Skeleton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LinkIcon from '@mui/icons-material/Link';
import api from '../../api';
import '../../App.css';

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
        // Puedes agregar un snackbar/notificaci\u00f3n aqu\u00ed si lo deseas
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Header con t\u00edtulo y bot\u00f3n Nuevo Agente */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>Crea tus propios Agentes IA</Typography>
                <Button 
                    component={Link} 
                    to="/agents/new" 
                    variant="contained" 
                    startIcon={<AddCircleIcon />} 
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}
                >
                    Nuevo Agente
                </Button>
            </Box>

            <Grid2 container spacing={3} sx={{ mb: '60px', flexWrap: 'nowrap',  }}>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        height: '100%', 
                        boxShadow: 3, 
                        borderRadius: 3 
                    }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>1. Crear un nuevo agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Haz clic en "Nuevo Agente" para iniciar la creaci\u00f3n de un agente personalizado que se adapte a tus necesidades.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        height: '100%', 
                        boxShadow: 3, 
                        borderRadius: 3 
                    }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>2. Configurar el agente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Define la informaci\u00f3n b\u00e1sica, el prompt del sistema y la base de conocimientos para personalizar el comportamiento de tu agente.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        height: '100%', 
                        boxShadow: 3, 
                        borderRadius: 3 
                    }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>3. Interactuar</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Abre la interfaz de chat para comenzar a conversar con tu agente y aprovechar sus capacidades.
                        </Typography>
                    </Card>
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                        p: 2, 
                        textAlign: 'center', 
                        height: '100%', 
                        boxShadow: 3, 
                        borderRadius: 3 
                    }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>4. Compartir</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Copia el enlace p\u00fablico de tu agente para que otros puedan interactuar con \u00e9l f\u00e1cilmente.
                        </Typography>
                    </Card>
                </Grid2>
            </Grid2>

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>Lista de agentes</Typography>

            <Grid2 container spacing={3}>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Grid2 item xs={12} sm={6} lg={3} key={index}>
                            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 3 }}>
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
                                boxShadow: 3,
                                borderRadius: 3
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
                                    bgcolor: 'background.paper',
                                    borderRadius: '0 0 16px 16px'
                                }}>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyPublicLink(agent.publicId);
                                        }}
                                        startIcon={<LinkIcon />}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 500, 
                                            bgcolor: '#1976d2', 
                                            color: '#fff',
                                            '&:hover': { bgcolor: '#115293' },
                                            borderRadius: 2
                                        }}
                                    >
                                        Copiar Enlace
                                    </Button>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`/public/${agent.publicId}`, '_blank');
                                        }}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 500, 
                                            bgcolor: '#4caf50', 
                                            color: '#fff',
                                            '&:hover': { bgcolor: '#357a38' },
                                            borderRadius: 2
                                        }}
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