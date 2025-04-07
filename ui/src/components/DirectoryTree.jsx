import React from 'react';
import { Box, Typography, Checkbox, FormControlLabel, IconButton, Collapse, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Use different icon for open folders
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'; // Outline icon for files
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'; // Expand icon
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Collapse icon

const DirectoryTree = ({
    files,
    isSearching,         // Boolean indicating if the tree is showing search results
    expandedDirectories, // Expects an object { [path]: boolean }
    onDirectoryClick,    // Function(path) to toggle expansion
    onFileClick,         // Function(fileObject) when a file is clicked
    selectedSubFolders,  // Array of selected folder paths
    toggleSubFolder,     // Function(folderPath) to toggle folder selection
    selectedFiles,       // Array of selected file paths
    toggleFileSelection  // Function(filePath) to toggle file selection
}) => {

    const renderTreeNodes = (nodes, level = 0) => (
        <List component="div" disablePadding sx={{ pl: level > 0 ? 2 : 0 }}> {/* Indent nested lists */}
            {nodes.map((node) => {
                const isDirectory = !!node.children;
                 // When searching, treat everything as level 0 unless it's the original tree
                const displayLevel = isSearching ? 0 : level;
                const isExpanded = !isSearching && isDirectory && expandedDirectories[node.path]; // No expansion in search results
                const isFolderSelected = isDirectory && selectedSubFolders.includes(node.path);
                const isFileSelected = !isDirectory && selectedFiles.includes(node.path);

                const handleItemClick = (event) => {
                    event.stopPropagation(); // Prevent event bubbling
                    if (!isSearching && isDirectory) {
                        onDirectoryClick(node.path); // Expand/collapse folder (only if not searching)
                    } else if (!isDirectory) { // Only handle file clicks if it's a file
                        onFileClick(node); // Handle file click (e.g., open in editor)
                    }
                };

                const handleCheckboxChange = (event) => {
                     event.stopPropagation(); // Prevent item click when interacting with checkbox
                     if (isDirectory) {
                         toggleSubFolder(node.path);
                     } else {
                         toggleFileSelection(node.path);
                     }
                 };

                return (
                    <React.Fragment key={node.path}>
                        <ListItem
                            button // Make item clickable
                            onClick={handleItemClick}
                            dense // Reduce vertical padding
                            sx={{
                                paddingLeft: `${8 + displayLevel * 16}px`, // Indentation based on displayLevel
                                // Highlight selected items subtly
                                backgroundColor: isFileSelected ? 'action.selected' : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                             {/* Expand/Collapse Icon for Directories (Hide if searching) */}
                             <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                                {isDirectory && !isSearching ? (
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDirectoryClick(node.path); }} sx={{p:0.2}}>
                                        {isExpanded ? <KeyboardArrowDownIcon fontSize="inherit" /> : <KeyboardArrowRightIcon fontSize="inherit" />}
                                    </IconButton>
                                ) : (
                                     // Placeholder to maintain alignment or specific file icon
                                     <Box sx={{ width: 20 }} /> // Adjust width to match IconButton space
                                )}
                             </ListItemIcon>

                            {/* File/Folder Icon */}
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                                {isDirectory ? (
                                    isExpanded ? <FolderOpenIcon fontSize="small" color="primary" /> : <FolderIcon fontSize="small" color="primary" />
                                ) : (
                                    <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                )}
                            </ListItemIcon>

                            {/* File/Folder Name */}
                             <ListItemText
                                primary={node.name}
                                secondary={isSearching ? node.path : null} // Show full path as secondary text when searching
                                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', sx:{ pl: 1 }}}
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    noWrap: true, // Prevent text wrapping
                                    sx: { opacity: node.error ? 0.5 : 1 } // Dim text if error reading file
                                }}
                                title={node.error ? `Error: ${node.content}` : node.path} // Tooltip shows full path or error
                            />

                            {/* Selection Checkbox (Show for folders only when not searching, show for files always) */}
                             {(isDirectory && !isSearching) || !isDirectory ? ( // Updated condition
                                <Checkbox
                                    size="small"
                                    edge="end" // Position checkbox at the end
                                    // Checked state depends on whether it's a directory or file
                                    checked={isDirectory ? isFolderSelected : isFileSelected}
                                    onChange={handleCheckboxChange}
                                    onClick={(e) => e.stopPropagation()} // Prevent item click
                                    sx={{ ml: 1, p: 0.5 }}
                                    // Indeterminate state only makes sense for directories
                                    indeterminate={
                                        isDirectory && // Only apply to directories
                                        !isFolderSelected && // Not fully selected
                                        node.children?.some(child => selectedFiles.includes(child.path) || selectedSubFolders.includes(child.path)) // But has some selected children
                                    }
                                />
                             ) : null /* Don't render checkbox for folders during search */}
                        </ListItem>

                        {/* Render Children if Directory and Expanded (and not searching) */}
                        {!isSearching && isDirectory && (
                             <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                {node.children && renderTreeNodes(node.children, level + 1)}
                             </Collapse>
                         )}
                    </React.Fragment>
                );
            })}
        </List>
    );

    // Render the root nodes or search results
    return <>{renderTreeNodes(files)}</>;
};

export default DirectoryTree;