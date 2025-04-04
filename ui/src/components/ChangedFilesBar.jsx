import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';

const ChangedFilesBar = ({ changedFiles, selectedFilePath, onSelectFilePath }) => (
    <Box className="changed-files-bar"> {/* Use class from OpenFolder.css */}
        {Object.keys(changedFiles).map((path) => {
            const fileName = path.split('/').pop(); // Get just the filename
            const isSelected = selectedFilePath === path;
            const hasChanges = changedFiles[path]?.original !== changedFiles[path]?.modified;

            return (
                <Tooltip title={path} key={path} placement="top">
                    <Button
                        onClick={() => onSelectFilePath(path)}
                        // Use secondary color, contained for selected, outlined for others
                        variant={isSelected ? 'contained' : 'outlined'}
                        color="secondary"
                        className="changed-file-button" // Use class from OpenFolder.css
                        // Apply specific styling for active/inactive tabs via CSS or sx prop
                        sx={{
                            fontWeight: isSelected ? 'bold' : 'normal', // Bold text for selected
                            borderColor: isSelected ? 'primary.main' : undefined, // Optional: border highlight for selected outlined
                            // Indicate unsaved changes (e.g., with an asterisk or different style)
                            '&::after': hasChanges ? {
                                content: '"*"',
                                display: 'inline-block',
                                marginLeft: '4px',
                                color: 'warning.main', // Use warning color for asterisk
                                fontWeight: 'bold',
                            } : {},
                        }}
                    >
                        {fileName}
                    </Button>
                </Tooltip>
            );
        })}
    </Box>
);

export default ChangedFilesBar;