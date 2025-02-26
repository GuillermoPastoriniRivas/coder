import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import ChatInterface from './ChatInterface';

export default function PublicChatInterface() {
    const { publicId, phone } = useParams();
    const [agentId, setAgentId] = useState(null);

    useEffect(() => {
      const fetchAgent = async () => {
        const response = await api.getPublicAgent(publicId);
        setAgentId(response.data._id);
      };
      fetchAgent();
    }, [publicId]);

    if (!agentId) return <div>Loading...</div>;

    return <ChatInterface agentId={agentId} phoneNumber={phone} />;
}