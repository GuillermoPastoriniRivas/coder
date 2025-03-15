import React from 'react';
import { Box, Typography, Card } from '@mui/material';

export default function Docs() {
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Introduction */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ mt: 1, mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Welcome to the Coder Documentation
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        This documentation provides comprehensive information on what the Coder system is and how to effectively use its features. Whether you're a developer looking to integrate the system into your projects or an end-user seeking to understand its capabilities, this guide has got you covered.
                    </Typography>
                </Card>
            </Box>
            
            {/* System Overview */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    System Overview
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        The Coder system is a robust platform designed to facilitate seamless communication between users and AI agents. It comprises a backend API built with Node.js and Express, and a frontend interface developed using React and Material-UI. The system leverages MongoDB for data storage and integrates with OpenAI's GPT models to deliver intelligent responses.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Key Features:
                    </Typography>
                    <ul>
                        <li><Typography variant="body2">User Authentication and Account Management</Typography></li>
                        <li><Typography variant="body2">Real-time Chat Interface with AI Agent</Typography></li>
                        <li><Typography variant="body2">Conversation History and Management</Typography></li>
                        <li><Typography variant="body2">Token-Based Usage and Purchase System</Typography></li>
                        <li><Typography variant="body2">Directory Syncing and File Management</Typography></li>
                        <li><Typography variant="body2">API Integration for Extending Functionality</Typography></li>
                    </ul>
                </Card>
            </Box>

            {/* Getting Started */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Getting Started
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Follow these steps to set up and start using the Coder system:
                    </Typography>
                    <ol>
                        <li>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Clone the Repository
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Clone the project repository to your local machine using Git:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    mb: 2,
                                    ml: 2,
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                }}
                            >
                                {`git clone https://github.com/your-repo/coder.git
cd coder`}
                            </Box>
                        </li>
                        <li>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Install Dependencies
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Install the necessary dependencies for both backend and frontend:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    mb: 2,
                                    ml: 2,
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                }}
                            >
                                {`# Backend
cd api
npm install

# Frontend
cd ../ui
npm install`}
                            </Box>
                        </li>
                        <li>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Configure Environment Variables
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Create a `.env` file in the `api` directory and add your environment variables:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    mb: 2,
                                    ml: 2,
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                }}
                            >
                                {`PORT=5000
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key`}
                            </Box>
                        </li>
                        <li>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Start the Backend Server
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Navigate to the `api` directory and start the server:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    mb: 2,
                                    ml: 2,
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                }}
                            >
                                {`cd api
npm start`}
                            </Box>
                        </li>
                        <li>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                Start the Frontend Application
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Open a new terminal, navigate to the `ui` directory, and start the React app:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    mb: 2,
                                    ml: 2,
                                    backgroundColor: '#f5f5f5',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                }}
                            >
                                {`cd ui
npm start`}
                            </Box>
                        </li>
                    </ol>
                </Card>
            </Box>

            {/* API Documentation */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    API Documentation
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        The Coder system exposes a set of RESTful API endpoints for various functionalities. Below is a detailed overview of each endpoint.
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                        Authentication
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>POST /signup</strong>
                        <br />
                        Register a new user account.
                        <br />
                        <strong>POST /login</strong>
                        <br />
                        Authenticate a user and retrieve a JWT token.
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                        Account Management
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>GET /account</strong>
                        <br />
                        Retrieve account details of the authenticated user.
                        <br />
                        <strong>PUT /account</strong>
                        <br />
                        Update account information.
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                        Conversations
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>POST /call</strong>
                        <br />
                        Send a message to the AI agent.
                        <br />
                        <strong>POST /conversation</strong>
                        <br />
                        Retrieve a specific conversation based on its ID.
                        <br />
                        <strong>DELETE /conversation/:conversationId</strong>
                        <br />
                        Delete a conversation by its ID.
                        <br />
                        <strong>GET /conversations/:folder</strong>
                        <br />
                        Retrieve all conversations within a specific folder.
                        <br />
                        <strong>PUT /conversation/:conversationId/title</strong>
                        <br />
                        Update the title of a specific conversation.
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                        Purchasing Tokens
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>POST /purchase-tokens</strong>
                        <br />
                        Purchase additional tokens for usage.
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                        Synchronization
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>POST /sync</strong>
                        <br />
                        Sync the user's directory with the system.
                    </Typography>
                </Card>
            </Box>

            {/* Integration Guides */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Integration Guides
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    {/* Widget Integration */}
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Integrate Coder Widget into Your Website
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Embed the Coder AI agent into your website to provide real-time assistance to your users.
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            1. Obtain Your Agent ID
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Navigate to the agents list in your dashboard and click "Copy ID" to retrieve your unique Agent ID.
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            2. Include the Widget Script
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Add the following script tag to the `head` section or just before the closing `body` tag of your website. Replace <strong>your-agent-id</strong> with the Agent ID you obtained.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>Widget Script:</strong>
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                mb: 2,
                                ml: 2,
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                overflowX: 'auto'
                            }}
                        >
                            {`<script src="https://staging.d2276p7j5766np.amplifyapp.com/widget.js" data-agent-id="your-agent-id"></script>`}
                        </Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            3. Test the Integration
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            After adding the script, reload your website. The Coder widget should appear in the designated area, allowing users to interact with the AI agent.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Example HTML Integration:</strong>
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                mb: 2,
                                ml: 2,
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                overflowX: 'auto'
                            }}
                        >
                            {`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
    <!-- Include the Coder Widget Script -->
    <script src="https://staging.d2276p7j5766np.amplifyapp.com/widget.js" data-agent-id="your-agent-id"></script>
</head>
<body>
    <!-- Your website content -->
</body>
</html>`}
                        </Box>
                    </Box>

                    {/* API Integration */}
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Interact with Coder Using the API
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Leverage Coder's API to integrate AI functionalities into your applications or services.
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            1. Obtain Your Agent ID
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            As with the widget integration, start by copying your unique Agent ID from the agents list.
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            2. Make an API Request
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Send a POST request to the following endpoint:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'monospace', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
                            POST https://yourdomain.com/call
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Include the following parameters in the request body:
                        </Typography>
                        <Box component="div" sx={{ mb: 2, ml: 2 }}>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                                phone:
                            </Typography>{' '}
                            Your phone number
                            <br />
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                                message:
                            </Typography>{' '}
                            The message you want to send to the agent
                            <br />
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                                agentId:
                            </Typography>{' '}
                            Your Agent ID
                        </Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            3. Handle the API Response
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            The API will respond with the agent's generated message, which you can use within your application.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Example Request Using Fetch:</strong>
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                mb: 2,
                                ml: 2,
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                overflowX: 'auto'
                            }}
                        >
                            {`fetch('https://yourdomain.com/call', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        phone: '1234567890',
        message: 'Hello, can you help me?',
        agentId: 'your-agent-id'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Agent Response:', data.response);
})
.catch(error => {
    console.error('Error:', error);
});`}
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            By following these steps, you can seamlessly integrate Coder's AI capabilities into your own applications, enhancing user interaction and providing intelligent responses.
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* FAQs */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Frequently Asked Questions (FAQs)
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        1. How do I reset my password?
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4 }}>
                        To reset your password, go to the login page and click on "Forgot Password". Enter your registered email, and you'll receive instructions to reset your password.
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        2. How can I purchase more tokens?
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4 }}>
                        Navigate to the "Pricing" section in your account settings. Select the desired token package and follow the payment instructions to complete your purchase.
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        3. How do I delete a conversation?
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4 }}>
                        In the "Chat" interface, select the conversation you wish to delete and click on the "Delete" button. Confirm the action to permanently remove the conversation.
                    </Typography>
                </Card>
            </Box>

            {/* Support */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
                    Support
                </Typography>
                <Card sx={{ p: { xs: 2, md: 4 }, boxShadow: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        If you encounter any issues or have questions that are not covered in this documentation, please reach out to our support team:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Email: support@coder.com
                        <br />
                        Phone: +1 (234) 567-8901
                        <br />
                        Live Chat: Available 24/7 on our website.
                    </Typography>
                </Card>
            </Box>
        </Box>
    );
}