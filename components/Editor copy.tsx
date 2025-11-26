
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Project, Language, File, EditorSettings, Diagnostic } from '../types';
import { executeCode, explainCode, debugCode } from '../services/geminiService';
import { 
  Play, ArrowLeft, Save, Bot, Terminal, Undo, Redo, 
  Search, X, File as FileIcon, Settings, Plus, Trash2, 
  Download, Share2, Layers, FileJson, FileType, FileCode, Edit2, Copy, AlertTriangle, Box, ArrowDown, ArrowUp,
  Blocks, Files, MoreHorizontal, Check, DownloadCloud, Sparkles, Lightbulb, GitGraph, Container, RefreshCw, Hash, Code2,
  Command, Zap, type LucideIcon, Globe, Palette, Moon, Menu, Link, Maximize, Minimize, Sun, UploadCloud
} from 'lucide-react';

import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup'; 
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';

import JSZip from 'jszip';

interface EditorProps {
  project: Project;
  userSettings: EditorSettings;
  installedExtensions: string[];
  onSave: (project: Project) => void;
  onClose: () => void;
  onExtensionChange: (extensions: string[]) => void;
  onUpdateSettings: (settings: EditorSettings) => void;
}

const MARKETPLACE_EXTENSIONS = [
  { id: 'eslint', name: 'ESLint', description: 'Integrates ESLint into your system for real-time error checking.', author: 'Microsoft', downloads: '28M', icon: '🔵', version: '2.4.2' },
  { id: 'prettier', name: 'Prettier', description: 'Code formatter using prettier. Enables Alt+Shift+F.', author: 'Prettier', downloads: '34M', icon: '💅', version: '10.1.0' },
  { id: 'python', name: 'Python', description: 'IntelliSense, Linting, Debugging for Python.', author: 'Microsoft', downloads: '78M', icon: '🐍', version: '2023.14.0' },
  { id: 'cpp', name: 'C/C++', description: 'IntelliSense, debugging, and code browsing for C/C++.', author: 'Microsoft', downloads: '56M', icon: '🇨', version: '1.18.5' },
  { id: 'java', name: 'Extension Pack for Java', description: 'Java IntelliSense, debugging, and project management.', author: 'Red Hat', downloads: '22M', icon: '☕', version: '0.25.1' },
  { id: 'liveserver', name: 'Live Server', description: 'Launch a local development server with live reload.', author: 'Ritwick Dey', downloads: '41M', icon: '📡', version: '5.7.9' },
  { id: 'vscode-icons', name: 'vscode-icons', description: 'Icons for Visual Studio Code.', author: 'VSCode Icons Team', downloads: '14M', icon: '📁', version: '11.0.0' },
  { id: 'material-icons', name: 'Material Icon Theme', description: 'Material Design Icons for Visual Studio Code.', author: 'Philipp Kief', downloads: '18M', icon: '🎨', version: '4.30.0' },
  { id: 'docker', name: 'Docker', description: 'Manage Docker Containers and lint Dockerfiles.', author: 'Microsoft', downloads: '19M', icon: '🐳', version: '1.26.0' },
  { id: 'gitlens', name: 'GitLens', description: 'Supercharge Git. Adds Source Control view and inline blame.', author: 'GitKraken', downloads: '25M', icon: '🔍', version: '14.0.1' },
  { id: 'dracula', name: 'Dracula Official', description: 'A dark theme for many editors, shells, and more.', author: 'Dracula Theme', downloads: '6M', icon: '🧛', version: '2.24.2' },
  { id: 'onedark', name: 'One Dark Pro', description: 'Atom\'s iconic One Dark theme for Visual Studio Code.', author: 'binaryify', downloads: '8M', icon: '🌘', version: '3.19.0' },
  { id: 'bracket-pair-colorizer', name: 'Bracket Pair Colorizer', description: 'A customizable extension for colorizing matching brackets.', author: 'CoenraadS', downloads: '10M', icon: '🌈', version: '2.0.0' },
  { id: 'auto-close-brackets', name: 'Auto Close Brackets', description: 'Automatically closes brackets/quotes.', author: 'Jun Han', downloads: '9M', icon: '🔄', version: '0.0.1' },
];

const KEYWORDS: Partial<Record<Language, string[]>> = {
  [Language.JAVASCRIPT]: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'import', 'export', 'default', 'class', 'extends', 'try', 'catch', 'async', 'await', 'new', 'this', 'console', 'log', 'require', 'module', 'exports', 'map', 'filter', 'reduce'],
  [Language.PYTHON]: ['def', 'return', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'class', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue', 'print', 'True', 'False', 'None', 'len', 'range'],
  [Language.JAVA]: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'new', 'this', 'super', 'void', 'int', 'String', 'boolean', 'static', 'final', 'System', 'out', 'println'],
  [Language.CPP]: ['int', 'float', 'double', 'char', 'void', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'class', 'struct', 'public', 'private', 'include', 'using', 'namespace', 'std', 'cout', 'cin', 'endl', 'vector', 'string'],
  [Language.C]: ['int', 'float', 'double', 'char', 'void', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'struct', 'union', 'typedef', 'enum', 'static', 'extern', 'include', 'define', 'printf', 'scanf', 'malloc', 'free', 'NULL'],
  [Language.HTML]: ['div', 'span', 'h1', 'h2', 'p', 'a', 'img', 'script', 'style', 'head', 'body', 'html', 'link', 'meta', 'input', 'button', 'form', 'ul', 'li', 'section', 'header', 'footer'],
  [Language.SQL]: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'COUNT', 'SUM'],
};

const DOCS: Record<string, string> = {
  'console': 'The console object provides access to the browser\'s debugging console.',
  'log': 'Outputs a message to the web console.',
  'const': 'Declares a read-only named constant.',
  'let': 'Declares a block-scoped local variable, optionally initializing it to a value.',
  'var': 'Declares a variable, optionally initializing it to a value. (Avoid if possible, use let/const).',
  'function': 'Declares a function with the specified parameters.',
  'return': 'Specifies the value to be returned by a function.',
  'if': 'Executes a statement if a specified condition is true.',
  'for': 'Creates a loop that consists of three optional expressions.',
  'while': 'Creates a loop that executes a specified statement as long as the test condition evaluates to true.',
  'import': 'Used to import read-only live bindings which are exported by another module.',
  'export': 'Used when creating JavaScript modules to export live bindings.',
  'def': 'Used to define a function in Python.',
  'print': 'Prints the given object(s) to the standard output device.',
  'class': 'Defines a class template for creating objects.',
  'public': 'An access modifier used for classes, attributes, methods and constructors.',
  'static': 'Used to declare a variable or method that belongs to the class rather than instances.',
  'void': 'Specifies that a method does not return a value.',
  'int': 'Primitive data type for integers.',
  'String': 'Class representing character strings.',
  'map': 'Creates a new array populated with the results of calling a provided function on every element in the calling array.',
  'filter': 'Creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test implemented by the provided function.',
  'reduce': 'Executes a user-supplied "reducer" callback function on each element of the array, in order, passing in the return value from the calculation on the preceding element.',
  'len': 'Return the length (the number of items) of an object.',
  'range': 'Returns a sequence of numbers, starting from 0 by default, and increments by 1 (by default), and stops before a specified number.',
  'System': 'The System class contains several useful class fields and methods. It cannot be instantiated.',
  'out': 'The "standard" output stream. This stream is already open and ready to accept output data.',
  'println': 'Prints a string to the console and terminates the line.',
  'printf': 'Sends formatted output to stdout.',
  'malloc': 'Allocates a block of memory of specified size.',
  'free': 'Deallocates memory previously allocated by malloc.',
  'struct': 'A user-defined data type that groups related variables.'
};

