import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Box, Button, Typography, CircularProgress, IconButton, Tooltip, TextField } from '@mui/material'; // Added TextField
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Icon for Open Folder
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for View Changes
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'; // Icon for View Editor
import SaveIcon from '@mui/icons-material/Save'; // Icon for Apply
import SaveAltIcon from '@mui/icons-material/SaveAlt'; // Icon for Apply All
import AddCommentIcon from '@mui/icons-material/AddComment'; // Icon for New Conversation
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // For collapse/expand buttons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info'; // For footer info
import SearchIcon from '@mui/icons-material/Search'; // Icon for search input
import InputAdornment from '@mui/material/InputAdornment'; // For search icon adornment


import DirectoryTree from './DirectoryTree';
import ChangedFilesBar from './ChangedFilesBar';
import FileContent from './FileContent';
import ConversationsList from './Chat/Conversations';
import ChatInterface from './Chat/ChatInterface';
import api from '../api';
import { parseAIMessageForFiles, showNotification } from '../utils/functions';
import { useDirectory } from '../context/DirectoryContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth for saldo check
import '../styles/OpenFolder.css'; // Ensure OpenFolder specific styles are imported

// Language extensions for CodeMirror (Keep as is)
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
const languageMap = { // Keep for mapping extensions to languages if needed by other parts
    js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
    css: 'css', py: 'python', json: 'json', md: 'markdown'
};

const MIN_PANEL_WIDTH = 150; // Minimum width for resizable panels
const DEFAULT_DIR_WIDTH = 280;
const DEFAULT_CHAT_WIDTH = 350;

