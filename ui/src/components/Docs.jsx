import React from 'react';
import { Box, Typography, Paper, Divider, Link, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info'; // General info icon
import BuildIcon from '@mui/icons-material/Build'; // Features icon
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // How to use icon
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // FAQ icon
import SecurityIcon from '@mui/icons-material/Security'; // Security icon
import ContactSupportIcon from '@mui/icons-material/ContactSupport'; // Support icon

// Reusable Card-like component using Paper
const InfoCard = ({ title, icon, children }) => (
    <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon && React.cloneElement(icon, { sx: { mr: 1.5, color: 'primary.main' } })}
            <Typography variant="h5" component="h2">{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Paper>
);

export default function Docs() {
  return (
    // Use Box for padding and centering, maxWidth limits content width
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Gecode Documentation
      </Typography>

      <InfoCard title="What is Gecode?" icon={<InfoIcon />}>
          <Typography variant="body1" paragraph>
            Gecode is an AI-powered coding assistant designed to integrate directly with your local development environment. It helps you manage projects, request automated code modifications, apply changes safely, and interact intelligently to solve coding challenges, all without leaving your workspace setup.
          </Typography>
      </InfoCard>

      <InfoCard title="Key Features" icon={<BuildIcon />}>
          <List dense>
              <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="Open Local Folders: Directly access and work with projects on your machine." />
              </ListItem>
               <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="AI-Powered Code Modifications: Request changes via chat, specifying files or folders for context." />
              </ListItem>
               <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="Interactive Diff Viewer: Review AI-proposed changes side-by-side with your original code." />
              </ListItem>
               <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="Apply Changes Selectively: Apply modifications file-by-file or all at once directly to your local files." />
              </ListItem>
              <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="Secure Authentication & Account Management: Standard login and account settings." />
              </ListItem>
               <ListItem>
                  <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main">\u2022</Typography></ListItemIcon>
                  <ListItemText primary="Credit-Based Usage: Manage your usage through a simple credit system." />
              </ListItem>
          </List>
      </InfoCard>

      <InfoCard title="How to Use Gecode" icon={<PlayCircleOutlineIcon />}>
           <Typography variant="body1" component="div" sx={{ '& strong': { color: 'primary.main' } }}>
              1. <strong>Sign Up / Log In:</strong> Access your account. <br />
              2. <strong>Open Folder:</strong> Click "Open Folder" and select your project directory using the browser's folder picker. <br />
              3. <strong>Select Context (Optional):</strong> Check the boxes next to specific files or sub-folders in the directory tree to provide them as context for the AI.<br />
              4. <strong>Interact via Chat:</strong> Type your request (e.g., "Refactor the login function in auth.js", "Add error handling to userController.ts"). <br />
              5. <strong>Review Changes:</strong> If the AI provides code modifications, they will appear in the Diff Viewer. Changed files are listed above the editor. Click a file name to view its diff. <br />
              6. <strong>Apply Changes:</strong> Use the "Apply" button to save changes for the currently viewed file, or "Apply All" to save all proposed changes. Changes are written directly to your local files. <br />
              7. <strong>Manage Credits:</strong> Visit the "Pricing" page (accessible from the user menu) to add more credits.
          </Typography>
      </InfoCard>

      <InfoCard title="Frequently Asked Questions" icon={<HelpOutlineIcon />}>
           <Typography variant="subtitle1" gutterBottom>Q: How does Gecode access local files?</Typography>
           <Typography variant="body2" paragraph>
             Gecode uses the modern <Link href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API" target="_blank" rel="noopener noreferrer">File System Access API</Link> available in compatible browsers (like Chrome, Edge). You explicitly grant permission for the application to read and write to the selected folder. This access is temporary and usually scoped to your session.
           </Typography>

           <Typography variant="subtitle1" gutterBottom>Q: Is my code uploaded anywhere?</Typography>
           <Typography variant="body2" paragraph>
               When you request changes, the content of the files/folders you selected as context, along with your instructions, are sent to the backend AI model for processing. Only the necessary context is sent. Your entire project is not uploaded unless you explicitly select it. The connection is secured via HTTPS.
           </Typography>

           <Typography variant="subtitle1" gutterBottom>Q: What happens when I click 'Apply'?</Typography>
           <Typography variant="body2" paragraph>
             The application uses the File System Access API again to write the modified content shown in the editor directly back to the corresponding local file within the folder you granted access to. It's recommended to use version control (like Git) with your projects.
           </Typography>

           <Typography variant="subtitle1" gutterBottom>Q: How do credits work?</Typography>
            <Typography variant="body2" paragraph>
              Each request to the AI model consumes a certain number of credits based on the complexity and model used. Your remaining credit balance is displayed in the menu bar. You can purchase more credits via the Pricing page.
            </Typography>
      </InfoCard>

      <InfoCard title="Security & Privacy" icon={<SecurityIcon />}>
           <Typography variant="body1" paragraph>
             We prioritize the security of your data. Communication with the backend is encrypted. File system access requires your explicit permission through the browser's built-in security prompts. We do not store your code persistently on our servers beyond what's necessary for processing your immediate request. Refer to our (future) Privacy Policy for full details.
           </Typography>
      </InfoCard>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
          <ContactSupportIcon sx={{ color: 'text.secondary', mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="body2" display="inline">
            For further assistance, please contact our support team (details to be provided).
          </Typography>
      </Box>
    </Box>
  );
}