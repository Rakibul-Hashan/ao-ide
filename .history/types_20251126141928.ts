/types.ts
export enum Language {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
  HTML = 'html',
  SQL = 'sql',
  CSS = 'css',
  JSON = 'json',
  MARKDOWN = 'markdown',
  DOCKERFILE = 'dockerfile',
  PLAINTEXT = 'plaintext'
}

export interface File {
  id: string;
  name: string;
  content: string;
  language: Language;
}

export interface Project {
  id: string;
  name: string;
  language: Language;
  files: File[];
  lastModified: number;
}

export interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  theme: string; // Changed from 'dark' | 'light' to string to support 'dracula', 'monokai', etc.
  tabSize: number;
  minimap: boolean;
  fontFamily: string;
  useCloudStorage?: boolean;
}

export interface User {
  email: string;
  name: string;
  bio?: string;
  avatar?: string; // URL or base64
  projects: Project[];
  settings: EditorSettings;
  extensions: string[]; // List of installed extension IDs
}

export interface ExecutionResult {
  output: string;
  executionTime?: string;
  memoryUsage?: string;
  error?: boolean;
}

export interface Diagnostic {
  line: number; // 1-based
  message: string;
  severity: 'error' | 'warning' | 'info';
  startColumn?: number;
  endColumn?: number;
}
