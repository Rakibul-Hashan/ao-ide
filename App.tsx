//App.tsx
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { Profile } from './components/Profile';
import { User, Project, Language, File, EditorSettings } from './types';
import { saveUser, getUser, saveProject, getProjects } from './services/firebaseService';

// Updated templates to start with a SINGLE file
const PROJECT_TEMPLATES: Record<Language, File[]> = {
  [Language.JAVASCRIPT]: [
    { id: '1', name: 'main.js', language: Language.JAVASCRIPT, content: 'console.log("App Started");\n\nconst sum = (a, b) => a + b;\nconsole.log("Result:", sum(5, 10));' }
  ],
  [Language.PYTHON]: [
    { id: '1', name: 'main.py', language: Language.PYTHON, content: 'print("Python App Running")\n\ndef add(a, b):\n    return a + b\n\nprint(f"Result: {add(10, 5)}")' }
  ],
  [Language.JAVA]: [
    { id: '1', name: 'Main.java', language: Language.JAVA, content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}' }
  ],
  [Language.CPP]: [
    { id: '1', name: 'main.cpp', language: Language.CPP, content: '#include <iostream>\n\nint main() {\n    std::cout << "Hello C++" << std::endl;\n    return 0;\n}' }
  ],
  [Language.C]: [
    { id: '1', name: 'main.c', language: Language.C, content: '#include <stdio.h>\n\nint main() {\n    printf("Hello C\\n");\n    return 0;\n}' }
  ],
  [Language.HTML]: [
    { id: '1', name: 'index.html', language: Language.HTML, content: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 2rem; }\n  </style>\n</head>\n<body>\n  <h1>Hello Web</h1>\n  <script>\n    console.log("Script loaded");\n  </script>\n</body>\n</html>' }
  ],
  [Language.SQL]: [
    { id: '1', name: 'query.sql', language: Language.SQL, content: 'SELECT "Hello SQL" as message;' }
  ],
  [Language.CSS]: [],
  [Language.JSON]: [],
  [Language.MARKDOWN]: [],
  [Language.DOCKERFILE]: [],
  [Language.PLAINTEXT]: []
};

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  wordWrap: false,
  showLineNumbers: true,
  theme: 'theme-dark',
  tabSize: 2,
  minimap: false,
  fontFamily: '"Fira Code", monospace',
  useCloudStorage: false
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // 1. Check for Shared Project URL
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
        try {
            const base64 = hash.replace('#share=', '');
            const json = atob(base64);
            const sharedProject = JSON.parse(json);
            
            // Validate basic structure
            if (sharedProject && sharedProject.files && sharedProject.language) {
                // Ensure ID is unique so it doesn't overwrite existing unless intended
                sharedProject.id = 'imported_' + Date.now();
                sharedProject.name = `Shared: ${sharedProject.name}`;
                setCurrentProject(sharedProject);
                setIsImporting(true);
                
                // Clear hash so refresh doesn't re-trigger weirdly
                window.history.replaceState(null, '', window.location.pathname);
            }
        } catch (e) {
            console.error("Failed to load shared project", e);
            alert("Invalid or corrupted share link.");
        }
    }

    // 2. Load User
    const localUser = localStorage.getItem('cloudcode_user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      if (!parsedUser.settings) parsedUser.settings = DEFAULT_SETTINGS;
      if (!parsedUser.extensions) parsedUser.extensions = [];
      setUser(parsedUser);
      
      // Only load user data if we aren't viewing a shared project immediately
      if (!isImporting) {
        loadUserData(parsedUser.email, parsedUser.settings.useCloudStorage || false);
      }
    }
  }, []);

  const loadUserData = async (email: string, useCloud: boolean) => {
      if (useCloud) {
          try {
             const cloudUser = await getUser(email);
             if (cloudUser) {
                 setUser(cloudUser);
                 const cloudProjects = await getProjects(email);
                 setProjects(cloudProjects);
             }
          } catch (e) {
              console.error("Failed to load from cloud", e);
          }
      } else {
          const localProjects = localStorage.getItem('cloudcode_projects');
          if (localProjects) {
             const parsed = JSON.parse(localProjects);
             setProjects(parsed);
          }
      }
  };

  // Global Theme Effect
  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-dracula', 'theme-solarized', 'theme-monokai');
    
    const themeClass = user?.settings.theme || 'theme-dark';
    document.documentElement.classList.add(themeClass);
    
    if (themeClass === 'theme-light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
  }, [user?.settings.theme]);

  const handleLogin = async (loggedInUser: User) => {
    if (!loggedInUser.settings) loggedInUser.settings = DEFAULT_SETTINGS;
    if (!loggedInUser.extensions) loggedInUser.extensions = [];
    setUser(loggedInUser);
    localStorage.setItem('cloudcode_user', JSON.stringify(loggedInUser));
    await loadUserData(loggedInUser.email, loggedInUser.settings.useCloudStorage || false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('cloudcode_user');
    setUser(null);
    setCurrentProject(null);
    setView('dashboard');
    document.documentElement.classList.remove('theme-light', 'theme-dracula', 'theme-solarized', 'theme-monokai');
    document.documentElement.classList.add('theme-dark', 'dark');
  };

  const handleCreateProject = async (name: string, language: Language) => {
    if (!user) return;
    const templates = PROJECT_TEMPLATES[language] || PROJECT_TEMPLATES[Language.JAVASCRIPT];
    const files = JSON.parse(JSON.stringify(templates)); // Deep copy

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      language,
      files: files,
      lastModified: Date.now(),
    };
    
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    setCurrentProject(newProject);
    
    if (user.settings.useCloudStorage) {
        await saveProject(user.email, newProject);
    } else {
        localStorage.setItem('cloudcode_projects', JSON.stringify(updatedProjects));
    }
  };

  const handleSaveProject = async (updatedProject: Project) => {
    if (!user) return;
    
    // If it was an imported shared project, save it as a new project now
    let finalProject = updatedProject;
    let newProjectsList = projects;

    if (isImporting) {
        // Remove imported flag logic (conceptually)
        // Add to project list if not there
        const exists = projects.find(p => p.id === updatedProject.id);
        if (!exists) {
            newProjectsList = [updatedProject, ...projects];
        } else {
             newProjectsList = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        }
        setIsImporting(false); // No longer "just looking"
    } else {
        newProjectsList = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    }

    setProjects(newProjectsList);
    setCurrentProject(finalProject);
    
    if (user.settings.useCloudStorage) {
        await saveProject(user.email, finalProject);
    } else {
        localStorage.setItem('cloudcode_projects', JSON.stringify(newProjectsList));
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure? This cannot be undone.")) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      if (currentProject && currentProject.id === id) setCurrentProject(null);
      
      if (!user.settings.useCloudStorage) {
         if (updatedProjects.length === 0) localStorage.removeItem('cloudcode_projects');
         else localStorage.setItem('cloudcode_projects', JSON.stringify(updatedProjects));
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cloudcode_user', JSON.stringify(updatedUser));
    if (updatedUser.settings.useCloudStorage) {
        await saveUser(updatedUser);
    }
  };

  const handleExtensionChange = (extensions: string[]) => {
    if (user) {
        const updatedUser = { ...user, extensions };
        handleUpdateUser(updatedUser);
    }
  };

  const handleUpdateSettings = (settings: EditorSettings) => {
    if (user) {
        const updatedUser = { ...user, settings };
        handleUpdateUser(updatedUser);
    }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  if (currentProject) {
    return (
      <Editor 
        key={currentProject.id} 
        project={currentProject} 
        userSettings={user.settings}
        installedExtensions={user.extensions}
        onSave={handleSaveProject}
        onClose={() => { setCurrentProject(null); setIsImporting(false); }}
        onExtensionChange={handleExtensionChange}
        onUpdateSettings={handleUpdateSettings}
      />
    );
  }

  if (view === 'profile') {
    return (
      <Profile 
        user={user} 
        onUpdate={handleUpdateUser} 
        onBack={() => setView('dashboard')} 
      />
    );
  }

  return (
    <Dashboard
      projects={projects}
      userName={user.name}
      userAvatar={user.avatar}
      onCreateProject={handleCreateProject}
      onOpenProject={setCurrentProject}
      onDeleteProject={handleDeleteProject}
      onLogout={handleLogout}
      onProfileClick={() => setView('profile')}
    />
  );
};

export default App;
