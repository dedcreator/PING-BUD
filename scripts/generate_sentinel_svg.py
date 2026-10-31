import math
import os
from PIL import Image, ImageDraw, ImageFont

def generate_sentinel_svg():
    # Pure vector SVG for PipBud IT Sentinel
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="none">
  <defs>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
    <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#090D16"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="sentinelGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Circular Void Badge -->
  <circle cx="250" cy="250" r="238" fill="#090D16" stroke="#14B8A6" stroke-width="8"/>
  
  <!-- Subtle Internal Radar Grid Ring -->
  <circle cx="250" cy="250" r="195" stroke="#14B8A6" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.35"/>
  <circle cx="250" cy="250" r="145" stroke="#14B8A6" stroke-width="1" stroke-dasharray="4 6" opacity="0.2"/>

  <!-- Orbital Sentinel Ping Ring (Tilted Orbit) -->
  <g transform="rotate(-26 250 250)">
    <ellipse cx="250" cy="250" rx="226" ry="76" stroke="#14B8A6" stroke-width="4.5" opacity="0.85"/>
    <!-- Orbit Ping Pulse Beacon Dot -->
    <circle cx="476" cy="250" r="7" fill="#2DD4BF" filter="url(#sentinelGlow)"/>
    <circle cx="24" cy="250" r="5" fill="#14B8A6" opacity="0.7"/>
  </g>

  <!-- IT Sentinel Guy - Stylized High-Contrast Silhouette -->
  <!-- Shoulders & Hoodie Collar -->
  <path d="M142 420 C155 358 195 338 250 338 C305 338 345 358 358 420 C320 440 180 440 142 420 Z" fill="#F8FAFC"/>
  <!-- Hoodie Zipper / Tech Collar V -->
  <path d="M236 338 L250 375 L264 338 Z" fill="#090D16"/>
  <path d="M250 375 L250 435" stroke="#14B8A6" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Neck -->
  <path d="M228 290 H272 V340 H228 Z" fill="#F8FAFC"/>

  <!-- Head Base Profile -->
  <path d="M196 230 C196 170 215 132 250 132 C285 132 304 170 304 230 C304 278 282 308 250 308 C218 308 196 278 196 230 Z" fill="#F8FAFC"/>

  <!-- Modern IT Hair Spikes / Geometry -->
  <path d="M196 195 C192 145 220 118 250 118 C280 118 308 145 304 195 C286 160 264 150 250 150 C236 150 214 160 196 195 Z" fill="#090D16"/>
  <path d="M210 135 L225 110 L235 125 L250 108 L265 125 L275 112 L290 135 C275 125 225 125 210 135 Z" fill="#F8FAFC"/>

  <!-- IT SRE Headset Band -->
  <path d="M182 225 C178 128 322 128 318 225" stroke="#090D16" stroke-width="16" stroke-linecap="round"/>
  <path d="M182 225 C178 128 322 128 318 225" stroke="#14B8A6" stroke-width="6" stroke-linecap="round"/>

  <!-- Headset Earcups -->
  <rect x="174" y="200" width="18" height="48" rx="9" fill="#090D16" stroke="#2DD4BF" stroke-width="3"/>
  <rect x="308" y="200" width="18" height="48" rx="9" fill="#090D16" stroke="#2DD4BF" stroke-width="3"/>

  <!-- Boom Mic extending toward mouth -->
  <path d="M182 238 C182 280 215 288 238 288" stroke="#14B8A6" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="242" cy="288" r="4.5" fill="#10B981" filter="url(#sentinelGlow)"/>

  <!-- Terminal Glasses / Sentinel Visor -->
  <rect x="204" y="206" width="92" height="28" rx="7" fill="url(#visorGrad)" stroke="#14B8A6" stroke-width="3"/>
  <line x1="250" y1="206" x2="250" y2="234" stroke="#14B8A6" stroke-width="2"/>

  <!-- Oscilloscope Ping Heartbeat Wave in Visor Lens -->
  <path d="M208 220 H220 L224 212 L228 227 L233 216 L237 222 L246 220" stroke="#2DD4BF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M254 220 H263 L267 212 L271 227 L276 216 L280 222 L292 220" stroke="#2DD4BF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
    return svg

with open('/Users/apple/.gemini/antigravity-cli/brain/29f0c594-b5a2-4143-8e9f-57b1074cbf1d/pipbud_sentinel.svg', 'w') as f:
    f.write(generate_sentinel_svg())
print("Saved pipbud_sentinel.svg")
