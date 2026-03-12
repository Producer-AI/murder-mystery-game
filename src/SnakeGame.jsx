import { useState } from "react";

const screens = [
  "landing",
  "checkin",
  "waiting",
  "quiz",
  "results",
  "elimination",
  "finale",
  "playercard",
];

const screenLabels = [
  "Landing",
  "Check-in",
  "Waiting",
  "Quiz",
  "Results",
  "Eliminated",
  "Finale",
  "Player Card",
];

// SVG horse illustration (simplified engraving style)
const HorseIcon = ({ size = 120, opacity = 0.15 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ opacity }}>
    <g fill="none" stroke="#8B2020" strokeWidth="0.8">
      <path d="M30 85 Q25 70 28 55 Q30 45 38 38 Q42 34 45 28 Q47 22 50 18 Q53 15 56 16 Q58 18 57 22 Q56 26 58 30 Q60 34 65 36 Q70 38 75 42 Q80 46 82 52 Q84 58 83 65 Q82 72 80 78 Q78 82 76 85" />
      <path d="M38 38 Q40 42 42 48 Q44 54 44 60 Q44 66 42 72 Q40 78 38 85" />
      <path d="M75 42 Q78 48 80 54 Q82 60 82 65" />
      <path d="M30 85 L28 100 M32 85 L34 100 M76 85 L74 100 M80 85 L82 100" />
      <path d="M50 18 Q48 14 50 10 Q53 8 56 10 Q58 12 56 16" />
      <path d="M82 72 Q86 70 90 72 Q92 74 90 78 Q88 80 84 80" />
      {/* Engraving lines */}
      <path d="M42 50 Q50 48 58 50 Q66 52 74 50" strokeWidth="0.4" />
      <path d="M40 56 Q50 54 60 56 Q70 58 78 56" strokeWidth="0.4" />
      <path d="M40 62 Q50 60 60 62 Q70 64 80 62" strokeWidth="0.4" />
      <path d="M40 68 Q50 66 60 68 Q70 70 80 68" strokeWidth="0.4" />
      <path d="M40 74 Q50 72 60 74 Q70 76 78 74" strokeWidth="0.4" />
    </g>
  </svg>
);

const SnakeIcon = () => (
  <span style={{ fontSize: "1.2em" }}>🐍</span>
);

const HorseEmoji = () => (
  <span style={{ fontSize: "1.2em" }}>🐎</span>
);

const Lantern = () => (
  <span style={{ fontSize: "1.4em" }}>🧧</span>
);

