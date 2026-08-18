import { useMemo, useState } from "react";
import axios from "axios";

const API_URL ="https://ai-resume-analyzer-api-2nqx.onrender.com/api";

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

  // Selected job for details modal
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
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);

  // =====================================================
  // REGISTER
  // =====================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      setMessage("Registration successful! Please login.");

      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        setPage("login");
        setMessage("");
      }, 1500);
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

      setMessage("Login successful!");
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error.response?.data?.message ||
          "Login failed"
      );
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
    /*
      Backend me applyUrl available hone par
      actual application page open hoga.

      Agar applyUrl nahi hai to user ko message
      show hoga.
    */

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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-500">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-slate-400">
              Create your account
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-6">
              Create Account
            </h2>

            <label className="text-sm text-slate-300">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="mt-2 mb-5 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <label className="text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="mt-2 mb-5 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <label className="text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="mt-2 mb-6 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
            >
              Create Account
            </button>

            {message && (
              <p className="text-center text-sm text-slate-300 mt-4">
                {message}
              </p>
            )}
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?

            <button
              onClick={() => {
                setPage("login");
                setMessage("");
              }}
              className="ml-2 text-blue-400 hover:text-blue-300"
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-500">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-slate-400">
              Analyze your resume with AI
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-6">
              Welcome Back
            </h2>

            <label className="text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="mt-2 mb-5 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <label className="text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="mt-2 mb-6 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
            >
              Login
            </button>

            {message && (
              <p className="text-center text-sm text-slate-300 mt-4">
                {message}
              </p>
            )}
          </form>

          <p className="text-center text-slate-400 mt-6">
            Don't have an account?

            <button
              onClick={() => {
                setPage("register");
                setMessage("");
              }}
              className="ml-2 text-blue-400 hover:text-blue-300"
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
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          NAVBAR
      ================================================= */}
      <nav className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <h1 className="text-2xl font-bold text-blue-500">
            AI Resume Analyzer
          </h1>

          <button
            onClick={handleLogout}
            className="border border-slate-700 hover:bg-slate-800 rounded-lg px-4 py-2"
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
          <h2 className="text-4xl font-bold">
            Resume Dashboard
          </h2>

          <p className="text-slate-400 mt-3">
            Upload your resume and get AI-powered
            insights and matching job opportunities.
          </p>
        </div>

        {/* =================================================
            UPLOAD CARD
        ================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          <h3 className="text-2xl font-semibold">
            Upload Resume
          </h3>

          <p className="text-slate-400 mt-2">
            Upload your resume in PDF format.
          </p>

          <div className="mt-6 border-2 border-dashed border-slate-700 rounded-xl p-10 text-center">

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="mx-auto block text-sm text-slate-400"
            />

            {file && (
              <p className="text-green-400 mt-4">
                Selected: {file.name}
              </p>
            )}

          </div>

          {/* UPLOAD */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg py-3 font-semibold"
          >
            {loading
              ? "Analyzing Resume..."
              : "Upload & Analyze"}
          </button>

          {/* FIND JOBS */}
          <button
            onClick={handleFindJobs}
            disabled={jobLoading || !resumeId}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg py-3 font-semibold"
          >
            {jobLoading
              ? "Finding Matching Jobs..."
              : "Find Matching Jobs"}
          </button>

          {message && (
            <p className="text-center text-slate-300 mt-4">
              {message}
            </p>
          )}

          {resumeId && (
            <p className="text-center text-xs text-green-500 mt-3">
              Resume uploaded successfully
            </p>
          )}

        </div>

        {/* =================================================
            AI ANALYSIS
        ================================================= */}
        {analysis && (
          <div className="mt-12">

            <h2 className="text-3xl font-bold mb-6">
              AI Resume Analysis
            </h2>

            {/* SUMMARY */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

              <h3 className="text-xl font-semibold text-blue-400">
                Summary
              </h3>

              <p className="mt-3 text-slate-300 leading-7">
                {analysis.summary}
              </p>

            </div>

            {/* THREE CARDS */}
            <div className="grid md:grid-cols-3 gap-6">

              {/* STRENGTHS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <h3 className="text-xl font-semibold text-green-400">
                  Strengths
                </h3>

                <ul className="mt-4 space-y-3">
                  {analysis.strengths?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-slate-300 text-sm leading-6"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

              {/* WEAKNESSES */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <h3 className="text-xl font-semibold text-yellow-400">
                  Weaknesses
                </h3>

                <ul className="mt-4 space-y-3">
                  {analysis.weaknesses?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-slate-300 text-sm leading-6"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

              {/* SUGGESTIONS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <h3 className="text-xl font-semibold text-purple-400">
                  Suggestions
                </h3>

                <ul className="mt-4 space-y-3">
                  {analysis.suggestions?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-slate-300 text-sm leading-6"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

            </div>

            {/* RECOMMENDED SKILLS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">

              <h3 className="text-xl font-semibold text-cyan-400">
                Recommended Skills
              </h3>

              <div className="flex flex-wrap gap-3 mt-5">

                {analysis.recommendedSkills?.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="bg-slate-800 px-4 py-2 rounded-full text-sm"
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

              <h2 className="text-3xl font-bold">
                Matching Jobs
              </h2>

              <p className="text-slate-400 mt-2">
                Jobs ranked according to your resume skills.
              </p>

            </div>

            {/* SEARCH & FILTER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">

              <h3 className="text-xl font-semibold mb-5">
                Search & Filter Jobs
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* SEARCH */}
                <div>
                  <label className="text-sm text-slate-400">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Job title or company"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                {/* LOCATION */}
                <div>
                  <label className="text-sm text-slate-400">
                    Location
                  </label>

                  <select
                    value={locationFilter}
                    onChange={(e) =>
                      setLocationFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
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
                  <label className="text-sm text-slate-400">
                    Job Type
                  </label>

                  <select
                    value={jobTypeFilter}
                    onChange={(e) =>
                      setJobTypeFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
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
                  <label className="text-sm text-slate-400">
                    Minimum Match
                  </label>

                  <select
                    value={minimumMatch}
                    onChange={(e) =>
                      setMinimumMatch(
                        Number(e.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
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

                <p className="text-slate-400 text-sm">
                  Showing{" "}
                  <span className="text-white font-semibold">
                    {filteredJobs.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-semibold">
                    {jobs.length}
                  </span>{" "}
                  jobs
                </p>

                <button
                  onClick={clearFilters}
                  className="border border-slate-700 hover:bg-slate-800 rounded-lg px-5 py-2"
                >
                  Clear Filters
                </button>

              </div>

            </div>

            {/* NO RESULTS */}
            {filteredJobs.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

                <h3 className="text-xl font-semibold">
                  No jobs found
                </h3>

                <p className="text-slate-400 mt-2">
                  Try changing your search or filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-5 bg-blue-600 hover:bg-blue-700 rounded-lg px-5 py-2"
                >
                  Clear Filters
                </button>

              </div>
            )}

            {/* =================================================
                JOB CARDS
            ================================================= */}
            {filteredJobs.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">

                {filteredJobs.map((job) => (

                  <div
                    key={
                      job.jobId ||
                      job._id ||
                      `${job.title}-${job.company}`
                    }
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500 transition"
                  >

                    {/* TITLE + MATCH */}
                    <div className="flex justify-between items-start gap-4">

                      <div>

                        <h3 className="text-xl font-semibold">
                          {job.title}
                        </h3>

                        <p className="text-slate-400 mt-1">
                          {job.company}
                        </p>

                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 font-bold whitespace-nowrap">
                        {job.matchPercentage || 0}%
                      </div>

                    </div>

                    {/* DESCRIPTION */}
                    {job.description && (
                      <p className="text-slate-400 text-sm leading-6 mt-5">
                        {job.description}
                      </p>
                    )}

                    {/* LOCATION + TYPE */}
                    <div className="mt-5 flex gap-3 flex-wrap">

                      <span className="bg-slate-800 rounded-full px-3 py-1 text-sm text-slate-300">
                        📍 {job.location || "Not specified"}
                      </span>

                      <span className="bg-slate-800 rounded-full px-3 py-1 text-sm text-slate-300">
                        💼 {job.jobType || "Not specified"}
                      </span>

                    </div>

                    {/* MATCHED SKILLS */}
                    <div className="mt-6">

                      <h4 className="text-sm font-semibold text-green-400">
                        Matched Skills
                      </h4>

                      <div className="flex flex-wrap gap-2 mt-3">

                        {job.matchedSkills?.length > 0 ? (
                          job.matchedSkills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-1 text-xs"
                              >
                                ✓ {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-slate-500 text-sm">
                            No matched skills
                          </span>
                        )}

                      </div>

                    </div>

                    {/* MISSING SKILLS */}
                    {job.missingSkills?.length > 0 && (
                      <div className="mt-6">

                        <h4 className="text-sm font-semibold text-yellow-400">
                          Skills to Improve
                        </h4>

                        <div className="flex flex-wrap gap-2 mt-3">

                          {job.missingSkills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-3 py-1 text-xs"
                              >
                                + {skill}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* =================================================
                        ACTION BUTTONS
                    ================================================= */}
                    <div className="mt-7 flex gap-3">

                      <button
                        onClick={() =>
                          handleViewDetails(job)
                        }
                        className="flex-1 border border-slate-700 hover:bg-slate-800 rounded-lg py-3 font-semibold"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() =>
                          handleApply(job)
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-7">

            {/* MODAL HEADER */}
            <div className="flex justify-between items-start gap-4">

              <div>
                <h2 className="text-3xl font-bold">
                  {selectedJob.title}
                </h2>

                <p className="text-blue-400 text-lg mt-2">
                  {selectedJob.company}
                </p>
              </div>

              <button
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>

            </div>

            {/* MATCH */}
            <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">

              <p className="text-green-400 font-semibold">
                Resume Match
              </p>

              <p className="text-3xl font-bold text-green-400 mt-1">
                {selectedJob.matchPercentage || 0}%
              </p>

            </div>

            {/* BASIC INFO */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">

              <div className="bg-slate-950 rounded-xl p-4">
                <p className="text-slate-500 text-sm">
                  Location
                </p>

                <p className="text-slate-200 mt-1">
                  📍{" "}
                  {selectedJob.location ||
                    "Not specified"}
                </p>
              </div>

              <div className="bg-slate-950 rounded-xl p-4">
                <p className="text-slate-500 text-sm">
                  Job Type
                </p>

                <p className="text-slate-200 mt-1">
                  💼{" "}
                  {selectedJob.jobType ||
                    "Not specified"}
                </p>
              </div>

            </div>

            {/* DESCRIPTION */}
            <div className="mt-7">

              <h3 className="text-xl font-semibold">
                Job Description
              </h3>

              <p className="text-slate-400 leading-7 mt-3">
                {selectedJob.description ||
                  "No job description available."}
              </p>

            </div>

            {/* MATCHED SKILLS */}
            <div className="mt-7">

              <h3 className="text-xl font-semibold text-green-400">
                Matched Skills
              </h3>

              <div className="flex flex-wrap gap-2 mt-4">

                {selectedJob.matchedSkills?.length > 0 ? (
                  selectedJob.matchedSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-2 text-sm"
                      >
                        ✓ {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-slate-500">
                    No matched skills
                  </span>
                )}

              </div>

            </div>

            {/* MISSING SKILLS */}
            {selectedJob.missingSkills?.length > 0 && (
              <div className="mt-7">

                <h3 className="text-xl font-semibold text-yellow-400">
                  Skills to Improve
                </h3>

                <div className="flex flex-wrap gap-2 mt-4">

                  {selectedJob.missingSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-3 py-2 text-sm"
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
                className="flex-1 border border-slate-700 hover:bg-slate-800 rounded-lg py-3 font-semibold"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleApply(selectedJob)
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
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