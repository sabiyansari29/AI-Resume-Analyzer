import { useMemo, useState } from "react";
import axios from "axios";

const API_URL =
  "https://ai-resume-analyzer-api-2nqx.onrender.com/api";

function App() {
  // ================= AUTH =================
  const [page, setPage] = useState(
    localStorage.getItem("token") ? "dashboard" : "login"
  );

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ================= RESUME =================
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // ================= JOBS =================
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // ================= FILTERS =================
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [minimumMatch, setMinimumMatch] = useState(0);

  // ================= UI =================
  const [message, setMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);

  // ================= REGISTER =================
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
      setMessage("Registration successful. Please login.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setLoginError("");

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const token = response.data?.token;

      if (!token) {
        throw new Error("Token not received from server.");
      }

      localStorage.setItem("token", token);

      setLoggedIn(true);
      setPage("dashboard");

      setEmail("");
      setPassword("");
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

  // ================= LOGOUT =================
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

  // ================= FILE =================
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

  // ================= UPLOAD + ANALYZE =================
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF resume.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setLoggedIn(false);
      setPage("login");
      setMessage("Please login first.");
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

      const uploadResponse = await axios.post(
        `${API_URL}/resume/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedResume = uploadResponse.data?.resume;

      const uploadedResumeId =
        uploadedResume?.id || uploadedResume?._id;

      if (!uploadedResumeId) {
        throw new Error(
          "Resume ID was not returned by server."
        );
      }

      setResumeId(uploadedResumeId);

      const analysisResponse = await axios.get(
        `${API_URL}/ai/analyze/${uploadedResumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const aiAnalysis =
        analysisResponse.data?.analysis || {};

      console.log("FULL AI ANALYSIS:", aiAnalysis);

      setAnalysis(aiAnalysis);
      setMessage("Resume analyzed successfully.");
    } catch (error) {
      console.error("Upload/analysis error:", error);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to analyze resume."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= FIND JOBS =================
  const handleFindJobs = async () => {
    if (!resumeId) {
      setMessage(
        "Please upload and analyze your resume first."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setLoggedIn(false);
      setPage("login");
      setMessage("Please login first.");
      return;
    }

    try {
      setJobLoading(true);
      setMessage("");

      setJobs([]);
      setSelectedJob(null);

      const response = await axios.get(
        `${API_URL}/job/match/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const receivedJobs = response.data?.jobs || [];

      setJobs(receivedJobs);

      if (receivedJobs.length === 0) {
        setMessage("No matching jobs are currently available.");
      }
    } catch (error) {
      console.error("Job matching error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to find matching jobs."
      );
    } finally {
      setJobLoading(false);
    }
  };

  // ================= FILTERS =================
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setJobTypeFilter("");
    setMinimumMatch(0);
  };

  const locations = useMemo(
    () => [
      ...new Set(
        jobs.map((job) => job.location).filter(Boolean)
      ),
    ],
    [jobs]
  );

  const jobTypes = useMemo(
    () => [
      ...new Set(
        jobs.map((job) => job.jobType).filter(Boolean)
      ),
    ],
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const title = job.title?.toLowerCase() || "";
      const company = job.company?.toLowerCase() || "";

      return (
        (!search ||
          title.includes(search) ||
          company.includes(search)) &&
        (!locationFilter ||
          job.location === locationFilter) &&
        (!jobTypeFilter ||
          job.jobType === jobTypeFilter) &&
        Number(job.matchPercentage || 0) >=
          Number(minimumMatch)
      );
    });
  }, [
    jobs,
    searchTerm,
    locationFilter,
    jobTypeFilter,
    minimumMatch,
  ]);

  // ================= HELPERS =================
  const getArray = (value) => {
    if (!value) return [];

    if (typeof value === "string") {
      return value
        .split(/[,;|•\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(value)) return [];

    return value
      .flat(Infinity)
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (
          typeof item === "object" &&
          item !== null
        ) {
          return (
            item.keyword ||
            item.name ||
            item.skill ||
            item.term ||
            item.title ||
            ""
          )
            .toString()
            .trim();
        }

        return "";
      })
      .filter(Boolean);
  };

  const unique = (arr) => {
    const seen = new Set();

    return arr.filter((item) => {
      const key = String(item)
        .toLowerCase()
        .replace(/[^\w+#.-]/g, "")
        .trim();

      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  };

  // ================= JOB HELPERS =================
  const formatPostedDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getApplyUrl = (job) => {
    return (
      job?.applyUrl ||
      job?.applicationUrl ||
      job?.apply_link ||
      job?.url ||
      ""
    );
  };

  const handleApply = (job) => {
    const url = getApplyUrl(job);

    if (!url) {
      setMessage(
        "Application link is not available for this job."
      );
      return;
    }

    try {
      const validUrl = new URL(url);

      if (
        validUrl.protocol !== "http:" &&
        validUrl.protocol !== "https:"
      ) {
        setMessage("Invalid application link.");
        return;
      }

      window.open(
        validUrl.href,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      setMessage("Invalid application link.");
    }
  };

  // ================= ATS =================
  const atsScore = Number(
    analysis?.atsScore ?? 0
  );

  const atsScoreReason = getArray(
    analysis?.atsScoreReason
  );

  const atsStrengths = getArray(
    analysis?.atsStrengths
  );

  const atsIssues = getArray(
    analysis?.atsIssues
  );

  // ================= KEYWORDS =================
  const backendFoundKeywords = unique(
    getArray(
      analysis?.keywordsFound ??
        analysis?.foundKeywords ??
        analysis?.keywords?.found ??
        analysis?.keywords?.foundKeywords
    )
  );

  const backendMissingKeywords = unique(
    getArray(
      analysis?.missingKeywords ??
        analysis?.keywordsMissing ??
        analysis?.keywords?.missing ??
        analysis?.keywords?.missingKeywords
    )
  );

  const missingSkills = unique(
    getArray(analysis?.missingSkills)
  );

  const improvementSuggestions = getArray(
    analysis?.improvementSuggestions
  );

  const recommendedSkills = unique(
    getArray(analysis?.recommendedSkills)
  );

  const keywordDictionary = [
    "JavaScript",
    "TypeScript",
    "Java",
    "Python",
    "C++",
    "HTML",
    "CSS",
    "React",
    "React.js",
    "Node.js",
    "Express",
    "Express.js",
    "MongoDB",
    "MySQL",
    "SQL",
    "Tailwind CSS",
    "Bootstrap",
    "REST API",
    "REST APIs",
    "JWT",
    "Git",
    "GitHub",
    "MERN",
    "Flask",
    "Django",
    "FastAPI",
    "Firebase",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "GitHub Actions",
    "Jenkins",
    "Jest",
    "Mocha",
    "Machine Learning",
    "Artificial Intelligence",
    "AI",
    "OpenAI",
    "Groq",
    "OpenCV",
    "YOLO",
    "YOLOv8",
    "Data Structures",
    "Algorithms",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "Agile",
    "Scrum",
    "Problem Solving",
    "Communication",
    "Teamwork",
  ];

  const analysisSearchText = useMemo(() => {
    if (!analysis) return "";

    const values = [];

    const collect = (value) => {
      if (!value) return;

      if (typeof value === "string") {
        values.push(value);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }

      if (typeof value === "object") {
        Object.values(value).forEach(collect);
      }
    };

    collect(analysis);

    return values.join(" ").toLowerCase();
  }, [analysis]);

  const detectedKeywords = useMemo(() => {
    if (!analysisSearchText) return [];

    return keywordDictionary.filter((keyword) =>
      analysisSearchText.includes(
        keyword.toLowerCase()
      )
    );
  }, [analysisSearchText]);

  const keywordsFound = unique([
    ...backendFoundKeywords,
    ...detectedKeywords,
  ]);

  const missingKeywords = unique([
    ...backendMissingKeywords,
    ...missingSkills,
  ]);

  const backendCoverage = Number(
    analysis?.keywordCoverage ??
      analysis?.keywordCoveragePercentage ??
      analysis?.keywordMatchPercentage ??
      analysis?.keywordScore
  );

  let keywordCoverage = 0;

  if (
    Number.isFinite(backendCoverage) &&
    backendCoverage > 0
  ) {
    keywordCoverage = Math.min(
      100,
      Math.max(0, Math.round(backendCoverage))
    );
  } else {
    const total =
      keywordsFound.length +
      missingKeywords.length;

    if (total > 0) {
      keywordCoverage = Math.round(
        (keywordsFound.length / total) * 100
      );
    }
  }

  const getAtsLabel = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Needs Major Improvement";
  };

  // ================= AUTH PAGE =================
  if (!loggedIn && page === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-800 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-blue-300/30 rounded-full blur-3xl -top-24 -left-24" />
        <div className="absolute w-96 h-96 bg-purple-300/30 rounded-full blur-3xl -bottom-32 -right-32" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 mb-5">
              <span className="text-2xl font-bold text-white">
                AI
              </span>
            </div>

            <h1 className="text-4xl font-bold text-slate-900">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-slate-500">
              Analyze your resume with AI
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/70 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl shadow-slate-300/50"
          >
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Welcome Back
            </h2>

            <label className="text-sm text-slate-600">
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
              className="mt-2 mb-5 w-full rounded-xl bg-white/80 border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
              required
            />

            <label className="text-sm text-slate-600">
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
              className="mt-2 mb-6 w-full rounded-xl bg-white/80 border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/20"
            >
              Login
            </button>

            {loginError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                ⚠ {loginError}
              </div>
            )}
          </form>

          <p className="text-center text-slate-500 mt-6">
            Don't have an account?

            <button
              onClick={() => {
                setPage("register");
                setMessage("");
                setLoginError("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ================= REGISTER PAGE =================
  if (!loggedIn && page === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-800 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-blue-300/30 rounded-full blur-3xl -top-24 -left-24" />
        <div className="absolute w-96 h-96 bg-purple-300/30 rounded-full blur-3xl -bottom-32 -right-32" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 mb-5">
              <span className="text-2xl font-bold text-white">
                AI
              </span>
            </div>

            <h1 className="text-4xl font-bold text-slate-900">
              AI Resume Analyzer
            </h1>

            <p className="mt-3 text-slate-500">
              Create your account
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="bg-white/70 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-2xl shadow-slate-300/50"
          >
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Create Account
            </h2>

            <label className="text-sm text-slate-600">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 mb-5 w-full rounded-xl bg-white/80 border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
              required
            />

            <label className="text-sm text-slate-600">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 mb-5 w-full rounded-xl bg-white/80 border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
              required
            />

            <label className="text-sm text-slate-600">
              Password
            </label>

            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 mb-6 w-full rounded-xl bg-white/80 border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg"
            >
              Create Account
            </button>

            {message && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                ⚠ {message}
              </div>
            )}
          </form>

          <p className="text-center text-slate-500 mt-6">
            Already have an account?

            <button
              onClick={() => {
                setPage("login");
                setMessage("");
                setLoginError("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-800 relative overflow-hidden">
      <div className="fixed w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -top-40 -left-40 pointer-events-none" />
      <div className="fixed w-96 h-96 bg-purple-300/20 rounded-full blur-3xl bottom-0 right-0 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/70 backdrop-blur-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="font-bold text-white">
                AI
              </span>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                AI Resume Analyzer
              </h1>

              <p className="text-xs text-blue-600">
                Career Intelligence Platform
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="border border-slate-200 bg-white/70 hover:bg-white rounded-xl px-4 py-2 transition font-medium text-slate-700 shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* HERO */}
        <div className="mb-10">
          <p className="text-blue-600 font-bold mb-3 tracking-widest text-sm">
            ✦ AI-POWERED CAREER ASSISTANT
          </p>

          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-slate-900">
            Turn your resume into
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              your next opportunity.
            </span>
          </h2>

          <p className="text-slate-600 mt-5 max-w-3xl text-lg leading-8">
            Upload your resume to receive an ATS score,
            keyword insights, improvement recommendations
            and personalized job matches.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-3xl p-8 shadow-xl shadow-slate-200/70">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
              📄
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                Upload Resume
              </h3>

              <p className="text-slate-500 mt-1">
                PDF format only. Let AI analyze your profile.
              </p>
            </div>
          </div>

          <label className="mt-8 block border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition cursor-pointer">
            <div className="text-5xl mb-4">
              📄
            </div>

            <p className="text-slate-700 font-medium">
              Click to browse your computer
            </p>

            <p className="text-slate-400 text-sm mt-2">
              PDF files only
            </p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {file && (
              <div className="mt-5">
                <p className="text-blue-600 font-semibold">
                  📑 {file.name}
                </p>

                <p className="text-green-600 mt-2 text-sm">
                  ✓ Ready to analyze: {file.name}
                </p>
              </div>
            )}
          </label>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
            >
              {loading
                ? "Analyzing Resume..."
                : "✦ Upload & Analyze"}
            </button>

            <button
              onClick={handleFindJobs}
              disabled={jobLoading || !resumeId}
              className="rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
            >
              {jobLoading
                ? "Finding Jobs..."
                : "⌕ Find Matching Jobs"}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
              {message}
            </div>
          )}
        </div>

        {/* ================= AI ANALYSIS ================= */}
        {analysis && (
          <div className="mt-14">
            <p className="text-blue-600 font-bold tracking-widest text-sm">
              RESUME INTELLIGENCE
            </p>

            <h2 className="text-4xl font-bold mt-2 text-slate-900">
              AI Resume Analysis
            </h2>

            {/* ATS */}
            <div className="mt-7 bg-white/70 backdrop-blur-2xl border border-slate-200 rounded-3xl p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row justify-between gap-10">
                <div>
                  <p className="text-blue-600 font-bold tracking-wider text-sm">
                    ATS COMPATIBILITY SCORE
                  </p>

                  <div className="flex items-end gap-2 mt-3">
                    <span className="text-7xl font-bold text-slate-900">
                      {atsScore}
                    </span>

                    <span className="text-2xl text-slate-400 mb-2">
                      /100
                    </span>
                  </div>

                  <p className="text-xl font-semibold mt-2 text-slate-800">
                    {getAtsLabel(atsScore)}
                  </p>

                  <p className="text-slate-500 mt-4 max-w-2xl leading-7">
                    Your resume is evaluated based on ATS
                    readability, skills, keywords, structure,
                    experience and recruiter relevance.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-40 h-40 rounded-full flex items-center justify-center bg-blue-50 border-8 border-blue-100"
                    style={{
                      boxShadow:
                        `0 0 45px rgba(59,130,246,${Math.max(
                          0.1,
                          atsScore / 700
                        )})`,
                    }}
                  >
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">
                        {atsScore}
                      </p>

                      <p className="text-xs text-slate-400">
                        ATS SCORE
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-3">
                    ATS compatibility {atsScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* SNAPSHOT */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              {[
                ["ATS Score", `${atsScore}/100`],
                ["Keywords Found", keywordsFound.length],
                ["Missing Keywords", missingKeywords.length],
                ["Skills to Improve", missingSkills.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-white/70 border border-slate-200 rounded-2xl p-5 backdrop-blur-xl hover:shadow-lg hover:-translate-y-1 transition"
                >
                  <p className="text-slate-500 text-sm">
                    {label}
                  </p>

                  <p className="text-3xl font-bold mt-2 text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* WHY SCORE */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-7 mt-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-semibold text-slate-900">
                Why This Score?
              </h3>

              {atsScoreReason.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {atsScoreReason.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>

                      <p className="text-slate-600 leading-7">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mt-4">
                  No ATS score explanation available.
                </p>
              )}
            </div>

            {/* STRENGTHS + ISSUES */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-3xl p-7 backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-green-600">
                  ✓ ATS Strengths
                </h3>

                <div className="mt-5 space-y-4">
                  {atsStrengths.length > 0 ? (
                    atsStrengths.map((item, index) => (
                      <p
                        key={index}
                        className="text-slate-600 leading-7"
                      >
                        <span className="text-green-600 font-bold">
                          ✓
                        </span>{" "}
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      No ATS strengths available.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-3xl p-7 backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-red-600">
                  ! ATS Issues
                </h3>

                <div className="mt-5 space-y-4">
                  {atsIssues.length > 0 ? (
                    atsIssues.map((item, index) => (
                      <p
                        key={index}
                        className="text-slate-600 leading-7"
                      >
                        <span className="text-red-600 font-bold">
                          !
                        </span>{" "}
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      No major ATS issues detected.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* KEYWORDS */}
            <div className="bg-white/70 backdrop-blur-2xl border border-slate-200 rounded-3xl p-7 mt-6 shadow-lg">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <p className="text-blue-600 font-bold text-sm tracking-widest">
                    KEYWORD INTELLIGENCE
                  </p>

                  <h3 className="text-2xl font-bold mt-2 text-slate-900">
                    Resume Keyword Analysis
                  </h3>

                  <p className="text-slate-500 mt-2">
                    Understand how well your resume matches
                    important recruiter keywords.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-7 py-5 min-w-[180px] text-center">
                  <p className="text-sm text-slate-500">
                    KEYWORD COVERAGE
                  </p>

                  <p className="text-4xl font-bold text-blue-600 mt-1">
                    {keywordCoverage}%
                  </p>

                  <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${keywordCoverage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-7">
                {/* FOUND */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-green-600">
                        ✓ Keywords Found
                      </h4>

                      <p className="text-sm text-slate-500 mt-1">
                        Keywords detected in your resume
                      </p>
                    </div>

                    <span className="text-3xl font-bold text-green-600">
                      {keywordsFound.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {keywordsFound.length > 0 ? (
                      keywordsFound.map(
                        (keyword, index) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="px-3 py-2 rounded-full bg-green-100 border border-green-200 text-green-700 text-sm font-medium"
                          >
                            ✓ {keyword}
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No keyword data was returned.
                      </p>
                    )}
                  </div>
                </div>

                {/* MISSING */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-red-600">
                        + Missing Keywords
                      </h4>

                      <p className="text-sm text-slate-500 mt-1">
                        Keywords you may want to add
                      </p>
                    </div>

                    <span className="text-3xl font-bold text-red-600">
                      {missingKeywords.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {missingKeywords.length > 0 ? (
                      missingKeywords.map(
                        (keyword, index) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="px-3 py-2 rounded-full bg-red-100 border border-red-200 text-red-700 text-sm font-medium"
                          >
                            + {keyword}
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No missing keyword data was returned.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SKILLS TO IMPROVE */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-7 mt-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-semibold text-purple-600">
                + Skills to Improve
              </h3>

              <p className="text-slate-500 mt-2">
                Skills that can strengthen your profile.
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                {missingSkills.length > 0 ? (
                  missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700"
                    >
                      + {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">
                    No specific missing skills identified.
                  </p>
                )}
              </div>
            </div>

            {/* IMPROVEMENTS */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-7 mt-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-semibold text-yellow-600">
                💡 How to Improve Your ATS Score
              </h3>

              <p className="text-slate-500 mt-2">
                Actionable recommendations from AI
              </p>

              {improvementSuggestions.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {improvementSuggestions.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex gap-4"
                      >
                        <div className="w-8 h-8 shrink-0 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>

                        <p className="text-slate-600 leading-7">
                          {item}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-slate-500 mt-5">
                  No improvement suggestions available.
                </p>
              )}
            </div>

            {/* SUMMARY */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-7 mt-6 backdrop-blur-xl shadow-lg">
              <p className="text-blue-600 font-bold text-sm tracking-widest">
                AI SUMMARY
              </p>

              <h3 className="text-2xl font-bold mt-2 text-slate-900">
                Professional Summary
              </h3>

              <p className="text-slate-600 leading-8 mt-4">
                {analysis.summary ||
                  "No summary available."}
              </p>
            </div>

            {/* THREE CARDS */}
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
                <h3 className="text-xl font-semibold text-green-600">
                  Strengths
                </h3>

                <div className="mt-5 space-y-3">
                  {getArray(analysis.strengths).length > 0 ? (
                    getArray(analysis.strengths).map(
                      (item, index) => (
                        <p
                          key={index}
                          className="text-slate-600 text-sm leading-6"
                        >
                          ✓ {item}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No strengths available.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6">
                <h3 className="text-xl font-semibold text-yellow-600">
                  Weaknesses
                </h3>

                <div className="mt-5 space-y-3">
                  {getArray(analysis.weaknesses).length > 0 ? (
                    getArray(analysis.weaknesses).map(
                      (item, index) => (
                        <p
                          key={index}
                          className="text-slate-600 text-sm leading-6"
                        >
                          • {item}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No weaknesses available.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6">
                <h3 className="text-xl font-semibold text-purple-600">
                  Suggestions
                </h3>

                <div className="mt-5 space-y-3">
                  {getArray(analysis.suggestions).length > 0 ? (
                    getArray(analysis.suggestions).map(
                      (item, index) => (
                        <p
                          key={index}
                          className="text-slate-600 text-sm leading-6"
                        >
                          • {item}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No suggestions available.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RECOMMENDED SKILLS */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-7 mt-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-semibold text-cyan-600">
                Recommended Skills
              </h3>

              <p className="text-slate-500 mt-2">
                Skills recommended by AI for career growth.
              </p>

              <div className="flex flex-wrap gap-3 mt-5">
                {recommendedSkills.length > 0 ? (
                  recommendedSkills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-medium"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-slate-500">
                    No recommended skills available.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= JOB MATCHER ================= */}
        {jobs.length > 0 && (
          <div className="mt-14">
            <p className="text-purple-600 font-bold tracking-widest text-sm">
              CAREER OPPORTUNITIES
            </p>

            <h2 className="text-4xl font-bold mt-2 text-slate-900">
              Matching Jobs
            </h2>

            <p className="text-slate-500 mt-2">
              Real job opportunities ranked according to
              your resume compatibility.
            </p>

            {/* FILTER */}
            <div className="bg-white/70 border border-slate-200 rounded-3xl p-6 mt-7 backdrop-blur-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-5 text-slate-900">
                Search & Filter Jobs
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-600">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Job title or company"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600">
                    Location
                  </label>

                  <select
                    value={locationFilter}
                    onChange={(e) =>
                      setLocationFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none text-slate-800"
                  >
                    <option value="">
                      All Locations
                    </option>

                    {locations.map((location) => (
                      <option
                        key={location}
                        value={location}
                      >
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">
                    Job Type
                  </label>

                  <select
                    value={jobTypeFilter}
                    onChange={(e) =>
                      setJobTypeFilter(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none text-slate-800"
                  >
                    <option value="">
                      All Job Types
                    </option>

                    {jobTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">
                    Minimum Match
                  </label>

                  <select
                    value={minimumMatch}
                    onChange={(e) =>
                      setMinimumMatch(
                        Number(e.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none text-slate-800"
                  >
                    <option value={0}>
                      Any Match
                    </option>
                    <option value={50}>50%+</option>
                    <option value={60}>60%+</option>
                    <option value={70}>70%+</option>
                    <option value={80}>80%+</option>
                    <option value={90}>90%+</option>
                    <option value={100}>100%</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                <p className="text-slate-500 text-sm">
                  Showing{" "}
                  <span className="text-slate-900 font-semibold">
                    {filteredJobs.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-900 font-semibold">
                    {jobs.length}
                  </span>{" "}
                  jobs
                </p>

                <button
                  onClick={clearFilters}
                  className="border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-5 py-2 transition font-medium text-slate-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* NO RESULTS */}
            {filteredJobs.length === 0 && (
              <div className="bg-white/70 border border-slate-200 rounded-3xl p-10 text-center mt-6 backdrop-blur-xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-900">
                  No jobs found
                </h3>

                <p className="text-slate-500 mt-2">
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
              <div className="grid md:grid-cols-2 gap-6 mt-7">
                {filteredJobs.map((job, index) => {
                  const postedDate = formatPostedDate(
                    job.postedDate ||
                      job.posted_date
                  );

                  const applyUrl =
                    getApplyUrl(job);

                  return (
                    <div
                      key={
                        job.jobId ||
                        job._id ||
                        `${job.title}-${job.company}-${index}`
                      }
                      className="bg-white/70 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 hover:border-blue-300 hover:-translate-y-1 hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {job.title}
                          </h3>

                          <p className="text-blue-600 mt-1 font-medium">
                            {job.company}
                          </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-600 font-bold whitespace-nowrap">
                          {job.matchPercentage || 0}%
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2 flex-wrap">
                        <span className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-sm text-slate-600">
                          📍 {job.location || "Not specified"}
                        </span>

                        <span className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-sm text-slate-600">
                          💼 {job.jobType || "Not specified"}
                        </span>

                        {job.experience && (
                          <span className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm text-blue-700">
                            🎓 {job.experience}
                          </span>
                        )}

                        {postedDate && (
                          <span className="bg-purple-50 border border-purple-200 rounded-full px-3 py-1 text-sm text-purple-700">
                            🗓 Posted {postedDate}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-slate-500 text-sm leading-6 mt-5 line-clamp-4">
                          {job.description}
                        </p>
                      )}

                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-green-600">
                          Matched Skills
                        </h4>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.matchedSkills?.length > 0 ? (
                            job.matchedSkills.map(
                              (skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium"
                                >
                                  ✓ {skill}
                                </span>
                              )
                            )
                          ) : (
                            <span className="text-slate-400 text-sm">
                              No matched skills
                            </span>
                          )}
                        </div>
                      </div>

                      {job.missingSkills?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold text-yellow-600">
                            Skills to Improve
                          </h4>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.missingSkills.map(
                              (skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-1 text-xs font-medium"
                                >
                                  + {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-7 flex gap-3">
                        <button
                          onClick={() =>
                            setSelectedJob(job)
                          }
                          className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-3 font-semibold transition text-slate-700"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() =>
                            handleApply(job)
                          }
                          disabled={!applyUrl}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition"
                        >
                          {applyUrl
                            ? "Apply Now"
                            : "Link Unavailable"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= JOB DETAILS MODAL ================= */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-7 shadow-2xl">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {selectedJob.title}
                </h2>

                <p className="text-blue-600 text-lg mt-2 font-medium">
                  {selectedJob.company}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedJob(null)
                }
                className="text-slate-400 hover:text-slate-800 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-green-600 font-semibold">
                Resume Match
              </p>

              <p className="text-4xl font-bold text-green-600 mt-1">
                {selectedJob.matchPercentage || 0}%
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-slate-500 text-sm">
                  Location
                </p>

                <p className="mt-1 text-slate-800">
                  📍{" "}
                  {selectedJob.location ||
                    "Not specified"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-slate-500 text-sm">
                  Job Type
                </p>

                <p className="mt-1 text-slate-800">
                  💼{" "}
                  {selectedJob.jobType ||
                    "Not specified"}
                </p>
              </div>

              {selectedJob.experience && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-blue-600 text-sm">
                    Experience
                  </p>

                  <p className="mt-1 text-slate-800">
                    🎓 {selectedJob.experience}
                  </p>
                </div>
              )}

              {(selectedJob.postedDate ||
                selectedJob.posted_date) && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <p className="text-purple-600 text-sm">
                    Posted Date
                  </p>

                  <p className="mt-1 text-slate-800">
                    🗓{" "}
                    {formatPostedDate(
                      selectedJob.postedDate ||
                        selectedJob.posted_date
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-7">
              <h3 className="text-xl font-semibold text-slate-900">
                Job Description
              </h3>

              <p className="text-slate-600 leading-7 mt-3 whitespace-pre-line">
                {selectedJob.description ||
                  "No job description available."}
              </p>
            </div>

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
                        className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-2 text-sm"
                      >
                        ✓ {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-slate-400">
                    No matched skills
                  </span>
                )}
              </div>
            </div>

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
                        className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-2 text-sm"
                      >
                        + {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() =>
                  setSelectedJob(null)
                }
                className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-3 font-semibold transition text-slate-700"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleApply(selectedJob)
                }
                disabled={!getApplyUrl(selectedJob)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition"
              >
                {getApplyUrl(selectedJob)
                  ? "Apply Now"
                  : "Link Unavailable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;