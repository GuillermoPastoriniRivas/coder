import React, { createContext, useContext, useState } from 'react';

const DirectoryContext = createContext();

export const useDirectory = () => {
    return useContext(DirectoryContext);
};

export const DirectoryProvider = ({ children }) => {
    const [folderHandle, setFolderHandle] = useState(null);
    const [directoryTree, setDirectoryTree] = useState([]);

    const value = {
        folderHandle,
        setFolderHandle,
        directoryTree,
        setDirectoryTree,
    };

    return (
        <DirectoryContext.Provider value={value}>
            {children}
        </DirectoryContext.Provider>
    );
};
