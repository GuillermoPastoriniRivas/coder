import React from 'react';
import { Box, Typography, Checkbox, FormControlLabel, IconButton, Collapse, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Use different icon for open folders
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'; // Outline icon for files
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'; // Expand icon
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Collapse icon

const DirectoryTree = ({
    files,
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
                const isExpanded = isDirectory && expandedDirectories[node.path];
                const isFolderSelected = isDirectory && selectedSubFolders.includes(node.path);
                const isFileSelected = !isDirectory && selectedFiles.includes(node.path);

                const handleItemClick = (event) => {
                    event.stopPropagation(); // Prevent event bubbling
                    if (isDirectory) {
                        onDirectoryClick(node.path); // Expand/collapse folder
                    } else {
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
                                paddingLeft: `${8 + level * 16}px`, // Indentation based on level
                                // Highlight selected items subtly
                                backgroundColor: isFileSelected ? 'action.selected' : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                        >
                             {/* Expand/Collapse Icon for Directories */}
                             <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                                {isDirectory ? (
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
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    noWrap: true, // Prevent text wrapping
                                    sx: { opacity: node.error ? 0.5 : 1 } // Dim text if error reading file
                                }}
                                title={node.error ? `Error: ${node.content}` : node.path} // Tooltip shows full path or error
                            />

                            {/* Selection Checkbox */}
                            <Checkbox
                                size="small"
                                edge="end" // Position checkbox at the end
                                checked={isDirectory ? isFolderSelected : isFileSelected}
                                onChange={handleCheckboxChange}
                                onClick={(e) => e.stopPropagation()} // Prevent item click
                                sx={{ ml: 1, p: 0.5 }}
                                indeterminate={
                                    isDirectory &&
                                    !isFolderSelected && // Not fully selected
                                    node.children?.some(child => selectedFiles.includes(child.path) || selectedSubFolders.includes(child.path)) // But has some selected children
                                } // Indicate partial selection within a folder
                            />
                        </ListItem>

                        {/* Render Children if Directory and Expanded */}
                        {isDirectory && (
                             <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                {node.children && renderTreeNodes(node.children, level + 1)}
                             </Collapse>
                         )}
                    </React.Fragment>
                );
            })}
        </List>
    );

    // Render the root nodes
    return <>{renderTreeNodes(files)}</>;
};

export default DirectoryTree;