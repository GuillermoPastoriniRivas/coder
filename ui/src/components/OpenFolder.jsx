import React, { useEffect, useState, useRef, useCallback } from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import '../styles/OpenFolder.css';
import ChatInterface from './Chat/ChatInterface';
import { useDirectory } from '../context/DirectoryContext';
import { Button, Typography, CircularProgress, MenuItem, Select, Checkbox, FormControlLabel } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../api';
import ConversationsList from './Chat/Conversations';
import { parseAIMessageForFiles } from '../utils/functions';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

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
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree, setConversations, selectedSubFolders, toggleSubFolder } = useDirectory(); // Added selectedSubFolders and toggleSubFolder
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDiffView, setIsDiffView] = useState(true);
    const containerRef = useRef(null);
    const diffEditorRef = useRef(null);
    const [changedFiles, setChangedFiles] = useState({});
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [selectedModel, setSelectedModel] = useState('o1-mini'); // State for selected model

    const [selectedFiles, setSelectedFiles] = useState([]); // State for selected files

    const models = ['o1-mini', 'gpt-4o-mini']; // Available models

    const [directoryWidth, setDirectoryWidth] = useState(300); // Initial width in px
    const [chatWidth, setChatWidth] = useState(300); // Initial width in px
    const editorRef = useRef(null);
    const resizer1Ref = useRef(null);
    const resizer2Ref = useRef(null);
    const isResizing1 = useRef(false);
    const isResizing2 = useRef(false);

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
        setLoading(true); // Start loading
        const files = await getFilesFromDirectory(folderHandle);
        setDirectoryTree(files);

        // Refresh conversations
        const response = await api.getConversations(folderHandle.name);
        setConversations(response.data);

        await api.syncDirectory({
            folder: folderHandle.name,
            directoryTree: directoryTree
        });
        setLoading(false); // Stop loading
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
                    modified: file.content, // Inicialmente sin cambios
                    language: lang
                }
            }));

            setSelectedFilePath(file.path);
            setLanguageClassName(`language-${lang}`);
            setIsDiffView(false)
        } catch (error) {
            console.error('Error opening file:', error);
        }
    };

    const ChangedFilesBar = () => (
        <div className="changed-files-bar">
            {Object.keys(changedFiles).map((path) => (
                <Button
                    key={path}
                    onClick={() => setSelectedFilePath(path)}
                    variant={selectedFilePath === path ? 'contained' : 'outlined'}
                    color="secondary"
                    style={{ margin: '0 5px' }}
                >
                    {path.split('/').pop()}
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
        console.log('Selected conversation:', conversation);
        setSelectedConversation(conversation);
        loadFilesFromConversation(conversation);
        setIsDiffView(true)
    };

    const applyChanges = useCallback(async () => {
        if (selectedFilePath && changedFiles[selectedFilePath]) {
            const { modified } = changedFiles[selectedFilePath];
            let fileEntry = findFileByPath(directoryTree, selectedFilePath);

            if (!fileEntry || !fileEntry.handler) {
                try {
                    // Split the path to handle subdirectories
                    const pathParts = selectedFilePath.split('/');
                    let currentHandle = folderHandle;

                    for (let i = 0; i < pathParts.length - 1; i++) {
                        const part = pathParts[i];
                        // Check if the directory exists
                        let subDir = null;
                        for await (const entry of currentHandle.values()) {
                            if (entry.kind === 'directory' && entry.name === part) {
                                subDir = entry;
                                break;
                            }
                        }
                        if (!subDir) {
                            // Create the subdirectory if it does not exist
                            subDir = await currentHandle.getDirectoryHandle(part, { create: true });
                        }
                        currentHandle = subDir;
                    }

                    // Create the file
                    const fileName = pathParts[pathParts.length - 1];
                    const newFileHandle = await currentHandle.getFileHandle(fileName, { create: true });

                    // Write to the file
                    const writable = await newFileHandle.createWritable();
                    await writable.write(modified);
                    await writable.close();

                    // Update the directory tree
                    const newFile = { name: fileName, path: selectedFilePath, content: modified, handler: newFileHandle };
                    setDirectoryTree((prevTree) => {
                        const addFile = (tree) => {
                            if (tree.length === 0 && pathParts.length === 1) {
                                return [...tree, newFile];
                            }
                            const [head, ...rest] = pathParts;
                            const existing = tree.find(item => item.name === head);
                            if (existing) {
                                if (existing.children) {
                                    existing.children = addFile(existing.children);
                                }
                            } else {
                                tree.push({ name: head, path: pathParts.join('/'), children: addFile([]) });
                            }
                            return [...tree];
                        };
                        return addFile([...prevTree]);
                    });

                    // Update changedFiles
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
                    // Escribir en el archivo usando el handler
                    const writable = await fileEntry.handler.createWritable();
                    await writable.write(modified);
                    await writable.close();

                    // Actualizar estados
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

    const loadFilesFromConversation = (conversation) => {
        if (!conversation) {
            // No files associated with this conversation
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
    };

    const renderDirectoryTree = (files) => {
        return (
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.children ? (
                            <span className="folder" onClick={() => handleDirectoryClick(file.name)}>
                                {expandedDirectories[file.name] ? '-' : '+'} <FolderIcon /> {file.name}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedSubFolders.includes(file.path)}
                                            onChange={() => toggleSubFolder(file.path)}
                                            onClick={(e) => e.stopPropagation()} 
                                        />
                                    }
                                    label="Select"
                                    style={{ marginLeft: '10px' }}
                                />
                            </span>
                        ) : (
                            <span className="file" onClick={() => handleFileClick(file)}>
                                <InsertDriveFileIcon /> {file.name}
                                <Checkbox
                                    checked={selectedFiles.includes(file.path)}
                                    onChange={() => toggleFileSelection(file.path)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ marginLeft: '10px' }}
                                />
                            </span>
                        )}
                        {file.children && expandedDirectories[file.name] && renderDirectoryTree(file.children)}
                    </li>
                ))}
            </ul>
        );
    };

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

    // Resizing Handlers
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing1.current) {
                const newWidth = e.clientX - editorRef.current.getBoundingClientRect().left;
                if (newWidth > 150 && newWidth < window.innerWidth - chatWidth - 150) { // Constraints
                    setDirectoryWidth(newWidth);
                }
            }
            if (isResizing2.current) {
                const newWidth = window.innerWidth - e.clientX; // 300 is minimum chat width
                if (newWidth > 150 && newWidth < window.innerWidth - directoryWidth - 150) { // Constraints
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
                        <Button variant="contained" onClick={() => setIsDiffView(!isDiffView)} style={{ margin: '10px 0', marginLeft: 'calc(10% - 8px)' }}>
                            {isDiffView ? 'Normal View' : 'Diff View'}
                        </Button>
                        <Button variant="contained" onClick={applyChanges} style={{ margin: '10px 0', marginLeft: '10px' }}>
                            Apply Changes
                        </Button>
                    </>
                )}
            </div>

            <div className="editor" ref={editorRef}>
                {folderHandle && (
                    <>
                        <div
                            className="directory-tree"
                            style={{ width: directoryWidth }}
                        >
                            <Typography sx={{ mb: 1, fontWeight: 600, mt: 2 }}>
                                {folderHandle?.name ? folderHandle.name : ''}
                            </Typography>
                            {renderDirectoryTree(directoryTree)}
                            <ConversationsList onSelectConversation={handleSelectConversation} onStartNewConversation={handleStartNewConversation} />
                        </div>
                        <div
                            className="resizer resizer1"
                            onMouseDown={startResizing1}
                            ref={resizer1Ref}
                        />
                        <div
                            className="file-content"
                            style={{ width: `calc(100% - ${directoryWidth + chatWidth + 10}px)` }}
                        >
                            {Object.keys(changedFiles).length > 0 && <ChangedFilesBar />}

                            {selectedFilePath ? (
                                isDiffView ? (
                                    <CodeMirrorMerge theme={vscodeDark} orientation="a-b" gutter={true} highlightChanges={true} className="cm-merge">
                                        <Original
                                            value={changedFiles[selectedFilePath]?.original || ''}
                                            extensions={[EditorView.editable.of(false), ...getLanguageExtension(selectedFilePath)]}
                                        />
                                        <Modified
                                            value={changedFiles[selectedFilePath]?.modified || ''}
                                            onChange={handleModifiedChange}
                                            extensions={getLanguageExtension(selectedFilePath)}
                                        />
                                    </CodeMirrorMerge>
                                ) : (
                                    <CodeMirror
                                        value={changedFiles[selectedFilePath]?.modified || ''}
                                        onChange={handleModifiedChange}
                                        theme={vscodeDark}
                                        extensions={getLanguageExtension(selectedFilePath)}
                                        height="600px"
                                    />
                                )
                            ) : (
                                <div className="empty-state">Selecciona un archivo para ver su contenido</div>
                            )}
                        </div>
                        <div
                            className="resizer resizer2"
                            onMouseDown={startResizing2}
                            ref={resizer2Ref}
                        />
                        <div
                            className="chat"
                            style={{ width: chatWidth }}
                        >
                            {folderHandle && (
                                 <ChatInterface
                                    selectedConversation={selectedConversation}
                                    handleMessageClick={handleMessageClick}
                                    onFileChanges={handleFileChanges}
                                    selectedModel={selectedModel}
                                    setSelectedModel={setSelectedModel}
                                    selectedFiles={selectedFiles} // Pass selectedFiles
                                    deselectFile={deselectFile} // Pass deselect function
                                />
                            )}{' '}
                            {/* Pass selected model to ChatInterface */}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OpenFolder;