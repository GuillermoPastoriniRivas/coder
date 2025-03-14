import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, TextareaAutosize, CircularProgress, Chip, MenuItem, Select } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api';
import '../../styles/App.css';
import { useDirectory } from '../../context/DirectoryContext';
import { parseAIMessageForFiles } from '../../utils/functions';
import { useAuth } from '../../context/AuthContext';

export default function ChatInterface({ selectedConversation, onFileChanges, selectedModel, setSelectedModel, selectedFiles, deselectFile, deselectSubFolder }) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false); // State for loading
    const messagesEndRef = useRef(null);
    const resizerRef = useRef(null); // Ref for the resizer
    const textareaRef = useRef(null); // Ref for the textarea
    const { folderHandle, selectedSubFolders, setConversations } = useDirectory(); // Access selectedSubFolders
    const { updateSaldo } = useAuth();

    const [isResizing, setIsResizing] = useState(false);
    const [lastY, setLastY] = useState(0);
    const [textareaHeight, setTextareaHeight] = useState(100); // Initial height in px

    const models = ['o1-mini', 'gpt-4o-mini']; // Available models

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

    // Resizing Handlers
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const deltaY = e.clientY - lastY;
            setTextareaHeight((prevHeight) => {
                const newHeight = prevHeight - deltaY;
                return newHeight > 50 ? newHeight : 50; // Minimum height
            });
            setLastY(e.clientY);
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, lastY]);

    const startResizing = (e) => {
        e.preventDefault();
        setIsResizing(true);
        setLastY(e.clientY);
    };

    return (
        <Box className="chat-container">
            {/* Selected Files/Folders */}
            <Box className="selected-items" sx={{ padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedSubFolders.map((folder, index) => (
                    <Chip
                        key={index}
                        label={folder}
                        onDelete={() => deselectSubFolder(folder)}
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
            <Paper className="chat-input" elevation={1} sx={{ display: 'flex', flexDirection: 'column', boxShadow: 'none', borderRadius: '8px', padding: '0' }}>
                {/* Resizer */}
                <div
                    className="textarea-resizer"
                    onMouseDown={startResizing}
                    ref={resizerRef}
                />

                <textarea
                    ref={textareaRef}
                    minRows={3}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '20px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1rem',
                        overflow: 'auto',           // Added overflow
                        resize: 'none',             // Disable default resize
                        height: `${textareaHeight}px`,
                        boxSizing: 'border-box'
                    }}
                ></textarea>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 20px', justifyContent: 'space-between' }}>
                    <Select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Select Model' }}
                        style={{ marginRight: '10px', minWidth: '150px' }}
                    >
                        {models.map((model) => (
                            <MenuItem key={model} value={model}>
                                {model}
                            </MenuItem>
                        ))}
                    </Select>
                    <Button variant="contained" onClick={handleSend} disabled={loading || !message} endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}>
                        {loading ? '' : 'Send'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}