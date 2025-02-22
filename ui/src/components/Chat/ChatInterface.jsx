import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import api from '../../api';
import '../../App.css';

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
        <Box className="chat-container">
            {/* Phone Input Header */}
            <Paper className="chat-header" elevation={1} sx={{display: 'flex', flexDirection: 'row'}}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <SmartToyIcon />
                </Avatar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Chat with Agent
                </Typography>
                <TextField
                    label="Phone Number"
                    variant="outlined"
                    size="small"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    sx={{ width: '150px' }}
                />
                <Button variant="contained" onClick={loadConversation} disabled={!phone} sx={{ ml: 2 }}>
                    Load
                </Button>
            </Paper>

            {/* Chat Messages */}
            <Box className="chat-messages">
                {conversation.map((msg, index) => (
                    <Box
                        key={index}
                        className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                    >
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper className="chat-input" elevation={1}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!message || !phone}
                    endIcon={<SendIcon />}
                    sx={{ ml: 2 }}
                >
                    Send
                </Button>
            </Paper>
        </Box>
    );
}