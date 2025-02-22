import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import ChatInterface from './ChatInterface';
import '../../App.css';

export default function Widget() {
    const { agentId } = useParams();
    const [agent, setAgent] = useState(null);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await api.getAgent(agentId);
                setAgent(response.data);
            } catch (error) {
                console.error('Error fetching agent:', error);
            }
        };
        fetchAgent();
    }, [agentId]);

    if (!agent) return <div className="widget-loading">Cargando...</div>;

    return (
        <div className="widget-container">
            <ChatInterface agentId={agentId} />
        </div>
    );
}