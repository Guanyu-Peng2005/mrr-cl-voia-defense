import * as THREE from "./assets/vendor/three.module.min.js";

const canvas = document.querySelector("[data-particle-canvas]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduceMotion) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  camera.position.set(0, 0, 10);

  const group = new THREE.Group();
  scene.add(group);

  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const particleCount = isMobile ? 170 : 460;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color(0x14d6ff);
  const colorB = new THREE.Color(0x20d5b3);
  const colorC = new THREE.Color(0xffffff);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.4 + Math.random() * 6.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const offset = i % 3 === 0 ? -2.6 : 2.2;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius + offset;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.58;
    positions[i * 3 + 2] = Math.cos(phi) * radius - 4;

    const mixed = colorA.clone().lerp(i % 5 === 0 ? colorC : colorB, Math.random() * 0.6);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const particleMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.038 : 0.026,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  group.add(new THREE.Points(particleGeometry, particleMaterial));

  const linePositions = [];
  const maxDistance = isMobile ? 1.75 : 1.45;
  for (let i = 0; i < particleCount; i += 5) {
    const ax = positions[i * 3];
    const ay = positions[i * 3 + 1];
    const az = positions[i * 3 + 2];
    for (let j = i + 5; j < Math.min(particleCount, i + 55); j += 5) {
      const bx = positions[j * 3];
      const by = positions[j * 3 + 1];
      const bz = positions[j * 3 + 2];
      const dx = ax - bx;
      const dy = ay - by;
      const dz = az - bz;
      if (dx * dx + dy * dy + dz * dz < maxDistance * maxDistance) {
        linePositions.push(ax, ay, az, bx, by, bz);
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x14d6ff,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x20d5b3,
    transparent: true,
    opacity: 0.13,
    wireframe: true,
    depthWrite: false
  });
  const leftMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 2), wireMaterial);
  leftMesh.position.set(-5.8, -1.8, -4.2);
  leftMesh.scale.set(1.25, 0.78, 1.25);
  group.add(leftMesh);

  const rightMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.18, 120, 10), wireMaterial.clone());
  rightMesh.position.set(5.6, 2.2, -5.3);
  rightMesh.scale.set(1.15, 1.15, 1.15);
  group.add(rightMesh);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.5;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.35;
  }, { passive: true });

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate(timeMs) {
    const time = timeMs * 0.001;
    group.rotation.y = time * 0.045 + pointer.x;
    group.rotation.x = Math.sin(time * 0.22) * 0.055 + pointer.y;
    group.position.y = Math.sin(time * 0.35) * 0.16;
    leftMesh.rotation.x = time * 0.12;
    leftMesh.rotation.y = time * 0.08;
    rightMesh.rotation.x = -time * 0.1;
    rightMesh.rotation.z = time * 0.14;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(animate);
  document.documentElement.classList.add("particles-ready");
}
