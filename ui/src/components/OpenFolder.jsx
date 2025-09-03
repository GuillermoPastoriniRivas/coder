import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Box, Button, Typography, CircularProgress, IconButton, Tooltip, TextField } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import WrapTextIcon from '@mui/icons-material/WrapText';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import HtmlIcon from '@mui/icons-material/Html';

import DirectoryTree from './DirectoryTree';
import ChangedFilesBar from './ChangedFilesBar';
import FileContent from './FileContent';
import ConversationsList from './Chat/Conversations';
import ChatInterface from './Chat/ChatInterface';
import api from '../api';
import { parseAIMessageForFiles, showNotification } from '../utils/functions';
import { useDirectory } from '../context/DirectoryContext';
import { useAuth } from '../context/AuthContext';
import '../styles/OpenFolder.css';

import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

const languageExtensions = {
    js: [javascript()], ts: [javascript()],
    jsx: [javascript({ jsx: true })], tsx: [javascript({ jsx: true })],
    css: [css()], py: [python()], json: [json()], md: [markdown()]
};
const languageMap = {
    js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
    css: 'css', py: 'python', json: 'json', md: 'markdown'
};

const MIN_PANEL_WIDTH = 150;
const DEFAULT_DIR_WIDTH = 280;
const DEFAULT_CHAT_WIDTH = 350;
const DEFAULT_TOKEN_LIMIT = 200000;

