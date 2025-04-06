import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, TextField, Tooltip, CircularProgress, Collapse, ListItemButton } from '@mui/material'; // Added Tooltip, CircularProgress, Collapse, ListItemButton
import EditIcon from '@mui/icons-material/Edit'; // Edit icon
import DeleteIcon from '@mui/icons-material/Delete'; // Delete icon
import SaveIcon from '@mui/icons-material/Save'; // Save icon
import CancelIcon from '@mui/icons-material/Cancel'; // Cancel icon

import api from '../../api';
import { useDirectory } from '../../context/DirectoryContext';

const ConversationsList = ({ onSelectConversation }) => {
    const [editingId, setEditingId] = useState(null); // ID of conversation being edited
    const [newTitle, setNewTitle] = useState(''); // Temp state for new title
    const [loading, setLoading] = useState(false); // Loading state for fetching/deleting
    const [deletingId, setDeletingId] = useState(null); // ID of conversation being deleted
    const [savingId, setSavingId] = useState(null); // ID of conversation title being saved

    // Get conversations state and folder context from DirectoryContext
    const { conversations, setConversations, folderHandle } = useDirectory();

    // Fetch conversations when folderHandle changes
    useEffect(() => {
        const fetchConversations = async () => {
            if (!folderHandle) return; // Don't fetch if no folder is open
            setLoading(true);
            try {
                const response = await api.getConversations(folderHandle.name);
                setConversations(response.data || []); // Ensure conversations is an array
            } catch (error) {
                console.error("Error fetching conversations:", error);
                setConversations([]); // Reset on error
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [folderHandle, setConversations]); // Dependency array

    // Start editing a conversation title
    const handleEditClick = (event, conversation) => {
        event.stopPropagation(); // Prevent selecting conversation when clicking edit
        setEditingId(conversation._id);
        setNewTitle(conversation.title || `Conversation ${conversation._id.slice(-4)}`); // Use existing title or generate default
    };

    // Cancel editing
     const handleCancelEdit = (event) => {
         event.stopPropagation();
         setEditingId(null);
         setNewTitle('');
     };

    // Save the edited title
    const handleSaveTitle = async (event, conversationId) => {
        event.stopPropagation();
        if (!newTitle.trim()) return; // Prevent saving empty title

        setSavingId(conversationId); // Indicate saving state
        try {
            await api.updateConversationTitle(conversationId, { title: newTitle.trim() });
            // Update local state immediately for better UX
            setConversations(prevConvs =>
                prevConvs.map(conv =>
                    conv._id === conversationId ? { ...conv, title: newTitle.trim() } : conv
                )
            );
            setEditingId(null); // Exit edit mode
        } catch (error) {
            console.error("Error saving conversation title:", error);
            // Optionally show an error message to the user
        } finally {
            setSavingId(null); // Clear saving state
        }
    };

    // Delete a conversation
    const handleDeleteConversation = async (event, conversationId) => {
        event.stopPropagation();
        if (window.confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
             setDeletingId(conversationId); // Indicate deletion state
            try {
                await api.deleteConversation(conversationId);
                // Remove conversation from local state
                setConversations(prevConvs => prevConvs.filter(conv => conv._id !== conversationId));
                // Optionally select another conversation or clear selection in parent component
            } catch (error) {
                console.error("Error deleting conversation:", error);
                // Optionally show an error message
            } finally {
                 setDeletingId(null); // Clear deletion state
            }
        }
    };

    // Select a conversation
    const handleSelect = (conversation) => {
         // Prevent selection if an edit/delete action is in progress on this item
         if (editingId === conversation._id || deletingId === conversation._id || savingId === conversation._id) {
             return;
         }
        onSelectConversation(conversation);
    };


    return (
        <Box sx={{ width: '100%' }}>
            {loading && !conversations.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List dense component="nav" aria-label="conversation list">
                    {conversations.length === 0 && !loading && (
                        <ListItem>
                            <ListItemText primary="No conversations yet." primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', fontStyle: 'italic' }} />
                        </ListItem>
                    )}
                    {conversations.map((conversation) => (
                        <ListItemButton // Use ListItemButton for better hover effect
                            key={conversation._id}
                            onClick={() => handleSelect(conversation)}
                            // disableGutters // Remove default padding handled by sx
                            sx={{
                                py: 0.5, // Fine-tune vertical padding
                                px: 1.5, // Fine-tune horizontal padding
                                '&:hover .conversation-list-item-actions': { // Show actions on hover
                                    opacity: 1,
                                },
                                // Ensure secondary action doesn't overlap content
                                position: 'relative',
                                // Style adjustments for when editing
                                pr: editingId === conversation._id ? 2 : (savingId === conversation._id || deletingId === conversation._id ? 6 : 10), // Adjust padding based on state
                                '& .MuiListItemSecondaryAction-root': {
                                    right: 12, // Slightly adjust action position
                                },
                            }}
                        >
                            {/* Use Collapse to animate the switch between text and input field */}
                            <Collapse in={editingId !== conversation._id} timeout={150} sx={{ width: '100%' }}>
                                <ListItemText
                                    primary={conversation.title || `Chat ${conversation._id.slice(-4)}`}
                                    primaryTypographyProps={{ variant: 'body2', noWrap: true, sx: { fontWeight: 'medium' } }}
                                    title={conversation.title || `Conversation ${conversation._id}`} // Tooltip for full title/ID
                                />
                            </Collapse>
                            <Collapse in={editingId === conversation._id} timeout={150} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TextField
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()} // Prevent selection propagation
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle(e, conversation._id);
                                        if (e.key === 'Escape') handleCancelEdit(e);
                                    }}
                                    sx={{
                                        '.MuiInputBase-input': {
                                            py: 0.5,
                                            fontSize: '0.875rem' // Match list item text size
                                        }
                                    }}
                                />
                                <Tooltip title="Save Title (Enter)">
                                    <span> {/* Span for disabled button tooltip */}
                                    <IconButton size="small" onClick={(e) => handleSaveTitle(e, conversation._id)} disabled={savingId === conversation._id || !newTitle.trim()}>
                                        {savingId === conversation._id ? <CircularProgress size={16} /> : <SaveIcon fontSize="inherit" />}
                                    </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Cancel Edit (Esc)">
                                    <IconButton size="small" onClick={handleCancelEdit}>
                                        <CancelIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </Collapse>

                            {/* Secondary Action (Edit/Delete Buttons) */}
                            <ListItemSecondaryAction
                                sx={{ // Ensure actions don't shift layout when appearing
                                    opacity: editingId === conversation._id ? 0 : 'inherit', // Hide actions if editing
                                    transition: 'opacity 0.2s',
                                    '&:not(:hover)': { // Apply fade out only when not hovering the action itself
                                        '.conversation-list-item-actions': {
                                            opacity: 0,
                                        }
                                    }
                                }}
                             >
                                <Box className="conversation-list-item-actions" sx={{ display: 'flex', alignItems: 'center' }}>
                                    {/* Show loading spinner if saving or deleting this item */}
                                    {(savingId === conversation._id || deletingId === conversation._id) ? (
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                    ) : (
                                        <>
                                            <Tooltip title="Edit Title">
                                                <IconButton
                                                    edge="end"
                                                    aria-label="edit"
                                                    size="small"
                                                    onClick={(e) => handleEditClick(e, conversation)}
                                                >
                                                    <EditIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Conversation">
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    size="small"
                                                    onClick={(e) => handleDeleteConversation(e, conversation._id)}
                                                >
                                                    <DeleteIcon fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Box>
                            </ListItemSecondaryAction>
                        </ListItemButton>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default ConversationsList;