<!-- # React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project. -->

# MUSE Labeling Tool

## Local Build

```bash
npm install
npm run build
```

## Docker Deploy

<!-- ```bash
# Build image
docker build -t muse-labeling .

# Run
docker run -p 443:443 muse-labeling
``` -->

```bash
docker run -p 443:443 afaifai/muse-labeling:lastet
```

Open Chrome and go to `https://localhost`

## Usage

1. Click **Open Folder** and select your `my_output_frames/` directory
2. Use **← →** to navigate frames
3. Click a box on the camera image to select and adjust coordinates
4. Click a cluster centroid **✕** to label it as Object / Pair / Noise
5. Press **Ctrl+S** to save