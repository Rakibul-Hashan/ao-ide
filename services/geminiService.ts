
import { Language, File, ExecutionResult } from "../types";

// Removed AI instance since user requested no Gemini for execution/results.
// Keeping imports clean.

// Piston API Configuration
const PISTON_API = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP: Partial<Record<Language, { runtime: string, version: string }>> = {
  [Language.JAVASCRIPT]: { runtime: "javascript", version: "*" },
  [Language.PYTHON]: { runtime: "python", version: "*" },
  [Language.JAVA]: { runtime: "java", version: "*" },
  [Language.CPP]: { runtime: "cpp", version: "*" },
  [Language.C]: { runtime: "c", version: "*" },
};

// --- Local Execution Fallback (Browser-based) ---

// 1. JavaScript Local Execution
const executeJavaScriptLocal = async (code: string): Promise<ExecutionResult> => {
  const startTime = performance.now();
  const logs: string[] = [];
  let errorOccurred = false;
  
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  try {
    console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    console.error = (...args) => {
        errorOccurred = true;
        logs.push('[Error] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    };
    console.warn = (...args) => logs.push('[Warn] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));

    const run = new Function(code);
    run();
    
  } catch (err: any) {
    errorOccurred = true;
    logs.push(`Runtime Error: ${err.message}`);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(3) + "s";

  return {
    output: logs.length > 0 ? logs.join('\n') : "No output returned.",
    executionTime: duration,
    memoryUsage: "Browser Local (JS)",
    error: errorOccurred
  };
};

// 2. Python Local Execution (via Pyodide)
declare global {
  interface Window {
    loadPyodide: any;
    pyodideInstance: any;
  }
}

const loadPyodideScript = async (): Promise<void> => {
  if (window.loadPyodide) return; // Already loaded
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(script);
  });
};

const executePythonLocal = async (code: string): Promise<ExecutionResult> => {
  const startTime = performance.now();
  let output = "";
  let errorOccurred = false;

  try {
    if (!window.pyodideInstance) {
      output = "Loading Python Runtime (Pyodide)...\n";
      await loadPyodideScript();
      window.pyodideInstance = await window.loadPyodide();
    }

    // Capture stdout
    window.pyodideInstance.setStdout({ batched: (msg: string) => { output += msg + "\n"; } });
    
    await window.pyodideInstance.runPythonAsync(code);
    
  } catch (err: any) {
    errorOccurred = true;
    output += `\nTraceback: ${err.message}`;
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(3) + "s";

  return {
    output: output || "No output returned.",
    executionTime: duration,
    memoryUsage: "Browser Local (WASM)",
    error: errorOccurred
  };
};


export const executeCode = async (files: File[], mainFileId: string, input: string = ''): Promise<ExecutionResult> => {
  const startTime = performance.now();
  
  const mainFile = files.find(f => f.id === mainFileId) || files[0];
  if (!mainFile) return { output: "Error: No file found.", executionTime: "0ms", memoryUsage: "0MB", error: true };

  // Special handling for HTML is done in the UI (Editor.tsx) to render an iframe. 
  if (mainFile.language === Language.HTML) {
      return { output: "Ready for browser preview...", executionTime: "0ms", memoryUsage: "0MB" };
  }

  const config = LANGUAGE_MAP[mainFile.language];
  if (!config) {
      return { 
        output: `Execution for ${mainFile.language} is not supported in this environment yet.\nSupported languages: JS, Python, Java, C, C++.`, 
        executionTime: "0ms", 
        memoryUsage: "0MB",
        error: true
      };
  }

  // Piston expects the main file to be the entry point. We ensure it's first in the array.
  const orderedFiles = [
      mainFile,
      ...files.filter(f => f.id !== mainFileId)
  ];

  const apiFiles = orderedFiles.map(f => ({
    name: f.name,
    content: f.content
  }));

  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(PISTON_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              language: config.runtime,
              version: config.version,
              files: apiFiles,
              stdin: input,
              run_timeout: 3000,
              compile_timeout: 10000
          }),
          signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Status: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(3) + "s";

      if (data.run) {
          // Piston response parsing
          let output = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const exitCode = data.run.code;
          const signal = data.run.signal;
          let isError = exitCode !== 0 || !!signal || !!stderr;

          if (stderr) {
              output += `\nError Output:\n${stderr}`;
          }
          
          if (signal) {
              output += `\nProcess terminated by signal: ${signal}`;
              isError = true;
          }

          if (output.trim() === "") {
              output = "Program completed with no output.";
          }
          
          return {
              output: output, 
              executionTime: duration, 
              memoryUsage: "N/A",
              error: isError
          };
      }
      
      throw new Error("Invalid response format from execution engine.");

  } catch (e: any) {
      console.warn("Piston API failed, attempting fallback...", e);

      // --- FALLBACK LOGIC ---
      
      // 1. JavaScript Fallback
      if (mainFile.language === Language.JAVASCRIPT) {
          return await executeJavaScriptLocal(mainFile.content);
      }
      
      // 2. Python Fallback
      if (mainFile.language === Language.PYTHON) {
          return await executePythonLocal(mainFile.content);
      }

      // 3. Compiled Languages (C, C++, Java) cannot run locally easily
      return { 
        output: `[Connection Error] Could not reach the Cloud Compiler.\n\nDetails: ${e.message}\n\nNote: Local fallback is only available for JavaScript and Python. C, C++, and Java require an active internet connection to the compilation server.`, 
        executionTime: "0ms", 
        memoryUsage: "0MB",
        error: true
      };
  }
};

// Stubs for AI functions since AI is disabled for execution/results
export const explainCode = async (code: string, language: Language): Promise<string> => {
  return "AI Explanation is currently disabled.";
};

export const debugCode = async (code: string, language: Language, errorMsg: string): Promise<string> => {
   return "AI Debugging is currently disabled.";
};
