
import React, { useState } from 'react';
import { User, EditorSettings } from '../types';
import { User as UserIcon, Save, ArrowLeft, Settings, Type, Layout, Code2, Camera, Download, Palette, Cloud, Sun, Moon } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onBack }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [settings, setSettings] = useState<EditorSettings>(user.settings);

  const handleSave = () => {
    onUpdate({
      ...user,
      name,
      bio,
      avatar,
      settings
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "user_settings.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden ring-4 ring-gray-800 shadow-lg">
                 {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-gray-500" />}
              </div>
              <h2 className="text-xl font-bold truncate text-gray-100">{name}</h2>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleExport} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-100 py-2 rounded-lg flex items-center justify-center gap-2 text-sm border border-gray-700 transition-colors">
               <Download size={16} /> Export User Data
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6 md:space-y-8">
            
            {/* Profile Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-800 pb-4 text-gray-100">
                <UserIcon size={20} className="text-accent-600" /> Public Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-gray-100 focus:border-accent-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                  <textarea 
                    rows={3}
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-gray-100 focus:border-accent-600 outline-none transition-colors"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Camera className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                        <input 
                            type="text" 
                            value={avatar} 
                            onChange={(e) => setAvatar(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 pl-10 text-gray-100 focus:border-accent-600 outline-none transition-colors"
                            placeholder="https://example.com/me.png"
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-800 pb-4 text-gray-100">
                <Settings size={20} className="text-accent-600" /> Editor Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2"><Palette size={16}/> Theme</label>
                    <select 
                        value={settings.theme}
                        onChange={(e) => setSettings({...settings, theme: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-gray-100 outline-none focus:border-accent-600"
                    >
                        <option value="theme-dark">Dark (Default)</option>
                        <option value="theme-light">Light</option>
                        <option value="theme-dracula">Dracula</option>
                        <option value="theme-solarized">Solarized Dark</option>
                        <option value="theme-monokai">Monokai</option>
                    </select>
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2"><Type size={16}/> Font Size</label>
                    <input 
                        type="number" 
                        value={settings.fontSize}
                        onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-gray-100 outline-none focus:border-accent-600"
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2"><Layout size={16}/> Tab Size</label>
                    <input 
                        type="number" 
                        value={settings.tabSize}
                        onChange={(e) => setSettings({...settings, tabSize: Number(e.target.value)})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-gray-100 outline-none focus:border-accent-600"
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2"><Code2 size={16}/> Font Family</label>
                    <select 
                        value={settings.fontFamily}
                        onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-gray-100 outline-none focus:border-accent-600"
                    >
                        <option value='"Fira Code", monospace'>Fira Code (Default)</option>
                        <option value='"Courier New", Courier, monospace'>Courier New</option>
                        <option value='"Consolas", monospace'>Consolas</option>
                        <option value='monospace'>System Monospace</option>
                    </select>
                 </div>
              </div>

              <div className="mt-6 space-y-3">
                 <div className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <span className="text-sm font-medium text-gray-300">Word Wrap</span>
                    <input type="checkbox" checked={settings.wordWrap} onChange={(e) => setSettings({...settings, wordWrap: e.target.checked})} className="w-5 h-5 accent-accent-600"/>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <span className="text-sm font-medium text-gray-300">Line Numbers</span>
                    <input type="checkbox" checked={settings.showLineNumbers} onChange={(e) => setSettings({...settings, showLineNumbers: e.target.checked})} className="w-5 h-5 accent-accent-600"/>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <span className="text-sm font-medium text-gray-300">Minimap</span>
                    <input type="checkbox" checked={settings.minimap} onChange={(e) => setSettings({...settings, minimap: e.target.checked})} className="w-5 h-5 accent-accent-600"/>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2">
                        <Cloud size={16} className={settings.useCloudStorage ? "text-accent-600" : "text-gray-500"} />
                        <span className="text-sm font-medium text-gray-300">Cloud Sync (Simulated)</span>
                    </div>
                    <input type="checkbox" checked={settings.useCloudStorage || false} onChange={(e) => setSettings({...settings, useCloudStorage: e.target.checked})} className="w-5 h-5 accent-accent-600"/>
                 </div>
              </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all active:scale-95">
                    <Save size={20} /> Save Changes
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
