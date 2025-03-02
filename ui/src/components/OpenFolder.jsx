import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/OpenFolder.css';

const OpenFolder = () => {
    const navigate = useNavigate();
    const [directoryTree, setDirectoryTree] = useState([]);
    const [fileContent, setFileContent] = useState('');
    const [folderHandle, setFolderHandle] = useState(null);

    const handleOpenFolder = async () => {
        const folderHandle = await window.showDirectoryPicker();
        setFolderHandle(folderHandle);
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);
    };

    const handleRefresh = async () => {
        const files = await getFilesFromDirectory(folderHandle);    
        setDirectoryTree(files);
    };

    const getFilesFromDirectory = async (folderHandle) => {
        const files = [];
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file') {
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

    const handleFileClick = async (file) => {
        console.log('file:', file);
        try {
            const content = file.content
            setFileContent(content);
        } catch (error) {
            console.error('Error al abrir el archivo:', error);
        }
    };

    const handleSyncWithServer = () => {
        console.log('Sincronizando con el servidor...');
        // Aquí puedes agregar la lógica para enviar el contenido al backend
    };

    const renderDirectoryTree = (files) => {
        return (
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.children ? (
                            <span>{file.name}</span>
                        ) : (
                            <span onClick={() => handleFileClick(file)}>{file.name}</span>
                        )}
                        {file.children && renderDirectoryTree(file.children)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className='open-folder'>
            <h1>Abrir Carpeta</h1>
            <button onClick={handleOpenFolder}>Seleccionar Carpeta</button>
            <button onClick={() => handleRefresh()}>Actualizar Contenido</button>
            <button onClick={handleSyncWithServer}>Sincronizar con el Servidor</button>
            <button onClick={() => navigate('/chat')}>Ir al Chat</button>
            <div className='editor'>
            {renderDirectoryTree(directoryTree)}
            {fileContent && (
                <div>
                    <h2>Contenido del Archivo:</h2>
                    <pre>{fileContent}</pre>
                </div>
            )}
            </div>
            
        </div>
    );
};

export default OpenFolder;
