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

function trapezoidalIntegral(xArray, yArray, initialValue = 0) {
    const resultArray = [initialValue];
    for (let i = 1; i < xArray.length; i++) {
        const h = xArray[i] - xArray[i - 1];
        const prevIntegral = resultArray[i - 1];
        const avgY = (yArray[i] + yArray[i - 1]) / 2;
        resultArray.push(prevIntegral + h * avgY);
    }
    return resultArray;
}

function multiplyArray(array, factor) {
    for (let i = 0; i < array.length; i++) { array[i] *= factor; }
    return array;
}

function findXofFirstYValueIndex(xArray, yArray, y) {
    for (let i = 0; i < yArray.length; i++) {
        if (yArray[i] >= y) {
            return xArray[i];
        }
    }
    return -1;
}

function definiteIntegral(f, a, b, n=1000) {
    const xs = linspace(a, b, n + 1);
    const ys = xs.map(x => f(x));
    const result_array = trapezoidalIntegral(xs, ys, 0);
    return result_array[result_array.length - 1];
}