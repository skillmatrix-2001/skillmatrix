"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const canvasRef        = useRef(null);
  const mouseRef         = useRef({ x: -9999, y: -9999 });
  const scrollRef        = useRef(0);
  const rafRef           = useRef(null);
  const ringRafRef       = useRef(null);
  const cursorDotRef     = useRef(null);
  const cursorRingRef    = useRef(null);
  const cursorTargetRef  = useRef({ x: 0, y: 0 });
  const cursorCurrentRef = useRef({ x: 0, y: 0 });

  const [heroReady, setHeroReady] = useState(false);
  const [revealed,  setRevealed]  = useState({});
  const [isMobile,  setIsMobile]  = useState(false);

  useEffect(() => {
    if (localStorage.getItem("user")) router.push("/feed");
    setHeroReady(true);
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── canvas: drifting dot field + cursor repulsion with slow return ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const SP = window.innerWidth < 768 ? 40 : 30;
    const R0 = 1.4;
    const INF = 160;
    const STR = 55;

    const DRIFT_AMP_X  = 6;
    const DRIFT_AMP_Y  = 5;
    const DRIFT_SPEED  = 0.0009;

    const MAX_COLS = 160;
    const MAX_ROWS = 120;
    const dotState = new Float32Array(MAX_COLS * MAX_ROWS * 3);

    const startTime = performance.now();
    let lastTime    = startTime;

    const draw = (now) => {
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      const elapsed = now - startTime;

      ctx.clearRect(0, 0, W, H);

      const engageFactor = 1 - Math.exp(-dt / 40);
      const returnFactor = 1 - Math.exp(-dt / 2100);

      // Remove scroll-dependent vertical offset to stop dots “resetting”
      const cols  = Math.min(Math.ceil(W / SP) + 2, MAX_COLS);
      const rows  = Math.min(Math.ceil(H / SP) + 4, MAX_ROWS);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = c * SP - SP;
          const by = r * SP - SP;                    // ← fixed: no scroll offset

          const phaseX = (c * 1.7  + r * 2.3)  % (Math.PI * 2);
          const phaseY = (c * 2.9  + r * 1.13) % (Math.PI * 2);
          const autoX  = Math.sin(elapsed * DRIFT_SPEED        + phaseX) * DRIFT_AMP_X;
          const autoY  = Math.cos(elapsed * DRIFT_SPEED * 1.27 + phaseY) * DRIFT_AMP_Y;

          const rx = bx + autoX;
          const ry = by + autoY;

          const dx   = mouseRef.current.x - rx;
          const dy   = mouseRef.current.y - ry;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let targetDx = 0, targetDy = 0, targetInf = 0;
          if (dist < INF) {
            const frac = 1 - dist / INF;
            const ease = frac * frac * (3 - 2 * frac);
            const ang  = Math.atan2(dy, dx);
            targetDx  = -Math.cos(ang) * ease * STR;
            targetDy  = -Math.sin(ang) * ease * STR;
            targetInf = ease;
          }

          const idx = (c * MAX_ROWS + r) * 3;
          const t = targetInf > dotState[idx + 2] ? engageFactor : returnFactor;
          dotState[idx]     += (targetDx  - dotState[idx])     * t;
          dotState[idx + 1] += (targetDy  - dotState[idx + 1]) * t;
          dotState[idx + 2] += (targetInf - dotState[idx + 2]) * t;

          const newDx  = dotState[idx];
          const newDy  = dotState[idx + 1];
          const newInf = dotState[idx + 2];

          const x = rx + newDx;
          const y = ry + newDy;

          const cr    = Math.round(28 + newInf * (184 - 28));
          const cg    = Math.round(24 + newInf * (92  - 24));
          const cb    = Math.round(20 + newInf * (72  - 20));
          const alpha = 0.38 + newInf * 0.54;       // ← base opacity increased from 0.22
          const rad   = R0   + newInf * 2.6;

          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── mouse tracking ── */
  useEffect(() => {
    const move = (e) => {
      mouseRef.current        = { x: e.clientX, y: e.clientY };
      cursorTargetRef.current = { x: e.clientX, y: e.clientY };
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = e.clientX + "px";
        cursorDotRef.current.style.top  = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* cursor ring lerp */
  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      const c  = cursorCurrentRef.current;
      const tg = cursorTargetRef.current;
      c.x = lerp(c.x, tg.x, 0.09);
      c.y = lerp(c.y, tg.y, 0.09);
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = c.x + "px";
        cursorRingRef.current.style.top  = c.y + "px";
      }
      ringRafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (ringRafRef.current) cancelAnimationFrame(ringRafRef.current); };
  }, []);

  /* scroll */
  useEffect(() => {
    const h = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* intersection reveals */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting)
          setRevealed((p) => ({ ...p, [e.target.dataset.reveal]: true }));
      }),
      { threshold: 0.07 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const expand = () => cursorRingRef.current?.classList.add("cx");
  const shrink = () => cursorRingRef.current?.classList.remove("cx");

  const features = [
    {
      n:"01",
      title:"Digital Portfolio",
      desc:"Upload certificates, projects, and achievements with descriptions, tech stacks, and links — building a verified academic portfolio that speaks for you.",
    },
    {
      n:"02",
      title:"AI Career Chatbot",
      desc:"Ask anything about placement, resumes, or career paths. Our FastAPI-powered chatbot uses an LLM to give you real, personalised guidance anytime.",
    },
    {
      n:"03",
      title:"Achievement Feed",
      desc:"A live activity stream of everything your peers are uploading — certificates, projects, and milestones — so the best work never goes unnoticed.",
    },
    {
      n:"04",
      title:"Live Job Listings",
      desc:"Real-time job and internship opportunities pulled from external APIs, filtered to match your skills, department, and career interests.",
    },
    {
      n:"05",
      title:"Role-Based Access",
      desc:"Separate, secure dashboards for Students, Staff, and Admins — each with the right tools. Staff can review, admins can manage, students can shine.",
    },
    {
      n:"06",
      title:"Instant Resume Export",
      desc:"Generate a professional, formatted resume directly from your SkillMatrix profile — pulling in your skills, education, projects, and certificates automatically.",
    },
  ];

  const stats  = [
    { v:"3",     l:"User roles" },
    { v:"7",     l:"Core modules" },
    { v:"100%",  l:"College verified" },
    { v:"Free",  l:"Always for students" },
  ];

  const mWords = [
    "Portfolio","Certificates","Projects","Placement",
    "Chatbot","Achievements","Career","Skills",
  ];

  return (
    <div style={{ background:"#f2ede6", color:"#1c1814",
      minHeight:"100vh", overflowX:"hidden",
      cursor: isMobile ? "auto" : "none" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        @media(hover:hover){ *,*::before,*::after{ cursor:none!important; } }

        /* ── cursors ── */
        .cdot{
          position:fixed; width:6px; height:6px;
          background:#1c1814; border-radius:50%;
          transform:translate(-50%,-50%);
          pointer-events:none; z-index:9999;
        }
        .cring{
          position:fixed; width:34px; height:34px;
          border:1.5px solid rgba(28,24,20,.32); border-radius:50%;
          transform:translate(-50%,-50%);
          pointer-events:none; z-index:9998;
          transition:width .4s cubic-bezier(.16,1,.3,1),
                     height .4s cubic-bezier(.16,1,.3,1),
                     border-color .35s;
        }
        .cring.cx{ width:68px; height:68px; border-color:rgba(184,92,72,.7); }

        /* ── hero anims ── */
        .hw{
          display:inline-block;
          opacity:0; transform:translateY(72px);
          transition:opacity .9s cubic-bezier(.16,1,.3,1),
                     transform .9s cubic-bezier(.16,1,.3,1);
        }
        .hw.go{ opacity:1; transform:translateY(0); }
        .hf{
          opacity:0; transform:translateY(22px);
          transition:opacity .7s ease,transform .7s ease;
        }
        .hf.go{ opacity:1; transform:translateY(0); }

        /* ── section reveals ── */
        .sr{
          opacity:0; transform:translateY(44px);
          transition:opacity .85s cubic-bezier(.16,1,.3,1),
                     transform .85s cubic-bezier(.16,1,.3,1);
        }
        .sr.v{ opacity:1; transform:translateY(0); }

        /* ── feature rows ── */
        .frow{
          border-top:1px solid rgba(28,24,20,.13);
          padding:26px 0;
          display:grid;
          grid-template-columns:44px 1fr 22px;
          align-items:center; gap:20px;
          opacity:0; transform:translateX(-18px);
          transition:opacity .6s ease,transform .6s ease,border-color .3s;
        }
        .frow.v{ opacity:1; transform:translateX(0); }
        .frow:hover{ border-top-color:rgba(184,92,72,.5); }
        .farr{ color:rgba(28,24,20,.35); font-size:16px; }

        /* ── buttons ── */
        .bfill{
          display:inline-block; padding:14px 34px;
          background:#b85c48; color:#f2ede6;
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          letter-spacing:.18em; text-transform:uppercase;
          text-decoration:none;
          position:relative; overflow:hidden; transition:color .4s;
        }
        .bfill::before{
          content:''; position:absolute; inset:0; background:#1c1814;
          transform:scaleX(0); transform-origin:right;
          transition:transform .45s cubic-bezier(.16,1,.3,1);
        }
        .bfill:hover::before{ transform:scaleX(1); transform-origin:left; }
        .bfill span{ position:relative; z-index:1; }

        .bghost{
          display:inline-block; padding:14px 34px;
          background:transparent; border:1.5px solid rgba(28,24,20,.3);
          color:rgba(28,24,20,.7);
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          letter-spacing:.18em; text-transform:uppercase;
          text-decoration:none;
          position:relative; overflow:hidden;
          transition:color .4s,border-color .35s;
        }
        .bghost::before{
          content:''; position:absolute; inset:0;
          background:rgba(184,92,72,.08);
          transform:scaleX(0); transform-origin:right;
          transition:transform .45s cubic-bezier(.16,1,.3,1);
        }
        .bghost:hover{ color:#1c1814; border-color:rgba(184,92,72,.55); }
        .bghost:hover::before{ transform:scaleX(1); transform-origin:left; }
        .bghost span{ position:relative; z-index:1; }

        /* ── marquee ── */
        .mtrack{ display:flex; width:max-content; animation:mq 30s linear infinite; }
        @keyframes mq{ from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* ── 3-D orbital rings ── */
        .r3s{ perspective:700px; width:160px; height:160px; position:relative; }
        .r3i{ width:100%; height:100%; transform-style:preserve-3d; position:absolute; }
        .r3i.a1{ animation:oa  9s linear infinite; }
        .r3i.a2{ animation:ob 14s linear infinite; }
        .r3i.a3{ animation:oc 18s linear infinite; }
        @keyframes oa{ from{transform:rotateX(18deg) rotateY(0)}   to{transform:rotateX(18deg) rotateY(360deg)} }
        @keyframes ob{ from{transform:rotateZ(65deg) rotateY(0)}   to{transform:rotateZ(65deg) rotateY(-360deg)} }
        @keyframes oc{ from{transform:rotateX(50deg) rotateZ(25deg) rotateY(0)} to{transform:rotateX(50deg) rotateZ(25deg) rotateY(360deg)} }
        .r3e{ position:absolute; inset:0; border-radius:50%; border:1px solid; }

        /* ── scroll pulse ── */
        @keyframes sp{
          0%  { transform:scaleY(0); transform-origin:top;    opacity:1; }
          50% { transform:scaleY(1); transform-origin:top;    opacity:1; }
          51% { transform:scaleY(1); transform-origin:bottom; }
          100%{ transform:scaleY(0); transform-origin:bottom; opacity:.2; }
        }
        .sp{ animation:sp 2.4s ease-in-out infinite; }

        /* ── mobile ── */
        @media(max-width:767px){
          .feat-grid{ display:block!important; }
          .feat-left{ margin-bottom:48px; }
          .stat-grid{ grid-template-columns:1fr 1fr!important; gap:28px!important; }
          .frow{ grid-template-columns:34px 1fr; }
          .farr{ display:none; }
          .hbtns,.btn-row{ flex-direction:column!important; align-items:stretch!important; }
          .hbtns a,.btn-row a{ text-align:center; }
          .r3s{ width:110px!important; height:110px!important; }
        }
      `}</style>

      {!isMobile && <>
        <div ref={cursorDotRef}  className="cdot"  aria-hidden />
        <div ref={cursorRingRef} className="cring" aria-hidden />
      </>}

      <canvas ref={canvasRef} aria-hidden
        style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />

      {/* ══ HERO ═══════════════════════════════════════════════════ */}
      <section style={{
        position:"relative", zIndex:10,
        minHeight:"100svh",
        display:"flex", flexDirection:"column", justifyContent:"flex-end",
        padding:"0 6vw clamp(60px,10vh,100px)",
      }}>
        <p className={`hf ${heroReady?"go":""}`} style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:600,
          letterSpacing:".24em", textTransform:"uppercase",
          color:"rgba(184,92,72,.95)",
          marginBottom:"clamp(18px,3vh,30px)",
          transitionDelay:".25s",
        }}>
          Academic Portfolio Platform — Est. 2026
        </p>

        <h1 aria-label="SkillMatrix — Achievement Tracking System" style={{
          fontFamily:"'Cormorant',serif", fontWeight:600,
          fontSize:"clamp(44px,8.5vw,118px)", lineHeight:.92,
          letterSpacing:"-.025em",
        }}>
          {[
            { w:"Skill",  d:".40s" },
            { w:"Matrix", d:".48s" },
          ].map((x, k) => (
            <span key={k} className={`hw ${heroReady?"go":""}`}
              style={{ transitionDelay:x.d, color:"#1c1814" }}>{x.w}</span>
          ))}

          <br />

          <span className={`hw ${heroReady?"go":""}`}
            style={{ transitionDelay:".57s", color:"#b85c48", fontStyle:"italic" }}>
            Achievement
          </span>

          <br />

          {[
            { w:"Tracking", d:".66s" },
            { w:"\u00A0",   d:".70s" },
            { w:"System",   d:".74s" },
          ].map((x, k) => (
            <span key={k} className={`hw ${heroReady?"go":""}`}
              style={{ transitionDelay:x.d, color:"#1c1814" }}>{x.w}</span>
          ))}
        </h1>

        <div className={`hf ${heroReady?"go":""}`} style={{
          marginTop:"clamp(28px,5vh,52px)",
          display:"flex", justifyContent:"space-between",
          alignItems:"flex-end", flexWrap:"wrap", gap:"28px",
          transitionDelay:".90s",
        }}>
          <p style={{
            fontFamily:"'DM Sans',sans-serif", fontWeight:500,
            fontSize:"clamp(13px,1.4vw,16px)", lineHeight:1.78,
            color:"rgba(28,24,20,.72)", maxWidth:"400px",
          }}>
            A centralised platform for college students to manage certificates,
            showcase projects, track achievements, and connect with real career
            opportunities — all in one place.
          </p>

          <div className="hbtns" style={{ display:"flex", gap:"12px", flexShrink:0 }}>
            <Link href="/register" className="bfill"
              onMouseEnter={expand} onMouseLeave={shrink}>
              <span>Get Started</span>
            </Link>
            <Link href="/login" className="bghost"
              onMouseEnter={expand} onMouseLeave={shrink}>
              <span>Sign In</span>
            </Link>
          </div>
        </div>

        <div className={`hf ${heroReady?"go":""}`} aria-hidden style={{
          position:"absolute", bottom:"5vh", left:"50%",
          transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center", gap:"10px",
          transitionDelay:"1.5s",
        }}>
          <div className="sp" style={{
            width:"1px", height:"52px",
            background:"linear-gradient(to bottom,transparent,rgba(28,24,20,.4))",
          }} />
          <span style={{
            fontFamily:"'DM Sans',sans-serif", fontSize:"9px", fontWeight:600,
            letterSpacing:".22em", textTransform:"uppercase",
            color:"rgba(28,24,20,.38)",
          }}>Scroll</span>
        </div>
      </section>

      {/* ══ MARQUEE ════════════════════════════════════════════════ */}
      <div aria-hidden style={{
        position:"relative", zIndex:10, overflow:"hidden",
        borderTop:"1px solid rgba(28,24,20,.12)",
        borderBottom:"1px solid rgba(28,24,20,.12)",
        padding:"17px 0",
      }}>
        <div className="mtrack">
          {[...mWords,...mWords,...mWords,...mWords].map((w,i)=>(
            <span key={i} style={{
              fontFamily:"'Cormorant',serif", fontWeight:600,
              fontSize:"14px", letterSpacing:".32em", textTransform:"uppercase",
              color: i%2===0 ? "rgba(28,24,20,.28)" : "rgba(184,92,72,.65)",
              marginRight:"60px", whiteSpace:"nowrap",
              fontStyle: i%3===2 ? "italic" : "normal",
            }}>{w}</span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ═══════════════════════════════════════════════ */}
      <section data-reveal="feat" style={{
        position:"relative", zIndex:10,
        padding:"clamp(64px,10vw,120px) 6vw clamp(56px,8vw,100px)",
      }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <div className="feat-grid" style={{
            display:"grid", gridTemplateColumns:"1fr 1.1fr",
            gap:"80px", alignItems:"start",
          }}>

            {/* left */}
            <div className="feat-left">
              <p className={`sr ${revealed.feat?"v":""}`} style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:"10px", fontWeight:600,
                letterSpacing:".24em", textTransform:"uppercase",
                color:"rgba(184,92,72,.95)", marginBottom:"18px",
              }}>Platform Modules</p>

              <h2 className={`sr ${revealed.feat?"v":""}`} style={{
                fontFamily:"'Cormorant',serif", fontWeight:600,
                fontSize:"clamp(34px,4.2vw,64px)", lineHeight:1.08,
                letterSpacing:"-.02em", color:"#1c1814",
                transitionDelay:".08s",
              }}>
                Every tool to make your{" "}
                <em style={{ color:"#b85c48" }}>work visible</em>
              </h2>

              <p className={`sr ${revealed.feat?"v":""}`} style={{
                fontFamily:"'DM Sans',sans-serif", fontWeight:500,
                fontSize:"14px", lineHeight:1.75,
                color:"rgba(28,24,20,.65)", marginTop:"22px",
                maxWidth:"320px", transitionDelay:".18s",
              }}>
                Seven interconnected modules — from certificate uploads and
                AI-powered career guidance to live job listings and role-based
                admin control.
              </p>

              <div className={`sr ${revealed.feat?"v":""}`}
                style={{ marginTop:"clamp(40px,6vw,64px)", transitionDelay:".3s" }}>
                <div className="r3s" onMouseEnter={expand} onMouseLeave={shrink}>
                  <div className="r3i a1" style={{ transformStyle:"preserve-3d" }}>
                    <div className="r3e" style={{ borderColor:"rgba(184,92,72,.55)" }} />
                  </div>
                  <div className="r3i a2"
                    style={{ position:"absolute", inset:"14px", transformStyle:"preserve-3d" }}>
                    <div className="r3e" style={{ borderColor:"rgba(28,24,20,.18)" }} />
                  </div>
                  <div className="r3i a3"
                    style={{ position:"absolute", inset:"34px", transformStyle:"preserve-3d" }}>
                    <div className="r3e" style={{ borderColor:"rgba(184,92,72,.28)" }} />
                  </div>
                  <div style={{
                    position:"absolute", top:"50%", left:"50%",
                    width:"7px", height:"7px", borderRadius:"50%",
                    background:"#b85c48", transform:"translate(-50%,-50%)",
                  }} />
                </div>
                <p style={{
                  fontFamily:"'DM Sans',sans-serif", fontSize:"10px", fontWeight:600,
                  letterSpacing:".2em", textTransform:"uppercase",
                  color:"rgba(28,24,20,.38)", marginTop:"14px",
                }}>Your achievements, orbiting together</p>
              </div>
            </div>

            {/* right – feature rows */}
            <div>
              {features.map((f,i)=>(
                <div key={i}
                  className={`frow ${revealed.feat?"v":""}`}
                  style={{ transitionDelay:`${.04*i}s` }}
                  onMouseEnter={expand} onMouseLeave={shrink}>
                  <span style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:"9px", fontWeight:600,
                    letterSpacing:".18em", color:"rgba(184,92,72,.8)",
                    textTransform:"uppercase",
                  }}>{f.n}</span>
                  <div>
                    <p style={{
                      fontFamily:"'Cormorant',serif", fontWeight:600,
                      fontSize:"20px", color:"#1c1814", marginBottom:"5px",
                    }}>{f.title}</p>
                    <p style={{
                      fontFamily:"'DM Sans',sans-serif", fontWeight:400,
                      fontSize:"13px", lineHeight:1.65,
                      color:"rgba(28,24,20,.6)",
                    }}>{f.desc}</p>
                  </div>
                  <span className="farr">→</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(28,24,20,.13)" }} />
            </div>

          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════ */}
      <section data-reveal="stats" style={{
        position:"relative", zIndex:10,
        borderTop:"1px solid rgba(28,24,20,.12)",
        padding:"clamp(56px,8vw,88px) 6vw",
      }}>
        <div className="stat-grid" style={{
          maxWidth:"1280px", margin:"0 auto",
          display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"40px",
        }}>
          {stats.map((s,i)=>(
            <div key={i} className={`sr ${revealed.stats?"v":""}`}
              style={{ transitionDelay:`${.08*i}s` }}>
              <p style={{
                fontFamily:"'Cormorant',serif", fontStyle:"italic",
                fontWeight:600, fontSize:"clamp(36px,4.5vw,60px)",
                color:"#b85c48", lineHeight:1, marginBottom:"8px",
              }}>{s.v}</p>
              <p style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:600,
                letterSpacing:".18em", textTransform:"uppercase",
                color:"rgba(28,24,20,.52)",
              }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════ */}
      <section data-reveal="cta" style={{
        position:"relative", zIndex:10,
        borderTop:"1px solid rgba(28,24,20,.12)",
        padding:"clamp(80px,12vw,140px) 6vw clamp(90px,13vw,160px)",
      }}>
        <div style={{
          maxWidth:"1280px", margin:"0 auto",
          display:"flex", flexDirection:"column",
          alignItems:"center", textAlign:"center",
        }}>
          <p className={`sr ${revealed.cta?"v":""}`} style={{
            fontFamily:"'DM Sans',sans-serif", fontSize:"10px", fontWeight:600,
            letterSpacing:".24em", textTransform:"uppercase",
            color:"rgba(184,92,72,.95)", marginBottom:"20px",
          }}>Build your academic profile</p>

          <h2 className={`sr ${revealed.cta?"v":""}`} style={{
            fontFamily:"'Cormorant',serif", fontWeight:600,
            fontSize:"clamp(48px,9.5vw,124px)", lineHeight:.9,
            letterSpacing:"-.025em", color:"#1c1814",
            marginBottom:"clamp(36px,5vw,56px)", transitionDelay:".1s",
          }}>
            Ready to<br />
            <em style={{ color:"#b85c48" }}>Begin?</em>
          </h2>

          <div className={`sr btn-row ${revealed.cta?"v":""}`} style={{
            display:"flex", gap:"12px", flexWrap:"wrap",
            justifyContent:"center", transitionDelay:".22s",
          }}>
            <Link href="/register" className="bfill"
              onMouseEnter={expand} onMouseLeave={shrink}>
              <span>Create Free Account</span>
            </Link>
            <Link href="/login" className="bghost"
              onMouseEnter={expand} onMouseLeave={shrink}>
              <span>Already a member?</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════ */}
      <footer style={{
        position:"relative", zIndex:10,
        padding:"32px 6vw",
        borderTop:"1px solid rgba(28,24,20,.12)",
        display:"flex", justifyContent:"space-between",
        alignItems:"center", flexWrap:"wrap", gap:"10px",
      }}>
        <span style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:"10px", fontWeight:600,
          letterSpacing:".15em", textTransform:"uppercase",
          color:"rgba(28,24,20,.45)",
        }}>SkillMatrix © 2026</span>
        <span style={{
          fontFamily:"'Cormorant',serif", fontWeight:600,
          fontSize:"13px", fontStyle:"italic", color:"rgba(28,24,20,.38)",
        }}>Centralising achievement, one student at a time</span>
      </footer>

    </div>
  );
}