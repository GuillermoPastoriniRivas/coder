import React from 'react';
import { Box, Typography, Container, Paper, Divider } from '@mui/material';

// Simple component to display Terms of Service and Privacy Policy
export default function Legal() {
    return (
        <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    Legal Information
                </Typography>

                {/* Terms of Service Section */}
                <Box component="section" sx={{ mb: 5 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Terms of Service
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" paragraph>
                        Welcome to Faster! These terms and conditions outline the rules and regulations for the use of Faster's Website, located at [Your Website URL].
                    </Typography>
                    <Typography variant="body1" paragraph>
                        By accessing this website we assume you accept these terms and conditions. Do not continue to use Faster if you do not agree to take all of the terms and conditions stated on this page.
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        1. License
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Unless otherwise stated, Faster and/or its licensors own the intellectual property rights for all material on Faster. All intellectual property rights are reserved. You may access this from Faster for your own personal use subjected to restrictions set in these terms and conditions.
                    </Typography>
                    <Typography variant="body2" paragraph>
                        You must not:
                        <ul>
                            <li>Republish material from Faster</li>
                            <li>Sell, rent or sub-license material from Faster</li>
                            <li>Reproduce, duplicate or copy material from Faster</li>
                            <li>Redistribute content from Faster</li>
                        </ul>
                    </Typography>
                     <Typography variant="subtitle1" gutterBottom>
                        2. User Comments
                    </Typography>
                     <Typography variant="body2" paragraph>
                        Parts of this website offer an opportunity for users to post and exchange opinions and information. Faster does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Faster, its agents and/or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions.
                     </Typography>
                     <Typography variant="subtitle1" gutterBottom>
                        3. Disclaimer
                    </Typography>
                     <Typography variant="body2" paragraph>
                         The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty. As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
                     </Typography>
                    <Typography variant="body1" paragraph sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                        [This is placeholder text. Replace with your full Terms of Service.]
                    </Typography>
                </Box>

                {/* Privacy Policy Section */}
                <Box component="section">
                    <Typography variant="h5" component="h2" gutterBottom>
                        Privacy Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" paragraph>
                        Your privacy is important to us. It is Faster's policy to respect your privacy regarding any information we may collect from you across our website, [Your Website URL], and other sites we own and operate.
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        1. Information We Collect
                    </Typography>
                     <Typography variant="body2" paragraph>
                        We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used. This includes:
                        <ul>
                            <li>Log data (e.g., IP address, browser type, pages visited)</li>
                            <li>Personal identification information (Name, email address, etc., upon registration)</li>
                            <li>Payment information (handled securely by our payment processor, Stripe)</li>
                            <li>Code snippets and instructions you provide for processing</li>
                        </ul>
                     </Typography>
                     <Typography variant="subtitle1" gutterBottom>
                        2. How We Use Information
                    </Typography>
                     <Typography variant="body2" paragraph>
                         We use collected information to operate, maintain, and provide the features and functionality of the Service, to process payments, to communicate with you, and to analyze usage patterns to improve the service. Code snippets and instructions are sent to the AI model for processing your request and are not stored long-term or used for training the models unless explicitly permitted.
                     </Typography>
                     <Typography variant="subtitle1" gutterBottom>
                        3. Security
                    </Typography>
                    <Typography variant="body2" paragraph>
                         We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. We use encryption (HTTPS) for data transmission. Access to local files is granted explicitly by you through the browser's File System Access API.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                        [This is placeholder text. Replace with your full Privacy Policy.]
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}