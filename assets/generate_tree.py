import math
import random
import os

# ==============================================================================
# AISSH 2026 — NEURAL TREE PARAMETERS
# Edit these values to customize the tree, then run:
#    python3 generate_tree.py
# ==============================================================================

# 1. Stem Length (Base Trunk Height)
# Default was 160.0. Set to lower values (e.g., 75.0) to make the trunk short, 
# or higher values (e.g., 200.0) to make it tall.
STEM_LENGTH = 120.0

# 2. Canopy Spread (Foliage Spacing)
# Controls the length of the final twigs. Higher values (e.g., 0.78 or 0.82) 
# spread the leaves further apart. Lower values (e.g., 0.58) cluster them closer.
LEAF_SPACING = 1

# 3. Output Filename
OUTPUT_FILENAME = "../neural-tree-2.svg"

# ==============================================================================
# GENERATOR LOGIC (Do not modify unless you want to change branch styles)
# ==============================================================================

def generate_tree(filepath, stem_len, leaf_space):
    # Seed for perfectly identical results on each run
    random.seed(2026)
    
    NC = ['#1C0A03','#3A1A08','#5C2E10','#7A4020','#9B6035','#B8844A','#3A7A5A','#52A878','#74C69D']
    EC = [
        'rgba(58,26,8,0.80)',
        'rgba(80,40,15,0.70)',
        'rgba(110,60,25,0.60)',
        'rgba(140,85,40,0.50)',
        'rgba(165,110,60,0.40)',
        'rgba(55,140,90,0.45)',
        'rgba(70,170,110,0.35)',
        'rgba(90,200,140,0.28)'
    ]
    NR = [11, 10, 9, 8, 7, 5.5, 4.5, 3.5, 3]
    
    nodes = []
    edges = []
    
    # Configure variables based on parameters
    depth_configs = {
        0: {'kids': 1, 'spread': 0.0, 'fl': 0.80},
        1: {'kids': 1, 'spread': 0.0, 'fl': 0.80},
        2: {'kids': 2, 'spread': 0.65, 'fl': 0.74},
        3: {'kids': 2, 'spread': 0.70, 'fl': 0.72},
        4: {'kids': 2, 'spread': 0.75, 'fl': 0.72},
        5: {'kids': 3, 'spread': 0.95, 'fl': leaf_space},
        6: {'kids': 3, 'spread': 1.05, 'fl': leaf_space},
    }
        
    def grow(parent_id, x, y, angle, length, depth, max_depth=7):
        node_id = len(nodes)
        nodes.append({
            'id': node_id,
            'x': x,
            'y': y,
            'depth': depth,
            'angle': angle
        })
        
        if parent_id is not None:
            edges.append({
                'from': parent_id,
                'to': node_id,
                'depth': depth - 1
            })
            
        if depth >= max_depth:
            return
            
        cfg = depth_configs.get(depth, {'kids': 2, 'spread': 0.65, 'fl': 0.70})
        kids = cfg['kids']
        spread = cfg['spread']
        fl = cfg['fl']
            
        for i in range(kids):
            if kids == 1:
                t = 0.0
            else:
                t = (i / (kids - 1)) - 0.5
                
            angle_diff = spread * t
            
            bias = 0.0
            if depth >= 3:
                norm_angle = angle + math.pi/2
                bias = norm_angle * 0.15
                
            jitter = random.uniform(-0.05, 0.05)
            a = angle + angle_diff + bias + jitter
            
            l = length * fl * random.uniform(0.95, 1.05)
            
            nx = x + math.cos(a) * l
            ny = y + math.sin(a) * l
            
            grow(node_id, nx, ny, a, l, depth + 1, max_depth)
            
    # Place root at base
    grow(None, 400.0, 730.0, -math.pi / 2, stem_len, 0, 7)
    
    # Calculate bounding box of all generated nodes to crop the SVG viewBox perfectly
    xs = [node['x'] for node in nodes]
    ys = [node['y'] for node in nodes]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    # Add safe padding to accommodate leaf radius (NR) + soft blur glow
    padding = 15.0
    view_x = min_x - padding
    view_y = min_y - padding
    view_w = (max_x - min_x) + 2 * padding
    view_h = (max_y - min_y) + 2 * padding
    
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_x:.2f} {view_y:.2f} {view_w:.2f} {view_h:.2f}" width="100%" height="100%">')
    svg.append('  <defs>')
    svg.append('    <filter id="leaf-glow" x="-500%" y="-500%" width="1100%" height="1100%">')
    svg.append('      <feGaussianBlur stdDeviation="6" result="blur" />')
    svg.append('      <feComponentTransfer in="blur" result="boost">')
    svg.append('        <feFuncA type="linear" slope="1.4"/>')
    svg.append('      </feComponentTransfer>')
    svg.append('    </filter>')
    svg.append('  </defs>')
    
    svg.append('  <!-- Branches -->')
    svg.append('  <g id="branches">')
    for edge in edges:
        n1 = nodes[edge['from']]
        n2 = nodes[edge['to']]
        depth = edge['depth']
        
        dist = math.hypot(n2['x'] - n1['x'], n2['y'] - n1['y'])
        
        cx1 = n1['x'] + math.cos(n1['angle']) * (dist * 0.35)
        cy1 = n1['y'] + math.sin(n1['angle']) * (dist * 0.35)
        
        cx2 = n2['x'] - math.cos(n2['angle']) * (dist * 0.35)
        cy2 = n2['y'] - math.sin(n2['angle']) * (dist * 0.35)
        
        width = max(0.6, 5.2 - depth * 0.6)
        color = EC[min(depth, len(EC)-1)]
        
        path_d = f"M {n1['x']:.2f},{n1['y']:.2f} C {cx1:.2f},{cy1:.2f} {cx2:.2f},{cy2:.2f} {n2['x']:.2f},{n2['y']:.2f}"
        svg.append(f'    <path d="{path_d}" stroke="{color}" stroke-width="{width:.2f}" stroke-linecap="round" fill="none" />')
    svg.append('  </g>')
    
    svg.append('  <!-- Nodes -->')
    svg.append('  <g id="nodes">')
    # 1. Draw soft blurred leaf glows underneath
    for node in nodes:
        depth = node['depth']
        if depth >= 6:
            r = NR[min(depth, len(NR)-1)]
            # Use soft emerald glow color matching tree.js
            color = "#74C69D"
            svg.append(f'    <circle cx="{node["x"]:.2f}" cy="{node["y"]:.2f}" r="{r:.2f}" fill="{color}" filter="url(#leaf-glow)" opacity="0.80" />')
            
    # 2. Draw perfectly sharp, vector-crisp node circles on top
    for node in nodes:
        depth = node['depth']
        r = NR[min(depth, len(NR)-1)]
        color = NC[min(depth, len(NC)-1)]
        
        is_leaf = depth >= 6
        stroke_color = "rgba(116,198,157,0.35)" if is_leaf else "rgba(255,255,255,0.10)"
        
        svg.append(f'    <circle cx="{node["x"]:.2f}" cy="{node["y"]:.2f}" r="{r:.2f}" fill="{color}" stroke="{stroke_color}" stroke-width="1" />')
    svg.append('  </g>')
    
    svg.append('</svg>')
    
    with open(filepath, 'w') as f:
        f.write('\n'.join(svg))
    print(f"Successfully generated {filepath} (STEM_LENGTH={stem_len}, LEAF_SPACING={leaf_space})")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.abspath(os.path.join(script_dir, OUTPUT_FILENAME))
    generate_tree(target_path, STEM_LENGTH, LEAF_SPACING)
