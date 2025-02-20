import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Box, Typography, TextField, Button, Divider, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Select from 'react-select';
import api from '../../api';
import '../../App.css';

export default function AgentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const email = localStorage.getItem('userEmail');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
        knowledge: '',
        tools: []
    });

    const toolOptions = [
        { value: 'get_available_slots', label: 'Get Available Slots' },
        { value: 'confirm_date', label: 'Confirm Date' },
        { value: 'set_appointment', label: 'Set Appointment' }
    ];

    useEffect(() => {
        const loadAgent = async () => {
            if (id) {
                const response = await api.getAgent(id);
                const agent = response.data;
                console.log(agent);
                setFormData({
                    ...agent,
                    tools: agent.tools || []
                });
            }
        };
        loadAgent();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const agentData = {
            ...formData,
            owner: email
        };

        try {
            if (id) {
                await api.updateAgent(id, agentData);
            } else {
                await api.createAgent(agentData);
            }
            navigate('/agents');
        } catch (error) {
            console.error('Error saving agent:', error);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '100%', height: '90vh', overflowY: 'auto', mx: 'auto' }}>
            <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                    <SettingsIcon fontSize="large" color="primary" />
                    <Typography variant="h4" sx={{ fontSize: '1.8rem', fontWeight: 700 }}>
                        {id ? 'Editar Agente' : 'Crear Agente'}
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        {/* Left Column */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    Información Básica
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TextField
                                    fullWidth
                                    label="Nombre del Agente"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: '1rem' } }}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Descripción"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    sx={{ '& .MuiInputBase-input': { fontSize: '1rem' } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    Herramientas
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Select
                                    isMulti
                                    name="tools"
                                    options={toolOptions}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    value={toolOptions.filter(option => formData.tools.some(tool => tool.name === option.value))}
                                    onChange={(selectedOptions) => setFormData({
                                        ...formData,
                                        tools: selectedOptions ? selectedOptions.map(option => ({ name: option.value, enabled: true })) : []
                                    })}
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            borderRadius: '8px',
                                            padding: '4px',
                                            fontSize: '1rem'
                                        }),
                                        menu: (provided) => ({
                                            ...provided,
                                            borderRadius: '8px',
                                            fontSize: '1rem'
                                        }),
                                        multiValue: (provided) => ({
                                            ...provided,
                                            fontSize: '0.9rem'
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                                            color: 'black'
                                        })
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                    Configuración de IA
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Prompt del Sistema"
                                    value={formData.prompt}
                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                    required
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default', fontSize: '1rem' }
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    label="Base de Conocimientos (una por línea)"
                                    value={formData.knowledge}
                                    onChange={(e) => setFormData({ ...formData, knowledge: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default', fontSize: '1rem' }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" size="large" sx={{ px: 5, py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}>
                            Guardar Agente
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{ px: 5, py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, borderColor: '#1976d2', color: '#1976d2', '&:hover': { borderColor: '#115293', color: '#115293' } }}
                            onClick={() => navigate('/agents')}
                        >
                            Volver al Tablero
                        </Button>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
}