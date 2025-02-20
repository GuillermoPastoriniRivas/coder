import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Box, Typography, TextField, Button, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Select from 'react-select';
import api from '../../api';

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
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <SettingsIcon fontSize="large" color="primary" />
                    <Typography variant="h4">{id ? 'Edit Agent' : 'Create Agent'}</Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Basic Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <TextField
                            fullWidth
                            label="Agent Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            AI Configuration
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="System Prompt"
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                            required
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' }
                            }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="Knowledge Base (one per line)"
                            value={formData.knowledge}
                            onChange={(e) => setFormData({ ...formData, knowledge: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' }
                            }}
                        />
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Tools
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
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
                        />
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" size="large" sx={{ px: 5, py: 1.5, borderRadius: 2 }}>
                            Save Agent
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{ px: 5, py: 1.5, borderRadius: 2 }}
                            onClick={() => navigate('/agents')}
                        >
                            Back to Dashboard
                        </Button>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
}