import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Report3D({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    const container = containerRef.current;
    
    // Clear any previous canvas
    container.innerHTML = "";

    const width = container.clientWidth;
    const height = container.clientHeight || 250;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 0, 0);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 1.2, 30);
    pointLight.position.set(0, 3, 3);
    scene.add(pointLight);

    // --- Base Grid / Platform ---
    const gridColor1 = 0x06b6d4;
    const gridColor2 = 0xcffafe;
    const gridHelper = new THREE.GridHelper(16, 16, gridColor1, gridColor2);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // --- Render 3D Bars ---
    // Bar dimensions & spacing
    const barWidth = 1.0;
    const maxBarHeight = 7.0;
    const spacing = 1.8;
    const barsGroup = new THREE.Group();

    // Find max count to scale heights
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Color palette for domains
    const colors = [
      0x06b6d4, // Cyan
      0x0ea5e9, // Sky Blue
      0x10b981, // Emerald
      0xf59e0b, // Amber
      0x3b82f6, // Blue
      0xef4444, // Red
      0xf97316, // Orange
    ];

    data.forEach((item, index) => {
      const scaledHeight = (item.count / maxCount) * maxBarHeight + 0.2;
      
      // Geometry (Cylinder for sleek glass pillar look)
      const geometry = new THREE.CylinderGeometry(barWidth / 2.5, barWidth / 2.5, scaledHeight, 32);
      
      // Material (Futuristic Hologram / Semi-transparent Glass)
      const color = colors[index % colors.length];
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8,
        flatShading: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Position bars linearly, centered
      const totalWidth = (data.length - 1) * spacing;
      mesh.position.x = -totalWidth / 2 + index * spacing;
      mesh.position.y = scaledHeight / 2 - 1; // Align bottom with grid
      mesh.position.z = 0;
      
      // Add text/number mesh or simple identifier properties
      mesh.userData = {
        name: item.domain_name,
        count: item.count,
        originalY: mesh.position.y
      };

      barsGroup.add(mesh);
    });

    scene.add(barsGroup);

    // --- Animation & Interaction ---
    let animationFrameId;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / width) * 2 - 1;
      targetRotationY = x * 0.5;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Bounce animation for bars
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.05;

      // Slow auto rotation
      barsGroup.rotation.y = time * 0.05;

      // Mouse interactive tilt
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;
      barsGroup.rotation.y += currentRotationY;

      // Subtle float animation
      barsGroup.children.forEach((bar, i) => {
        bar.position.y = bar.userData.originalY + Math.sin(time + i) * 0.15;
      });

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 250;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (renderer) renderer.dispose();
      barsGroup.children.forEach((bar) => {
        bar.geometry.dispose();
        bar.material.dispose();
      });
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
    };
  }, [data]);

  return (
    <div 
      ref={containerRef} 
      className="report-chart-container" 
      style={{ width: "100%", height: "250px" }}
    />
  );
}
