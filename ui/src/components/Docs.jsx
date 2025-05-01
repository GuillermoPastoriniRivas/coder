import React from 'react';
import { Box, Typography, Paper, Divider, Link, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info'; // General info icon
import BuildIcon from '@mui/icons-material/Build'; // Features icon
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // How to use icon
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // FAQ icon
import SecurityIcon from '@mui/icons-material/Security'; // Security icon
import ContactSupportIcon from '@mui/icons-material/ContactSupport'; // Support icon
import PriceCheckIcon from '@mui/icons-material/PriceCheck'; // Icon for Tokens/Credits
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Icon for Prompts
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Icon for File Selection
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for Visual Guide

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
        Boostware Documentation
      </Typography>



       <InfoCard title="Understanding Tokens & Credits" icon={<PriceCheckIcon />}>
          <Typography variant="body1" paragraph>
            Boostware operates on a credit system based on 'tokens'. Think of tokens as pieces of words or code used by the AI model.
          </Typography>
           <List dense sx={{ pl: 2 }}>
                <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Input Tokens:</strong> Consumed by the instructions you provide and the content of the files/folders you select as context.</>} />
                </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Output Tokens:</strong> Consumed by the AI's response, whether it's code changes, explanations, or answers.</>} />
                </ListItem>
           </List>
           <Typography variant="body1" paragraph sx={{ mt: 2 }}>
             Your total credit usage for each request depends on the combined number of input and output tokens, multiplied by the cost associated with the specific AI model used. You can monitor your balance in the top menu and purchase more credits via the Pricing page.
           </Typography>
      </InfoCard>

      <InfoCard title="Writing Effective Prompts" icon={<ChatBubbleOutlineIcon />}>
          <Typography variant="body1" paragraph>
              To get the best results from the AI, focus on providing clear and direct instructions rather than asking open-ended questions.
          </Typography>
          <List dense sx={{ pl: 2 }}>
                <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Be Specific & Imperative:</strong> Tell the AI what you want it to do. Instead of "How can I add error handling?", say "Add error handling to the `processData` function in `utils.js`."</>} />
                </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Provide Context in Your Request:</strong> Briefly mention the goal or the reason for the change if it helps clarity. Example: "Refactor the user query to improve performance by adding an index to the `email` field."</>} />
                </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Use File Selection:</strong> Select only the relevant files/folders needed for the task. This focuses the AI and reduces token usage. Avoid selecting the entire project unless necessary.</>} />
                </ListItem>
           </List>
      </InfoCard>

      <InfoCard title="File & Folder Selection" icon={<FolderOpenIcon />}>
          <Typography variant="body1" paragraph>
            Use the file tree on the left to provide the AI with the necessary context for your request.
          </Typography>
           <List dense sx={{ pl: 2 }}>
                <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Selecting Files/Folders:</strong> Check the boxes next to the items you want the AI to consider. Their content will be included as context.</>} />
                </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>No Selection:</strong> If you don't select any files or folders, the AI will only process your instruction based on its general knowledge. This is suitable for general questions but not for specific code modifications within your project.</>} />
                </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{minWidth: 30}}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                    <ListItemText primary={<><strong>Context Window Limit:</strong> Be mindful of the 'Max Context Tokens' slider. Selecting too many large files might exceed the limit, preventing the AI from processing your request effectively.</>} />
                </ListItem>
           </List>
      </InfoCard>

      <InfoCard title="Prompting Guide (Visual)" icon={<VisibilityIcon />}>
          <Typography variant="body1" paragraph>
              When giving instructions, remember where the AI's output (code changes or text) will appear. This helps frame your requests effectively.
          </Typography>
          <Typography variant="body1" paragraph>
              <strong>1. Code Changes (`coder` model):</strong> The AI attempts to generate file modifications. These appear in the main editor area, usually as a side-by-side diff. You review and apply them here.
          </Typography>
          {/* Placeholder for illustration 1 */}
          <Box sx={{ my: 2, p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center', borderRadius: 1, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">[Illustration: Screenshot showing the Diff View (Editor Panel) with original code on left, modified code on right, and changes highlighted. ChangedFilesBar visible above.]</Typography>
          </Box>
           <Typography variant="body1" paragraph>
              <strong>Example Prompt for Editor Output:</strong> "Refactor the `getUser` function in `api/users.js` to use Promises instead of callbacks." (Make sure `api/users.js` is selected in the file tree first!)
          </Typography>
           <Typography variant="body1" paragraph>
              <strong>2. Text Responses (`qa` model):</strong> Answers, explanations, or general information appear directly in the chat history panel on the right. The main editor area (Diff View) might remain unchanged or show a relevant file if you previously clicked one.
          </Typography>
           {/* Placeholder for illustration 2 */}
           <Box sx={{ my: 2, p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center', borderRadius: 1, bgcolor: 'action.hover' }}>
               <Typography variant="caption" color="text.secondary">[Illustration: Screenshot showing the Chat Interface panel on the right, displaying an assistant's text response. The Editor Panel in the center might be empty or showing a file.]</Typography>
           </Box>
            <Typography variant="body1" paragraph>
               <strong>Example Prompt for Chat Output:</strong> "Explain the difference between `let`, `const`, and `var` in JavaScript." (No file selection needed, `qa` model selected).
           </Typography>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              Providing clear, imperative instructions combined with the correct file/folder context (using the checkboxes in the left panel) leads to the most accurate results in the editor panel when using the `coder` model.
           </Typography>
      </InfoCard>

      <InfoCard title="Workflow Steps" icon={<PlayCircleOutlineIcon />}>
           <Typography variant="body1" component="div" sx={{ '& strong': { color: 'primary.main' } }}>
              1. <strong>Sign Up / Log In:</strong> Access your account. <br />
              2. <strong>Open Folder:</strong> Click "Open Folder" and select your project directory using the browser's folder picker. <br />
              3. <strong>Select Context (Crucial):</strong> Check boxes next to specific files or sub-folders in the directory tree to provide them as context. If you don't select any, the AI might lack the necessary information to fulfill your request accurately. Providing relevant context is key! If no files or folders are selected, the AI will operate with only the instruction you provide, lacking specific code context. <br />
              4. <strong>Write Instructions:</strong> Type your request in the chat. Frame it as a command describing the changes you want (e.g., "Refactor the `login` function in `auth.js` to use async/await"). Avoid asking questions like "How do I...?" Be specific, provide details about the desired outcome, and use the file selection (Step 3) to limit the scope whenever possible. <br />
              5. <strong>Review Changes:</strong> If the AI provides code modifications, they will appear in the Diff Viewer. Changed files are listed above the editor. Click a file name to view its diff. <br />
              6. <strong>Apply Changes:</strong> Use the "Apply" button to save changes for the currently viewed file, or "Apply All" to save all proposed changes. Changes are written directly to your local files. <br />
              7. <strong>Manage Credits:</strong> Visit the "Pricing" page (accessible from the user menu) to add more credits.
          </Typography>
      </InfoCard>

       <InfoCard title="Frequently Asked Questions" icon={<HelpOutlineIcon />}>
           <Typography variant="subtitle1" gutterBottom>Q: How does Boostware access local files?</Typography>
           <Typography variant="body2" paragraph>
             Boostware uses the modern <Link href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API" target="_blank" rel="noopener noreferrer">File System Access API</Link> available in compatible browsers (like Chrome, Edge). You explicitly grant permission for the application to read and write to the selected folder. This access is temporary and usually scoped to your session.
           </Typography>

           <Typography variant="subtitle1" gutterBottom>Q: Is my code uploaded anywhere?</Typography>
           <Typography variant="body2" paragraph>
               When you request changes, the content of the files/folders you selected as context, along with your instructions, are sent to the backend AI model for processing. Only the necessary context is sent. Your entire project is not uploaded unless you explicitly select it. The connection is secured via HTTPS.
           </Typography>

           <Typography variant="subtitle1" gutterBottom>Q: What happens when I click 'Apply'?</Typography>
           <Typography variant="body2" paragraph>
             The application uses the File System Access API again to write the modified content shown in the editor directly back to the corresponding local file within the folder you granted access to. It's highly recommended to use version control (like Git) with your projects to easily track and revert changes.
           </Typography>
           {/* Removed the old "How do credits work?" Q/A as it's covered in the dedicated section */}
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