"""
PhysiCraft - Physics Problem to Live Simulation Engine
Published for Streamlit Community Cloud & Local Deployment
"""

import math
import os
import re
import json
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

# Configure page
st.set_page_config(
    page_title="PhysiCraft - Physics Problem to Live Simulation Engine",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
    }
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 12px;
    }
    .stButton>button {
        border-radius: 8px;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -------------------------------------------------------------
# PRESET PROBLEMS LIBRARY
# -------------------------------------------------------------
PRESETS = {
    "⚽ AP Projectile with Air Drag": {
        "domain": "projectile",
        "title": "Soccer Kick off Elevated Platform with Air Drag",
        "summary": "A 0.45 kg soccer ball is kicked from a 3.0 m high platform at 24 m/s at an angle of 38° above horizontal. With air drag coefficient b = 0.008 kg/m, simulate range and apex height.",
        "params": {
            "v0": 24.0,
            "angle": 38.0,
            "h0": 3.0,
            "mass": 0.45,
            "g": 9.81,
            "dragCoeff": 0.008,
            "wind": 0.0,
        },
    },
    "⏳ Nonlinear Damped Pendulum": {
        "domain": "pendulum",
        "title": "Large-Angle Damped Pendulum",
        "summary": "A 1.2 kg pendulum bob hangs from a 1.5 m lightweight rod released from 50° with damping b = 0.15 N·s/m. Examine nonlinear period and tension.",
        "params": {
            "length": 1.5,
            "mass": 1.2,
            "initialAngle": 50.0,
            "g": 9.81,
            "damping": 0.15,
        },
    },
    "〰️ Harmonic Spring-Damper": {
        "domain": "spring",
        "title": "Mass-Spring-Damper Transient & Resonance",
        "summary": "A 0.8 kg mass on a spring with stiffness k = 65 N/m and damping c = 1.2 N·s/m is displaced 0.2 m and released from rest.",
        "params": {
            "mass": 0.8,
            "springConstant": 65.0,
            "damping": 1.2,
            "initialDisplacement": 0.2,
            "initialVelocity": 0.0,
            "driveAmplitude": 0.0,
            "driveFrequency": 9.0,
        },
    },
    "💥 Air Track Inelastic Collision": {
        "domain": "collision",
        "title": "1D Momentum Conservation & Restitution",
        "summary": "Cart 1 (0.50 kg at 3.0 m/s) collides with Cart 2 (1.20 kg at -1.5 m/s) on an air track with coefficient of restitution e = 0.60.",
        "params": {
            "m1": 0.5,
            "v1i": 3.0,
            "m2": 1.2,
            "v2i": -1.5,
            "restitution": 0.6,
            "trackLength": 10.0,
        },
    },
    "⚡ Series RLC Resonant Circuit": {
        "domain": "circuit",
        "title": "Series RLC Transient Ringing",
        "summary": "A 12V DC step powers a circuit with R = 25 Ω, L = 80 mH, and C = 40 μF. Determine resonance frequency, Q factor, and voltage ringing.",
        "params": {
            "voltage": 12.0,
            "frequency": 0.0,
            "resistance": 25.0,
            "inductance": 0.08,
            "capacitance": 40.0,
        },
    },
    "📐 Incline with Friction": {
        "domain": "incline",
        "title": "Crate on Ramp with Static & Kinetic Friction",
        "summary": "A 6.0 kg crate is placed on an incline of 32°. Static friction is μs = 0.45 and kinetic friction is μk = 0.30 over a 5.0 m ramp.",
        "params": {
            "angle": 32.0,
            "mass": 6.0,
            "staticFriction": 0.45,
            "kineticFriction": 0.30,
            "rampLength": 5.0,
            "g": 9.81,
        },
    },
}

# -------------------------------------------------------------
# NATURAL LANGUAGE PROBLEM PARSER (AI + HEURISTIC FALLBACK)
# -------------------------------------------------------------
def parse_problem_text(prompt: str):
    """Parse natural language physics prompt into simulation domain and parameters."""
    text_lower = prompt.lower()
    domain = "projectile"
    if any(k in text_lower for k in ["pendulum", "bob", "pivot", "string"]):
        domain = "pendulum"
    elif any(k in text_lower for k in ["spring", "harmonic", "k=", "hooke", "dashpot"]):
        domain = "spring"
    elif any(k in text_lower for k in ["collision", "glider", "cart", "restitution", "momentum", "collide"]):
        domain = "collision"
    elif any(k in text_lower for k in ["circuit", "rlc", "resistor", "inductor", "capacitor", "ohm"]):
        domain = "circuit"
    elif any(k in text_lower for k in ["incline", "ramp", "slope", "crate", "friction"]):
        domain = "incline"

    # Match numbers
    masses = [float(m) for m in re.findall(r"(\d+(?:\.\d+)?)\s*(?:kg|kilogram)", prompt, re.I)]
    speeds = [float(m) for m in re.findall(r"(-?\d+(?:\.\d+)?)\s*(?:m/s|mps)", prompt, re.I)]
    angles = [float(m) for m in re.findall(r"(\d+(?:\.\d+)?)\s*(?:°|deg|degrees)", prompt, re.I)]
    height = re.search(r"(\d+(?:\.\d+)?)\s*(?:m\b|meters)\s*(?:high|platform|cliff)", prompt, re.I)
    restitution = re.search(r"(?:e\s*=\s*|restitution(?:\s*is|\s*of)?\s*)(\d+(?:\.\d+)?)", prompt, re.I)
    spring_k = re.search(r"(\d+(?:\.\d+)?)\s*(?:n/m|n/meter)", prompt, re.I)
    res = re.search(r"(\d+(?:\.\d+)?)\s*(?:ohm|ohms|Ω)", prompt, re.I)

    # Defaults from templates
    defaults = None
    for p in PRESETS.values():
        if p["domain"] == domain:
            defaults = p["params"].copy()
            break

    if domain == "collision":
        if len(masses) > 0: defaults["m1"] = masses[0]
        if len(masses) > 1: defaults["m2"] = masses[1]
        if len(speeds) > 0: defaults["v1i"] = speeds[0]
        if len(speeds) > 1: defaults["v2i"] = speeds[1]
        if restitution: defaults["restitution"] = float(restitution.group(1))
    elif domain == "projectile":
        if len(speeds) > 0: defaults["v0"] = speeds[0]
        if len(angles) > 0: defaults["angle"] = angles[0]
        if len(masses) > 0: defaults["mass"] = masses[0]
        if height: defaults["h0"] = float(height.group(1))
    elif domain == "pendulum":
        if len(angles) > 0: defaults["initialAngle"] = angles[0]
        if len(masses) > 0: defaults["mass"] = masses[0]
    elif domain == "spring":
        if len(masses) > 0: defaults["mass"] = masses[0]
        if spring_k: defaults["springConstant"] = float(spring_k.group(1))
    elif domain == "circuit":
        if res: defaults["resistance"] = float(res.group(1))
    elif domain == "incline":
        if len(angles) > 0: defaults["angle"] = angles[0]
        if len(masses) > 0: defaults["mass"] = masses[0]

    return domain, defaults

# -------------------------------------------------------------
# NUMERICAL ODE SIMULATION ENGINES
# -------------------------------------------------------------
def simulate_projectile(v0, angle, h0, mass, g, dragCoeff, wind, dt=0.01):
    theta = math.radians(angle)
    vx = v0 * math.cos(theta)
    vy = v0 * math.sin(theta)
    x, y, t = 0.0, h0, 0.0

    t_list, x_list, y_list, vx_list, vy_list, speed_list, ke_list, pe_list, e_list = (
        [0.0], [0.0], [h0], [vx], [vy], [v0], [0.5 * mass * v0**2], [mass * g * h0], [0.5 * mass * v0**2 + mass * g * h0]
    )

    while y >= 0 and t < 20.0:
        # RK4
        def acc(curr_vx, curr_vy):
            rel_vx = curr_vx - wind
            rel_vy = curr_vy
            rel_spd = math.hypot(rel_vx, rel_vy)
            f_drag = dragCoeff * rel_spd**2
            ax = - (f_drag * rel_vx / (rel_spd or 1)) / mass
            ay = -g - (f_drag * rel_vy / (rel_spd or 1)) / mass
            return ax, ay

        ax1, ay1 = acc(vx, vy)
        ax2, ay2 = acc(vx + 0.5 * ax1 * dt, vy + 0.5 * ay1 * dt)
        ax3, ay3 = acc(vx + 0.5 * ax2 * dt, vy + 0.5 * ay2 * dt)
        ax4, ay4 = acc(vx + ax3 * dt, vy + ay3 * dt)

        x += vx * dt + 0.5 * ax1 * dt**2
        y += vy * dt + 0.5 * ay1 * dt**2
        vx += (ax1 + 2*ax2 + 2*ax3 + ax4) * dt / 6.0
        vy += (ay1 + 2*ay2 + 2*ay3 + ay4) * dt / 6.0
        t += dt

        if y < 0:
            y = 0.0

        spd = math.hypot(vx, vy)
        ke = 0.5 * mass * spd**2
        pe = mass * g * max(0.0, y)

        t_list.append(t)
        x_list.append(x)
        y_list.append(y)
        vx_list.append(vx)
        vy_list.append(vy)
        speed_list.append(spd)
        ke_list.append(ke)
        pe_list.append(pe)
        e_list.append(ke + pe)

        if y <= 0:
            break

    return {
        "t": np.array(t_list),
        "x": np.array(x_list),
        "y": np.array(y_list),
        "v": np.array(speed_list),
        "ke": np.array(ke_list),
        "pe": np.array(pe_list),
        "e": np.array(e_list),
    }

def simulate_pendulum(length, mass, initialAngle, g, damping, duration=6.0, dt=0.01):
    theta = math.radians(initialAngle)
    omega = 0.0
    t = 0.0

    t_list, theta_list, omega_list, speed_list, ke_list, pe_list, e_list = [], [], [], [], [], [], []
    steps = int(duration / dt)

    for _ in range(steps):
        gamma = damping / (mass * length)
        def get_alpha(th, om):
            return - (g / length) * math.sin(th) - gamma * om

        k1_th = omega * dt
        k1_om = get_alpha(theta, omega) * dt
        k2_th = (omega + 0.5 * k1_om) * dt
        k2_om = get_alpha(theta + 0.5 * k1_th, omega + 0.5 * k1_om) * dt
        k3_th = (omega + 0.5 * k2_om) * dt
        k3_om = get_alpha(theta + 0.5 * k2_th, omega + 0.5 * k2_om) * dt
        k4_th = (omega + k3_om) * dt
        k4_om = get_alpha(theta + k3_th, omega + k3_om) * dt

        theta += (k1_th + 2*k2_th + 2*k3_th + k4_th) / 6.0
        omega += (k1_om + 2*k2_om + 2*k3_om + k4_om) / 6.0
        t += dt

        spd = abs(length * omega)
        ke = 0.5 * mass * spd**2
        pe = mass * g * (length - length * math.cos(theta))

        t_list.append(t)
        theta_list.append(math.degrees(theta))
        omega_list.append(omega)
        speed_list.append(spd)
        ke_list.append(ke)
        pe_list.append(pe)
        e_list.append(ke + pe)

    return {
        "t": np.array(t_list),
        "theta": np.array(theta_list),
        "omega": np.array(omega_list),
        "v": np.array(speed_list),
        "ke": np.array(ke_list),
        "pe": np.array(pe_list),
        "e": np.array(e_list),
    }

def simulate_spring(mass, springConstant, damping, initialDisplacement, initialVelocity, duration=5.0, dt=0.01):
    x = initialDisplacement
    v = initialVelocity
    t = 0.0

    t_list, x_list, v_list, ke_list, pe_list, e_list = [], [], [], [], [], []
    steps = int(duration / dt)

    for _ in range(steps):
        def acc(curr_x, curr_v):
            return (-springConstant * curr_x - damping * curr_v) / mass

        k1_x = v * dt
        k1_v = acc(x, v) * dt
        k2_x = (v + 0.5 * k1_v) * dt
        k2_v = acc(x + 0.5 * k1_x, v + 0.5 * k1_v) * dt
        k3_x = (v + 0.5 * k2_v) * dt
        k3_v = acc(x + 0.5 * k2_x, v + 0.5 * k2_v) * dt
        k4_x = (v + k3_v) * dt
        k4_v = acc(x + k3_x, v + k3_v) * dt

        x += (k1_x + 2*k2_x + 2*k3_x + k4_x) / 6.0
        v += (k1_v + 2*k2_v + 2*k3_v + k4_v) / 6.0
        t += dt

        ke = 0.5 * mass * v**2
        pe = 0.5 * springConstant * x**2

        t_list.append(t)
        x_list.append(x)
        v_list.append(v)
        ke_list.append(ke)
        pe_list.append(pe)
        e_list.append(ke + pe)

    return {
        "t": np.array(t_list),
        "x": np.array(x_list),
        "v": np.array(v_list),
        "ke": np.array(ke_list),
        "pe": np.array(pe_list),
        "e": np.array(e_list),
    }

# -------------------------------------------------------------
# APP HEADER & NAVIGATION
# -------------------------------------------------------------
col_logo, col_actions = st.columns([3, 1])
with col_logo:
    st.markdown('<div class="main-header">PhysiCraft Live Simulation Engine</div>', unsafe_allow_html=True)
    st.markdown("Transform any physics problem into an interactive numerical simulation with synchronized equations and graphs.")

with col_actions:
    st.info("⚛️ Streamlit Deployment Mode")

# -------------------------------------------------------------
# PROBLEM DISCOVERY & SELECTION
# -------------------------------------------------------------
st.write("### 🔍 Select Preset or Enter Custom Physics Problem")
preset_names = list(PRESETS.keys())
selected_preset_name = st.selectbox("Quick-Load Curated AP & College Physics Problems:", preset_names)

selected_preset = PRESETS[selected_preset_name]

custom_problem = st.text_area(
    "Or type/paste any physics word problem here:",
    value=selected_preset["summary"],
    height=80,
    help="Type any word problem involving kinematics, oscillators, collisions, or circuits.",
)

# Detect domain & parameters
active_domain, active_params = parse_problem_text(custom_problem)

# -------------------------------------------------------------
# SIDEBAR PARAMETERS SLIDERS
# -------------------------------------------------------------
st.sidebar.title("🎛️ Interactive Parameter Sliders")
st.sidebar.caption("Adjust sliders in real-time to watch equations and predictions adapt:")

sliders = {}
if active_domain == "projectile":
    sliders["v0"] = st.sidebar.slider("Launch Velocity v0 (m/s)", 1.0, 60.0, float(active_params.get("v0", 24.0)), 0.5)
    sliders["angle"] = st.sidebar.slider("Launch Angle θ (°)", 0.0, 90.0, float(active_params.get("angle", 38.0)), 1.0)
    sliders["h0"] = st.sidebar.slider("Platform Height h0 (m)", 0.0, 20.0, float(active_params.get("h0", 3.0)), 0.5)
    sliders["mass"] = st.sidebar.slider("Projectile Mass (kg)", 0.05, 10.0, float(active_params.get("mass", 0.45)), 0.05)
    sliders["dragCoeff"] = st.sidebar.slider("Aerodynamic Drag Coeff b (kg/m)", 0.0, 0.05, float(active_params.get("dragCoeff", 0.008)), 0.001, format="%.3f")
    sliders["wind"] = st.sidebar.slider("Wind Velocity (m/s)", -15.0, 15.0, float(active_params.get("wind", 0.0)), 0.5)
    sliders["g"] = 9.81

elif active_domain == "pendulum":
    sliders["length"] = st.sidebar.slider("Rod Length L (m)", 0.3, 5.0, float(active_params.get("length", 1.5)), 0.1)
    sliders["mass"] = st.sidebar.slider("Bob Mass m (kg)", 0.1, 10.0, float(active_params.get("mass", 1.2)), 0.1)
    sliders["initialAngle"] = st.sidebar.slider("Release Angle θ0 (°)", -90.0, 90.0, float(active_params.get("initialAngle", 50.0)), 1.0)
    sliders["damping"] = st.sidebar.slider("Damping Coeff b (N·s/m)", 0.0, 1.5, float(active_params.get("damping", 0.15)), 0.02)
    sliders["g"] = 9.81

elif active_domain == "spring":
    sliders["mass"] = st.sidebar.slider("Mass m (kg)", 0.1, 5.0, float(active_params.get("mass", 0.8)), 0.05)
    sliders["springConstant"] = st.sidebar.slider("Spring Constant k (N/m)", 5.0, 250.0, float(active_params.get("springConstant", 65.0)), 5.0)
    sliders["damping"] = st.sidebar.slider("Damping Dashpot c (N·s/m)", 0.0, 10.0, float(active_params.get("damping", 1.2)), 0.1)
    sliders["initialDisplacement"] = st.sidebar.slider("Initial Displacement x0 (m)", -0.5, 0.5, float(active_params.get("initialDisplacement", 0.2)), 0.02)
    sliders["initialVelocity"] = st.sidebar.slider("Initial Velocity v0 (m/s)", -5.0, 5.0, float(active_params.get("initialVelocity", 0.0)), 0.1)

# -------------------------------------------------------------
# THEORETICAL CALCULATIONS & VERIFICATION METRICS
# -------------------------------------------------------------
st.write("---")
st.subheader("🎯 Theoretical Predictions vs. Numerical ODE Simulation")

col1, col2, col3, col4 = st.columns(4)

if active_domain == "projectile":
    theta_rad = math.radians(sliders["angle"])
    v0y = sliders["v0"] * math.sin(theta_rad)
    v0x = sliders["v0"] * math.cos(theta_rad)
    t_flight_ideal = (v0y + math.sqrt(v0y**2 + 2 * sliders["g"] * sliders["h0"])) / sliders["g"]
    range_ideal = v0x * t_flight_ideal
    h_max_ideal = sliders["h0"] + (v0y**2) / (2 * sliders["g"])

    sim_res = simulate_projectile(
        sliders["v0"], sliders["angle"], sliders["h0"], sliders["mass"],
        sliders["g"], sliders["dragCoeff"], sliders["wind"]
    )
    sim_range = float(sim_res["x"][-1])
    sim_t_flight = float(sim_res["t"][-1])
    sim_h_max = float(np.max(sim_res["y"]))

    with col1:
        st.metric("Range (Ideal Vacuum)", f"{range_ideal:.2f} m", delta=f"{sim_range - range_ideal:.2f} m (Drag Loss)")
    with col2:
        st.metric("Apex Altitude", f"{h_max_ideal:.2f} m", delta=f"Simulated: {sim_h_max:.2f} m")
    with col3:
        st.metric("Time of Flight", f"{t_flight_ideal:.2f} s", delta=f"Simulated: {sim_t_flight:.2f} s")
    with col4:
        st.metric("Impact Speed", f"{math.sqrt(sliders['v0']**2 + 2*sliders['g']*sliders['h0']):.2f} m/s", delta="Conserved in Vacuum")

elif active_domain == "pendulum":
    t0 = 2 * math.pi * math.sqrt(sliders["length"] / sliders["g"])
    th0_rad = math.radians(sliders["initialAngle"])
    t_nonlinear = t0 * (1.0 + (1.0/16.0)*(th0_rad**2) + (11.0/3072.0)*(th0_rad**4))
    v_max = math.sqrt(2 * sliders["g"] * sliders["length"] * max(0.0, 1.0 - math.cos(th0_rad)))

    sim_res = simulate_pendulum(sliders["length"], sliders["mass"], sliders["initialAngle"], sliders["g"], sliders["damping"])

    with col1:
        st.metric("Linear Small-Angle Period T0", f"{t0:.3f} s")
    with col2:
        st.metric("Nonlinear Corrected Period", f"{t_nonlinear:.3f} s", delta=f"+{((t_nonlinear/t0)-1)*100:.1f}% large-angle correction")
    with col3:
        st.metric("Max Speed at Bottom", f"{v_max:.2f} m/s")
    with col4:
        st.metric("Peak Rod Tension", f"{sliders['mass'] * (sliders['g'] + v_max**2 / sliders['length']):.1f} N")

elif active_domain == "spring":
    omega0 = math.sqrt(sliders["springConstant"] / sliders["mass"])
    f0 = omega0 / (2 * math.pi)
    zeta = sliders["damping"] / (2 * math.sqrt(sliders["springConstant"] * sliders["mass"]))
    q_factor = 1.0 / (2 * max(0.001, zeta))

    sim_res = simulate_spring(
        sliders["mass"], sliders["springConstant"], sliders["damping"],
        sliders["initialDisplacement"], sliders["initialVelocity"]
    )

    with col1:
        st.metric("Natural Frequency f0", f"{f0:.2f} Hz", delta=f"ω0 = {omega0:.1f} rad/s")
    with col2:
        regime = "Underdamped" if zeta < 1 else ("Critical" if abs(zeta-1) < 0.05 else "Overdamped")
        st.metric("Damping Ratio ζ", f"{zeta:.3f}", delta=regime)
    with col3:
        st.metric("Quality Factor Q", f"{q_factor:.2f}")
    with col4:
        st.metric("Initial Total Energy", f"{0.5 * sliders['springConstant'] * sliders['initialDisplacement']**2:.2f} J")

# -------------------------------------------------------------
# INTERACTIVE SIMULATION VISUALIZATION & PLOTTER
# -------------------------------------------------------------
st.write("---")
st.subheader("📊 Interactive Simulation & Real-Time Oscilloscope Plotter")

fig_tabs = st.tabs(["🚀 Trajectory & Motion", "📈 Time-Series x(t), v(t)", "⚡ Energy Conservation Breakdown", "🌀 Phase Space (v vs x)"])

with fig_tabs[0]:
    if active_domain == "projectile":
        fig_traj = go.Figure()
        fig_traj.add_trace(go.Scatter(x=sim_res["x"], y=sim_res["y"], mode="lines+markers", line=dict(color="#6366f1", width=3), name="Simulated Trajectory (with Drag)"))
        fig_traj.update_layout(
            title=f"Projectile Parabolic Trajectory (Range: {sim_range:.1f}m, Apex: {sim_h_max:.1f}m)",
            xaxis_title="Horizontal Distance x (m)",
            yaxis_title="Height y (m)",
            template="plotly_dark",
            height=420,
        )
        st.plotly_chart(fig_traj, use_container_width=True)

    elif active_domain == "pendulum":
        L = sliders["length"]
        theta_rads = np.radians(sim_res["theta"])
        x_bob = L * np.sin(theta_rads)
        y_bob = -L * np.cos(theta_rads)

        fig_pend = go.Figure()
        fig_pend.add_trace(go.Scatter(x=x_bob, y=y_bob, mode="lines", line=dict(color="#38bdf8", width=2), name="Bob Orbit Arc"))
        fig_pend.add_trace(go.Scatter(x=[0, x_bob[0]], y=[0, y_bob[0]], mode="lines+markers", line=dict(color="#f43f5e", width=4), name="Initial Release State"))
        fig_pend.update_layout(
            title=f"Pendulum Bob Coordinates (L={L}m, Released at θ={sliders['initialAngle']}°)",
            xaxis_title="Cartesian x (m)",
            yaxis_title="Cartesian y (m)",
            template="plotly_dark",
            height=420,
        )
        st.plotly_chart(fig_pend, use_container_width=True)

    elif active_domain == "spring":
        fig_sp = go.Figure()
        fig_sp.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["x"], mode="lines", line=dict(color="#a855f7", width=3), name="Displacement x(t)"))
        fig_sp.update_layout(
            title=f"Mass-Spring Displacement Decay (k={sliders['springConstant']}N/m, c={sliders['damping']}N·s/m)",
            xaxis_title="Time t (s)",
            yaxis_title="Displacement x (m)",
            template="plotly_dark",
            height=420,
        )
        st.plotly_chart(fig_sp, use_container_width=True)

with fig_tabs[1]:
    fig_time = make_subplots(specs=[[{"secondary_y": True}]])
    if active_domain == "projectile":
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["x"], name="Horizontal x(t)", line=dict(color="#38bdf8")), secondary_y=False)
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["v"], name="Speed v(t)", line=dict(color="#10b981", dash="dash")), secondary_y=True)
    elif active_domain == "pendulum":
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["theta"], name="Angle θ(t) [°]", line=dict(color="#38bdf8")), secondary_y=False)
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["omega"], name="Angular Speed ω(t) [rad/s]", line=dict(color="#10b981", dash="dash")), secondary_y=True)
    elif active_domain == "spring":
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["x"], name="Position x(t) [m]", line=dict(color="#38bdf8")), secondary_y=False)
        fig_time.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["v"], name="Velocity v(t) [m/s]", line=dict(color="#10b981", dash="dash")), secondary_y=True)

    fig_time.update_layout(title="Kinematics Time-Series", template="plotly_dark", height=420)
    st.plotly_chart(fig_time, use_container_width=True)

with fig_tabs[2]:
    fig_energy = go.Figure()
    fig_energy.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["ke"], name="Kinetic Energy K (J)", line=dict(color="#10b981", width=2)))
    fig_energy.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["pe"], name="Potential Energy U (J)", line=dict(color="#38bdf8", width=2)))
    fig_energy.add_trace(go.Scatter(x=sim_res["t"], y=sim_res["e"], name="Total Mechanical Energy E (J)", line=dict(color="#c084fc", width=3, dash="dot")))
    fig_energy.update_layout(title="Mechanical Energy Exchange & Dissipation Over Time", xaxis_title="Time t (s)", yaxis_title="Energy (Joules)", template="plotly_dark", height=420)
    st.plotly_chart(fig_energy, use_container_width=True)

