import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DebugComponent: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationsInfo, setAnimationsInfo] = useState<string[]>([]);
  
  // Animation-related refs
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Load the model
    const loader = new GLTFLoader();
    loader.load(
      "/3d/animated/SheetBlindAnim.glb",
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;
        scene.add(model);

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Initial camera position (left of model)
        camera.position.set(-10, 2, 5);
        camera.lookAt(0, 0, 0);

        // Check for animations
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const animationInfos: string[] = [];
          
          gltf.animations.forEach((clip, index) => {
            const action = mixerRef.current!.clipAction(clip);
            action.play();
            animationInfos.push(
              `Animation ${index}: ${clip.name}, Duration: ${clip.duration}s`
            );
          });
          
          setAnimationsInfo(animationInfos);
        } else {
          setAnimationsInfo(["No animations found in the model"]);
        }

        setLoading(false);
      },
      (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total * 100)}%`);
      },
      (err) => {
        setError(`Error loading model: ${err.message}`);
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (mixerRef.current) {
        const delta = clockRef.current.getDelta();
        mixerRef.current.update(delta);
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Handle scroll for left-to-right movement
    const handleScroll = () => {
      if (!cameraRef.current || !modelRef.current) return;

      const scrollY = window.scrollY;
      const scrollRange = 1000; // Total scroll distance for full animation

      // Calculate progress (0 to 1)
      const progress = Math.min(scrollY / scrollRange, 1);

      // Camera movement from left to right
      const startX = -10;  // Starting position (left)
      const endX = 10;     // Ending position (right)
      const yPos = 2;      // Fixed height
      const zPos = 5;      // Fixed distance from model

      // Interpolate X position
      cameraRef.current.position.x = startX + (endX - startX) * progress;
      cameraRef.current.position.y = yPos;
      cameraRef.current.position.z = zPos;

      // Maintain look at model center
      cameraRef.current.lookAt(0, 0, 0);
    };
    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ height: "200vh" }}>
      <div ref={mountRef} style={{ position: "fixed", top: 0, left: 0 }} />
      {loading && <div>Loading model...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ position: "relative", top: "100vh" }}>
        <h3>Model Debug Info:</h3>
        <ul>
          {animationsInfo.map((info, index) => (
            <li key={index}>{info}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DebugComponent;