export default function SnakeGameScreens() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [checkinName, setCheckinName] = useState("");
  const [quizAnswers, setQuizAnswers] = useState(["", "", "", "", ""]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState([false, false, false, false, false]);

  const baseStyles = {
    fontFamily: "'Courier New', 'Courier', monospace",
    color: "#8B2020",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  };

  const creamBg = {
    background: "linear-gradient(145deg, #FAF6F1 0%, #F5EDE4 50%, #FAF6F1 100%)",
  };

  const darkBg = {
    background: "linear-gradient(145deg, #1A0A0A 0%, #2D0F0F 30%, #1A0A0A 70%, #0D0505 100%)",
    color: "#D4A574",
  };

  const redBg = {
    background: "linear-gradient(145deg, #8B1A1A 0%, #A02020 30%, #8B1A1A 70%, #6B1010 100%)",
    color: "#FAF6F1",
  };

  // Texture overlay
  const TextureOverlay = ({ dark }) => (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: dark 
        ? "radial-gradient(circle at 20% 30%, rgba(139,32,32,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139,32,32,0.05) 0%, transparent 50%)"
        : "radial-gradient(circle at 30% 20%, rgba(139,32,32,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,32,32,0.02) 0%, transparent 50%)",
      pointerEvents: "none",
    }} />
  );

  // Decorative corner elements
  const CornerDecor = ({ position, color = "#8B2020" }) => {
    const styles = {
      position: "absolute",
      width: 60,
      height: 60,
      opacity: 0.15,
      ...(position === "tl" && { top: 16, left: 16 }),
      ...(position === "tr" && { top: 16, right: 16, transform: "scaleX(-1)" }),
      ...(position === "bl" && { bottom: 16, left: 16, transform: "scaleY(-1)" }),
      ...(position === "br" && { bottom: 16, right: 16, transform: "scale(-1)" }),
    };
    return (
      <svg style={styles} viewBox="0 0 60 60">
        <path d="M5 5 L5 25 M5 5 L25 5" stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M8 8 L8 18 M8 8 L18 8" stroke={color} strokeWidth="0.8" fill="none" />
      </svg>
    );
  };

  const Button = ({ children, onClick, variant = "default", disabled, style: extraStyle }) => {
    const variants = {
      default: {
        background: "transparent",
        border: "1.5px solid #8B2020",
        color: "#8B2020",
        padding: "12px 32px",
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        letterSpacing: 3,
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.3s ease",
      },
      dark: {
        background: "transparent",
        border: "1.5px solid #D4A574",
        color: "#D4A574",
        padding: "12px 32px",
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        letterSpacing: 3,
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.3s ease",
      },
      red: {
        background: "transparent",
        border: "1.5px solid #FAF6F1",
        color: "#FAF6F1",
        padding: "12px 32px",
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        letterSpacing: 3,
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.3s ease",
      },
      gold: {
        background: "linear-gradient(135deg, #D4A574, #C4956A)",
        border: "none",
        color: "#1A0A0A",
        padding: "14px 36px",
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        letterSpacing: 3,
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontWeight: "bold",
      },
    };
    return (
      <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...extraStyle }}>
        {children}
      </button>
    );
  };

  const Input = ({ value, onChange, placeholder, variant = "default", style: extraStyle }) => {
    const variants = {
      default: {
        background: "transparent",
        border: "none",
        borderBottom: "1.5px solid #8B2020",
        color: "#8B2020",
        padding: "10px 4px",
        fontFamily: "'Courier New', monospace",
        fontSize: 16,
        textAlign: "center",
        outline: "none",
        width: "100%",
        maxWidth: 280,
      },
      dark: {
        background: "transparent",
        border: "none",
        borderBottom: "1.5px solid #D4A574",
        color: "#D4A574",
        padding: "10px 4px",
        fontFamily: "'Courier New', monospace",
        fontSize: 16,
        textAlign: "center",
        outline: "none",
        width: "100%",
        maxWidth: 280,
      },
    };
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...variants[variant], ...extraStyle }}
      />
    );
  };

  // ============ SCREENS ============

  const LandingScreen = () => (
    <div style={{ ...baseStyles, ...creamBg, justifyContent: "center", padding: 40 }}>
      <TextureOverlay />
      <CornerDecor position="tl" />
      <CornerDecor position="tr" />
      <CornerDecor position="bl" />
      <CornerDecor position="br" />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 360 }}>
        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", opacity: 0.5, marginBottom: 24 }}>
          03.14.2026
        </p>
        
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: "normal", 
          letterSpacing: 2, 
          lineHeight: 1.1, 
          margin: "0 0 8px 0",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}>
          LUNAR NEW YEAR
        </h1>
        <p style={{ fontSize: 11, letterSpacing: 8, textTransform: "uppercase", margin: "0 0 40px 0", opacity: 0.6 }}>
          EDITION
        </p>

        <div style={{ margin: "0 auto 40px", opacity: 0.2 }}>
          <HorseIcon size={160} opacity={1} />
        </div>

        <p style={{ fontSize: 12, letterSpacing: 2, lineHeight: 1.8, textTransform: "uppercase", marginBottom: 8 }}>
          Shed your snake skin.
        </p>
        <p style={{ fontSize: 12, letterSpacing: 2, lineHeight: 1.8, textTransform: "uppercase", marginBottom: 40 }}>
          Gallop into the fire horse era.
        </p>

        <div style={{ 
          width: 40, height: 1, background: "#8B2020", margin: "0 auto 40px", opacity: 0.3 
        }} />

        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 32 }}>
          One of you is the snake
        </p>

        <Button onClick={() => {}}>Enter</Button>
      </div>
    </div>
  );

  const CheckinScreen = () => (
    <div style={{ ...baseStyles, ...creamBg, justifyContent: "center", padding: 40 }}>
      <TextureOverlay />
      <CornerDecor position="tl" />
      <CornerDecor position="tr" />
      <CornerDecor position="bl" />
      <CornerDecor position="br" />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 340 }}>
        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", opacity: 0.5, marginBottom: 40 }}>
          Check In
        </p>

        <div style={{ margin: "0 auto 48px", opacity: 0.15 }}>
          <HorseIcon size={100} opacity={1} />
        </div>

        <p style={{ fontSize: 12, letterSpacing: 2, lineHeight: 1.8, textTransform: "uppercase", marginBottom: 40 }}>
          State your name, player.
        </p>

        <Input 
          value={checkinName} 
          onChange={(e) => setCheckinName(e.target.value)} 
          placeholder="your name"
        />

        <div style={{ marginTop: 40 }}>
          <Button onClick={() => {}} disabled={!checkinName}>
            I'm in
          </Button>
        </div>

        <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.4, marginTop: 32, textTransform: "uppercase" }}>
          12 players checked in
        </p>
      </div>
    </div>
  );

  const WaitingScreen = () => (
    <div style={{ ...baseStyles, ...darkBg, justifyContent: "center", padding: 40 }}>
      <TextureOverlay dark />
      <CornerDecor position="tl" color="#D4A574" />
      <CornerDecor position="tr" color="#D4A574" />
      <CornerDecor position="bl" color="#D4A574" />
      <CornerDecor position="br" color="#D4A574" />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 340 }}>
        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", opacity: 0.4, marginBottom: 40 }}>
          03.14.2026 — 8PM
        </p>

        <div style={{ 
          width: 80, height: 80, 
          border: "1px solid rgba(212,165,116,0.2)", 
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 40px",
          animation: "pulse 3s ease-in-out infinite",
        }}>
          <div style={{ 
            width: 50, height: 50, 
            border: "1px solid rgba(212,165,116,0.3)", 
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
          </div>
        </div>

        <h2 style={{ 
          fontSize: 14, 
          fontWeight: "normal",
          letterSpacing: 4, 
          textTransform: "uppercase", 
          marginBottom: 20,
          color: "#D4A574",
        }}>
          Game Locked
        </h2>

        <p style={{ fontSize: 12, letterSpacing: 1.5, lineHeight: 2, opacity: 0.5, marginBottom: 8 }}>
          The snake has been chosen.
        </p>
        <p style={{ fontSize: 12, letterSpacing: 1.5, lineHeight: 2, opacity: 0.5, marginBottom: 40 }}>
          The game begins soon.
        </p>

        <div style={{ 
          border: "1px solid rgba(212,165,116,0.15)", 
          padding: "24px 28px",
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.4, marginBottom: 16 }}>
            Intel
          </p>
          <p style={{ fontSize: 11, letterSpacing: 1.5, lineHeight: 2, opacity: 0.6, margin: 0 }}>
            Dress code: all black 🖤
          </p>
          <p style={{ fontSize: 11, letterSpacing: 1.5, lineHeight: 2, opacity: 0.6, margin: 0 }}>
            Location: West Village
          </p>
          <p style={{ fontSize: 11, letterSpacing: 1.5, lineHeight: 2, opacity: 0.6, margin: 0 }}>
            Trust no one.
          </p>
        </div>

        <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.3, textTransform: "uppercase" }}>
          Stay alert. Watch everything.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );

  const QuizScreen = () => (
    <div style={{ ...baseStyles, ...darkBg, justifyContent: "flex-start", padding: "60px 40px 40px" }}>
      <TextureOverlay dark />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 340, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", opacity: 0.4, margin: 0 }}>
            Round 1
          </p>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", opacity: 0.4, margin: 0 }}>
            3 of 7
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48 }}>
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < 2 ? "#D4A574" : i === 2 ? "transparent" : "rgba(212,165,116,0.15)",
              border: i === 2 ? "1px solid #D4A574" : "none",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        <h2 style={{ 
          fontSize: 48, 
          fontWeight: "normal",
          fontFamily: "'Georgia', serif",
          color: "#D4A574",
          margin: "0 0 12px 0",
          opacity: 0.8,
        }}>
          03
        </h2>

        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.4, marginBottom: 48 }}>
          Question Three
        </p>

        <div style={{ 
          width: "100%", 
          borderTop: "1px solid rgba(212,165,116,0.1)", 
          paddingTop: 32,
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5, textTransform: "uppercase", marginBottom: 24 }}>
            Your Answer
          </p>
          <Input 
            value={quizAnswers[2]} 
            onChange={(e) => {
              const newAnswers = [...quizAnswers];
              newAnswers[2] = e.target.value;
              setQuizAnswers(newAnswers);
            }}
            placeholder="type here"
            variant="dark"
          />
        </div>

        <div style={{ marginTop: 32 }}>
          <Button variant="dark" onClick={() => {}}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );

  const ResultsScreen = () => {
    const players = [
      { name: "Priya", roundScore: 18, cumulative: 42, correct: "5/7" },
      { name: "Marcus", roundScore: 15, cumulative: 38, correct: "4/7" },
      { name: "Jess", roundScore: 14, cumulative: 35, correct: "4/7" },
      { name: "Tommy", roundScore: 12, cumulative: 33, correct: "3/7" },
      { name: "Kai", roundScore: 11, cumulative: 30, correct: "3/7" },
      { name: "Nina", roundScore: 10, cumulative: 28, correct: "3/7" },
      { name: "Sam", roundScore: 8, cumulative: 22, correct: "2/7" },
      { name: "Devon", roundScore: 5, cumulative: 16, correct: "1/7", eliminated: true },
    ];

    return (
      <div style={{ ...baseStyles, ...darkBg, justifyContent: "flex-start", padding: "48px 24px" }}>
        <TextureOverlay dark />
        
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 380, width: "100%" }}>
          <p style={{ fontSize: 10, letterSpacing: 6, textTransform: "uppercase", opacity: 0.4, marginBottom: 8 }}>
            Round 1 — Results
          </p>
          <h2 style={{ 
            fontSize: 14, letterSpacing: 4, textTransform: "uppercase", 
            fontWeight: "normal", color: "#D4A574", marginBottom: 36 
          }}>
            Leaderboard
          </h2>

          <div style={{ width: "100%" }}>
            {players.map((p, i) => (
              <div key={p.name} style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: "1px solid rgba(212,165,116,0.08)",
                opacity: p.eliminated ? 1 : 1,
                position: "relative",
                background: p.eliminated 
                  ? "rgba(139,32,32,0.15)" 
                  : i === 0 
                    ? "rgba(212,165,116,0.05)" 
                    : "transparent",
              }}>
                <span style={{ 
                  fontSize: 11, width: 24, color: i === 0 ? "#D4A574" : "rgba(212,165,116,0.3)",
                  fontFamily: "'Georgia', serif",
                }}>
                  {i + 1}
                </span>
                
                <span style={{ 
                  fontSize: 12, letterSpacing: 2, textTransform: "uppercase", flex: 1, textAlign: "left",
                  color: p.eliminated ? "#8B2020" : i === 0 ? "#D4A574" : "rgba(212,165,116,0.7)",
                }}>
                  {p.name}
                  {i === 0 && " 🐎"}
                  {p.eliminated && " 🐍"}
                </span>

                <span style={{ 
                  fontSize: 10, letterSpacing: 1, opacity: 0.4, marginRight: 16 
                }}>
                  {p.correct}
                </span>
                
                <span style={{ 
                  fontSize: 11, letterSpacing: 1, width: 28, textAlign: "right",
                  color: p.eliminated ? "#8B2020" : "rgba(212,165,116,0.5)",
                }}>
                  +{p.roundScore}
                </span>
                
                <span style={{ 
                  fontSize: 13, letterSpacing: 1, width: 36, textAlign: "right", fontWeight: "bold",
                  color: p.eliminated ? "#8B2020" : i === 0 ? "#D4A574" : "rgba(212,165,116,0.8)",
                }}>
                  {p.cumulative}
                </span>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 32, 
            border: "1px solid rgba(139,32,32,0.3)", 
            padding: "16px 20px",
            background: "rgba(139,32,32,0.08)",
          }}>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#8B2020", textTransform: "uppercase", margin: 0 }}>
              🐍 Devon has been bitten — eliminated
            </p>
          </div>

          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.3, marginTop: 32 }}>
            7 players remain
          </p>
        </div>
      </div>
    );
  };

  const EliminationScreen = () => (
    <div style={{ ...baseStyles, ...redBg, justifyContent: "center", padding: 40 }}>
      <CornerDecor position="tl" color="#FAF6F1" />
      <CornerDecor position="tr" color="#FAF6F1" />
      <CornerDecor position="bl" color="#FAF6F1" />
      <CornerDecor position="br" color="#FAF6F1" />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 340 }}>
        <p style={{ fontSize: 60, margin: "0 0 24px 0" }}>🐍</p>
        
        <h2 style={{ 
          fontSize: 14, letterSpacing: 6, textTransform: "uppercase", 
          fontWeight: "normal", marginBottom: 16, opacity: 0.7 
        }}>
          You've Been
        </h2>
        
        <h1 style={{ 
          fontSize: 36, 
          fontFamily: "'Georgia', serif",
          fontWeight: "normal",
          letterSpacing: 4,
          margin: "0 0 40px 0",
          textTransform: "uppercase",
        }}>
          Bitten
        </h1>

        <div style={{ width: 40, height: 1, background: "#FAF6F1", margin: "0 auto 40px", opacity: 0.3 }} />

        <p style={{ fontSize: 12, letterSpacing: 2, lineHeight: 2, opacity: 0.7, marginBottom: 8 }}>
          Your score was the lowest.
        </p>
        <p style={{ fontSize: 12, letterSpacing: 2, lineHeight: 2, opacity: 0.7, marginBottom: 40 }}>
          The snake claims another victim.
        </p>

        <div style={{ 
          border: "1px solid rgba(250,246,241,0.2)", 
          padding: "20px 24px",
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.4, marginBottom: 8 }}>
            Your final score
          </p>
          <p style={{ fontSize: 28, fontFamily: "'Georgia', serif", margin: 0, letterSpacing: 2 }}>
            16
          </p>
        </div>

        <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase" }}>
          You may spectate. Stay vigilant.
        </p>
      </div>
    </div>
  );

  const FinaleScreen = () => (
    <div style={{ ...baseStyles, ...darkBg, justifyContent: "center", padding: 40 }}>
      <TextureOverlay dark />
      <CornerDecor position="tl" color="#D4A574" />
      <CornerDecor position="tr" color="#D4A574" />
      <CornerDecor position="bl" color="#D4A574" />
      <CornerDecor position="br" color="#D4A574" />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 340 }}>
        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", opacity: 0.4, marginBottom: 32 }}>
          The Snake Has Been Unmasked
        </p>

        <div style={{ 
          width: 100, height: 100,
          border: "2px solid #D4A574",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          background: "rgba(212,165,116,0.05)",
        }}>
          <span style={{ fontSize: 40 }}>🐍</span>
        </div>

        <p style={{ fontSize: 12, letterSpacing: 2, opacity: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
          The snake was
        </p>
        <h2 style={{ 
          fontSize: 28, fontFamily: "'Georgia', serif", fontWeight: "normal",
          color: "#D4A574", letterSpacing: 3, margin: "0 0 48px 0",
        }}>
          MARCUS
        </h2>

        <div style={{ width: 40, height: 1, background: "#D4A574", margin: "0 auto 48px", opacity: 0.2 }} />

        <p style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", opacity: 0.4, marginBottom: 24 }}>
          And the winner is
        </p>

        <div style={{ 
          border: "2px solid #D4A574",
          padding: "32px 28px",
          marginBottom: 32,
          background: "rgba(212,165,116,0.03)",
        }}>
          <p style={{ fontSize: 40, margin: "0 0 8px 0" }}>🐎</p>
          <h1 style={{ 
            fontSize: 32, fontFamily: "'Georgia', serif", fontWeight: "normal",
            color: "#D4A574", letterSpacing: 4, margin: "0 0 8px 0",
          }}>
            PRIYA
          </h1>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, margin: "0 0 4px 0" }}>
            Fire Horse
          </p>
          <p style={{ fontSize: 13, letterSpacing: 1, color: "#D4A574", margin: 0 }}>
            42 points
          </p>
        </div>

        <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.3, textTransform: "uppercase" }}>
          Year of the Fire Horse 🧧
        </p>
      </div>
    </div>
  );

  const PlayerCardScreen = () => (
    <div style={{ ...baseStyles, ...creamBg, justifyContent: "center", padding: 40 }}>
      <TextureOverlay />
      
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 320, width: "100%" }}>
        <p style={{ fontSize: 10, letterSpacing: 6, textTransform: "uppercase", opacity: 0.4, marginBottom: 32 }}>
          Player Dossier
        </p>

        <div style={{ 
          border: "1.5px solid rgba(139,32,32,0.2)",
          padding: "36px 28px",
          position: "relative",
          background: "rgba(250,246,241,0.5)",
        }}>
          {/* Classified stamp */}
          <div style={{
            position: "absolute",
            top: -12, right: 20,
            background: "#8B2020",
            color: "#FAF6F1",
            padding: "4px 12px",
            fontSize: 9,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}>
            Active
          </div>

          <div style={{ 
            width: 64, height: 64,
            border: "1.5px solid rgba(139,32,32,0.2)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}>
            🐎
          </div>

          <h2 style={{ 
            fontSize: 20, fontFamily: "'Georgia', serif", fontWeight: "normal",
            letterSpacing: 3, margin: "0 0 4px 0",
          }}>
            PRIYA
          </h2>
          
          <p style={{ fontSize: 10, letterSpacing: 3, opacity: 0.4, textTransform: "uppercase", marginBottom: 28 }}>
            Player 04
          </p>

          <div style={{ width: "100%", textAlign: "left" }}>
            {[
              ["Status", "Active"],
              ["Rounds Survived", "3 of 3"],
              ["Current Rank", "#1"],
              ["Cumulative Score", "42"],
              ["Snake Bites Taken", "0"],
              ["Snake Suspicion", "Low"],
            ].map(([label, value], i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: i < 5 ? "1px solid rgba(139,32,32,0.08)" : "none",
              }}>
                <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5 }}>
                  {label}
                </span>
                <span style={{ fontSize: 11, letterSpacing: 1 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          marginTop: 24,
          border: "1px solid rgba(139,32,32,0.1)",
          padding: "16px 20px",
        }}>
          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.4, marginBottom: 8 }}>
            Round 1 Breakdown
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {["✓","✓","✓","✗","✓","✓","✗"].map((mark, i) => (
              <div key={i} style={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12,
                border: `1px solid ${mark === "✓" ? "rgba(139,32,32,0.15)" : "rgba(139,32,32,0.08)"}`,
                color: mark === "✓" ? "#8B2020" : "rgba(139,32,32,0.25)",
                background: mark === "✓" ? "rgba(139,32,32,0.03)" : "transparent",
              }}>
                {mark}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screens[currentScreen]) {
      case "landing": return <LandingScreen />;
      case "checkin": return <CheckinScreen />;
      case "waiting": return <WaitingScreen />;
      case "quiz": return <QuizScreen />;
      case "results": return <ResultsScreen />;
      case "elimination": return <EliminationScreen />;
      case "finale": return <FinaleScreen />;
      case "playercard": return <PlayerCardScreen />;
      default: return <LandingScreen />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1A1A1A" }}>
      {/* Screen selector */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: 0,
        background: "#0D0D0D",
        borderBottom: "1px solid #2A2A2A",
        flexShrink: 0,
      }}>
        {screenLabels.map((label, i) => (
          <button
            key={label}
            onClick={() => setCurrentScreen(i)}
            style={{
              background: currentScreen === i ? "#2A2020" : "transparent",
              border: "none",
              borderBottom: currentScreen === i ? "2px solid #8B2020" : "2px solid transparent",
              color: currentScreen === i ? "#D4A574" : "#666",
              padding: "12px 16px",
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        padding: 24,
        overflow: "hidden",
      }}>
        <div style={{
          width: 375,
          height: 720,
          borderRadius: 40,
          overflow: "hidden",
          border: "3px solid #333",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Notch */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 150,
            height: 30,
            background: "#333",
            borderRadius: "0 0 20px 20px",
            zIndex: 10,
          }} />
          
          <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}