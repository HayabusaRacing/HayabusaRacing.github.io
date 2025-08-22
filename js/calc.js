let k_d = 0.00075843;
let k_l = 0.000075843;
let F_0 = 0.001;
let mu_bearing = 0.0;
let d = 0.0;
let L_eff = 1.0;
let I_fw = 1.0;
let I_rw = 1.0;
let m_total = 48.0;
let k_co2 = 0.0;
let r = 14.0;

const endTime = 3000; //ms
const stepPerMs = 10;

const g = 9.81;

function F_thrust(t) {
    return 5.0; //TODO: Implement thrust function
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
    return 2.0; //TODO: Implement tether force function
}

function mass(t) {
    return m_total - k_co2 * definiteIntegral(F_thrust, 0, t);
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

function updatePlot() {
    const XVals = linspace(0, endTime, endTime * stepPerMs);
    const YVals = rungeKutta4(acceleration, XVals, 0.0);
    const trace = {
        x: XVals,
        y: YVals,
        mode: 'lines',
        name: 'v-t',
        line: { color: '#017fc0' }
    };
    const layout = {
        title: 'v-t with constant forces applied',
        xaxis: { title: 't [ms]' },
        yaxis: { title: 'v [m/s]' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: {
            color: 'white'
        },
    };
    Plotly.newPlot('plot', [trace], layout);
}

updatePlot();