import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Chip, MenuItem, Select, LinearProgress, Tooltip, IconButton, Slider } from '@mui/material'; // Added Slider
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel'; // Icon for Cancel
import ReplayIcon from '@mui/icons-material/Replay'; // Icon for Regenerate
import InfoIcon from '@mui/icons-material/Info'; // For info tooltip
import FolderIcon from '@mui/icons-material/Folder'; // For folder chip icon
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // For file chip icon
import api from '../../api';
import '../../styles/App.css'; // Keep general app styles
import { useDirectory } from '../../context/DirectoryContext';
import { parseAIMessageForFiles, showNotification } from '../../utils/functions'; // Import showNotification
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'; // Import axios to check for cancellation error

export default function ChatInterface({
    selectedConversation,
    onFileChanges, // Callback when AI provides file changes
    selectedModel,
    setSelectedModel,
    selectedFiles,    // Array of selected file paths
    selectedSubFolders, // Array of selected folder paths
    deselectFile,
    deselectSubFolder,
    onRefreshRequest, // Callback to trigger the main refresh logic
    tokenLimit,      // Receive tokenLimit state
    setTokenLimit,   // Receive function to update tokenLimit state
    setIsDiffView    // Prop to set the view mode (Diff vs Editor)
}) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]); // Stores message objects { role, content, timestamp }
    const [loading, setLoading] = useState(false); // For send message loading state
    const messagesEndRef = useRef(null); // To scroll chat to bottom
    const textareaRef = useRef(null); // To manage textarea focus and height potentially
    const resizerRef = useRef(null); // For the textarea resizer handle
    const abortControllerRef = useRef(null); // Ref to hold the AbortController
    const lastUserMessageRef = useRef(null); // Ref to store the last sent user message for regeneration

    const { folderHandle, setConversations } = useDirectory();
    const { saldo, updateSaldo } = useAuth();

    const [isResizing, setIsResizing] = useState(false);
    const [startY, setStartY] = useState(0); // Store initial Y position on drag start
    const [startHeight, setStartHeight] = useState(80); // Store initial height on drag start
    const [textareaHeight, setTextareaHeight] = useState(80); // Initial height (adjust as needed)

    const models = ['coder', 'qa']; // Available models (update if more are added)

    // Debounced saldo fetch function (optional, to avoid rapid fetches)
    const fetchSaldoDebounced = useRef(debounce(async () => {
         if (!localStorage.getItem('token')) return; // Don't fetch if logged out
        try {
            const response = await api.getSaldo();
            updateSaldo(response.data.saldo);
        } catch (error) {
            console.error('Error fetching saldo:', error);
             // Handle error appropriately, maybe logout or show message
             // updateSaldo(0); // Reset saldo on error?
             // Use enhanced notification only if not automatically handled by 401 interceptor
             if (error.response?.status !== 401) {
                 showNotification('Error fetching saldo in chat.', 'error');
             }
        }
    }, 500)).current; // 500ms debounce


    // Load conversation history when selectedConversation changes
    useEffect(() => {
        const loadInitialConversation = () => {
            if (selectedConversation && selectedConversation.messages && selectedConversation.messages.length > 0) {
                 // Filter out assistant messages if they only contain file diffs (handled by FileContent)
                 // Or decide how to display them (e.g., "Assistant proposed changes...")
                 // Use userMessages directly if available, otherwise fallback to messages
                 const messagesToDisplay = selectedConversation.userMessages || selectedConversation.messages;
                 setConversation(messagesToDisplay);
                 // Store the last user message from the loaded conversation if applicable
                 const userMessages = messagesToDisplay.filter(m => m.role === 'user');
                 if (userMessages.length > 0) {
                     lastUserMessageRef.current = userMessages[userMessages.length - 1];
                 } else {
                     lastUserMessageRef.current = null; // Reset if no user messages in history
                 }
            } else {
                // Default initial message if no conversation history
                setConversation([
                    {
                        role: 'default', // Use 'default' or 'system'
                        content: "Hello! I'm ready for instructions! Provide specific commands (e.g., 'Refactor function X in file Y'). Select relevant files/folders for context. Check Docs for tips.",
                        timestamp: new Date()
                    }
                ]);
                 lastUserMessageRef.current = null; // Reset on new/empty conversation
            }
             // Scroll to bottom after loading
             scrollToBottom();
        };
        loadInitialConversation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation]); // Rerun only when the selected conversation object changes

    // --- Core Message Sending Logic (Extracted) ---
    const executeSendMessage = async (messageContent, isRegeneration = false) => {
        if (!messageContent.trim() || loading || !folderHandle) return; // Basic validation

        // Abort previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create and store new AbortController
        abortControllerRef.current = new AbortController();

        setLoading(true); // Set loading state

        const messageToSend = { role: 'user', content: messageContent.trim(), timestamp: new Date() };

        // Add user message to conversation *only if it's not a regeneration of the exact same last message*
        // Or if it's the first message after the default greeting
        if (!isRegeneration || conversation.length === 0 || (conversation.length > 0 && conversation[conversation.length - 1]?.content !== messageToSend.content)) {
             setConversation((prev) => {
                 // Filter out the initial 'default' message if present before adding user message
                 const filteredPrev = prev.filter(msg => msg.role !== 'default');
                 return [...filteredPrev, messageToSend];
             });
        }

        // Store this message as the last user message sent
        lastUserMessageRef.current = messageToSend;

        if (!isRegeneration) {
           setMessage(''); // Clear input field only if it was a new message
        }
        textareaRef.current?.focus(); // Refocus textarea

        // Trigger refresh before sending the message (optional)
        try {
            if (onRefreshRequest) {
                console.log("Triggering refresh before send...");
                await onRefreshRequest();
            }
        } catch (refreshError) {
            console.error("Error during pre-send refresh:", refreshError);
            showNotification(`Warning: Could not refresh context before sending: ${refreshError.message}`, 'warning');
            // Optionally notify user or proceed anyway?
            // For now, proceed even if refresh fails
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
                    tokenLimit: tokenLimit // Include tokenLimit in the payload
                },
                { signal: abortControllerRef.current.signal } // Pass the signal
            );

            const aiResponseContent = response.data.response; // The raw response from AI
            const newConversationId = response.data.conversationId; // ID of the created/updated conversation

            const parsedFiles = parseAIMessageForFiles(folderHandle.name, aiResponseContent);

            let displayMessageContent = '';
            if (parsedFiles.length > 0 && onFileChanges) {
                onFileChanges(parsedFiles); // Pass changes to parent to update editor
                displayMessageContent = `Assistant proposed changes to ${parsedFiles.length} file(s). Review the changes in the editor.`;
            } else if (aiResponseContent.includes('--------------------') && aiResponseContent.includes('+++++')) {
                 displayMessageContent = "Assistant provided a response, but no standard file changes were detected or parsed. Review the raw response below."; // Clarify the message
                 // Append raw response for user inspection
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
            setConversation((prev) => [...prev, aiMessage]); // Add AI message to local state

            // Automatically switch view based on model after response
             if (setIsDiffView) { // Check if the prop is provided
                 if (selectedModel === 'qa') {
                     setIsDiffView(false); // Switch to Editor View
                 } else if (selectedModel === 'coder') {
                     // Only switch to diff view if there were actually parsed files
                     if (parsedFiles.length > 0) {
                         setIsDiffView(true); // Switch to Diff View
                     } else {
                         setIsDiffView(false); // Stay in editor view if no files were parsed
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
                    // TODO: Add callback or state lifting to select the new conversation in OpenFolder
                }
            }

        } catch (error) {
             // Check if the error is due to cancellation
             if (error.message === 'Request canceled' || axios.isCancel(error)) {
                 console.log('Request was cancelled by the user.');
                 const cancelMessage = {
                     role: 'system',
                     content: 'Request cancelled.',
                     timestamp: new Date()
                 };
                 setConversation((prev) => [...prev, cancelMessage]);
                 showNotification('Request cancelled.', 'info'); // Provide user feedback
             } else {
                 console.error('Error sending message:', error);
                 const errorMessageContent = `Error: ${error.response?.data?.message || error.message || 'Failed to get response.'}`;
                 const errorMessage = {
                     role: 'system',
                     content: errorMessageContent,
                     timestamp: new Date()
                 };
                 setConversation((prev) => [...prev, errorMessage]);
                 // Show notification for backend errors (already handled by interceptor for 500, 401)
                 if (!axios.isCancel(error) && error.response?.status !== 401 && error.response?.status !== 500) {
                    showNotification(errorMessageContent, 'error');
                 }
             }
        } finally {
            setLoading(false); // End loading state
            abortControllerRef.current = null; // Clear the controller ref
            textareaRef.current?.focus(); // Ensure focus returns after operation
        }
    };

    // Send message handler (uses the core logic)
    const handleSend = async () => {
        executeSendMessage(message.replace(/`/g, "'")); // Send current input message
    };

    // Regenerate message handler (uses the core logic)
    const handleRegenerate = async () => {
        if (!lastUserMessageRef.current?.content) {
            showNotification('No previous message to regenerate.', 'info');
            return;
        }
        executeSendMessage(lastUserMessageRef.current.content, true); // Send last user message content
    };

    // Cancel request handler
    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log('Cancellation initiated.');
            // The catch block in executeSendMessage will handle the state update and notification
        }
    };


    // Scroll chat to the bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [conversation]); // Scroll whenever conversation updates

    // Textarea Resizing Logic
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

     // Handle Enter key press in textarea (Shift+Enter for newline)
     const handleKeyDown = (e) => {
        //  if (e.key === 'Enter' && !e.shiftKey) {
        //      e.preventDefault(); // Prevent default newline insertion
        //      handleSend(); // Send message
        //  }
     };

     // Handle Token Limit Slider Change
     const handleTokenLimitChange = (event, newValue) => {
         setTokenLimit(newValue);
     };


    return (
        <Box className="chat-container">

            {/* Selected Files/Folders Context Display */}
             {(selectedFiles.length > 0 || selectedSubFolders.length > 0) && (
                <Box className="selected-items-container"> {/* Class from App.css */}
                     {selectedSubFolders.map((folderPath) => (
                        <Tooltip title={`Folder context: ${folderPath}`} key={`folder-${folderPath}`}>
                            <Chip
                                icon={<FolderIcon fontSize="small" />}
                                label={folderPath.split('/').pop() || folderPath} // Show last part or full path
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
                                label={filePath.split('/').pop() || filePath} // Show filename or full path
                                size="small"
                                onDelete={() => deselectFile(filePath)}
                                color="primary"
                            />
                         </Tooltip>
                     ))}
                </Box>
             )}

            {/* Chat Messages Area */}
            <Box className="chat-messages">
                 {conversation.map((msg, index) => (
                     <Paper
                         key={index}
                         elevation={0} // Use theme's elevation/styling
                         className={`chat-message ${msg.role}`} // Classes: user, assistant, system, default
                         sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : (msg.role === 'system' ? 'error.dark' : 'background.paper') }} // Conditional background
                     >
                         {/* Render content based on role or type if needed */}
                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}> {/* Preserve whitespace/newlines */}
                             {msg.content}
                         </Typography>
                         {msg.timestamp && msg.role !== 'system' && ( // Hide timestamp for system messages
                            <>
                              {/* <hr /> Removed hr, use spacing */}
                              <Typography variant="caption" display="block" align="right" sx={{ mt: 0.5 }}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                             </>
                         )}
                     </Paper>
                 ))}
                <div ref={messagesEndRef} /> {/* Anchor to scroll to */}
            </Box>

            {/* Message Input Area */}
            <Box className="chat-input-container">
                {/* Progress Bar - Positioned within the input container */}
                 {loading && (
                    <LinearProgress
                        variant="indeterminate"
                        sx={{ height: '3px', width: '100%' }} // Thin bar at the top
                    />
                 )}

                <Paper className="chat-input-paper">
                     {/* Resizer Handle */}
                     <Box
                        className="textarea-resizer" // Class from OpenFolder.css
                        onMouseDown={startResizing}
                        ref={resizerRef}
                        title="Drag to resize input area"
                    />

                    {/* Textarea */}
                     <textarea
                        ref={textareaRef}
                        rows={1} // Start with 1 row, height is controlled by state/css
                        placeholder="Type your instruction... (e.g., 'Refactor the login component to use async/await')"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown} // Handle Enter key
                        className="chat-input-textarea" // Class from App.css
                        style={{ height: `${textareaHeight}px` }} // Dynamic height
                        disabled={loading} // Disable input while loading
                    />

                    {/* Controls: Model Select, Token Slider & Buttons */}
                     <Box className="chat-input-controls">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}> {/* Group Select and Slider */}
                             <Select
                                 value={selectedModel}
                                 onChange={(e) => setSelectedModel(e.target.value)}
                                 variant="outlined"
                                 size="small"
                                 disabled={loading}
                                 sx={{ minWidth: 80, '& .MuiSelect-select': { py: 0.8 } }} // Adjust padding
                             >
                                 {models.map((model) => (
                                     <MenuItem key={model} value={model}>
                                         {model}
                                     </MenuItem>
                                 ))}
                             </Select>

                             {/* Token Limit Slider */}
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
                                     {/* Display current value next to slider */}
                                    <Typography variant="caption" sx={{ minWidth: '35px', textAlign: 'right' }}>
                                        {`${(tokenLimit / 1000).toFixed(0)}k`}
                                    </Typography>
                                </Box>
                             </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}> {/* Group buttons */}
                            {/* Regenerate Button */}
                            <Tooltip title={!lastUserMessageRef.current ? "No previous message to regenerate" : "Resend last message"}>
                                <span> {/* Span required for tooltip on disabled button */}
                                    <IconButton
                                        onClick={handleRegenerate}
                                        disabled={loading || !lastUserMessageRef.current || saldo <= 0} // Also check saldo
                                        size="small"
                                        color="secondary"
                                    >
                                        <ReplayIcon fontSize="small" />
                                    </IconButton>
                                </span>
                             </Tooltip>

                             {/* Cancel Button (only visible when loading) */}
                             {loading && (
                                 <Tooltip title="Cancel Request">
                                     <IconButton onClick={handleCancel} size="small" color="error">
                                         <CancelIcon fontSize="small" />
                                     </IconButton>
                                 </Tooltip>
                             )}

                             {/* Send Button */}
                             <Tooltip title={saldo <= 0 ? "Insufficient credits" : (loading ? "Processing..." : "Send message (Enter)")}>
                                <span> {/* Span required for tooltip on disabled button */}
                                     <Button
                                         variant="contained"
                                         color="primary"
                                         onClick={handleSend}
                                         disabled={loading || !message.trim() || saldo <= 0} // Disable if loading, no message, or no credits
                                         startIcon={loading ? null : <SendIcon />} // Hide icon when loading, cancel icon is shown instead
                                         sx={{ py: 0.8, px: loading ? 1.5 : 2, minWidth: loading ? 'auto' : '80px' }} // Adjust padding/width
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

// Simple debounce function
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

// Helper function to format token count (optional)
// function formatTokenValue(value) {
//     if (value >= 1000) {
//         return `${(value / 1000).toFixed(0)}k`;
//     }
//     return value.toString();
// }