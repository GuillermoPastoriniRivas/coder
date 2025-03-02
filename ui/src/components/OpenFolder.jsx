import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FolderIcon from '@mui/icons-material/Folder'; // Importa el icono de carpeta
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // Importa el icono de archivo
import '../styles/OpenFolder.css';
import ChatInterface from './Chat/ChatInterface';
import { useDirectory } from '../context/DirectoryContext';

const OpenFolder = () => {
    const navigate = useNavigate();
    const [fileContent, setFileContent] = useState('');
    const [expandedDirectories, setExpandedDirectories] = useState({});
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree } = useDirectory();

    const handleOpenFolder = async () => {
        const folderHandle = await window.showDirectoryPicker();
        setFolderHandle(folderHandle);
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);
    };

    useEffect(() => {
        if (folderHandle && directoryTree) {
            handleRefresh();
        }
    }, []);

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
            } else if (entry.kind === 'directory' && !['node_modules', 'build'].includes(entry.name) && entry.name[0] !== '.') {
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
        console.log('file:', file);
        try {
            const content = file.content;
            setFileContent(content);
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
                {!folderHandle && <p className='alert'>Seleccione una carpeta para ver comenzar</p>}
                <button onClick={handleOpenFolder}>Abrir Carpeta</button>
                {folderHandle && <button onClick={handleRefresh}>Actualizar</button>}
                {folderHandle && <button onClick={handleSyncWithServer}>Sincronizar con el servidor</button>}
            </div>
            <h2>{folderHandle?.name ? folderHandle.name : ''}</h2>
            <div className="editor">
                {renderDirectoryTree(directoryTree)}
                {folderHandle && (
                    <div className="file-content">
                        <pre>{fileContent}</pre>
                    </div>
                )}
                {folderHandle?.name && <ChatInterface />}
            </div>
        </div>
    );
};

export default OpenFolder;
