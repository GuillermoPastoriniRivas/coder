import React from 'react';
import { Box, Typography, Container, Button, Paper, Grid, useTheme, AppBar, Toolbar, Link } from '@mui/material'; // Added AppBar, Toolbar, Link
import { Link as RouterLink } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SecurityIcon from '@mui/icons-material/Security'; // Added icon
import InsightsIcon from '@mui/icons-material/Insights'; // Added icon
import SpeedIcon from '@mui/icons-material/Speed'; // Added icon
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Icon for pricing

// Placeholder YouTube Video ID - Replace with the actual demo video ID
const YOUTUBE_VIDEO_ID = 'dQw4w9WgXcQ'; // Example: 'dQw4w9WgXcQ'

export default function LandingPage() {
    const theme = useTheme(); // Access theme for consistent styling

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
            {/* Navigation Menu */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
                        <Typography variant="h6" component={RouterLink} to="/" sx={{ color: 'text.primary', fontWeight: 'bold', textDecoration: 'none' }}>
                        🌊 Boostware
                        </Typography>
                        <Box>
                            <Button color="inherit" component={RouterLink} to="/" sx={{ color: 'text.primary' }}>Home</Button>
                            <Button color="inherit" component={RouterLink} to="/docs" sx={{ color: 'text.primary' }}>Docs</Button>
                            {/* Link to Legal added in the footer */}
                            <Button color="inherit" component={RouterLink} to="/login" sx={{ color: 'text.primary' }}>Login</Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.background.paper} 70%)`, pt: 12, pb: 10 }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4rem' }, color: 'primary.contrastText', textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>
                        Boostware
                    </Typography>
                    <Typography variant="h5" color="rgba(255, 255, 255, 0.85)" paragraph sx={{ mb: 5, maxWidth: '700px', mx: 'auto' }}>
                        Boost your ideas. Build and launch Minimum Viable Products (MVPs) at lightning speed with Boostware's AI-powered acceleration.
                    </Typography>
                    <Box>
                        <Button
                            variant="contained"
                            color="secondary" // Changed color for contrast on gradient
                            size="large"
                            component={RouterLink}
                            to="/signup"
                            sx={{
                                mr: { xs: 0, sm: 2 },
                                mb: { xs: 2, sm: 0 },
                                px: 4,
                                py: 1.5,
                                bgcolor: 'white', // Make primary CTA stand out
                                color: 'primary.main',
                                '&:hover': { bgcolor: '#f0f0f0' }
                            }}
                        >
                            Get Started for Free
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit" // Changed color for contrast
                            size="large"
                            component={RouterLink}
                            to="/login"
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderColor: 'rgba(255, 255, 255, 0.7)',
                                color: 'white',
                                '&:hover': {
                                    borderColor: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            Log In
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Video Demo Section */}
            <Container maxWidth="md" sx={{ my: { xs: 6, md: 10 } }}>
                 <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 5, fontWeight: 'bold' }}>
                     See Boostware in Action
                 </Typography>
                 <Paper
                     elevation={6} // Increased elevation for more depth
                     sx={{
                         position: 'relative',
                         paddingBottom: '56.25%', // 16:9 aspect ratio
                         height: 0,
                         overflow: 'hidden',
                         borderRadius: 2, // Use theme border radius
                         border: '1px solid',
                         borderColor: 'divider'
                     }}
                 >
                     <iframe
                        src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&showinfo=0&modestbranding=1`} // Added parameters to clean up player
                        title="Boostware Demo Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </Paper>
            </Container>

            {/* Features Section */}
            <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 8, fontWeight: 'bold' }}>
                        Why Choose Boostware?
                    </Typography>
                    <Grid container spacing={5} justifyContent="center">
                        {/* Feature 1 */}
                        <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <CodeIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Local First Development</Typography>
                                <Typography color="text.secondary">
                                    Work directly with your local project folders. No need to upload your codebase. Your code stays securely on your machine.
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Feature 2 */}
                        <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <InsightsIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>AI-Powered Modifications</Typography>
                                <Typography color="text.secondary">
                                    Request code changes via chat, review diffs visually, and apply them securely with a single click. Leverage AI for complex tasks.
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Feature 3 */}
                        <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                             <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <SpeedIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Boost Productivity</Typography>
                                <Typography color="text.secondary">
                                    Automate refactoring, add features, fix bugs, and generate documentation faster with intelligent assistance integrated into your workflow.
                                </Typography>
                            </Paper>
                        </Grid>
                         {/* Feature 4 (Example - add more if needed) */}
                         <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                             <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <SecurityIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Secure & Private</Typography>
                                <Typography color="text.secondary">
                                    Your code remains local. Only selected snippets and instructions are sent for processing over encrypted connections.
                                </Typography>
                             </Paper>
                         </Grid>
                         {/* Feature 5 (Example) */}
                         <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                             <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <PlayCircleOutlineIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Seamless Integration</Typography>
                                <Typography color="text.secondary">
                                    Designed to fit naturally into your existing development process without disruptive changes to your environment.
                                </Typography>
                             </Paper>
                         </Grid>
                         {/* Feature 6 (Example) */}
                         <Grid item xs={12} sm={6} md={4} sx={{ textAlign: 'center' }}>
                             <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
                                <RocketLaunchIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Accelerate Workflow</Typography>
                                <Typography color="text.secondary">
                                    Reduce repetitive tasks and focus on complex problem-solving, letting Boostware handle the boilerplate and common patterns.
                                </Typography>
                             </Paper>
                         </Grid>
                    </Grid>
                </Container>
            </Box>

             {/* Pricing Section */}
             <Box sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <MonetizationOnIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                        Simple, Pay-As-You-Go Pricing
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
                        Boostware operates on a credit-based system. You only pay for the AI processing you use. Top up your credits anytime.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        component={RouterLink}
                        to="/pricing" // Link to the detailed pricing/purchase page
                         sx={{
                            px: 5,
                            py: 1.5,
                            fontSize: '1.1rem',
                        }}

                    >
                        View Pricing & Add Credits
                    </Button>
                </Container>
             </Box>


             {/* Call to Action Section */}
             <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                        Ready to Boost Your Ideas?
                    </Typography>
                    <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 5 }}>
                        Join developers accelerating their MVP launches with AI assistance.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        component={RouterLink}
                        to="/signup"
                         sx={{
                            px: 5,
                            py: 1.5,
                            fontSize: '1.1rem',
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': { transform: 'scale(1.05)' }
                        }}

                    >
                        Sign Up Now - It's Free to Start!
                    </Button>
                </Container>
             </Box>

             {/* Footer Placeholder */}
             <Box component="footer" sx={{ bgcolor: 'background.paper', py: 4, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
                 <Container maxWidth="lg">
                     <Typography variant="body2" color="text.secondary" align="center">
                         {'© '}{new Date().getFullYear()}{' Boostware. All rights reserved.'}

                     </Typography>
                     {/* Add links if needed */}
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        <Link component={RouterLink} to="/legal" color="inherit">Privacy Policy & Terms of Service</Link>
                      </Typography>
                 </Container>
             </Box>
        </Box>
    );
}