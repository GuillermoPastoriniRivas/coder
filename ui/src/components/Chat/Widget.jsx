import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import ChatInterface from './ChatInterface';
import '../../App.css';

export default function Widget() {
    const { agentId } = useParams();
    const [agent, setAgent] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // Widget initially closed

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

    const toggleWidget = () => {
        setIsOpen(!isOpen);
    };

    if (!agent) return <div className="widget-loading">Cargando...</div>;

    return (
        <>
            {isOpen && (
                <div className="widget-container">
                    <ChatInterface agentId={agentId} />
                    <button className="widget-close-button" onClick={toggleWidget}>
                        &times;
                    </button>
                </div>
            )}
            <button className="widget-open-bubble" onClick={toggleWidget}>
                &#128172;
            </button>
        </>
    );
}