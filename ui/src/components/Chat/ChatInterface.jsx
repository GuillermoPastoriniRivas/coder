import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Chip, MenuItem, Select, LinearProgress, Tooltip, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info'; // For info tooltip
import FolderIcon from '@mui/icons-material/Folder'; // For folder chip icon
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // For file chip icon
import api from '../../api';
import '../../styles/App.css'; // Keep general app styles
import { useDirectory } from '../../context/DirectoryContext';
import { parseAIMessageForFiles } from '../../utils/functions';
import { useAuth } from '../../context/AuthContext';

export default function ChatInterface({
    selectedConversation,
    onFileChanges, // Callback when AI provides file changes
    selectedModel,
    setSelectedModel,
    selectedFiles,    // Array of selected file paths
    selectedSubFolders, // Array of selected folder paths
    deselectFile,
    deselectSubFolder
}) {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]); // Stores message objects { role, content, timestamp }
    const [loading, setLoading] = useState(false); // For send message loading state
    // Removed progress state and interval ref
    const messagesEndRef = useRef(null); // To scroll chat to bottom
    const textareaRef = useRef(null); // To manage textarea focus and height potentially
    const resizerRef = useRef(null); // For the textarea resizer handle

    const { folderHandle, setConversations } = useDirectory();
    const { saldo, updateSaldo } = useAuth();

    const [isResizing, setIsResizing] = useState(false);
    const [startY, setStartY] = useState(0); // Store initial Y position on drag start
    const [startHeight, setStartHeight] = useState(80); // Store initial height on drag start
    const [textareaHeight, setTextareaHeight] = useState(80); // Initial height (adjust as needed)

    const models = ['coder']; // Available models (update if more are added)

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
        }
    }, 500)).current; // 500ms debounce


    // Load conversation history when selectedConversation changes
    useEffect(() => {
        const loadInitialConversation = () => {
            if (selectedConversation && selectedConversation.messages && selectedConversation.messages.length > 0) {
                 // Filter out assistant messages if they only contain file diffs (handled by FileContent)
                 // Or decide how to display them (e.g., "Assistant proposed changes...")
                 setConversation(selectedConversation.userMessages);
            } else {
                // Default initial message if no conversation history
                setConversation([
                    {
                        role: 'default', // Use 'default' or 'system'
                        content: "Hello! I can generate code changes based on your instructions. Just tell me what changes you need.",
                        timestamp: new Date()
                    }
                ]);
            }
             // Scroll to bottom after loading
             scrollToBottom();
        };
        loadInitialConversation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation]); // Rerun only when the selected conversation object changes


    // Send message handler
    const handleSend = async () => {
        if (!message.trim() || loading || !folderHandle) return; // Basic validation

         const userMessage = { role: 'user', content: message.trim(), timestamp: new Date() };
         // Update local conversation state immediately for responsiveness
         setConversation((prev) => [...prev, userMessage]);
         setMessage(''); // Clear input field
         setLoading(true); // Set loading state
         // Removed progress reset

         // Reset textarea height after sending (optional)
         // setTextareaHeight(80);

         // Removed simulated progress interval logic

         try {
             const response = await api.sendMessage({
                 message: userMessage.content, // Send the trimmed message content
                 folder: folderHandle.name,
                 // Send selected paths relative to the root folder handle
                 subFolders: selectedSubFolders,
                 selectedFiles: selectedFiles,
                 model: selectedModel,
                 conversationId: selectedConversation?._id // Pass current conversation ID if exists
             });

             // Removed stop simulated progress and setProgress(100)

             const aiResponseContent = response.data.response; // The raw response from AI
             const newConversationId = response.data.conversationId; // ID of the created/updated conversation

             // Parse the AI response for file changes
             const parsedFiles = parseAIMessageForFiles(folderHandle.name, aiResponseContent);

             let displayMessageContent = '';
             if (parsedFiles.length > 0 && onFileChanges) {
                 onFileChanges(parsedFiles); // Pass changes to parent to update editor
                 displayMessageContent = `Assistant proposed changes to ${parsedFiles.length} file(s). Review the changes in the editor.`;
             } else if (aiResponseContent.includes('--------------------') && aiResponseContent.includes('+++++')) {
                  // It looks like a diff but parsing failed or was empty
                  displayMessageContent = "Assistant provided a response, but no file changes were detected or applied automatically. Check the response format if expecting code changes.";
                  console.warn("AI response looked like a diff but parsing yielded no files:", aiResponseContent);
             }
              else {
                 // If no parseable files, display the raw response (or a summary)
                 displayMessageContent = aiResponseContent; // Or potentially summarize if too long
             }

             const aiMessage = {
                 role: 'assistant', // Use 'assistant' role
                 content: displayMessageContent,
                 timestamp: new Date()
             };
             setConversation((prev) => [...prev, aiMessage]); // Add AI message to local state

             // Fetch updated saldo and conversations list
              fetchSaldoDebounced();
             const updatedConversations = await api.getConversations(folderHandle.name);
             setConversations(updatedConversations.data || []);

             // If it was a new conversation, select it
              if (!selectedConversation && newConversationId) {
                 const newConv = updatedConversations.data.find(c => c._id === newConversationId);
                 if (newConv) {
                     // Need a way to inform the parent (OpenFolder) to select this new conversation
                     // This might require lifting state up or using a context update
                     console.log("New conversation created, need to select it:", newConv);
                 }
             }


         } catch (error) {
              console.error('Error sending message:', error);
              // Removed clearInterval and setProgress(0)
              // Add error message to chat
              const errorMessage = {
                   role: 'system', // Or 'error' role
                   content: `Error: ${error.response?.data?.message || error.message || 'Failed to get response.'}`,
                   timestamp: new Date()
              };
              setConversation((prev) => [...prev, errorMessage]);
         } finally {
             setLoading(false); // End loading state
             // Removed timeout to hide progress bar
             // Ensure textarea is focused after sending
             textareaRef.current?.focus();
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
            // Calculate the change in Y based on the initial position and current position
            const deltaY = e.clientY - startY;
            // Calculate new height based on initial height + change
            const newHeight = startHeight - deltaY;
            // Clamp height between min and max values
            const clampedHeight = Math.max(50, Math.min(newHeight, window.innerHeight * 0.6)); // Min 50px, Max 60% viewport height
            setTextareaHeight(clampedHeight);
        };
        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                 document.body.style.cursor = 'default';
                 document.body.style.userSelect = 'auto';
            }
        };
        // Add listeners to the window to capture mouse events everywhere
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            // Clean up listeners on component unmount or dependency change
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, startY, startHeight]); // Re-run effect if resizing state or start values change

    const startResizing = (e) => {
        e.preventDefault(); // Prevent default drag behavior (like text selection)
        setIsResizing(true);
        setStartY(e.clientY); // Record the starting Y position
        setStartHeight(textareaHeight); // Record the starting height
        document.body.style.cursor = 'row-resize'; // Change cursor to indicate resizing
        document.body.style.userSelect = 'none'; // Prevent text selection during resize
    };

    // Removed cleanup effect for progress interval

     // Handle Enter key press in textarea (Shift+Enter for newline)
     const handleKeyDown = (e) => {
        //  if (e.key === 'Enter' && !e.shiftKey) {
        //      e.preventDefault(); // Prevent default newline insertion
        //      handleSend(); // Send message
        //  }
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
                                label={folderPath.split('/').pop()} // Show last part of path
                                size="small"
                                onDelete={() => deselectSubFolder(folderPath)}
                                color="secondary" // Use theme's secondary color chip
                            />
                        </Tooltip>
                     ))}
                     {selectedFiles.map((filePath) => (
                          <Tooltip title={`File context: ${filePath}`} key={`file-${filePath}`}>
                             <Chip
                                icon={<InsertDriveFileIcon fontSize="small" />}
                                label={filePath.split('/').pop()} // Show filename
                                size="small"
                                onDelete={() => deselectFile(filePath)}
                                color="primary" // Use theme's primary color chip
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
                         elevation={0} // Use theme's elevation/styling, remove default shadow
                         className={`chat-message ${msg.role}`} // Classes: user, assistant, system, default
                         sx={{ bgcolor: msg.role === 'user' ? 'primary.dark' : 'background.paper' }} // Example specific styling
                     >
                         {/* Render content based on role or type if needed */}
                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}> {/* Preserve whitespace/newlines */}
                             {msg.content}
                         </Typography>
                         {msg.timestamp && (
                            <>
                              <hr /> {/* Use styled hr or border */}
                              <Typography variant="caption" display="block" align="right">
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
                {/* Progress Bar - Moved here, above input paper */}
                 {loading && (
                    <LinearProgress
                        variant="indeterminate" // Changed to indeterminate
                        sx={{ height: '4px', width: '100%' }} // Adjusted style for new position
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

                    {/* Progress Bar removed from here */}

                    {/* Controls: Model Select & Send Button */}
                     <Box className="chat-input-controls">
                         <Select
                             value={selectedModel}
                             onChange={(e) => setSelectedModel(e.target.value)}
                             variant="outlined"
                             size="small"
                             disabled={loading}
                             sx={{ minWidth: 120, '& .MuiSelect-select': { py: 0.8 } }} // Adjust padding
                         >
                             {models.map((model) => (
                                 <MenuItem key={model} value={model}>
                                     {model}
                                     {/* Optional: Add cost/info badge */}
                                     {/* <Chip size="small" label="Free" sx={{ml: 1}}/> */}
                                 </MenuItem>
                             ))}
                         </Select>

                         {/* Send Button */}
                         <Tooltip title={saldo === 0 ? "Insufficient credits to send message" : "Send message (Enter)"}>
                            <span> {/* Span required for tooltip on disabled button */}
                                 <Button
                                     variant="contained"
                                     color="primary"
                                     onClick={handleSend}
                                     disabled={loading || !message.trim() || saldo === 0} // Disable if loading, no message, or no credits
                                     endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                     sx={{ ml: 1 }}
                                 >
                                     Send
                                 </Button>
                             </span>
                         </Tooltip>
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