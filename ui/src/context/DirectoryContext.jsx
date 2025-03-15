import React, { createContext, useContext, useState } from 'react';

const DirectoryContext = createContext();

export const useDirectory = () => {
    return useContext(DirectoryContext);
};

export const DirectoryProvider = ({ children }) => {
    const [folderHandle, setFolderHandle] = useState(null);
    const [directoryTree, setDirectoryTree] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedSubFolders, setSelectedSubFolders] = useState([]); // Added state for selected subfolders

    const toggleSubFolder = (subFolder) => {
        setSelectedSubFolders((prev) => {
            if (prev.includes(subFolder)) {
                return prev.filter((folder) => folder !== subFolder);
            } else {
                return [...prev, subFolder];
            }
        });
    };

    const clearSelectedSubFolders = () => {
        setSelectedSubFolders([]);
    };

    const value = {
        folderHandle,
        setFolderHandle,
        directoryTree,
        setDirectoryTree,
        conversations,
        setConversations,
        selectedSubFolders, // Exposed selectedSubFolders
        toggleSubFolder,    // Function to toggle selection
        clearSelectedSubFolders, // Function to clear selectedSubFolders
    };

    return (
        <DirectoryContext.Provider value={value}>
            {children}
        </DirectoryContext.Provider>
    );
};