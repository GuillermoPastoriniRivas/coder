import React from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Checkbox, FormControlLabel } from '@mui/material';

const DirectoryTree = ({
    files,
    expandedDirectories,
    onDirectoryClick,
    onFileClick,
    selectedSubFolders,
    toggleSubFolder,
    selectedFiles,
    toggleFileSelection
}) => {

    const renderTree = (files) => (
        <ul>
            {files.map((file, index) => (
                <li key={index}>
                    {file.children ? (
                        <span className="folder" onClick={() => onDirectoryClick(file.name)}>
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
                        <span className="file" onClick={() => onFileClick(file)}>
                            <InsertDriveFileIcon /> {file.name}
                            <Checkbox
                                checked={selectedFiles.includes(file.path)}
                                onChange={() => toggleFileSelection(file.path)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginLeft: '10px' }}
                            />
                        </span>
                    )}
                    {file.children && expandedDirectories[file.name] && renderTree(file.children)}
                </li>
            ))}
        </ul>
    );

    return (
        <>
            {renderTree(files)}
        </>
    );
};

export default DirectoryTree;