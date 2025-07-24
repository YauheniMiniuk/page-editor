import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { okaidia } from '@uiw/codemirror-theme-okaidia';

const CssEditor = ({ value, onChange, ...rest }) => {
  return (
    <CodeMirror
      value={value}
      height="250px"
      theme={okaidia}
      extensions={[css()]}
      onChange={onChange}
      basicSetup={{
        foldGutter: true,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
      }}
      {...rest}
    />
  );
};

export default CssEditor;