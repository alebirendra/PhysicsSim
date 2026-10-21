# PhysiCraft — Physics Problem to Live Simulation Engine

> **Turn any physics problem into an interactive simulation.**  
> *Equations are static, but physics describes systems that change with time, position, and conditions.*

**PhysiCraft** bridges the gap between static textbook equations and dynamic physical intuition. Students, educators, and STEM platforms can input any physics word problem and instantly generate an interactive, real-time numerical simulation equipped with parameter sliders, vector overlays, oscilloscope graphing, and synchronized governing equations.

---

## 🌟 Key Features & Differentiation

- **Natural Language Problem Parsing**:
  - Type or paste arbitrary physics word problems (AP Physics, IB, university mechanics, or circuit analysis).
  - Uses Google Gemini 3.8 (`@google/genai`) to parse scenarios into governing differential equations, boundary conditions, and parameter ranges, backed by an offline heuristic fallback engine.

- **Automated Connection: Equations ⇄ Graphs ⇄ Simulation ⇄ Measurements**:
  - **Live Theoretical Predictions vs. Reality HUD**: Displays closed-form theoretical values (e.g., vacuum range, apex height, time of flight, resonant frequency, quality factor) alongside live numerical integration measurements.
  - **Multi-Trace Oscilloscope & Phase Space**: Plots displacement $x(t)$, velocity $v(t)$, acceleration $a(t)$, kinetic $K(t)$ / potential $U(t)$ / total mechanical energy $E(t)$, and phase space portraits ($v\text{ vs. }x$).
  - **KaTeX-Rendered Equations**: Mathematical equations rendered with KaTeX, displaying both the symbolic law and live evaluation. Hovering highlights the corresponding parameter slider and canvas vector.

- **Interactive 60 FPS Simulation Canvas**:
  - Sub-stepped 4th-order Runge-Kutta (RK4) numerical ODE solvers.
  - Live vector arrows for velocity ($\vec{v}$), acceleration ($\vec{a}$), and forces ($\vec{F}$).
  - Playback scrubber, variable speed controls ($0.25\times$ to $4\times$), and step-by-step frame advancing ($dt = 0.02\,\text{s}$).

- **Classroom & Laboratory Workflow**:
  - **Classroom Presentation Mode**: Clean, high-contrast display designed for school smartboards and projectors.
  - **Printable Lab Report Generator**: Instant PDF/print-ready lab report featuring problem statement, parameter tables, formulas, prediction comparisons, and student reflection space.
  - **Commercial Tiers**: Support for Student Explorer ($0), Educator Pro ($12/mo), and Campus/District ($49/mo) licensing.

---

## 🔬 Core Physics Domains Supported

| Domain | Governing Equations & Physics Principles | Key Parameters |
| :--- | :--- | :--- |
| **Projectile Motion** | $x(t) = v_0\cos\theta\,t$, $y(t) = h_0 + v_0\sin\theta\,t - \frac{1}{2}gt^2$, $m\frac{d\vec{v}}{dt} = m\vec{g} - b\|\vec{v}-\vec{v}_w\|(\vec{v}-\vec{v}_w)$ | Launch speed $v_0$, angle $\theta$, elevation $h_0$, drag $b$, wind $v_w$, gravity $g$ |
| **Nonlinear Pendulum** | $\frac{d^2\theta}{dt^2} + \frac{b}{mL}\frac{d\theta}{dt} + \frac{g}{L}\sin\theta = 0$, $T \approx 2\pi\sqrt{\frac{L}{g}}(1 + \frac{1}{16}\theta_0^2)$ | Length $L$, mass $m$, initial angle $\theta_0$, damping $b$, gravity $g$ |
| **Spring Oscillator** | $m\ddot{x} + c\dot{x} + kx = F_0\cos(\omega_d t)$, $\omega_0 = \sqrt{k/m}$, $\zeta = \frac{c}{2\sqrt{km}}$ | Mass $m$, stiffness $k$, damping $c$, displacement $x_0$, drive $F_0, \omega_d$ |
| **1D Inelastic Collision** | $m_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}$, $v_{2f}-v_{1f} = e(v_{1i}-v_{2i})$, $\Delta K = K_i - K_f$ | Masses $m_1, m_2$, initial speeds $v_{1i}, v_{2i}$, coefficient of restitution $e$ |
| **Series RLC Circuit** | $L\frac{d^2 q}{dt^2} + R\frac{dq}{dt} + \frac{1}{C}q = V(t)$, $f_0 = \frac{1}{2\pi\sqrt{LC}}$, $Q = \frac{1}{R}\sqrt{\frac{L}{C}}$ | Voltage $V_0$, frequency $f$, resistance $R$, inductance $L$, capacitance $C$ |
| **Inclined Plane & Friction** | $a = g(\sin\alpha - \mu_k\cos\alpha)$, $N = mg\cos\alpha$, $\tan\alpha_{\text{crit}} = \mu_s$ | Incline angle $\alpha$, mass $m$, static $\mu_s$, kinetic $\mu_k$, ramp length $L$ |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, KaTeX, Lucide Icons
- **Backend**: Express on Node.js 22, Vite middleware proxy in development
- **AI Integration**: `@google/genai` (Gemini 3.8 Flash model) via secure server-side `/api/solve-physics` endpoint
- **Numerical Integration**: Decoupled pure-math modules using 4th-order Runge-Kutta (RK4)
- **Testing**: Native Node test runner (`node:test`, `tsx --test src/physics/physics.test.ts`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (Node 22 recommended)
- (Optional) `GEMINI_API_KEY` for AI natural language problem solving

### Installation

```bash
git clone <repo-url>
cd react-example
npm install
```

### Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key if you want to use the AI problem-to-simulation generation feature:
```env
GEMINI_API_KEY="your-gemini-api-key"
```
*(Note: If no API key is provided, PhysiCraft automatically uses its built-in heuristic physics solver without interrupting the user experience).*

### Development

Run the full-stack server on port 3000:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests

Execute the pure mathematical and numerical integration test suite:
```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

---

## 🧪 Unit Testing Details

Core physics models are decoupled from UI components in `src/physics/` and verified with deterministic tests:
- Kinematics zero-drag closed-form verification
- RK4 numerical landing accuracy against analytical trajectory
- Small-angle vs. large-angle nonlinear pendulum period corrections
- Mass-spring energy conservation ($\Delta E \approx 0$ in undamped systems)
- Momentum conservation and kinetic energy dissipation in restitution collisions
- Series RLC resonant frequency and quality factor checks
- Inclined plane critical slip angle condition ($\tan\alpha > \mu_s$)

---

## 📄 License

Apache-2.0
