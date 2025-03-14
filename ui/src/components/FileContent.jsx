import React from 'react';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

const FileContent = ({
    selectedFilePath,
    changedFiles,
    isDiffView,
    handleModifiedChange,
    getLanguageExtension,
    collapseUnchanged
}) => {
    return (
        selectedFilePath ? (
            isDiffView ? (
                <CodeMirrorMerge theme={vscodeDark} orientation="a-b" gutter={true} highlightChanges={true} className="cm-merge" collapseUnchanged={collapseUnchanged}>
                    <Original
                        value={changedFiles[selectedFilePath]?.original || ''}
                        extensions={[EditorView.editable.of(false), ...getLanguageExtension(selectedFilePath)]}
                    />
                    <Modified
                        value={changedFiles[selectedFilePath]?.modified || ''}
                        onChange={handleModifiedChange}
                        extensions={getLanguageExtension(selectedFilePath)}
                    />
                </CodeMirrorMerge>
            ) : (
                <CodeMirror
                    value={changedFiles[selectedFilePath]?.modified || ''}
                    onChange={handleModifiedChange}
                    theme={vscodeDark}
                    extensions={getLanguageExtension(selectedFilePath)}
                    height="600px"
                />
            )
        ) : (
            <div className="empty-state">Selecciona un archivo para ver su contenido</div>
        )
    );
};

export default FileContent;