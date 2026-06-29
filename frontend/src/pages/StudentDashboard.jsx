import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { api } from "../api";
import Report3D from "../components/Report3D";
import { 
  Calendar, 
  FileText, 
  PlusCircle, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Film, 
  Sparkles, 
  Printer, 
  Download, 
  LogOut, 
  X, 
  History, 
  Lock,
  ChevronRight,
  User,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  Trash2,
  Menu
} from "lucide-react";

const compileSummary = (updates) => {
  if (!updates || updates.length === 0) return "";
  
  let domainTasks = {};
  updates.forEach(u => {
    if (!domainTasks[u.domain_name]) {
      domainTasks[u.domain_name] = [];
    }
    let taskText = u.task_title;
    if (u.description) {
      const cleanDesc = u.description
        .replace(/Current Status:/g, "")
        .replace(/Key Accomplishments Today:/g, "")
        .replace(/Next Steps:/g, "")
        .replace(/\r?\n|\r/g, " ")
        .trim();
      
      if (cleanDesc.length > 0) {
        const truncated = cleanDesc.length > 120 ? cleanDesc.slice(0, 117) + "..." : cleanDesc;
        taskText += `: ${truncated}`;
      }
    }
    domainTasks[u.domain_name].push(taskText);
  });
  
  let summaryText = "Summary of Work Accomplished:\n\n";
  Object.keys(domainTasks).forEach(domain => {
    summaryText += `${domain.toUpperCase()}:\n`;
    const uniqueTasks = Array.from(new Set(domainTasks[domain]));
    uniqueTasks.forEach(task => {
      summaryText += `  • ${task}\n`;
    });
    summaryText += "\n";
  });
  
  return summaryText.trim();
};

