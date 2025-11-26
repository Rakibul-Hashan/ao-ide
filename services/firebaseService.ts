// // firebaseSevices.ts
// import { User, Project } from '../types';

// // Simulate network delay
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// // Mock Database
// const DB: { users: Record<string, User>, projects: Record<string, Project[]> } = {
//   users: {},
//   projects: {}
// };

// export const saveUser = async (user: User): Promise<void> => {
//   await delay(500); // Simulate network latency
//   DB.users[user.email] = user;
//   // Also save to local storage as a "cloud backup" for this simulation
//   localStorage.setItem(`cloud_user_${user.email}`, JSON.stringify(user));
// };

// export const getUser = async (email: string): Promise<User | null> => {
//   await delay(500);
  
//   // 1. Check in-memory DB
//   if (DB.users[email]) return DB.users[email];
  
//   // 2. Check persistent storage simulation
//   const cached = localStorage.getItem(`cloud_user_${email}`);
//   if (cached) {
//       const user = JSON.parse(cached);
//       DB.users[email] = user;
//       return user;
//   }
  
//   return null;
// };

// export const saveProject = async (email: string, project: Project): Promise<void> => {
//   await delay(300);
  
//   // Initialize project array for user if not exists
//   if (!DB.projects[email]) {
//       // Try load from storage first
//       const cached = localStorage.getItem(`cloud_projects_${email}`);
//       DB.projects[email] = cached ? JSON.parse(cached) : [];
//   }
  
//   const index = DB.projects[email].findIndex(p => p.id === project.id);
//   if (index >= 0) {
//     DB.projects[email][index] = project;
//   } else {
//     DB.projects[email].unshift(project); // Add to top
//   }
  
//   // Persist
//   localStorage.setItem(`cloud_projects_${email}`, JSON.stringify(DB.projects[email]));
// };

// export const getProjects = async (email: string): Promise<Project[]> => {
//   await delay(300);
  
//   if (DB.projects[email]) return DB.projects[email];
  
//   const cached = localStorage.getItem(`cloud_projects_${email}`);
//   if (cached) {
//       const projects = JSON.parse(cached);
//       DB.projects[email] = projects;
//       return projects;
//   }
  
//   return [];
// };



import { User, Project } from "../types";
import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// Save user profile
export const saveUser = async (user: User): Promise<void> => {
  const ref = doc(db, "users", user.email);
  await setDoc(ref, user, { merge: true });
};

// Load user
export const getUser = async (email: string): Promise<User | null> => {
  const ref = doc(db, "users", email);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as User;
  }
  return null;
};

// Save or update project
export const saveProject = async (email: string, project: Project) => {
  const ref = doc(db, "users", email, "projects", project.id);
  await setDoc(ref, project, { merge: true });
};

// Load all projects
export const getProjects = async (email: string): Promise<Project[]> => {
  const ref = collection(db, "users", email, "projects");
  const snapshot = await getDocs(ref);
  const list: Project[] = [];
  snapshot.forEach((s) => list.push(s.data() as Project));
  return list.sort((a, b) => b.lastModified - a.lastModified);
};
