import { useState } from "react";
import axios from "axios";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      const response = await axios.post(
        "https://ai-resume-analyzer-api-2nqx.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);

      setLoggedIn(true);
      setMessage("Login successful!");

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");

    setLoggedIn(false);
    setAnalysis(null);
    setMessage("");
  };

  // UPLOAD + ANALYZE
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF resume.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAnalysis(null);

      // Upload resume
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await axios.post(
        "https://ai-resume-analyzer-api-2nqx.onrender.com/api/resume/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const resumeId = uploadResponse.data.resume.id;

      // Analyze resume
      const analysisResponse = await axios.get(
        `https://ai-resume-analyzer-api-2nqx.onrender.com/api/ai/analyze/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysis(analysisResponse.data.analysis);
      setMessage("Resume analyzed successfully!");

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <h1 className="text-2xl font-bold">
            AI Resume Analyzer
          </h1>

          {loggedIn && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Logout
            </button>
          )}

        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* LOGIN */}
        {!loggedIn && (
          <div className="mx-auto max-w-md">

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">
                Welcome Back
              </h2>

              <p className="mt-2 text-slate-400">
                Login to analyze your resume with AI
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl"
            >

              <label className="mb-2 block text-sm text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                required
              />

              <label className="mb-2 block text-sm text-slate-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                required
              />

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700"
              >
                Login
              </button>

            </form>

            {message && (
              <p className="mt-4 text-center text-sm text-slate-300">
                {message}
              </p>
            )}

          </div>
        )}

        {/* DASHBOARD */}
        {loggedIn && (
          <>
            {/* HERO */}
            <div className="mb-10">

              <h2 className="text-4xl font-bold">
                Analyze Your Resume
              </h2>

              <p className="mt-3 text-slate-400">
                Upload your resume and get AI-powered insights,
                strengths, weaknesses and skill recommendations.
              </p>

            </div>

            {/* UPLOAD CARD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

              <h3 className="text-xl font-semibold">
                Upload Resume
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Upload your resume in PDF format.
              </p>

              <div className="mt-6 rounded-xl border-2 border-dashed border-slate-700 p-8 text-center">

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="mx-auto block text-sm text-slate-400"
                />

                {file && (
                  <p className="mt-4 text-sm text-green-400">
                    Selected: {file.name}
                  </p>
                )}

              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Analyzing Resume..."
                  : "Upload & Analyze"}
              </button>

              {message && (
                <p className="mt-4 text-center text-sm text-slate-300">
                  {message}
                </p>
              )}

            </div>

            {/* ANALYSIS */}
            {analysis && (
              <div className="mt-10 space-y-6">

                <h2 className="text-3xl font-bold">
                  AI Resume Analysis
                </h2>

                {/* SUMMARY */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="text-xl font-semibold text-blue-400">
                    Summary
                  </h3>

                  <p className="mt-3 leading-7 text-slate-300">
                    {analysis.summary}
                  </p>
                </div>

                {/* THREE CARDS */}
                <div className="grid gap-6 md:grid-cols-3">

                  {/* STRENGTHS */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                    <h3 className="text-xl font-semibold text-green-400">
                      Strengths
                    </h3>

                    <ul className="mt-4 space-y-3">
                      {analysis.strengths?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="text-sm leading-6 text-slate-300"
                          >
                            • {item}
                          </li>
                        )
                      )}
                    </ul>

                  </div>

                  {/* WEAKNESSES */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                    <h3 className="text-xl font-semibold text-yellow-400">
                      Weaknesses
                    </h3>

                    <ul className="mt-4 space-y-3">
                      {analysis.weaknesses?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="text-sm leading-6 text-slate-300"
                          >
                            • {item}
                          </li>
                        )
                      )}
                    </ul>

                  </div>

                  {/* SUGGESTIONS */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                    <h3 className="text-xl font-semibold text-purple-400">
                      Suggestions
                    </h3>

                    <ul className="mt-4 space-y-3">
                      {analysis.suggestions?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="text-sm leading-6 text-slate-300"
                          >
                            • {item}
                          </li>
                        )
                      )}
                    </ul>

                  </div>

                </div>

                {/* RECOMMENDED SKILLS */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                  <h3 className="text-xl font-semibold text-cyan-400">
                    Recommended Skills
                  </h3>

                  <div className="mt-5 flex flex-wrap gap-3">

                    {analysis.recommendedSkills?.map(
                      (skill, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200"
                        >
                          {skill}
                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}

          </>
        )}

      </main>

    </div>
  );
}

export default App;