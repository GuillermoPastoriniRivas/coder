import React, { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript'; // Importa los lenguajes que necesites
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import '../styles/OpenFolder.css';
import ChatInterface from './Chat/ChatInterface';
import { useDirectory } from '../context/DirectoryContext';
import { Button, Typography } from '@mui/material';

// Mapeo de extensiones a clases de lenguaje
const languageMap = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    css: 'css',
    py: 'python',
    json: 'json',
    md: 'markdown',
    // Agrega más extensiones según sea necesario
};

const OpenFolder = () => {
    const [fileContent, setFileContent] = useState('');
    const [expandedDirectories, setExpandedDirectories] = useState({});
    const [languageClassName, setLanguageClassName] = useState('language-plaintext'); // Clase de lenguaje por defecto
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree } = useDirectory();

    // Resalta el código cuando el contenido del archivo cambie
    useEffect(() => {
        Prism.highlightAll();
    }, [fileContent, languageClassName]);

    const handleOpenFolder = async () => {
        try {
            const folderHandle = await window.showDirectoryPicker();
            setFolderHandle(folderHandle);
            const files = await getFilesFromDirectory(folderHandle);
            setDirectoryTree(files);
        } catch (error) {
            console.log(error);
        }
    };

    const handleRefresh = async () => {
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);
    };

    const getFilesFromDirectory = async (folderHandle) => {
        const files = [];
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file' && entry.name[0] !== '.') {
                const file = await entry.getFile();
                const content = await file.text();
                files.push({ name: file.name, path: file.webkitRelativePath, content });
            } else if (entry.kind === 'directory' && !['node_modules', 'build', 'dist'].includes(entry.name) && entry.name[0] !== '.') {
                const subFiles = await getFilesFromDirectory(entry);
                files.push({ name: entry.name, path: entry.name, children: subFiles });
            }
        }
        return files;
    };

    const handleDirectoryClick = (name) => {
        setExpandedDirectories((prev) => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const handleFileClick = async (file) => {
        try {
            const content = file.content;
            setFileContent(content);

            // Obtener la extensión del archivo
            const extension = file.name.split('.').pop().toLowerCase();

            // Asignar la clase de lenguaje según la extensión
            const languageClass = languageMap[extension] || 'plaintext'; // Valor por defecto si no se encuentra la extensión
            setLanguageClassName(`language-${languageClass}`);
        } catch (error) {
            console.error('Error al abrir el archivo:', error);
        }
    };

    const handleSyncWithServer = () => {
        console.log('Sincronizando con el servidor...');
        console.log('Directorio:', folderHandle);
        console.log('Contenido:', directoryTree);
    };

    const renderDirectoryTree = (files) => {
        return (
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.children ? (
                            <span className="folder" onClick={() => handleDirectoryClick(file.name)}>
                                {expandedDirectories[file.name] ? '-' : '+'} <FolderIcon /> {file.name}
                            </span>
                        ) : (
                            <span className="file" onClick={() => handleFileClick(file)}>
                                <InsertDriveFileIcon /> {file.name}
                            </span>
                        )}
                        {file.children && expandedDirectories[file.name] && renderDirectoryTree(file.children)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="open-folder">
            <div className="actions">
                {!folderHandle && (
                    <Typography className="alert" variant="subtitle1">
                        Seleccione una carpeta para ver comenzar
                    </Typography>
                )}
                <Button variant="contained" color="primary" onClick={handleOpenFolder}>
                    Abrir Carpeta
                </Button>
                {folderHandle && (
                    <Button variant="contained" color="primary" onClick={handleRefresh}>
                        Actualizar
                    </Button>
                )}
                {folderHandle && (
                    <Button variant="contained" color="primary" onClick={handleSyncWithServer}>
                        Sincronizar con el servidor
                    </Button>
                )}
            </div>
            <h2>{folderHandle?.name ? folderHandle.name : ''}</h2>
            <div className="editor">
                <div className='directory-tree'>
                    {renderDirectoryTree(directoryTree)}
                </div>
                {folderHandle && (
                    <div className="file-content">
                        <pre>
                            <code className={languageClassName}>{fileContent}</code>
                        </pre>
                    </div>
                )}
                <div className='chat'>
                    {folderHandle?.name && <ChatInterface />}
                </div>
            </div>
        </div>
    );
};

export default OpenFolder;