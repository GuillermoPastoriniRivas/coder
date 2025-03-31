import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Chip, MenuItem, Select, LinearProgress, Tooltip } from '@mui/material';
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
    const [progress, setProgress] = useState(0); // State for progress bar
    const progressInterval = useRef(null); // Ref for progress interval
    const messagesEndRef = useRef(null);
    const resizerRef = useRef(null); // Ref for the resizer
    const textareaRef = useRef(null); // Ref for the textarea
    const { folderHandle, selectedSubFolders, setConversations } = useDirectory(); // Access selectedSubFolders
    const { saldo, updateSaldo } = useAuth();

    const [isResizing, setIsResizing] = useState(false);
    const [lastY, setLastY] = useState(0);
    const [textareaHeight, setTextareaHeight] = useState(100); // Initial height in px

    const models = ['coder']; // Available models

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
        if (selectedConversation) {
            if (selectedConversation.userMessages && selectedConversation.userMessages.length > 0) {
                setConversation([selectedConversation.userMessages[0]]);
            } else if (selectedConversation.messages && selectedConversation.messages.length > 0) {
                setConversation(selectedConversation.messages);
            } else {
                setConversation([
                    {
                        role: 'default',
                        content: "Hello! I can generate code changes based on your instructions. Just tell me what you want to modify",
                        timestamp: new Date()
                    }
                ]);
            }
        } else {
            setConversation([
                {
                    role: 'default',
                    content: "Hello! I can generate code changes based on your instructions. Just tell me what you want to modify",
                    timestamp: new Date()
                }
            ]);
        }
    };

    useEffect(() => {
        loadConversation();
    }, [selectedConversation]);

    const handleSend = async () => {
        if (!message) return;

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        setConversation((prev) => [...prev, userMessage]);
        setLoading(true); // Start loading
        setProgress(0); // Initialize progress
        setMessage('');
        
        // Start Progress Interval
        progressInterval.current = setInterval(() => {
            setProgress((prev) => {
                if (prev < 20) return prev + 7;
                if (prev < 80) return prev + 4;
                return prev;
            });
        }, 2000); // Every 2 seconds

        try {
            const response = await api.sendMessage({
                message,
                folder: folderHandle.name,
                subFolders: selectedSubFolders, // Include selectedSubFolders in the request
                selectedFiles, // Include selectedFiles in the request
                model: selectedModel // Include selected model in the request
            });

            const aiResponse = response.data.response;
            const parsedFiles = parseAIMessageForFiles(folderHandle.name, aiResponse);

            if (parsedFiles.length > 0 && onFileChanges) {
                onFileChanges(parsedFiles);
            }

            const aiMessage = {
                role: 'default',
                content: 'Your instruction has been completed. Please review and apply the changes.',
                timestamp: new Date()
            }
            setConversation((prev) => [...prev, aiMessage]);
            fetchSaldo();
            const responseConvs = await api.getConversations(folderHandle.name);
            setConversations(responseConvs.data); 

            // Fast forward progress to 100%
            clearInterval(progressInterval.current);
            setProgress(80);
            setTimeout(() => setProgress(90), 300);
            setTimeout(() => setProgress(100), 500);
            setTimeout(() => {
                setMessage('');
                setLoading(false); 
            }, 600);
            
        } catch (error) {
            console.error('Error sending message:', error);
        }
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

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

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

                {/* Progress Bar */}
                {loading && (
                    <LinearProgress
                        variant="determinate"
                        color='primary'
                        value={progress}
                        sx={{ height: 4, borderRadius: 2, mt: 0, width: '100%' }}
                    />
                )}

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
                                {model} {' '}
                                {/* <i style={{fontSize: '12px', marginLeft: '5px'}}>{model === 'o3-mini' ? ' 1 credit' : ' free'}</i> */}
                            </MenuItem>
                        ))}
                    </Select>
                    {saldo === 0 ? (
                        <Tooltip title="No tienes creditos para hacer esta consulta">
                            <span>
                                <Button variant="contained" onClick={handleSend} disabled={loading || !message || saldo === 0} endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}>
                                    {loading ? '' : 'Send'}
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Button variant="contained" onClick={handleSend} disabled={loading || !message} endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}>
                            {loading ? '' : 'Send'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}