export default function StudentDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState("log"); // 'log', 'history', 'report'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [domains, setDomains] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // Search state in history
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("");

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  // Report State
  const [reportData, setReportData] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportMode, setReportMode] = useState("month"); // 'month' or 'custom'
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysSinceRegistration, setDaysSinceRegistration] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0); // percentage
  const [printLayoutFormat, setPrintLayoutFormat] = useState("summary"); // 'summary' or 'detailed'
  const [reportSummary, setReportSummary] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isShorteningAI, setIsShorteningAI] = useState(false);

  const handleGenerateAISummary = async () => {
    if (!reportData || !reportData.updates || reportData.updates.length === 0) return;
    setIsGeneratingAI(true);
    setError("");
    try {
      const res = await api.generateAISummary(reportData.updates);
      setReportSummary(res.summary);
      setSuccess("AI Summary generated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to generate AI summary");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleShortenDescription = async () => {
    if (!description || description.trim().length === 0) return;
    setIsShorteningAI(true);
    setError("");
    try {
      const res = await api.shortenDailyUpdate(description);
      setDescription(res.short_text);
      setSuccess("Daily log optimized and shortened with AI!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to shorten update with AI");
    } finally {
      setIsShorteningAI(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (reportData && reportData.updates) {
      setReportSummary(compileSummary(reportData.updates));
    } else {
      setReportSummary("");
    }
  }, [reportData]);

  const fetchInitialData = async () => {
    try {
      const domData = await api.getDomains();
      setDomains(domData);
      if (domData.length > 0) {
        setDomainId(domData[0].id);
      }

      const updatesData = await api.getDailyUpdates();
      setUpdates(updatesData);

      const me = await api.getMe();
      setProfile(me);

      // Compute registration age
      const regDate = new Date(me.created_at);
      const diffTime = Math.abs(new Date() - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysSinceRegistration(diffDays);
      setUnlockProgress(Math.min((diffDays / 30) * 100, 100));

    } catch (err) {
      setError("Failed to load initial training data");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other";
    setMediaType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleCancelEdit = () => {
    setEditingUpdateId(null);
    setTaskTitle("");
    setDescription("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setDateStr(new Date().toISOString().split("T")[0]);
  };

  const handleEditClick = (update) => {
    setEditingUpdateId(update.id);
    setTaskTitle(update.task_title);
    setDescription(update.description);
    setDomainId(update.domain_id);
    setDateStr(update.date);
    if (update.media_url) {
      setMediaPreview(api.getFileUrl(update.media_url));
      setMediaType(update.media_type);
    } else {
      setMediaPreview(null);
      setMediaType(null);
    }
    setActiveTab("log");
  };

  const handleDeleteClick = async (updateId) => {
    if (!window.confirm("Are you sure you want to delete this daily update?")) return;
    setError("");
    setSuccess("");
    try {
      await api.deleteDailyUpdate(updateId);
      setSuccess("Daily update deleted successfully!");
      const updatesData = await api.getDailyUpdates();
      setUpdates(updatesData);
    } catch (err) {
      setError(err.message || "Failed to delete daily update");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("task_title", taskTitle);
    formData.append("description", description);
    formData.append("domain_id", domainId);
    formData.append("date_str", dateStr);
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    try {
      if (editingUpdateId) {
        await api.updateDailyUpdate(editingUpdateId, formData);
        setSuccess("Daily update updated successfully!");
        setEditingUpdateId(null);
      } else {
        await api.createDailyUpdate(formData);
        setSuccess("Daily update logged successfully!");
      }
      
      // Reset Form
      setTaskTitle("");
      setDescription("");
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setDateStr(new Date().toISOString().split("T")[0]);
      
      // Reload updates
      const updatesData = await api.getDailyUpdates();
      setUpdates(updatesData);
      
      // Automatically navigate to history to see it
      setTimeout(() => {
        setActiveTab("history");
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit update");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setError("");
    try {
      let data;
      if (reportMode === "month") {
        data = await api.getMonthlyReport(reportMonth);
      } else {
        data = await api.getMonthlyReport(null, null, reportStartDate, reportEndDate);
      }
      setReportData(data);
    } catch (err) {
      setError(err.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const [editingUpdateId, setEditingUpdateId] = useState(null);

  const getMinDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const getMaxDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isCurrentMonthUpdate = (dateStr) => {
    if (!dateStr) return false;
    const [year, month] = dateStr.split("-").map(Number);
    const today = new Date();
    return year === today.getFullYear() && month === (today.getMonth() + 1);
  };

  const [trainerInfo, setTrainerInfo] = useState(localStorage.getItem("trainer_info") || "");
  useEffect(() => {
    localStorage.setItem("trainer_info", trainerInfo);
  }, [trainerInfo]);

  const getReportLockReason = () => {
    return null;
  };

  const lockReason = null;
  const isReportLocked = false;

  // Filter history updates
  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.task_title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          update.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomainFilter === "" || update.domain_id.toString() === selectedDomainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass-panel ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Sparkles className="logo-icon" size={24} />
          <span>PORTAL</span>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} title="Close Menu">
            <X size={20} />
          </button>
        </div>

        {profile && (
          <div className="sidebar-profile">
            <div className="avatar">
              {username[0].toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{username}</span>
              <span className="profile-role">Student Account</span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "log" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("log");
              setIsSidebarOpen(false);
            }}
          >
            <PlusCircle size={18} />
            <span>Log Daily Work</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              setIsSidebarOpen(false);
            }}
          >
            <History size={18} />
            <span>History Timeline</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "report" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("report");
              handleGenerateReport();
              setIsSidebarOpen(false);
            }}
          >
            <FileText size={18} />
            <span>Monthly Report</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="glass-button secondary logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
 
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} title="Open Menu">
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Sparkles size={20} className="logo-icon" />
          <span>PORTAL</span>
        </div>
        <div style={{ width: "42px" }}></div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1 className="welcome-title">
              {activeTab === "log" && "Log Daily Training"}
              {activeTab === "history" && "Training Logs History"}
              {activeTab === "report" && "Monthly Progress Report"}
            </h1>
            <p className="welcome-subtitle">
              {activeTab === "log" && "Submit your accomplishments for the day"}
              {activeTab === "history" && "Review your past log entries and training updates"}
              {activeTab === "report" && "Analyze your monthly domain metrics and progress status"}
            </p>
          </div>
          <div className="header-date">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </header>

        <div className="content-body">
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          {/* TAB 1: LOG DAILY TRAINING */}
          {activeTab === "log" && (
            <div className="glass-panel dashboard-section card-form">
              <h3>{editingUpdateId ? "Edit Training Details" : "Log New Training Details"}</h3>
              <form onSubmit={handleFormSubmit} className="modern-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Select Training Domain</label>
                    {domains.length === 0 ? (
                      <div className="no-domains-warning">
                        <Lock size={14} /> No domains available. Please ask Admin to add domains first.
                      </div>
                    ) : (
                      <select 
                        className="glass-input glass-select"
                        value={domainId}
                        onChange={(e) => setDomainId(e.target.value)}
                        required
                      >
                        {domains.map(dom => (
                          <option key={dom.id} value={dom.id} style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>
                            {dom.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Date of Training</label>
                    <input 
                      type="date"
                      className="glass-input"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      min={getMinDateStr()}
                      max={getMaxDateStr()}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Task Title</label>
                  <input 
                    type="text"
                    className="glass-input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Briefly state what you focused on (e.g. Setting up Sqlite and FastAPI)"
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <label style={{ margin: 0 }}>Detailed Description</label>
                    <button
                      type="button"
                      className="glass-button"
                      onClick={handleShortenDescription}
                      disabled={isShorteningAI || !description || description.trim().length === 0}
                      style={{ padding: "4px 10px", fontSize: "0.8rem", gap: "4px" }}
                      title="AI will optimize and shorten your daily log details to be clean & professional."
                    >
                      {isShorteningAI ? "Shortening..." : "✨ Shorten with AI"}
                    </button>
                  </div>
                  <textarea 
                    className="glass-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a professional summary of tasks completed, concepts learned, and files modified..."
                    style={{ minHeight: "130px", resize: "vertical" }}
                    required
                  />
                </div>

                {/* Media Upload Box */}
                <div className="form-group">
                  <label>Add Media Attachment (Image or Video)</label>
                  <div 
                    className="file-upload-container modern-upload" 
                    onClick={() => document.getElementById("media-upload").click()}
                  >
                    <input 
                      id="media-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    
                    {mediaPreview ? (
                      <div className="file-upload-preview" onClick={(e) => e.stopPropagation()}>
                        {mediaType === "image" ? (
                          <img src={mediaPreview} alt="Preview" />
                        ) : (
                          <video src={mediaPreview} controls muted />
                        )}
                        <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon-wrapper">
                          <Film size={24} />
                        </div>
                        <p className="upload-text-main">Click to select files</p>
                        <p className="upload-text-sub">Supports PNG, JPG, MP4 or WEBM</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <button 
                    type="submit" 
                    className="glass-button" 
                    style={{ flex: 1, padding: "14px" }}
                    disabled={loading || domains.length === 0}
                  >
                    <PlusCircle size={18} /> {loading ? "Logging update..." : editingUpdateId ? "Update Training Details" : "Submit Daily Update"}
                  </button>
                  {editingUpdateId && (
                    <button
                      type="button"
                      className="glass-button secondary"
                      onClick={handleCancelEdit}
                      style={{ padding: "14px" }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: HISTORY TIMELINE */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Search and Filters toolbar */}
              <div className="glass-panel filter-toolbar">
                <div className="search-box">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search logs by keyword..." 
                    className="glass-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select 
                  className="glass-input glass-select filter-dropdown"
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                >
                  <option value="">All Domains</option>
                  {domains.map(dom => (
                    <option key={dom.id} value={dom.id} style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>
                      {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredUpdates.length === 0 ? (
                <div className="glass-panel empty-state">
                  <Activity size={40} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
                  <h3>No Training Logs Found</h3>
                  <p>No logged activities match your search filters or you haven't logged any daily logs yet.</p>
                </div>
              ) : (
                <div className="modern-updates-grid">
                  {filteredUpdates.map(update => (
                    <div key={update.id} className="glass-panel update-card-new">
                      <div className="card-top">
                        <span className="card-domain-badge">{update.domain_name}</span>
                        <span className="card-date-badge">{update.date}</span>
                      </div>
                      
                      <h3 className="card-title">{update.task_title}</h3>
                      <p className="card-desc">{update.description}</p>
                      
                      {update.media_url ? (
                        <div className="card-media-wrapper" style={{ marginTop: "10px" }}>
                          {update.media_type === "image" ? (
                            <img 
                              src={api.getFileUrl(update.media_url)} 
                              alt={update.task_title} 
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = "block";
                              }}
                            />
                          ) : (
                            <video 
                              src={api.getFileUrl(update.media_url)} 
                              controls 
                              preload="metadata" 
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = "block";
                              }}
                            />
                          )}
                          <div style={{ display: "none", color: "var(--text-secondary)", fontSize: "0.85rem", padding: "15px", textAlign: "center", width: "100%" }}>
                            📷 Image not uploaded
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          marginTop: "10px",
                          borderRadius: "8px", 
                          border: "1px dashed rgba(0, 0, 0, 0.1)", 
                          background: "rgba(0, 0, 0, 0.03)", 
                          padding: "10px 15px", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          color: "var(--text-secondary)", 
                          fontSize: "0.85rem" 
                        }}>
                          <span>📷 Image not uploaded</span>
                        </div>
                      )}
                      
                      {isCurrentMonthUpdate(update.date) && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid var(--border-glass)", paddingTop: "12px" }}>
                          <button 
                            className="glass-button secondary" 
                            style={{ padding: "6px 12px", fontSize: "0.8rem", height: "32px", border: "1px solid var(--border-glass-hover)" }}
                            onClick={() => handleEditClick(update)}
                          >
                            Edit Log
                          </button>
                          <button 
                            className="glass-button secondary" 
                            style={{ padding: "6px 12px", fontSize: "0.8rem", height: "32px", color: "var(--color-error)", border: "1px solid var(--border-glass-hover)" }}
                            onClick={() => handleDeleteClick(update.id)}
                          >
                            Delete Log
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONTHLY REPORT */}
          {activeTab === "report" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Unlock status panel */}
              <div className="glass-panel progress-card-new">
                <div className="progress-details">
                  <div className="progress-info-block">
                    <h3>Monthly Report Unlock Status</h3>
                    <p>To lock down and generate a final monthly training certification report, your account must complete at least 30 days of active registration.</p>
                  </div>
                  <div className="progress-count-pill">
                    <strong>{daysSinceRegistration} / 30</strong> Days Active
                  </div>
                </div>

                <div className="progress-bar-container-new">
                  <div 
                    className="progress-bar-fill-new"
                    style={{ width: `${unlockProgress}%` }}
                  />
                </div>

                <div className="progress-footer">
                  <div className="status-indicator success">
                    <CheckCircle2 size={16} />
                    <span>Report compiler active. Choose a period below to load your daily logs.</span>
                  </div>

                  <div className="month-picker-wrapper" style={{ flexWrap: "wrap", gap: "10px", marginTop: "15px" }}>
                    <select 
                      className="glass-input" 
                      value={reportMode} 
                      onChange={(e) => {
                        setReportMode(e.target.value);
                        setReportData(null);
                      }}
                      style={{ width: "160px" }}
                    >
                      <option value="month">By Month</option>
                      <option value="custom">Custom Range</option>
                    </select>

                    {reportMode === "month" ? (
                      <input 
                        type="month" 
                        className="glass-input" 
                        value={reportMonth} 
                        onChange={(e) => {
                          setReportMonth(e.target.value);
                          setReportData(null);
                        }}
                      />
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input 
                          type="date" 
                          className="glass-input" 
                          value={reportStartDate} 
                          onChange={(e) => {
                            setReportStartDate(e.target.value);
                            setReportData(null);
                          }}
                        />
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>to</span>
                        <input 
                          type="date" 
                          className="glass-input" 
                          value={reportEndDate} 
                          onChange={(e) => {
                            setReportEndDate(e.target.value);
                            setReportData(null);
                          }}
                        />
                      </div>
                    )}

                    <button 
                      className="glass-button" 
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      style={{ minWidth: "100px" }}
                    >
                      {reportLoading ? "..." : "Load Data"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Report breakdown details */}
              {reportData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                  
                  {/* Quick stats cards */}
                  <div className="report-quick-stats">
                    <div className="glass-panel stat-card-new">
                      <span className="stat-card-value">{reportData.total_updates}</span>
                      <span className="stat-card-label">Total Task Logs</span>
                    </div>
                    <div className="glass-panel stat-card-new">
                      <span className="stat-card-value">{reportData.completion_rate}%</span>
                      <span className="stat-card-label">Daily Posting Rate</span>
                    </div>
                    <div className="glass-panel stat-card-new">
                      <span className="stat-card-value">{reportData.domain_breakdown.length}</span>
                      <span className="stat-card-label">Domains Tracked</span>
                    </div>
                  </div>

                  {/* 3D Visualization */}
                  <div className="report-details-grid">
                    <div className="glass-panel detail-card-new">
                      <h3>3D Domain Distribution Chart</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "15px" }}>
                        Hover over and drag to rotate the 3D bars representing your domain contributions.
                      </p>
                      <Report3D data={reportData.domain_breakdown} />
                    </div>

                    <div className="glass-panel detail-card-new" style={{ display: "flex", flexDirection: "column" }}>
                      <h3>In-Plant Trainer Information</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>
                        Specify Name & Address of the trainer to include in the printed report.
                      </p>
                      <textarea 
                        className="glass-input"
                        value={trainerInfo}
                        onChange={(e) => setTrainerInfo(e.target.value)}
                        placeholder="Mr. Rajesh Kumar, Lead Software Engineer, ABC Technologies, Magadi"
                        style={{ minHeight: "60px", fontSize: "0.9rem", marginBottom: "20px", width: "100%", resize: "vertical" }}
                      />

                      <h3>Print Layout Format</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>
                        Select the format for the printed training report document.
                      </p>
                      <select 
                        className="glass-input"
                        value={printLayoutFormat}
                        onChange={(e) => setPrintLayoutFormat(e.target.value)}
                        style={{ marginBottom: "20px", width: "100%" }}
                      >
                        <option value="summary">Single-Page Consolidated Summary</option>
                        <option value="detailed">Multi-Page Detailed Daily Log</option>
                      </select>

                      {printLayoutFormat === "summary" && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                            <h3 style={{ margin: 0 }}>Consolidated Details of the Training</h3>
                            <button
                              type="button"
                              className="glass-button"
                              onClick={handleGenerateAISummary}
                              disabled={isGeneratingAI || !reportData.updates || reportData.updates.length === 0}
                              style={{ padding: "6px 12px", fontSize: "0.82rem", gap: "4px" }}
                            >
                              {isGeneratingAI ? "Generating..." : "✨ Auto-Generate with AI"}
                            </button>
                          </div>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>
                            Review and edit the training summary to be printed on the single page.
                          </p>
                          <textarea 
                            className="glass-input"
                            value={reportSummary}
                            onChange={(e) => setReportSummary(e.target.value)}
                            placeholder="Write a summary of the accomplishments..."
                            style={{ minHeight: "140px", fontSize: "0.9rem", marginBottom: "20px", width: "100%", resize: "vertical", fontFamily: "monospace" }}
                          />
                        </>
                      )}

                      <h3>Domain Breakdown Table</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "15px" }}>
                        Summary of logs counted for each training domain.
                      </p>
                      {reportData.domain_breakdown.length === 0 ? (
                        <div className="empty-breakdown">No updates logged in this month</div>
                      ) : (
                        <div className="breakdown-table">
                          {reportData.domain_breakdown.map((item, idx) => (
                            <div key={idx} className="table-row">
                              <span className="row-name">{item.domain_name}</span>
                              <span className="row-pill">{item.count} logs</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="report-export-buttons">
                        <button className="glass-button secondary" onClick={() => window.print()}>
                          <Printer size={16} /> Print Report
                        </button>
                        <button className="glass-button" onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `Monthly_Report_${reportData.username}_${reportMonth}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                        }}>
                          <Download size={16} /> Export JSON
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-panel empty-state">
                  <Activity size={40} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
                  <h3>No Monthly Data Selected</h3>
                  <p>Choose a month and click "Load Data" to compile your metrics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {reportData && profile && ReactDOM.createPortal(
        <div className="print-report-container">
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16pt", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase" }}>
              {reportMode === "month" ? (
                `Report for the Month of ${(() => {
                  if (!reportMonth) return "";
                  const [year, month] = reportMonth.split("-");
                  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                })()}`
              ) : (
                `Report Period: ${new Date(reportStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${new Date(reportEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              )}
            </h2>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px", fontSize: "11pt" }}>
            <div>
              <strong>To,</strong><br />
              The Principal,<br />
              M/s. GT & TC, MAGADI
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Report No.:</strong> GTTC/{reportMode === "month" ? (reportMonth ? reportMonth.replace("-", "/") : "2026/06") : `${new Date(reportStartDate).getFullYear()}/${String(new Date(reportStartDate).getMonth() + 1).padStart(2, '0')}`}/{profile.id}<br />
              <strong>Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>

          <table className="print-table">
            <tbody>
              <tr>
                <td style={{ width: "70%" }}>
                  <strong>Name of the Trainee:</strong> {profile.username}
                </td>
                <td style={{ width: "30%" }}>
                  <strong>Reg. No.</strong> {profile.id}
                </td>
              </tr>
              <tr>
                <td colSpan="2" style={{ height: "90px" }}>
                  <strong>Name & Address of the In-Plant Trainer:</strong>
                  <div style={{ marginTop: "8px", whiteSpace: "pre-wrap", fontWeight: "normal" }}>
                    {trainerInfo || "________________________________________________________________________________"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="print-details-box">
            <strong style={{ fontSize: "12pt" }}>Details of the Training:</strong>
            <p style={{ fontSize: "9.5pt", fontStyle: "italic", margin: "5px 0 20px 0", color: "#333" }}>
              (You are required to furnish the details of the work done during the month. Insert relevant drawings for more details and mention your achievements. Use additional pages if necessary)
            </p>
            
            <div style={{ marginTop: "10px" }}>
              {printLayoutFormat === "summary" ? (
                <div style={{ whiteSpace: "pre-wrap", fontSize: "10pt", lineHeight: "1.6", color: "#000" }}>
                  {reportSummary || "No summary provided."}
                </div>
              ) : (
                reportData.updates && reportData.updates.length > 0 ? (
                  reportData.updates.map((update, idx) => (
                    <div key={update.id} className="print-log-entry">
                      <div className="print-log-header">
                        <span>{idx + 1}. {update.task_title}</span>
                        <span style={{ fontWeight: "normal", fontSize: "9.5pt" }}>{update.date} | Domain: {update.domain_name}</span>
                      </div>
                      <p className="print-log-desc">{update.description}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#555", fontStyle: "italic" }}>No training activities logged for this month.</div>
                )
              )}
            </div>
          </div>

          <div className="print-signatures-block">
            <div className="print-sig-row">
              <span><strong>Signature of the trainee</strong></span>
              <span><strong>Signature of the In-charge</strong></span>
            </div>
            <div className="print-remarks-row">
              <strong>Remarks of the In-charge :</strong>
              <p style={{ marginTop: "10px", borderBottom: "1px solid #000", height: "30px" }}></p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
