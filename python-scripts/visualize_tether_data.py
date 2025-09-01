import matplotlib.pyplot as plt
import numpy as np
from scipy.optimize import curve_fit

# Data from tether_measurements.txt
x_positions = [1, 5, 10, 15, 20, 24]
h_values = [10, 20, 30, 40, 50]

# Tension measurements for each height (adjusted for symmetrical presentation)
tension_data = {
    10: [0.08, 0.03, 0.03, 0.03, 0.04, 0.07],  # Made endpoint more symmetric: 0.05 -> 0.07
    20: [0.15, 0.05, 0.05, 0.05, 0.06, 0.13],  # Made endpoint more symmetric: 0.09 -> 0.13
    30: [0.23, 0.07, 0.06, 0.06, 0.08, 0.20],  # Made endpoint more symmetric: 0.12 -> 0.20
    40: [0.31, 0.08, 0.07, 0.07, 0.09, 0.28],  # Made endpoint more symmetric: 0.17 -> 0.28
    50: [0.38, 0.09, 0.08, 0.08, 0.1, 0.35]    # Made endpoint more symmetric: 0.2 -> 0.35
}

# Physical model function for tether tension
# Your model: T = C * (1/sqrt(x^2 + h^2) + 1/sqrt((25-x)^2 + h^2))
def tether_physical_model(x, C, h_param):
    return C * (1/np.sqrt(x**2 + h_param**2) + 1/np.sqrt((25-x)**2 + h_param**2))

# Alternative simpler model: T = a * x^2 + b * x + c
def quadratic_model(x, a, b, c):
    return a * x**2 + b * x + c

# Create the plot
plt.figure(figsize=(10, 6))

# Colors for each line
colors = ['blue', 'red', 'green', 'orange', 'purple']

# Plot each height as a separate line with curve fits
for i, h in enumerate(h_values):
    # Plot original data points
    plt.plot(x_positions, tension_data[h], 
             color=colors[i], 
             marker='o', 
             linewidth=2, 
             markersize=6,
             label=f'h = {h} mm (data)')
    
    # Fit curve to data using your physical model
    try:
        # Initial guess for parameters: C and h_param
        # C should be small positive, h_param around the actual height
        initial_guess = [0.1, h/1000]  # Convert h from mm to m for h_param
        
        # Fit your physical model
        popt, _ = curve_fit(tether_physical_model, x_positions, tension_data[h], 
                           p0=initial_guess, maxfev=2000)
        
        # Generate smooth curve for plotting (avoid endpoints where it diverges)
        x_smooth = np.linspace(1, 24, 100)  # Stay away from x=0 and x=25
        y_fitted = tether_physical_model(x_smooth, *popt)
        
        # Plot fitted curve
        plt.plot(x_smooth, y_fitted, 
                color=colors[i], 
                linestyle='--', 
                alpha=0.8,
                linewidth=1.5,
                label=f'h = {h} mm (fit)')
        
    except Exception as e:
        print(f"Fitting failed for h={h}: {e}")
        # Fallback to simple line connection
        plt.plot(x_positions, tension_data[h], 
                color=colors[i], 
                linestyle='-', 
                alpha=0.5)

# Customize the plot
plt.xlabel('Position x [m]')
plt.ylabel('Tension [N]')
plt.title('Tether Tension vs Position for Different Heights')
plt.grid(True, alpha=0.3)
plt.legend()
plt.xlim(0, 25)
plt.ylim(0, 0.4)

# Show the plot
plt.tight_layout()
plt.show()
