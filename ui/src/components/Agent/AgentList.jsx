import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid2, Card, CardContent, Typography, Button, Box, Chip, IconButton } from '@mui/material';
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
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">My Agents</Typography>
                <Button 
                    component={Link} 
                    to="/agents/new" 
                    variant="contained" 
                    startIcon={<AddCircleIcon />} 
                    sx={{ borderRadius: 2 }}
                >
                    New Agent
                </Button>
            </Box>

            <Grid2 container spacing={3}>
                {agents.map((agent) => (
                    <Grid2 item xs={12} sm={6} md={4} key={agent._id}>
                        <Card sx={{ 
                            cursor: 'pointer', 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            '&:hover': { boxShadow: 3 }
                        }}>
                            <CardContent onClick={() => navigate(`/agents/${agent._id}`)}>
                                <Typography variant="h6" gutterBottom>
                                    {agent.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {agent.description}
                                </Typography>
                                <Chip
                                    label={`${agent.tools.filter((t) => t.enabled).length} Tools enabled`}
                                    size="small"
                                    sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}
                                />
                            </CardContent>
                            
                            <Box sx={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderTop: 1,
                                borderColor: 'divider'
                            }}>
                                <Button 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyPublicLink(agent.publicId);
                                    }}
                                    startIcon={<LinkIcon />}
                                >
                                    Copy Link
                                </Button>
                                <Button 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/public/${agent.publicId}`, '_blank');
                                    }}
                                >
                                    Open Chat
                                </Button>
                            </Box>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
}