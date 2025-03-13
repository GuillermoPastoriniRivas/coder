export const parseAIMessageForFiles = (folderName, content) => {
    const sections = content.split('----------------------').filter((s) => s.trim() !== '');

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