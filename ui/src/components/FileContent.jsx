import React from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;


const FileContent = ({
    selectedFilePath,
    changedFiles,
    isDiffView,
    handleModifiedChange,
    getLanguageExtension,
    collapseUnchanged,
    lineWrapEnabled,
    isMarkdownView
}) => {

    const languageExtension = getLanguageExtension(selectedFilePath);

    const editorExtensions = [...languageExtension];
    if (lineWrapEnabled) {
        editorExtensions.push(EditorView.lineWrapping);
    }


    const currentFileData = selectedFilePath ? changedFiles[selectedFilePath] : null;

    if (!selectedFilePath || !currentFileData) {
        return (
            <Box className="empty-state-message">
                <Typography variant="body2" color="text.secondary">
                    {Object.keys(changedFiles).length > 0 ? "Select a file from the 'Changed Files' bar above" : "Select a file from the directory tree"}
                </Typography>
            </Box>
        );
    }

    const isMarkdownFile = selectedFilePath.toLowerCase().endsWith('.md');

    if (isMarkdownFile && isMarkdownView) {
        return (
            <Box sx={{ p: 2, overflow: 'auto', height: '100%', bgcolor: 'background.default', color: 'text.primary' }} className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentFileData.modified || ''}
                </ReactMarkdown>
            </Box>
        );
    }

    return (
        isDiffView ? (
            <CodeMirrorMerge
                theme={vscodeDark}
                orientation="a-b"
                gutter={true}
                highlightChanges={true}
                className="cm-merge"
                collapseUnchanged={collapseUnchanged ? { margin: 2 } : undefined}
                style={{ height: '100%' }}
            >
                <Original
                    value={currentFileData.original || ''}
                    extensions={[
                        EditorView.editable.of(false),
                        ...editorExtensions
                    ]}
                />
                <Modified
                    value={currentFileData.modified || ''}
                    onChange={handleModifiedChange}
                    extensions={[
                        EditorView.editable.of(true),
                        ...editorExtensions
                    ]}
                />
            </CodeMirrorMerge>
        ) : (
            <CodeMirror
                value={currentFileData.modified || ''}
                onChange={handleModifiedChange}
                theme={vscodeDark}
                extensions={editorExtensions}
                className="cm-theme"
                height="100%"
                style={{ height: '100%' }}
            />
        )
    );
};

export default FileContent;