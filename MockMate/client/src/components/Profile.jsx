import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Profile = () => {
  const { token } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    preferredJobRole: "",
    experienceLevel: "Entry Level",
    focusAreas: [],
    bio: "",
    location: "",
    phone: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    skills: [],
    yearsOfExperience: 0,
    currentCompany: "",
    jobTitle: "",
    availability: "Open to Opportunities"
  });

  // Available options
  const experienceLevels = ["Entry Level", "Mid Level", "Senior Level", "Executive"];
  const availabilityOptions = ["Available", "Not Available", "Open to Opportunities"];
  const focusAreaOptions = [
    "Frontend Development", "Backend Development", "Full Stack Development",
    "Mobile Development", "DevOps", "Data Science", "Machine Learning",
    "UI/UX Design", "Product Management", "Quality Assurance",
    "Cybersecurity", "Cloud Computing", "Blockchain", "AI/ML"
  ];
  const skillOptions = [
    "JavaScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
    "React", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask",
    "Spring Boot", "Laravel", "Rails", "ASP.NET", "Next.js", "Nuxt.js",
    "HTML/CSS", "SASS/SCSS", "Tailwind CSS", "Bootstrap", "Material-UI",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "Firebase",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins",
    "Git", "GitHub", "GitLab", "Jira", "Confluence", "Figma", "Sketch",
    "Adobe XD", "Photoshop", "Illustrator", "Tableau", "Power BI"
  ];

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        // Initialize form data with user data
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          preferredJobRole: data.user.profile?.preferredJobRole || "",
          experienceLevel: data.user.profile?.experienceLevel || "Entry Level",
          focusAreas: data.user.profile?.focusAreas || [],
          bio: data.user.profile?.bio || "",
          location: data.user.profile?.location || "",
          phone: data.user.profile?.phone || "",
          linkedinUrl: data.user.profile?.linkedinUrl || "",
          githubUrl: data.user.profile?.githubUrl || "",
          portfolioUrl: data.user.profile?.portfolioUrl || "",
          skills: data.user.profile?.skills || [],
          yearsOfExperience: data.user.profile?.yearsOfExperience || 0,
          currentCompany: data.user.profile?.currentCompany || "",
          jobTitle: data.user.profile?.jobTitle || "",
          availability: data.user.profile?.availability || "Open to Opportunities"
        });
      } else {
        setError(data.error || "Failed to fetch profile");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSkillAdd = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Client-side validation
    if (!formData.firstName || !formData.firstName.trim()) {
      setError("First name is required");
      setSaving(false);
      return;
    }

    if (!formData.lastName || !formData.lastName.trim()) {
      setError("Last name is required");
      setSaving(false);
      return;
    }

    // Validate phone number if provided
    if (formData.phone && !/^[\d\s\-+().]{7,}$/.test(formData.phone)) {
      setError("Please enter a valid phone number");
      setSaving(false);
      return;
    }

    // Validate URLs if provided
    const urlFields = ['linkedinUrl', 'githubUrl', 'portfolioUrl'];
    for (const field of urlFields) {
      if (formData[field] && formData[field].trim()) {
        try {
          new URL(formData[field].startsWith('http') ? formData[field] : 'https://' + formData[field]);
        } catch (e) {
          setError(`Invalid ${field} URL format`);
          setSaving(false);
          return;
        }
      }
    }

    // Prepare data without email
    const dataToSubmit = { ...formData };
    delete dataToSubmit.email; // Remove email from submission

    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setUser(data.user);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Profile Settings</h1>
          <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Profile Statistics</h3>
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="font-semibold text-purple-600">{stats.totalSessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-semibold text-blue-600">{stats.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg Confidence</span>
                    <span className="font-semibold text-green-600">{Math.round(stats.avgConfidence * 100)}%</span>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pinned Questions</span>
                    <span className="font-semibold text-orange-600">{stats.pinnedQuestionsCount}</span>
                  </div> */}
                  <div className="flex items-center justify-between">
                    {/* <span className="text-gray-600">Member Since</span> */}
                    <span className="font-semibold text-gray-600">
                      {/* {new Date(stats.joinDate).toLocaleDateString()} */}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "personal" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                  }`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setActiveTab("professional")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "professional" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                  }`}
                >
                  Professional Details
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "skills" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                  }`}
                >
                  Skills & Focus Areas
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "contact" ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                  }`}
                >
                  Contact & Links
                </button>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Tab */}
              {activeTab === "personal" && (
                <div className="card p-6">
                  <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="input"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        readOnly
                        disabled
                        className="input bg-gray-100 cursor-not-allowed"
                      />
                      {/* <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p> */}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="input"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Details Tab */}
              {activeTab === "professional" && (
                <div className="card p-6">
                  <h2 className="text-2xl font-semibold mb-6">Professional Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Role</label>
                      <input
                        type="text"
                        name="preferredJobRole"
                        value={formData.preferredJobRole}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="e.g., Software Engineer, Product Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className="input"
                      >
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        className="input"
                      >
                        {availabilityOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Company</label>
                      <input
                        type="text"
                        name="currentCompany"
                        value={formData.currentCompany}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Your current title"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Skills & Focus Areas Tab */}
              {activeTab === "skills" && (
                <div className="card p-6">
                  <h2 className="text-2xl font-semibold mb-6">Skills & Focus Areas</h2>
                  
                  {/* Focus Areas */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Focus Areas</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {focusAreaOptions.map(area => (
                        <label key={area} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.focusAreas.includes(area)}
                            onChange={() => handleArrayChange("focusAreas", area)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{area}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Technical Skills</label>
                    
                    {/* Selected Skills */}
                    {formData.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map(skill => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleSkillRemove(skill)}
                                className="ml-2 text-purple-600 hover:text-purple-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Skills */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {skillOptions
                        .filter(skill => !formData.skills.includes(skill))
                        .slice(0, 20)
                        .map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillAdd(skill)}
                            className="text-left px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Links Tab */}
              {activeTab === "contact" && (
                <div className="card p-6">
                  <h2 className="text-2xl font-semibold mb-6">Contact & Links</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        name="githubUrl"
                        value={formData.githubUrl}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio URL</label>
                      <input
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-8 py-3"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
