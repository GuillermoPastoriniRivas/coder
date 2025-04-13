import React from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode'; // Keep VS Code dark theme
import CodeMirror from '@uiw/react-codemirror';
import { Box, Typography } from '@mui/material'; // For empty state

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;


const FileContent = ({
    selectedFilePath,
    changedFiles,
    isDiffView,
    handleModifiedChange, // Function to call when modified editor changes
    getLanguageExtension, // Function to get language-specific extensions array
    collapseUnchanged,
    lineWrapEnabled // New prop to control line wrapping
}) => {

    // Determine the specific language extension for the selected file
    const languageExtension = getLanguageExtension(selectedFilePath);

    // Combine common extensions with language-specific ones and conditional line wrapping
    const editorExtensions = [...languageExtension];
    if (lineWrapEnabled) {
        editorExtensions.push(EditorView.lineWrapping);
    }


    // Get the file data, return null if no file is selected or data is missing
    const currentFileData = selectedFilePath ? changedFiles[selectedFilePath] : null;

    if (!selectedFilePath || !currentFileData) {
        return (
            <Box className="empty-state-message"> {/* Use class from OpenFolder.css */}
                <Typography variant="body2" color="text.secondary">
                    {Object.keys(changedFiles).length > 0 ? "Select a file from the 'Changed Files' bar above" : "Select a file from the directory tree"}
                </Typography>
            </Box>
        );
    }

    return (
        isDiffView ? (
            <CodeMirrorMerge
                theme={vscodeDark}
                orientation="a-b" // Side-by-side diff
                gutter={true}      // Show gutter between panes
                highlightChanges={true}
                className="cm-merge" // Use class from OpenFolder.css for height/styling
                collapseUnchanged={collapseUnchanged ? { margin: 2 } : undefined} // Enable collapse feature
                style={{ height: '100%' }} // Ensure it fills container
            >
                <Original
                    value={currentFileData.original || ''} // Ensure value is always string
                    extensions={[
                        EditorView.editable.of(false), // Original pane is not editable
                        ...editorExtensions // Apply common + language extensions + wrap
                    ]}
                />
                <Modified
                    value={currentFileData.modified || ''} // Ensure value is always string
                    onChange={handleModifiedChange} // Update state on change
                    extensions={[
                        EditorView.editable.of(true), // Modified pane is editable
                        ...editorExtensions // Apply common + language extensions + wrap
                    ]}
                />
            </CodeMirrorMerge>
        ) : (
            <CodeMirror
                value={currentFileData.modified || ''} // Show the (potentially modified) content
                onChange={handleModifiedChange} // Allow editing
                theme={vscodeDark}
                extensions={editorExtensions} // Apply common + language extensions + wrap
                className="cm-theme" // Use class from OpenFolder.css for height/styling
                height="100%" // Ensure it fills container
                style={{ height: '100%' }} // Ensure it fills container
            />
        )
    );
};

export default FileContent;