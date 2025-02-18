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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>My Agents</Typography>
                <Button 
                    component={Link} 
                    to="/agents/new" 
                    variant="contained" 
                    startIcon={<AddCircleIcon />} 
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    New Agent
                </Button>
            </Box>

            <Grid2 container spacing={3}>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Grid2 item xs={12} sm={6} md={4} key={index}>
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
                        <Grid2 item xs={12} sm={6} md={4} key={agent._id}>
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
                                        label={`${agent.tools.filter((t) => t.enabled).length} Tools enabled`}
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
                                        Copy Link
                                    </Button>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`/public/${agent.publicId}`, '_blank');
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 500 }}
                                    >
                                        Open Chat
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