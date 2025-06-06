let M = 50;
let k = 1.0;
let F = 2;

const endTime = 3000; //ms
const stepPerMs = 50;

const massSlider = document.getElementById('massSlider');
const kSlider = document.getElementById('kSlider');
const forceSlider = document.getElementById('forceSlider');

const massValue = document.getElementById('massValue');
const kValue = document.getElementById('kValue');
const forceValue = document.getElementById('forceValue');

const eta = document.getElementById('eta');

function diffVel(t, v) {
    return (F/M) - ((k / 1000)/M) * v**2;
}

function updatePlot() {
    M = parseFloat(massSlider.value);
    k = parseFloat(kSlider.value);
    F = parseFloat(forceSlider.value);
    massValue.textContent = M;
    kValue.textContent = k;
    forceValue.textContent = F;
    const XVals = linspace(0, endTime, endTime * stepPerMs);
    const YVals = rungeKutta4(diffVel, XVals, 0.0);
    const integratedVals = trapezoidalIntegral(XVals, YVals, 0.1);
    const mm2mVals = multiplyArray(integratedVals, 0.001);
    const trace = {
        x: XVals,
        y: mm2mVals,
        mode: 'lines',
        name: 'x-t',
        line: { color: '#017fc0' }
    };
    const layout = {
        title: 'x-t with constant force applied',
        xaxis: { title: 't [ms]' },
        yaxis: { title: 'x [m]' },
        plot_bgcolor: '#13171f',
        paper_bgcolor: '#13171f',
        font: {
            color: 'white'
        },
    };
    Plotly.newPlot('plot', [trace], layout);

    eta.textContent = findXofFirstYValueIndex(XVals, mm2mVals, 20).toFixed(1);
}
updatePlot();
massSlider.addEventListener('input', updatePlot);
kSlider.addEventListener('input', updatePlot);
forceSlider.addEventListener('input', updatePlot);