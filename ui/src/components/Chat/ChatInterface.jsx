import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import api from '../../api';
import '../../styles/App.css';

export default function ChatInterface({ agentId, phoneNumber }) {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const messagesEndRef = useRef(null);

    const loadConversation = async () => {
        try {
            if (phone) {
                const response = await api.getConversation(agentId, phone);
                setConversation(response.data.messages);
            }
        } catch (error) {
            setConversation([{ role: 'assistant', content: '¡Hola! ¿En qué puedo ayudarte?', timestamp: new Date() }]);
        }
    };

    useEffect(() => {
        if (phoneNumber) {
            setPhone(phoneNumber);
        }
    }, [phoneNumber]); 

    useEffect(() => {
        loadConversation();
    }, [phone]); 


    const handleSend = async () => {
        if (!message || !phone) return;

        const messageWritten = message;
        setMessage('');

        const newMessage = { role: 'user', content: messageWritten, timestamp: new Date() };
        setConversation((prev) => [...prev, newMessage]);

        try {
            const response = await api.sendMessage({ agentId, phone, message: messageWritten });
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
        // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    }, [conversation]);

    return (
        <Box className="chat-container">
            {/* Phone Input Header */}
            <Paper className="chat-header" sx={{display: 'flex', flexDirection: 'row', boxShadow: 'none'}}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SmartToyIcon />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ml: 2 }}>
                    <TextField
                        label="Phone Number"
                        variant="outlined"
                        size="small"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        sx={{ width: '150px' }}
                    />
                    <Button variant="contained" onClick={loadConversation} disabled={!phone} sx={{ ml: 2 }}>
                        Load Chat
                    </Button>
                </Box>
                
            </Paper>

            {/* Chat Messages */}
            <Box className="chat-messages">
                {conversation.map((msg, index) => (
                    <Box
                        key={index}
                        className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                    >
                        <Typography variant="body1">{msg.content}</Typography>
                        <hr />
                        <Typography variant="caption" sx={{ color: '#ffffff86' }}>
                        {new Date(msg.timestamp).toDateString().split(' ')[2]} {new Date(msg.timestamp).toDateString().split(' ')[1]}, {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper className="chat-input" elevation={1} sx={{display: 'flex', flexDirection: 'row', boxShadow: 'none'}}>
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
                >
                </Button>
            </Paper>
        </Box>
    );
}