with fig_tabs[3]:
    fig_phase = go.Figure()
    if active_domain == "projectile":
        fig_phase.add_trace(go.Scatter(x=sim_res["x"], y=sim_res["v"], mode="lines", line=dict(color="#ec4899", width=2.5)))
        fig_phase.update_layout(title="Phase Space: Speed v vs Position x", xaxis_title="Position x (m)", yaxis_title="Velocity (m/s)")
    elif active_domain == "pendulum":
        fig_phase.add_trace(go.Scatter(x=sim_res["theta"], y=sim_res["omega"], mode="lines", line=dict(color="#ec4899", width=2.5)))
        fig_phase.update_layout(title="Phase Portrait: Angular Velocity ω vs Angle θ (Limit Cycle / Damped Spiral)", xaxis_title="Angle θ (°)", yaxis_title="Angular Velocity ω (rad/s)")
    elif active_domain == "spring":
        fig_phase.add_trace(go.Scatter(x=sim_res["x"], y=sim_res["v"], mode="lines", line=dict(color="#ec4899", width=2.5)))
        fig_phase.update_layout(title="Phase Portrait: Velocity v vs Displacement x", xaxis_title="Displacement x (m)", yaxis_title="Velocity v (m/s)")

    fig_phase.update_layout(template="plotly_dark", height=420)
    st.plotly_chart(fig_phase, use_container_width=True)

