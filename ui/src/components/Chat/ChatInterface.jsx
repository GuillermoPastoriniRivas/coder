import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import api from '../../api';

export default function ChatInterface({ agentId }) {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const messagesEndRef = useRef(null);

    const loadConversation = async () => {
        try {
            const response = await api.getConversation(agentId, phone);
            setConversation(response.data.messages);
        } catch (error) {
            setConversation([]);
        }
    };

    const handleSend = async () => {
        if (!message || !phone) return;

        const newMessage = { role: 'user', content: message, timestamp: new Date() };
        setConversation((prev) => [...prev, newMessage]);

        try {
            const response = await api.sendMessage({ agentId, phone, message });
            const aiMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            };
            setConversation((prev) => [...prev, aiMessage]);
        } catch (error) {
            setConversation((prev) => prev.slice(0, -1));
        }
        setMessage('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Phone Input Header */}
            <Paper
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 0,
                    boxShadow: 1,
                    gap: 2
                }}
            >
                <TextField
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <Button variant="contained" onClick={loadConversation} disabled={!phone} sx={{ ml: 1 }}>
                                Load Chat
                            </Button>
                        )
                    }}
                    sx={{ flex: 1 }}
                />
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SmartToyIcon />
                </Avatar>
            </Paper>

            {/* Chat Messages */}
            <Box sx={{ flex: 1, p: 3, overflow: 'auto', bgcolor: 'background.paper' }}>
                <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {conversation.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '70%'
                            }}
                        >
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: msg.role === 'user' ? 'primary.light' : 'background.paper',
                                    borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                    boxShadow: 1
                                }}
                            >
                                <Typography>{msg.content}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </Typography>
                            </Paper>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Box>
            </Box>

            {/* Message Input */}
            <Paper sx={{ p: 2, borderRadius: 0, boxShadow: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    InputProps={{
                        sx: { borderRadius: 2 },
                        endAdornment: (
                            <Button variant="contained" onClick={handleSend} disabled={!message || !phone} endIcon={<SendIcon />} sx={{ ml: 1, px: 3, borderRadius: 2 }}>
                                Send
                            </Button>
                        )
                    }}
                />
            </Paper>
        </Box>
    );
}
