import MonacoEditor, { loader, useMonaco } from "@monaco-editor/react";


import {
  AlertTriangle,
  ArrowLeft,
  Blocks,
  Bot,
  Check,
  Container,
  Copy,
  Download,
  Edit2,
  FileCode,
  Files,
  GitGraph,
  Globe,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Play,
  Plus,
  Save,
  Search,
  Settings,
  Share2,
  Sun,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { executeCode } from "../services/geminiService";
import { EditorSettings, File, Language, Project } from "../types";

import JSZip from "jszip";

// Pre-load Monaco loader from CDN to avoid bundler issues
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs" },
});

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
  {
    id: "eslint",
    name: "ESLint",
    description:
      "Integrates ESLint into your system for real-time error checking.",
    author: "Microsoft",
    downloads: "28M",
    icon: "🔵",
    version: "2.4.2",
  },
  {
    id: "prettier",
    name: "Prettier",
    description: "Code formatter using prettier.",
    author: "Prettier",
    downloads: "34M",
    icon: "💅",
    version: "10.1.0",
  },
  {
    id: "python",
    name: "Python",
    description: "IntelliSense, Linting, Debugging for Python.",
    author: "Microsoft",
    downloads: "78M",
    icon: "🐍",
    version: "2023.14.0",
  },
  {
    id: "cpp",
    name: "C/C++",
    description: "IntelliSense, debugging, and code browsing for C/C++.",
    author: "Microsoft",
    downloads: "56M",
    icon: "🇨",
    version: "1.18.5",
  },
  {
    id: "java",
    name: "Extension Pack for Java",
    description: "Java IntelliSense, debugging, and project management.",
    author: "Red Hat",
    downloads: "22M",
    icon: "☕",
    version: "0.25.1",
  },
  {
    id: "vscode-icons",
    name: "vscode-icons",
    description: "Icons for Visual Studio Code.",
    author: "VSCode Icons Team",
    downloads: "14M",
    icon: "📁",
    version: "11.0.0",
  },
  {
    id: "gitlens",
    name: "GitLens",
    description: "Supercharge Git. Adds Source Control view.",
    author: "GitKraken",
    downloads: "25M",
    icon: "🔍",
    version: "14.0.1",
  },
  {
    id: "dracula",
    name: "Dracula Official",
    description: "A dark theme for many editors, shells, and more.",
    author: "Dracula Theme",
    downloads: "6M",
    icon: "🧛",
    version: "2.24.2",
  },
  {
    id: "onedark",
    name: "One Dark Pro",
    description: "Atom's iconic One Dark theme.",
    author: "binaryify",
    downloads: "8M",
    icon: "🌘",
    version: "3.19.0",
  },
  {
    id: "monokai",
    name: "Monokai Pro",
    description: "Professional theme.",
    author: "Monokai",
    downloads: "2M",
    icon: "🎨",
    version: "1.0.0",
  },
];

const SNIPPETS: Partial<
  Record<Language, { label: string; code: string; detail: string }[]>
> = {
  [Language.JAVASCRIPT]: [
    { label: "clg", code: "console.log($1);", detail: "Console Log" },
    {
      label: "func",
      code: "function ${1:name}(${2:params}) {\n\t$0\n}",
      detail: "Function Statement",
    },
    {
      label: "afn",
      code: "const ${1:name} = (${2:params}) => {\n\t$0\n};",
      detail: "Arrow Function",
    },
    {
      label: "for",
      code: "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\tconst element = ${2:array}[${1:i}];\n\t$0\n}",
      detail: "For Loop",
    },
  ],
  [Language.PYTHON]: [
    { label: "print", code: "print($1)", detail: "Print to console" },
    {
      label: "def",
      code: "def ${1:name}(${2:args}):\n\t${0:pass}",
      detail: "Function Definition",
    },
    {
      label: "ifmain",
      code: 'if __name__ == "__main__":\n\t${1:main()}',
      detail: "Main Guard",
    },
  ],
  [Language.JAVA]: [
    {
      label: "sout",
      code: "System.out.println($1);",
      detail: "Print to console",
    },
    {
      label: "main",
      code: "public static void main(String[] args) {\n\t$0\n}",
      detail: "Main Method",
    },
  ],
  [Language.CPP]: [
    { label: "cout", code: "std::cout << $1 << std::endl;", detail: "Cout" },
    {
      label: "main",
      code: "int main() {\n\treturn 0;\n}",
      detail: "Main Function",
    },
  ],
  [Language.C]: [
    { label: "printf", code: 'printf("${1:%s}\\n", $2);', detail: "Printf" },
    {
      label: "main",
      code: "int main() {\n\treturn 0;\n}",
      detail: "Main Function",
    },
  ],
  [Language.HTML]: [
    {
      label: "html5",
      code: "<!DOCTYPE html>\n<html>\n<body>\n\t$0\n</body>\n</html>",
      detail: "HTML5 Boilerplate",
    },
    { label: "div", code: "<div>$0</div>", detail: "Div Element" },
  ],
};

