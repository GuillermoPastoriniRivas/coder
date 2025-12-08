import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const parseAIMessageForFiles = (folderName, content) => {
    const sections = content.split('####################').filter((s) => s.trim() !== '');

    return sections
        .map((section) => {

            const [path, ...rest] = section.split('+++++');

            // Verificar si el path parece una ruta de archivo
            if (!section.includes('+++++')) {
                return {
                    path: "Instructions.md",
                    newContent: section.trim()
                };
            }

            return {
                path: path.replace(/\\/g, "/")?.split(`67c48e76f8288aad11d6bdf9/${folderName}`).pop()?.slice(1)?.trim() || '',
                newContent: rest.join('+++++').trim()
            };
        })
        .filter((file) => file.path);
};


// Enhanced notification function using basic DOM manipulation but with severity styling
export const showNotification = (message, severity = 'info', duration = 3000) => {
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.innerText = message;

    // Base styles (can be overridden by CSS)
    notification.style.position = 'fixed';
    notification.style.bottom = '20px'; // Position from bottom
    notification.style.left = '20px'; // Position from left
    notification.style.color = '#fff'; // Default text color
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = 'var(--border-radius-medium, 6px)'; // Use theme variable if defined, else fallback
    notification.style.zIndex = '9999';
    notification.style.opacity = '0'; // Start transparent for fade-in
    notification.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    notification.style.transform = 'translateY(20px)'; // Start slightly lower
    notification.style.boxShadow = 'var(--box-shadow-medium, 0 4px 12px rgba(0, 0, 0, 0.4))';
    notification.style.maxWidth = '400px'; // Limit width
    notification.style.whiteSpace = 'pre-wrap'; // Allow line breaks in message

    // Apply severity-specific styles
    notification.classList.add('notification-base'); // Base class for potential global styles
    switch (severity) {
        case 'success':
            notification.style.backgroundColor = 'var(--color-success, #4caf50)'; // Green
            notification.classList.add('notification-success');
            break;
        case 'error':
            notification.style.backgroundColor = 'var(--color-error, #f44336)'; // Red
            notification.classList.add('notification-error');
            break;
        case 'warning':
            notification.style.backgroundColor = 'var(--color-warning, #ff9800)'; // Orange
            notification.style.color = '#000'; // Darker text for warning
            notification.classList.add('notification-warning');
            break;
        case 'info':
        default:
            notification.style.backgroundColor = 'var(--color-info, #2196f3)'; // Blue
            notification.classList.add('notification-info');
            break;
    }

    document.body.appendChild(notification);

    // Trigger fade-in and slide-up animation
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Set timeout to remove the notification
    setTimeout(() => {
         // Fade-out and remove
         notification.style.opacity = '0';
         notification.style.transform = 'translateY(20px)';
         // Remove element after transition completes
         notification.addEventListener('transitionend', () => {
            const element = document.getElementById(notificationId);
            if (element) {
                document.body.removeChild(element);
            }
         });
    }, duration);
};

// Function to download the virtual project structure as a ZIP file
export const downloadProjectAsZip = async (treeNodes, zipFileName = 'project') => {
    const zip = new JSZip();

    const addNodesToZip = (nodes, currentZipFolder) => {
        nodes.forEach(node => {
            if (node.isLeaf) {
                // Add file
                // Use empty string if content is null/undefined
                currentZipFolder.file(node.name, node.content || '');
            } else {
                // Add folder and recurse
                const subFolder = currentZipFolder.folder(node.name);
                if (node.children && subFolder) { // Check subFolder creation success
                    addNodesToZip(node.children, subFolder);
                }
            }
        });
    };

    // Start adding nodes from the root level of the provided tree data
    addNodesToZip(treeNodes, zip);

    // Generate the zip file asynchronously
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Trigger the download
    saveAs(zipBlob, `${zipFileName}.zip`);
};