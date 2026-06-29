import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { api } from "../api";
import Report3D from "../components/Report3D";
import { 
  Sparkles, 
  LogOut, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  FolderPlus, 
  Calendar, 
  History, 
  User, 
  Briefcase,
  X,
  Printer,
  Download,
  Settings,
  Shield,
  Layers,
  ArrowRight,
  UserPlus,
  CheckCircle2,
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

export default function AdminDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState("logs"); // 'logs', 'inspect', 'domains'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [domains, setDomains] = useState([]);
  const [students, setStudents] = useState([]);
  const [updates, setUpdates] = useState([]);

  // Filter States
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Create Domain Form State
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainDesc, setNewDomainDesc] = useState("");

  // Create Student Form State
  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  const [trainerInfo, setTrainerInfo] = useState(localStorage.getItem("trainer_info") || "");
  useEffect(() => {
    localStorage.setItem("trainer_info", trainerInfo);
  }, [trainerInfo]);

  // Report States (Inspect Tab)
  const [reportData, setReportData] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportMode, setReportMode] = useState("month"); // 'month' or 'custom'
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportStudentId, setReportStudentId] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [printLayoutFormat, setPrintLayoutFormat] = useState("summary"); // 'summary' or 'detailed'
  const [reportSummary, setReportSummary] = useState("");

  // Status logs
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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
      const doms = await api.getDomains();
      setDomains(doms);

      const studs = await api.getStudents();
      setStudents(studs);
      if (studs.length > 0) {
        setReportStudentId(studs[0].id);
      }

      const allUpdates = await api.getAdminUpdates();
      setUpdates(allUpdates);
    } catch (err) {
      setError("Failed to load admin panel data");
    }
  };

  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const filtered = await api.getAdminUpdates({
        studentId: selectedStudent || null,
        domainId: selectedDomain || null,
        startDate: startDate || null,
        endDate: endDate || null
      });
      setUpdates(filtered);
    } catch (err) {
      setError("Failed to fetch filtered updates");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setSelectedStudent("");
    setSelectedDomain("");
    setStartDate("");
    setEndDate("");
    setLoading(true);
    try {
      const allUpdates = await api.getAdminUpdates();
      setUpdates(allUpdates);
    } catch (err) {
      setError("Failed to clear filters");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newDomainName) return;

    try {
      await api.createDomain(newDomainName, newDomainDesc);
      setSuccess(`Training domain "${newDomainName}" added successfully!`);
      setNewDomainName("");
      setNewDomainDesc("");
      
      // Reload domains
      const doms = await api.getDomains();
      setDomains(doms);
    } catch (err) {
      setError(err.message || "Failed to create domain");
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newStudentUsername || !newStudentEmail || !newStudentPassword) {
      setError("Please fill out all credentials fields");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateStudent(newStudentUsername, newStudentEmail, newStudentPassword);
      setSuccess(`Student account for "${newStudentUsername}" created successfully!`);
      setNewStudentUsername("");
      setNewStudentEmail("");
      setNewStudentPassword("");
      
      // Reload students list
      const studs = await api.getStudents();
      setStudents(studs);
    } catch (err) {
      setError(err.message || "Failed to create student account");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStudentId) {
      setError("Please select a student to generate a report");
      return;
    }
    setReportLoading(true);
    setError("");
    try {
      let data;
      if (reportMode === "month") {
        data = await api.getMonthlyReport(reportMonth, reportStudentId);
      } else {
        data = await api.getMonthlyReport(null, reportStudentId, reportStartDate, reportEndDate);
      }
      setReportData(data);
    } catch (err) {
      setError(err.message || "Failed to retrieve report for student");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass-panel ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Shield className="logo-icon" size={24} style={{ color: "#06b6d4" }} />
          <span>ADMIN</span>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} title="Close Menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="avatar admin-avatar">
            {username[0].toUpperCase()}
          </div>
          <div className="profile-info">
            <span className="profile-name">{username}</span>
            <span className="profile-role">Administrator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("logs");
              handleApplyFilters();
              setIsSidebarOpen(false);
            }}
          >
            <History size={18} />
            <span>Logs Feed</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "inspect" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("inspect");
              if (reportStudentId) handleGenerateReport();
              setIsSidebarOpen(false);
            }}
          >
            <User size={18} />
            <span>Inspect Reports</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "domains" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("domains");
              setIsSidebarOpen(false);
            }}
          >
            <Layers size={18} />
            <span>Manage Domains</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "students" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("students");
              setIsSidebarOpen(false);
            }}
          >
            <UserPlus size={18} />
            <span>Manage Students</span>
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
          <Shield size={20} className="logo-icon" style={{ color: "#06b6d4" }} />
          <span>ADMIN</span>
        </div>
        <div style={{ width: "42px" }}></div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1 className="welcome-title">
              {activeTab === "logs" && "All Student Logs"}
              {activeTab === "inspect" && "Student Report Inspector"}
              {activeTab === "domains" && "Manage Training Domains"}
            </h1>
            <p className="welcome-subtitle">
              {activeTab === "logs" && "Monitor and search daily log entries of all students"}
              {activeTab === "inspect" && "Generate and review official 1-month certification details"}
              {activeTab === "domains" && "Define and add training domains categories"}
            </p>
          </div>
          <div className="header-date">
            <Settings size={16} />
            <span>Control Panel</span>
          </div>
        </header>

        <div className="content-body">
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          {/* TAB 1: ALL STUDENT LOGS */}
          {activeTab === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Filter Toolbar */}
              <form onSubmit={handleApplyFilters} className="glass-panel admin-filters-toolbar">
                <div className="filter-row">
                  <div className="filter-field">
                    <label>Student</label>
                    <select 
                      className="glass-input glass-select"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                      <option value="">All Students</option>
                      {students.map(stud => (
                        <option key={stud.id} value={stud.id} style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>
                          {stud.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label>Domain</label>
                    <select 
                      className="glass-input glass-select"
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                      <option value="">All Domains</option>
                      {domains.map(dom => (
                        <option key={dom.id} value={dom.id} style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>
                          {dom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-field">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="filter-field">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <button type="submit" className="glass-button search-btn" disabled={loading}>
                    <Search size={16} /> {loading ? "Searching..." : "Filter Logs"}
                  </button>
                  <button 
                    type="button" 
                    className="glass-button secondary clear-btn" 
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </form>

              {/* Feed Results */}
              {updates.length === 0 ? (
                <div className="glass-panel empty-state">
                  <History size={40} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
                  <h3>No Student Logs Found</h3>
                  <p>No training updates match the applied filter criteria.</p>
                </div>
              ) : (
                <div className="modern-updates-grid">
                  {updates.map(update => (
                    <div key={update.id} className="glass-panel update-card-new">
                      <div className="card-top">
                        <span className="card-student-badge">
                          <User size={12} />
                          {update.username}
                        </span>
                        <span className="card-domain-badge">{update.domain_name}</span>
                        <span className="card-date-badge">{update.date}</span>
                      </div>
                      
                      <h3 className="card-title">{update.task_title}</h3>
                      <p className="card-desc">{update.description}</p>
                      
                      {update.media_url ? (
                        <>
                          <div className="card-media-wrapper" style={{ marginTop: "10px" }}>
                            {update.media_type === "image" ? (
                              <img 
                                src={api.getFileUrl(update.media_url)} 
                                alt={update.task_title} 
                                loading="lazy"
                                onError={(e) => {
                                  const wrapper = e.target.closest(".card-media-wrapper");
                                  if (wrapper) wrapper.style.display = "none";
                                  const fallback = wrapper.nextSibling;
                                  if (fallback) fallback.style.display = "block";
                                }}
                              />
                            ) : (
                              <video 
                                src={api.getFileUrl(update.media_url)} 
                                controls 
                                preload="metadata" 
                                onError={(e) => {
                                  const wrapper = e.target.closest(".card-media-wrapper");
                                  if (wrapper) wrapper.style.display = "none";
                                  const fallback = wrapper.nextSibling;
                                  if (fallback) fallback.style.display = "block";
                                }}
                              />
                            )}
                          </div>
                          <div style={{ display: "none", color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px", fontStyle: "italic" }}>
                            📷 Image not uploaded
                          </div>
                        </>
                      ) : (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px", fontStyle: "italic" }}>
                          📷 Image not uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSPECT REPORTS */}
          {activeTab === "inspect" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Selector Toolbar */}
              <div className="glass-panel inspector-bar">
                <div className="selector-field">
                  <label>Inspect Student</label>
                  <select 
                    className="glass-input glass-select"
                    value={reportStudentId}
                    onChange={(e) => setReportStudentId(e.target.value)}
                  >
                    {students.length === 0 ? (
                      <option value="">No registered student accounts</option>
                    ) : (
                      students.map(stud => (
                        <option key={stud.id} value={stud.id} style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>
                          {stud.username} ({stud.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="selector-field">
                  <label>Report Period Mode</label>
                  <select 
                    className="glass-input glass-select"
                    value={reportMode}
                    onChange={(e) => {
                      setReportMode(e.target.value);
                      setReportData(null);
                    }}
                    style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}
                  >
                    <option value="month" style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>By Month</option>
                    <option value="custom" style={{ backgroundColor: "var(--option-bg)", color: "var(--option-color)" }}>Custom Range</option>
                  </select>
                </div>

                {reportMode === "month" ? (
                  <div className="selector-field">
                    <label>Select Month</label>
                    <input 
                      type="month" 
                      className="glass-input" 
                      value={reportMonth} 
                      onChange={(e) => {
                        setReportMonth(e.target.value);
                        setReportData(null);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="selector-field">
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        className="glass-input" 
                        value={reportStartDate} 
                        onChange={(e) => {
                          setReportStartDate(e.target.value);
                          setReportData(null);
                        }}
                      />
                    </div>
                    <div className="selector-field">
                      <label>End Date</label>
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
                  </>
                )}

                <button 
                  className="glass-button" 
                  onClick={handleGenerateReport}
                  disabled={reportLoading || students.length === 0}
                  style={{ alignSelf: "flex-end", height: "46px" }}
                >
                  {reportLoading ? "Loading..." : "Load Student Metrics"}
                </button>
              </div>

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
                      <span className="stat-card-label">Domains Explored</span>
                    </div>
                  </div>

                  {/* 3D Visualizer & Details breakdown */}
                  <div className="report-details-grid">
                    <div className="glass-panel detail-card-new">
                      <h3>3D Domain Distribution Chart</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "15px" }}>
                        3D representation of student domain focus. Drag to rotate.
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
                        Counted logs summary for each training category.
                      </p>
                      {reportData.domain_breakdown.length === 0 ? (
                        <div className="empty-breakdown">No updates logged for this period.</div>
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
                  <User size={40} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
                  <h3>No Student Inspected</h3>
                  <p>Select a student and month to load details.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE DOMAINS */}
          {activeTab === "domains" && (
            <div className="domains-tab-layout">
              {/* Current domains list */}
              <div className="glass-panel dashboard-section">
                <h3>Defined Training Domains</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Active categories available to students for daily logging.
                </p>
                
                {domains.length === 0 ? (
                  <div className="empty-state" style={{ padding: "30px" }}>
                    No domains defined yet.
                  </div>
                ) : (
                  <div className="domains-list-new">
                    {domains.map((dom) => (
                      <div key={dom.id} className="domain-item-new">
                        <div className="domain-item-left">
                          <CheckCircle2 size={16} className="domain-check-icon" />
                          <span className="domain-name-tag">{dom.name}</span>
                        </div>
                        <p className="domain-description-tag">{dom.description || "No description provided."}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new domain form */}
              <div className="glass-panel dashboard-section card-form">
                <h3>Add New Training Domain</h3>
                
                <form onSubmit={handleCreateDomain} className="modern-form" style={{ marginTop: "15px" }}>
                  <div className="form-group">
                    <label>Domain Name</label>
                    <input 
                      type="text"
                      className="glass-input"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      placeholder="e.g. AI & Machine Learning"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description of Domain</label>
                    <textarea 
                      className="glass-input"
                      value={newDomainDesc}
                      onChange={(e) => setNewDomainDesc(e.target.value)}
                      placeholder="Specify skills and target files/platforms included in this category..."
                      style={{ minHeight: "100px", resize: "vertical" }}
                    />
                  </div>

                  <button type="submit" className="glass-button" style={{ width: "100%" }}>
                    <Plus size={18} /> Add Training Domain
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE STUDENTS */}
          {activeTab === "students" && (
            <div className="domains-tab-layout">
              {/* Current students list */}
              <div className="glass-panel dashboard-section">
                <h3>Registered Student Accounts</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Active students/employees who can log progress in the system.
                </p>
                
                {students.length === 0 ? (
                  <div className="empty-state" style={{ padding: "30px" }}>
                    No students registered yet.
                  </div>
                ) : (
                  <div className="domains-list-new">
                    {students.map((stud) => (
                      <div key={stud.id} className="domain-item-new">
                        <div className="domain-item-left">
                          <User size={16} style={{ color: "var(--color-success)" }} />
                          <span className="domain-name-tag">{stud.username}</span>
                        </div>
                        <p className="domain-description-tag" style={{ fontSize: "0.85rem" }}>
                          Email: {stud.email} <br />
                          Created: {new Date(stud.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new student form */}
              <div className="glass-panel dashboard-section card-form">
                <h3>Create Student Account</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Set up new credentials for a student or employee.
                </p>
                
                <form onSubmit={handleCreateStudent} className="modern-form" style={{ marginTop: "15px" }}>
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text"
                      className="glass-input"
                      value={newStudentUsername}
                      onChange={(e) => setNewStudentUsername(e.target.value)}
                      placeholder="e.g. jeevan_student"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      className="glass-input"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Password</label>
                    <input 
                      type="password"
                      className="glass-input"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                    />
                  </div>

                  <button type="submit" className="glass-button" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
                    <UserPlus size={18} /> {loading ? "Creating..." : "Create Student Credentials"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {reportData && ReactDOM.createPortal(
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
              <strong>Report No.:</strong> GTTC/{reportMode === "month" ? (reportMonth ? reportMonth.replace("-", "/") : "2026/06") : `${new Date(reportStartDate).getFullYear()}/${String(new Date(reportStartDate).getMonth() + 1).padStart(2, '0')}`}/{reportData.user_id}<br />
              <strong>Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
          </div>

          <table className="print-table">
            <tbody>
              <tr>
                <td style={{ width: "70%" }}>
                  <strong>Name of the Trainee:</strong> {reportData.username}
                </td>
                <td style={{ width: "30%" }}>
                  <strong>Reg. No.</strong> {reportData.user_id}
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
