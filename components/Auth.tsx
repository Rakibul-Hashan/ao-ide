/* 
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, Code2, Info } from 'lucide-react';
import { auth } from "../services/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";


interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@cloudcode.dev');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      email,
      name: name || email.split('@')[0],
      projects: [],
      extensions: [],
      settings: {
        fontSize: 14,
        wordWrap: false,
        showLineNumbers: true,
        theme: 'theme-dark',
        tabSize: 2,
        minimap: false,
        fontFamily: '"Fira Code", monospace'
      }
    };
    
    localStorage.setItem('cloudcode_user', JSON.stringify(user));
    onLogin(user);
  };

  const toggleMode = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    if (newIsLogin) {
      setEmail('demo@cloudcode.dev');
      setPassword('password');
    } else {
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent-600/20">
            <Code2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Welcome to CloudCode</h1>
          <p className="text-gray-400 mt-2 text-center">Your cloud-based development environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              required
            />
          </div>

          {isLogin && (
            <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-400 flex items-start space-x-2">
              <Info className="w-4 h-4 mt-0.5 text-accent-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300">Demo Credentials:</p>
                <p>Email: <span className="font-mono text-accent-400">demo@cloudcode.dev</span></p>
                <p>Password: <span className="font-mono text-accent-400">password</span></p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-accent-600 hover:bg-accent-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-accent-600/20 mt-6"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}; */

import React, { useState } from "react";
import { User } from "../types";
import { Lock, Mail, User as UserIcon, Code2, Info } from "lucide-react";

import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
} from "../services/firebaseConfig";

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("demo@cloudcode.dev");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const buildUserObject = (email: string, nameValue?: string): User => ({
    email,
    name: nameValue || email.split("@")[0],
    projects: [],
    extensions: [],
    settings: {
      fontSize: 14,
      wordWrap: false,
      showLineNumbers: true,
      theme: "theme-dark",
      tabSize: 2,
      minimap: false,
      fontFamily: '"Fira Code", monospace',
      useCloudStorage: false,
    },
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let firebaseUser;

      if (isLogin) {
        const result = await loginWithEmail(email, password);
        firebaseUser = result.user;
      } else {
        const result = await registerWithEmail(email, password);
        firebaseUser = result.user;
      }

      const finalUser = buildUserObject(firebaseUser.email || email, name);

      localStorage.setItem("cloudcode_user", JSON.stringify(finalUser));
      onLogin(finalUser);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await loginWithGoogle();
      const firebaseUser = result.user;

      const finalUser = buildUserObject(firebaseUser.email || "");

      localStorage.setItem("cloudcode_user", JSON.stringify(finalUser));
      onLogin(finalUser);
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed");
    }
  };

  const toggleMode = () => {
    const newState = !isLogin;
    setIsLogin(newState);

    if (newState) {
      setEmail("demo@cloudcode.dev");
      setPassword("password");
      setName("");
    } else {
      setEmail("");
      setPassword("");
      setName("");
    }

    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-800">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-accent-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent-600/20">
            <Code2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">
            Welcome to CloudCode
          </h1>
          <p className="text-gray-400 mt-2 text-center">
            Your cloud-based development environment
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Name (Signup Only) */}
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
              required
            />
          </div>

          {/* Demo Credentials Notice */}
          {isLogin && (
            <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-400 flex items-start space-x-2">
              <Info className="w-4 h-4 mt-0.5 text-accent-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300">Demo Credentials:</p>
                <p>
                  Email:{" "}
                  <span className="font-mono text-accent-400">
                    demo@cloudcode.dev
                  </span>
                </p>
                <p>
                  Password:{" "}
                  <span className="font-mono text-accent-400">password</span>
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-accent-600 hover:bg-accent-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-accent-600/20 mt-6"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full mt-4 bg-white text-gray-900 font-semibold py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="w-5 h-5"
          />
          <span>Sign in with Google</span>
        </button>

        {/* Toggle Sign-In / Sign-Up */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