const OpenFolder = () => {
    // State Variables
    const { folderHandle, setFolderHandle, directoryTree, setDirectoryTree, setConversations, selectedSubFolders, toggleSubFolder, clearSelectedSubFolders } = useDirectory();
    const { saldo } = useAuth(); // Get saldo
    const [expandedDirectories, setExpandedDirectories] = useState({});
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false); // For general loading like refresh
    const [saving, setSaving] = useState(false); // Specific state for Apply/Apply All actions
    const [isDiffView, setIsDiffView] = useState(true);
    const [changedFiles, setChangedFiles] = useState({}); // { [path]: { original, modified, language } }
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [selectedModel, setSelectedModel] = useState('coder');
    const [selectedFiles, setSelectedFiles] = useState([]); // Files selected for context
    const [directoryWidth, setDirectoryWidth] = useState(DEFAULT_DIR_WIDTH);
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [collapseUnchanged, setCollapseUnchanged] = useState(false);
    const [footerInfoVisible, setFooterInfoVisible] = useState(true); // Moved footer state here
    const [searchTerm, setSearchTerm] = useState(''); // State for directory search

    // Refs
    const mainContentRef = useRef(null); // Ref for the main content area for resizing calculations
    const resizer1Ref = useRef(null); // Dir Tree / Editor Resizer
    const resizer2Ref = useRef(null); // Editor / Chat Resizer
    const isResizing1 = useRef(false);
    const isResizing2 = useRef(false);

    // --- Callbacks & Effects ---

    // Flatten directory tree for searching
    const flattenTree = useCallback((nodes) => {
        let flatList = [];
        nodes.forEach(node => {
            flatList.push(node); // Add the node itself
            if (node.children) {
                flatList = flatList.concat(flattenTree(node.children)); // Recursively add children
            }
        });
        return flatList;
    }, []);

    // Memoize the flattened tree
    const flattenedTree = useMemo(() => flattenTree(directoryTree), [directoryTree, flattenTree]);

    // Filter the directory tree based on search term
    const filteredTreeData = useMemo(() => {
        if (!searchTerm.trim()) {
            return directoryTree; // Return original hierarchical tree if no search term
        }
        // Filter the flat list for *files* matching the search term (case-insensitive)
        return flattenedTree.filter(node =>
            !node.children && // Only include files
            node.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [searchTerm, directoryTree, flattenedTree]);

    // Determine if currently searching
    const isSearching = !!searchTerm.trim();

    // Find file in the tree structure
    const findFileByPath = useCallback((tree, targetPath) => {
        for (const item of tree) {
            if (!item.children && item.path === targetPath) return item; // Found file
            if (item.children) {
                const found = findFileByPath(item.children, targetPath);
                if (found) return found; // Found in subdirectory
            }
        }
        return null; // Not found
    }, []); // Empty dependency array, this function is pure based on its arguments

    // Update changedFiles state based on AI response
    const handleFileChanges = useCallback(
        (files) => {
            const newChangedFiles = {};
            files.forEach(({ path, newContent }) => {
                // Attempt to find the existing file to get original content
                const fileEntry = findFileByPath(directoryTree, path);
                const originalContent = fileEntry?.content ?? ''; // Use existing content or empty string if new file
                const extension = path.split('.').pop()?.toLowerCase() || '';
                const lang = languageMap[extension] || 'plaintext'; // Fallback language

                newChangedFiles[path] = {
                    original: originalContent,
                    modified: newContent,
                    language: lang, // Keep track of language if needed
                };
            });

             setChangedFiles(newChangedFiles);

            // Automatically select the first changed file to show in the editor
            if (files.length > 0) {
                setSelectedFilePath(files[0].path);
                setIsDiffView(true); // Default to diff view when new changes arrive
            } else {
                 setSelectedFilePath(null); // Clear selection if no files changed
            }
        },
        [directoryTree, findFileByPath] // Dependencies: directoryTree and findFileByPath
    );


    // Get language extension for CodeMirror
    const getLanguageExtension = (path) => {
        if (!path) return [];
        const extension = path.split('.').pop()?.toLowerCase();
        return languageExtensions[extension] || [];
    };

    // Update modified content in state when user types in editor
    const handleModifiedChange = (value) => {
        if (selectedFilePath) {
            setChangedFiles((prev) => {
                 // Ensure the file path exists in the state before updating
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

    // Open Folder Dialog
    const handleOpenFolder = async () => {
        try {
            const handle = await window.showDirectoryPicker();
            setFolderHandle(handle);
            setLoading(true); // Show loading while reading files
            setSelectedConversation(null); // Reset conversation
            setChangedFiles({}); // Clear changes
            setSelectedFilePath(null); // Clear selected file
            setSelectedFiles([]); // Clear context files
            clearSelectedSubFolders(); // Clear context folders
            setSearchTerm(''); // Clear search term
            const files = await getFilesFromDirectory(handle);
            setDirectoryTree(files);
            await syncAndFetchConversations(handle, files); // Sync and fetch conversations after opening
        } catch (error) {
            console.error("Error opening folder:", error);
            // Handle error (e.g., user cancellation) gracefully
        } finally {
            setLoading(false);
        }
    };

     // Recursive function to read directory contents
    const getFilesFromDirectory = async (currentHandle, basePath = '') => {
        const entries = [];
        // Standard web API exclusion lists + common generated/lock files
        const excludedNames = new Set(['.git', '.vscode', '.idea', 'node_modules', 'sources', 'build', 'dist', 'target', 'out', 'coverage', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);
        const allowedExtensions = new Set(['md', 'js', 'ts', 'tsx', 'jsx', 'json', 'css', 'scss', 'html', 'py', 'java', 'go', 'rb', 'php', 'swift', 'kt', 'yaml', 'yml', 'xml', 'sh', 'config', 'env']); // Add more as needed

        for await (const entry of currentHandle.values()) {
             // Skip excluded names and hidden files/folders (starting with '.')
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
                          // Optionally add a placeholder for unreadable files
                          entries.push({ name: entry.name, path: entryPath, content: `Error reading file: ${readError.message}`, handler: entry, isLeaf: true, error: true });
                     }
                 }
            } else if (entry.kind === 'directory') {
                // Recursively get children, pass the directory handle itself
                const children = await getFilesFromDirectory(entry, entryPath);
                // Only add directory if it contains allowed files/subdirs eventually
                if (children.length > 0) {
                    entries.push({ name: entry.name, path: entryPath, children: children, handler: entry, isLeaf: false });
                }
            }
        }
        // Sort entries: folders first, then files, alphabetically
        entries.sort((a, b) => {
             if (a.children && !b.children) return -1; // a is folder, b is file
             if (!a.children && b.children) return 1;  // a is file, b is folder
             return a.name.localeCompare(b.name);       // Both are same type, sort by name
        });
        return entries;
    };

    // Sync directory structure with backend and fetch conversations
    const syncAndFetchConversations = async (handle, currentTree) => {
        console.log("Handle", handle);
         if (!handle) return;
        setLoading(true);
         try {
             // Sync first (pass simplified tree structure if needed by backend)
            //  const simpleTree = simplifyTree(currentTree); // Create a simplified version if full content isn't needed
             await api.syncDirectory({ folder: handle.name, directoryTree: currentTree });

             // Then fetch conversations
             const response = await api.getConversations(handle.name);
             setConversations(response.data || []); // Ensure it's an array
         } catch (error) {
             console.error("Error syncing/fetching conversations:", error);
             setConversations([]); // Reset on error
         } finally {
             setLoading(false);
         }
     };

     // Helper to simplify tree if backend doesn't need full content
     const simplifyTree = (nodes) => {
         return nodes.map(node => {
             const simpleNode = { name: node.name, path: node.path };
             if (node.children) {
                 simpleNode.children = simplifyTree(node.children);
             }
             return simpleNode;
         });
     };


    // Refresh: Re-read directory, sync, fetch conversations
    const handleRefresh = async () => {
        if (!folderHandle) return;
        setLoading(true);
        try {
            const files = await getFilesFromDirectory(folderHandle);
            setDirectoryTree(files);
            await syncAndFetchConversations(folderHandle, files);
            setSearchTerm(''); // Clear search on refresh

             // Preserve current diff if a file is selected
             if (selectedFilePath && changedFiles[selectedFilePath]) {
                 // Re-fetch original content for the selected file in case it changed externally
                 const updatedFileEntry = findFileByPath(files, selectedFilePath);
                 if (updatedFileEntry && updatedFileEntry.content !== changedFiles[selectedFilePath].original) {
                      setChangedFiles(prev => ({
                          ...prev,
                          [selectedFilePath]: {
                              ...prev[selectedFilePath],
                              original: updatedFileEntry.content,
                          }
                      }));
                 }
             } else {
                 // If no file selected or no changes, clear selection/diff
                 setSelectedFilePath(null);
                 setChangedFiles({});
             }

        } catch (error) {
            console.error("Error refreshing:", error);
        } finally {
            setLoading(false);
        }
    };

    // Expand/Collapse Directory
    const handleDirectoryClick = (path) => { // Use path as unique key
        // Don't expand/collapse when searching
        if (isSearching) return;
        setExpandedDirectories((prev) => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    // Click on a file in the tree or search results
    const handleFileClick = (file) => {
        // If this file is already part of the current diff, just select it
        if (changedFiles[file.path]) {
             setSelectedFilePath(file.path);
             // Optionally switch to diff view or keep current view
             // setIsDiffView(true);
        } else {
             // If not in diff, show its content in the editor (non-diff view)
             setChangedFiles({
                 [file.path]: {
                     original: file.content,
                     modified: file.content, // Start with original content
                     language: languageMap[file.name.split('.').pop()?.toLowerCase()] || 'plaintext',
                 }
             });
             setSelectedFilePath(file.path);
             setIsDiffView(false); // Show single editor view for unmodified file
        }
        setSearchTerm(''); // Clear search term after selecting a file
     };

    // Select a conversation from the list
    const handleSelectConversation = (conversation) => {
         setSelectedConversation(conversation);
         if (conversation.messages && conversation.messages.length > 0) {
             // Check the last assistant message for file changes
             const lastMessage = conversation.messages[conversation.messages.length - 1];
             if (lastMessage.role === 'assistant' || lastMessage.role === 'default' ) { // Assuming 'default' can contain file changes too
                 const parsedFiles = parseAIMessageForFiles(folderHandle?.name || '', lastMessage.content);
                 if (parsedFiles.length > 0) {
                      handleFileChanges(parsedFiles); // Load changes into diff view
                      setIsDiffView(true);
                      return; // Stop here if changes loaded
                 }
             }
         }
         // If no changes found in last message, clear diff view
         setChangedFiles({});
         setSelectedFilePath(null);
         setIsDiffView(true); // Stay in diff view mode but show empty state
     };

    // Start a new chat session
    const handleStartNewConversation = () => {
        setSelectedConversation(null);
        setSelectedFiles([]);
        clearSelectedSubFolders();
        setSelectedFilePath(null);
        setChangedFiles({});
        setIsDiffView(true); // Reset to diff view (will show empty state)
        setSearchTerm(''); // Clear search term
        // Optionally refresh directory/conversations if needed
        // handleRefresh();
    };

    // Toggle selection of files/folders for chat context
     const toggleFileSelection = (filePath) => {
        setSelectedFiles((prev) =>
             prev.includes(filePath)
                 ? prev.filter((path) => path !== filePath)
                 : [...prev, filePath]
         );
     };
     // Deselect is handled by toggleFileSelection, direct deselect functions might be redundant
     const deselectFile = (filePath) => {
         setSelectedFiles((prev) => prev.filter((path) => path !== filePath));
     };
     const deselectSubFolder = (folderPath) => {
          toggleSubFolder(folderPath); // Use the existing toggle from context
     };

    // Apply changes for the *currently selected* file
    const applyChanges = useCallback(async () => {
        if (!selectedFilePath || !changedFiles[selectedFilePath] || !folderHandle) return;

        const fileData = changedFiles[selectedFilePath];
        if (fileData.original === fileData.modified) {
            console.log("No changes to apply for:", selectedFilePath);
            return; // Skip if no changes
        }

        setSaving(true);
        try {
             // Find the file entry in the current tree (might be slightly outdated, but usually fine)
             let fileEntry = findFileByPath(directoryTree, selectedFilePath);
             let targetHandle = fileEntry?.handler;

             // If handler doesn't exist (new file or error), try to get/create it
             if (!targetHandle) {
                 console.log(`Attempting to get/create handle for: ${selectedFilePath}`);
                 try {
                    targetHandle = await getFileHandleRecursive(folderHandle, selectedFilePath.split('/'), true);
                 } catch (handleError) {
                      console.error(`Error getting/creating file handle for ${selectedFilePath}:`, handleError);
                      showNotification(`Failed to get or create file handle for: ${selectedFilePath}. Error: ${handleError.message}`);
                      setSaving(false);
                      return;
                 }
             }

             // Write the changes
            const writable = await targetHandle.createWritable();
            await writable.write(fileData.modified);
            await writable.close();
            console.log(`Changes applied to: ${selectedFilePath}`);

            // Update the state: original now matches modified
            setChangedFiles((prev) => ({
                 ...prev,
                 [selectedFilePath]: {
                     ...prev[selectedFilePath],
                     original: fileData.modified, // Update original content in state
                 }
             }));

            // Optionally: Refresh the specific file's content in the directoryTree state without full refresh
            setDirectoryTree(prevTree => updateFileContentInTree(prevTree, selectedFilePath, fileData.modified));

            showNotification(`Changes saved to ${selectedFilePath}`);

         } catch (error) {
             console.error(`Error applying changes to ${selectedFilePath}:`, error);
             showNotification(`Error applying changes to ${selectedFilePath}: ${error.message}`);
         } finally {
             setSaving(false);
         }
    }, [selectedFilePath, changedFiles, folderHandle, directoryTree, findFileByPath, setDirectoryTree]); // Added setDirectoryTree to dependencies


    // Apply changes for *all* files listed in the changedFiles state
    const applyAllChanges = useCallback(async () => {
        if (Object.keys(changedFiles).length === 0 || !folderHandle) return;

        setSaving(true);
        const errors = [];
        const appliedFiles = [];

        for (const filePath of Object.keys(changedFiles)) {
            const fileData = changedFiles[filePath];

            // Skip if no actual changes detected
            if (fileData.original === fileData.modified) {
                 console.log(`Skipping ${filePath} - no changes.`);
                 // Remove from changedFiles state if no difference
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
                          continue; // Skip this file
                     }
                 }

                const writable = await targetHandle.createWritable();
                await writable.write(fileData.modified);
                await writable.close();
                appliedFiles.push(filePath);
                 console.log(`Changes applied to: ${filePath}`);

                // Update state for this file
                 setChangedFiles((prev) => ({
                     ...prev,
                     [filePath]: {
                         ...prev[filePath],
                         original: fileData.modified,
                     }
                 }));
                 // Update tree state
                 setDirectoryTree(prevTree => updateFileContentInTree(prevTree, filePath, fileData.modified));

            } catch (error) {
                console.error(`Error applying changes to ${filePath}:`, error);
                errors.push(`Error applying changes to ${filePath}: ${error.message}`);
            }
        }

         setSaving(false);

         // Provide feedback
         if (errors.length > 0) {
            showNotification(`Applied changes to ${appliedFiles.length} files.\nEncountered errors:\n- ${errors.join('\n- ')}`);
         } else if (appliedFiles.length > 0) {
            showNotification(`Successfully applied changes to ${appliedFiles.length} files.`);
             // All applied successfully, potentially clear the changedFiles state or refresh fully
             // setChangedFiles({}); // Option: Clear changes after successful Apply All
             // handleRefresh(); // Option: Full refresh
         } else {
            showNotification("No changes were applied.");
         }


    }, [changedFiles, folderHandle, directoryTree, findFileByPath, setDirectoryTree]); // Added setDirectoryTree to dependencies

    // --- Helper functions for file handles and tree updates ---

    // Recursively gets a file handle, creating directories if needed
    const getFileHandleRecursive = async (dirHandle, pathParts, create = false) => {
         if (pathParts.length === 1) {
             // Last part is the filename
             return dirHandle.getFileHandle(pathParts[0], { create });
         }
         // Get subdirectory handle
         const dirName = pathParts[0];
         const subDirHandle = await dirHandle.getDirectoryHandle(dirName, { create });
         // Recurse into subdirectory
         return getFileHandleRecursive(subDirHandle, pathParts.slice(1), create);
     };

     // Updates the content of a specific file within the nested directoryTree state
     const updateFileContentInTree = (tree, targetPath, newContent) => {
         return tree.map(node => {
             if (node.path === targetPath && node.isLeaf) {
                 // Found the file, update its content
                 return { ...node, content: newContent };
             } else if (node.children && targetPath.startsWith(node.path + '/')) {
                 // File might be in this directory, recurse
                 return { ...node, children: updateFileContentInTree(node.children, targetPath, newContent) };
             }
             // Not the target file or directory, return node as is
             return node;
         });
     };


    // --- Keyboard Shortcut ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S or Cmd+S to trigger Apply Changes for the selected file
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                applyChanges();
            }
            // Ctrl+Shift+S or Cmd+Shift+S to trigger Apply All Changes
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                applyAllChanges();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [applyChanges, applyAllChanges]); // Re-bind if functions change

    // --- Resizing Logic ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!mainContentRef.current) return;
            const mainRect = mainContentRef.current.getBoundingClientRect();

            if (isResizing1.current) {
                const newWidth = e.clientX - mainRect.left;
                // Ensure minimum width for directory and editor panels
                if (newWidth > MIN_PANEL_WIDTH && mainRect.width - newWidth - chatWidth > MIN_PANEL_WIDTH) {
                    setDirectoryWidth(newWidth);
                }
            } else if (isResizing2.current) {
                const newWidth = mainRect.right - e.clientX;
                 // Ensure minimum width for chat and editor panels
                if (newWidth > MIN_PANEL_WIDTH && mainRect.width - newWidth - directoryWidth > MIN_PANEL_WIDTH) {
                    setChatWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            isResizing1.current = false;
            isResizing2.current = false;
             // Optional: Remove selection/cursor styles if added during resize
             document.body.style.cursor = 'default';
             document.body.style.userSelect = 'auto';
        };

         // Add listeners to window to catch mouse movements outside the resizer elements
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
             // Clean up listeners
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [directoryWidth, chatWidth]); // Depend on widths to recalculate constraints

    const startResizing = (resizer) => (e) => {
        e.preventDefault(); // Prevent text selection during drag
         if (resizer === 1) {
            isResizing1.current = true;
        } else if (resizer === 2) {
            isResizing2.current = true;
        }
         // Optional: Change cursor and prevent text selection globally during resize
         document.body.style.cursor = 'col-resize';
         document.body.style.userSelect = 'none';
    };

    // Toggle Footer Info visibility
    const toggleFooterInfo = () => {
        setFooterInfoVisible(prev => !prev);
    };

    // --- Render ---
    return (
        <Box className="open-folder-container">
            {/* Actions Bar */}
            <Box className="actions-bar">
                {!folderHandle ? (
                    <>
                        <Button variant="contained" color="primary" onClick={handleOpenFolder} startIcon={<FolderOpenIcon />}>
                            Open Folder
                        </Button>
                        <Typography variant="body2" className="alert-typography">
                            Select a project folder to begin
                        </Typography>
                    </>
                ) : (
                    <>
                         <Tooltip title="Open a different folder">
                             <Button variant="outlined" color="secondary" onClick={handleOpenFolder} startIcon={<FolderOpenIcon />}>
                                Open Folder
                             </Button>
                         </Tooltip>
                         <Tooltip title="Refresh directory tree and conversations (Ctrl+R)">
                             <IconButton onClick={handleRefresh} disabled={loading} size="small" color="secondary">
                                 {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                             </IconButton>
                         </Tooltip>
                         <Tooltip title="Start a new chat conversation">
                             <Button variant="contained" color="secondary" onClick={handleStartNewConversation} startIcon={<AddCommentIcon />} disabled={loading}>
                                New Chat
                             </Button>
                         </Tooltip>

                         {/* Conditional Apply buttons only if there are changes */}
                         {Object.keys(changedFiles).length > 0 && (
                             <>
                                  <Tooltip title="Toggle between Diff View and Editor View">
                                     <Button
                                         variant="outlined"
                                         color="secondary"
                                         onClick={() => setIsDiffView(!isDiffView)}
                                         startIcon={isDiffView ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                     >
                                         {isDiffView ? 'Editor View' : 'Diff View'}
                                     </Button>
                                 </Tooltip>
                                 {isDiffView && (
                                      <Tooltip title={collapseUnchanged ? "Show Unchanged Lines" : "Hide Unchanged Lines"}>
                                         <Button
                                             variant="outlined"
                                             color="secondary"
                                             onClick={() => setCollapseUnchanged(!collapseUnchanged)}
                                             startIcon={collapseUnchanged ? <ExpandMoreIcon/> : <ExpandLessIcon/>}
                                         >
                                             {collapseUnchanged ? 'Expand' : 'Collapse'}
                                         </Button>
                                      </Tooltip>
                                 )}
                                 <Tooltip title="Save changes for the selected file (Ctrl+S)">
                                     <span> {/* Span needed for disabled button tooltip */}
                                         <Button
                                             variant="contained"
                                             color="primary"
                                             onClick={applyChanges}
                                             disabled={saving || !selectedFilePath || changedFiles[selectedFilePath]?.original === changedFiles[selectedFilePath]?.modified}
                                             startIcon={saving ? <CircularProgress size={20} color="inherit"/> :<SaveIcon />}
                                         >
                                             Apply
                                         </Button>
                                     </span>
                                 </Tooltip>
                                 <Tooltip title="Save changes for all modified files (Ctrl+Shift+S)">
                                     <span> {/* Span needed for disabled button tooltip */}
                                         <Button
                                             variant="contained"
                                             color="primary"
                                             onClick={applyAllChanges}
                                             disabled={saving || Object.values(changedFiles).every(f => f.original === f.modified)}
                                             startIcon={saving ? <CircularProgress size={20} color="inherit"/> :<SaveAltIcon />}
                                         >
                                             Apply All
                                         </Button>
                                     </span>
                                 </Tooltip>
                             </>
                         )}
                    </>
                )}
            </Box>

            {/* Main Content Area (Panels) */}
            <Box className="main-content-area" ref={mainContentRef}>
                {folderHandle && (
                    <>
                        {/* Directory Tree Panel */}
                        <Box className="directory-tree-panel" style={{ width: directoryWidth }}>
                             <Typography className="directory-tree-header" variant="subtitle2" noWrap>
                                {folderHandle?.name || 'Directory'}
                            </Typography>
                            {/* Search Input */}
                             <Box sx={{ px: 2, pt: 1.5, pb: 0.5, borderBottom: isSearching ? '1px solid' : 'none', borderColor: 'divider' }}>
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
                                        sx: { fontSize: '0.875rem', bgcolor: 'background.default' } // Slightly smaller font, distinct background
                                    }}
                                 />
                             </Box>
                            <Box className="directory-tree-content">
                                <DirectoryTree
                                    files={filteredTreeData} // Use filtered data
                                    isSearching={isSearching} // Pass searching state
                                    expandedDirectories={expandedDirectories}
                                    onDirectoryClick={handleDirectoryClick}
                                    onFileClick={handleFileClick}
                                    selectedSubFolders={selectedSubFolders} // Pass selection state
                                    toggleSubFolder={toggleSubFolder} // Pass toggle function
                                    selectedFiles={selectedFiles} // Pass file selection state
                                    toggleFileSelection={toggleFileSelection} // Pass file toggle function
                                />
                            </Box>
                             {/* Hide conversations when searching */}
                             {!isSearching && (
                                <Box className="conversations-section">
                                    <Typography className="conversations-header" variant="subtitle2">Conversations</Typography>
                                    <Box className="conversations-list-container">
                                        <ConversationsList
                                            onSelectConversation={handleSelectConversation}
                                            // Removed onStartNewConversation prop if button is in header
                                        />
                                    </Box>
                                </Box>
                             )}
                        </Box>

                        {/* Resizer 1 */}
                        <Box className="resizer" onMouseDown={startResizing(1)} ref={resizer1Ref} />

                        {/* Editor Panel */}
                        <Box className="editor-panel" style={{ width: `calc(100% - ${directoryWidth}px - ${chatWidth}px - 10px)` /* 10px for 2 resizers */ }}>
                            {Object.keys(changedFiles).length > 0 && (
                                <ChangedFilesBar
                                    changedFiles={changedFiles}
                                    selectedFilePath={selectedFilePath}
                                    onSelectFilePath={setSelectedFilePath} // Allow selecting files from the bar
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
                                />
                             </Box>
                        </Box>

                        {/* Resizer 2 */}
                        <Box className="resizer" onMouseDown={startResizing(2)} ref={resizer2Ref} />

                        {/* Chat Panel */}
                        <Box className="chat-panel" style={{ width: chatWidth }}>
                            <ChatInterface
                                selectedConversation={selectedConversation}
                                onFileChanges={handleFileChanges} // Pass handler to update editor on AI response
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                selectedFiles={selectedFiles} // Pass context files/folders
                                selectedSubFolders={selectedSubFolders}
                                deselectFile={deselectFile} // Pass deselect functions
                                deselectSubFolder={deselectSubFolder}
                                // handleMessageClick is removed if not used
                            />
                        </Box>
                    </>
                )}
                {/* Show message if no folder is open */}
                {!folderHandle && !loading && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, color: 'text.secondary' }}>
                         <Typography>Open a folder to start working.</Typography>
                     </Box>
                )}
                 {/* Loading indicator when initially opening folder */}
                 {loading && !folderHandle && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                         <CircularProgress />
                     </Box>
                 )}
            </Box>

            {/* Footer */}
            <Box component="footer" className="app-footer">
                 <Box className="footer-info-section">
                    <Tooltip title={footerInfoVisible ? "Hide Status Bar Info" : "Show Status Bar Info"}>
                        <IconButton size="small" onClick={toggleFooterInfo} sx={{color: 'text.secondary'}}>
                           <InfoIcon fontSize='inherit'/>
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
                             <Tooltip title={`Remaining Credits: ${saldo?.toFixed(2)}`}>
                                <Typography variant="caption" className="footer-status">
                                    ${saldo?.toFixed(2)} Credits
                                </Typography>
                             </Tooltip>
                        </>
                     )}
                      {footerInfoVisible && !folderHandle && (
                         <Typography variant="caption">No folder open</Typography>
                      )}
                 </Box>
                 {/* Add other footer elements if needed */}
                 <Typography variant="caption"> Gecode v1.0 </Typography>
             </Box>
        </Box>
    );
};

export default OpenFolder;