const SNIPPETS: Partial<Record<Language, { label: string; code: string }[]>> = {
  [Language.JAVASCRIPT]: [
    { label: 'Console Log', code: 'console.log(|);' },
    { label: 'Function', code: 'function name(params) {\n  |\n}' },
    { label: 'Arrow Function', code: 'const name = (params) => {\n  |\n};' },
    { label: 'For Loop', code: 'for (let i = 0; i < array.length; i++) {\n  const element = array[i];\n  |\n}' },
    { label: 'Try Catch', code: 'try {\n  |\n} catch (error) {\n  console.error(error);\n}' },
  ],
  [Language.PYTHON]: [
    { label: 'Print', code: 'print(|)' },
    { label: 'Function', code: 'def name(args):\n    pass|' },
    { label: 'For Loop', code: 'for item in collection:\n    pass|' },
    { label: 'If Name == Main', code: 'if __name__ == "__main__":\n    main()|' },
  ],
  [Language.JAVA]: [
    { label: 'Sout', code: 'System.out.println(|);' },
    { label: 'Main', code: 'public static void main(String[] args) {\n    |\n}' },
    { label: 'Class', code: 'public class Name {\n    |\n}' },
  ],
  [Language.CPP]: [
    { label: 'Cout', code: 'std::cout << "|" << std::endl;' },
    { label: 'Main', code: 'int main() {\n    return 0;\n}' },
  ],
  [Language.C]: [
    { label: 'Printf', code: 'printf("|\\n");' },
    { label: 'Main', code: 'int main() {\n    return 0;\n}' },
    { label: 'Include Stdio', code: '#include <stdio.h>' },
  ],
  [Language.HTML]: [
    { label: 'Boilerplate', code: '<!DOCTYPE html>\n<html>\n<body>\n  |\n</body>\n</html>' },
    { label: 'Div', code: '<div>|</div>' },
  ],
  [Language.DOCKERFILE]: [
    { label: 'FROM Node', code: 'FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "index.js"]' },
    { label: 'FROM Python', code: 'FROM python:3.9-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]' },
  ]
};

