import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Video, Globe, Headphones, CheckCircle, Loader2, Download,
  AlertCircle, LayoutDashboard, Folder, Library, BarChart3, Settings,
  Search, Bell, User, PlusCircle, Play, Sliders, ChevronDown
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import AuthModal from './components/AuthModal';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish (ES)', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi (HI)', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic (SA)', flag: '🇸🇦' },
  { code: 'fr', name: 'French (FR)', flag: '🇫🇷' },
  { code: 'de', name: 'German (DE)', flag: '🇩🇪' }
];

function App() {
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [languages, setLanguages] = useState(['es']);
  const [projectData, setProjectData] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchRecentProjects(currentUser.uid);
      } else {
        setRecentProjects([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchRecentProjects = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/user/${userId}`);
      setRecentProjects(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const calculateProgress = () => {
    if (status === 'completed') return 100;
    if (status?.includes('downloading')) return 80;
    if (status?.includes('dubbing')) return 40;
    if (status === 'uploaded') return 15;
    if (!!status) return 5;
    return 0;
  };

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    toast.success('Video loaded successfully');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi'], 'audio/*': ['.mp3', '.wav'] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatus(null);
    setProjectData(null);
    setProjectId(null);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('languages', JSON.stringify(languages));
    if (user) formData.append('userId', user.uid);

    try {
      const response = await axios.post(`${API_BASE_URL}/videos/upload`, formData);
      setProjectId(response.data.videoId);
      toast.success('Processing started');
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error.response?.data || error.message || 'Connection error';
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (projectId && status !== 'completed' && status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/videos/${projectId}`);
          setStatus(response.data.status);
          setProjectData(response.data);
          if (response.data.status === 'completed') {
            clearInterval(interval);
            toast.success('Dubbing completed! Your video is ready to download.');
          }
          if (response.data.status === 'failed') {
            clearInterval(interval);
            toast.error('Processing failed. Please try again.');
          }
        } catch (error) { }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [projectId, status]);

  return (
    <div className="app-shell">
      <Toaster position="top-right" />

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="logo logo-horizontal">
            <div className="logo-icon">V</div>
            <span className="logo-text">VOXFLOW <span>AI</span></span>
          </div>
          <div className="breadcrumbs">
            <span>Dashboard</span> / Projects / Library / Settings
          </div>
          <div className="user-profile">
            <button className="theme-toggle glass" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Globe size={18} /> : <div className="light-icon">☀️</div>}
            </button>
            <Bell size={20} className="text-dim" />
            <Search size={20} className="text-dim" />
            <div className="user-info" onClick={() => !user && setIsAuthModalOpen(true)}>
              <div className="user-avatar">
                <img src={user ? `https://ui-avatars.com/api/?name=${user.email}&background=6366f1&color=fff` : "https://ui-avatars.com/api/?name=?&background=333&color=fff"} alt="User" />
                <div className={`status-indicator ${user ? 'online' : 'offline'}`}></div>
              </div>
              <div className="user-names">
                <span className="user-name">{user ? user.email.split('@')[0] : 'Sign In'}</span>
                <span className="user-role">{user ? 'Member' : 'Guest'}</span>
              </div>
              {user ? (
                <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
              ) : (
                <ChevronDown size={16} className="text-dim" />
              )}
            </div>
          </div>
        </header>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        <section className="dashboard-grid">
          {/* Top Row: Upload & Language Selection */}
          <div className="top-row">
            <div className="glass card upload-section">
              <h3>UPLOAD NEW VIDEO</h3>
              <div {...getRootProps()} className={`drop-zone-premium ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="plus-btn"><PlusCircle size={28} /></div>
                <p className="plus-text">ADD VIDEO</p>
                <p className="sub-text">Click or drag your video file here<br />(MP4, MOV, max 5GB)</p>
              </div>
              {file && (
                <div className="file-preview-card glass">
                  <div className="video-thumb"><Video size={24} /></div>
                  <div className="file-info-mini">
                    <p className="filename">{file.name}</p>
                    <p className="filesize">{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                  <button className="analyze-btn" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? <Loader2 size={16} className="spin" /> : 'Analyze'}
                  </button>
                </div>
              )}
            </div>

            <div className="glass card language-section">
              <h3>LANGUAGE SELECTION</h3>
              <div className="select-group">
                <label>Source</label>
                <div className="custom-select glass">
                  <span>🇺🇸 English (US)</span>
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="select-group mt-6">
                <label>Target (Select Multiple)</label>
                <div className={`multi-select-dropdown glass ${isDropdownOpen ? 'open' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <div className="selected-tags">
                    {languages.length === 0 ? <span className="placeholder">Select languages...</span> :
                      languages.map(code => (
                        <div key={code} className="tag glass">
                          <span>{SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag}</span>
                          <span className="close" onClick={(e) => {
                            e.stopPropagation();
                            setLanguages(prev => prev.filter(l => l !== code));
                          }}>×</span>
                        </div>
                      ))
                    }
                  </div>
                  <ChevronDown size={16} className={`arrow ${isDropdownOpen ? 'up' : ''}`} />

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="dropdown-menu glass"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <div
                            key={lang.code}
                            className={`dropdown-item ${languages.includes(lang.code) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLanguages(prev =>
                                prev.includes(lang.code) ? prev.filter(l => l !== lang.code) : [...prev, lang.code]
                              );
                            }}
                          >
                            <span>{lang.flag} {lang.name}</span>
                            {languages.includes(lang.code) && <CheckCircle size={14} className="check-icon" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <button className="confirm-btn mt-6" onClick={handleUpload} disabled={isUploading || languages.length === 0}>
                {isUploading ? 'PROCESSING...' : 'CONFIRM LANGUAGES'}
              </button>
            </div>
          </div>

          {/* Bottom Row: Status Tracking */}
          <div className="glass card status-section">
            <div className="status-header">
              <h3>PROJECT STATUS & PROGRESS</h3>
              <p>Video: <span>{file ? file.name : 'No project active'}</span> (ID: {projectId || 'VF-XXXXX'})</p>
            </div>

            <div className="status-timeline">
              <TimelineStep number="1" label="Analyzing" active={status === 'uploaded'} done={['dubbing', 'downloading', 'completed'].some(s => status?.includes(s))} />
              <TimelineStep number="2" label="AI Dubbing" active={status?.includes('dubbing')} done={['downloading', 'completed'].some(s => status?.includes(s))} />
              <TimelineStep number="3" label="Downloading" active={status?.includes('downloading')} done={status === 'completed'} />
              <TimelineStep number="4" label="Completed" active={status === 'completed'} done={status === 'completed'} />
            </div>

            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <div className="progress-meta">
                <span className="status-text">{status ? status.replace(/_/g, ' ').toUpperCase() : 'Waiting for input...'}</span>
                <span className="percent">{calculateProgress()}%</span>
              </div>

              {status === 'completed' && projectData?.dubbedVersions && (
                <div className="download-section">
                  <h4>Download Dubbed Videos</h4>
                  <div className="download-buttons">
                    {Object.entries(projectData.dubbedVersions).map(([lang, path]) => (
                      <a
                        key={lang}
                        href={`http://localhost:5000${path}`}
                        download
                        className="download-btn"
                      >
                        <Download size={16} />
                        Download {lang.toUpperCase()} Version
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function RecentProjectItem({ name, id, active }) {
  return (
    <div className="recent-item glass">
      <div className="item-main">
        <p className="name">{name}</p>
        <p className="id">ID: {id}</p>
        <div className="item-actions">
          <Headphones size={14} className="icon-btn" />
          <Sliders size={14} className="icon-btn" />
        </div>
      </div>
      <div className={`status-toggle ${active ? 'on' : ''}`}></div>
    </div>
  );
}

function TimelineStep({ number, label, active, done }) {
  return (
    <div className={`timeline-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <div className="step-circle">
        {done ? <CheckCircle size={14} /> : number}
      </div>
      <div className="step-info">
        <p className="label">{number}. {label}</p>
        <p className="subtitle">{done ? 'Done' : active ? 'Active' : 'Pending'}</p>
      </div>
    </div>
  );
}

export default App;