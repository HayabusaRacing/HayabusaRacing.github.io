let M = 50;
let k = 1.0;
let F = 2;
let t_c = 1500;

const endTime = 3000; //ms
const stepPerMs = 50;
const t_0Factor = 0.2;

const massSlider = document.getElementById('massSlider');
const kSlider = document.getElementById('kSlider');
const forceSlider = document.getElementById('forceSlider');
const cutOffSlider = document.getElementById('cutOffSlider');

const massValue = document.getElementById('massValue');
const kValue = document.getElementById('kValue');
const forceValue = document.getElementById('forceValue');
const cutOffValue = document.getElementById('cutOffValue');

function diffVelBefore(x, y) {
    return (F/M) - ((k / 1000)/M) * y**2;
}

function diffVelAfter(x, y) {
    let t_0 = t_c * t_0Factor;
    return (F/M) * ((Math.sqrt(t_0 / (x - t_c + t_0)))**3) - ((k / 1000)/M) * y**2;
}

function linspace(start, stop, num) {
    const arr = [];
    const step = (stop - start) / (num - 1);
    for (let i = 0; i < num; i++) {
        arr.push(start + step * i);
    }
    return arr;
}

function eulerMethod(f, xArray, y0) {
    const yArray = [y0];
    for (let i = 1; i < xArray.length; i++) {
        const h = xArray[i] - xArray[i - 1];
        const yPrev = yArray[i - 1];
        const xPrev = xArray[i - 1];
        const yNext = yPrev + h * f(xPrev, yPrev);
        yArray.push(yNext);
    }
    return yArray;
}

function rungeKutta4(f, xArray, y0) {
    const yArray = [y0];
    for (let i = 1; i < xArray.length; i++) {
        const h = xArray[i] - xArray[i - 1];
        const xPrev = xArray[i - 1];
        const yPrev = yArray[i - 1];

        const k1 = f(xPrev, yPrev);
        const k2 = f(xPrev + h / 2, yPrev + (h / 2) * k1);
        const k3 = f(xPrev + h / 2, yPrev + (h / 2) * k2);
        const k4 = f(xPrev + h, yPrev + h * k3);

        const yNext = yPrev + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        yArray.push(yNext);
    }
    return yArray;
}

function updatePlot() {
    M = parseFloat(massSlider.value);
    k = parseFloat(kSlider.value);
    F = parseFloat(forceSlider.value);
    t_c = parseFloat(cutOffSlider.value);
    massValue.textContent = M;
    kValue.textContent = k;
    forceValue.textContent = F;
    cutOffValue.textContent = t_c;
    const firstXVals = linspace(0, t_c, t_c * stepPerMs);
    const secondXVals = linspace(t_c, endTime, (endTime - t_c) * stepPerMs);
    const firstYVals = rungeKutta4(diffVelBefore, firstXVals, 0.0);
    const secondYVals = rungeKutta4(diffVelAfter, secondXVals, firstYVals[firstYVals.length - 1]);
    const XVals = firstXVals.concat(secondXVals);
    const YVals = firstYVals.concat(secondYVals);
    const trace = {
        x: XVals,
        y: YVals,
        mode: 'lines',
        name: 'v-t',
        line: { color: '#017fc0' }
    };
    const layout = {
        title: 'v-t with cutoff force applied',
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
massSlider.addEventListener('input', updatePlot);
kSlider.addEventListener('input', updatePlot);
forceSlider.addEventListener('input', updatePlot);
cutOffSlider.addEventListener('input', updatePlot);