export const Editor: React.FC<EditorProps> = ({
  project,
  userSettings,
  installedExtensions,
  onSave,
  onClose,
  onExtensionChange,
  onUpdateSettings,
}) => {
  const SESSION_KEY = `cloudcode_session_${project.id}`;
  const isMobile = window.innerWidth < 768;
  const monaco = useMonaco();

  const loadSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load session", e);
    }
    return null;
  };

  const session = loadSession();
  const [files, setFiles] = useState<File[]>(session?.files || project.files);
  const [activeFileId, setActiveFileId] = useState<string>(
    session?.activeFileId || project.files[0]?.id || ""
  );

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [creatingFileName, setCreatingFileName] = useState("");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [fileSearchQuery, setFileSearchQuery] = useState("");

  // Multi-Terminal State
  const [terminals, setTerminals] = useState<
    { id: string; name: string; content: string }[]
  >(session?.terminals || [{ id: "1", name: "Terminal 1", content: "" }]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>(
    session?.activeTerminalId || "1"
  );
  const [activePanel, setActivePanel] = useState<
    "terminal" | "preview" | "problems"
  >("terminal");
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const [hasError, setHasError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStats, setExecutionStats] = useState<{
    time: string;
    memory: string;
  } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [settings, setSettings] = useState<EditorSettings>(userSettings);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const [activeSidebarView, setActiveSidebarView] = useState<
    "files" | "extensions" | "git" | "docker"
  >(session?.activeSidebarView || "files");
  const [sidebarWidth, setSidebarWidth] = useState(
    session?.sidebarWidth || (isMobile ? 0 : 250)
  );
  const [isResizing, setIsResizing] = useState(false);

  const [installingExt, setInstallingExt] = useState<string | null>(null);
  const [searchExtQuery, setSearchExtQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "info" | "success" | "error" }[]
  >([]);

  const editorRef = useRef<any>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId),
    [files, activeFileId]
  );
  const code = activeFile?.content || "";

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
  );

  // Register Custom Themes & Snippets on Monaco Load
  useEffect(() => {
    if (!monaco) return;

    // Define Custom Themes to match app styles
    monaco.editor.defineTheme("theme-dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
      },
    });

    monaco.editor.defineTheme("theme-solarized", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#002b36",
        "editor.foreground": "#839496",
      },
    });

    monaco.editor.defineTheme("theme-monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
      },
    });

    // Register Snippets for languages
    Object.entries(SNIPPETS).forEach(([lang, snippets]) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: snippets.map((s) => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: s.detail,
              insertText: s.code,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            })),
          };
        },
      });
    });
  }, [monaco]);

  const handleEditorMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;

    // Use the instance passed from onMount to ensure it's loaded
    const m = monacoInstance || monaco;
    if (!m) return;

    // Add Shortcuts
    // Ctrl + S (Save)
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
      handleSave();
    });

    // Ctrl + Enter (Run)
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => {
      handleRun();
    });

    editor.focus();
  };

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
      activeTerminalId,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, [
    files,
    activeFileId,
    activeSidebarView,
    sidebarWidth,
    activePanel,
    terminals,
    activeTerminalId,
    SESSION_KEY,
  ]);

  // Auto-Save Effect
  useEffect(() => {
    if (!autoSaveEnabled || !hasAnyChanges) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [files, autoSaveEnabled]);

  const showToast = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const isFileDirty = (fileId: string) => {
    const currentFile = files.find((f) => f.id === fileId);
    const originalFile = project.files.find((f) => f.id === fileId);
    if (currentFile && !originalFile) return true;
    if (!currentFile) return false;
    return currentFile.content !== originalFile?.content;
  };

  const hasAnyChanges = useMemo(() => {
    return (
      files.some((f) => isFileDirty(f.id)) ||
      files.length !== project.files.length
    );
  }, [files, project.files]);

  const detectLanguage = (fileName: string): Language => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
        return Language.JAVASCRIPT;
      case "py":
        return Language.PYTHON;
      case "java":
        return Language.JAVA;
      case "c":
        return Language.C;
      case "cpp":
        return Language.CPP;
      case "html":
        return Language.HTML;
      case "sql":
        return Language.SQL;
      case "css":
        return Language.CSS;
      case "json":
        return Language.JSON;
      case "md":
        return Language.MARKDOWN;
      case "txt":
        return Language.PLAINTEXT;
      default:
        if (fileName === "Dockerfile") return Language.DOCKERFILE;
        return Language.PLAINTEXT;
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (!activeFile || newCode === undefined) return;
    const newFiles = files.map((f) =>
      f.id === activeFileId ? { ...f, content: newCode } : f
    );
    setFiles(newFiles);
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
      content: "",
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setCreatingFileName("");
  };

  const handleRenameFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFileId || !renameValue.trim()) {
      setRenamingFileId(null);
      return;
    }
    setFiles(
      files.map((f) =>
        f.id === renamingFileId
          ? { ...f, name: renameValue, language: detectLanguage(renameValue) }
          : f
      )
    );
    setRenamingFileId(null);
    setRenameValue("");
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert("Cannot delete the last file.");
      return;
    }
    if (confirm("Are you sure?")) {
      const newFiles = files.filter((f) => f.id !== id);
      setFiles(newFiles);
      if (activeFileId === id) setActiveFileId(newFiles[0].id);
    }
  };

  const handleDuplicateFile = (e: React.MouseEvent, file: File) => {
    e.stopPropagation();
    const parts = file.name.split(".");
    const ext = parts.pop();
    const name = parts.join(".");
    const newName = `${name}_copy.${ext}`;
    const newFile: File = {
      id: Date.now().toString(),
      name: newName,
      language: file.language,
      content: file.content,
    };
    const index = files.findIndex((f) => f.id === file.id);
    const newFiles = [...files];
    newFiles.splice(index + 1, 0, newFile);
    setFiles(newFiles);
  };

  const toggleExtension = (id: string) => {
    if (installedExtensions.includes(id)) {
      onExtensionChange(installedExtensions.filter((e) => e !== id));
    } else {
      setInstallingExt(id);
      setTimeout(() => {
        onExtensionChange([...installedExtensions, id]);
        setInstallingExt(null);
      }, 500);
    }
  };

  const handleRun = async () => {
    if (!activeFile) return;
    if (activeFile.language === Language.HTML) {
      setIsRunning(true);
      setActivePanel("preview");
      const blob = new Blob([activeFile.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsRunning(false);
      return;
    }

    if (terminals.length === 0) {
      setTerminals([{ id: "1", name: "Terminal 1", content: "" }]);
      setActiveTerminalId("1");
    }

    setIsRunning(true);
    setActivePanel("terminal");
    setIsPanelVisible(true);
    updateActiveTerminal(`\n> Compiling and Executing ${activeFile.name}...\n`);

    setHasError(false);
    setExecutionStats(null);

    const result = await executeCode(files, activeFileId, userInput);

    updateActiveTerminal(result.output + "\n");
    setHasError(result.error || false);
    setExecutionStats({
      time: result.executionTime || "0s",
      memory: result.memoryUsage || "0MB",
    });
    setIsRunning(false);
  };

  const updateActiveTerminal = (text: string) => {
    setTerminals((prev) =>
      prev.map((t) =>
        t.id === activeTerminalId ? { ...t, content: t.content + text } : t
      )
    );
  };

  const handleSave = (silent = false) => {
    onSave({ ...project, files, lastModified: Date.now() });
    if (!silent) showToast("Project Saved Successfully", "success");
    else showToast("Auto-Saved to Cloud", "info");
  };

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach((file) => zip.file(file.name, file.content));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      showToast("Export failed", "error");
    }
  };

  const handleShare = () => {
    const projectData = {
      name: project.name,
      language: project.language,
      files: files,
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
    const newTheme =
      settings.theme === "theme-light" ? "theme-dark" : "theme-light";
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const resize = (e: MouseEvent) => {
    if (isResizing) setSidebarWidth(e.clientX - 48);
  };
  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  const getFileIcon = (file: File) => {
    if (installedExtensions.includes("vscode-icons")) {
      const colors: Record<Language, string> = {
        [Language.JAVASCRIPT]: "text-yellow-400",
        [Language.PYTHON]: "text-blue-400",
        [Language.HTML]: "text-orange-500",
        [Language.CSS]: "text-blue-300",
        [Language.JSON]: "text-yellow-200",
        [Language.JAVA]: "text-red-400",
        [Language.C]: "text-blue-500",
        [Language.CPP]: "text-purple-500",
        [Language.SQL]: "text-green-400",
        [Language.MARKDOWN]: "text-white",
        [Language.DOCKERFILE]: "text-blue-600",
        [Language.PLAINTEXT]: "text-gray-400",
      };
      return (
        <FileCode
          size={14}
          className={`shrink-0 ${colors[file.language] || "text-gray-400"}`}
        />
      );
    }
    return <FileCode size={14} className="text-gray-400 shrink-0" />;
  };

  // Map App Theme to Monaco Theme
  const getMonacoTheme = () => {
    if (settings.theme === "theme-light") return "light";
    if (settings.theme === "theme-dracula") return "theme-dracula";
    if (settings.theme === "theme-solarized") return "theme-solarized";
    if (settings.theme === "theme-monokai") return "theme-monokai";
    return "vs-dark";
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
            style={{
              borderLeftColor:
                t.type === "error"
                  ? "#ef4444"
                  : t.type === "success"
                  ? "#22c55e"
                  : "var(--accent)",
            }}
          >
            {t.type === "error" ? (
              <AlertTriangle size={16} className="text-red-500" />
            ) : t.type === "success" ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Bot size={16} className="text-accent-500" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-2 md:px-4 shrink-0 z-20">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            onClick={() => setSidebarWidth((prev) => (prev === 0 ? 250 : 0))}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-100"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-1 mx-2 text-gray-400">
            {/* Monaco handles undo/redo natively, buttons here would need detailed API hooks, keeping simpler for now */}
          </div>

          <div>
            <h2 className="font-semibold text-sm leading-tight flex items-center gap-2 text-gray-100">
              {project.name}{" "}
              {hasAnyChanges && (
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              )}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md"
            title="Toggle Theme"
          >
            {settings.theme === "theme-light" ? (
              <Moon size={16} />
            ) : (
              <Sun size={16} />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md"
            title="Share Project"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={() => handleSave()}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-600/10 hover:bg-accent-600/20 text-accent-500 rounded-md text-sm font-medium transition-colors border border-accent-600/20"
          >
            <Save size={16} /> <span className="hidden md:inline">Save</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-md"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95"
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span className="hidden md:inline">Run</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div
          className={`flex shrink-0 h-full transition-transform duration-300 absolute md:relative z-30 ${
            isMobile && sidebarWidth === 0
              ? "-translate-x-full"
              : "translate-x-0"
          }`}
          style={{ height: "100%" }}
        >
          {/* Activity Bar */}
          <div className="w-12 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-4 shrink-0">
            <button
              onClick={() => setActiveSidebarView("files")}
              className={`p-2 rounded-lg transition-colors ${
                activeSidebarView === "files"
                  ? "text-gray-100 border-l-2 border-accent-500 bg-gray-900"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Files size={24} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setActiveSidebarView("extensions")}
              className={`p-2 rounded-lg transition-colors ${
                activeSidebarView === "extensions"
                  ? "text-gray-100 border-l-2 border-accent-500 bg-gray-900"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Blocks size={24} strokeWidth={1.5} />
            </button>
            {installedExtensions.includes("gitlens") && (
              <button
                onClick={() => setActiveSidebarView("git")}
                className={`p-2 rounded-lg transition-colors ${
                  activeSidebarView === "git"
                    ? "text-gray-100 border-l-2 border-accent-500 bg-gray-900"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <GitGraph size={24} strokeWidth={1.5} />
              </button>
            )}
            {installedExtensions.includes("docker") && (
              <button
                onClick={() => setActiveSidebarView("docker")}
                className={`p-2 rounded-lg transition-colors ${
                  activeSidebarView === "docker"
                    ? "text-gray-100 border-l-2 border-accent-500 bg-gray-900"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Container size={24} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Sidebar Panel */}
          <div
            style={{ width: sidebarWidth }}
            className="bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-hidden transition-all duration-300"
          >
            {activeSidebarView === "files" && (
              <>
                <div className="h-9 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center bg-gray-900 z-10 select-none border-b border-gray-800">
                  <span>Explorer</span>
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-100"
                    title="New File"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="p-2 border-b border-gray-800 bg-gray-900/50">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 text-gray-500 w-3 h-3" />
                    <input
                      type="text"
                      className="w-full bg-gray-950 border border-gray-800 rounded-md py-1 pl-7 pr-2 text-xs text-gray-300 focus:outline-none focus:border-accent-500"
                      placeholder="Search files..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isCreatingFile && (
                    <form
                      onSubmit={handleCreateFileSubmit}
                      className="flex items-center px-4 py-1 border-l-2 border-accent-500 bg-gray-800/50"
                    >
                      <FileCode
                        size={14}
                        className="text-gray-400 mr-2 shrink-0"
                      />
                      <input
                        ref={createInputRef}
                        type="text"
                        value={creatingFileName}
                        onChange={(e) => setCreatingFileName(e.target.value)}
                        className="explorer-input"
                        placeholder="filename.js"
                        onBlur={() => {
                          if (!creatingFileName) setIsCreatingFile(false);
                        }}
                      />
                    </form>
                  )}

                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`group flex items-center justify-between px-4 py-1 text-sm cursor-pointer border-l-2 transition-colors relative ${
                        activeFileId === file.id
                          ? "bg-gray-800 border-accent-500 text-gray-100"
                          : "border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                      }`}
                    >
                      {renamingFileId === file.id ? (
                        <form
                          onSubmit={handleRenameFileSubmit}
                          className="flex items-center flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                            <span
                              className={`truncate ${
                                isFileDirty(file.id) ? "text-yellow-500" : ""
                              }`}
                            >
                              {file.name}
                            </span>
                            {isFileDirty(file.id) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-auto mr-1"></span>
                            )}
                          </div>

                          <div className="hidden group-hover:flex items-center gap-1 bg-gray-800 shadow-[-10px_0_10px_-5px_rgba(31,41,55,1)] ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingFileId(file.id);
                                setRenameValue(file.name);
                              }}
                              className="p-1 hover:text-white hover:bg-gray-700 rounded"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDuplicateFile(e, file)}
                              className="p-1 hover:text-white hover:bg-gray-700 rounded"
                              title="Duplicate"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFile(e, file.id)}
                              className="p-1 hover:text-red-400 hover:bg-gray-700 rounded"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-800 space-y-2">
                  <button
                    onClick={handleExportZip}
                    className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-100 py-1"
                  >
                    <Download size={12} /> Export ZIP
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-100 py-1"
                  >
                    <Share2 size={12} /> Share Project
                  </button>
                </div>
              </>
            )}

            {activeSidebarView === "extensions" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                    Extensions
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search Marketplace"
                      value={searchExtQuery}
                      onChange={(e) => setSearchExtQuery(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded py-2 pl-8 pr-2 text-sm text-gray-300 focus:outline-none focus:border-accent-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {MARKETPLACE_EXTENSIONS.filter((ex) =>
                    ex.name.toLowerCase().includes(searchExtQuery.toLowerCase())
                  ).map((ext) => (
                    <div
                      key={ext.id}
                      className="p-3 mb-2 rounded bg-gray-950 border border-gray-800 hover:border-accent-500/50 flex gap-3"
                    >
                      <div className="text-2xl pt-1">{ext.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-gray-200 truncate">
                            {ext.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 my-1">
                          {ext.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-600">
                            {ext.downloads} • {ext.author}
                          </span>
                          <button
                            onClick={() => toggleExtension(ext.id)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                              installedExtensions.includes(ext.id)
                                ? "bg-gray-800 text-gray-300"
                                : "bg-accent-600 text-white hover:bg-accent-500"
                            }`}
                          >
                            {installingExt === ext.id
                              ? "Installing..."
                              : installedExtensions.includes(ext.id)
                              ? "Installed"
                              : "Install"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSidebarView === "git" && (
              <div className="flex flex-col h-full p-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">
                  Source Control
                </h3>
                <div className="flex-1 overflow-y-auto">
                  {hasAnyChanges ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 mb-2">Changes</p>
                      {files
                        .filter((f) => isFileDirty(f.id))
                        .map((f) => (
                          <div
                            key={f.id}
                            onClick={() => setActiveFileId(f.id)}
                            className="flex items-center gap-2 text-sm text-gray-300 hover:bg-gray-800 p-1 rounded cursor-pointer"
                          >
                            <span className="text-yellow-500">M</span>
                            {f.name}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      No changes detected.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarView === "docker" && (
              <div className="flex flex-col h-full p-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">
                  Containers
                </h3>
                <div className="bg-green-900/20 border border-green-900/50 p-3 rounded flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm font-bold text-gray-200">
                      cloud-runner-v1
                    </div>
                    <div className="text-xs text-gray-500">
                      Up 2 hours • 28MB
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!isMobile && (
            <div
              className="w-1 hover:bg-accent-500 cursor-col-resize transition-colors bg-gray-950/50 z-10"
              onMouseDown={startResizing}
            ></div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-gray-950 relative z-10">
          {/* File Tabs */}
          <div className="flex bg-gray-950 border-b border-gray-800 overflow-x-auto no-scrollbar">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-800 min-w-[120px] max-w-[200px] cursor-pointer select-none relative ${
                  activeFileId === file.id
                    ? "bg-gray-900 text-gray-100 border-t-2 border-t-accent-500"
                    : "text-gray-500 hover:bg-gray-900/50"
                }`}
              >
                {getFileIcon(file)}
                <span
                  className={`truncate ${
                    isFileDirty(file.id) ? "text-yellow-500" : ""
                  }`}
                >
                  {file.name}
                </span>
                {isFileDirty(file.id) && (
                  <span className="absolute right-2 top-3 w-2 h-2 rounded-full bg-yellow-500"></span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(e, file.id);
                  }}
                  className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 relative flex bg-gray-900">
            {activeFile ? (
              <MonacoEditor
                height="100%"
                width="100%"
                language={
                  activeFile.language === Language.HTML
                    ? "html"
                    : activeFile.language === Language.JAVASCRIPT
                    ? "javascript"
                    : activeFile.language
                }
                value={code}
                theme={getMonacoTheme()}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: settings.fontSize,
                  wordWrap: settings.wordWrap ? "on" : "off",
                  lineNumbers: settings.showLineNumbers ? "on" : "off",
                  minimap: { enabled: settings.minimap },
                  fontFamily: settings.fontFamily,
                  tabSize: settings.tabSize,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          {isPanelVisible && (
            <div className="h-[40%] max-h-[300px] border-t border-gray-800 bg-gray-900 flex flex-col shrink-0">
              <div className="flex border-b border-gray-800 overflow-x-auto items-center">
                <div className="flex">
                  <button
                    onClick={() => setActivePanel("terminal")}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
                      activePanel === "terminal"
                        ? "text-gray-100 border-b-2 border-accent-500"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Terminal size={14} /> Terminal
                  </button>
                  {previewUrl && (
                    <button
                      onClick={() => setActivePanel("preview")}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
                        activePanel === "preview"
                          ? "text-gray-100 border-b-2 border-accent-500"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Globe size={14} /> Preview
                    </button>
                  )}
                </div>

                {activePanel === "terminal" && (
                  <div className="flex items-center ml-4 gap-1 border-l border-gray-800 pl-4">
                    {terminals.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTerminalId(t.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          activeTerminalId === t.id
                            ? "bg-gray-800 text-gray-100"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const id = Date.now().toString();
                        setTerminals([
                          ...terminals,
                          {
                            id,
                            name: `Terminal ${terminals.length + 1}`,
                            content: "",
                          },
                        ]);
                        setActiveTerminalId(id);
                      }}
                      className="p-1 hover:bg-gray-800 rounded text-gray-500"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}

                <div className="ml-auto flex items-center pr-2 gap-2">
                  <button
                    onClick={() => setIsPanelVisible(false)}
                    className="p-1 hover:bg-gray-800 rounded text-gray-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
                {activePanel === "terminal" && (
                  <>
                    {executionStats && (
                      <div className="absolute top-2 right-4 text-xs text-gray-500 flex gap-4 pointer-events-none">
                        <span>
                          Time:{" "}
                          <span className="text-gray-300">
                            {executionStats.time}
                          </span>
                        </span>
                        <span>
                          Mem:{" "}
                          <span className="text-gray-300">
                            {executionStats.memory}
                          </span>
                        </span>
                      </div>
                    )}
                    <div
                      className={`whitespace-pre-wrap min-h-full ${
                        hasError ? "text-red-400" : "text-gray-300"
                      }`}
                    >
                      {terminals.find((t) => t.id === activeTerminalId)
                        ?.content || (
                        <span className="text-gray-600 opacity-50">
                          Ready to execute...
                        </span>
                      )}
                    </div>
                  </>
                )}
                {activePanel === "preview" && (
                  <div className="w-full h-full bg-white rounded-md overflow-hidden">
                    {previewUrl ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-none"
                        title="Preview"
                      />
                    ) : (
                      <div className="text-gray-500 text-center pt-10">
                        Run the code to see preview
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-100">
              <Share2 size={18} /> Share Project
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Anyone with this link can view and import a copy of this project.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 bg-gray-950 border border-gray-700 rounded p-2 text-xs text-gray-300 outline-none select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  showToast("Link Copied!", "success");
                }}
                className="bg-accent-600 hover:bg-accent-500 text-white px-3 py-2 rounded text-xs font-bold"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-100">
              <Settings size={18} /> Editor Settings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Font Size</label>
                <input
                  type="number"
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="bg-gray-950 border border-gray-700 rounded p-1 w-16 text-center text-gray-100"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Tab Size</label>
                <input
                  type="number"
                  value={settings.tabSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tabSize: Number(e.target.value),
                    })
                  }
                  className="bg-gray-950 border border-gray-700 rounded p-1 w-16 text-center text-gray-100"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Word Wrap</label>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) =>
                    setSettings({ ...settings, wordWrap: e.target.checked })
                  }
                  className="accent-accent-600 w-5 h-5"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Line Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      showLineNumbers: e.target.checked,
                    })
                  }
                  className="accent-accent-600 w-5 h-5"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Auto Save</label>
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="accent-accent-600 w-5 h-5"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  onUpdateSettings(settings);
                  setShowSettings(false);
                }}
                className="bg-accent-600 hover:bg-accent-500 px-4 py-2 rounded text-white text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
