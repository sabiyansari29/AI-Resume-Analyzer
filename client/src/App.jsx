import { useMemo, useState } from "react";
import axios from "axios";

const API_URL =
  "https://ai-resume-analyzer-api-2nqx.onrender.com/api";

function App() {
  // =====================================================
  // AUTH / PAGE
  // =====================================================
  const [page, setPage] = useState("login");

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =====================================================
  // RESUME
  // =====================================================
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // =====================================================
  // JOBS
  // =====================================================
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // =====================================================
  // FILTERS
  // =====================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [minimumMatch, setMinimumMatch] = useState(0);

  // =====================================================
  // LOADING / MESSAGE
  // =====================================================
  const [message, setMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);

  // =====================================================
  // REGISTER
  // =====================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setLoginError("");

      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      setName("");
      setEmail("");
      setPassword("");

      setPage("login");
      setMessage("");
    } catch (error) {
      console.error("Register error:", error);

      setMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setLoginError("");

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      const token = response.data.token;

      if (!token) {
        throw new Error("Token not received from server.");
      }

      localStorage.setItem("token", token);

      setLoggedIn(true);
      setPage("dashboard");

      setEmail("");
      setPassword("");

      // No successful login message
      setMessage("");
      setLoginError("");
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        error.response?.data?.message ||
          "Invalid email or password."
      );

      setMessage("");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem("token");

    setLoggedIn(false);
    setPage("login");

    setResumeId(null);
    setAnalysis(null);
    setJobs([]);
    setFile(null);
    setSelectedJob(null);

    setSearchTerm("");
    setLocationFilter("");
    setJobTypeFilter("");
    setMinimumMatch(0);

    setMessage("");
    setLoginError("");
  };

  // =====================================================
  // FILE CHANGE
  // =====================================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      e.target.value = "";
      setMessage("Only PDF files are allowed.");
      return;
    }

    setFile(selectedFile);
    setMessage("");
  };

  // =====================================================
  // UPLOAD + AI ANALYSIS
  // =====================================================
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF resume.");
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setMessage("Only PDF files are allowed.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      setLoggedIn(false);
      setPage("login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      setAnalysis(null);
      setJobs([]);
      setResumeId(null);
      setSelectedJob(null);

      const formData = new FormData();

      formData.append("resume", file);

      // -------------------------------------------------
      // Upload Resume
      // -------------------------------------------------
      const uploadResponse = await axios.post(
        `${API_URL}/resume/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Upload response:",
        uploadResponse.data
      );

      const uploadedResume =
        uploadResponse.data.resume;

      const uploadedResumeId =
        uploadedResume?.id ||
        uploadedResume?._id;

      if (!uploadedResumeId) {
        throw new Error(
          "Resume ID was not returned by server."
        );
      }

      setResumeId(uploadedResumeId);

      // -------------------------------------------------
      // AI Analysis
      // -------------------------------------------------
      const analysisResponse = await axios.get(
        `${API_URL}/ai/analyze/${uploadedResumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "AI analysis:",
        analysisResponse.data
      );

      setAnalysis(
        analysisResponse.data.analysis
      );

      setMessage(
        "Resume uploaded and analyzed successfully!"
      );
    } catch (error) {
      console.error(
        "Upload/analysis error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to analyze resume."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FIND MATCHING JOBS
  // =====================================================
  const handleFindJobs = async () => {
    if (!resumeId) {
      setMessage(
        "Please upload and analyze your resume first."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      setLoggedIn(false);
      setPage("login");
      return;
    }

    try {
      setJobLoading(true);
      setMessage("");

      const response = await axios.get(
        `${API_URL}/job/match/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Job matching response:",
        response.data
      );

      const matchedJobs =
        response.data.jobs || [];

      setJobs(matchedJobs);

      setMessage(
        `${matchedJobs.length} matching jobs found!`
      );
    } catch (error) {
      console.error(
        "Job matching error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to find matching jobs."
      );
    } finally {
      setJobLoading(false);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setJobTypeFilter("");
    setMinimumMatch(0);
  };

  // =====================================================
  // OPEN JOB DETAILS
  // =====================================================
  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  // =====================================================
  // CLOSE JOB DETAILS
  // =====================================================
  const handleCloseDetails = () => {
    setSelectedJob(null);
  };

  // =====================================================
  // APPLY NOW
  // =====================================================
  const handleApply = (job) => {
    const applyUrl =
      job.applyUrl ||
      job.applicationUrl ||
      job.url;

    if (!applyUrl) {
      setMessage(
        "Application link is not available for this job."
      );
      return;
    }

    window.open(
      applyUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================================
  // UNIQUE LOCATIONS
  // =====================================================
  const locations = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.location)
          .filter(Boolean)
      ),
    ];
  }, [jobs]);

  // =====================================================
  // UNIQUE JOB TYPES
  // =====================================================
  const jobTypes = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.jobType)
          .filter(Boolean)
      ),
    ];
  }, [jobs]);

  // =====================================================
  // FILTER JOBS
  // =====================================================
  const filteredJobs = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const title =
        job.title?.toLowerCase() || "";

      const company =
        job.company?.toLowerCase() || "";

      const matchesSearch =
        !search ||
        title.includes(search) ||
        company.includes(search);

      const matchesLocation =
        !locationFilter ||
        job.location === locationFilter;

      const matchesJobType =
        !jobTypeFilter ||
        job.jobType === jobTypeFilter;

      const matchesPercentage =
        Number(job.matchPercentage || 0) >=
        Number(minimumMatch);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesPercentage
      );
    });
  }, [
    jobs,
    searchTerm,
    locationFilter,
    jobTypeFilter,
    minimumMatch,
  ]);

  // =====================================================
  // REGISTER PAGE
  // =====================================================
  if (!loggedIn && page === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 text-gray-900 flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <div className="text-center mb-8">

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-5">
              <span className="text-2xl font-bold text-white">
                AI
              </span>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-gray-600">
              Create your account
            </p>

          </div>

          <form
            onSubmit={handleRegister}
            className="bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-2xl"
          >

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Create Account
            </h2>

            <label className="text-sm text-gray-700 font-medium">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="mt-2 mb-5 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500 text-gray-900"
              required
            />

            <label className="text-sm text-gray-700 font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="mt-2 mb-5 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500 text-gray-900"
              required
            />

            <label className="text-sm text-gray-700 font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="mt-2 mb-6 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500 text-gray-900"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-lg shadow-blue-500/30"
            >
              Create Account
            </button>

            {message && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                ⚠ {message}
              </div>
            )}

          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?

            <button
              onClick={() => {
                setPage("login");
                setMessage("");
                setLoginError("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-500 font-medium"
            >
              Login
            </button>
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // LOGIN PAGE
  // =====================================================
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 text-gray-900 flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <div className="text-center mb-8">

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-5">
              <span className="text-2xl font-bold text-white">
                AI
              </span>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-gray-600">
              Analyze your resume with AI
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl p-8 shadow-2xl"
          >

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Welcome Back
            </h2>

            <label className="text-sm text-gray-700 font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLoginError("");
              }}
              className="mt-2 mb-5 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500 text-gray-900"
              required
            />

            <label className="text-sm text-gray-700 font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError("");
              }}
              className="mt-2 mb-6 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500 text-gray-900"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-lg shadow-blue-500/30"
            >
              Login
            </button>

            {/* RED LOGIN ERROR */}
            {loginError && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                ⚠ {loginError}
              </div>
            )}

          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?

            <button
              onClick={() => {
                setPage("register");
                setMessage("");
                setLoginError("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-500 font-medium"
            >
              Register
            </button>
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900">

      {/* =================================================
          NAVBAR
      ================================================= */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="font-bold text-white">
                AI
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>

          </div>

          <button
            onClick={handleLogout}
            className="border border-gray-300 hover:bg-gray-100 rounded-xl px-4 py-2 transition-all duration-300 text-gray-700 font-medium"
          >
            Logout
          </button>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* =================================================
            HERO
        ================================================= */}
        <div className="mb-10">

          <p className="text-blue-600 font-bold mb-3 tracking-wider">
            AI-POWERED CAREER ASSISTANT
          </p>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Resume Dashboard
          </h2>

          <p className="text-gray-600 mt-4 max-w-2xl text-lg">
            Upload your resume and get AI-powered
            insights, skill recommendations and
            matching job opportunities.
          </p>

        </div>

        {/* =================================================
            UPLOAD CARD
        ================================================= */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">

          <div className="flex items-center gap-4 mb-2">

            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-2xl">
              📄
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900">
                Upload Resume
              </h3>

              <p className="text-gray-600 mt-1">
                Upload your resume in PDF format.
              </p>
            </div>

          </div>

          <div className="mt-8 border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-gray-50 hover:bg-gray-100 transition-all duration-300">

            <div className="text-5xl mb-4">
              📄
            </div>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="mx-auto block text-sm text-gray-600"
            />

            {file && (
              <p className="text-green-600 mt-4 font-medium">
                ✓ Selected: {file.name}
              </p>
            )}

          </div>

          {/* UPLOAD */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-6 w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 transition-all duration-300 shadow-lg"
          >
            {loading
              ? "Analyzing Resume..."
              : "Upload & Analyze"}
          </button>

          {/* FIND JOBS */}
          <button
            onClick={handleFindJobs}
            disabled={jobLoading || !resumeId}
            className="mt-4 w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 transition-all duration-300 shadow-lg"
          >
            {jobLoading
              ? "Finding Matching Jobs..."
              : "Find Matching Jobs"}
          </button>

          {message && (
            <p className="text-center text-gray-700 mt-4 font-medium">
              ✓ {message}
            </p>
          )}

        </div>

        {/* =================================================
            AI ANALYSIS
        ================================================= */}
        {analysis && (
          <div className="mt-12">

            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              AI Resume Analysis
            </h2>

            {/* SUMMARY */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 shadow-lg">

              <h3 className="text-xl font-semibold text-blue-600">
                Summary
              </h3>

              <p className="mt-3 text-gray-700 leading-7">
                {analysis.summary}
              </p>

            </div>

            {/* THREE CARDS */}
            <div className="grid md:grid-cols-3 gap-6">

              {/* STRENGTHS */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">

                <h3 className="text-xl font-semibold text-green-600">
                  Strengths
                </h3>

                <ul className="mt-4 space-y-3">

                  {analysis.strengths?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-gray-700 text-sm leading-6"
                      >
                        ✓ {item}
                      </li>
                    )
                  )}

                </ul>

              </div>

              {/* WEAKNESSES */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">

                <h3 className="text-xl font-semibold text-yellow-600">
                  Weaknesses
                </h3>

                <ul className="mt-4 space-y-3">

                  {analysis.weaknesses?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-gray-700 text-sm leading-6"
                      >
                        • {item}
                      </li>
                    )
                  )}

                </ul>

              </div>

              {/* SUGGESTIONS */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">

                <h3 className="text-xl font-semibold text-purple-600">
                  Suggestions
                </h3>

                <ul className="mt-4 space-y-3">

                  {analysis.suggestions?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-gray-700 text-sm leading-6"
                      >
                        • {item}
                      </li>
                    )
                  )}

                </ul>

              </div>

            </div>

            {/* RECOMMENDED SKILLS */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 mt-6 shadow-lg">

              <h3 className="text-xl font-semibold text-cyan-600">
                Recommended Skills
              </h3>

              <div className="flex flex-wrap gap-3 mt-5">

                {analysis.recommendedSkills?.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="bg-cyan-50 border border-cyan-300 px-4 py-2 rounded-full text-sm text-cyan-700 font-medium"
                    >
                      {skill}
                    </span>
                  )
                )}

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            JOB MATCHER
        ================================================= */}
        {jobs.length > 0 && (
          <div className="mt-12">

            <div className="mb-6">

              <p className="text-purple-600 font-bold mb-2 tracking-wider">
                CAREER OPPORTUNITIES
              </p>

              <h2 className="text-3xl font-bold text-gray-900">
                Matching Jobs
              </h2>

              <p className="text-gray-600 mt-2">
                Jobs ranked according to your resume skills.
              </p>

            </div>

            {/* SEARCH & FILTER */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-lg">

              <h3 className="text-xl font-semibold mb-5 text-gray-900">
                Search & Filter Jobs
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* SEARCH */}
                <div>

                  <label className="text-sm text-gray-700 font-medium">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Job title or company"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                  />

                </div>

                {/* LOCATION */}
                <div>

                  <label className="text-sm text-gray-700 font-medium">
                    Location
                  </label>

                  <select
                    value={locationFilter}
                    onChange={(e) =>
                      setLocationFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-gray-900"
                  >

                    <option value="">
                      All Locations
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location}
                          value={location}
                        >
                          {location}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* JOB TYPE */}
                <div>

                  <label className="text-sm text-gray-700 font-medium">
                    Job Type
                  </label>

                  <select
                    value={jobTypeFilter}
                    onChange={(e) =>
                      setJobTypeFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-gray-900"
                  >

                    <option value="">
                      All Job Types
                    </option>

                    {jobTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* MINIMUM MATCH */}
                <div>

                  <label className="text-sm text-gray-700 font-medium">
                    Minimum Match
                  </label>

                  <select
                    value={minimumMatch}
                    onChange={(e) =>
                      setMinimumMatch(
                        Number(e.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 text-gray-900"
                  >

                    <option value={0}>
                      Any Match
                    </option>

                    <option value={50}>
                      50%+
                    </option>

                    <option value={60}>
                      60%+
                    </option>

                    <option value={70}>
                      70%+
                    </option>

                    <option value={80}>
                      80%+
                    </option>

                    <option value={90}>
                      90%+
                    </option>

                    <option value={100}>
                      100%
                    </option>

                  </select>

                </div>

              </div>

              {/* FILTER ACTIONS */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">

                <p className="text-gray-600 text-sm">

                  Showing{" "}

                  <span className="text-gray-900 font-semibold">
                    {filteredJobs.length}
                  </span>

                  {" "}of{" "}

                  <span className="text-gray-900 font-semibold">
                    {jobs.length}
                  </span>

                  {" "}jobs

                </p>

                <button
                  onClick={clearFilters}
                  className="border border-gray-300 hover:bg-gray-100 rounded-xl px-5 py-2 transition-all text-gray-700 font-medium"
                >
                  Clear Filters
                </button>

              </div>

            </div>

            {/* NO RESULTS */}
            {filteredJobs.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-lg">

                <h3 className="text-xl font-semibold text-gray-900">
                  No jobs found
                </h3>

                <p className="text-gray-600 mt-2">
                  Try changing your search or filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 font-medium"
                >
                  Clear Filters
                </button>

              </div>
            )}

            {/* JOB CARDS */}
            {filteredJobs.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">

                {filteredJobs.map((job) => (

                  <div
                    key={
                      job.jobId ||
                      job._id ||
                      `${job.title}-${job.company}`
                    }
                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >

                    {/* TITLE + MATCH */}
                    <div className="flex justify-between items-start gap-4">

                      <div>

                        <h3 className="text-xl font-semibold text-gray-900">
                          {job.title}
                        </h3>

                        <p className="text-blue-600 mt-1 font-medium">
                          {job.company}
                        </p>

                      </div>

                      <div className="bg-green-100 border border-green-300 rounded-xl px-3 py-2 text-green-700 font-bold whitespace-nowrap">
                        {job.matchPercentage || 0}%
                      </div>

                    </div>

                    {/* DESCRIPTION */}
                    {job.description && (
                      <p className="text-gray-600 text-sm leading-6 mt-5">
                        {job.description}
                      </p>
                    )}

                    {/* LOCATION + TYPE */}
                    <div className="mt-5 flex gap-3 flex-wrap">

                      <span className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700">
                        📍 {job.location || "Not specified"}
                      </span>

                      <span className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700">
                        💼 {job.jobType || "Not specified"}
                      </span>

                    </div>

                    {/* MATCHED SKILLS */}
                    <div className="mt-6">

                      <h4 className="text-sm font-semibold text-green-600">
                        Matched Skills
                      </h4>

                      <div className="flex flex-wrap gap-2 mt-3">

                        {job.matchedSkills?.length > 0 ? (
                          job.matchedSkills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-700 border border-green-300 rounded-full px-3 py-1 text-xs font-medium"
                              >
                                ✓ {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No matched skills
                          </span>
                        )}

                      </div>

                    </div>

                    {/* MISSING SKILLS */}
                    {job.missingSkills?.length > 0 && (
                      <div className="mt-6">

                        <h4 className="text-sm font-semibold text-yellow-600">
                          Skills to Improve
                        </h4>

                        <div className="flex flex-wrap gap-2 mt-3">

                          {job.missingSkills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full px-3 py-1 text-xs font-medium"
                              >
                                + {skill}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="mt-7 flex gap-3">

                      <button
                        onClick={() =>
                          handleViewDetails(job)
                        }
                        className="flex-1 border border-gray-300 hover:bg-gray-100 rounded-xl py-3 font-semibold transition-all text-gray-700"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() =>
                          handleApply(job)
                        }
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3 font-semibold transition-all"
                      >
                        Apply Now
                      </button>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </div>
        )}

      </main>

      {/* =====================================================
          JOB DETAILS MODAL
      ===================================================== */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl p-7 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex justify-between items-start gap-4">

              <div>

                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedJob.title}
                </h2>

                <p className="text-blue-600 text-lg mt-2 font-medium">
                  {selectedJob.company}
                </p>

              </div>

              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>

            </div>

            {/* MATCH */}
            <div className="mt-6 bg-green-50 border border-green-300 rounded-2xl p-4">

              <p className="text-green-700 font-semibold">
                Resume Match
              </p>

              <p className="text-3xl font-bold text-green-700 mt-1">
                {selectedJob.matchPercentage || 0}%
              </p>

            </div>

            {/* BASIC INFO */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">

                <p className="text-gray-600 text-sm font-medium">
                  Location
                </p>

                <p className="text-gray-900 mt-1">
                  📍{" "}
                  {selectedJob.location ||
                    "Not specified"}
                </p>

              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">

                <p className="text-gray-600 text-sm font-medium">
                  Job Type
                </p>

                <p className="text-gray-900 mt-1">
                  💼{" "}
                  {selectedJob.jobType ||
                    "Not specified"}
                </p>

              </div>

            </div>

            {/* DESCRIPTION */}
            <div className="mt-7">

              <h3 className="text-xl font-semibold text-gray-900">
                Job Description
              </h3>

              <p className="text-gray-700 leading-7 mt-3">
                {selectedJob.description ||
                  "No job description available."}
              </p>

            </div>

            {/* MATCHED SKILLS */}
            <div className="mt-7">

              <h3 className="text-xl font-semibold text-green-600">
                Matched Skills
              </h3>

              <div className="flex flex-wrap gap-2 mt-4">

                {selectedJob.matchedSkills?.length > 0 ? (
                  selectedJob.matchedSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 border border-green-300 rounded-full px-3 py-2 text-sm font-medium"
                      >
                        ✓ {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-gray-500">
                    No matched skills
                  </span>
                )}

              </div>

            </div>

            {/* MISSING SKILLS */}
            {selectedJob.missingSkills?.length > 0 && (
              <div className="mt-7">

                <h3 className="text-xl font-semibold text-yellow-600">
                  Skills to Improve
                </h3>

                <div className="flex flex-wrap gap-2 mt-4">

                  {selectedJob.missingSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full px-3 py-2 text-sm font-medium"
                      >
                        + {skill}
                      </span>
                    )
                  )}

                </div>

              </div>
            )}

            {/* MODAL BUTTONS */}
            <div className="flex gap-3 mt-8">

              <button
                onClick={handleCloseDetails}
                className="flex-1 border border-gray-300 hover:bg-gray-100 rounded-xl py-3 font-semibold transition-all text-gray-700"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleApply(selectedJob)
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3 font-semibold transition-all"
              >
                Apply Now
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;
