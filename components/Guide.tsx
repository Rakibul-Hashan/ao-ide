import {
  ArrowLeft,
  BookOpen,
  Cloud,
  Code2,
  Command,
  Keyboard,
  Layers,
  MousePointer2,
  Play,
  Shield,
  Terminal,
} from "lucide-react";
import React, { useState } from "react";

interface GuideProps {
  onBack: () => void;
}

export const Guide: React.FC<GuideProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <BookOpen size={18} />,
    },
    {
      id: "editor-features",
      title: "Editor Features",
      icon: <Code2 size={18} />,
    },
    {
      id: "running-code",
      title: "Running & Terminal",
      icon: <Terminal size={18} />,
    },
    { id: "extensions", title: "Extensions", icon: <Layers size={18} /> },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      icon: <Keyboard size={18} />,
    },
    { id: "cloud-sync", title: "Cloud Sync & Data", icon: <Cloud size={18} /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "getting-started":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Getting Started
            </h2>
            <p className="text-gray-400 text-lg">
              Welcome to CloudCode, a powerful browser-based IDE powered by the
              Monaco Editor engine (the same engine used in VS Code).
            </p>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-200 mb-3">
                Creating a Project
              </h3>
              <p className="text-gray-400 mb-4">
                From the Dashboard, click{" "}
                <span className="text-accent-400 font-bold">New Project</span>.
                Select your desired language (JavaScript, Python, C++, etc.) and
                give it a name. The IDE will initialize with a basic "Hello
                World" template.
              </p>
              <div className="flex gap-2 text-sm">
                <span className="bg-gray-800 px-2 py-1 rounded text-yellow-400 border border-gray-700">
                  JavaScript
                </span>
                <span className="bg-gray-800 px-2 py-1 rounded text-blue-400 border border-gray-700">
                  Python
                </span>
                <span className="bg-gray-800 px-2 py-1 rounded text-red-400 border border-gray-700">
                  Java
                </span>
                <span className="bg-gray-800 px-2 py-1 rounded text-purple-400 border border-gray-700">
                  C++
                </span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-200 mb-3">
                File Management
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <MousePointer2 size={16} className="text-accent-500" />{" "}
                  <strong>Create File:</strong> Click the "+" icon in the
                  explorer sidebar.
                </li>
                <li className="flex items-center gap-2">
                  <MousePointer2 size={16} className="text-accent-500" />{" "}
                  <strong>Rename:</strong> Hover over a file and click the
                  Pencil icon.
                </li>
                <li className="flex items-center gap-2">
                  <MousePointer2 size={16} className="text-accent-500" />{" "}
                  <strong>Delete:</strong> Hover over a file and click the Trash
                  icon.
                </li>
                <li className="flex items-center gap-2">
                  <MousePointer2 size={16} className="text-accent-500" />{" "}
                  <strong>Trash Bin:</strong> Deleted projects go to the Trash
                  on the dashboard, where they can be restored.
                </li>
              </ul>
            </div>
          </div>
        );
      case "editor-features":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Editor Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-200 mb-3 flex items-center gap-2">
                  <Code2 size={20} className="text-blue-400" /> IntelliSense
                </h3>
                <p className="text-gray-400">
                  Enjoy intelligent code completion, parameter hints, and syntax
                  validation out of the box. Just start typing, and suggestions
                  will appear. Press{" "}
                  <kbd className="bg-gray-800 px-1 rounded text-xs">Ctrl</kbd> +{" "}
                  <kbd className="bg-gray-800 px-1 rounded text-xs">Space</kbd>{" "}
                  to trigger manually.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-200 mb-3 flex items-center gap-2">
                  <Command size={20} className="text-yellow-400" /> Command
                  Palette
                </h3>
                <p className="text-gray-400">
                  Access all editor commands by pressing{" "}
                  <kbd className="bg-gray-800 px-1 rounded text-xs">F1</kbd> or
                  right-clicking and selecting "Command Palette". You can change
                  themes, format code, and more.
                </p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-200 mb-3">
                Multi-Cursor Editing
              </h3>
              <p className="text-gray-400 mb-3">
                You can edit multiple lines at once. Hold{" "}
                <kbd className="bg-gray-800 px-1 rounded text-xs">Alt</kbd> and
                click different locations in the editor to add cursors.
              </p>
              <p className="text-gray-400">
                Alternatively, select a word and press{" "}
                <kbd className="bg-gray-800 px-1 rounded text-xs">Ctrl</kbd> +{" "}
                <kbd className="bg-gray-800 px-1 rounded text-xs">D</kbd> to
                select the next occurrence.
              </p>
            </div>
          </div>
        );
      case "running-code":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Running Code
            </h2>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-600/20 rounded-lg text-green-500">
                  <Play size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-200">
                    Execution Engine
                  </h3>
                  <p className="text-gray-400 text-sm">Powered by Piston API</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Click the <strong>Run</strong> button or press{" "}
                <kbd className="bg-gray-800 px-1 rounded text-xs">Ctrl</kbd> +{" "}
                <kbd className="bg-gray-800 px-1 rounded text-xs">Enter</kbd>.
                Your code is sent to a secure sandbox environment where it is
                compiled and executed.
              </p>
              <div className="bg-black/50 p-4 rounded-lg border border-gray-800 font-mono text-sm text-gray-300">
                <div className="text-green-500">➜ Compiling main.cpp...</div>
                <div>Hello World</div>
                <div className="text-gray-500 mt-2">
                  Program exited with code 0
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-200 mb-3">
                  Standard Input (stdin)
                </h3>
                <p className="text-gray-400">
                  Does your program use{" "}
                  <code className="text-accent-400">input()</code> or{" "}
                  <code className="text-accent-400">cin</code>? Type your input
                  in the text box at the bottom of the terminal{" "}
                  <strong>before</strong> or <strong>while</strong> the code
                  runs.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-200 mb-3">
                  Offline Fallback
                </h3>
                <p className="text-gray-400">
                  If the Cloud API is down, <strong>JavaScript</strong> and{" "}
                  <strong>Python</strong> files will attempt to run locally in
                  your browser using standard Web APIs and WebAssembly.
                </p>
              </div>
            </div>
          </div>
        );
      case "extensions":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Extensions Marketplace
            </h2>
            <p className="text-gray-400 text-lg">
              Enhance your experience by enabling curated features.
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex gap-3">
              <Shield className="text-yellow-500 shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-yellow-500">
                  Note on Extensions
                </h4>
                <p className="text-sm text-gray-400">
                  Since this is a web-based environment, we cannot install raw
                  VS Code extensions directly. Instead, "Installing" an
                  extension here enables pre-built features integrated into the
                  IDE (like specific linters, themes, or snippets).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Python",
                  desc: "Enables advanced snippets and linting checks for Python files.",
                },
                {
                  name: "ESLint",
                  desc: "Adds warning squiggles for bad JavaScript practices (e.g. var, ==).",
                },
                {
                  name: "GitLens",
                  desc: "Adds a Source Control sidebar to see changed files.",
                },
                {
                  name: "Docker",
                  desc: "Adds a Containers sidebar and Dockerfile highlighting.",
                },
                {
                  name: "vscode-icons",
                  desc: "Applies the official VS Code icon pack to the file explorer.",
                },
                {
                  name: "Prettier",
                  desc: 'Enables the "Format Document" command.',
                },
              ].map((ext, i) => (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-start gap-3"
                >
                  <Layers className="text-accent-500 shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-gray-200">{ext.name}</h4>
                    <p className="text-sm text-gray-500">{ext.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "shortcuts":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Keyboard Shortcuts
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4 border-b border-gray-800">Command</th>
                    <th className="p-4 border-b border-gray-800">
                      Windows / Linux
                    </th>
                    <th className="p-4 border-b border-gray-800">Mac</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-950 text-gray-300 text-sm">
                  {[
                    {
                      cmd: "Run Code",
                      win: "Ctrl + Alt + N",
                      mac: "Cmd + Alt + N",
                    },
                    {
                      cmd: "Run Code (Alt)",
                      win: "Ctrl + Enter",
                      mac: "Cmd + Enter",
                    },
                    { cmd: "Save Project", win: "Ctrl + S", mac: "Cmd + S" },
                    { cmd: "Command Palette", win: "F1", mac: "F1" },
                    { cmd: "Find", win: "Ctrl + F", mac: "Cmd + F" },
                    { cmd: "Replace", win: "Ctrl + H", mac: "Cmd + H" },
                    { cmd: "Toggle Comment", win: "Ctrl + /", mac: "Cmd + /" },
                    {
                      cmd: "Move Line Up/Down",
                      win: "Alt + Arrow",
                      mac: "Opt + Arrow",
                    },
                    {
                      cmd: "Copy Line Up/Down",
                      win: "Shift + Alt + Arrow",
                      mac: "Shift + Opt + Arrow",
                    },
                    {
                      cmd: "Format Code",
                      win: "Shift + Alt + F",
                      mac: "Shift + Opt + F",
                    },
                    { cmd: "Toggle Sidebar", win: "Ctrl + B", mac: "Cmd + B" },
                    { cmd: "Undo", win: "Ctrl + Z", mac: "Cmd + Z" },
                    { cmd: "Redo", win: "Ctrl + Y", mac: "Cmd + Shift + Z" },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-800 hover:bg-gray-900/50"
                    >
                      <td className="p-4 font-medium">{row.cmd}</td>
                      <td className="p-4">
                        <kbd className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                          {row.win}
                        </kbd>
                      </td>
                      <td className="p-4">
                        <kbd className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                          {row.mac}
                        </kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "cloud-sync":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Cloud Sync & Data
            </h2>

            <div className="bg-gradient-to-r from-accent-900/20 to-purple-900/20 border border-accent-500/30 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Cloud size={24} className="text-accent-400" />
                <h3 className="text-xl font-bold text-gray-100">
                  Storage Modes
                </h3>
              </div>
              <p className="text-gray-300 mb-4">
                CloudCode works in two modes depending on configuration:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-bold text-gray-200 mb-2">
                    Local Mode (Default)
                  </h4>
                  <p className="text-sm text-gray-400">
                    Projects are saved to your browser's{" "}
                    <strong className="text-gray-300">Local Storage</strong>.
                    Data does not leave your device, but clearing cache will
                    lose data.
                  </p>
                </div>
                <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-bold text-accent-400 mb-2">Cloud Mode</h4>
                  <p className="text-sm text-gray-400">
                    If Firebase is configured, data syncs to the{" "}
                    <strong className="text-gray-300">
                      Firestore Cloud Database
                    </strong>
                    . You can access your projects from any device.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-200 mb-3">
                Auto-Save
              </h3>
              <p className="text-gray-400">
                The editor automatically saves your work every 2 seconds if
                changes are detected. You can see the save status in the bottom
                right toast notifications.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-accent-500" size={24} /> Documentation
          </h1>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all ${
                activeSection === section.id
                  ? "bg-accent-600/10 text-accent-500 font-bold border-r-2 border-accent-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto h-screen p-6 md:p-12">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </div>
    </div>
  );
};
