import React, { useEffect, useState, useRef, useCallback } from 'react';
import DirectoryTree from './DirectoryTree';
import ChangedFilesBar from './ChangedFilesBar';
import FileContent from './FileContent';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { Button, Typography, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api';
import ConversationsList from './Chat/Conversations';
import { parseAIMessageForFiles } from '../utils/functions';
import ChatInterface from './Chat/ChatInterface';
import '../styles/OpenFolder.css';
import { useDirectory } from '../context/DirectoryContext';

const languageExtensions = {
    js: [javascript()],
    ts: [javascript()],
    jsx: [javascript({ jsx: true })],
    tsx: [javascript({ jsx: true })],
    css: [css()],
    py: [python()],
    json: [json()],
    md: [markdown()]
};

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
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree, setConversations, selectedSubFolders, toggleSubFolder, clearSelectedSubFolders } = useDirectory();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vectorLoading, setVectorLoading] = useState(false);
    const [isDiffView, setIsDiffView] = useState(true);
    const [changedFiles, setChangedFiles] = useState({});
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [selectedModel, setSelectedModel] = useState('o3-mini');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [directoryWidth, setDirectoryWidth] = useState(300);
    const [chatWidth, setChatWidth] = useState(300);
    const [collapseUnchanged, setCollapseUnchanged] = useState(false);
    const [footerInfoVisible, setFooterInfoVisible] = useState(true);
    const editorRef = useRef(null);
    const resizer1Ref = useRef(null);
    const resizer2Ref = useRef(null);
    const isResizing1 = useRef(false);
    const isResizing2 = useRef(false);

    const toggleFooterInfo = () => {
        setFooterInfoVisible(prev => !prev);
    };

    const getLanguageExtension = (path) => {
        const extension = path?.split('.').pop().toLowerCase();
        return languageExtensions[extension] || [];
    };

    const handleModifiedChange = (value) => {
        if (selectedFilePath) {
            setChangedFiles((prev) => ({
                ...prev,
                [selectedFilePath]: {
                    ...prev[selectedFilePath],
                    modified: value
                }
            }));
        }
    };

    const findFileByPath = useCallback((tree, targetPath) => {
        for (const item of tree) {
            if (item.path === targetPath) return item;
            if (item.children) {
                const found = findFileByPath(item.children, targetPath);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const handleFileChanges = useCallback(
        (files) => {
            setChangedFiles({});
            files.forEach(({ path, newContent }) => {
                const fileEntry = findFileByPath(directoryTree, path);
                const originalContent = fileEntry?.content || '';
                const extension = path.split('.').pop().toLowerCase();
                const lang = languageMap[extension] || 'plaintext';

                setChangedFiles((prev) => ({
                    ...prev,
                    [path]: {
                        original: originalContent,
                        modified: newContent,
                        language: lang
                    }
                }));
            });

            if (files.length > 0) {
                setSelectedFilePath(files[0].path);
            }
        },
        [directoryTree, findFileByPath]
    );

    useEffect(() => {
        Prism.highlightAll();
    }, [fileContent, languageClassName, isDiffView]);

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
        setLoading(true);
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);
        const payload = {
            folder: folderHandle ? folderHandle.name : null,
            directoryTree: directoryTree,
            selectedFolders: selectedSubFolders.length > 0 ? selectedSubFolders : null,
        };
        await api.syncDirectory(payload);
        const response = await api.getConversations(folderHandle.name);
        setConversations(response.data);
        setLoading(false);
    };

    const handleUpdateVectors = async () => {
        try {
            setVectorLoading(true);
            const payload = {
                folder: folderHandle ? folderHandle.name : null,
                selectedFolders: selectedSubFolders.length > 0 ? selectedSubFolders : null,
            };
            await api.updateVectors(payload);
        } catch (error) {
            console.error("Error updating vectors:", error);
        } finally {
            setVectorLoading(false);
        }
    };

    const getFilesFromDirectory = async (folderHandle, basePath = '') => {
        const files = [];
        for await (const entry of folderHandle.values()) {
            const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (
                entry.kind === 'file' &&
                entry.name[0] !== '.' &&
                !['package-lock.json', 'yarn.lock'].includes(entry.name) &&
                ['md', 'js', 'tsx', 'jsx', 'json', 'css', 'scss', 'html', 'ts', 'py'].includes(entry.name.split('.').pop())
            ) {
                const file = await entry.getFile();
                const content = await file.text();
                files.push({ name: entry.name, path: entryPath, content, handler: entry });
            } else if (entry.kind === 'directory' && !['node_modules', 'build', 'dist', 'sources'].includes(entry.name) && entry.name[0] !== '.') {
                const subFiles = await getFilesFromDirectory(entry, entryPath);
                files.push({ name: entry.name, path: entryPath, children: subFiles });
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
            setChangedFiles({});
            setChangedFiles((prev) => ({
                ...prev,
                [file.path]: {
                    original: file.content,
                    modified: file.content,
                    language: lang
                }
            }));

            setSelectedFilePath(file.path);
            setLanguageClassName(`language-${lang}`);
            setIsDiffView(false);
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
        console.log('Selected conversation:', conversation);
        setSelectedConversation(conversation);
        loadFilesFromConversation(conversation);
        setIsDiffView(true);
    };

    const applyChanges = useCallback(async () => {
        if (selectedFilePath && changedFiles[selectedFilePath]) {
            const { modified } = changedFiles[selectedFilePath];
            let fileEntry = findFileByPath(directoryTree, selectedFilePath);

            if (!fileEntry || !fileEntry.handler) {
                try {
                    const pathParts = selectedFilePath.split('/');
                    let currentHandle = folderHandle;

                    for (let i = 0; i < pathParts.length - 1; i++) {
                        const part = pathParts[i];
                        let subDir = null;
                        for await (const entry of currentHandle.values()) {
                            if (entry.kind === 'directory' && entry.name === part) {
                                subDir = entry;
                                break;
                            }
                        }
                        if (!subDir) {
                            subDir = await currentHandle.getDirectoryHandle(part, { create: true });
                        }
                        currentHandle = subDir;
                    }

                    const fileName = pathParts[pathParts.length - 1];
                    const newFileHandle = await currentHandle.getFileHandle(fileName, { create: true });

                    const writable = await newFileHandle.createWritable();
                    await writable.write(modified);
                    await writable.close();

                    const newFile = { name: fileName, path: selectedFilePath, content: modified, handler: newFileHandle };
                    setDirectoryTree((prevTree) => {
                        const addFile = (tree, parts, currentPath = []) => {
                            if (parts.length === 0) return tree;

                            const [currentPart, ...remainingParts] = parts;
                            const newPath = [...currentPath, currentPart];

                            let dir = tree.find((item) => item.name === currentPart && item.children);

                            if (remainingParts.length > 0) {
                                if (!dir) {
                                    dir = {
                                        name: currentPart,
                                        path: newPath.join('/'),
                                        children: []
                                    };
                                    tree.push(dir);
                                }
                                dir.children = addFile(dir.children, remainingParts, newPath);
                            } else {
                                if (!tree.some((item) => item.name === currentPart)) {
                                    tree.push(newFile);
                                }
                            }

                            return tree;
                        };

                        return addFile([...prevTree], pathParts);
                    });

                    setChangedFiles((prev) => ({
                        ...prev,
                        [selectedFilePath]: {
                            original: modified,
                            modified: modified,
                            language: languageMap[selectedFilePath.split('.').pop().toLowerCase()] || 'plaintext'
                        }
                    }));

                    setSelectedFilePath(selectedFilePath);
                    setLanguageClassName(`language-${languageMap[selectedFilePath.split('.').pop().toLowerCase()] || 'plaintext'}`);
                } catch (error) {
                    console.error('Error creating new file:', error);
                    alert('Error al crear el nuevo archivo.');
                }
            } else {
                try {
                    const writable = await fileEntry.handler.createWritable();
                    await writable.write(modified);
                    await writable.close();

                    setChangedFiles((prev) => ({
                        ...prev,
                        [selectedFilePath]: {
                            ...prev[selectedFilePath],
                            original: modified
                        }
                    }));

                    handleRefresh();
                } catch (error) {
                    console.error('Error aplicando cambios:', error);
                    alert('Error al aplicar cambios');
                }
            }
        }
    }, [selectedFilePath, changedFiles, findFileByPath, directoryTree, handleRefresh, folderHandle]);

    const applyAllChanges = useCallback(async () => {
        if (Object.keys(changedFiles).length === 0) return;

        setLoading(true);
        try {
            for (const filePath of Object.keys(changedFiles)) {
                const { modified } = changedFiles[filePath];
                let fileEntry = findFileByPath(directoryTree, filePath);

                if (!fileEntry || !fileEntry.handler) {
                    try {
                        const pathParts = filePath.split('/');
                        let currentHandle = folderHandle;

                        for (let i = 0; i < pathParts.length - 1; i++) {
                            const part = pathParts[i];
                            let subDir = null;
                            for await (const entry of currentHandle.values()) {
                                if (entry.kind === 'directory' && entry.name === part) {
                                    subDir = entry;
                                    break;
                                }
                            }
                            if (!subDir) {
                                subDir = await currentHandle.getDirectoryHandle(part, { create: true });
                            }
                            currentHandle = subDir;
                        }

                        const fileName = pathParts[pathParts.length - 1];
                        const newFileHandle = await currentHandle.getFileHandle(fileName, { create: true });

                        const writable = await newFileHandle.createWritable();
                        await writable.write(modified);
                        await writable.close();

                        const newFile = { name: fileName, path: filePath, content: modified, handler: newFileHandle };
                        setDirectoryTree((prevTree) => {
                            const addFile = (tree, parts, currentPath = []) => {
                                if (parts.length === 0) return tree;

                                const [currentPart, ...remainingParts] = parts;
                                const newPath = [...currentPath, currentPart];

                                let dir = tree.find((item) => item.name === currentPart && item.children);

                                if (remainingParts.length > 0) {
                                    if (!dir) {
                                        dir = {
                                            name: currentPart,
                                            path: newPath.join('/'),
                                            children: []
                                        };
                                        tree.push(dir);
                                    }
                                    dir.children = addFile(dir.children, remainingParts, newPath);
                                } else {
                                    if (!tree.some((item) => item.name === currentPart)) {
                                        tree.push(newFile);
                                    }
                                }

                                return tree;
                            };

                            return addFile([...prevTree], pathParts);
                        });

                        setChangedFiles((prev) => ({
                            ...prev,
                            [filePath]: {
                                original: modified,
                                modified: modified,
                                language: languageMap[filePath.split('.').pop().toLowerCase()] || 'plaintext'
                            }
                        }));
                    } catch (error) {
                        console.error(`Error creando el nuevo archivo ${filePath}:`, error);
                        alert(`Error al crear el nuevo archivo ${filePath}.`);
                    }
                } else {
                    try {
                        const writable = await fileEntry.handler.createWritable();
                        await writable.write(modified);
                        await writable.close();

                        setChangedFiles((prev) => ({
                            ...prev,
                            [filePath]: {
                                ...prev[filePath],
                                original: modified
                            }
                        }));
                    } catch (error) {
                        console.error(`Error aplicando cambios en ${filePath}:`, error);
                        alert(`Error al aplicar cambios en ${filePath}.`);
                    }
                }
            }

            // After applying all changes, refresh the view
            await handleRefresh();
        } catch (error) {
            console.error('Error aplicando todos los cambios:', error);
            alert('Error al aplicar todos los cambios.');
        }
        setLoading(false);
    }, [changedFiles, findFileByPath, directoryTree, handleRefresh, folderHandle]);

    const loadFilesFromConversation = (conversation) => {
        if (!conversation) {
            setChangedFiles({});
            return;
        }

        const parsedFiles = parseAIMessageForFiles(folderHandle.name, conversation.messages[0].content);

        if (parsedFiles.length > 0) {
            handleFileChanges(parsedFiles);
        }
    };

    const handleStartNewConversation = () => {
        setSelectedConversation(null);
        setSelectedFiles([]);
        clearSelectedSubFolders();
        setSelectedFilePath(null);
        setChangedFiles({});
        handleRefresh();
    };

    const renderDirectoryTreeComponent = () => (
        <DirectoryTree
            files={directoryTree}
            expandedDirectories={expandedDirectories}
            onDirectoryClick={handleDirectoryClick}
            onFileClick={handleFileClick}
            selectedSubFolders={selectedSubFolders}
            toggleSubFolder={toggleSubFolder}
            selectedFiles={selectedFiles}
            toggleFileSelection={toggleFileSelection}
        />
    );

    const toggleFileSelection = (filePath) => {
        setSelectedFiles((prev) => {
            if (prev.includes(filePath)) {
                return prev.filter((path) => path !== filePath);
            } else {
                return [...prev, filePath];
            }
        });
    };

    const deselectFile = (filePath) => {
        setSelectedFiles((prev) => prev.filter((path) => path !== filePath));
    };

    const deselectSubFolder = (folderPath) => {
        if (selectedSubFolders.includes(folderPath)) {
            toggleSubFolder(folderPath);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                applyChanges();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [applyChanges]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing1.current) {
                const newWidth = e.clientX - editorRef.current.getBoundingClientRect().left;
                if (newWidth > 150 && newWidth < window.innerWidth - chatWidth - 150) {
                    setDirectoryWidth(newWidth);
                }
            }
            if (isResizing2.current) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 150 && newWidth < window.innerWidth - directoryWidth - 150) {
                    setChatWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            isResizing1.current = false;
            isResizing2.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [directoryWidth, chatWidth]);

    const startResizing1 = (e) => {
        isResizing1.current = true;
    };

    const startResizing2 = (e) => {
        isResizing2.current = true;
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
                        <Button variant="contained" color="primary" onClick={handleUpdateVectors} disabled={vectorLoading}>
                            {vectorLoading ? <CircularProgress size={24} /> : 'Update Vectors'}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            className="new-conversation-button"
                            onClick={handleStartNewConversation}
                            style={{ margin: '10px 0', marginLeft: '10%'}}
                        >
                            New Conversation
                        </Button>
                        <Button variant="contained" onClick={() => setIsDiffView(!isDiffView)} style={{ margin: '10px 0', marginLeft: '20px' }}>
                            {isDiffView ? 'View Editor' : 'View Changes'}
                        </Button>
                        {isDiffView && (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setCollapseUnchanged(!collapseUnchanged)}
                                    style={{ margin: '10px 0', marginLeft: '20px' }}
                                >
                                    {collapseUnchanged ? 'View Unchanged' : 'Hide Unchanged'}
                                </Button>
                            </>
                        )}
                        <Button variant="contained" onClick={applyChanges} style={{ margin: '10px 0', marginLeft: '20px' }}>
                            Apply
                        </Button>
                        <Button variant="contained" onClick={applyAllChanges} style={{ margin: '10px 0', marginLeft: '20px' }}>
                            Apply All
                        </Button>
                    </>
                )}
            </div>

            <div className="editor" ref={editorRef}>
                {folderHandle && (
                    <>
                        <div className="directory-tree" style={{ width: directoryWidth }}>
                            <Typography sx={{ mb: 1, fontWeight: 600, mt: 2 }}>{folderHandle?.name ? folderHandle.name : ''}</Typography>
                            {renderDirectoryTreeComponent()}
                            <ConversationsList onSelectConversation={handleSelectConversation} onStartNewConversation={handleStartNewConversation} />
                        </div>
                        <div className="resizer resizer1" onMouseDown={startResizing1} ref={resizer1Ref} />
                        <div className="file-content" style={{ width: `calc(100% - ${directoryWidth + chatWidth + 10}px)` }}>
                            {Object.keys(changedFiles).length > 0 && (
                                <ChangedFilesBar changedFiles={changedFiles} selectedFilePath={selectedFilePath} onSelectFilePath={setSelectedFilePath} />
                            )}
                            <FileContent
                                selectedFilePath={selectedFilePath}
                                changedFiles={changedFiles}
                                isDiffView={isDiffView}
                                handleModifiedChange={handleModifiedChange}
                                getLanguageExtension={getLanguageExtension}
                                collapseUnchanged={collapseUnchanged}
                            />
                        </div>
                        <div className="resizer resizer2" onMouseDown={startResizing2} ref={resizer2Ref} />
                        <div className="chat" style={{ width: chatWidth }}>
                            {folderHandle && (
                                <ChatInterface
                                    selectedConversation={selectedConversation}
                                    handleMessageClick={handleMessageClick}
                                    onFileChanges={handleFileChanges}
                                    selectedModel={selectedModel}
                                    setSelectedModel={setSelectedModel}
                                    selectedFiles={selectedFiles}
                                    deselectFile={deselectFile}
                                    deselectSubFolder={deselectSubFolder}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
            <div className="open-folder-footer">
                <Button variant="contained" color="primary" onClick={toggleFooterInfo}>
                    {footerInfoVisible ? 'Hide Info' : 'Show Info'}
                </Button>
                {footerInfoVisible && (
                    <div className="footer-info">
                        {folderHandle ? `Folder: ${folderHandle.name}` : 'No folder selected'} { Object.keys(changedFiles).length ? `| Modified Files: ${Object.keys(changedFiles).length}` : '' } 
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpenFolder;