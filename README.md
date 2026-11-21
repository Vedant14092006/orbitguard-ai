# ORBITGUARD AI 🛰️
### Real-Time Space Domain Awareness, Collision Prevention & Space Sustainability Platform

[![Built with React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-cyan.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**ORBITGUARD AI** is an aerospace-grade space domain awareness (SDA) and orbital safety platform designed to monitor satellites, track space debris, analyze conjunction collision risks in real time, and evaluate space sustainability.

Built with **React 19, TypeScript, Three.js, satellite.js (SGP4 propagator), Tailwind CSS, and Vite**, ORBITGUARD AI brings military/civilian flight operations center capabilities directly to the browser at 60 FPS.

---

## 🚀 Key Modules & Capabilities

### 1. Interactive 3D Orbital Tracker (`/tracker`)
- **Realistic 3D Earth Cockpit**: High-resolution procedural Earth surface map, independent rotating cloud sphere, dual-layer atmospheric Rayleigh scattering glow, and starfield.
- **3D Spacecraft & Satellite Models**: Individual 3D meshes with solar panel arrays, pulsating status rings, and realistic Keplerian/SGP4 orbits.
- **Dynamic Space Debris Swarms**: Red (breakup fragments), orange (spent rocket bodies), and white (lethal trackable shrapnel) debris particles dynamically propagated in LEO, MEO, and GEO belts.
- **Curved Orbital Paths & Laser Conjunction Tether**: Curved trajectory lines and a pulsing red vector tether linking close-approach conjunction pairs.
- **Time Controller**: Speed controls ($0.5\times, 1\times, 5\times, 10\times, 50\times, 100\times$), pause/resume, and elapsed mission clock.

### 2. Space Debris Explorer (`/debris`)
- Searchable and filterable catalog of orbital debris by altitude band (VLEO, LEO, MEO, GEO), radar cross-section (RCS), and object type (rocket bodies, fragmentation debris, defunct satellites).
- **Active Debris Removal (ADR) Calculator**: Liou-Johnson criteria evaluation, fuel expenditure estimation ($\Delta V$), priority scoring ($/100$), and capture method planning (robotic arm, net, harpoon).
- **NASA ODPO Breakup Registry**: Historical fragmentation event database (Cosmos-2251, Fengyun-1C, Cosmos-1408) with the NASA Standard Breakup Model formula.

### 3. AI-Powered Collision Risk Analyzer (`/collision-risk`)
- **Conjunction Data Message (CDM) Engine**: Ingests close approaches, computes miss distance ($<140\text{ m}$), relative velocity ($14.8\text{ km/s}$), and collision probability ($P_c$).
- **Visual Risk Gauges**: Analog miss distance danger scale, logarithmic $P_c$ meter, and 3D encounter geometry visualization.
- **Avoidance Maneuver Planner**: Evaluates simulated prograde/retrograde thruster burns ($\Delta V = +0.18\text{ m/s}$), calculating post-burn miss distance expansion ($>4.2\text{ km}$).

### 4. Satellite Safety Monitoring Console (`/satellites`)
- Fleet management dashboard monitoring operational status, orbital altitude, period, inclination, and debris exposure level.
- Multi-tab inspection console: Spacecraft Health & Telemetry, Historical Collision Warnings, and Orbital Coordinates.
- One-click transitions to track spacecraft in 3D WebGL or inspect sustainability scorecards.

### 5. Space Sustainability Analytics (`/sustainability`)
- **Space Sustainability Rating (SSR)** scoring system (0–100) evaluating orbital congestion, end-of-life disposal, debris generation risk, and mitigation guideline compliance (IADC 25-Year, FCC 5-Year, ESA Zero Debris 2030).
- Side-by-side mission sustainability comparison engine and global operator leaderboard.
- Educational reference section on the Future of Sustainable Space and Kessler syndrome prevention.

### 6. ASTRA AI Space Assistant (`/ai-assistant`)
- Conversational aerospace assistant equipped with live telemetry context, collision risk summaries, and deorbit recommendations.
- Integrated with Google Gemini API via secure backend environment variables, featuring a fallback expert aerospace knowledge engine.

### 7. Real-World Space Data Pipeline
- **CelesTrak Integration**: Fetches publicly accessible General Perturbations (GP) Two-Line Element (TLE) data with SGP4 propagation.
- **NASA Open APIs & Space Weather**: Real-time solar radio flux ($F_{10.7}$) and planetary geomagnetic $K_p$-index determining thermospheric atmospheric drag.
- **Data Provenance HUD**: Dedicated modal outlining observation provenance, TLE epochs, and simulation transparency policies.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **3D Graphics & Physics**: [Three.js](https://threejs.org/) + [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4/SDP4 propagator)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Web Audio API Procedural Synthesizer

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Vedant14092006/orbitguard-ai.git
cd orbitguard-ai

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
# Type check and build bundle
npm run build

# Preview production build
npm run preview
```

---

## 🔒 Environment Variables (Optional)

To enable live LLM capabilities with ASTRA AI:

```env
VITE_GEMINI_API_KEY="your-gemini-api-key"
```

*Note: If no API key is provided, ORBITGUARD AI automatically operates with the embedded offline aerospace knowledge base.*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
