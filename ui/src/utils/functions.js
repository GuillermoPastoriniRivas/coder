export const parseAIMessageForFiles = (folderName, content) => {
    const sections = content.split('----------------------').filter((s) => s.trim() !== '');

    // Expresión regular mejorada para verificar si el path parece una ruta de archivo
    const filePathRegex = /^([a-zA-Z]:\\|\\|\/)?([^\\\/:*?"<>|\r\n]+[\\\/])*[^\\\/:*?"<>|\r\n]*\.?\w+$/;

    return sections
        .map((section) => {
            const [path, ...rest] = section.split('+++++');

            // Verificar si el path parece una ruta de archivo
            if (!filePathRegex.test(path?.trim())) {
                return {
                    path: "Instructions.md",
                    newContent: section.trim()
                };
            }

            return {
                path: path.replace(/\\/g, "/")?.split(folderName).pop()?.slice(1)?.trim() || '',
                newContent: rest.join('+++++').replace(/\+\+\+\+\+/g, "").trim()
            };
        })
        .filter((file) => file.path);
};