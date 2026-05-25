/**
 * NETEK — PLANTAS 2D & 3D PROFISSIONAL
 * 2D: Canvas API nativo
 * 3D: Three.js com navegação interativa (orbit, walk-through, first-person)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

/* ─── Tipos ─── */
interface Wall { x1:number; y1:number; x2:number; y2:number; thickness:number; color?:string; }
interface Furniture { type:string; x:number; y:number; w:number; h:number; rotation:number; emoji:string; label:string; color?:string; }

const GRID = 20;
const SCALE3D = 0.05; // converter pixels canvas → unidades 3D

const FURNITURE_CATALOG = [
  { type:'bed_single',  emoji:'🛏️', label:'Cama Solteiro', w:4, h:6, color3d:'#6366f1' },
  { type:'bed_double',  emoji:'🛏️', label:'Cama Casal',    w:6, h:7, color3d:'#818cf8' },
  { type:'sofa',        emoji:'🛋️', label:'Sofá',          w:7, h:3, color3d:'#a78bfa' },
  { type:'table_dining',emoji:'🍽️', label:'Mesa Jantar',   w:5, h:3, color3d:'#92400e' },
  { type:'table_desk',  emoji:'💻', label:'Secretária',    w:4, h:2, color3d:'#78350f' },
  { type:'chair',       emoji:'🪑', label:'Cadeira',       w:2, h:2, color3d:'#b45309' },
  { type:'wardrobe',    emoji:'🗄️', label:'Guarda-roupa',  w:4, h:2, color3d:'#451a03' },
  { type:'toilet',      emoji:'🚽', label:'Sanita',        w:2, h:2, color3d:'#e2e8f0' },
  { type:'shower',      emoji:'🚿', label:'Chuveiro',      w:3, h:3, color3d:'#bae6fd' },
  { type:'sink',        emoji:'🚰', label:'Lavatório',     w:2, h:2, color3d:'#f0f9ff' },
  { type:'stove',       emoji:'🍳', label:'Fogão',         w:3, h:2, color3d:'#1e293b' },
  { type:'fridge',      emoji:'🧊', label:'Frigorífico',   w:2, h:3, color3d:'#94a3b8' },
  { type:'tv',          emoji:'📺', label:'TV',            w:4, h:1, color3d:'#0f172a' },
  { type:'door',        emoji:'🚪', label:'Porta',         w:3, h:1, color3d:'#7c2d12' },
  { type:'window',      emoji:'🪟', label:'Janela',        w:4, h:1, color3d:'#7dd3fc' },
];

/* ═══════════════════════════════════════════════════════════
   THREE.JS 3D VIEWER — INTERATIVO COM NAVEGAÇÃO
═══════════════════════════════════════════════════════════ */

function ThreeViewer({ walls, furniture, roomW, roomH }: { walls: Wall[]; furniture: Furniture[]; roomW: number; roomH: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; animId: number } | null>(null);
  const [camMode, setCamMode] = useState<'orbit' | 'top' | 'walk'>('orbit');
  const [showRoof, setShowRoof] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [wallColor, setWallColor] = useState('#e2e8f0');
  const [floorColor, setFloorColor] = useState('#1e293b');
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, prevX: 0, prevY: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 15, targetX: 0, targetY: 2, targetZ: 0 });

  const W = roomW * GRID * SCALE3D;
  const H = roomH * GRID * SCALE3D;

  // Build scene
  const buildScene = useCallback(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Cleanup
    if (sceneRef.current) {
      sceneRef.current.renderer.dispose();
      cancelAnimationFrame(sceneRef.current.animId);
      container.innerHTML = '';
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0f1e');
    scene.fog = new THREE.Fog('#0a0f1e', 30, 80);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(W * 1.5, 8, H * 1.5);
    camera.lookAt(W / 2, 0, H / 2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── LIGHTING ──
    const ambient = new THREE.AmbientLight('#b8c4d0', 0.4 * lightIntensity);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight('#ffffff', 0.8 * lightIntensity);
    dirLight.position.set(W, 12, H * 0.3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Point lights inside house
    const pointLight1 = new THREE.PointLight('#fde68a', 0.6 * lightIntensity, 15);
    pointLight1.position.set(W / 2, 4, H / 2);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight('#93c5fd', 0.3 * lightIntensity, 12);
    pointLight2.position.set(W * 0.2, 3, H * 0.3);
    scene.add(pointLight2);

    // ── GROUND (large area) ──
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── FLOOR ──
    const floorGeo = new THREE.BoxGeometry(W, 0.15, H);
    const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.6, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(W / 2, 0.075, H / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor grid lines
    const gridHelper = new THREE.GridHelper(Math.max(W, H) * 1.2, Math.max(roomW, roomH), '#334155', '#1e293b');
    gridHelper.position.set(W / 2, 0.16, H / 2);
    scene.add(gridHelper);

    // ── WALLS ──
    const WALL_HEIGHT = 3.5;
    const WALL_THICK = 0.2;

    walls.forEach(w => {
      const dx = (w.x2 - w.x1) * SCALE3D;
      const dz = (w.y2 - w.y1) * SCALE3D;
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const cx = ((w.x1 + w.x2) / 2) * SCALE3D;
      const cz = ((w.y1 + w.y2) / 2) * SCALE3D;

      const wallGeo = new THREE.BoxGeometry(len, WALL_HEIGHT, WALL_THICK);
      const wallMat = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.4,
        metalness: 0.05,
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(cx, WALL_HEIGHT / 2, cz);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);

      // Wall top trim
      const trimGeo = new THREE.BoxGeometry(len, 0.08, WALL_THICK + 0.04);
      const trimMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.2 });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(cx, WALL_HEIGHT + 0.04, cz);
      trim.rotation.y = -angle;
      scene.add(trim);

      // Baseboard
      const baseGeo = new THREE.BoxGeometry(len, 0.12, WALL_THICK + 0.02);
      const baseMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5 });
      const baseboard = new THREE.Mesh(baseGeo, baseMat);
      baseboard.position.set(cx, 0.06, cz);
      baseboard.rotation.y = -angle;
      scene.add(baseboard);
    });

    // ── CEILING / ROOF ──
    if (showRoof) {
      const ceilGeo = new THREE.BoxGeometry(W + 0.4, 0.12, H + 0.4);
      const ceilMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.8, side: THREE.DoubleSide });
      const ceil = new THREE.Mesh(ceilGeo, ceilMat);
      ceil.position.set(W / 2, WALL_HEIGHT, H / 2);
      scene.add(ceil);

      // Roof shape
      const roofShape = new THREE.Shape();
      const roofW = W + 1;
      const roofH2 = H + 1;
      roofShape.moveTo(-roofW / 2, 0);
      roofShape.lineTo(0, 2);
      roofShape.lineTo(roofW / 2, 0);
      roofShape.lineTo(-roofW / 2, 0);
      const extrudeSettings = { depth: roofH2, bevelEnabled: false };
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
      const roofMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.7 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(W / 2, WALL_HEIGHT + 0.12, -0.5);
      roof.rotation.y = 0;
      roof.castShadow = true;
      scene.add(roof);
    }

    // ── FURNITURE ──
    furniture.forEach(f => {
      const fw = f.w * GRID * SCALE3D;
      const fh = f.h * GRID * SCALE3D;
      const fx = f.x * SCALE3D + fw / 2;
      const fz = f.y * SCALE3D + fh / 2;

      const catalogItem = FURNITURE_CATALOG.find(c => c.type === f.type);
      const color = catalogItem?.color3d || '#6366f1';

      // Different heights for different furniture
      let furnitureH = 0.8;
      if (f.type.includes('bed')) furnitureH = 0.6;
      if (f.type.includes('wardrobe')) furnitureH = 2.2;
      if (f.type.includes('fridge')) furnitureH = 1.8;
      if (f.type.includes('table')) furnitureH = 0.85;
      if (f.type.includes('sofa')) furnitureH = 0.7;
      if (f.type.includes('tv')) furnitureH = 1.4;
      if (f.type.includes('chair')) furnitureH = 0.9;
      if (f.type.includes('toilet') || f.type.includes('sink')) furnitureH = 0.5;
      if (f.type.includes('shower')) furnitureH = 2.0;
      if (f.type.includes('stove')) furnitureH = 0.9;
      if (f.type.includes('door')) furnitureH = 2.8;
      if (f.type.includes('window')) furnitureH = 1.2;

      const group = new THREE.Group();

      // Main body
      const bodyGeo = new THREE.BoxGeometry(fw, furnitureH, fh);
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = furnitureH / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Legs for tables/chairs
      if (f.type.includes('table') || f.type.includes('chair') || f.type.includes('desk')) {
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, furnitureH - 0.1);
        const legMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.3 });
        const offsets = [[-fw/2+0.08, -fh/2+0.08], [fw/2-0.08, -fh/2+0.08], [-fw/2+0.08, fh/2-0.08], [fw/2-0.08, fh/2-0.08]];
        offsets.forEach(([ox, oz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(ox, (furnitureH - 0.1) / 2, oz);
          group.add(leg);
        });
        // Table top is thinner
        body.scale.y = 0.15;
        body.position.y = furnitureH - 0.05;
      }

      // Bed mattress effect
      if (f.type.includes('bed')) {
        const mattGeo = new THREE.BoxGeometry(fw - 0.1, 0.15, fh - 0.1);
        const mattMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 });
        const matt = new THREE.Mesh(mattGeo, mattMat);
        matt.position.y = furnitureH + 0.075;
        group.add(matt);

        // Pillow
        const pillowGeo = new THREE.BoxGeometry(fw * 0.35, 0.1, fh * 0.15);
        const pillowMat = new THREE.MeshStandardMaterial({ color: '#dbeafe', roughness: 0.9 });
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(0, furnitureH + 0.2, -fh * 0.35);
        group.add(pillow);
      }

      // Sofa cushions
      if (f.type === 'sofa') {
        const cushGeo = new THREE.BoxGeometry(fw * 0.45, 0.2, fh * 0.7);
        const cushMat = new THREE.MeshStandardMaterial({ color: '#c4b5fd', roughness: 0.9 });
        [-fw * 0.22, fw * 0.22].forEach(ox => {
          const cush = new THREE.Mesh(cushGeo, cushMat);
          cush.position.set(ox, furnitureH + 0.1, 0);
          group.add(cush);
        });
        // Back
        const backGeo = new THREE.BoxGeometry(fw, furnitureH * 0.6, 0.15);
        const backMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.set(0, furnitureH * 0.8, -fh / 2 + 0.07);
        group.add(back);
      }

      // TV screen glow
      if (f.type === 'tv') {
        const screenGeo = new THREE.PlaneGeometry(fw * 0.9, furnitureH * 0.7);
        const screenMat = new THREE.MeshStandardMaterial({ color: '#1e40af', emissive: '#3b82f6', emissiveIntensity: 0.5 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, furnitureH * 0.6, fh / 2 + 0.01);
        group.add(screen);
      }

      // Window transparency
      if (f.type === 'window') {
        const glassMat = new THREE.MeshStandardMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.3, roughness: 0 });
        const glassGeo = new THREE.BoxGeometry(fw, furnitureH, 0.05);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = furnitureH / 2 + 1;
        group.add(glass);
      }

      group.position.set(fx, 0.16, fz);
      scene.add(group);
    });

    // ── ANIMATION LOOP ──
    const animate = () => {
      const animId = requestAnimationFrame(animate);
      sceneRef.current!.animId = animId;

      const cam = cameraAngle.current;
      const keys = keysRef.current;
      const speed = 0.15;

      // Keyboard movement
      if (keys.has('w') || keys.has('ArrowUp')) { cam.targetX += Math.sin(cam.theta) * speed; cam.targetZ += Math.cos(cam.theta) * speed; }
      if (keys.has('s') || keys.has('ArrowDown')) { cam.targetX -= Math.sin(cam.theta) * speed; cam.targetZ -= Math.cos(cam.theta) * speed; }
      if (keys.has('a') || keys.has('ArrowLeft')) { cam.theta -= 0.03; }
      if (keys.has('d') || keys.has('ArrowRight')) { cam.theta += 0.03; }
      if (keys.has('q')) { cam.targetY = Math.min(20, cam.targetY + 0.1); }
      if (keys.has('e')) { cam.targetY = Math.max(0.5, cam.targetY - 0.1); }
      if (keys.has('+') || keys.has('=')) { cam.radius = Math.max(2, cam.radius - 0.2); }
      if (keys.has('-')) { cam.radius = Math.min(40, cam.radius + 0.2); }

      // Camera position based on mode
      if (camMode === 'orbit') {
        camera.position.x = cam.targetX + cam.radius * Math.sin(cam.theta) * Math.cos(cam.phi);
        camera.position.y = cam.targetY + cam.radius * Math.sin(cam.phi);
        camera.position.z = cam.targetZ + cam.radius * Math.cos(cam.theta) * Math.cos(cam.phi);
        camera.lookAt(cam.targetX, cam.targetY * 0.3, cam.targetZ);
      } else if (camMode === 'walk') {
        camera.position.x = cam.targetX;
        camera.position.y = 1.7; // eye height
        camera.position.z = cam.targetZ;
        camera.lookAt(cam.targetX + Math.sin(cam.theta) * 5, 1.7, cam.targetZ + Math.cos(cam.theta) * 5);
      } else { // top
        camera.position.set(W / 2, 20, H / 2);
        camera.lookAt(W / 2, 0, H / 2);
      }

      renderer.render(scene, camera);
    };

    const animId = requestAnimationFrame(animate);
    sceneRef.current = { scene, camera, renderer, animId };

    // ── EVENT HANDLERS ──
    const onKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;
    };
    const onMouseUp = () => { mouseRef.current.isDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.prevX;
      const dy = e.clientY - mouseRef.current.prevY;
      cameraAngle.current.theta += dx * 0.005;
      cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.current.phi + dy * 0.005));
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.current.radius = Math.max(2, Math.min(40, cameraAngle.current.radius + e.deltaY * 0.01));
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - mouseRef.current.prevX;
        const dy = t.clientY - mouseRef.current.prevY;
        cameraAngle.current.theta += dx * 0.008;
        cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraAngle.current.phi + dy * 0.008));
        mouseRef.current.prevX = t.clientX;
        mouseRef.current.prevY = t.clientY;
      }
    };
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { mouseRef.current.prevX = e.touches[0].clientX; mouseRef.current.prevY = e.touches[0].clientY; } };

    const canvas = renderer.domElement;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouch, { passive: true });

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [walls, furniture, W, H, roomW, roomH, camMode, showRoof, lightIntensity, wallColor, floorColor]);

  useEffect(() => { const cleanup = buildScene(); return cleanup; }, [buildScene]);

  const resetCamera = () => {
    cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 15, targetX: W / 2, targetY: 2, targetZ: H / 2 };
  };

  return (
    <div className="relative">
      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full rounded-2xl overflow-hidden border border-slate-700 bg-[#0a0f1e]" style={{ height: '550px' }} />

      {/* Controls overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        {/* Camera modes */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2 flex flex-col gap-1">
          {[
            { id: 'orbit' as const, icon: '🔄', label: 'Órbita' },
            { id: 'walk' as const, icon: '🚶', label: 'Caminhar' },
            { id: 'top' as const, icon: '📐', label: 'Topo' },
          ].map(m => (
            <button key={m.id} onClick={() => { setCamMode(m.id); resetCamera(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${camMode === m.id ? 'bg-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <span>{m.icon}</span><span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
        {/* Options */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2 flex flex-col gap-1">
          <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 cursor-pointer hover:text-white">
            <input type="checkbox" checked={showRoof} onChange={e => setShowRoof(e.target.checked)} className="accent-cyan-500 w-3.5 h-3.5" />
            🏠 Telhado
          </label>
          <div className="px-3 py-1">
            <span className="text-[10px] text-gray-500">☀️ Luz</span>
            <input type="range" min={0.2} max={2} step={0.1} value={lightIntensity} onChange={e => setLightIntensity(+e.target.value)} className="w-full accent-yellow-500 h-1" />
          </div>
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="text-[10px] text-gray-500">Parede</span>
            <input type="color" value={wallColor} onChange={e => setWallColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0" />
            <span className="text-[10px] text-gray-500">Chão</span>
            <input type="color" value={floorColor} onChange={e => setFloorColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0" />
          </div>
        </div>
      </div>

      {/* Controls info */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
          <span>🖱️ <strong className="text-white">Arrastar</strong> = Rodar</span>
          <span>🔲 <strong className="text-white">Scroll</strong> = Zoom</span>
          <span>⌨️ <strong className="text-white">WASD</strong> = Mover</span>
          <span>🔼🔽 <strong className="text-white">Q/E</strong> = Subir/Descer</span>
          <span>🔍 <strong className="text-white">+/-</strong> = Zoom</span>
          <span>📱 <strong className="text-white">Touch</strong> = Arrastar</span>
          <button onClick={resetCamera} className="ml-auto px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30">↺ Reset</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — FLOOR PLAN
═══════════════════════════════════════════════════════════ */

export function FloorPlanPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'select' | 'wall' | 'furniture' | 'erase'>('select');
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [walls, setWalls] = useState<Wall[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<typeof FURNITURE_CATALOG[0] | null>(null);
  const [projectName, setProjectName] = useState('Minha Casa');
  const [roomWidth, setRoomWidth] = useState(12);
  const [roomHeight, setRoomHeight] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showMeasures, setShowMeasures] = useState(true);
  const [saved, setSaved] = useState(false);

  const canvasW = roomWidth * GRID * 3;
  const canvasH = roomHeight * GRID * 3;
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  // ── Draw 2D Canvas ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (showGrid) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvasW; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
      for (let y = 0; y < canvasH; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    }

    const margin = GRID * 2;
    const terrW = roomWidth * GRID;
    const terrH = roomHeight * GRID;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(margin, margin, terrW, terrH);
    ctx.setLineDash([]);

    if (showMeasures) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px monospace';
      ctx.fillText(`${roomWidth}m`, margin + terrW / 2 - 10, margin - 8);
      ctx.save();
      ctx.translate(margin - 10, margin + terrH / 2 + 10);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${roomHeight}m`, 0, 0);
      ctx.restore();
    }

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    walls.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
      if (showMeasures) {
        const dx = w.x2 - w.x1;
        const dy = w.y2 - w.y1;
        const len = Math.sqrt(dx * dx + dy * dy) / GRID;
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px monospace';
        ctx.fillText(`${len.toFixed(1)}m`, (w.x1 + w.x2) / 2 - 12, (w.y1 + w.y2) / 2 - 8);
      }
    });

    if (isDrawing && wallStart) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(wallStart.x, wallStart.y);
      ctx.lineTo(snap(mousePos.x), snap(mousePos.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    furniture.forEach(f => {
      const fw = f.w * GRID;
      const fh = f.h * GRID;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.fillRect(f.x, f.y, fw, fh);
      ctx.strokeRect(f.x, f.y, fw, fh);
      ctx.font = `${Math.min(fw, fh) * 0.6}px serif`;
      ctx.fillText(f.emoji, f.x + fw * 0.2, f.y + fh * 0.7);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9px sans-serif';
      ctx.fillText(f.label, f.x + 2, f.y + fh + 12);
    });
  }, [canvasW, canvasH, walls, furniture, showGrid, showMeasures, isDrawing, wallStart, mousePos, roomWidth, roomHeight]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = snap((e.clientX - rect.left) * (canvasW / rect.width));
    const y = snap((e.clientY - rect.top) * (canvasH / rect.height));
    if (mode === 'wall') {
      if (!isDrawing) { setWallStart({ x, y }); setIsDrawing(true); }
      else { if (wallStart) setWalls(p => [...p, { x1: wallStart.x, y1: wallStart.y, x2: x, y2: y, thickness: 6 }]); setIsDrawing(false); setWallStart(null); }
    } else if (mode === 'furniture' && selectedFurniture) {
      setFurniture(p => [...p, { type: selectedFurniture.type, x, y, w: selectedFurniture.w, h: selectedFurniture.h, rotation: 0, emoji: selectedFurniture.emoji, label: selectedFurniture.label }]);
    } else if (mode === 'erase') {
      setFurniture(p => p.filter(f => !(x >= f.x && x <= f.x + f.w * GRID && y >= f.y && y <= f.y + f.h * GRID)));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: (e.clientX - rect.left) * (canvasW / rect.width), y: (e.clientY - rect.top) * (canvasH / rect.height) });
  };

  const saveProject = () => {
    const projects = JSON.parse(localStorage.getItem('netek_floorplans') || '[]');
    projects.push({ id: Date.now().toString(), name: projectName, width: roomWidth, height: roomHeight, walls, furniture, createdAt: Date.now() });
    localStorage.setItem('netek_floorplans', JSON.stringify(projects));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${projectName}</title><style>body{margin:0;padding:20px;font-family:sans-serif;background:#fff;text-align:center}img{max-width:100%;border:2px solid #333}@media print{button{display:none}}</style></head><body><h1>🏠 ${projectName}</h1><p>📐 ${roomWidth}m × ${roomHeight}m · 🧱 ${walls.length} paredes · 🪑 ${furniture.length} móveis · 📅 ${new Date().toLocaleDateString('pt-MZ')}</p><img src="${canvas.toDataURL('image/png')}"/><p>Gerado por Netek Services</p><button onclick="window.print()" style="margin:20px;padding:12px 30px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ Imprimir PDF</button></body></html>`);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-4">🏠 PLANTAS 2D & 3D</span>
          <h2 className="text-4xl font-bold text-white mb-3">Desenhador de Plantas Profissional</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Desenhe a planta, adicione móveis e <strong className="text-cyan-400">navegue pela casa em 3D interativo</strong> com Three.js!</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* ── Painel lateral ── */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">📐 Projecto</h3>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full px-3 py-2 bg-slate-900/60 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none text-sm mb-2" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div><label className="text-[10px] text-gray-400">Largura (m)</label><input type="number" value={roomWidth} onChange={e => setRoomWidth(+e.target.value || 1)} min={3} max={30} className="w-full px-3 py-2 bg-slate-900/60 text-white rounded-xl border border-slate-700 text-sm focus:outline-none" /></div>
                <div><label className="text-[10px] text-gray-400">Altura (m)</label><input type="number" value={roomHeight} onChange={e => setRoomHeight(+e.target.value || 1)} min={3} max={30} className="w-full px-3 py-2 bg-slate-900/60 text-white rounded-xl border border-slate-700 text-sm focus:outline-none" /></div>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="accent-blue-500" />Grid</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400"><input type="checkbox" checked={showMeasures} onChange={e => setShowMeasures(e.target.checked)} className="accent-blue-500" />Medidas</label>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">🔧 Ferramentas</h3>
              <div className="grid grid-cols-4 gap-2">
                {[{ id: 'select' as const, icon: '👆', l: 'Selecionar' }, { id: 'wall' as const, icon: '🧱', l: 'Parede' }, { id: 'furniture' as const, icon: '🪑', l: 'Mobília' }, { id: 'erase' as const, icon: '🗑️', l: 'Apagar' }].map(t => (
                  <button key={t.id} onClick={() => setMode(t.id)} className={`p-2 rounded-xl text-center transition-all ${mode === t.id ? 'bg-blue-500/30 border border-blue-500 text-blue-400' : 'bg-slate-900/50 border border-slate-700 text-gray-400 hover:text-white'}`}>
                    <div className="text-xl">{t.icon}</div><div className="text-[9px] mt-0.5">{t.l}</div>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'furniture' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 max-h-64 overflow-y-auto">
                <h3 className="text-white font-semibold mb-3 text-sm">🪑 Mobiliário</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FURNITURE_CATALOG.map(f => (
                    <button key={f.type} onClick={() => setSelectedFurniture(f)} className={`p-2 rounded-xl text-center transition-all ${selectedFurniture?.type === f.type ? 'bg-purple-500/30 border border-purple-500' : 'bg-slate-900/50 border border-slate-700 hover:border-purple-500/50'}`}>
                      <div className="text-xl">{f.emoji}</div><div className="text-[8px] text-gray-400 mt-0.5 truncate">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">👁️ Visualização</h3>
              <div className="flex gap-2">
                <button onClick={() => setView('2d')} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${view === '2d' ? 'bg-blue-500 text-white' : 'bg-slate-900/50 text-gray-400 border border-slate-700'}`}>📐 2D</button>
                <button onClick={() => setView('3d')} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${view === '3d' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-900/50 text-gray-400 border border-slate-700'}`}>🏗️ 3D Interativo</button>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={saveProject} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}>{saved ? '✅ Guardado!' : '💾 Guardar'}</button>
              <button onClick={exportPDF} className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all">📄 Exportar PDF</button>
              <button onClick={() => { setWalls([]); setFurniture([]); }} className="w-full py-2 bg-red-500/20 text-red-400 rounded-xl text-xs hover:bg-red-500/30 transition-all">🗑️ Limpar</button>
              <button onClick={() => { if (walls.length) setWalls(p => p.slice(0, -1)); else setFurniture(p => p.slice(0, -1)); }} className="w-full py-2 bg-slate-700 text-gray-300 rounded-xl text-xs hover:bg-slate-600 transition-all">↩️ Desfazer</button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-xs text-gray-400 space-y-1">
              <p>🧱 Paredes: {walls.length}</p>
              <p>🪑 Móveis: {furniture.length}</p>
              <p>📐 Área: {roomWidth * roomHeight} m²</p>
            </div>
          </div>

          {/* ── Canvas / 3D ── */}
          <div>
            {view === '2d' ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-semibold text-sm">📐 Planta 2D — {projectName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Modo: <span className="text-blue-400 font-semibold capitalize">{mode}</span></span>
                    {mode === 'wall' && <span className="text-cyan-400">{isDrawing ? 'Clique para terminar' : 'Clique para iniciar'}</span>}
                    {mode === 'furniture' && selectedFurniture && <span className="text-purple-400">{selectedFurniture.emoji} {selectedFurniture.label}</span>}
                  </div>
                </div>
                <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseMove={handleMouseMove} className="rounded-xl cursor-crosshair border border-slate-700 w-full" style={{ maxHeight: '550px', objectFit: 'contain' }} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-semibold text-sm">🏗️ Visualização 3D — {projectName}</p>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium">Three.js Interativo</span>
                </div>
                <ThreeViewer walls={walls} furniture={furniture} roomW={roomWidth} roomH={roomHeight} />
                <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-center">
                  <p className="text-cyan-400 font-semibold text-sm">🏠 Navegue pela casa!</p>
                  <p className="text-gray-400 text-xs mt-1">Arraste para rodar · Scroll para zoom · WASD para caminhar · Modo "🚶 Caminhar" para first-person</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
