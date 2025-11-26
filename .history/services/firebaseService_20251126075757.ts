
import { User, Project } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Database
const DB: { users: Record<string, User>, projects: Record<string, Project[]> } = {
  users: {},
  projects: {}
};

export const saveUser = async (user: User): Promise<void> => {
  await delay(500); // Simulate network latency
  DB.users[user.email] = user;
  // Also save to local storage as a "cloud backup" for this simulation
  localStorage.setItem(`cloud_user_${user.email}`, JSON.stringify(user));
};

export const getUser = async (email: string): Promise<User | null> => {
  await delay(500);
  
  // 1. Check in-memory DB
  if (DB.users[email]) return DB.users[email];
  
  // 2. Check persistent storage simulation
  const cached = localStorage.getItem(`cloud_user_${email}`);
  if (cached) {
      const user = JSON.parse(cached);
      DB.users[email] = user;
      return user;
  }
  
  return null;
};

export const saveProject = async (email: string, project: Project): Promise<void> => {
  await delay(300);
  
  // Initialize project array for user if not exists
  if (!DB.projects[email]) {
      // Try load from storage first
      const cached = localStorage.getItem(`cloud_projects_${email}`);
      DB.projects[email] = cached ? JSON.parse(cached) : [];
  }
  
  const index = DB.projects[email].findIndex(p => p.id === project.id);
  if (index >= 0) {
    DB.projects[email][index] = project;
  } else {
    DB.projects[email].unshift(project); // Add to top
  }
  
  // Persist
  localStorage.setItem(`cloud_projects_${email}`, JSON.stringify(DB.projects[email]));
};

export const getProjects = async (email: string): Promise<Project[]> => {
  await delay(300);
  
  if (DB.projects[email]) return DB.projects[email];
  
  const cached = localStorage.getItem(`cloud_projects_${email}`);
  if (cached) {
      const projects = JSON.parse(cached);
      DB.projects[email] = projects;
      return projects;
  }
  
  return [];
};
