import math
import matplotlib.pyplot as plt
import numpy as np

T = 19.6
D = 25
L = 0.150
h = 0.003

def f(x):
    return T * h * (1 / (math.sqrt(x ** 2 + h ** 2)) + 1 / (math.sqrt((D - x - L) ** 2 + h ** 2)))

xs = np.linspace(0.0, D - L, 1000)
ys = [f(x) for x in xs]

plt.plot(xs, ys)
plt.xlabel('x [m]')
plt.ylabel('Tension [N]')
plt.title('Tension in the Tether')
plt.ylim(0, 0.1)
plt.grid()
plt.show()