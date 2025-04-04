export const parseAIMessageForFiles = (folderName, content) => {
    const sections = content.split('--------------------').filter((s) => s.trim() !== '');

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
                path: path.replace(/\\/g, "/")?.split(folderName).pop()?.slice(1)?.trim() || '',
                newContent: rest.join('+++++').trim()
            };
        })
        .filter((file) => file.path);
};


export const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '00px';
    notification.style.left = '00px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = '#fff';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }