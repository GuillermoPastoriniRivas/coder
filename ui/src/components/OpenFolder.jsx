import React, { useEffect, useState } from 'react';
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
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree } = useDirectory();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false); // New loading state

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
        setLoading(true); // Start loading
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);

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
            const content = file.content;
            setFileContent(content);

            const extension = file.name.split('.').pop().toLowerCase();
            const languageClass = languageMap[extension] || 'plaintext';
            setLanguageClassName(`language-${languageClass}`);
        } catch (error) {
            console.error('Error opening file:', error);
        }
    };

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
        setSelectedConversation(conversation);
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
                <Button variant="contained" color="primary" onClick={handleOpenFolder}>
                    Open Folder
                </Button>
                {folderHandle && (
                    <Button variant="contained" color="primary" onClick={handleRefresh} startIcon={<RefreshIcon />} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Refresh'}
                    </Button>
                )}
            </div>
            <h2>{folderHandle?.name ? folderHandle.name : ''}</h2>
            <div className="editor">
                <div className="directory-tree">
                    {folderHandle && (
                        <>
                            <ConversationsList onSelectConversation={handleSelectConversation} onStartNewConversation={handleStartNewConversation} />
                            {renderDirectoryTree(directoryTree)}
                        </>
                    )}
                </div>
                {folderHandle && (
                    <div className="file-content">
                        <pre>
                            <code className={languageClassName}>{fileContent}</code>
                        </pre>
                    </div>
                )}
                <div className="chat">{folderHandle && <ChatInterface selectedConversation={selectedConversation} handleMessageClick={handleMessageClick} />}</div>
            </div>
        </div>
    );
};

export default OpenFolder;
