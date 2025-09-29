# eda_gaze_jsonl_fft.py
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# === Load JSONL ===
path = Path("/Users/racheleasen/Code/sandbox/iris_webapp/data/events.jsonl")
records = []
with open(path) as f:
    for line in f:
        if line.strip():
            records.append(json.loads(line))

df = pd.DataFrame(records)

# Convert timestamp to datetime if needed
df["time"] = pd.to_datetime(df["t"], unit="s")

print("=== Basic Info ===")
print(df.info())
print("\n=== Head ===")
print(df.head())

# === Summary stats ===
print("\n=== Summary Stats ===")
print(df.describe())

sns.set(style="whitegrid")

# -----------------------
# Time-domain exploration
# -----------------------

# 1. Time series of x,y,z
fig, axes = plt.subplots(3, 1, figsize=(12, 8), sharex=True)
axes[0].plot(df["time"], df["x"], label="x")
axes[1].plot(df["time"], df["y"], label="y", color="orange")
axes[2].plot(df["time"], df["z"], label="z", color="green")
for ax in axes: ax.legend()
plt.suptitle("Gaze Offsets Over Time")
plt.show()

# 2. Scatter of gaze (x vs y)
plt.figure(figsize=(6,6))
sns.scatterplot(data=df, x="x", y="y", hue="radius", palette="viridis", s=10)
plt.axhline(0, color="gray", ls="--")
plt.axvline(0, color="gray", ls="--")
plt.title("Gaze Scatter (x vs y)")
plt.show()

# 3. Distribution of theta_deg
plt.figure(figsize=(8,4))
sns.histplot(df["theta_deg"], bins=60, kde=True)
plt.title("Distribution of Theta (deg)")
plt.show()

# 4. Radius over time
plt.figure(figsize=(10,4))
plt.plot(df["time"], df["radius"])
plt.title("Radius Over Time")
plt.show()

# -----------------------
# Frequency-domain exploration
# -----------------------

def plot_fft(signal, label, sample_rate=None):
    """
    Compute FFT of a 1D signal.
    If sample_rate is not given, estimate from timestamps.
    """
    n = len(signal)
    if sample_rate is None:
        # estimate sampling frequency from median delta
        dt = np.median(np.diff(df["t"]))  # original time in seconds
        sample_rate = 1.0 / dt

    freqs = np.fft.rfftfreq(n, d=1/sample_rate)
    fft_vals = np.fft.rfft(signal - np.mean(signal))  # remove DC offset

    plt.figure(figsize=(10,4))
    plt.plot(freqs, np.abs(fft_vals))
    plt.title(f"FFT Spectrum of {label}")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude")
    plt.xlim(0, sample_rate/2)  # Nyquist
    plt.show()

# Run FFT analysis for x, y, z, and magnitude
plot_fft(df["x"].to_numpy(), "x")
plot_fft(df["y"].to_numpy(), "y")
plot_fft(df["z"].to_numpy(), "z")
plot_fft(df["xyz_magnitude"].to_numpy(), "‖xyz‖ (magnitude)")

from scipy.signal import spectrogram

f, t, Sxx = spectrogram(df["xyz_magnitude"], fs=1.0 / dt, nperseg=256)
plt.pcolormesh(t, f, 10*np.log10(Sxx), shading="gouraud")
plt.ylabel("Frequency [Hz]")
plt.xlabel("Time [s]")
plt.title("Spectrogram of gaze magnitude")
plt.colorbar(label="Power (dB)")
plt.show()

