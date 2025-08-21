import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Link, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
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
import GTranslateIcon from '@mui/icons-material/GTranslate'; // Translation icon

const content = {
    en: {
        mainTitle: "Boostware Documentation",
        tokens: {
            title: "Understanding Tokens & Credits",
            para1: "Boostware operates on a credit system based on 'tokens'. Think of tokens as pieces of words or code used by the AI model.",
            inputTokens: "Input Tokens: Consumed by the instructions you provide and the content of the files/folders you select as context.",
            outputTokens: "Output Tokens: Consumed by the AI's response, whether it's code changes, explanations, or answers.",
            para2: "Your total credit usage for each request depends on the combined number of input and output tokens, multiplied by the cost associated with the specific AI model used. You can monitor your balance in the top menu and purchase more credits via the Pricing page."
        },
        prompts: {
            title: "Writing Effective Prompts",
            para1: "To get the best results from the AI, focus on providing clear and direct instructions rather than asking open-ended questions.",
            beSpecific: "Be Specific & Imperative: Tell the AI what you want it to do. Instead of How can I add error handling?, say Add error handling to the `processData` function in `utils.js`.",
            provideContext: "Provide Context in Your Request: Briefly mention the goal or the reason for the change if it helps clarity. Example: Refactor the user query to improve performance by adding an index to the `email` field.",
            useFileSelection: "Use File Selection: Select only the relevant files/folders needed for the task. This focuses the AI and reduces token usage. Avoid selecting the entire project unless necessary."
        },
        fileSelection: {
            title: "File & Folder Selection",
            para1: "Use the file tree on the left to provide the AI with the necessary context for your request.",
            selecting: "Selecting Files/Folders: Check the boxes next to the items you want the AI to consider. Their content will be included as context.",
            noSelection: "No Selection: If you don't select any files or folders, the AI will only process your instruction based on its general knowledge. This is suitable for general questions but not for specific code modifications within your project.",
            contextLimit: "Context Window Limit: Be mindful of the 'Max Context Tokens' slider. Selecting too many large files might exceed the limit, preventing the AI from processing your request effectively."
        },
        promptingGuide: {
            title: "Prompting Guide (Visual)",
            para1: "When giving instructions, remember where the AI's output (code changes or text) will appear. This helps frame your requests effectively.",
            para2: "1. Code Changes (`coder` model): The AI attempts to generate file modifications. These appear in the main editor area, usually as a side-by-side diff. You review and apply them here.",
            illustration1: "[Illustration: Screenshot showing the Diff View (Editor Panel) with original code on left, modified code on right, and changes highlighted. ChangedFilesBar visible above.]",
            example1: "Example Prompt for Editor Output: \"Refactor the `getUser` function in `api/users.js` to use Promises instead of callbacks.\" (Make sure `api/users.js` is selected in the file tree first!)",
            para3: "2. Text Responses (`qa` model): Answers, explanations, or general information appear directly in the chat history panel on the right. The main editor area (Diff View) might remain unchanged or show a relevant file if you previously clicked one.",
            illustration2: "[Illustration: Screenshot showing the Chat Interface panel on the right, displaying an assistant's text response. The Editor Panel in the center might be empty or showing a file.]",
            example2: "Example Prompt for Chat Output: \"Explain the difference between `let`, `const` and `var` in JavaScript.\" (No file selection needed, `qa` model selected).",
            para4: "Providing clear, imperative instructions combined with the correct file/folder context (using the checkboxes in the left panel) leads to the most accurate results in the editor panel when using the `coder` model."
        },
        workflow: {
            title: "Workflow Steps",
            step1: "1. Sign Up / Log In: Access your account.",
            step2: "2. Open Folder: Click \"Open Folder\" and select your project directory using the browser's folder picker.",
            step3: "3. Select Context (Crucial): Check boxes next to specific files or sub-folders in the directory tree to provide them as context. If you don't select any, the AI might lack the necessary information to fulfill your request accurately. Providing relevant context is key! If no files or folders are selected, the AI will operate with only the instruction you provide, lacking specific code context.",
            step4: "4. Write Instructions: Type your request in the chat. Frame it as a command describing the changes you want (e.g., \"Refactor the `login` function in `auth.js` to use async/await\"). Avoid asking questions like \"How do I...?\" Be specific, provide details about the desired outcome, and use the file selection (Step 3) to limit the scope whenever possible.",
            step5: "5. Review Changes: If the AI provides code modifications, they will appear in the Diff Viewer. Changed files are listed above the editor. Click a file name to view its diff.",
            step6: "6. Apply Changes: Use the \"Apply\" button to save changes for the currently viewed file, or \"Apply All\" to save all proposed changes. Changes are written directly to your local files.",
            step7: "7. Manage Credits: Visit the \"Pricing\" page (accessible from the user menu) to add more credits."
        },
        faq: {
            title: "Frequently Asked Questions",
            q1: "Q: How does Boostware access local files?",
            a1: "Boostware uses the modern File System Access API available in compatible browsers (like Chrome, Edge). You explicitly grant permission for the application to read and write to the selected folder. This access is temporary and usually scoped to your session.",
            q2: "Q: Is my code uploaded anywhere?",
            a2: "When you request changes, the content of the files/folders you selected as context, along with your instructions, are sent to the backend AI model for processing. Only the necessary context is sent. Your entire project is not uploaded unless you explicitly select it. The connection is secured via HTTPS.",
            q3: "Q: What happens when I click 'Apply'?",
            a3: "The application uses the File System Access API again to write the modified content shown in the editor directly back to the corresponding local file within the folder you granted access to. It's highly recommended to use version control (like Git) with your projects to easily track and revert changes."
        },
        security: {
            title: "Security & Privacy",
            para1: "We prioritize the security of your data. Communication with the backend is encrypted. File system access requires your explicit permission through the browser's built-in security prompts. We do not store your code persistently on our servers beyond what's necessary for processing your immediate request. Refer to our (future) Privacy Policy for full details."
        },
        support: "For further assistance, please contact our support team (details to be provided)."
    },
    es: {
        mainTitle: "Documentación de Boostware",
        tokens: {
            title: "Entendiendo los Tokens y Créditos",
            para1: "Boostware opera con un sistema de créditos basado en 'tokens'. Piensa en los tokens como fragmentos de palabras o código utilizados por el modelo de IA.",
            inputTokens: "Tokens de Entrada: Consumidos por las instrucciones que proporcionas y el contenido de los archivos/carpetas que seleccionas como contexto.",
            outputTokens: "Tokens de Salida: Consumidos por la respuesta de la IA, ya sean cambios de código, explicaciones o respuestas.",
            para2: "El uso total de créditos para cada solicitud depende del número combinado de tokens de entrada y salida, multiplicado por el costo asociado al modelo de IA específico utilizado. Puedes monitorear tu saldo en el menú superior y comprar más créditos a través de la página de Precios."
        },
        prompts: {
            title: "Escribiendo Prompts Efectivos",
            para1: "Para obtener los mejores resultados de la IA, enfócate en proporcionar instrucciones claras y directas en lugar de hacer preguntas abiertas.",
            beSpecific: "Sé Específico e Imperativo: Dile a la IA lo que quieres que haga. En lugar de \"¿Cómo puedo añadir manejo de errores?\", di \"Añade manejo de errores a la función `processData` en `utils.js`.\"",
            provideContext: "Proporciona Contexto en Tu Solicitud: Menciona brevemente el objetivo o la razón del cambio si ayuda a la claridad. Ejemplo: \"Refactoriza la consulta de usuario para mejorar el rendimiento añadiendo un índice al campo `email`.\"",
            useFileSelection: "Usa la Selección de Archivos: Selecciona solo los archivos/carpetas relevantes necesarios para la tarea. Esto enfoca a la IA y reduce el uso de tokens. Evita seleccionar todo el proyecto a menos que sea necesario."
        },
        fileSelection: {
            title: "Selección de Archivos y Carpetas",
            para1: "Usa el árbol de archivos a la izquierda para proporcionar a la IA el contexto necesario para tu solicitud.",
            selecting: "Selección de Archivos/Carpetas: Marca las casillas junto a los elementos que deseas que la IA considere. Su contenido se incluirá como contexto.",
            noSelection: "Sin Selección: Si no seleccionas ningún archivo o carpeta, la IA solo procesará tu instrucción basándose en su conocimiento general. Esto es adecuado para preguntas generales, pero no para modificaciones de código específicas dentro de tu proyecto.",
            contextLimit: "Límite de la Ventana de Contexto: Ten en cuenta el deslizador 'Tokens de Contexto Máximo'. Seleccionar demasiados archivos grandes podría exceder el límite, impidiendo que la IA procese tu solicitud de manera efectiva."
        },
        promptingGuide: {
            title: "Guía de Prompts (Visual)",
            para1: "Al dar instrucciones, recuerda dónde aparecerá la salida de la IA (cambios de código o texto). Esto ayuda a formular tus solicitudes de manera efectiva.",
            para2: "1. Cambios de Código (modelo `coder`): La IA intenta generar modificaciones de archivos. Estas aparecen en el área principal del editor, generalmente como una diferencia lado a lado. Aquí las revisas y aplicas.",
            illustration1: "[Ilustración: Captura de pantalla que muestra la Vista de Diferencias (Panel del Editor) con el código original a la izquierda, el código modificado a la derecha y los cambios resaltados. La barra de Archivos Cambiados visible arriba.]",
            example1: "Ejemplo de Prompt para Salida del Editor: \"Refactoriza la función `getUser` en `api/users.js` para usar Promises en lugar de callbacks.\" (¡Asegúrate de que `api/users.js` esté seleccionado en el árbol de archivos primero!)",
            para3: "2. Respuestas de Texto (modelo `qa`): Las respuestas, explicaciones o información general aparecen directamente en el panel del historial de chat a la derecha. El área principal del editor (Vista de Diferencias) podría permanecer sin cambios o mostrar un archivo relevante si lo abriste previamente.",
            illustration2: "[Ilustración: Captura de pantalla que muestra el panel de la Interfaz de Chat a la derecha, mostrando una respuesta de texto del asistente. El Panel del Editor en el centro podría estar vacío o mostrando un archivo.]",
            example2: "Ejemplo de Prompt para Salida del Chat: \"Explica la diferencia entre `let`, `const` y `var` en JavaScript.\" (No se necesita selección de archivos, modelo `qa` seleccionado).",
            para4: "Proporcionar instrucciones claras e imperativas combinadas con el contexto de archivo/carpeta correcto (usando las casillas de verificación en el panel izquierdo) conduce a los resultados más precisos en el panel del editor al usar el modelo `coder`."
        },
        workflow: {
            title: "Pasos del Flujo de Trabajo",
            step1: "1. Registrarse / Iniciar Sesión: Accede a tu cuenta.",
            step2: "2. Abrir Carpeta: Haz clic en \"Abrir Carpeta\" y selecciona el directorio de tu proyecto usando el selector de carpetas del navegador.",
            step3: "3. Seleccionar Contexto (Crucial): Marca las casillas junto a los archivos o subcarpetas específicas en el árbol de directorios para proporcionarlos como contexto. Si no seleccionas ninguno, la IA podría carecer de la información necesaria para cumplir tu solicitud con precisión. ¡Proporcionar contexto relevante es clave! Si no se selecciona ningún archivo o carpeta, la IA operará solo con la instrucción que proporciones, sin un contexto de código específico.",
            step4: "4. Escribir Instrucciones: Escribe tu solicitud en el chat. Enmárcala como un comando que describa los cambios que deseas (ej. \"Refactoriza el componente de inicio de sesión para usar async/await en `auth.js`\"). Evita hacer preguntas como \"¿Cómo hago...?\" Sé específico, proporciona detalles sobre el resultado deseado y usa la selección de archivos (Paso 3) para limitar el alcance siempre que sea posible.",
            step5: "5. Revisar Cambios: Si la IA proporciona modificaciones de código, aparecerán en el Visor de Diferencias. Los archivos cambiados se listan encima del editor. Haz clic en un nombre de archivo para ver su diferencia.",
            step6: "6. Aplicar Cambios: Usa el botón \"Aplicar\" para guardar los cambios del archivo actualmente visible, o \"Aplicar Todo\" para guardar todos los cambios propuestos. Los cambios se escriben directamente en tus archivos locales.",
            step7: "7. Administrar Créditos: Visita la página \"Precios\" (accesible desde el menú de usuario) para añadir más créditos."
        },
        faq: {
            title: "Preguntas Frecuentes",
            q1: "P: ¿Cómo accede Boostware a los archivos locales?",
            a1: "Boostware utiliza la API moderna de Acceso al Sistema de Archivos disponible en navegadores compatibles (como Chrome, Edge). Concedes permiso explícitamente para que la aplicación lea y escriba en la carpeta seleccionada. Este acceso es temporal y generalmente está limitado a tu sesión.",
            q2: "P: ¿Mi código se sube a algún sitio?",
            a2: "Cuando solicitas cambios, el contenido de los archivos/carpetas que seleccionaste como contexto, junto con tus instrucciones, se envían al modelo de IA del backend para su procesamiento. Solo se envía el contexto necesario. Tu proyecto completo no se carga a menos que lo selecciones explícitamente. La conexión está asegurada mediante HTTPS.",
            q3: "P: ¿Qué sucede cuando hago clic en 'Aplicar'?",
            a3: "La aplicación utiliza nuevamente la API de Acceso al Sistema de Archivos para escribir el contenido modificado que se muestra en el editor directamente de vuelta al archivo local correspondiente dentro de la carpeta a la que concediste acceso. Se recomienda encarecidamente usar control de versiones (como Git) con tus proyectos para rastrear y revertir cambios fácilmente."
        },
        security: {
            title: "Seguridad y Privacidad",
            para1: "Priorizamos la seguridad de tus datos. La comunicación con el backend está cifrada. El acceso al sistema de archivos requiere tu permiso explícito a través de las indicaciones de seguridad integradas del navegador. No almacenamos tu código de forma persistente en nuestros servidores más allá de lo necesario para procesar tu solicitud inmediata. Consulta nuestra (futura) Política de Privacidad para obtener detalles completos."
        },
        support: "Para obtener más ayuda, contacta a nuestro equipo de soporte (los detalles se proporcionarán)."
    }
};


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
    const [isEnglish, setIsEnglish] = useState(true); // State to toggle language

    const currentContent = isEnglish ? content.en : content.es;

    const toggleLanguage = () => {
        setIsEnglish(prev => !prev);
    };

    return (
        // Use Box for padding and centering, maxWidth limits content width
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ flexGrow: 1, pr: 2 }}>
                    {currentContent.mainTitle}
                </Typography>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={toggleLanguage}
                    startIcon={<GTranslateIcon />}
                    size="small"
                >
                    {isEnglish ? 'Español' : 'English'}
                </Button>
            </Box>


            <InfoCard title={currentContent.tokens.title} icon={<PriceCheckIcon />}>
                <Typography variant="body1" paragraph>
                    {currentContent.tokens.para1}
                </Typography>
                <List dense sx={{ pl: 2 }}>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.tokens.inputTokens.split(':')[0]}:</strong> {currentContent.tokens.inputTokens.split(':')[1]}</>} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.tokens.outputTokens.split(':')[0]}:</strong> {currentContent.tokens.outputTokens.split(':')[1]}</>} />
                    </ListItem>
                </List>
                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                    {currentContent.tokens.para2}
                </Typography>
            </InfoCard>

            <InfoCard title={currentContent.prompts.title} icon={<ChatBubbleOutlineIcon />}>
                <Typography variant="body1" paragraph>
                    {currentContent.prompts.para1}
                </Typography>
                <List dense sx={{ pl: 2 }}>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.prompts.beSpecific.split(':')[0]}:</strong> {currentContent.prompts.beSpecific.split(':')[1]}</>} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.prompts.provideContext.split(':')[0]}:</strong> {currentContent.prompts.provideContext.split(':')[1]}</>} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.prompts.useFileSelection.split(':')[0]}:</strong> {currentContent.prompts.useFileSelection.split(':')[1]}</>} />
                    </ListItem>
                </List>
            </InfoCard>

            <InfoCard title={currentContent.fileSelection.title} icon={<FolderOpenIcon />}>
                <Typography variant="body1" paragraph>
                    {currentContent.fileSelection.para1}
                </Typography>
                <List dense sx={{ pl: 2 }}>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.fileSelection.selecting.split(':')[0]}:</strong> {currentContent.fileSelection.selecting.split(':')[1]}</>} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.fileSelection.noSelection.split(':')[0]}:</strong> {currentContent.fileSelection.noSelection.split(':')[1]}</>} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Typography color="primary.main" sx={{ fontSize: '1.2rem' }}>•</Typography></ListItemIcon>
                        <ListItemText primary={<><strong>{currentContent.fileSelection.contextLimit.split(':')[0]}:</strong> {currentContent.fileSelection.contextLimit.split(':')[1]}</>} />
                    </ListItem>
                </List>
            </InfoCard>

            <InfoCard title={currentContent.promptingGuide.title} icon={<VisibilityIcon />}>
                <Typography variant="body1" paragraph>
                    {currentContent.promptingGuide.para1}
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>{currentContent.promptingGuide.para2.split(':')[0]}:</strong> {currentContent.promptingGuide.para2.split(':')[1]}
                </Typography>
                <Box sx={{ my: 2, p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center', borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">{currentContent.promptingGuide.illustration1}</Typography>
                </Box>
                <Typography variant="body1" paragraph>
                    <strong>{currentContent.promptingGuide.example1.split(':')[0]}:</strong> {currentContent.promptingGuide.example1.split(':')[1]}
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>{currentContent.promptingGuide.para3.split(':')[0]}:</strong> {currentContent.promptingGuide.para3.split(':')[1]}
                </Typography>
                <Box sx={{ my: 2, p: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center', borderRadius: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">{currentContent.promptingGuide.illustration2}</Typography>
                </Box>
                <Typography variant="body1" paragraph>
                    <strong>{currentContent.promptingGuide.example2.split(':')[0]}:</strong> {currentContent.promptingGuide.example2.split(':')[1]}
                </Typography>
                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                    {currentContent.promptingGuide.para4}
                </Typography>
            </InfoCard>

            <InfoCard title={currentContent.workflow.title} icon={<PlayCircleOutlineIcon />}>
                <Typography variant="body1" component="div" sx={{ '& strong': { color: 'primary.main' } }}>
                    {currentContent.workflow.step1} <br />
                    {currentContent.workflow.step2} <br />
                    {currentContent.workflow.step3} <br />
                    {currentContent.workflow.step4} <br />
                    {currentContent.workflow.step5} <br />
                    {currentContent.workflow.step6} <br />
                    {currentContent.workflow.step7}
                </Typography>
            </InfoCard>

            <InfoCard title={currentContent.faq.title} icon={<HelpOutlineIcon />}>
                <Typography variant="subtitle1" gutterBottom>{currentContent.faq.q1}</Typography>
                <Typography variant="body2" paragraph>
                    {currentContent.faq.a1.split('compatible browsers (like Chrome, Edge).')[0]}
                    <Link href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API" target="_blank" rel="noopener noreferrer">File System Access API</Link>
                    {currentContent.faq.a1.split('compatible browsers (like Chrome, Edge).')[1]}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>{currentContent.faq.q2}</Typography>
                <Typography variant="body2" paragraph>
                    {currentContent.faq.a2}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>{currentContent.faq.q3}</Typography>
                <Typography variant="body2" paragraph>
                    {currentContent.faq.a3}
                </Typography>
            </InfoCard>

            <InfoCard title={currentContent.security.title} icon={<SecurityIcon />}>
                <Typography variant="body1" paragraph>
                    {currentContent.security.para1}
                </Typography>
            </InfoCard>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <ContactSupportIcon sx={{ color: 'text.secondary', mr: 1, verticalAlign: 'middle' }} />
                <Typography variant="body2" display="inline">
                    {currentContent.support}
                </Typography>
            </Box>
        </Box>
    );
}