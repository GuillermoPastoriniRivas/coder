import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, TextareaAutosize } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api';
import '../../styles/App.css';
import { useDirectory } from '../../context/DirectoryContext';

export default function ChatInterface({ selectedConversation }) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const messagesEndRef = useRef(null);
    const { folderHandle } = useDirectory();

    const loadConversation = async () => {
        try {
            if (selectedConversation) {
                const response = await api.getConversation(selectedConversation._id);
                setConversation(response.data.messages);
            } else {
                setConversation([{ role: 'default', content: 'Hello! I can help you understand, debug, and improve your code. Ask me about functions, errors, refactoring, or any technical queries.', timestamp: new Date() }]);
            }
        } catch (error) {
            setConversation([{ role: 'default', content: 'Hello! I can help you understand, debug, and improve your code. Ask me about functions, errors, refactoring, or any technical queries.', timestamp: new Date() }]);
        }
    };

    useEffect(() => {
        loadConversation();
    }, []); 

    const handleSend = async () => {
        if (!message) return;

        const messageWritten = message;
        

        const newMessage = { role: 'user', content: messageWritten, timestamp: new Date() };
        setConversation((prev) => [...prev, newMessage]);

        try {
            let response;
            response = await api.sendMessage({ message: messageWritten, folder: folderHandle.name });
            
            const aiMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            };
            setConversation((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessage(messageWritten);
            // setConversation((prev) => prev.slice(0, -1));
        }
        setMessage('');
    };


    useEffect(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    }, [conversation]);

    return (
        <Box className="chat-container">
            {/* Chat Messages */}
            <Box className="chat-messages">
                {conversation.map((msg, index) => msg.role !== 'assistant' && (
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
            <Paper className="chat-input" elevation={1} sx={{display: 'flex', flexDirection: 'row', boxShadow: 'none', borderRadius: '8px', padding: '0'}}>
                <TextareaAutosize
                    minRows={3}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '20px', borderRadius: '8px', border: 'none',  fontSize: '1rem' }}
                />
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={!message}
                    endIcon={<SendIcon />}
                > Send
                </Button>
            </Paper>
        </Box>
    );
};