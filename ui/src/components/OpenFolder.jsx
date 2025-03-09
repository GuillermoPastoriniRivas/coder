import React, { useEffect, useState, useRef } from 'react';
import * as monaco from 'monaco-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
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
import { Button, Typography, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api';
import ConversationsList from './Chat/Conversations';

const languageMap = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    css: 'css',
    py: 'python',
    json: 'json',
    md: 'markdown'
};

const OpenFolder = () => {
    const [fileContent, setFileContent] = useState('');
    const [expandedDirectories, setExpandedDirectories] = useState({});
    const [languageClassName, setLanguageClassName] = useState('language-plaintext');
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree, setConversations } = useDirectory();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDiffView, setIsDiffView] = useState(false);
    const containerRef = useRef(null);
    const diffEditorRef = useRef(null)
    const [changedFiles, setChangedFiles] = useState({});
    const [selectedFilePath, setSelectedFilePath] = useState(null);;

    useEffect(() => {
        Prism.highlightAll();
    }, [fileContent, languageClassName, isDiffView]);

    useEffect(() => {

        if (isDiffView && selectedFilePath && containerRef.current) {
            const file = changedFiles[selectedFilePath];
            const originalModel = monaco.editor.createModel(file.original);
            const modifiedModel = monaco.editor.createModel(file.modified);
    
            diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
                theme: 'vs-dark'
            });
    
            diffEditorRef.current.setModel({
                original: originalModel,
                modified: modifiedModel
            });
    
            return () => {
                diffEditorRef.current.dispose();
                originalModel.dispose();
                modifiedModel.dispose();
            };
        }
        console.log("changedFiles",changedFiles);
        console.log("selectedFilePath",selectedFilePath);
    }, [isDiffView, selectedFilePath, changedFiles]);

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
        setLoading(true); // Start loading
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);
    
        // Refresh conversations
        const response = await api.getConversations();
        setConversations(response.data); // Assuming you have a state for conversations in OpenFolder
    
        await api.syncDirectory({
            folder: folderHandle.name,
            directoryTree: directoryTree
        });
        setLoading(false); // Stop loading
    };

    const getFilesFromDirectory = async (folderHandle) => {
        const files = [];
        for await (const entry of folderHandle.values()) {
            if (
                entry.kind === 'file' &&
                entry.name[0] !== '.' &&
                !['package-lock.json', 'yarn.lock'].includes(entry.name) &&
                ['md', 'js', 'tsx', 'jsx', 'json', 'css', 'scss', 'html', 'ts', 'py'].includes(entry.name.split('.').pop())
            ) {
                const file = await entry.getFile();
                const content = await file.text();
                files.push({ name: file.name, path: file.webkitRelativePath, content });
            } else if (entry.kind === 'directory' && !['node_modules', 'build', 'dist', 'sources'].includes(entry.name) && entry.name[0] !== '.') {
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
            const extension = file.name.split('.').pop().toLowerCase();
            const lang = languageMap[extension] || 'plaintext';
            const newContent = file.content;
    
            setChangedFiles(prev => {
                if (!prev[file.path]) {
                    return {
                        ...prev,
                        [file.name]: {
                            original: newContent,
                            modified: `${newContent}\n// Modificación de ejemplo`,
                            language: lang
                        }
                    };
                }
                return prev;
            });
    
            setSelectedFilePath(file.path);
            setLanguageClassName(`language-${lang}`);
        } catch (error) {
            console.error('Error opening file:', error);
        }
    };

    const ChangedFilesBar = () => (
        <div className="changed-files-bar">
            {Object.keys(changedFiles).map(path => (
                <Button
                    key={path}
                    onClick={() => setSelectedFilePath(path)}
                    variant={selectedFilePath === path ? 'contained' : 'outlined'}
                    color="secondary"
                    style={{ margin: '0 5px' }}
                >
                    {path}
                </Button>
            ))}
        </div>
    );

    const handleMessageClick = async (content) => {
        try {
            setFileContent(content);
            const extension = 'md';
            const languageClass = languageMap[extension] || 'plaintext';
            setLanguageClassName(`language-${languageClass}`);
        } catch (error) {
            console.error('Error opening message:', error);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(null);

        handleMessageClick(conversation?.messages?.[0]?.content)
    };

    const handleStartNewConversation = () => {
        setSelectedConversation(null);
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
                        Select a folder to begin
                    </Typography>
                )}
                <Button variant="contained" color="primary" onClick={() => handleOpenFolder()}>
                    Open Folder
                </Button>
                {folderHandle && (
                    <>
                    <Button variant="contained" color="primary" onClick={() => handleRefresh()} startIcon={<RefreshIcon />} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Refresh'}
                    </Button>
                    <Button 
                    variant="contained" 
                    onClick={() => setIsDiffView(!isDiffView)}
                    style={{ margin: '10px 0', marginLeft: 'calc(10% - 8px)' }}
                >
                    {isDiffView ? 'Vista Normal' : 'Vista Diff'}
                </Button></>
                )}
            </div>
            
            <div className="editor">
                <div className="directory-tree">
                    {folderHandle && (
                        <>
                            <h2>{folderHandle?.name ? folderHandle.name : ''}</h2>
                            {renderDirectoryTree(directoryTree)}
                            <ConversationsList onSelectConversation={handleSelectConversation} onStartNewConversation={handleStartNewConversation} />
                        </>
                    )}
                </div>
                {folderHandle && (
                    <div className="file-content">
                        {Object.keys(changedFiles).length > 0 && <ChangedFilesBar />}
                        
                        
                        {selectedFilePath ? (
                            isDiffView ? (
                                <div ref={containerRef} style={{ height: '600px', border: '1px solid #3a3a3a' }} />
                            ) : (
                                <pre>
                                    <code className={languageClassName}>
                                        {changedFiles[selectedFilePath].modified}
                                    </code>
                                </pre>
                            )
                        ) : (
                            <div className="empty-state">Selecciona un archivo para ver su contenido</div>
                        )}
                    </div>
                )}
                <div className="chat">{folderHandle && <ChatInterface selectedConversation={selectedConversation} handleMessageClick={handleMessageClick} />}</div>
            </div>
        </div>
    );
};

export default OpenFolder;
