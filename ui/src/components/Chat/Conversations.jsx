import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField } from '@mui/material';
import api from '../../api';
import { useDirectory } from '../../context/DirectoryContext';

const ConversationsList = ({ onSelectConversation, onStartNewConversation }) => {
    const [editingId, setEditingId] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const { conversations, setConversations, folderHandle } = useDirectory();

    useEffect(() => {
        const fetchConversations = async () => {
            const response = await api.getConversations(folderHandle.name);
            setConversations(response.data);
        };

        fetchConversations();
    }, [folderHandle]);

    const handleEditClick = (conversation) => {
        setEditingId(conversation._id);
        setNewTitle(conversation.title || `Conversation ${conversation._id}`);
    };

    const handleSaveTitle = async (conversationId) => {
        await api.updateConversationTitle(conversationId, { title: newTitle });
        setEditingId(null);
        const response = await api.getConversations();
        setConversations(response.data);
    };

    return (
        <Box>
            {/* <Button 
                variant="contained" 
                color="primary" 
                onClick={onStartNewConversation}
                fullWidth
                style={{ marginBottom: '10px' }}
            >
                New Conversation
            </Button> */}
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Conversations
            </Typography>
            <List>
                {conversations.map((conversation) => (
                    <ListItem 
                        button 
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                    >
                        {editingId === conversation._id ? (
                            <>
                                <TextField 
                                    value={newTitle} 
                                    onChange={(e) => setNewTitle(e.target.value)} 
                                    variant="outlined" 
                                    size="small" 
                                />
                                <Button onClick={() => handleSaveTitle(conversation._id)}>Save</Button>
                            </>
                        ) : (
                            <>
                                <ListItemText primary={conversation.title || `Conversation ${conversation._id}`} />
                                <Button onClick={() => handleEditClick(conversation)}>Edit</Button>
                            </>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default ConversationsList;