const OpenFolder = () => {
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree, setConversations, selectedSubFolders, toggleSubFolder, clearSelectedSubFolders } = useDirectory();
    const { saldo, totalProjectTokens, setTotalProjectTokens } = useAuth();
    const [expandedDirectories, setExpandedDirectories] = useState({});
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDiffView, setIsDiffView] = useState(true);
    const [changedFiles, setChangedFiles] = useState({});
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [selectedModel, setSelectedModel] = useState('coder');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [tokenLimit, setTokenLimit] = useState(DEFAULT_TOKEN_LIMIT);
    const [directoryWidth, setDirectoryWidth] = useState(DEFAULT_DIR_WIDTH);
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [collapseUnchanged, setCollapseUnchanged] = useState(false);
    const [footerInfoVisible, setFooterInfoVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lineWrapEnabled, setLineWrapEnabled] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isMarkdownView, setIsMarkdownView] = useState(false);

    const mainContentRef = useRef(null);
    const resizer1Ref = useRef(null);
    const resizer2Ref = useRef(null);
    const isResizing1 = useRef(false);
    const isResizing2 = useRef(false);

    const flattenTree = useCallback((nodes) => {
        let flatList = [];
        nodes.forEach(node => {
            flatList.push(node);
            if (node.children) {
                flatList = flatList.concat(flattenTree(node.children));
            }
        });
        return flatList;
    }, []);

    const flattenedTree = useMemo(() => flattenTree(directoryTree), [directoryTree, flattenTree]);

    const filteredTreeData = useMemo(() => {
        if (!searchTerm.trim()) {
            return directoryTree;
        }
        return flattenedTree.filter(node =>
            !node.children &&
            node.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [searchTerm, directoryTree, flattenedTree]);

    const isSearching = !!searchTerm.trim();

    const findFileByPath = useCallback((tree, targetPath) => {
        for (const item of tree) {
            if (!item.children && item.path === targetPath) return item;
            if (item.children) {
                const found = findFileByPath(item.children, targetPath);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const handleFileChanges = useCallback(
        (files) => {
            const newChangedFiles = {};
            files.forEach(({ path, newContent }) => {
                const fileEntry = findFileByPath(directoryTree, path);
                const originalContent = fileEntry?.content ?? '';
                const extension = path.split('.').pop()?.toLowerCase() || '';
                const lang = languageMap[extension] || 'plaintext';

                newChangedFiles[path] = {
                    original: originalContent,
                    modified: newContent,
                    language: lang,
                };
            });

             setChangedFiles(newChangedFiles);

            if (files.length > 0) {
                setSelectedFilePath(files[0].path);
                setIsDiffView(true);
                setIsMarkdownView(false);
            } else {
                 setSelectedFilePath(null);
                 setIsMarkdownView(false);
            }
        },
        [directoryTree, findFileByPath]
    );

    const getLanguageExtension = (path) => {
        if (!path) return [];
        const extension = path.split('.').pop()?.toLowerCase();
        return languageExtensions[extension] || [];
    };

    const handleModifiedChange = (value) => {
        if (selectedFilePath) {
            setChangedFiles((prev) => {
                 if (!prev[selectedFilePath]) return prev;
                 return {
                     ...prev,
                     [selectedFilePath]: {
                         ...prev[selectedFilePath],
                         modified: value
                     }
                 };
            });
        }
    };

    const getFilesFromDirectory = useCallback(async (currentHandle, basePath = '') => {
        const entries = [];
        const excludedNames = new Set(['.git', '.vscode', '.idea', 'node_modules', 'sources', 'build', 'dist', 'target', 'out', 'venv', 'coverage', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);
        const allowedExtensions = new Set(['md', 'js', 'ts', 'tsx', 'jsx', 'json', 'css', 'scss', 'html', 'py', 'java', 'go', 'rb', 'php', 'swift', 'kt', 'yaml', 'yml', 'xml', 'sh', 'config', 'env', 'txt']);

        for await (const entry of currentHandle.values()) {
            if (entry.name.startsWith('.') || excludedNames.has(entry.name)) {
                 continue;
            }

            const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                const extension = entry.name.split('.').pop()?.toLowerCase();
                 if (extension && allowedExtensions.has(extension)) {
                    try {
                         const file = await entry.getFile();
                         const content = await file.text();
                         entries.push({ name: entry.name, path: entryPath, content, handler: entry, isLeaf: true });
                     } catch (readError) {
                          console.warn(`Could not read file: ${entryPath}`, readError);
                          entries.push({ name: entry.name, path: entryPath, content: `Error reading file: ${readError.message}`, handler: entry, isLeaf: true, error: true });
                     }
                 }
            } else if (entry.kind === 'directory') {
                const children = await getFilesFromDirectory(entry, entryPath);
                if (children.length > 0) {
                    entries.push({ name: entry.name, path: entryPath, children: children, handler: entry, isLeaf: false });
                }
            }
        }
        entries.sort((a, b) => {
             if (a.children && !b.children) return -1;
             if (!a.children && b.children) return 1;
             return a.name.localeCompare(b.name);
        });
        return entries;
    }, []);

    const syncAndFetchConversations = useCallback(async (handle, currentTree) => {
        console.log("Handle", handle);
         if (!handle) return;
        setLoading(true);
         try {
             const syncResponse = await api.syncDirectory({ folder: handle.name, directoryTree: currentTree });
             setTotalProjectTokens(syncResponse.data.totalProjectTokens || 0);

             const response = await api.getConversations(handle.name);
             setConversations(response.data || []);
         } catch (error) {
             console.error("Error syncing/fetching conversations:", error);
             setConversations([]);
             showNotification(`Error syncing/fetching conversations: ${error.message}`, 'error');
         } finally {
             setLoading(false);
         }
     }, [setConversations, setTotalProjectTokens]);

    const openAndProcessFolder = useCallback(async (handle) => {
        if (!handle) return;
        try {
            setLoading(true);
            setSelectedConversation(null);
            setChangedFiles({});
            setSelectedFilePath(null);
            setSelectedFiles([]);
            clearSelectedSubFolders();
            setSearchTerm('');
            setExpandedDirectories({});
            setTotalProjectTokens(0);
            setIsMarkdownView(false);

            setFolderHandle(handle);

            const files = await getFilesFromDirectory(handle);
            setDirectoryTree(files);
            await syncAndFetchConversations(handle, files);

        } catch (error) {
            console.error("Error processing folder:", error);
            showNotification(`Error processing folder ${handle.name}: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [setFolderHandle, getFilesFromDirectory, setDirectoryTree, syncAndFetchConversations, clearSelectedSubFolders, setTotalProjectTokens]);

    const handleOpenFolder = useCallback(async () => {
        try {
            const handle = await window.showDirectoryPicker();
            await openAndProcessFolder(handle);
        } catch (error) {
            console.error("Error opening folder picker:", error);
            if (error.name !== 'AbortError') {
                showNotification(`Error opening folder: ${error.message}`, 'error');
            }
        }
    }, [openAndProcessFolder]);

    const handleDrop = useCallback(async (event) => {
        event.preventDefault();
        setIsDraggingOver(false);

        if (event.dataTransfer.items) {
            for (const item of event.dataTransfer.items) {
                if (typeof item.getAsFileSystemHandle === 'function') {
                    try {
                        const handle = await item.getAsFileSystemHandle();
                        if (handle.kind === 'directory') {
                            console.log('Directory dropped:', handle.name);
                            await openAndProcessFolder(handle);
                            break;
                        } else {
                            showNotification('Please drop a folder, not a file.', 'warning');
                        }
                    } catch (err) {
                        console.error('Error getting file system handle:', err);
                        showNotification(`Error accessing dropped item: ${err.message}`, 'error');
                    }
                } else {
                     showNotification('Drag and drop is not fully supported in this browser version for folders.', 'warning');
                     break;
                }
            }
        } else {
            console.warn('No items found in dataTransfer.');
        }
    }, [openAndProcessFolder]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        if (event.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
         if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDraggingOver(false);
         }
    }, []);

     const simplifyTree = (nodes) => {
         return nodes.map(node => {
             const simpleNode = { name: node.name, path: node.path };
             if (node.children) {
                 simpleNode.children = simplifyTree(node.children);
             }
             return simpleNode;
         });
     };

    const handleRefresh = useCallback(async () => {
        if (!folderHandle) return;
        setLoading(true);
        try {
            const files = await getFilesFromDirectory(folderHandle);
            setDirectoryTree(files);
            await syncAndFetchConversations(folderHandle, files);
            setSearchTerm('');

             if (selectedFilePath && changedFiles[selectedFilePath]) {
                 const updatedFileEntry = findFileByPath(files, selectedFilePath);
                 if (updatedFileEntry && updatedFileEntry.content !== changedFiles[selectedFilePath].original) {
                      setChangedFiles(prev => ({
                          ...prev,
                          [selectedFilePath]: {
                              ...prev[selectedFilePath],
                              original: updatedFileEntry.content,
                          }
                      }));
                      showNotification(`Content for ${selectedFilePath} refreshed.`, 'info');
                 }
             } else {
                 setSelectedFilePath(null);
                 setChangedFiles({});
             }
            setIsMarkdownView(false);

        } catch (error) {
            console.error("Error refreshing:", error);
            showNotification(`Error refreshing: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [folderHandle, selectedFilePath, changedFiles, findFileByPath, getFilesFromDirectory, setDirectoryTree, syncAndFetchConversations]);

    const handleDirectoryClick = (path) => {
        if (isSearching) return;
        setExpandedDirectories((prev) => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const handleFileClick = (file) => {
        if (changedFiles[file.path]) {
             setSelectedFilePath(file.path);
             setIsMarkdownView(false);
        } else {
             setChangedFiles({
                 [file.path]: {
                     original: file.content,
                     modified: file.content,
                     language: languageMap[file.name.split('.').pop()?.toLowerCase()] || 'plaintext',
                 }
             });
             setSelectedFilePath(file.path);
             setIsDiffView(false);
             setIsMarkdownView(false);
        }
        setSearchTerm('');
     };

    const handleSelectConversation = (conversation) => {
        console.log(conversation)
         setSelectedConversation(conversation);
         if (conversation.messages && conversation.messages.length > 0) {
             const messagesToDisplay = conversation.userMessages || conversation.messages;
             const lastMessage = messagesToDisplay[messagesToDisplay.length - 1];
             if (lastMessage.role === 'assistant' || lastMessage.role === 'default' ) {
                 const parsedFiles = parseAIMessageForFiles(folderHandle?.name || '', lastMessage.content);
                 if (parsedFiles.length > 0) {
                      handleFileChanges(parsedFiles);
                      setIsDiffView(true);
                      setLineWrapEnabled(false);
                      setIsMarkdownView(false);
                      return;
                 }
             }
         }
         setChangedFiles({});
         setSelectedFilePath(null);
         setIsMarkdownView(false);
         
         if (conversation.aiModel === 'qa') {
            setIsDiffView(false);
            setLineWrapEnabled(true);
         } else {
            setIsDiffView(true);
            setLineWrapEnabled(false);
         }
     };

    const handleStartNewConversation = () => {
        setSelectedConversation(null);
        setSelectedFiles([]);
        clearSelectedSubFolders();
        setSelectedFilePath(null);
        setChangedFiles({});
        setIsDiffView(true);
        setIsMarkdownView(false);
        setSearchTerm('');
    };

     const toggleFileSelection = (filePath) => {
        setSelectedFiles((prev) =>
             prev.includes(filePath)
                 ? prev.filter((path) => path !== filePath)
                 : [...prev, filePath]
         );
     };
     const deselectFile = (filePath) => {
         setSelectedFiles((prev) => prev.filter((path) => path !== filePath));
     };
     const deselectSubFolder = (folderPath) => {
          toggleSubFolder(folderPath);
     };

    const getFileHandleRecursive = useCallback(async (dirHandle, pathParts, create = false) => {
         if (pathParts.length === 1) {
             return dirHandle.getFileHandle(pathParts[0], { create });
         }
         const dirName = pathParts[0];
         const subDirHandle = await dirHandle.getDirectoryHandle(dirName, { create });
         return getFileHandleRecursive(subDirHandle, pathParts.slice(1), create);
     }, []);

    const applyChanges = useCallback(async () => {
        if (!selectedFilePath || !changedFiles[selectedFilePath] || !folderHandle) return;

        const fileData = changedFiles[selectedFilePath];
        if (fileData.original === fileData.modified) {
            showNotification("No changes to apply for this file.", "info");
            return;
        }

        setSaving(true);
        try {
             let fileEntry = findFileByPath(directoryTree, selectedFilePath);
             let targetHandle = fileEntry?.handler;

             if (!targetHandle) {
                 console.log(`Attempting to get/create handle for: ${selectedFilePath}`);
                 try {
                    targetHandle = await getFileHandleRecursive(folderHandle, selectedFilePath.split('/'), true);
                 } catch (handleError) {
                      console.error(`Error getting/creating file handle for ${selectedFilePath}:`, handleError);
                      showNotification(`Failed to get or create file handle for: ${selectedFilePath}. Error: ${handleError.message}`, 'error');
                      setSaving(false);
                      return;
                 }
             }

            const writable = await targetHandle.createWritable();
            await writable.write(fileData.modified);
            await writable.close();
            console.log(`Changes applied to: ${selectedFilePath}`);

            setChangedFiles((prev) => ({
                 ...prev,
                 [selectedFilePath]: {
                     ...prev[selectedFilePath],
                     original: fileData.modified,
                 }
             }));

            setDirectoryTree(prevTree => updateFileContentInTree(prevTree, selectedFilePath, fileData.modified));

            showNotification(`Changes saved to ${selectedFilePath}`, 'success');

            await handleRefresh();

         } catch (error) {
             console.error(`Error applying changes to ${selectedFilePath}:`, error);
             showNotification(`Error applying changes to ${selectedFilePath}: ${error.message}`, 'error');
         } finally {
             setSaving(false);
         }
    }, [selectedFilePath, changedFiles, folderHandle, directoryTree, findFileByPath, setDirectoryTree, handleRefresh, getFileHandleRecursive]);

    const applyAllChanges = useCallback(async () => {
        if (Object.keys(changedFiles).length === 0 || !folderHandle) return;

        setSaving(true);
        const errors = [];
        const appliedFiles = [];

        for (const filePath of Object.keys(changedFiles)) {
            const fileData = changedFiles[filePath];

            if (fileData.original === fileData.modified) {
                 console.log(`Skipping ${filePath} - no changes.`);
                 setChangedFiles(prev => {
                     const newState = { ...prev };
                     delete newState[filePath];
                     return newState;
                 });
                continue;
            }

            try {
                 let fileEntry = findFileByPath(directoryTree, filePath);
                 let targetHandle = fileEntry?.handler;

                 if (!targetHandle) {
                     console.log(`Attempting to get/create handle for: ${filePath}`);
                     try {
                          targetHandle = await getFileHandleRecursive(folderHandle, filePath.split('/'), true);
                     } catch (handleError) {
                          console.error(`Error getting/creating file handle for ${filePath}:`, handleError);
                          errors.push(`Failed to get/create handle for ${filePath}: ${handleError.message}`);
                          continue;
                     }
                 }

                const writable = await targetHandle.createWritable();
                await writable.write(fileData.modified);
                await writable.close();
                appliedFiles.push(filePath);
                 console.log(`Changes applied to: ${filePath}`);

                 setChangedFiles((prev) => ({
                     ...prev,
                     [filePath]: {
                         ...prev[filePath],
                         original: fileData.modified,
                     }
                 }));
                 setDirectoryTree(prevTree => updateFileContentInTree(prevTree, filePath, fileData.modified));

            } catch (error) {
                console.error(`Error applying changes to ${filePath}:`, error);
                errors.push(`Error applying changes to ${filePath}: ${error.message}`);
            }
        }

         if (errors.length > 0) {
            showNotification(`Applied changes to ${appliedFiles.length} files.Encountered errors:- ${errors.join(' - ')}`, 'warning');
         } else if (appliedFiles.length > 0) {
            showNotification(`Successfully applied changes to ${appliedFiles.length} files.`, 'success');
         } else {
            showNotification("No changes were applied.", "info");
         }

         await handleRefresh();

         setSaving(false);

    }, [changedFiles, folderHandle, directoryTree, findFileByPath, setDirectoryTree, handleRefresh, getFileHandleRecursive]);

     const updateFileContentInTree = (tree, targetPath, newContent) => {
         return tree.map(node => {
             if (node.path === targetPath && node.isLeaf) {
                 return { ...node, content: newContent };
             } else if (node.children && targetPath.startsWith(node.path + '/')) {
                 return { ...node, children: updateFileContentInTree(node.children, targetPath, newContent) };
             }
             return node;
         });
     };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                applyChanges();
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                applyAllChanges();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [applyChanges, applyAllChanges]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!mainContentRef.current) return;
            const mainRect = mainContentRef.current.getBoundingClientRect();

            if (isResizing1.current) {
                const newWidth = e.clientX - mainRect.left;
                if (newWidth > MIN_PANEL_WIDTH && mainRect.width - newWidth - chatWidth > MIN_PANEL_WIDTH) {
                    setDirectoryWidth(newWidth);
                }
            } else if (isResizing2.current) {
                const newWidth = mainRect.right - e.clientX;
                if (newWidth > MIN_PANEL_WIDTH && mainRect.width - newWidth - directoryWidth > MIN_PANEL_WIDTH) {
                    setChatWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            isResizing1.current = false;
            isResizing2.current = false;
             document.body.style.cursor = 'default';
             document.body.style.userSelect = 'auto';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [directoryWidth, chatWidth]);

    const startResizing = (resizer) => (e) => {
        e.preventDefault();
         if (resizer === 1) {
            isResizing1.current = true;
        } else if (resizer === 2) {
            isResizing2.current = true;
        }
         document.body.style.cursor = 'col-resize';
         document.body.style.userSelect = 'none';
    };

    const toggleFooterInfo = () => {
        setFooterInfoVisible(prev => !prev);
    };

    const formatTokenCount = (count) => {
        if (count === null || count === undefined || isNaN(count)) {
            return 'N/A';
        }
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    };

    const isMarkdownFile = selectedFilePath?.toLowerCase().endsWith('.md');
    
    return (
        <Box
            className="open-folder-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                border: isDraggingOver ? '3px dashed var(--color-primary-action)' : 'none',
                transition: 'border 0.2s ease-in-out',
                boxSizing: 'border-box',
            }}
        >
            <Box className="actions-bar">
                {!folderHandle ? (
                    <>
                        <Button variant="contained" color="primary" onClick={handleOpenFolder} startIcon={<FolderOpenIcon />} size="medium">
                            Open Folder
                        </Button>
                        <Typography variant="body2" className="alert-typography" sx={{ ml: 1 }}>
                            Select a project folder to begin or drag & drop it here
                        </Typography>
                    </>
                ) : (
                    <>
                         <Tooltip title="Open a different folder">
                             <Button variant="outlined" color="secondary" onClick={handleOpenFolder} startIcon={<FolderOpenIcon />} size="small">
                                {folderHandle.name}
                             </Button>
                         </Tooltip>
                         <Tooltip title="Refresh directory tree and conversations (Ctrl+R)">
                             <IconButton onClick={handleRefresh} disabled={loading} size="small" color="secondary">
                                 {loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                             </IconButton>
                         </Tooltip>
                         <Tooltip title="Start a new chat conversation">
                             <Button variant="contained" color="secondary" onClick={handleStartNewConversation} startIcon={<AddCommentIcon />} disabled={loading || saving} size="small">
                                New Chat
                             </Button>
                         </Tooltip>

                         {Object.keys(changedFiles).length > 0 && (
                             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginLeft: '20px' }}>
                                  <Tooltip title="Toggle between Diff View and Editor View">
                                     <Button
                                         variant="outlined"
                                         color="secondary"
                                         onClick={() => {
                                            setIsDiffView(!isDiffView);
                                            setIsMarkdownView(false); // Reset Markdown view when toggling Diff/Editor
                                         }}
                                         startIcon={isDiffView ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                         size="small"
                                     >
                                         {isDiffView ? 'Editor' : 'Diff'}
                                     </Button>
                                 </Tooltip>
                                 {isDiffView && (
                                      <Tooltip title={collapseUnchanged ? "Show Unchanged Lines" : "Hide Unchanged Lines"}>
                                         <Button
                                             variant="outlined"
                                             color="secondary"
                                             onClick={() => setCollapseUnchanged(!collapseUnchanged)}
                                             startIcon={collapseUnchanged ? <ExpandMoreIcon/> : <ExpandLessIcon/>}
                                             size="small"
                                         >
                                             {collapseUnchanged ? 'Expand' : 'Collapse'}
                                         </Button>
                                      </Tooltip>
                                 )}
                                 <Tooltip title={lineWrapEnabled ? "Disable Line Wrapping" : "Enable Line Wrapping"}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => setLineWrapEnabled(!lineWrapEnabled)}
                                        startIcon={<WrapTextIcon />}
                                        size="small"
                                    >
                                        {lineWrapEnabled ? 'No Wrap' : 'Wrap'}
                                    </Button>
                                 </Tooltip>
                                 <Tooltip title="Save changes for the selected file (Ctrl+S)">
                                     <span>
                                         <Button
                                             variant="contained"
                                             color="primary"
                                             onClick={applyChanges}
                                             disabled={saving || !selectedFilePath || changedFiles[selectedFilePath]?.original === changedFiles[selectedFilePath]?.modified}
                                             startIcon={saving ? <CircularProgress size={16} color="inherit"/> :<SaveIcon fontSize='small'/>}
                                             size="small"
                                         >
                                             Apply
                                         </Button>
                                     </span>
                                 </Tooltip>
                                 <Tooltip title="Save changes for all modified files (Ctrl+Shift+S)">
                                     <span>
                                         <Button
                                             variant="contained"
                                             color="primary"
                                             onClick={applyAllChanges}
                                             disabled={saving || Object.values(changedFiles).every(f => f.original === f.modified)}
                                             startIcon={saving ? <CircularProgress size={16} color="inherit"/> :<SaveAltIcon fontSize='small'/>}
                                             size="small"
                                         >
                                             Apply All
                                         </Button>
                                     </span>
                                 </Tooltip>
                             </Box>
                         )}
                         {isMarkdownFile && !isDiffView && selectedFilePath && (
                             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginLeft: '20px' }}>
                                 <Tooltip title={isMarkdownView ? "View as Code" : "View as HTML"}>
                                     <Button
                                         variant="outlined"
                                         color="secondary"
                                         onClick={() => setIsMarkdownView(!isMarkdownView)}
                                         startIcon={<HtmlIcon />}
                                         size="small"
                                     >
                                         {isMarkdownView ? 'Code' : 'HTML'}
                                     </Button>
                                 </Tooltip>
                             </Box>
                         )}
                    </>
                )}
            </Box>

            <Box className="main-content-area" ref={mainContentRef}>
                {folderHandle && (
                    <>
                        <Box className="directory-tree-panel" style={{ width: directoryWidth }}>
                             <Box sx={{ px: 1.5, pt: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                 <TextField
                                     fullWidth
                                     size="small"
                                     variant="outlined"
                                     placeholder="Search files..."
                                     value={searchTerm}
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                     InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" fontSize="small" />
                                            </InputAdornment>
                                        ),
                                        sx: { fontSize: '0.875rem', bgcolor: 'background.default' }
                                    }}
                                 />
                             </Box>
                            <Box className="directory-tree-content">
                                <DirectoryTree
                                    files={filteredTreeData}
                                    isSearching={isSearching}
                                    expandedDirectories={expandedDirectories}
                                    onDirectoryClick={handleDirectoryClick}
                                    onFileClick={handleFileClick}
                                    selectedSubFolders={selectedSubFolders}
                                    toggleSubFolder={toggleSubFolder}
                                    selectedFiles={selectedFiles}
                                    toggleFileSelection={toggleFileSelection}
                                />
                            </Box>
                             {!isSearching && (
                                <Box className="conversations-section">
                                    <Typography className="conversations-header" variant="subtitle2">Conversations</Typography>
                                    <Box className="conversations-list-container">
                                        <ConversationsList
                                            onSelectConversation={handleSelectConversation}
                                        />
                                    </Box>
                                </Box>
                             )}
                        </Box>

                        <Box className="resizer" onMouseDown={startResizing(1)} ref={resizer1Ref} />

                        <Box className="editor-panel" style={{ width: `calc(100% - ${directoryWidth}px - ${chatWidth}px - 10px)` }}>
                            {Object.keys(changedFiles).length > 0 && (
                                <ChangedFilesBar
                                    changedFiles={changedFiles}
                                    selectedFilePath={selectedFilePath}
                                    onSelectFilePath={setSelectedFilePath}
                                />
                            )}
                            <Box className="file-content-area">
                                <FileContent
                                    selectedFilePath={selectedFilePath}
                                    changedFiles={changedFiles}
                                    isDiffView={isDiffView}
                                    handleModifiedChange={handleModifiedChange}
                                    getLanguageExtension={getLanguageExtension}
                                    collapseUnchanged={collapseUnchanged}
                                    lineWrapEnabled={lineWrapEnabled}
                                    isMarkdownView={isMarkdownView}
                                />
                             </Box>
                        </Box>

                        <Box className="resizer" onMouseDown={startResizing(2)} ref={resizer2Ref} />

                        <Box className="chat-panel" style={{ width: chatWidth }}>
                            <ChatInterface
                                selectedConversation={selectedConversation}
                                onFileChanges={handleFileChanges}
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                selectedFiles={selectedFiles}
                                selectedSubFolders={selectedSubFolders}
                                deselectFile={deselectFile}
                                deselectSubFolder={deselectSubFolder}
                                onRefreshRequest={handleRefresh}
                                tokenLimit={tokenLimit}
                                setTokenLimit={setTokenLimit}
                                setIsDiffView={setIsDiffView}
                            />
                        </Box>
                    </>
                )}
                {!folderHandle && !loading && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, color: 'text.secondary', textAlign: 'center', p: 2 }}>
                         <Typography>{isDraggingOver ? 'Drop folder to open' : 'Open a folder to start working or drag & drop it here.'}</Typography>
                     </Box>
                )}
                 {loading && !folderHandle && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                         <CircularProgress />
                     </Box>
                 )}
            </Box>

            <Box component="footer" className="app-footer">
                 <Box className="footer-info-section">
                    <Tooltip title={footerInfoVisible ? "Hide Status Bar Info" : "Show Status Bar Info"}>
                        <IconButton size="small" onClick={toggleFooterInfo} sx={{color: 'text.secondary'}}>
                           {footerInfoVisible ? <VisibilityOffIcon fontSize='inherit'/> : <VisibilityIcon fontSize='inherit' />}
                        </IconButton>
                    </Tooltip>
                     {footerInfoVisible && folderHandle && (
                        <>
                            <Tooltip title="Current Project Folder">
                                <Typography variant="caption" className="footer-status">
                                     <FolderOpenIcon fontSize="inherit" sx={{ mr: 0.5 }}/> {folderHandle.name}
                                </Typography>
                            </Tooltip>
                             {Object.keys(changedFiles).length > 0 && (
                                <Tooltip title="Number of files with proposed changes">
                                     <Typography variant="caption" className="footer-status">
                                         <SaveAltIcon fontSize="inherit" sx={{ mr: 0.5, color: 'warning.main' }}/> {Object.keys(changedFiles).length} Modified
                                     </Typography>
                                 </Tooltip>
                            )}
                             <Tooltip title={`Total Project Tokens: ${totalProjectTokens?.toLocaleString()}`}>
                                <Typography variant="caption" className="footer-status">
                                     <DataUsageIcon fontSize="inherit" sx={{ mr: 0.5 }}/> {formatTokenCount(totalProjectTokens)} Tokens
                                </Typography>
                             </Tooltip>
                             <Tooltip title={`Remaining Credits: ${saldo?.toFixed(2)}`}>
                                <Typography variant="caption" className="footer-status" sx={{ color: saldo < 5 ? 'warning.main' : 'text.secondary' }}>
                                    ${saldo?.toFixed(2)} Credits
                                </Typography>
                             </Tooltip>
                        </>
                     )}
                      {footerInfoVisible && !folderHandle && (
                         <Typography variant="caption">No folder open</Typography>
                      )}
                 </Box>
                 <Typography variant="caption"> Boostware v1.0 </Typography>
             </Box>
        </Box>
    );
};

export default OpenFolder;