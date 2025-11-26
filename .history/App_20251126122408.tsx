// App.tsx
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { Profile } from './components/Profile';
import { User, Project, Language, File, EditorSettings } from './types';
import { saveUser, getUser, saveProject, getProjects } from './services/firebaseService';

// Updated templates to support multi-file structure
const PROJECT_TEMPLATES: Record<Language, File[]> = {
  [Language.JAVASCRIPT]: [
    { id: '1', name: 'main.js', language: Language.JAVASCRIPT, content: 'const utils = require("./utils.js");\n\nconsole.log("App Started");\nconst result = utils.add(5, 10);\nconsole.log("Result:", result);' },
    { id: '2', name: 'utils.js', language: Language.JAVASCRIPT, content: 'function add(a, b) {\n  return a + b;\n}\n\nmodule.exports = { add };' }
  ],
  [Language.PYTHON]: [
    { id: '1', name: 'main.py', language: Language.PYTHON, content: 'import utils\n\nprint("Python App Running")\nprint(f"Calc: {utils.calc(10, 2)}")' },
    { id: '2', name: 'utils.py', language: Language.PYTHON, content: 'def calc(a, b):\n    return a * b' }
  ],
  [Language.JAVA]: [
    { id: '1', name: 'Main.java', language: Language.JAVA, content: 'public class Main {\n    public static void main(String[] args) {\n        Helper h = new Helper();\n        System.out.println(h.greet("World"));\n    }\n}' },
    { id: '2', name: 'Helper.java', language: Language.JAVA, content: 'public class Helper {\n    public String greet(String name) {\n        return "Hello " + name;\n    }\n}' }
  ],
  [Language.CPP]: [
    { id: '1', name: 'main.cpp', language: Language.CPP, content: '#include <iostream>\n#include "math_utils.h"\n\nint main() {\n    std::cout << "Sum: " << add(3, 4) << std::endl;\n    return 0;\n}' },
    { id: '2', name: 'math_utils.h', language: Language.CPP, content: 'int add(int a, int b) {\n    return a + b;\n}' }
  ],
  [Language.C]: [
    { id: '1', name: 'main.c', language: Language.C, content: '#include <stdio.h>\n#include "utils.h"\n\nint main() {\n    printf("App Started\\n");\n    printf("Sum: %d\\n", add(5, 7));\n    return 0;\n}' },
    { id: '2', name: 'utils.h', language: Language.C, content: 'int add(int a, int b) {\n    return a + b;\n}' }
  ],
  [Language.HTML]: [
    { id: '1', name: 'index.html', language: Language.HTML, content: '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello Web</h1>\n  <script src="script.js"></script>\n</body>\n</html>' },
    { id: '2', name: 'style.css', language: Language.CSS, content: 'body { background: #111; color: white; }' },
    { id: '3', name: 'script.js', language: Language.JAVASCRIPT, content: 'console.log("DOM Loaded");' }
  ],
  [Language.SQL]: [
    { id: '1', name: 'query.sql', language: Language.SQL, content: 'SELECT * FROM Users;' },
    { id: '2', name: 'schema.sql', language: Language.SQL, content: 'CREATE TABLE Users (id INT, name VARCHAR(50));' }
  ],
  // Empty arrays for auxiliary file types
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
  theme: 'dark',
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

  useEffect(() => {
    // Check local storage for initial auth check (simplification)
    const localUser = localStorage.getItem('cloudcode_user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      // Ensure settings and extensions exist for legacy users
      if (!parsedUser.settings) parsedUser.settings = DEFAULT_SETTINGS;
      if (!parsedUser.extensions) parsedUser.extensions = [];
      setUser(parsedUser);
      loadUserData(parsedUser.email, parsedUser.settings.useCloudStorage || false);
    }
  }, []);

  const loadUserData = async (email: string, useCloud: boolean) => {
      // If cloud is enabled, try to fetch fresh data
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
          // Load projects from local
          const localProjects = localStorage.getItem('cloudcode_projects');
          if (localProjects) {
             const parsed = JSON.parse(localProjects);
             // Migration logic if needed
             const migrated = parsed.map((p: any) => {
                if (!p.files) {
                  return {
                    ...p,
                    files: [{ id: '1', name: 'main.' + (p.language === 'python' ? 'py' : 'js'), content: p.code, language: p.language }]
                  };
                }
                return p;
              });
             setProjects(migrated);
          }
      }
  };

  // Global Theme Effect
  useEffect(() => {
    if (user?.settings.theme === 'light') {
       document.documentElement.classList.remove('dark');
       document.documentElement.classList.add('light');
    } else {
       document.documentElement.classList.remove('light');
       document.documentElement.classList.add('dark');
    }
  }, [user?.settings.theme]);

  const handleLogin = async (loggedInUser: User) => {
    if (!loggedInUser.settings) loggedInUser.settings = DEFAULT_SETTINGS;
    if (!loggedInUser.extensions) loggedInUser.extensions = [];
    setUser(loggedInUser);
    
    // Initial save/load logic
    localStorage.setItem('cloudcode_user', JSON.stringify(loggedInUser));
    await loadUserData(loggedInUser.email, loggedInUser.settings.useCloudStorage || false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('cloudcode_user');
    setUser(null);
    setCurrentProject(null);
    setView('dashboard');
  };

  const handleCreateProject = async (name: string, language: Language) => {
    if (!user) return;
    const templates = PROJECT_TEMPLATES[language] || PROJECT_TEMPLATES[Language.JAVASCRIPT];
    // Deep copy templates
    const files = JSON.parse(JSON.stringify(templates));

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
    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    setCurrentProject(updatedProject);
    
    if (user.settings.useCloudStorage) {
        await saveProject(user.email, updatedProject);
    } else {
        localStorage.setItem('cloudcode_projects', JSON.stringify(updatedProjects));
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;
    if (window.confirm("Are you sure? This cannot be undone.")) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      if (currentProject && currentProject.id === id) setCurrentProject(null);
      
      // Note: Delete not implemented in mock service properly for individual items, assuming overwrite list or local
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

  if (!user) return <Auth onLogin={handleLogin} />;

  if (currentProject) {
    return (
      <Editor 
        key={currentProject.id} // Forces remount on project switch to load correct session
        project={currentProject} 
        userSettings={user.settings}
        installedExtensions={user.extensions}
        onSave={handleSaveProject}
        onClose={() => setCurrentProject(null)}
        onExtensionChange={handleExtensionChange}
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
