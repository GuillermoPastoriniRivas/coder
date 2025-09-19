import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Chip, MenuItem, Select, LinearProgress, Tooltip, IconButton, Slider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import InfoIcon from '@mui/icons-material/Info';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AttachFileIcon from '@mui/icons-material/AttachFile'; // Import attach file icon
import ClearIcon from '@mui/icons-material/Clear'; // Icon to clear attachment
import api from '../../api';
import '../../styles/App.css';
import { useDirectory } from '../../context/DirectoryContext';
import { parseAIMessageForFiles, showNotification } from '../../utils/functions';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function ChatInterface({
    selectedConversation,
    onFileChanges,
    selectedModel,
    setSelectedModel,
    selectedFiles,
    selectedSubFolders,
    deselectFile,
    deselectSubFolder,
    onRefreshRequest,
    tokenLimit,
    setTokenLimit,
    setIsDiffView
}) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const resizerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const lastUserMessageRef = useRef(null);

    const { folderHandle, setConversations } = useDirectory();
    const { saldo, updateSaldo } = useAuth();

    const [isResizing, setIsResizing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(80);
    const [textareaHeight, setTextareaHeight] = useState(80);

    const [attachedImage, setAttachedImage] = useState(null); // New state for attached image file
    const [attachedImagePreviewUrl, setAttachedImagePreviewUrl] = useState(null); // New state for image preview URL
    const fileInputRef = useRef(null); // Ref for the hidden file input

    const models = ['coder', 'qa'];

    const fetchSaldoDebounced = useRef(debounce(async () => {
         if (!localStorage.getItem('token')) return;
        try {
            const response = await api.getSaldo();
            updateSaldo(response.data.saldo);
        } catch (error) {
            console.error('Error fetching saldo:', error);
             if (error.response?.status !== 401) {
                 showNotification('Error fetching saldo in chat.', 'error');
             }
        }
    }, 500)).current;

    useEffect(() => {
        const loadInitialConversation = () => {
            if (selectedConversation && selectedConversation.messages && selectedConversation.messages.length > 0) {
                 const messagesToDisplay = selectedConversation.userMessages || selectedConversation.messages;
                 setConversation(messagesToDisplay);
                 const userMessages = messagesToDisplay.filter(m => m.role === 'user');
                 if (userMessages.length > 0) {
                     lastUserMessageRef.current = userMessages[userMessages.length - 1];
                 } else {
                     lastUserMessageRef.current = null;
                 }
            } else {
                setConversation([
                    {
                        role: 'default',
                        content: "Hello! I'm ready for instructions! Provide specific commands (e.g., 'Refactor function X in file Y'). Select relevant files/folders for context. Check Docs for tips.",
                        timestamp: new Date()
                    }
                ]);
                 lastUserMessageRef.current = null;
            }
             scrollToBottom();
        };
        loadInitialConversation();
    }, [selectedConversation]);

    const executeSendMessage = async (messageContent, isRegeneration = false) => {
        if (!messageContent.trim() && !attachedImage || loading || !folderHandle) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);

        const messageToSend = {
            role: 'user',
            content: messageContent.trim(),
            timestamp: new Date(),
            ...(attachedImagePreviewUrl && { imagePath: attachedImagePreviewUrl }) // Store local URL for immediate display
        };

        if (!isRegeneration || conversation.length === 0 || (conversation.length > 0 && conversation[conversation.length - 1]?.content !== messageToSend.content)) {
             setConversation((prev) => {
                 const filteredPrev = prev.filter(msg => msg.role !== 'default');
                 return [...filteredPrev, messageToSend];
             });
        }

        lastUserMessageRef.current = messageToSend;

        if (!isRegeneration) {
           setMessage('');
        }
        textareaRef.current?.focus();

        try {
            if (onRefreshRequest) {
                console.log("Triggering refresh before send...");
                await onRefreshRequest();
            }
        } catch (refreshError) {
            console.error("Error during pre-send refresh:", refreshError);
            showNotification(`Warning: Could not refresh context before sending: ${refreshError.message}`, 'warning');
        }

        try {
            const response = await api.sendMessage(
                {
                    message: messageToSend.content,
                    folder: folderHandle.name,
                    subFolders: selectedSubFolders,
                    selectedFiles: selectedFiles,
                    model: selectedModel,
                    conversationId: selectedConversation?._id,
                    tokenLimit: tokenLimit
                },
                { signal: abortControllerRef.current.signal, imageFile: attachedImage } // Pass imageFile here
            );

            const aiResponseContent = response.data.response;
            const newConversationId = response.data.conversationId;

            const parsedFiles = parseAIMessageForFiles(folderHandle.name, aiResponseContent);

            let displayMessageContent = '';
            if (parsedFiles.length > 0 && onFileChanges) {
                onFileChanges(parsedFiles);
                displayMessageContent = `Assistant proposed changes to ${parsedFiles.length} file(s). Review the changes in the editor.`;
            } else if (aiResponseContent.includes('--------------------') && aiResponseContent.includes('+++++')) {
                 displayMessageContent = "Assistant provided a response, but no standard file changes were detected or parsed. Review the raw response below.";
                 displayMessageContent += `--- Raw Response --- ${aiResponseContent}`;
                 console.warn("AI response looked like a diff but parsing yielded no files:", aiResponseContent);
            } else {
                displayMessageContent = aiResponseContent;
            }

            const aiMessage = {
                role: 'assistant',
                content: displayMessageContent,
                timestamp: new Date()
            };
            setConversation((prev) => [...prev, aiMessage]);

             if (setIsDiffView) {
                 if (selectedModel === 'qa') {
                     setIsDiffView(false);
                 } else if (selectedModel === 'coder') {
                     if (parsedFiles.length > 0) {
                         setIsDiffView(true);
                     } else {
                         setIsDiffView(false);
                     }
                 }
             } else {
                 console.warn("ChatInterface: setIsDiffView prop not provided. Cannot switch view automatically.");
             }

            fetchSaldoDebounced();
            const updatedConversations = await api.getConversations(folderHandle.name);
            setConversations(updatedConversations.data || []);

            if (!selectedConversation && newConversationId) {
                const newConv = updatedConversations.data.find(c => c._id === newConversationId);
                if (newConv) {
                    console.log("New conversation created, need to select it:", newConv);
                }
            }

            handleClearImage(); // Clear attached image after successful send

        } catch (error) {
             if (error.message === 'Request canceled' || axios.isCancel(error)) {
                 console.log('Request was cancelled by the user.');
                 const cancelMessage = {
                     role: 'system',
                     content: 'Request cancelled.',
                     timestamp: new Date()
                 };
                 setConversation((prev) => [...prev, cancelMessage]);
                 showNotification('Request cancelled.', 'info');
             } else {
                 console.error('Error sending message:', error);
                 const errorMessageContent = `Error: ${error.response?.data?.message || error.message || 'Failed to get response.'}`;
                 const errorMessage = {
                     role: 'system',
                     content: errorMessageContent,
                     timestamp: new Date()
                 };
                 setConversation((prev) => [...prev, errorMessage]);
                 if (!axios.isCancel(error) && error.response?.status !== 401 && error.response?.status !== 500) {
                    showNotification(errorMessageContent, 'error');
                 }
             }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
            textareaRef.current?.focus();
        }
    };

    const handleSend = async () => {
        executeSendMessage(message.replace(/`/g, "'"));
    };

    const handleRegenerate = async () => {
        if (!lastUserMessageRef.current?.content) {
            showNotification('No previous message to regenerate.', 'info');
            return;
        }
        executeSendMessage(lastUserMessageRef.current.content, true);
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log('Cancellation initiated.');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [conversation]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const deltaY = e.clientY - startY;
            const newHeight = startHeight - deltaY;
            const clampedHeight = Math.max(50, Math.min(newHeight, window.innerHeight * 0.6));
            setTextareaHeight(clampedHeight);
        };
        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                 document.body.style.cursor = 'default';
                 document.body.style.userSelect = 'auto';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, startY, startHeight]);

    const startResizing = (e) => {
        e.preventDefault();
        setIsResizing(true);
        setStartY(e.clientY);
        setStartHeight(textareaHeight);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

     const handleKeyDown = (e) => {

     };

     const handleTokenLimitChange = (event, newValue) => {
         setTokenLimit(newValue);
     };

    const handleAttachImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'image/jpeg' || file.type === 'image/png') {
                setAttachedImage(file);
                setAttachedImagePreviewUrl(URL.createObjectURL(file));
                showNotification(`Image '${file.name}' attached.`, 'info');
            } else {
                showNotification('Only JPG and PNG images are allowed.', 'error');
                setAttachedImage(null);
                setAttachedImagePreviewUrl(null);
            }
        }
    };

    const handleClearImage = () => {
        if (attachedImagePreviewUrl) {
            URL.revokeObjectURL(attachedImagePreviewUrl); // Clean up the object URL
        }
        setAttachedImage(null);
        setAttachedImagePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input
        }
    };

    const getImageUrl = (imagePath) => {
        // Construct the URL for the attached image on the server
        if (imagePath && folderHandle) {
             // Assuming your API serves images at /attachments/userId/folder/attachments/filename.jpg
            //  const baseUrl = api.defaults.baseURL;
             return `/attachments/${imagePath}`;
        }
        return null;
    };


    return (
        <Box className="chat-container">

            {(selectedFiles.length > 0 || selectedSubFolders.length > 0) && (
                <Box className="selected-items-container">
                     {selectedSubFolders.map((folderPath) => (
                        <Tooltip title={`Folder context: ${folderPath}`} key={`folder-${folderPath}`}>
                            <Chip
                                icon={<FolderIcon fontSize="small" />}
                                label={folderPath.split('/').pop() || folderPath}
                                size="small"
                                onDelete={() => deselectSubFolder(folderPath)}
                                color="secondary"
                            />
                        </Tooltip>
                     ))}
                     {selectedFiles.map((filePath) => (
                          <Tooltip title={`File context: ${filePath}`} key={`file-${filePath}`}>
                             <Chip
                                icon={<InsertDriveFileIcon fontSize="small" />}
                                label={filePath.split('/').pop() || filePath}
                                size="small"
                                onDelete={() => deselectFile(filePath)}
                                color="primary"
                            />
                         </Tooltip>
                     ))}
                </Box>
             )}

            <Box className="chat-messages">
                 {conversation.map((msg, index) => (
                     <Paper
                         key={index}
                         elevation={0}
                         className={`chat-message ${msg.role}`}
                         sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : (msg.role === 'system' ? 'error.dark' : 'background.paper') }}
                     >
                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                             {msg.content}
                         </Typography>
                         {msg.imagePath && msg.role === 'user' && (
                             <Box sx={{ mt: 1, textAlign: 'center' }}>
                                 <img
                                     src={getImageUrl(msg.imagePath)}
                                     alt="Attached"
                                     style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                 />
                             </Box>
                         )}
                         {msg.timestamp && msg.role !== 'system' && (
                            <>
                              <Typography variant="caption" display="block" align="right" sx={{ mt: 0.5 }}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                             </>
                         )}
                     </Paper>
                 ))}
                <div ref={messagesEndRef} />
            </Box>

            <Box className="chat-input-container">
                 {loading && (
                    <LinearProgress
                        variant="indeterminate"
                        sx={{ height: '3px', width: '100%' }}
                    />
                 )}

                <Paper className="chat-input-paper">
                     <Box
                        className="textarea-resizer"
                        onMouseDown={startResizing}
                        ref={resizerRef}
                        title="Drag to resize input area"
                    />

                     {attachedImagePreviewUrl && (
                        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.default' }}>
                            <img src={attachedImagePreviewUrl} alt="Attached Preview" style={{ maxWidth: '50px', maxHeight: '50px', borderRadius: '4px' }} />
                            <Typography variant="caption" sx={{ flexGrow: 1, color: 'text.secondary' }}>
                                {attachedImage?.name}
                            </Typography>
                            <IconButton size="small" onClick={handleClearImage} disabled={loading}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Box>
                     )}

                     <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Type your instruction... (e.g., 'Refactor the login component to use async/await')"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="chat-input-textarea"
                        style={{ height: `${textareaHeight}px` }}
                        disabled={loading}
                    />

                     <Box className="chat-input-controls">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                             <Select
                                 value={selectedModel}
                                 onChange={(e) => setSelectedModel(e.target.value)}
                                 variant="outlined"
                                 size="small"
                                 disabled={loading}
                                 sx={{ minWidth: 80, '& .MuiSelect-select': { py: 0.8 } }}
                             >
                                 {models.map((model) => (
                                     <MenuItem key={model} value={model}>
                                         {model}
                                     </MenuItem>
                                 ))}
                             </Select>

                             <Tooltip title={`Max Context Tokens: ${tokenLimit.toLocaleString()}`}>
                                <Box sx={{ width: '100%', maxWidth: 250, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Slider
                                        value={tokenLimit}
                                        onChange={handleTokenLimitChange}
                                        aria-labelledby="token-limit-slider"
                                        valueLabelDisplay="auto"
                                        step={10000}
                                        min={10000}
                                        max={200000}
                                        size="small"
                                        disabled={loading}
                                        valueLabelFormat={(value) => `${(value / 1000).toFixed(0)}k`}
                                        sx={{ flexGrow: 1 }}
                                    />
                                    <Typography variant="caption" sx={{ minWidth: '35px', textAlign: 'right' }}>
                                        {`${(tokenLimit / 1000).toFixed(0)}k`}
                                    </Typography>
                                </Box>
                             </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                                type="file"
                                accept="image/jpeg, image/png"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                            <Tooltip title="Attach Image (JPG, PNG)">
                                <span>
                                    <IconButton
                                        onClick={handleAttachImageClick}
                                        disabled={loading}
                                        size="small"
                                        color="secondary"
                                    >
                                        <AttachFileIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title={!lastUserMessageRef.current ? "No previous message to regenerate" : "Resend last message"}>
                                <span>
                                    <IconButton
                                        onClick={handleRegenerate}
                                        disabled={loading || !lastUserMessageRef.current || saldo <= 0}
                                        size="small"
                                        color="secondary"
                                    >
                                        <ReplayIcon fontSize="small" />
                                    </IconButton>
                                </span>
                             </Tooltip>

                             {loading && (
                                 <Tooltip title="Cancel Request">
                                     <IconButton onClick={handleCancel} size="small" color="error">
                                         <CancelIcon fontSize="small" />
                                     </IconButton>
                                 </Tooltip>
                             )}

                             <Tooltip title={saldo <= 0 ? "Insufficient credits" : (loading ? "Processing..." : "Send message (Enter)")}>
                                <span>
                                     <Button
                                         variant="contained"
                                         color="primary"
                                         onClick={handleSend}
                                         disabled={loading || (!message.trim() && !attachedImage) || saldo <= 0}
                                         startIcon={loading ? null : <SendIcon />}
                                         sx={{ py: 0.8, px: loading ? 1.5 : 2, minWidth: loading ? 'auto' : '80px' }}
                                         size="small"
                                     >
                                         {loading ? <CircularProgress size={18} color="inherit" /> : 'Send'}
                                     </Button>
                                 </span>
                             </Tooltip>
                         </Box>
                     </Box>
                </Paper>
            </Box>
        </Box>
    );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}