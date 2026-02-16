
import React from 'react';

export const IMAGE_STYLES = [
  { id: 'none', name: 'None', prompt: '' },
  { id: 'realistic', name: 'Realistic', prompt: 'hyper-realistic photography, high detail, 8k, photorealistic' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, vibrant colors, cel shaded, Makoto Shinkai aesthetic' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic lighting, dramatic atmosphere, movie still, film grain' },
  { id: '3d', name: '3D Render', prompt: 'octane render, unreal engine 5, 3D modeling, smooth textures, raytracing' },
  { id: 'watercolor', name: 'Watercolor', prompt: 'watercolor painting, soft edges, paper texture, delicate brushstrokes' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk aesthetic, neon lights, rainy streets, futuristic city, glow' },
  { id: 'oil', name: 'Oil Painting', prompt: 'oil on canvas, thick paint, expressive brushwork, classical art style' },
  { id: 'pixel', name: 'Pixel Art', prompt: 'pixel art, 16-bit, retro gaming aesthetic, sharp pixels' }
];

export const ASPECT_RATIOS: { value: string; label: string; icon: string }[] = [
  { value: '1:1', label: '1:1', icon: 'M4 4h16v16H4z' },
  { value: '16:9', label: '16:9', icon: 'M2 6h20v12H2z' },
  { value: '9:16', label: '9:16', icon: 'M6 2h12v20H6z' },
  { value: '4:3', label: '4:3', icon: 'M3 5h18v14H3z' },
  { value: '3:4', label: '3:4', icon: 'M5 3h14v18H5z' },
];

export const IMAGE_SIZES: string[] = ['1K', '2K', '4K'];
