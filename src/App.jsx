import { useState, useEffect } from "react"
import Navbar from "./components/Navbar"
import Card from "./components/Card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

const API_BASE = "http://localhost:5000"
const CATEGORIES = ["Frontend", "Backend", "Database", "Programming", "Tools"]
const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

function App() {
  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------

  // Add-skill form state
  const [skill, setSkill] = useState("")
  const [category, setCategory] = useState("Frontend")

  // List of skills fetched from the backend
  const [skills, setSkills] = useState([])

  // Inline-edit state (which skill is being edited + its temp value)
  const [editId, setEditId] = useState(null)
  const [editSkill, setEditSkill] = useState("")

  // Dashboard stats (DSA problems, projects, current focus area)
  const [dsaProblems, setDsaProblems] = useState(0)
  const [projectsBuilt, setProjectsBuilt] = useState(0)
  const [currentFocus, setCurrentFocus] = useState("React")

  // Category filter for the skills list
  const [filterCategory, setFilterCategory] = useState("All")

  // ---------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------

  // Fetch all skills from the backend
  async function fetchSkills() {
    try {
      const response = await fetch(`${API_BASE}/skills`)
      const data = await response.json()
      setSkills(data)
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch dashboard stats (DSA problems, projects built, current focus)
  async function fetchDashboard() {
    try {
      const response = await fetch(`${API_BASE}/dashboard`)
      const data = await response.json()
      setDsaProblems(data.dsaProblems)
      setProjectsBuilt(data.projectsBuilt)
      setCurrentFocus(data.currentFocus)
    } catch (error) {
      console.log(error)
    }
  }

  // Load skills + dashboard data once, on initial mount
  useEffect(() => {
    fetchSkills()
    fetchDashboard()
  }, [])

  // ---------------------------------------------------------------------
  // DERIVED DATA (stats cards, progress bar, charts, counts)
  // ---------------------------------------------------------------------

  // Data shown in the top summary cards
  const stats = [
    { title: "DSA Problems Solved", value: dsaProblems, icon: "🧠" },
    { title: "Projects Built", value: projectsBuilt, icon: "💻" },
    { title: "Skills Learned", value: skills.length, icon: "📚" },
    { title: "Current Focus", value: currentFocus, icon: "🎯" }
  ]

  // Weighted "placement readiness" score:
  // 40% from DSA problems (capped at 300), 30% from projects (capped at 5),
  // 30% from skills learned (capped at 15)
  const progress = Math.min(
    (Math.min(dsaProblems, 300) / 300) * 40 +
      (Math.min(projectsBuilt, 5) / 5) * 30 +
      (Math.min(skills.length, 15) / 15) * 30,
    100
  )

  // Count of skills in a given category
  function getCategoryCount(category) {
    return skills.filter(item => item.category === category).length
  }

  // Per-category counts, used in the "Skill Summary" cards
  const frontendCount = getCategoryCount("Frontend")
  const backendCount = getCategoryCount("Backend")
  const databaseCount = getCategoryCount("Database")
  const programmingCount = getCategoryCount("Programming")
  const toolsCount = getCategoryCount("Tools")

  const totalSkills = skills.length

  // Chart data: percentage breakdown of skills by category
  const chartData = CATEGORIES
    .map(name => ({ name, value: getCategoryCount(name) }))
    .filter(item => item.value > 0)
    .map(item => ({
      ...item,
      percentage:
        totalSkills > 0
          ? Number(((item.value / totalSkills) * 100).toFixed(1))
          : 0
    }))

  // ---------------------------------------------------------------------
  // CRUD ACTIONS (skills)
  // ---------------------------------------------------------------------

  // Add a new skill
  async function addSkill() {
    if (skill === "") {
      return
    }

    try {
      await fetch(`${API_BASE}/addSkill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, category })
      })

      fetchSkills()
      setSkill("")
    } catch (error) {
      console.log(error)
    }
  }

  // Save an edited skill name
  async function updateSkill() {
    try {
      await fetch(`${API_BASE}/updateSkill/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: editSkill })
      })

      setEditId(null)
      fetchSkills()
    } catch (error) {
      console.log(error)
    }
  }

  // Delete a skill (after confirmation)
  async function deleteSkill(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this skill?"
    )

    if (!confirmDelete) {
      return
    }

    try {
      await fetch(`${API_BASE}/deleteSkill/${id}`, { method: "DELETE" })
      fetchSkills()
    } catch (error) {
      console.log(error)
    }
  }

  // ---------------------------------------------------------------------
  // DASHBOARD ACTIONS
  // ---------------------------------------------------------------------

  // Save dashboard stats (DSA problems, projects built, current focus)
  async function saveDashboard() {
    try {
      await fetch(`${API_BASE}/dashboard`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dsaProblems, projectsBuilt, currentFocus })
      })

      fetchDashboard()
      alert("Dashboard Saved Successfully 🚀")
    } catch (error) {
      console.log(error)
    }
  }

  // ---------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------

  // Renders the skill list for a given category, respecting the active filter
  function renderSkills(category) {
    return skills
      .filter(
        item =>
          item.category === category &&
          (filterCategory === "All" || item.category === filterCategory)
      )
      .map((item, index) => (
        <div className="skill-item" key={index}>
          <div className="skill-info">
            {editId === item._id ? (
              // Editing mode: show an input bound to editSkill
              <input
                value={editSkill}
                onChange={e => setEditSkill(e.target.value)}
              />
            ) : (
              // Display mode: show skill name + category badge
              <div>
                <p>{item.skill}</p>
                <span className={`category-badge ${item.category}`}>
                  {item.category}
                </span>
              </div>
            )}
          </div>

          <div className="skill-actions">
            {editId === item._id ? (
              <button className="save-btn" onClick={updateSkill}>
                Save
              </button>
            ) : (
              <button
                className="edit-btn"
                onClick={() => {
                  setEditId(item._id)
                  setEditSkill(item.skill)
                }}
              >
                Edit
              </button>
            )}

            <button className="delete-btn" onClick={() => deleteSkill(item._id)}>
              Delete
            </button>
          </div>
        </div>
      ))
  }

  // ---------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------

  return (
    <div>
      <Navbar />

      <div className="container">
        <h1>Student Skill Tracker</h1>
        <p>Track your learning journey and grow every day.</p>

        {/* --- Summary stat cards --- */}
        <div className="card-container">
          {stats.map((item, index) => (
            <Card
              key={index}
              title={item.title}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </div>

        {/* --- Skill distribution chart --- */}
        <div className="panel">
          <div className="section-header">
            <h2 className="section-header__title">📊 Skill Distribution</h2>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={value => `${value}%`} />
              <Tooltip formatter={value => [`${value}%`, "Percentage"]} />
              <Legend />
              <Bar dataKey="percentage" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- Placement readiness progress bar --- */}
        <h2>🏆 Placement Readiness</h2>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="progress-text">
          🎯 Placement Readiness: {progress.toFixed(0)}%
        </p>

        {/* --- Dashboard settings form --- */}
        <h2>Dashboard Settings</h2>

        <div className="dashboard-form">
          <input
            type="number"
            placeholder="DSA Problems"
            value={dsaProblems}
            onChange={e => setDsaProblems(e.target.value)}
          />

          <input
            type="number"
            placeholder="Projects Built"
            value={projectsBuilt}
            onChange={e => setProjectsBuilt(e.target.value)}
          />

          <input
            type="text"
            placeholder="Current Focus"
            value={currentFocus}
            onChange={e => setCurrentFocus(e.target.value)}
          />

          <button onClick={saveDashboard}>Save Dashboard</button>
        </div>

        {/* --- Add new skill form --- */}
        <h2>➕ Add New Skill:</h2>
        <div className="add-skill-form">
          <input
            type="text"
            placeholder="Enter Skill"
            value={skill}
            onChange={e => setSkill(e.target.value)}
          />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>Frontend</option>
            <option>Backend</option>
            <option>Database</option>
            <option>Programming</option>
            <option>Tools</option>
          </select>

          <button onClick={addSkill}>Add Skill</button>
        </div>

        {/* --- Skill summary counts --- */}
        <h2>📊 Skill Summary</h2>

        <div className="summary-container">
          <div className="summary-card">Frontend: {frontendCount}</div>
          <div className="summary-card">Backend: {backendCount}</div>
          <div className="summary-card">Database: {databaseCount}</div>
          <div className="summary-card">Programming: {programmingCount}</div>
          <div className="summary-card">Tools: {toolsCount}</div>
        </div>

        {/* --- Category filter --- */}
        <div className="filter-section">
          <h2>🔍 Filter Skills</h2>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Database">Database</option>
            <option value="Programming">Programming</option>
            <option value="Tools">Tools</option>
          </select>
        </div>

        {/* Message shown when the active filter has no matching skills */}
        {filterCategory !== "All" && getCategoryCount(filterCategory) === 0 && (
          <p className="no-skills">😕 No skills found in this category</p>
        )}

        {/* --- Skills list, grouped by category --- */}
        <h2>My Skills ({skills.length})</h2>

        {getCategoryCount("Frontend") > 0 && (
          <>
            <h3>📘 Frontend ({getCategoryCount("Frontend")})</h3>
            {renderSkills("Frontend")}
          </>
        )}

        {getCategoryCount("Backend") > 0 && (
          <>
            <h3>📗 Backend ({getCategoryCount("Backend")})</h3>
            {renderSkills("Backend")}
          </>
        )}

        {getCategoryCount("Database") > 0 && (
          <>
            <h3>🗄️ Database ({getCategoryCount("Database")})</h3>
            {renderSkills("Database")}
          </>
        )}

        {getCategoryCount("Programming") > 0 && (
          <>
            <h3>💻 Programming ({getCategoryCount("Programming")})</h3>
            {renderSkills("Programming")}
          </>
        )}

        {getCategoryCount("Tools") > 0 && (
          <>
            <h3>🛠️ Tools ({getCategoryCount("Tools")})</h3>
            {renderSkills("Tools")}
          </>
        )}
      </div>
    </div>
  )
}

export default App