let k_d = 0.00075843;
let k_l = 0.000075843;
let F_0 = 0.01;
let mu_bearing = 0.0;
let d = 0;
let L_eff = 150;
let I_fw = 1231.367;
let I_rw = 1487.893;
let m_total = 77.0;
let k_co2 = 3.7037037037;
let r = 14.0;
let mu_tether = 0.1;
let T = 1.0;
let C = 0.02;

const endTime = 2000; //ms
const stepPerMs = 50;
const thrustDataPath = '../python-scripts/thrust_average.json'; // Path to thrust JSON file

const g = 9.81;

// Global variable to store thrust data
let thrustData = null;

// Load thrust data from JSON file
async function loadThrustData() {
    try {
        const response = await fetch(thrustDataPath);
        const data = await response.json();
        thrustData = data.data; // Extract the data array
        console.log(`Loaded thrust data: ${thrustData.length} points`);
        return thrustData;
    } catch (error) {
        console.error('Error loading thrust data:', error);
        return null;
    }
}

// Linear interpolation function
function interpolate(x0, y0, x1, y1, x) {
    if (x1 === x0) return y0;
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

// Get thrust value at time t (in milliseconds) using direct indexing - O(1)
function getThrustAtTime(t_ms) {
    if (!thrustData || thrustData.length === 0) {
        console.warn('Thrust data not loaded, returning 0');
        return 0.0;
    }
    
    // Calculate index directly since data is at 10ms intervals starting from 0
    const index = Math.floor(t_ms / 10);
    
    // If time is before first data point, return first value
    if (index < 0) {
        return thrustData[0].thrust_N;
    }
    
    // If time is after last data point, return 0 (thrust ended)
    if (index >= thrustData.length) {
        return 0.0;
    }
    
    // If we have exact match or don't need interpolation
    if (index === thrustData.length - 1 || t_ms % 10 === 0) {
        return thrustData[index].thrust_N;
    }
    
    // Linear interpolation between current and next point
    const current = thrustData[index];
    const next = thrustData[index + 1];
    const fraction = (t_ms % 10) / 10; // How far between the two points (0-1)
    
    return current.thrust_N + (next.thrust_N - current.thrust_N) * fraction;
}

// Get integrated thrust value at time t (in milliseconds) using direct indexing - O(1)
function getIntegratedThrustAtTime(t_ms) {
    if (!thrustData || thrustData.length === 0) {
        console.warn('Thrust data not loaded, returning 0');
        return 0.0;
    }
    
    // Calculate index directly since data is at 10ms intervals starting from 0
    const index = Math.floor(t_ms / 10);
    
    // If time is before first data point, return 0
    if (index < 0) {
        return 0.0;
    }
    
    // If time is after last data point, return final integrated value
    if (index >= thrustData.length) {
        return thrustData[thrustData.length - 1].integrated_thrust_Ns;
    }
    
    // If we have exact match or don't need interpolation
    if (index === thrustData.length - 1 || t_ms % 10 === 0) {
        return thrustData[index].integrated_thrust_Ns;
    }
    
    // Linear interpolation between current and next point
    const current = thrustData[index];
    const next = thrustData[index + 1];
    const fraction = (t_ms % 10) / 10; // How far between the two points (0-1)
    
    return current.integrated_thrust_Ns + (next.integrated_thrust_Ns - current.integrated_thrust_Ns) * fraction;
}

function F_thrust(t) {
    return getThrustAtTime(t); // t is in milliseconds
}

function F_drag(t, v) {
    return k_d * v * v;
}

function F_lift(t, v) {
    return k_l * v * v;
}

function F_bearing(t, v) {
    return F_0 + mu_bearing * (mass(t) * g - F_lift(t, v));
}

function F_tether(t) {
    return mu_tether * T * C; //TODO: Implement tether force function
}

function mass(t) {
    // Use pre-integrated thrust data instead of numerical integration
    return m_total - k_co2 * getIntegratedThrustAtTime(t);
}

function I_eq() {
    return 2 * I_fw / (r * r) + 2 * I_rw / (r * r);
}

function eta_tip() {
    return 1 - (d / L_eff);
}

function F_total(t, v) {
    return (F_thrust(t) * eta_tip() - F_drag(t, v) - F_bearing(t, v) - F_tether(t));
}

function acceleration(t, v) {
    return F_total(t, v) / (mass(t) + I_eq());
}

async function updatePlot() {
    // Load thrust data first
    if (!thrustData) {
        await loadThrustData();
    }
    
    const XVals = linspace(0, endTime, endTime * stepPerMs);
    const YVals = rungeKutta4(acceleration, XVals, 0.0);
    
    // Calculate displacement using trapezoidal integration
    const displacementVals = trapezoidalIntegral(XVals, YVals, 0.0);
    // Convert from mm to m (since time is in ms and velocity in m/s)
    const displacementMeters = multiplyArray([...displacementVals], 0.001);
    
    // Calculate ETA at 20m
    const eta20m = findXofFirstYValueIndex(XVals, displacementMeters, 20);
    document.getElementById('eta').textContent = eta20m >= 0 ? eta20m.toFixed(1) : 'Not reached';
    
    // Calculate force performance metrics
    const dt = XVals[1] - XVals[0]; // Time step in ms
    const dtSeconds = dt / 1000; // Convert to seconds
    
    // Calculate force components for each time step
    const thrustForces = [];
    const dragForces = [];
    const bearingForces = [];
    const tetherForces = [];
    const netForces = [];
    const physicalMasses = [];
    const effectiveMasses = [];
    
    // Energy calculations
    let dragEnergy = 0;
    let bearingEnergy = 0;
    let tetherEnergy = 0;
    
    for (let i = 0; i < XVals.length; i++) {
        const t = XVals[i];
        const v = YVals[i];
        
        const thrust = F_thrust(t) * eta_tip();
        const drag = F_drag(t, v);
        const bearing = F_bearing(t, v);
        const tether = F_tether(t);
        const net = F_total(t, v);
        const physicalMass = mass(t);
        const effectiveMass = physicalMass + I_eq();
        
        thrustForces.push(thrust);
        dragForces.push(-drag); // Negative because drag opposes motion
        bearingForces.push(-bearing); // Negative because bearing friction opposes motion
        tetherForces.push(-tether); // Negative because tether opposes motion
        netForces.push(net);
        physicalMasses.push(physicalMass);
        effectiveMasses.push(effectiveMass);
        
        // Calculate energy losses (Work = Force × Distance)
        if (i > 0) {
            const distance = (displacementMeters[i] - displacementMeters[i-1]); // Distance in this step (m)
            dragEnergy += drag * distance;
            bearingEnergy += bearing * distance;
            tetherEnergy += tether * distance;
        }
    }
    
    // Calculate performance metrics
    const maxVelocity = Math.max(...YVals);
    const thrustPeak = Math.max(...thrustForces);
    const dragPeak = Math.max(...dragForces.map(f => Math.abs(f)));
    const dragAtMaxV = k_d * maxVelocity * maxVelocity;
    
    // Find thrust burn duration (when thrust > 0.1N)
    let burnDuration = 0;
    let thrustSum = 0;
    let thrustCount = 0;
    for (let i = 0; i < thrustForces.length; i++) {
        if (thrustForces[i] > 0.1) {
            burnDuration = XVals[i];
            thrustSum += thrustForces[i];
            thrustCount++;
        }
    }
    const thrustAvg = thrustCount > 0 ? thrustSum / thrustCount : 0;
    
    // Get total impulse from JSON data
    const totalImpulse = thrustData && thrustData.length > 0 ? 
        thrustData[thrustData.length - 1].integrated_thrust_Ns : 0;
    
    // Calculate distance impacts (theoretical distance lost due to resistance forces)
    const finalDistance = displacementMeters[displacementMeters.length - 1];
    const bearingImpact = bearingEnergy > 0 ? bearingEnergy / (thrustPeak * 0.5) : 0; // Rough estimate
    const tetherImpact = tetherEnergy > 0 ? tetherEnergy / (thrustPeak * 0.5) : 0; // Rough estimate
    
    // Update performance display
    document.getElementById('thrust-peak').textContent = thrustPeak.toFixed(2);
    document.getElementById('thrust-impulse').textContent = totalImpulse.toFixed(3);
    document.getElementById('thrust-avg').textContent = thrustAvg.toFixed(2);
    
    document.getElementById('drag-peak').textContent = dragPeak.toFixed(3);
    document.getElementById('drag-max-v').textContent = dragAtMaxV.toFixed(3);
    document.getElementById('drag-energy').textContent = dragEnergy.toFixed(3);
    
    document.getElementById('bearing-force').textContent = F_0.toFixed(4);
    document.getElementById('bearing-energy').textContent = bearingEnergy.toFixed(3);
    document.getElementById('bearing-impact').textContent = bearingImpact.toFixed(3);
    
    document.getElementById('tether-force').textContent = F_tether(0).toFixed(3);
    document.getElementById('tether-energy').textContent = tetherEnergy.toFixed(3);
    document.getElementById('tether-impact').textContent = tetherImpact.toFixed(3);
    
    // Velocity plot
    const velocityTrace = {
        x: XVals,
        y: YVals,
        mode: 'lines',
        name: 'Velocity',
        line: { color: '#017fc0', width: 3 }
    };
    
    const velocityLayout = {
        title: 'Vehicle Velocity Profile',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Velocity (m/s)' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: { color: 'white' },
        showlegend: false
    };
    
    // Force plot
    const forceTraces = [
        {
            x: XVals,
            y: thrustForces,
            mode: 'lines',
            name: 'Thrust',
            line: { color: '#00ff00', width: 2 }
        },
        {
            x: XVals,
            y: dragForces,
            mode: 'lines',
            name: 'Drag',
            line: { color: '#ff4444', width: 2 }
        },
        {
            x: XVals,
            y: bearingForces,
            mode: 'lines',
            name: 'Bearing Friction',
            line: { color: '#ffaa00', width: 2 }
        },
        {
            x: XVals,
            y: tetherForces,
            mode: 'lines',
            name: 'Tether',
            line: { color: '#ff00ff', width: 2 }
        },
        {
            x: XVals,
            y: netForces,
            mode: 'lines',
            name: 'Net Force',
            line: { color: '#ffffff', width: 3, dash: 'dash' }
        }
    ];
    
    const forceLayout = {
        title: 'Force Components Analysis',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Force (N)' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: { color: 'white' },
        legend: {
            x: 1,
            y: 1,
            bgcolor: 'rgba(0,0,0,0.5)'
        }
    };
    
    // Displacement plot
    const displacementTrace = {
        x: XVals,
        y: displacementMeters,
        mode: 'lines',
        name: 'Displacement',
        line: { color: '#ff9900', width: 3 }
    };
    
    const displacementLayout = {
        title: 'Vehicle Displacement Profile',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Displacement (m)' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: { color: 'white' },
        showlegend: false,
        shapes: [{
            type: 'line',
            x0: 0,
            x1: endTime,
            y0: 20,
            y1: 20,
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            }
        }],
        annotations: [{
            x: endTime * 0.8,
            y: 18,
            text: '20m Target',
            showarrow: true,
            arrowhead: 2,
            arrowcolor: 'red',
            font: { color: 'red' },
            ay: 30
        }]
    };
    
    // Mass plot
    const massTraces = [
        {
            x: XVals,
            y: physicalMasses,
            mode: 'lines',
            name: 'Physical Mass',
            line: { color: '#00aaff', width: 3 }
        },
        {
            x: XVals,
            y: effectiveMasses,
            mode: 'lines',
            name: 'Effective Mass (incl. rotational inertia)',
            line: { color: '#ff6600', width: 3 }
        }
    ];
    
    const massLayout = {
        title: 'Mass Analysis Over Time',
        xaxis: { title: 'Time (ms)' },
        yaxis: { title: 'Mass (kg)' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: { color: 'white' },
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(0,0,0,0.5)'
        }
    };
    
    // Create all four plots
    Plotly.newPlot('velocity-plot', [velocityTrace], velocityLayout);
    Plotly.newPlot('force-plot', forceTraces, forceLayout);
    Plotly.newPlot('displacement-plot', [displacementTrace], displacementLayout);
    Plotly.newPlot('mass-plot', massTraces, massLayout);
}

// Initialize the plot when page loads
updatePlot();