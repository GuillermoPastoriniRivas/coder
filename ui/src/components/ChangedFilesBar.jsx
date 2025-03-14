import React from 'react';
import { Button } from '@mui/material';

const ChangedFilesBar = ({ changedFiles, selectedFilePath, onSelectFilePath }) => (
    <div className="changed-files-bar">
        {Object.keys(changedFiles).map((path) => (
            <Button
                key={path}
                onClick={() => onSelectFilePath(path)}
                variant={selectedFilePath === path ? 'contained' : 'outlined'}
                color="secondary"
                className="changed-file-button"
                style={{ margin: '0 5px' }}
            >
                {path.split('/').pop()}
            </Button>
        ))}
    </div>
);

export default ChangedFilesBar;