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

```bash
# Build image
docker build -t muse-labeling .

# Run
docker run -p 443:443 muse-labeling
```

Open Chrome and go to `https://localhost` — click "Advanced" → "Proceed" to bypass the self-signed certificate warning.

## Data Format (`yolo_tracking_data.json`)

```json
{
  "frame_00100.jpeg": {
    "frame_index": 100,
    "source_camera_file": "01779276639.145422.jpeg",
    "detections": [
      {
        "pos1": [780.87, 503.90],
        "pos2": [1408.36, 954.52],
        "label": "car",
        "confidence": 0.866,
        "track_id": 1,
        "thickness": 2
      }
    ],
    "radar_clusters": [
      {
        "track_id": 0,
        "is_confirmed": true,
        "label": "object",
        "centroid": { "range_m": 13.5, "velocity_kmh": -18.2 },
        "points": [
          { "range_m": 13.2, "velocity_kmh": -17.8 }
        ]
      }
    ],
    "track_histories": [
      {
        "track_id": 0,
        "history": [
          { "range_m": 15.2, "velocity_kmh": -18.0 },
          { "range_m": 13.5, "velocity_kmh": -18.2 }
        ]
      }
    ],
    "point_label": {
      "target": {},
      "pair": [],
      "noise": []

    }
  }
}
```

- `detections`: YOLO bounding boxes — `pos1` top-left, `pos2` bottom-right (pixel coordinates)
- `radar_clusters`: DBSCAN clusters — `label` is set by the labeling tool (`object` / `pair` / `noise`)
- `track_histories`: full movement history of confirmed tracks, used to render the Track History plot

## Usage

1. Click **Open Folder** and select your `my_output_frames/` directory
2. Use **← →** to navigate frames
3. Click a box on the camera image to select and adjust coordinates
4. Click a cluster centroid **✕** to label it as Object / Pair / Noise
5. Press **Ctrl+S** to save