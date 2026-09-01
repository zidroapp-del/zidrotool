# ZidroTool Tool Images

Every tool has a dedicated, deterministic SVG thumbnail in `public/tool-images/`.

- The artwork is language-neutral so the same asset works across EN/FR/DE/ES/IT/AR.
- Tool cards lazy-load the artwork to keep the tools directory fast.
- Tool pages use the same artwork as the Open Graph/Twitter image.
- The artwork is generated from each tool slug/category, so each tool has a stable unique visual without shipping a heavy raster-image bundle.

To add a new tool, run the image generation script used during the release build process or add its SVG using the same naming convention: `public/tool-images/<slug>.svg`.
