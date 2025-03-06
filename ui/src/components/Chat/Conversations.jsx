import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import api from '../../api';

const ConversationsList = ({ onSelectConversation, onStartNewConversation }) => {
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const fetchConversations = async () => {
            const response = await api.getConversations();
            setConversations(response.data);
        };

        fetchConversations();
    }, []);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Conversations</Typography>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={onStartNewConversation}
                fullWidth
                style={{ marginBottom: '10px' }}
            >
                New Conversation
            </Button>
            <List>
                {conversations.map((conversation) => (
                    <ListItem 
                        button 
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                    >
                        <ListItemText primary={`Conversation ${conversation._id}`} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default ConversationsList;