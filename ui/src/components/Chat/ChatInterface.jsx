import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, TextareaAutosize, CircularProgress, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api';
import '../../styles/App.css';
import { useDirectory } from '../../context/DirectoryContext';
import { parseAIMessageForFiles } from '../../utils/functions';
import { useAuth } from '../../context/AuthContext';

export default function ChatInterface({ selectedConversation, onFileChanges, selectedModel, selectedFiles, deselectFile }) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false); // State for loading
    const messagesEndRef = useRef(null);
    const { folderHandle, selectedSubFolders, setConversations } = useDirectory(); // Access selectedSubFolders
    const { updateSaldo } = useAuth();

    const fetchSaldo = async () => {
        try {
            const response = await api.getSaldo();
            updateSaldo(response.data.saldo);
        } catch (error) {
            console.error('Error fetching saldo:', error);
            updateSaldo(0);
        }
    };

    const loadConversation = async () => {
        setConversation([
            {
                role: 'default',
                content: 'Hello! I can help you understand, debug, and improve your code. Ask me about functions, errors, refactoring, or any technical queries.',
                timestamp: new Date()
            }
        ]);
    };

    useEffect(() => {
        loadConversation();
    }, [selectedConversation]);

    const handleSend = async () => {
        if (!message) return;

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        setConversation((prev) => [...prev, userMessage]);
        setLoading(true); // Start loading
        setMessage('');
        try {
            const response = await api.sendMessage({
                message,
                folder: folderHandle.name,
                subFolders: selectedSubFolders, // Include selected subFolders in the request
                selectedFiles, // Include selectedFiles in the request
                model: selectedModel // Include selected model in the request
            });

            const aiResponse = response.data.response;
            const parsedFiles = parseAIMessageForFiles(folderHandle.name, aiResponse);

            if (parsedFiles.length > 0 && onFileChanges) {
                onFileChanges(parsedFiles);
            }

            const aiMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            };
            setConversation((prev) => [...prev, aiMessage]);
            fetchSaldo();
            const responseConvs = await api.getConversations(folderHandle.name);
            setConversations(responseConvs.data); 
        } catch (error) {
            console.error('Error sending message:', error);
        }
        setMessage('');
        setLoading(false); // Stop loading
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    return (
        <Box className="chat-container">
            {/* Selected Files/Folders */}
            <Box className="selected-items" sx={{ padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedSubFolders.map((folder, index) => (
                    <Chip
                        key={index}
                        label={folder}
                        onDelete={() => deselectFile(folder)}
                        color="secondary"
                        variant="outlined"
                    />
                ))}
                {selectedFiles.map((file, index) => (
                    <Chip
                        key={index}
                        label={file}
                        onDelete={() => deselectFile(file)}
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Box>

            {/* Chat Messages */}
            <Box className="chat-messages">
                {conversation.map(
                    (msg, index) =>
                        msg.role !== 'assistant' && (
                            <Box key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                                <Typography variant="body1">{msg.content}</Typography>
                                <hr />
                                <Typography variant="caption" sx={{ color: '#ffffff86' }}>
                                    {new Date(msg.timestamp).toDateString().split(' ')[2]} {new Date(msg.timestamp).toDateString().split(' ')[1]},
                                    {' '}
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        )
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper className="chat-input" elevation={1} sx={{ display: 'flex', flexDirection: 'row', boxShadow: 'none', borderRadius: '8px', padding: '0' }}>
                <TextareaAutosize
                    minRows={3}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '20px', borderRadius: '8px', border: 'none', fontSize: '1rem' }}
                />
                <Button variant="contained" onClick={handleSend} disabled={loading || !message} endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}>
                    {' '}
                    {loading ? '' : 'Send'}
                </Button>
            </Paper>
        </Box>
    );
}