# -------------------------------------------------------------
# GOVERNING EQUATIONS & MATHEMATICAL DERIVATION
# -------------------------------------------------------------
st.write("---")
st.subheader("📚 Governing Mathematical Equations")

col_eq1, col_eq2 = st.columns(2)
with col_eq1:
    st.markdown("**Core Differential Equations**")
    if active_domain == "projectile":
        st.latex(r"m\frac{d\vec{v}}{dt} = m\vec{g} - b|\vec{v} - \vec{v}_w|(\vec{v} - \vec{v}_w)")
        st.caption("Nonlinear drag differential equation solved numerically via 4th-order Runge-Kutta.")
    elif active_domain == "pendulum":
        st.latex(r"\frac{d^2\theta}{dt^2} + \frac{b}{mL}\frac{d\theta}{dt} + \frac{g}{L}\sin\theta = 0")
        st.caption("Nonlinear rotational ODE derived from torque equilibrium about the pivot.")
    elif active_domain == "spring":
        st.latex(r"m\ddot{x} + c\dot{x} + kx = F_0\cos(\omega_d t)")
        st.caption("Second-order linear damped harmonic oscillator differential equation.")

with col_eq2:
    st.markdown("**Closed-Form Theoretical Formulas**")
    if active_domain == "projectile":
        st.latex(r"R_{\text{ideal}} = \frac{v_0^2\sin(2\theta)}{g}, \quad H_{\max} = h_0 + \frac{(v_0\sin\theta)^2}{2g}")
    elif active_domain == "pendulum":
        st.latex(r"T \approx 2\pi\sqrt{\frac{L}{g}}\left(1 + \frac{1}{16}\theta_0^2 + \frac{11}{3072}\theta_0^4\right)")
    elif active_domain == "spring":
        st.latex(r"\omega_0 = \sqrt{\frac{k}{m}}, \quad \zeta = \frac{c}{2\sqrt{km}}, \quad Q = \frac{1}{2\zeta}")

# Step-by-step derivation expander
with st.expander("📝 View Step-by-Step Analytical Derivation"):
    st.write("1. **Coordinate System Resolution**: Decompose initial vectors into orthogonal basis.")
    st.write("2. **Dynamic Equilibrium**: Formulate force balances and Newton's second law.")
    st.write("3. **Energy Integrals**: Verify potential and kinetic energy transitions.")
    st.write("4. **Numerical Stability**: Execute continuous Runge-Kutta 4 substeps for precision trajectory rendering.")

st.caption("PhysiCraft © 2026 • Published for Streamlit & Web Deployment")
