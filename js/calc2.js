let M = 50;
let k = 1.0;
let F = 2;

const endTime = 3000; //ms
const stemPerMs = 50;

const massSlider = document.getElementById('massSlider');
const kSlider = document.getElementById('kSlider');
const forceSlider = document.getElementById('forceSlider');

const massValue = document.getElementById('massValue');
const kValue = document.getElementById('kValue');
const forceValue = document.getElementById('forceValue');

function diffVel(t, v) {
    return (F/M) - ((k / 1000)/M) * v**2;
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

function rightHandRiemannSum(xArray, yArray, y0) {
    const resultArray = [y0];
    for (let i = 1; i < xArray.length; i++) {
        const h = xArray[i] - xArray[i - 1];
        const yPrev = resultArray[i - 1];
        const deltaY = h * yArray[i];
        resultArray.push(yPrev + deltaY);
    }
    return resultArray;
}

function trapezoidalIntegral(xArray, yArray, y0) {
    const resultArray = [y0];
    for (let i = 1; i < xArray.length; i++) {
        const h = xArray[i] - xArray[i - 1];
        const xPrev = resultArray[i - 1];
        const avgY = (yArray[i] + yArray[i - 1]) / 2;
        resultArray.push(xPrev + h * avgY);
    }
    return resultArray;
}

function divideArray(array, factor) {
    for (let i = 0; i < array.length; i++) { array[i] *= factor; }
    return array;
}

function updatePlot() {
    M = parseFloat(massSlider.value);
    k = parseFloat(kSlider.value);
    F = parseFloat(forceSlider.value);
    massValue.textContent = M;
    kValue.textContent = k;
    forceValue.textContent = F;
    const XVals = linspace(0, endTime, endTime * stemPerMs);
    const YVals = rungeKutta4(diffVel, XVals, 0.5);
    const integratedVals = trapezoidalIntegral(XVals, YVals, 0.1);
    const mm2mVals = divideArray(integratedVals, 0.001);
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
}
updatePlot();
massSlider.addEventListener('input', updatePlot);
kSlider.addEventListener('input', updatePlot);
forceSlider.addEventListener('input', updatePlot);