# Deep Learning Playground

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Technologies](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20JS-yellow.svg)

An interactive, browser-based playground to explore the fundamental concepts of Deep Learning. Visualizing neural networks helps in building an intuitive understanding of how they learn and operate.

**Developed by [Nicolás Seivane](https://github.com/NicolasSeivane)**

---

## 🚀 Interactive Demos

This project features three distinct interactive modules:

### 1. Simple Perceptron (Linear Classification)
Visualize the learning process of a single neuron (Rosenblatt's Perceptron).
- **Goal:** Understand decision boundaries and linear separability.
- **Features:**
    - Step-by-step weight updates.
    - Interactive slider to traverse epochs and iterations.
    - Playground mode to manually adjust $w_1, w_2, b$ and see the decision boundary in real-time.
    - Switch between "Normal vector" and "Origin vector" visualization.

### 2. Multilayer Perceptron (MLP)
Explore complex, non-linear decision boundaries using a feed-forward neural network.
- **Goal:** Solve non-linearly separable problems (like XOR).
- **Features:**
    - Configurable hidden layers and neurons.
    - Toggle between linear and `tanh` activation functions.
    - Real-time heatmaps of the decision surface (`Binary` vs `Continuous` output).
    - Randomize weights to see initialization effects.

### 3. Latent Space Autoencoder
Understand dimensionality reduction and data reconstruction.
- **Goal:** Visualize how an Autoencoder maps high-dimensional data (images) to a 2D latent space and back.
- **Features:**
    - Interactive 2D scatter plot of the latent space.
    - Real-time decoding: Hover or click on the latent space to see the reconstructed image.
    - "Move Mode": Continuously reconstruct images as you move the cursor.

---

## 🛠️ Technologies Used

- **Core**: Vanilla HTML5, CSS3 (Modern Dark/Light Theme), JavaScript (ES6+).
- **Visualization**: [Plotly.js](https://plotly.com/javascript/) for interactive charts and decision surfaces.
- **Machine Learning**: 
  - [TensorFlow.js](https://www.tensorflow.org/js) for running the Autoencoder decoder in the browser.
  - Custom implementations for Perceptrons (Numeric.js).
- **Mathematics**: [MathJax](https://www.mathjax.org/) for rendering equations.

---

## 📂 Project Structure

```text
├── index.html                   # Main landing page & Theory overview
├── simple_perceptron.html       # Simple Perceptron demo interface
├── multilayer_perceptron.html   # MLP Playground demo interface
├── autoencoder.html             # Latent Space decoder demo interface
├── css/
│   ├── global.css               # Shared design system (variables, typography)
│   ├── index.css                # Landing page styles
│   ├── simple_perceptron.css    # Styles for Perceptron demo
│   ├── multilayer_perceptron.css# Styles for MLP demo
│   └── autoencoder.css          # Styles for Autoencoder demo
├── js/
│   ├── simple_perceptron.js     # Logic for Simple Perceptron visualization
│   ├── simple_perceptron_data.js# Datasets for Simple Perceptron
│   ├── multilayer_perceptron.js # Logic for MLP (TensorFlow/Numeric)
│   └── autoencoder.js           # Logic for Latent Space decoding
└── assets/                      # Static assets (JSON models, images)
```

## 📖 Key Concepts

- **Linear vs. Non-Linear**: Witness why a single neuron fails at XOR but an MLP succeeds.
- **Activation Functions**: See the difference between a linear collapse and the expressivity of `tanh`.
- **Latent Space**: Experience how a neural network "organizes" data conceptually in a compressed space.

## 🏁 Getting Started

No installation required! This is a client-side application.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NicolasSeivane/Depp-Learning.git
   ```
2. **Open directly:**
   Navigate to the folder and open `index.html` in Chrome, Firefox, or Edge.

_Note: For the best experience with the Autoencoder (loading JSON models), use a local server (like `npx serve` or VS Code Live Server) to avoid CORS issues with local file fetching._

---

© 2025 Nicolás Seivane.