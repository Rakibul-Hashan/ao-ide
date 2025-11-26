
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { User, Project } from '../types';

// ============================================================================
// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a project > Build > Firestore Database > Create (Test Mode)
// 3. Project Settings > General > Your apps > Web </>
// 4. Copy the config object and paste it below.
// ============================================================================

const firebaseConfig: any = {
  // --- PASTE YOUR FIREBASE CONFIG HERE ---
  // apiKey: "AIzaSy...",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

// If config is missing, we gracefully fallback to simulation to prevent app crash
const isConfigured = !!firebaseConfig.apiKey;

let db: any;
try {
    if (isConfigured) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (e) {
    console.error("Firebase init error (Did you add your keys?):", e);
}

// --- Real Firestore Implementation ---

export const saveUser = async (user: User): Promise<void> => {
  if (!isConfigured || !db) {
     console.warn("Firebase not configured. Saving to local simulation.");
     localStorage.setItem(`cloud_user_${user.email}`, JSON.stringify(user));
     return;
  }
  
  try {
    const userRef = doc(db, "users", user.email);
    // Remove complex objects if necessary, but Firestore handles JSON well.
    // Ensure undefined values are not passed (Firestore rejects them).
    const userData = JSON.parse(JSON.stringify(user)); 
    await setDoc(userRef, userData, { merge: true });
  } catch (e) {
    console.error("Error saving user to Cloud:", e);
  }
};

export const getUser = async (email: string): Promise<User | null> => {
  if (!isConfigured || !db) {
      const cached = localStorage.getItem(`cloud_user_${email}`);
      return cached ? JSON.parse(cached) : null;
  }

  try {
    const userRef = doc(db, "users", email);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (e) {
    console.error("Error fetching user from Cloud:", e);
    return null;
  }
};

export const saveProject = async (email: string, project: Project): Promise<void> => {
  if (!isConfigured || !db) {
     const key = `cloud_projects_${email}`;
     const existing = JSON.parse(localStorage.getItem(key) || "[]");
     const idx = existing.findIndex((p: Project) => p.id === project.id);
     if (idx >= 0) existing[idx] = project; else existing.unshift(project);
     localStorage.setItem(key, JSON.stringify(existing));
     return;
  }

  try {
    const projectsRef = doc(db, "projects", email);
    const docSnap = await getDoc(projectsRef);
    
    let list: Project[] = [];
    if (docSnap.exists()) {
        list = docSnap.data().list || [];
    }
    
    const index = list.findIndex(p => p.id === project.id);
    if (index >= 0) {
        list[index] = project;
    } else {
        list.unshift(project);
    }
    
    await setDoc(projectsRef, { list });
  } catch (e) {
    console.error("Error saving project to Cloud:", e);
  }
};

export const getProjects = async (email: string): Promise<Project[]> => {
  if (!isConfigured || !db) {
     const key = `cloud_projects_${email}`;
     return JSON.parse(localStorage.getItem(key) || "[]");
  }

  try {
    const projectsRef = doc(db, "projects", email);
    const docSnap = await getDoc(projectsRef);

    if (docSnap.exists()) {
      return docSnap.data().list as Project[];
    }
    return [];
  } catch (e) {
    console.error("Error fetching projects from Cloud:", e);
    return [];
  }
};

export const deleteProject = async (email: string, projectId: string): Promise<void> => {
  if (!isConfigured || !db) {
     const key = `cloud_projects_${email}`;
     const existing: Project[] = JSON.parse(localStorage.getItem(key) || "[]");
     const updated = existing.filter(p => p.id !== projectId);
     localStorage.setItem(key, JSON.stringify(updated));
     return;
  }

  try {
    const projectsRef = doc(db, "projects", email);
    const docSnap = await getDoc(projectsRef);
    
    if (docSnap.exists()) {
        let list: Project[] = docSnap.data().list || [];
        const updatedList = list.filter(p => p.id !== projectId);
        await setDoc(projectsRef, { list: updatedList });
    }
  } catch (e) {
    console.error("Error deleting project from Cloud:", e);
  }
};
