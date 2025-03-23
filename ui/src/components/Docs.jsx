import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';

export default function Docs() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Documentation
      </Typography>
      <Divider sx={{ my: 2 }} />
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            What is Agent Server?
          </Typography>
          <Typography variant="body1">
            Agent Server is a powerful platform designed to streamline your code development workflow. It allows you to manage your projects, request automated code modifications, and interact with an intelligent assistant to resolve coding challenges.
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Key Features
          </Typography>
          <Typography variant="body1" component="div">
            • Real-time code modification via a chat interface<br />
            • Secure authentication and account management<br />
            • Folder synchronization for seamless project integration<br />
            • Token-based system for managing usage and purchases<br />
            • Detailed, auto-generated documentation for your projects
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            How to Use Agent Server
          </Typography>
          <Typography variant="body1" component="div">
            1. Sign Up or Log In: Access your personalized dashboard.<br />
            2. Open Your Project Folder: Use the “Open Folder” feature to load your project.<br />
            3. Interact with the Chat: Ask questions or request code changes directly in the chat interface.<br />
            4. Review and Apply Changes: Examine the proposed modifications before applying them.<br />
            5. Monitor Your Tokens: Keep track of your token balance and purchase additional tokens as needed.
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" component="div">
            Q: What is the Purpose of Agent Server?<br />
            A: It automates and simplifies code management by providing intelligent code modifications and insights.<br /><br />
            Q: How Secure is My Code?<br />
            A: All interactions and data remain secure with industry-standard security practices.<br /><br />
            Q: How Do I Purchase Tokens?<br />
            A: Tokens can be purchased directly in the Pricing section of the app.
          </Typography>
        </CardContent>
      </Card>
      
      <Typography variant="body2" align="center">
        For further assistance, please contact our support team or visit our official website.
      </Typography>
    </Box>
  );
}