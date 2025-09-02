#!/usr/bin/env python3
"""
Thrust Decay Visualization Script
Analyzes and visualizes thrust data from CSV file
Units: Thrust in Newtons, Time index in 10ms intervals
"""

import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import json

def load_thrust_data(filename='thrust.csv'):
    """Load thrust data from CSV file"""
    data = pd.read_csv(filename, header=None, names=['Attempt1', 'Attempt2', 'Attempt3', 'Attempt4', 'Average'])
    return data

def plot_thrust_decay(data):
    """Create thrust decay visualizations"""
    
    # Create time axis (10ms intervals)
    time_ms = np.arange(len(data)) * 10  # Time in milliseconds
    time_s = time_ms / 1000  # Time in seconds
    
    # Set up the plot style
    plt.style.use('seaborn-v0_8' if 'seaborn-v0_8' in plt.style.available else 'default')
    
    # Create figure with 2 subplots (simplified layout)
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    fig.suptitle('Thrust Decay Analysis - Hayabusa Racing', fontsize=16, fontweight='bold')
    
    # Plot 1: All attempts over time
    ax1 = axes[0]
    ax1.plot(time_s, data['Attempt1'], label='Attempt 1', linewidth=2, alpha=0.8)
    ax1.plot(time_s, data['Attempt2'], label='Attempt 2', linewidth=2, alpha=0.8)
    ax1.plot(time_s, data['Attempt3'], label='Attempt 3', linewidth=2, alpha=0.8)
    ax1.plot(time_s, data['Attempt4'], label='Attempt 4', linewidth=2, alpha=0.8)
    ax1.plot(time_s, data['Average'], label='Average', linewidth=3, color='black', linestyle='--')
    ax1.set_title('Thrust vs Time - All Attempts')
    ax1.set_xlabel('Time (seconds)')
    ax1.set_ylabel('Thrust (Newtons)')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Plot 2: Average thrust with uncertainty band
    ax2 = axes[1]
    std_dev = data[['Attempt1', 'Attempt2', 'Attempt3', 'Attempt4']].std(axis=1)
    ax2.plot(time_s, data['Average'], linewidth=3, color='red', label='Average Thrust')
    ax2.fill_between(time_s, 
                     data['Average'] - std_dev, 
                     data['Average'] + std_dev, 
                     alpha=0.3, color='red', label='±1 Standard Deviation')
    ax2.set_title('Average Thrust with Uncertainty')
    ax2.set_xlabel('Time (seconds)')
    ax2.set_ylabel('Thrust (Newtons)')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig

def save_average_to_json(data, filename='thrust_average.json'):
    """Save average thrust values and integrated thrust to JSON file"""
    # Create time axis in milliseconds
    time_ms = (np.arange(len(data)) * 10).tolist()
    
    # Calculate cumulative integral of thrust (using trapezoidal rule)
    thrust_values = data['Average'].values
    dt = 0.01  # 10ms in seconds
    
    # Compute cumulative integral using trapezoidal rule
    integrated_thrust = [0.0]  # Start with 0 at t=0
    for i in range(1, len(thrust_values)):
        # Trapezoidal rule: (f(i-1) + f(i)) * dt / 2
        integral_step = (thrust_values[i-1] + thrust_values[i]) * dt / 2
        integrated_thrust.append(integrated_thrust[-1] + integral_step)
    
    # Create data structure
    json_data = {
        "description": "Thrust decay data with integrated values - Hayabusa Racing",
        "units": {
            "time": "milliseconds",
            "thrust": "Newtons",
            "integrated_thrust": "Newton-seconds (impulse)"
        },
        "sampling_rate": "10ms intervals",
        "total_duration_ms": time_ms[-1] if time_ms else 0,
        "total_impulse": integrated_thrust[-1] if integrated_thrust else 0,
        "data": [
            {
                "time_ms": time_ms[i],
                "thrust_N": float(data['Average'].iloc[i]),
                "integrated_thrust_Ns": float(integrated_thrust[i])
            }
            for i in range(len(data))
        ]
    }
    
    # Save to file
    with open(filename, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    return json_data

def print_statistics(data):
    """Print key statistics about the thrust data"""
    print("\n" + "="*50)
    print("THRUST DECAY ANALYSIS SUMMARY")
    print("="*50)
    
    total_time_s = (len(data) - 1) * 0.01  # 10ms intervals
    print(f"Total samples: {len(data)}")
    print(f"Total duration: {total_time_s:.2f} seconds")
    print(f"Peak average thrust: {data['Average'].max():.4f} N")
    print(f"Final average thrust: {data['Average'].iloc[-1]:.4f} N")
    print(f"Total thrust decay: {data['Average'].max() - data['Average'].iloc[-1]:.4f} N")
    
    # Find 50% decay point
    peak_thrust = data['Average'].max()
    half_thrust = peak_thrust * 0.5
    try:
        decay_50_idx = data[data['Average'] <= half_thrust].index[0]
        decay_50_time = decay_50_idx * 0.01
        print(f"50% decay reached at: {decay_50_time:.2f} seconds (sample {decay_50_idx})")
    except IndexError:
        print("50% decay not reached in dataset")
    
    print(f"\nAttempt Statistics (Newtons):")
    for attempt in ['Attempt1', 'Attempt2', 'Attempt3', 'Attempt4']:
        print(f"{attempt}: Max={data[attempt].max():.4f}, Min={data[attempt].min():.4f}, "
              f"Mean={data[attempt].mean():.4f}")
    
    print("="*50)

def main():
    """Main function to run the analysis"""
    try:
        # Load the data
        print("Loading thrust data...")
        data = load_thrust_data()
        
        # Print statistics
        print_statistics(data)
        
        # Save average data to JSON
        print("\nSaving average thrust data to JSON...")
        json_data = save_average_to_json(data)
        print("JSON data saved as: thrust_average.json")
        
        # Create visualizations
        print("Creating visualizations...")
        fig = plot_thrust_decay(data)
        
        # Save the plot
        output_filename = 'thrust_decay_analysis.png'
        plt.savefig(output_filename, dpi=300, bbox_inches='tight')
        print(f"Plot saved as: {output_filename}")
        
        # Show the plot
        plt.show()
        
    except FileNotFoundError:
        print("Error: thrust.csv file not found in current directory")
        print("Make sure you're running this script from the python-scripts directory")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
