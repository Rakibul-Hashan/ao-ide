import React, { useState } from "react";
import { Project, Language } from "../types";
import {
  Plus,
  Code,
  Trash2,
  FolderOpen,
  Clock,
  LogOut,
  FileCode,
  Search,
  Filter,
  RotateCcw,
  X,
  BookOpen,
  HelpCircle,
  Github,
  Linkedin,
} from "lucide-react";

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string, language: Language) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void; // Soft Delete
  onRestoreProject: (id: string) => void;
  onPermanentDeleteProject: (id: string) => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onGuideClick: () => void;
  userName: string;
  userAvatar?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
  onRestoreProject,
  onPermanentDeleteProject,
  onLogout,
  onProfileClick,
  onGuideClick,
  userName,
  userAvatar,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLang, setNewProjectLang] = useState<Language>(
    Language.JAVASCRIPT
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<string>("ALL");
  const [viewTrash, setViewTrash] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName, newProjectLang);
      setNewProjectName("");
      setIsCreating(false);
    }
  };

  const getLangColor = (lang: Language) => {
    switch (lang) {
      case Language.JAVASCRIPT:
        return "text-yellow-500";
      case Language.PYTHON:
        return "text-blue-500";
      case Language.HTML:
        return "text-orange-500";
      case Language.JAVA:
        return "text-red-500";
      case Language.CPP:
        return "text-purple-500";
      case Language.C:
        return "text-blue-600";
      case Language.MARKDOWN:
        return "text-pink-500";
      case Language.DOCKERFILE:
        return "text-blue-700";
      default:
        return "text-gray-500";
    }
  };

  // Filter Logic
  const filteredProjects = projects.filter((p) => {
    // If viewTrash is true, show ONLY trashed projects. If false, show ONLY active (non-trashed/undefined) projects
    const isTrashed = !!p.isTrashed;
    if (viewTrash !== isTrashed) return false;

    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLang = filterLang === "ALL" || p.language === filterLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300 flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/20">
            <Code className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">CloudCode</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Enterprise Edition
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between w-full md:w-auto space-x-0 md:space-x-3">
          <button
            onClick={onGuideClick}
            className="flex items-center space-x-2 text-gray-400 hover:text-gray-100 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-800"
            title="Documentation & Guide"
          >
            <BookOpen size={18} />
            <span className="hidden md:inline text-sm font-medium">Guide</span>
          </button>
          <button
            onClick={onProfileClick}
            className="flex items-center space-x-3 text-right group cursor-pointer hover:bg-gray-900 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-800"
          >
            <div className="hidden sm:block">
              <span className="block text-sm text-gray-100 font-medium group-hover:text-accent-400 transition-colors">
                {userName}
              </span>
              <span className="block text-xs text-gray-500">Pro Plan</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden ring-2 ring-transparent group-hover:ring-accent-500 transition-all">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-bold text-gray-300">
                  {userName.charAt(0)}
                </div>
              )}
            </div>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors bg-gray-900 p-2 rounded-lg border border-gray-800 hover:border-red-400/30"
          >
            <LogOut size={18} />
            <span className="md:hidden text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto flex-1 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-100">
              {viewTrash ? "Trash" : "Projects"}
            </h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              {viewTrash
                ? "Restore or permanently delete your projects"
                : "Manage and organize your cloud codebases"}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <button
              onClick={() => setViewTrash(!viewTrash)}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-colors font-medium border ${
                viewTrash
                  ? "bg-red-500/10 text-red-400 border-red-500/50"
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:text-red-400"
              }`}
              title={viewTrash ? "View Active Projects" : "View Trash"}
            >
              <Trash2 size={20} />
              <span className="hidden md:inline">
                {viewTrash ? "Close Trash" : "Trash"}
              </span>
            </button>
            {!viewTrash && (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full md:w-auto flex items-center justify-center space-x-2 bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-accent-600/20 font-medium"
              >
                <Plus size={20} />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 focus:border-accent-500 outline-none"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 focus:border-accent-500 outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Languages</option>
              {Object.values(Language).map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isCreating && !viewTrash && (
          <div className="mb-8 bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl animate-fade-in-down shadow-2xl">
            <form
              onSubmit={handleCreate}
              className="flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-gray-100 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 transition-all"
                  placeholder="e.g., E-commerce API"
                  autoFocus
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Stack
                </label>
                <select
                  value={newProjectLang}
                  onChange={(e) =>
                    setNewProjectLang(e.target.value as Language)
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-gray-100 focus:border-accent-500 focus:outline-none cursor-pointer"
                >
                  {Object.values(Language)
                    .filter(
                      (l) =>
                        ![
                          Language.JSON,
                          Language.CSS,
                          Language.MARKDOWN,
                          Language.DOCKERFILE,
                          Language.PLAINTEXT,
                        ].includes(l)
                    )
                    .map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg transition-colors font-medium flex-1 md:flex-none justify-center"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-100 px-6 py-3 rounded-lg transition-colors flex-1 md:flex-none justify-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 border border-gray-800 border-dashed rounded-2xl">
            <FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">
              {viewTrash ? "Trash is Empty" : "No Projects Found"}
            </h3>
            <p className="text-gray-500 mt-2">
              {viewTrash
                ? "Deleted projects will appear here."
                : searchQuery
                ? "Try adjusting your search criteria."
                : "Initialize a new project to start coding."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-gray-900 border border-gray-800 hover:border-accent-500/50 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 cursor-pointer flex flex-col"
                onClick={() => !viewTrash && onOpenProject(project)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gray-950 ${getLangColor(
                      project.language
                    )} ring-1 ring-gray-800`}
                  >
                    <Code size={24} />
                  </div>

                  {viewTrash ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreProject(project.id);
                        }}
                        className="p-2 text-gray-600 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                        title="Restore Project"
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPermanentDeleteProject(project.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete Forever"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                      title="Move to Trash"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-1 text-gray-100 group-hover:text-accent-400 transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono mb-6 truncate">
                  {project.id}
                </p>

                <div className="mt-auto flex justify-between items-center text-sm border-t border-gray-800 pt-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <FileCode size={14} />
                    <span className="text-xs font-medium">
                      {project.files?.length || 1} Files
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock size={14} />
                    <span className="text-xs">
                      {new Date(project.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto w-full mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p className="mb-2">
          Developed by{" "}
          <span className="text-gray-300 font-medium">
            Rakibul Hashan Rabbi
          </span>
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://github.com/Rakibul-Hashan/ao-ide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-accent-500 transition-colors"
          >
            <Github size={14} /> GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/rakibulhashanrabbi/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-accent-500 transition-colors"
          >
            <Linkedin size={14} /> LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
};
