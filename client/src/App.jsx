import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5001/api";

function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantMessage, setAssistantMessage] = useState(
    "Your day is ready. What would you like me to take care of?"
  );
  const [lastAction, setLastAction] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [commandHistory, setCommandHistory] = useState([]);
  const expenses = records.filter(r => r.type === "expense");
  const tasks = records.filter(r => r.type === "task");

  const totalSpent = expenses.reduce(
    (sum, record) => sum + Number(record.amount || 0),
    0
  );

  const pendingTasks = tasks.filter(
    task => task.status === "pending"
  ).length;

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API}/records`);
      if (!response.ok) throw new Error("Unable to load records");
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError("Backend connection unavailable. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const speak = (message) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const processCommand = async (command) => {
    if (!command.trim()) return;

    setTranscript(command);
    setProcessing(true);
    setListening(false);
    setError("");
    setAssistantMessage("Understanding your command...");

    try {
      const response = await fetch(`${API}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ command })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to process command");
      }

      setLastAction(data.record);
      setCommandHistory(prev => [
  {
    id: Date.now(),
    command,
    record: data.record,
    message: data.message,
    time: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    })
  },
  ...prev
].slice(0, 5));
      setAssistantMessage(data.message);
      speak(data.message);
      await fetchRecords();
    } catch (err) {
      setError(err.message);
      setAssistantMessage("I couldn't complete that action. Please try again.");
      speak("Sorry, I couldn't complete that action.");
    } finally {
      setProcessing(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is unavailable. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setError("");
      setTranscript("");
      setAssistantMessage("I'm listening. Go ahead...");
    };

    recognition.onresult = (event) => {
      let text = "";

      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      setTranscript(text);

      const lastResult = event.results[event.results.length - 1];

      if (lastResult.isFinal) {
        processCommand(text);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setError(`Microphone error: ${event.error}`);
      setAssistantMessage("I couldn't hear you. Please try again.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const completeTask = async (id) => {
    try {
      const response = await fetch(`${API}/records/${id}`, {
        method: "PATCH"
      });

      if (!response.ok) throw new Error("Could not complete task");

      await fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const response = await fetch(`${API}/records/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Could not delete record");

      await fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRecords = records.filter(record => {
    if (filter === "all") return true;
    return record.type === filter;
  });

  const categoryTotals = expenses.reduce((result, record) => {
    const category = record.category || "General";
    result[category] = (result[category] || 0) + Number(record.amount || 0);
    return result;
  }, {});

  const categoryEntries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxCategoryAmount = Math.max(
    ...categoryEntries.map(entry => entry[1]),
    1
  );

  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">v.</span>
          <span>
            <strong>vox.task</strong>
            <small>PERSONAL VOICE OS</small>
          </span>
        </a>

        <div className="side-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-link active" href="#overview">
            <span>◫</span> Overview
          </a>
          <a className="nav-link" href="#activity">
            <span>◷</span> Activity
          </a>
          <a className="nav-link" href="#insights">
            <span>◈</span> Insights
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-orb">✳</div>
          <p>Speak less.</p>
          <p className="lime-text">Get more done.</p>
          <small>YOUR DAY, UNDER CONTROL.</small>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Overview
          </div>
          <div className="topbar-right">
            <span className="live-indicator">
              <i /> SYSTEM ONLINE
            </span>
            <div className="avatar">V</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <div className="eyebrow">{date.toUpperCase()} / YOUR DAILY OVERVIEW</div>
            <h1>
              Make your day
              <br />
              <span>sound simpler.</span>
            </h1>
            <p>Your thoughts become actions. Just speak.</p>
          </div>

          <div className="welcome-decoration">
            <div className="decoration-ring ring-one" />
            <div className="decoration-ring ring-two" />
            <span>✳</span>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <span>!</span> {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="workspace-grid">
          <div className="voice-panel">
            <div className="panel-topline">
              <span className="eyebrow">01 / VOICE COMMAND STUDIO</span>
              <span className="ready-label">
                <i /> {processing ? "PROCESSING" : listening ? "LISTENING" : "READY TO LISTEN"}
              </span>
            </div>

            <div className={`voice-orb ${listening ? "is-listening" : ""} ${processing ? "is-processing" : ""}`}>
              <div className="orb-ring orb-ring-one" />
              <div className="orb-ring orb-ring-two" />
              <button
                className="mic-button"
                onClick={listening ? undefined : startListening}
                disabled={processing || listening}
                aria-label="Start voice command"
              >
                {processing ? "···" : listening ? "●" : "🎙"}
              </button>
            </div>

            <h2>
              {processing
                ? "Making things happen."
                : listening
                ? "I'm all ears."
                : "Your voice is the interface."}
            </h2>

            <p className="voice-description">
              {listening
                ? "Speak naturally. I'm listening to your command."
                : processing
                ? "Understanding your words and creating your action."
                : "Tap the microphone and tell me what's on your mind."}
            </p>

            <div className={`waveform ${listening ? "active-waveform" : ""}`}>
              {Array.from({ length: 35 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    "--bar-height": `${12 + ((index * 17) % 35)}px`,
                    "--bar-delay": `${index * 0.035}s`
                  }}
                />
              ))}
            </div>

            <div className="command-chips">
              <span>"Spent ₹250 on lunch"</span>
              <span>"Remind me to study tomorrow"</span>
            </div>

            <div className="voice-footer">
              <span>POWERED BY SPEECH AI</span>
              <span>EN-IN / MICROPHONE</span>
            </div>
          </div>

          <div className="right-column">
            <div className="interpretation-panel">
              <div className="panel-heading">
                <span className="eyebrow">02 / AI INTERPRETATION</span>
                <span className="brain-icon">✳</span>
              </div>

              <h3>From thought<br />to action.</h3>

              {transcript ? (
                <div className="interpretation-content">
                  <span className="mini-label">YOU SAID</span>
                  <p className="transcript-text">"{transcript}"</p>
                </div>
              ) : (
                <p className="muted-copy">
                  Your spoken commands will appear here, translated into meaningful actions.
                </p>
              )}

              {commandHistory.length > 0 && (
  <div className="replay-section">
    <div className="replay-heading">
      <span className="mini-label">COMMAND REPLAY</span>
      <span className="replay-live">JUST EXECUTED</span>
    </div>

    {commandHistory.slice(0, 2).map(item => (
      <div className="replay-card" key={item.id}>
        <div className="replay-command">
          <span className="replay-number">01</span>
          <div>
            <small>VOICE INPUT · {item.time}</small>
            <p>"{item.command}"</p>
          </div>
        </div>

        <div className="replay-line" />

        <div className="replay-command">
          <span className="replay-number purple">02</span>
          <div>
            <small>GEMINI INTERPRETATION</small>
            <p>
              {item.record.type.toUpperCase()} · {item.record.title}
            </p>
            <small>
              {item.record.type === "expense"
                ? `${item.record.category} · ₹${item.record.amount}`
                : `Task · ${item.record.status}`}
            </small>
          </div>
        </div>

        <div className="replay-line" />

        <div className="replay-command">
          <span className="replay-number green">03</span>
          <div>
            <small>DATABASE ACTION</small>
            <p>Successfully saved to MongoDB</p>
          </div>
          <span className="replay-check">✓</span>
        </div>
      </div>
    ))}
  </div>
)}

              <div className="interpretation-status">
                <span><i /> GEMINI AI</span>
                <span><i /> MONGODB</span>
              </div>
            </div>

            <div className="quote-panel">
              <span>✳</span>
              <p>"Less managing your life. More living it."</p>
              <small>THE VOXTASK PHILOSOPHY</small>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card spending-card">
            <div className="stat-top">
              <span className="eyebrow">TOTAL SPENDING</span>
              <span className="stat-icon">↗</span>
            </div>
            <h2>₹{totalSpent.toLocaleString("en-IN")}</h2>
            <p>{expenses.length} recorded transactions</p>
            <div className="stat-decoration">₹</div>
          </div>

          <div className="stat-card task-card">
            <div className="stat-top">
              <span className="eyebrow">TOTAL TASKS</span>
              <span className="stat-icon">✓</span>
            </div>
            <h2>{String(tasks.length).padStart(2, "0")}</h2>
            <p>{tasks.length - pendingTasks} completed so far</p>
            <div className="task-progress">
              <span style={{
                width: `${tasks.length ? ((tasks.length - pendingTasks) / tasks.length) * 100 : 0}%`
              }} />
            </div>
          </div>

          <div className="stat-card pending-card">
            <div className="stat-top">
              <span className="eyebrow">OPEN TASKS</span>
              <span className="stat-icon">◷</span>
            </div>
            <h2>{String(pendingTasks).padStart(2, "0")}</h2>
            <p>Waiting for your attention</p>
            <div className="pending-decoration">✳</div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="activity-panel" id="activity">
            <div className="section-heading">
              <div>
                <span className="eyebrow">03 / YOUR COMMAND HISTORY</span>
                <h2>Activity stream<span>.</span></h2>
              </div>

              <div className="filter-tabs">
                {["all", "expense", "task"].map(item => (
                  <button
                    key={item}
                    className={filter === item ? "selected" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item === "all" ? "All" : item === "expense" ? "Expenses" : "Tasks"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading your activity...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="empty-state">
                <span>✳</span>
                <p>Your story starts with a command.</p>
                <small>Use the microphone to create your first record.</small>
              </div>
            ) : (
              <div className="activity-list">
                {filteredRecords.map(record => (
                  <article className="activity-item" key={record._id}>
                    <div className={`activity-symbol ${record.type}`}>
                      {record.type === "expense" ? "₹" : "✓"}
                    </div>

                    <div className="activity-info">
                      <strong>{record.title}</strong>
                      <span>
                        {record.category} · {record.type}
                      </span>
                    </div>

                    <div className="activity-value">
                      {record.type === "expense" ? (
                        <strong>−₹{record.amount}</strong>
                      ) : (
                        <span className={`task-status ${record.status}`}>
                          {record.status}
                        </span>
                      )}
                      <small>
                        {new Date(record.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </small>
                    </div>

                    <div className="activity-actions">
                      {record.type === "task" && record.status === "pending" && (
                        <button
                          title="Complete task"
                          onClick={() => completeTask(record._id)}
                        >
                          ✓
                        </button>
                      )}
                      <button
                        title="Delete record"
                        onClick={() => deleteRecord(record._id)}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="insights-panel" id="insights">
            <div className="section-heading">
              <div>
                <span className="eyebrow">04 / MONEY, VISUALIZED</span>
                <h2>Where it goes<span>.</span></h2>
              </div>
              <span className="insight-symbol">◈</span>
            </div>

            {categoryEntries.length === 0 ? (
              <div className="empty-insight">
                <span>◈</span>
                <p>Your spending insights will appear here.</p>
              </div>
            ) : (
              <div className="category-list">
                {categoryEntries.map(([category, amount], index) => (
                  <div className="category-item" key={category}>
                    <div className="category-label">
                      <span>{category}</span>
                      <strong>₹{amount.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="category-track">
                      <span
                        className={`category-bar color-${index}`}
                        style={{
                          width: `${(amount / maxCategoryAmount) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="insight-footer">
              <span>BASED ON SAVED EXPENSES</span>
              <span>LIVE DATA ↗</span>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>VOX.TASK © 2026</span>
          <span>DESIGNED TO LISTEN. BUILT TO ACT.</span>
          <span>MADE FOR YOUR MOMENT.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