export const Editor: React.FC<EditorProps> = ({ project, userSettings, installedExtensions, onSave, onClose, onExtensionChange, onUpdateSettings }) => {
  // --- VS CODE SHORTCUT LOGIC ---

  const getLineInfo = (value: string, cursorIndex: number) => {
    const lines = value.split('\n');
    let currentPos = 0;
    let lineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length + 1 > cursorIndex) {
        lineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1;
    }
    return { lines, lineIndex, currentPos };
  };

  const handleToggleComment = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (!activeFile || !textareaRef.current) return;
    
    const { selectionStart, value } = textareaRef.current;
    const { lines, lineIndex } = getLineInfo(value, selectionStart);
    const style = COMMENT_STYLES[activeFile.language] || { single: '//' };
    
    let newLine = lines[lineIndex];
    
    // Handle Block Comments (HTML/CSS)
    if (style.start && style.end) {
       const hasComment = newLine.trim().startsWith(style.start);
       if (hasComment) {
         newLine = newLine.replace(style.start + ' ', '').replace(' ' + style.end, '');
       } else {
         newLine = `${style.start} ${newLine} ${style.end}`;
       }
    } 
    // Handle Single Line Comments (JS/Python/etc)
    else if (style.single) {
       const hasComment = newLine.trim().startsWith(style.single);
       if (hasComment) {
         newLine = newLine.replace(style.single + ' ', '');
       } else {
         newLine = `${style.single} ${newLine}`;
       }
    }

    lines[lineIndex] = newLine;
    const newValue = lines.join('\n');
    
    // Calculate new cursor position to keep it relative
    const diff = newLine.length - lines[lineIndex].length; // approximation
    const newCursor = selectionStart + (newLine.length > lines[lineIndex].length ? 2 : 0); // basic correction

    handleCodeChange(newValue);
    setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart;
        }
    }, 0);
  };

  const handleMoveLine = (direction: 'up' | 'down') => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const { lines, lineIndex } = getLineInfo(value, selectionStart);

    if (direction === 'up' && lineIndex > 0) {
      [lines[lineIndex], lines[lineIndex - 1]] = [lines[lineIndex - 1], lines[lineIndex]];
      const newValue = lines.join('\n');
      handleCodeChange(newValue);
      // Move cursor up
      const lenPrev = lines[lineIndex - 1].length + 1; 
      setTimeout(() => {
        if(textareaRef.current) {
           // Approximate cursor move (complex to get exact column)
           textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart - lenPrev;
        }
      }, 0);
    } else if (direction === 'down' && lineIndex < lines.length - 1) {
      [lines[lineIndex], lines[lineIndex + 1]] = [lines[lineIndex + 1], lines[lineIndex]];
      const newValue = lines.join('\n');
      handleCodeChange(newValue);
      const lenNext = lines[lineIndex + 1].length + 1;
       setTimeout(() => {
        if(textareaRef.current) {
           textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + lenNext;
        }
      }, 0);
    }
  };

  const handleDuplicateLine = (direction: 'up' | 'down') => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const { lines, lineIndex } = getLineInfo(value, selectionStart);
    
    const lineToCopy = lines[lineIndex];
    lines.splice(lineIndex + (direction === 'down' ? 1 : 0), 0, lineToCopy);
    
    handleCodeChange(lines.join('\n'));
  };

  const handleDeleteLine = () => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const { lines, lineIndex } = getLineInfo(value, selectionStart);
    
    lines.splice(lineIndex, 1);
    handleCodeChange(lines.join('\n'));
    // Cursor adjustment happens automatically by React state update usually, but explicit sets help
    setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart;
        }
    }, 0);
  };
  const SESSION_KEY = `cloudcode_session_${project.id}`;
  const isMobile = window.innerWidth < 768;

  const loadSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load session", e); }
    return null;
  };

  const session = loadSession();
  const [files, setFiles] = useState<File[]>(session?.files || project.files);
  const [activeFileId, setActiveFileId] = useState<string>(session?.activeFileId || project.files[0]?.id || '');
  
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [creatingFileName, setCreatingFileName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Multi-Terminal State
  const [terminals, setTerminals] = useState<{ id: string, name: string, content: string }[]>(session?.terminals || [{ id: '1', name: 'Terminal 1', content: '' }]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>(session?.activeTerminalId || '1');
  const [activePanel, setActivePanel] = useState<'terminal' | 'preview' | 'problems'>('terminal');
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const [hasError, setHasError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStats, setExecutionStats] = useState<{time: string, memory: string} | null>(null);
  const [userInput, setUserInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<EditorSettings>(userSettings);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const [activeSidebarView, setActiveSidebarView] = useState<'files' | 'extensions' | 'git' | 'docker'>(session?.activeSidebarView || 'files');
  const [sidebarWidth, setSidebarWidth] = useState(session?.sidebarWidth || (isMobile ? 0 : 250));
  const [isResizing, setIsResizing] = useState(false);
  
  const [installingExt, setInstallingExt] = useState<string | null>(null);
  const [searchExtQuery, setSearchExtQuery] = useState('');

  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  const [hoverState, setHoverState] = useState<{ visible: boolean; x: number; y: number; content: React.ReactNode | null }>({ visible: false, x: 0, y: 0, content: null });
  const [charWidth, setCharWidth] = useState(8.4);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [historyMap, setHistoryMap] = useState<Record<string, { stack: string[], index: number }>>({});
  const isUndoRedoRef = useRef(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);
  const [cursors, setCursors] = useState<number[]>([]);
  const prevSelectionRef = useRef<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'info' | 'success' | 'error' }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);
  const code = activeFile?.content || '';

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()));

  useEffect(() => {
    setSettings(userSettings);
  }, [userSettings]);

  useEffect(() => {
    const sessionData = {
      files,
      activeFileId,
      activeSidebarView,
      sidebarWidth,
      activePanel,
      terminals,
      activeTerminalId
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, [files, activeFileId, activeSidebarView, sidebarWidth, activePanel, terminals, activeTerminalId, SESSION_KEY]);

  useEffect(() => {
    if (measureRef.current) {
      const width = measureRef.current.getBoundingClientRect().width;
      if (width > 0) setCharWidth(width);
    }
  }, [settings.fontSize, settings.fontFamily]);

  // Auto-Save Effect
  useEffect(() => {
      if (!autoSaveEnabled || !hasAnyChanges) return;

      const timer = setTimeout(() => {
          handleSave(true); // silent save
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
  }, [files, autoSaveEnabled]);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  useEffect(() => {
    if (isCreatingFile && createInputRef.current) {
        createInputRef.current.focus();
    }
  }, [isCreatingFile]);

  useEffect(() => {
    if (renamingFileId && renameInputRef.current) {
        renameInputRef.current.focus();
    }
  }, [renamingFileId]);

  const isFileDirty = (fileId: string) => {
    const currentFile = files.find(f => f.id === fileId);
    const originalFile = project.files.find(f => f.id === fileId);
    if (currentFile && !originalFile) return true;
    if (!currentFile) return false;
    return currentFile.content !== originalFile?.content;
  };

  const hasAnyChanges = useMemo(() => {
    return files.some(f => isFileDirty(f.id)) || files.length !== project.files.length;
  }, [files, project.files]);

  useEffect(() => {
    if (activeFileId && !historyMap[activeFileId]) {
      setHistoryMap(prev => ({
        ...prev,
        [activeFileId]: { stack: [activeFile?.content || ''], index: 0 }
      }));
    }
    setCursors([]);
  }, [activeFileId]);

  const detectLanguage = (fileName: string): Language => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return Language.JAVASCRIPT;
      case 'py': return Language.PYTHON;
      case 'java': return Language.JAVA;
      case 'c': return Language.C;
      case 'cpp': return Language.CPP;
      case 'html': return Language.HTML;
      case 'sql': return Language.SQL;
      case 'css': return Language.CSS;
      case 'json': return Language.JSON;
      case 'md': return Language.MARKDOWN;
      case 'txt': return Language.PLAINTEXT;
      default: 
        if (fileName === 'Dockerfile') return Language.DOCKERFILE;
        return Language.PLAINTEXT;
    }
  };

  const lintCode = useCallback((code: string, lang: Language) => {
    const diags: Diagnostic[] = [];
    if (!installedExtensions.includes('eslint') && lang === Language.JAVASCRIPT) return;
    if (!installedExtensions.includes('python') && lang === Language.PYTHON) return;
    if (!installedExtensions.includes('docker') && lang === Language.DOCKERFILE) return;

    const lines = code.split('\n');
    lines.forEach((line, i) => {
      if (lang === Language.JAVASCRIPT) {
        if (line.includes('var ') && !line.includes('//')) {
          diags.push({ line: i + 1, message: 'Unexpected var, use let or const.', severity: 'warning', startColumn: line.indexOf('var '), endColumn: line.indexOf('var ') + 3 });
        }
        if (line.includes('==') && !line.includes('===') && !line.includes('//')) {
           diags.push({ line: i + 1, message: 'Expected === and instead saw ==.', severity: 'warning', startColumn: line.indexOf('=='), endColumn: line.indexOf('==') + 2 });
        }
        if (line.trim().startsWith('const') && !line.includes('=') && !line.includes(';')) {
            diags.push({ line: i + 1, message: 'Missing initializer in const declaration.', severity: 'error' });
        }
        if (line.includes('debugger')) {
            diags.push({ line: i + 1, message: 'Unexpected debugger statement.', severity: 'warning' });
        }
      }
      if (lang === Language.PYTHON) {
        if ((line.trim().startsWith('if ') || line.trim().startsWith('def ') || line.trim().startsWith('class ') || line.trim().startsWith('for ') || line.trim().startsWith('while ')) && !line.trim().endsWith(':')) {
           diags.push({ line: i + 1, message: 'Expected ":"', severity: 'error', endColumn: line.length });
        }
      }
       if (lang === Language.DOCKERFILE && i === 0 && !line.toUpperCase().startsWith('FROM') && !line.startsWith('#')) {
          diags.push({ line: i + 1, message: 'Dockerfile should start with FROM instruction', severity: 'error' });
       }
       if (line.trimEnd().length !== line.length && line.length > 0) {
          diags.push({ line: i + 1, message: 'Trailing spaces not allowed', severity: 'info' });
       }
    });
    setDiagnostics(diags);
  }, [installedExtensions]);

  const handleCodeChange = (newCode: string, isUndoRedo = false) => {
    if (!activeFile) return;

    const newFiles = files.map(f => f.id === activeFileId ? { ...f, content: newCode } : f);
    setFiles(newFiles);
    lintCode(newCode, activeFile.language);

    if (isUndoRedo || isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      setHistoryMap(prev => {
        const currentHist = prev[activeFileId] || { stack: [activeFile.content], index: 0 };
        if (currentHist.stack[currentHist.index] === newCode) return prev;
        const newStack = currentHist.stack.slice(0, currentHist.index + 1);
        newStack.push(newCode);
        return {
          ...prev,
          [activeFileId]: { stack: newStack, index: newStack.length - 1 }
        };
      });
    }, 750);
    return () => clearTimeout(timeoutId);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingFileName.trim()) {
        setIsCreatingFile(false);
        return;
    }
    const newFile: File = {
        id: Date.now().toString(),
        name: creatingFileName,
        language: detectLanguage(creatingFileName),
        content: ''
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setCreatingFileName('');
  };

  const handleRenameFileSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!renamingFileId || !renameValue.trim()) {
          setRenamingFileId(null);
          return;
      }
      setFiles(files.map(f => f.id === renamingFileId ? { ...f, name: renameValue, language: detectLanguage(renameValue) } : f));
      setRenamingFileId(null);
      setRenameValue('');
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (files.length <= 1) {
          alert("Cannot delete the last file.");
          return;
      }
      if (confirm("Are you sure you want to delete this file?")) {
          const newFiles = files.filter(f => f.id !== id);
          setFiles(newFiles);
          if (activeFileId === id) setActiveFileId(newFiles[0].id);
      }
  };

  const handleDuplicateFile = (e: React.MouseEvent, file: File) => {
      e.stopPropagation();
      const parts = file.name.split('.');
      const ext = parts.pop();
      const name = parts.join('.');
      const newName = `${name}_copy.${ext}`;
      const newFile: File = {
          id: Date.now().toString(),
          name: newName,
          language: file.language,
          content: file.content
      };
      const index = files.findIndex(f => f.id === file.id);
      const newFiles = [...files];
      newFiles.splice(index + 1, 0, newFile);
      setFiles(newFiles);
  };

  const handleUndo = () => {
    if (!activeFile) return;
    const hist = historyMap[activeFileId];
    if (hist && hist.index > 0) {
      isUndoRedoRef.current = true;
      const newIndex = hist.index - 1;
      const newCode = hist.stack[newIndex];
      handleCodeChange(newCode, true);
      setHistoryMap(prev => ({
        ...prev,
        [activeFileId]: { ...hist, index: newIndex }
      }));
    }
  };

  const handleRedo = () => {
    if (!activeFile) return;
    const hist = historyMap[activeFileId];
    if (hist && hist.index < hist.stack.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = hist.index + 1;
      const newCode = hist.stack[newIndex];
      handleCodeChange(newCode, true);
      setHistoryMap(prev => ({
        ...prev,
        [activeFileId]: { ...hist, index: newIndex }
      }));
    }
  };

  const toggleExtension = (id: string) => {
       if (installedExtensions.includes(id)) {
        onExtensionChange(installedExtensions.filter(e => e !== id));
       } else {
        setInstallingExt(id);
        setTimeout(() => { onExtensionChange([...installedExtensions, id]); setInstallingExt(null); }, 500);
       }
  };

  const handleRun = async () => {
    if (!activeFile) return;
    if (activeFile.language === Language.HTML) {
        setIsRunning(true);
        setActivePanel('preview');
        const blob = new Blob([activeFile.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setIsRunning(false);
        return;
    }
    
    // Switch to active terminal or create one if none
    if (terminals.length === 0) {
        setTerminals([{ id: '1', name: 'Terminal 1', content: '' }]);
        setActiveTerminalId('1');
    }
    
    setIsRunning(true);
    setActivePanel('terminal');
    setIsPanelVisible(true);
    
    const startMsg = `\n> Compiling and Executing ${activeFile.name}...\n`;
    updateActiveTerminal(startMsg);
    
    setHasError(false);
    setExecutionStats(null);
    
    const result = await executeCode(files, activeFileId, userInput);
    
    updateActiveTerminal(result.output + '\n');
    
    setHasError(result.error || false);
    setExecutionStats({ time: result.executionTime || '0s', memory: result.memoryUsage || '0MB' });
    setIsRunning(false);
  };
  
  const updateActiveTerminal = (text: string) => {
      setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, content: t.content + text } : t));
  };
  
  const handleFormat = () => {
      if (installedExtensions.includes('prettier') && activeFile) {
          const formatted = activeFile.content.split('\n').map(line => line.trim()).join('\n'); 
          showToast("Prettier: Formatted document", 'success');
      }
  };

  const handleSave = (silent = false) => {
    onSave({ ...project, files, lastModified: Date.now() });
    if (!silent) {
        showToast("Project Saved Successfully", 'success');
    } else {
        showToast("Auto-Saved to Cloud", 'info');
    }
  };
  
  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach(file => zip.file(file.name, file.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { showToast("Export failed", 'error'); }
  };

  const handleShare = () => {
    const projectData = {
        name: project.name,
        language: project.language,
        files: files
    };
    const json = JSON.stringify(projectData);
    const base64 = btoa(json);
    const link = `${window.location.origin}${window.location.pathname}#share=${base64}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  const toggleTheme = () => {
     const newTheme = settings.theme === 'theme-light' ? 'theme-dark' : 'theme-light';
     const newSettings = { ...settings, theme: newTheme };
     setSettings(newSettings);
     onUpdateSettings(newSettings);
  };

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const resize = (e: MouseEvent) => { if (isResizing) setSidebarWidth(e.clientX - 48); };
  useEffect(() => { window.addEventListener('mousemove', resize); window.addEventListener('mouseup', stopResizing); return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); }; }, [isResizing]);
  
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleSnippetInsert = (snippetCode: string) => {
    if (!textareaRef.current || !activeFile) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const value = textareaRef.current.value;
    const selection = value.substring(start, end);
    
    let insertion = snippetCode;
    let cursorOffset = -1;

    if (insertion.includes('|')) {
        cursorOffset = insertion.indexOf('|');
        insertion = insertion.replace('|', '');
    }

    if (selection) {
        if (insertion.includes('\n') && cursorOffset !== -1) {
            const indentedSelection = selection.split('\n').join('\n  ');
            insertion = insertion.slice(0, cursorOffset) + indentedSelection + insertion.slice(cursorOffset);
            cursorOffset += selection.length; 
        } else {
           insertion = insertion.slice(0, cursorOffset) + selection + insertion.slice(cursorOffset);
           cursorOffset += selection.length;
        }
    }
    
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLinePrefix = value.substring(lineStart, start);
    const indentMatch = currentLinePrefix.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    
    if (insertion.includes('\n')) {
       insertion = insertion.split('\n').map((line, i) => i === 0 ? line : indent + line).join('\n');
    }

    const newValue = value.substring(0, start) + insertion + value.substring(end);
    handleCodeChange(newValue);
    setIsPaletteOpen(false);
    
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            let newCursorPos = start + insertion.length;
            if (cursorOffset !== -1) {
                newCursorPos = start + cursorOffset;
            }
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
        }
    }, 0);
  };

  const highlightedCode = useMemo(() => {
    if (!activeFile) return '';
    let html = '';
    const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    if (activeFile.language === Language.PLAINTEXT) {
      html = escapeHtml(code);
    } else {
      const langKey = activeFile.language === Language.HTML ? 'markup' : activeFile.language;
      const grammar = Prism.languages[langKey] || Prism.languages.clike;
      html = Prism.highlight(code, grammar, langKey);
    }

    if (installedExtensions.includes('bracket-pair-colorizer')) {
        const colors = ['#FFD700', '#DA70D6', '#179fff']; 
        let level = 0;
        html = html.replace(/<span class="token punctuation">([(){}[\]])<\/span>/g, (match, char) => {
            const isOpen = '({['.includes(char);
            if (isOpen) {
                const color = colors[level % colors.length];
                level++;
                return `<span class="token punctuation" style="color: ${color}">${char}</span>`;
            } else {
                level = Math.max(0, level - 1);
                const color = colors[level % colors.length];
                return `<span class="token punctuation" style="color: ${color}">${char}</span>`;
            }
        });
    }

    return html.split('\n').join('\n');
  }, [code, activeFile, installedExtensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;
      
      const rect = textareaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 48; 
      const y = e.clientY - rect.top;
      
      const lineHeight = parseFloat(getComputedStyle(textareaRef.current).lineHeight);
      const lineIndex = Math.floor((y + textareaRef.current.scrollTop) / lineHeight);
      const colIndex = Math.floor((x + textareaRef.current.scrollLeft) / charWidth);
      
      const lines = code.split('\n');
      if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          
          const error = diagnostics.find(d => d.line === lineIndex + 1);
          if (error) {
              setHoverState({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY + 20,
                  content: (
                      <div>
                          <div className="flex items-center gap-1 text-red-400 font-bold mb-1"><AlertTriangle size={12}/> Error</div>
                          <div>{error.message}</div>
                      </div>
                  )
              });
              return;
          }

          const words = line.split(/[\s,().;]+/);
          let currentLen = 0;
          for (const word of words) {
              if (colIndex >= currentLen && colIndex < currentLen + word.length) {
                 const doc = DOCS[word];
                 if (doc) {
                     setHoverState({
                         visible: true,
                         x: e.clientX,
                         y: e.clientY + 20,
                         content: (
                             <div>
                                 <div className="hover-code">{word}</div>
                                 <div className="hover-desc">{doc}</div>
                             </div>
                         )
                     });
                     return;
                 }
                 if (activeFile) {
                    const defRegex = new RegExp(`(const|let|var|function|class)\\s+${word}\\s*(=|\\()`);
                    const match = activeFile.content.match(defRegex);
                    if (match) {
                        const defLine = activeFile.content.substring(match.index!, activeFile.content.indexOf('\n', match.index!));
                         setHoverState({
                             visible: true,
                             x: e.clientX,
                             y: e.clientY + 20,
                             content: (
                                 <div>
                                     <div className="text-xs text-gray-500 mb-1">Definition found:</div>
                                     <div className="hover-code">{defLine}</div>
                                 </div>
                             )
                         });
                         return;
                    }
                 }
              }
              currentLen += word.length + 1; 
          }
      }
      setHoverState(prev => ({ ...prev, visible: false }));
  };
  
  const handleMouseLeave = () => { setHoverState(prev => ({ ...prev, visible: false })); };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (e.altKey && textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          setCursors(prev => [...prev, start]);
      }
      prevSelectionRef.current = textareaRef.current?.selectionStart || null;
      updateSuggestions();
  };

// Replace your handleSelect with this more robust version
const updateSuggestions = () => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    
    // Get text before cursor
    const textBeforeCaret = value.substring(0, selectionStart);
    const lineStart = textBeforeCaret.lastIndexOf('\n') + 1;
    const currentLineToCursor = textBeforeCaret.substring(lineStart);
    
    // Regex to find the word being typed right now
    const match = currentLineToCursor.match(/([a-zA-Z0-9_]+)$/);
    
    if (match) {
        const word = match[1];
        // Don't show suggestions for short words to avoid annoyance
        if (word.length < 1) { 
            setShowSuggestions(false); 
            return; 
        }

        const langKeywords = KEYWORDS[activeFile?.language as Language] || [];
        
        // Scan current file for local variables (basic tokenizer)
        const localVars = value.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        const uniqueLocal = Array.from(new Set(localVars));
        
        // Combine keywords + local variables
        const allSuggestions = Array.from(new Set([...langKeywords, ...uniqueLocal]));
        
        // Filter
        const filtered = allSuggestions.filter(s => s.startsWith(word) && s !== word);
        
        if (filtered.length > 0) {
            setSuggestions(filtered);
            setSuggestionIndex(0);
            setShowSuggestions(true);
            
            // Calculate position
            const lines = textBeforeCaret.split('\n');
            const currentLineIndex = lines.length - 1;
            const top = (currentLineIndex + 1) * 21; // 21px line height approximation
            const left = (currentLineToCursor.length) * charWidth + 48; // 48px sidebar offset
            setSuggestionPos({ top, left });
        } else {
            setShowSuggestions(false);
        }
    } else {
        setShowSuggestions(false);
    }
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. GLOBAL EDITOR SHORTCUTS
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); } // Windows standard redo
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') { e.preventDefault(); setIsPaletteOpen(true); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setIsQuickOpenOpen(true); } 
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setSidebarWidth(prev => prev === 0 ? 250 : 0); }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); setIsPanelVisible(prev => !prev); }
    if (e.altKey && e.shiftKey && e.key === 'f') { e.preventDefault(); handleFormat(); }
    
    // 2. VS CODE SPECIFIC LINE MANIPULATION
    // Toggle Comment (Ctrl + /)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') { 
        handleToggleComment(e); 
    }

    // Move Line Up/Down (Alt + Up/Down)
    if (e.altKey && !e.shiftKey) {
        if (e.key === 'ArrowUp') { e.preventDefault(); handleMoveLine('up'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleMoveLine('down'); }
    }

    // Duplicate Line (Shift + Alt + Up/Down)
    if (e.altKey && e.shiftKey) {
        if (e.key === 'ArrowUp') { e.preventDefault(); handleDuplicateLine('up'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleDuplicateLine('down'); }
    }

    // Delete Line (Ctrl + Shift + K)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault();
        handleDeleteLine();
    }

    // 3. EDITING BEHAVIOR
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      handleCodeChange(newValue);
      setTimeout(() => { if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2; }, 0);
    }
    
    if (installedExtensions.includes('auto-close-brackets')) {
        const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
        if (pairs[e.key]) {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const value = e.currentTarget.value;
            const close = pairs[e.key];
            const newValue = value.substring(0, start) + e.key + close + value.substring(end);
            handleCodeChange(newValue);
             setTimeout(() => { if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1; }, 0);
             return;
        }
    }

    // 4. AUTOCOMPLETE NAVIGATION
    if (showSuggestions) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(prev => (prev + 1) % suggestions.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); }
        else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            // Insert suggestion logic
            const wordToInsert = suggestions[suggestionIndex];
            const start = e.currentTarget.selectionStart;
            const value = e.currentTarget.value;
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLineToCursor = value.substring(lineStart, start);
            const match = currentLineToCursor.match(/([a-zA-Z0-9_]+)$/);
            if (match) {
                const wordStart = start - match[1].length;
                const newValue = value.substring(0, wordStart) + wordToInsert + value.substring(start);
                handleCodeChange(newValue);
                setShowSuggestions(false);
                 // Reset cursor to end of inserted word
                setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = wordStart + wordToInsert.length;
                }, 0);
            }
        } else if (e.key === 'Escape') { setShowSuggestions(false); }
    }
    
    if (isPaletteOpen || isQuickOpenOpen) {
        if (e.key === 'Escape') { e.preventDefault(); setIsPaletteOpen(false); setIsQuickOpenOpen(false); }
    }
  };
  
  const getFileIcon = (file: File) => {
      if (installedExtensions.includes('vscode-icons')) {
          const colors: Record<Language, string> = {
              [Language.JAVASCRIPT]: 'text-yellow-400',
              [Language.PYTHON]: 'text-blue-400',
              [Language.HTML]: 'text-orange-500',
              [Language.CSS]: 'text-blue-300',
              [Language.JSON]: 'text-yellow-200',
              [Language.JAVA]: 'text-red-400',
              [Language.C]: 'text-blue-500',
              [Language.CPP]: 'text-purple-500',
              [Language.SQL]: 'text-green-400',
              [Language.MARKDOWN]: 'text-white',
              [Language.DOCKERFILE]: 'text-blue-600',
              [Language.PLAINTEXT]: 'text-gray-400',
          };
          return <FileCode size={14} className={`shrink-0 ${colors[file.language] || 'text-gray-400'}`} />;
      }
      return <FileCode size={14} className="text-gray-400 shrink-0" />; 
  };

  const editorStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}px`, 
    lineHeight: '1.5',
    whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
    fontFamily: settings.fontFamily || '"Fira Code", monospace'
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <div ref={measureRef} className="absolute invisible code-font pointer-events-none" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>M</div>
      
      {/* Toast Container */}
      <div className="toast-container">
          {toasts.map(t => (
              <div key={t.id} className="toast" style={{ borderLeftColor: t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#22c55e' : 'var(--accent)' }}>
                  {t.type === 'error' ? <AlertTriangle size={16} className="text-red-500"/> : t.type === 'success' ? <Check size={16} className="text-green-500"/> : <Bot size={16} className="text-accent-500"/>}
                  {t.message}
              </div>
          ))}
      </div>

      {/* Header */}
      <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-2 md:px-4 shrink-0 z-20">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white" onClick={() => setSidebarWidth(prev => prev === 0 ? 250 : 0)} title="Toggle Sidebar (Ctrl+B)">
             <Menu size={18}/>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-100"><ArrowLeft size={18} /></button>
          
          <div className="flex items-center gap-1 mx-2 text-gray-400">
             <button onClick={handleUndo} className="p-1.5 hover:bg-gray-800 rounded hover:text-white" title="Undo (Ctrl+Z)"><Undo size={16}/></button>
             <button onClick={handleRedo} className="p-1.5 hover:bg-gray-800 rounded hover:text-white" title="Redo (Ctrl+Shift+Z)"><Redo size={16}/></button>
          </div>

          <div>
            <h2 className="font-semibold text-sm leading-tight flex items-center gap-2 text-gray-100">
              {project.name} {hasAnyChanges && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
           <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md" title="Toggle Theme">
              {settings.theme === 'theme-light' ? <Moon size={16} /> : <Sun size={16} />}
           </button>
           <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md hidden sm:block" title="Toggle Fullscreen">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
           </button>
           <button onClick={handleShare} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md" title="Share Project">
              <Share2 size={16} />
           </button>
           <button onClick={() => handleSave()} className="flex items-center gap-2 px-3 py-1.5 bg-accent-600/10 hover:bg-accent-600/20 text-accent-500 rounded-md text-sm font-medium transition-colors border border-accent-600/20"><Save size={16} /> <span className="hidden md:inline">Save</span></button>
           <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md"><Settings size={16} /></button>
           <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95">{isRunning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={16} fill="currentColor" />}<span className="hidden md:inline">Run</span></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex shrink-0 h-full transition-transform duration-300 absolute md:relative z-30 ${isMobile && sidebarWidth === 0 ? '-translate-x-full' : 'translate-x-0'}`} style={{ height: '100%' }}>
            
            {/* Activity Bar */}
            <div className="w-12 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-4 shrink-0">
                <button onClick={() => setActiveSidebarView('files')} className={`p-2 rounded-lg transition-colors ${activeSidebarView === 'files' ? 'text-gray-100 border-l-2 border-accent-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}><Files size={24} strokeWidth={1.5} /></button>
                <button onClick={() => setActiveSidebarView('extensions')} className={`p-2 rounded-lg transition-colors ${activeSidebarView === 'extensions' ? 'text-gray-100 border-l-2 border-accent-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}><Blocks size={24} strokeWidth={1.5} /></button>
                {installedExtensions.includes('gitlens') && (
                     <button onClick={() => setActiveSidebarView('git')} className={`p-2 rounded-lg transition-colors ${activeSidebarView === 'git' ? 'text-gray-100 border-l-2 border-accent-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}><GitGraph size={24} strokeWidth={1.5} /></button>
                )}
                {installedExtensions.includes('docker') && (
                     <button onClick={() => setActiveSidebarView('docker')} className={`p-2 rounded-lg transition-colors ${activeSidebarView === 'docker' ? 'text-gray-100 border-l-2 border-accent-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}><Container size={24} strokeWidth={1.5} /></button>
                )}
            </div>

            {/* Sidebar Panel */}
            <div style={{ width: sidebarWidth }} className="bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-hidden transition-all duration-300">
             {activeSidebarView === 'files' && (
                <>
                <div className="h-9 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center bg-gray-900 z-10 select-none border-b border-gray-800">
                    <span>Explorer</span>
                    <button onClick={() => setIsCreatingFile(true)} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-100" title="New File"><Plus size={16}/></button>
                </div>
                
                <div className="p-2 border-b border-gray-800 bg-gray-900/50">
                    <div className="relative">
                        <Search className="absolute left-2 top-2 text-gray-500 w-3 h-3"/>
                        <input 
                            type="text" 
                            className="w-full bg-gray-950 border border-gray-800 rounded-md py-1 pl-7 pr-2 text-xs text-gray-300 focus:outline-none focus:border-accent-500" 
                            placeholder="Search files..."
                            value={fileSearchQuery}
                            onChange={e => setFileSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isCreatingFile && (
                        <form onSubmit={handleCreateFileSubmit} className="flex items-center px-4 py-1 border-l-2 border-accent-500 bg-gray-800/50">
                            <FileCode size={14} className="text-gray-400 mr-2 shrink-0" />
                            <input 
                                ref={createInputRef}
                                type="text" 
                                value={creatingFileName}
                                onChange={(e) => setCreatingFileName(e.target.value)}
                                className="explorer-input"
                                placeholder="filename.js"
                                onBlur={() => { if(!creatingFileName) setIsCreatingFile(false); }}
                            />
                        </form>
                    )}

                    {filteredFiles.map(file => (
                    <div 
                        key={file.id} 
                        onClick={() => setActiveFileId(file.id)} 
                        className={`group flex items-center justify-between px-4 py-1 text-sm cursor-pointer border-l-2 transition-colors relative ${activeFileId === file.id ? 'bg-gray-800 border-accent-500 text-gray-100' : 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
                    >
                        {renamingFileId === file.id ? (
                            <form onSubmit={handleRenameFileSubmit} className="flex items-center flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                {getFileIcon(file)}
                                <input 
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    className="explorer-input ml-2"
                                    onBlur={() => setRenamingFileId(null)}
                                />
                            </form>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                    {getFileIcon(file)}
                                    <span className={`truncate ${isFileDirty(file.id) ? 'text-yellow-500' : ''}`}>{file.name}</span>
                                    {isFileDirty(file.id) && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-auto mr-1"></span>}
                                </div>
                                
                                <div className="hidden group-hover:flex items-center gap-1 bg-gray-800 shadow-[-10px_0_10px_-5px_rgba(31,41,55,1)] ml-2">
                                    <button onClick={(e) => { e.stopPropagation(); setRenamingFileId(file.id); setRenameValue(file.name); }} className="p-1 hover:text-white hover:bg-gray-700 rounded" title="Rename"><Edit2 size={12}/></button>
                                    <button onClick={(e) => handleDuplicateFile(e, file)} className="p-1 hover:text-white hover:bg-gray-700 rounded" title="Duplicate"><Copy size={12}/></button>
                                    <button onClick={(e) => handleDeleteFile(e, file.id)} className="p-1 hover:text-red-400 hover:bg-gray-700 rounded" title="Delete"><Trash2 size={12}/></button>
                                </div>
                            </>
                        )}
                    </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-800 space-y-2">
                    <button onClick={handleExportZip} className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-100 py-1"><Download size={12} /> Export ZIP</button>
                    <button onClick={handleShare} className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-100 py-1"><Share2 size={12} /> Share Project</button>
                </div>
                </>
            )}

            {activeSidebarView === 'extensions' && (
                <div className="flex flex-col h-full">
                     <div className="p-4 border-b border-gray-800">
                         <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Extensions</h3>
                         <div className="relative">
                             <Search className="absolute left-2 top-2.5 text-gray-500 w-4 h-4"/>
                             <input type="text" placeholder="Search Marketplace" value={searchExtQuery} onChange={e => setSearchExtQuery(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded py-2 pl-8 pr-2 text-sm text-gray-300 focus:outline-none focus:border-accent-500"/>
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2">
                         {MARKETPLACE_EXTENSIONS.filter(ex => ex.name.toLowerCase().includes(searchExtQuery.toLowerCase())).map(ext => (
                             <div key={ext.id} className="p-3 mb-2 rounded bg-gray-950 border border-gray-800 hover:border-accent-500/50 flex gap-3">
                                 <div className="text-2xl pt-1">{ext.icon}</div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start">
                                         <h4 className="font-bold text-sm text-gray-200 truncate">{ext.name}</h4>
                                     </div>
                                     <p className="text-xs text-gray-500 line-clamp-2 my-1">{ext.description}</p>
                                     <div className="flex items-center justify-between mt-2">
                                         <span className="text-[10px] text-gray-600">{ext.downloads} • {ext.author}</span>
                                         <button onClick={() => toggleExtension(ext.id)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${installedExtensions.includes(ext.id) ? 'bg-gray-800 text-gray-300' : 'bg-accent-600 text-white hover:bg-accent-500'}`}>
                                            {installingExt === ext.id ? 'Installing...' : (installedExtensions.includes(ext.id) ? 'Installed' : 'Install')}
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            )}
            
            {activeSidebarView === 'git' && (
                <div className="flex flex-col h-full p-4">
                     <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Source Control</h3>
                     <div className="flex-1 overflow-y-auto">
                        {hasAnyChanges ? (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-400 mb-2">Changes</p>
                                {files.filter(f => isFileDirty(f.id)).map(f => (
                                    <div key={f.id} onClick={() => setActiveFileId(f.id)} className="flex items-center gap-2 text-sm text-gray-300 hover:bg-gray-800 p-1 rounded cursor-pointer">
                                        <span className="text-yellow-500">M</span>
                                        {f.name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-sm italic">No changes detected.</div>
                        )}
                     </div>
                </div>
            )}
            
            {activeSidebarView === 'docker' && (
                <div className="flex flex-col h-full p-4">
                     <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Containers</h3>
                     <div className="bg-green-900/20 border border-green-900/50 p-3 rounded flex items-center gap-3">
                         <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                         <div>
                             <div className="text-sm font-bold text-gray-200">cloud-runner-v1</div>
                             <div className="text-xs text-gray-500">Up 2 hours • 28MB</div>
                         </div>
                     </div>
                </div>
            )}

            </div>
            {!isMobile && <div className="w-1 hover:bg-accent-500 cursor-col-resize transition-colors bg-gray-950/50 z-10" onMouseDown={startResizing}></div>}
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-gray-950 relative z-10">
          {/* File Tabs */}
          <div className="flex bg-gray-950 border-b border-gray-800 overflow-x-auto no-scrollbar">
            {files.map(file => (
              <div key={file.id} onClick={() => setActiveFileId(file.id)} className={`group flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-800 min-w-[120px] max-w-[200px] cursor-pointer select-none relative ${activeFileId === file.id ? 'bg-gray-900 text-gray-100 border-t-2 border-t-accent-500' : 'text-gray-500 hover:bg-gray-900/50'}`}>
                {getFileIcon(file)} 
                <span className={`truncate ${isFileDirty(file.id) ? 'text-yellow-500' : ''}`}>{file.name}</span>
                {isFileDirty(file.id) && <span className="absolute right-2 top-3 w-2 h-2 rounded-full bg-yellow-500"></span>}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(e, file.id); }} 
                    className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                >
                    <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 relative flex">
            {activeFile ? (
              <div className="relative flex-1 h-full editor-overlay">
                <div className={`relative flex-1 h-full overflow-hidden ${settings.showLineNumbers ? 'ml-12' : ''}`}>
                  
                  {settings.showLineNumbers && (
                      <div ref={lineNumbersRef} className="absolute left-[-48px] top-0 w-12 text-right pr-2 text-gray-600 select-none bg-gray-950 h-full overflow-hidden" style={{ ...editorStyle, color: 'var(--line-num-fg)', backgroundColor: 'var(--line-num-bg)', borderRight: '1px solid var(--bg-overlay)' }}>
                        {code.split('\n').map((_, i) => (
                           <div key={i} style={{ height: '1.5em' }}>{i + 1}</div>
                        ))}
                      </div>
                  )}

                  <pre ref={preRef} aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden editor-layer" style={editorStyle}>
                    <code className={`language-${activeFile.language === Language.HTML ? 'markup' : activeFile.language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                    {cursors.map((pos, idx) => {
                         const textBefore = code.substring(0, pos);
                         const lines = textBefore.split('\n');
                         const lineIdx = lines.length - 1;
                         const colIdx = lines[lineIdx].length;
                         return (
                             <div key={idx} className="cursor-caret" style={{ top: `${lineIdx * 1.5}em`, left: `${colIdx * charWidth}px`, height: '1.5em' }}></div>
                         );
                    })}
                  </pre>
                  <textarea 
                      ref={textareaRef} 
                      value={code} 
                      onChange={(e) => { handleCodeChange(e.target.value); }}
                      onScroll={handleScroll} 
                      onKeyDown={handleKeyDown}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onMouseUp={handleMouseUp}
                      className="absolute inset-0 w-full h-full resize-none border-none outline-none editor-layer" 
                      style={{ ...editorStyle, overflow: 'auto' }} 
                      spellCheck={false} 
                      autoComplete="off" 
                      autoCorrect="off" 
                      autoCapitalize="off" 
                  />
                  
                  {hoverState.visible && hoverState.content && (
                      <div className="fixed hover-card" style={{ top: hoverState.y, left: hoverState.x }}>
                          {hoverState.content}
                      </div>
                  )}
                  
                  {showSuggestions && (
                      <div className="suggestions-popup" style={{ top: suggestionPos.top, left: suggestionPos.left }}>
                          {suggestions.map((s, i) => (
                              <div key={s} className={`suggestion-item ${i === suggestionIndex ? 'active' : ''}`} onClick={() => {
                                  const wordToInsert = s;
                                  const start = textareaRef.current!.selectionStart;
                                  const value = textareaRef.current!.value;
                                  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                                  const currentLineToCursor = value.substring(lineStart, start);
                                  const match = currentLineToCursor.match(/([a-zA-Z0-9_]+)$/);
                                  if (match) {
                                      const wordStart = start - match[1].length;
                                      const newValue = value.substring(0, wordStart) + wordToInsert + value.substring(start);
                                      handleCodeChange(newValue);
                                      setShowSuggestions(false);
                                  }
                              }}>
                                  <span className="opacity-50 text-[10px] mr-2">VAR</span>
                                  {s}
                              </div>
                          ))}
                      </div>
                  )}
                  
                  {installedExtensions.includes('gitlens') && (
                      <div className="absolute right-4 top-0 text-xs text-gray-600 pointer-events-none mt-1 opacity-50 italic">
                          You, just now • Uncommitted changes
                      </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">Select a file to edit</div>
            )}
          </div>
          
           {/* Command Palette Overlay */}
           {isPaletteOpen && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20" onClick={() => setIsPaletteOpen(false)}>
                  <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]" onClick={e => e.stopPropagation()}>
                      <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                          <Command size={18} className="text-gray-400"/>
                          <input 
                            autoFocus
                            type="text" 
                            className="bg-transparent outline-none text-gray-100 flex-1 placeholder-gray-500" 
                            placeholder="Type a command..."
                            value={paletteQuery}
                            onChange={e => setPaletteQuery(e.target.value)}
                          />
                      </div>
                      <div className="flex-1 overflow-y-auto p-1">
                          <div className="text-xs font-bold text-gray-500 px-3 py-2 uppercase">System</div>
                          {[
                              { label: 'Run Code', icon: <Play size={14}/>, action: handleRun, shortcut: 'Ctrl+Enter' },
                              { label: 'Save Project', icon: <Save size={14}/>, action: () => handleSave(), shortcut: 'Ctrl+S' },
                              { label: 'Format Document', icon: <Zap size={14}/>, action: handleFormat, shortcut: 'Alt+Shift+F' },
                              { label: 'Toggle Fullscreen', icon: <Maximize size={14}/>, action: toggleFullscreen },
                          ].filter(cmd => cmd.label.toLowerCase().includes(paletteQuery.toLowerCase())).map((cmd, i) => (
                              <button key={i} onClick={() => { cmd.action(); setIsPaletteOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-accent-600 hover:text-white rounded flex items-center justify-between group text-sm text-gray-300">
                                  <div className="flex items-center gap-2">{cmd.icon} {cmd.label}</div>
                                  {cmd.shortcut && <span className="text-xs opacity-50 bg-gray-800 px-1 rounded group-hover:bg-accent-700">{cmd.shortcut}</span>}
                              </button>
                          ))}
                          
                          {(SNIPPETS[activeFile?.language || Language.JAVASCRIPT] || []).filter(s => s.label.toLowerCase().includes(paletteQuery.toLowerCase())).length > 0 && (
                             <div className="text-xs font-bold text-gray-500 px-3 py-2 uppercase mt-2">Snippets</div>
                          )}
                          {(SNIPPETS[activeFile?.language || Language.JAVASCRIPT] || []).filter(s => s.label.toLowerCase().includes(paletteQuery.toLowerCase())).map((s, i) => (
                             <button key={`s-${i}`} onClick={() => handleSnippetInsert(s.code)} className="w-full text-left px-3 py-2 hover:bg-accent-600 hover:text-white rounded flex items-center gap-2 text-sm text-gray-300">
                                 <Code2 size={14}/> {s.label}
                             </button>
                          ))}
                      </div>
                  </div>
              </div>
           )}

           {/* Quick Open Overlay */}
           {isQuickOpenOpen && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20" onClick={() => setIsQuickOpenOpen(false)}>
                  <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]" onClick={e => e.stopPropagation()}>
                      <div className="p-3 border-b border-gray-800 flex items-center gap-2">
                          <Search size={18} className="text-gray-400"/>
                          <input 
                            autoFocus
                            type="text" 
                            className="bg-transparent outline-none text-gray-100 flex-1 placeholder-gray-500" 
                            placeholder="Go to file..."
                            onChange={e => { setFileSearchQuery(e.target.value); }}
                          />
                      </div>
                      <div className="flex-1 overflow-y-auto p-1">
                          {filteredFiles.map((file, i) => (
                             <button key={file.id} onClick={() => { setActiveFileId(file.id); setIsQuickOpenOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-accent-600 hover:text-white rounded flex items-center gap-2 text-sm text-gray-300">
                                 {getFileIcon(file)} {file.name}
                             </button>
                          ))}
                      </div>
                  </div>
              </div>
           )}

          {/* Bottom Panel */}
          {isPanelVisible && (
          <div className="h-[40%] max-h-[300px] border-t border-gray-800 bg-gray-900 flex flex-col shrink-0">
             <div className="flex border-b border-gray-800 overflow-x-auto items-center">
                <div className="flex">
                    <button onClick={() => setActivePanel('terminal')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${activePanel === 'terminal' ? 'text-gray-100 border-b-2 border-accent-500' : 'text-gray-500 hover:text-gray-300'}`}>
                        <Terminal size={14} /> Terminal
                    </button>
                    <button onClick={() => setActivePanel('problems')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${activePanel === 'problems' ? 'text-gray-100 border-b-2 border-accent-500' : 'text-gray-500 hover:text-gray-300'}`}>
                        <AlertTriangle size={14} /> Problems {diagnostics.length > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{diagnostics.length}</span>}
                    </button>
                    {previewUrl && (
                        <button onClick={() => setActivePanel('preview')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${activePanel === 'preview' ? 'text-gray-100 border-b-2 border-accent-500' : 'text-gray-500 hover:text-gray-300'}`}>
                            <Globe size={14} /> Preview
                        </button>
                    )}
                </div>
                
                {activePanel === 'terminal' && (
                    <div className="flex items-center ml-4 gap-1 border-l border-gray-800 pl-4">
                        {terminals.map(t => (
                            <button key={t.id} onClick={() => setActiveTerminalId(t.id)} className={`px-2 py-1 text-xs rounded ${activeTerminalId === t.id ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}>
                                {t.name}
                            </button>
                        ))}
                        <button onClick={() => { const id = Date.now().toString(); setTerminals([...terminals, { id, name: `Terminal ${terminals.length + 1}`, content: '' }]); setActiveTerminalId(id); }} className="p-1 hover:bg-gray-800 rounded text-gray-500"><Plus size={12}/></button>
                    </div>
                )}
                
                <div className="ml-auto flex items-center pr-2 gap-2">
                    {installedExtensions.includes('python') && activeFile?.language === Language.PYTHON && (
                        <div className="text-xs text-blue-400 flex items-center gap-1"><img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" className="w-3 h-3"/> 3.10.2</div>
                    )}
                    <button onClick={() => setIsPanelVisible(false)} className="p-1 hover:bg-gray-800 rounded text-gray-500"><X size={14}/></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
                {activePanel === 'terminal' && (
                  <>
                     {executionStats && (
                         <div className="absolute top-2 right-4 text-xs text-gray-500 flex gap-4 pointer-events-none">
                             <span>Time: <span className="text-gray-300">{executionStats.time}</span></span>
                             <span>Mem: <span className="text-gray-300">{executionStats.memory}</span></span>
                         </div>
                     )}
                     <div className={`whitespace-pre-wrap min-h-full ${hasError ? 'text-red-400' : 'text-gray-300'}`}>
                        {terminals.find(t => t.id === activeTerminalId)?.content || <span className="text-gray-600 opacity-50">Ready to execute...</span>}
                     </div>
                  </>
                )}
                {activePanel === 'problems' && (
                    <div className="space-y-1">
                        {diagnostics.length > 0 ? diagnostics.map((d, i) => (
                            <div key={i} onClick={() => { /* Jump to line logic could go here */ }} className="flex gap-2 text-xs hover:bg-gray-800 p-1 cursor-pointer">
                                {d.severity === 'error' ? <AlertTriangle size={14} className="text-red-500 shrink-0"/> : <AlertTriangle size={14} className="text-yellow-500 shrink-0"/>}
                                <span className="text-gray-400">{activeFile?.name} [{d.line}, {d.startColumn || 0}]</span>
                                <span className="text-gray-300">{d.message}</span>
                            </div>
                        )) : <div className="text-gray-500 italic">No problems detected in workspace.</div>}
                    </div>
                )}
                 {activePanel === 'preview' && (
                    <div className="w-full h-full bg-white rounded-md overflow-hidden">
                        {previewUrl ? <iframe src={previewUrl} className="w-full h-full border-none" title="Preview" /> : <div className="text-gray-500 text-center pt-10">Run the code to see preview</div>}
                    </div>
                )}
             </div>
          </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowShareModal(false)}>
           <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-100"><Share2 size={18}/> Share Project</h3>
              <p className="text-sm text-gray-400 mb-4">Anyone with this link can view and import a copy of this project.</p>
              
              <div className="flex gap-2 mb-4">
                  <input type="text" readOnly value={shareLink} className="flex-1 bg-gray-950 border border-gray-700 rounded p-2 text-xs text-gray-300 outline-none select-all" />
                  <button onClick={() => { navigator.clipboard.writeText(shareLink); showToast("Link Copied!", 'success'); }} className="bg-accent-600 hover:bg-accent-500 text-white px-3 py-2 rounded text-xs font-bold">Copy</button>
              </div>
              
              <div className="flex justify-end">
                 <button onClick={() => setShowShareModal(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded text-sm">Close</button>
              </div>
           </div>
        </div>
      )}

      {showSettings && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
           <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-100"><Settings size={18}/> Editor Settings</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center"><label className="text-gray-300">Font Size</label><input type="number" value={settings.fontSize} onChange={e => setSettings({...settings, fontSize: Number(e.target.value)})} className="bg-gray-950 border border-gray-700 rounded p-1 w-16 text-center text-gray-100" /></div>
                 <div className="flex justify-between items-center"><label className="text-gray-300">Tab Size</label><input type="number" value={settings.tabSize} onChange={e => setSettings({...settings, tabSize: Number(e.target.value)})} className="bg-gray-950 border border-gray-700 rounded p-1 w-16 text-center text-gray-100" /></div>
                 <div className="flex justify-between items-center"><label className="text-gray-300">Word Wrap</label><input type="checkbox" checked={settings.wordWrap} onChange={e => setSettings({...settings, wordWrap: e.target.checked})} className="accent-accent-600 w-5 h-5" /></div>
                 <div className="flex justify-between items-center"><label className="text-gray-300">Line Numbers</label><input type="checkbox" checked={settings.showLineNumbers} onChange={e => setSettings({...settings, showLineNumbers: e.target.checked})} className="accent-accent-600 w-5 h-5" /></div>
                 <div className="flex justify-between items-center"><label className="text-gray-300">Auto Save</label><input type="checkbox" checked={autoSaveEnabled} onChange={e => setAutoSaveEnabled(e.target.checked)} className="accent-accent-600 w-5 h-5" /></div>
              </div>
              <div className="mt-6 flex justify-end"><button onClick={() => { onUpdateSettings(settings); setShowSettings(false); }} className="bg-accent-600 hover:bg-accent-500 px-4 py-2 rounded text-white text-sm font-medium">Done</button></div>
           </div>
        </div>
      )}
    </div>
  );
};
