import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Helper to create a premium glowing circular particle texture programmatically
const createCircularGlowTexture = (colorHex) => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Create a radial gradient for a soft spherical glow
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.15, colorHex);
  grad.addColorStop(0.4, colorHex.replace(")", ", 0.25)").replace("rgb", "rgba"));
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const fogColor = 0xf0f4f8;
    scene.fog = new THREE.FogExp2(fogColor, 0.007);

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 250;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Colors: Deep Teal & Sky Blue for clean light look
    const primaryColorStr = "rgb(8, 145, 178)"; 
    const secondaryColorStr = "rgb(56, 189, 248)"; 

    const primaryTexture = createCircularGlowTexture(primaryColorStr);
    const secondaryTexture = createCircularGlowTexture(secondaryColorStr);

    // --- Primary Starfield (Small, bright particles) ---
    const count1 = 120;
    const geo1 = new THREE.BufferGeometry();
    const pos1 = new Float32Array(count1 * 3);
    const vel1 = [];

    for (let i = 0; i < count1; i++) {
      pos1[i * 3] = (Math.random() - 0.5) * 600; // X
      pos1[i * 3 + 1] = (Math.random() - 0.5) * 600; // Y
      pos1[i * 3 + 2] = (Math.random() - 0.5) * 600; // Z

      vel1.push({
        x: (Math.random() - 0.5) * 0.15,
        y: (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.15,
      });
    }
    geo1.setAttribute("position", new THREE.BufferAttribute(pos1, 3));

    const mat1 = new THREE.PointsMaterial({
      size: 4.5,
      map: primaryTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const starfield1 = new THREE.Points(geo1, mat1);
    scene.add(starfield1);

    // --- Secondary Starfield (Larger, slow-drifting deep nebula dust) ---
    const count2 = 60;
    const geo2 = new THREE.BufferGeometry();
    const pos2 = new Float32Array(count2 * 3);
    const vel2 = [];

    for (let i = 0; i < count2; i++) {
      pos2[i * 3] = (Math.random() - 0.5) * 800; // X
      pos2[i * 3 + 1] = (Math.random() - 0.5) * 800; // Y
      pos2[i * 3 + 2] = (Math.random() - 0.5) * 800; // Z

      vel2.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05,
      });
    }
    geo2.setAttribute("position", new THREE.BufferAttribute(pos2, 3));

    const mat2 = new THREE.PointsMaterial({
      size: 16,
      map: secondaryTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const starfield2 = new THREE.Points(geo2, mat2);
    scene.add(starfield2);

    // --- Interactive Mouse Movement ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    let animationFrameId;
    const posArr1 = geo1.attributes.position.array;
    const posArr2 = geo2.attributes.position.array;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse follow rotation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate both starfields slightly differently
      starfield1.rotation.y += 0.0004;
      starfield1.rotation.x += 0.0002;

      starfield2.rotation.y -= 0.00015;
      starfield2.rotation.z += 0.0001;

      // Update primary starfield particles
      for (let i = 0; i < count1; i++) {
        posArr1[i * 3] += vel1[i].x;
        posArr1[i * 3 + 1] += vel1[i].y;
        posArr1[i * 3 + 2] += vel1[i].z;

        // Wrap around bounds
        if (Math.abs(posArr1[i * 3]) > 300) vel1[i].x *= -1;
        if (Math.abs(posArr1[i * 3 + 1]) > 300) vel1[i].y *= -1;
        if (Math.abs(posArr1[i * 3 + 2]) > 300) vel1[i].z *= -1;
      }
      geo1.attributes.position.needsUpdate = true;

      // Update secondary starfield particles
      for (let i = 0; i < count2; i++) {
        posArr2[i * 3] += vel2[i].x;
        posArr2[i * 3 + 1] += vel2[i].y;
        posArr2[i * 3 + 2] += vel2[i].z;

        // Wrap around bounds
        if (Math.abs(posArr2[i * 3]) > 400) vel2[i].x *= -1;
        if (Math.abs(posArr2[i * 3 + 1]) > 400) vel2[i].y *= -1;
        if (Math.abs(posArr2[i * 3 + 2]) > 400) vel2[i].z *= -1;
      }
      geo2.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (renderer) renderer.dispose();
      if (mat1) mat1.dispose();
      if (mat2) mat2.dispose();
      if (geo1) geo1.dispose();
      if (geo2) geo2.dispose();
      if (primaryTexture) primaryTexture.dispose();
      if (secondaryTexture) secondaryTexture.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-background" />;
}
