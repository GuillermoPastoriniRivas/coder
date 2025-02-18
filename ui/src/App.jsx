import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import AgentList from './components/Agent/AgentList';
import AgentForm from './components/Agent/AgentForm';
import ChatInterface from './components/Chat/ChatInterface';
import PublicChatInterface from './components/Chat/PublicChatInterface';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/agents" element={<AgentList />} />
        <Route path="/agents/new" element={<AgentForm />} />
        <Route path="/agents/:id" element={<AgentForm />} />
        <Route path="/chat/:agentId" element={<ChatInterface />} />
        <Route path="/public/:publicId" element={<PublicChatInterface />} />
      </Routes>
    </Router>
  );
}

export default App;