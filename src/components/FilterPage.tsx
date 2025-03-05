import React, { useEffect, useRef } from "react";
import * as THREE from "./three.js-r132/build/three.module.js"; // Adjust path as needed
import { GLTFLoader } from "./three.js-r132/examples/jsm/loaders/GLTFLoader.js";

interface ModelData {
  model: THREE.Group;
  gltf: THREE.GLTF;
}

const FilterPage: React.FC = () => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const modelsRef = useRef<ModelData[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const capturedImage = localStorage.getItem("capturedImage");

  // Initialize Three.js scene, camera, and renderer
  useEffect(() => {
    const initScene = () => {
      sceneRef.current = new THREE.Scene();
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(rendererRef.current.domElement);

      // Lighting
      sceneRef.current.add(new THREE.AmbientLight(0xffffff, 1));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 1);
      directionalLight.castShadow = true;
      sceneRef.current.add(directionalLight);

      // Camera
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      cameraRef.current.position.set(0, 0, 10);

      // Apply captured image as background if exists
      if (capturedImage) {
        useCapturedImageAsBackground();
        initSelectionBox();
      }

      animate();
    };

    initScene();

    // Cleanup on unmount
    return () => {
      if (rendererRef.current && rendererRef.current.domElement) {
        document.body.removeChild(rendererRef.current.domElement);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage]);

  // Handle DOM elements and events with Tailwind styling
  useEffect(() => {
    // Overlay Image
    overlayImageRef.current = document.createElement("img");
    overlayImageRef.current.src = "images/overlayFilter1.png";
    overlayImageRef.current.id = "overlayImage";
    overlayImageRef.current.className =
      "fixed inset-0 w-full h-full object-fill z-[1000] hidden opacity-70"; // Added opacity for filter effect
    overlayImageRef.current.onerror = () => console.error("Failed to load overlay image");
    overlayImageRef.current.onload = () => console.log("Overlay image loaded successfully");
    document.body.appendChild(overlayImageRef.current);

    // Video Element
    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    videoRef.current.className =
      "absolute inset-0 w-full h-full object-cover z-[999]";
    document.body.appendChild(videoRef.current);

    // Control Button
    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className =
      "fixed bottom-5 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[1000] transition duration-300";
    controlButtonRef.current.addEventListener("click", handleButtonClick);
    document.body.appendChild(controlButtonRef.current);

    // Window resize handler
    const handleResize = () => {
      if (videoRef.current) {
        videoRef.current.style.width = `${window.innerWidth}px`;
        videoRef.current.style.height = `${window.innerHeight}px`;
      }
      if (overlayImageRef.current) {
        overlayImageRef.current.style.width = `${window.innerWidth}px`;
        overlayImageRef.current.style.height = `${window.innerHeight}px`;
      }
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (overlayImageRef.current) document.body.removeChild(overlayImageRef.current);
      if (videoRef.current) document.body.removeChild(videoRef.current);
      if (controlButtonRef.current) document.body.removeChild(controlButtonRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleButtonClick = () => {
    if (!controlButtonRef.current) return;
    console.log("Button Clicked:", controlButtonRef.current.textContent);
    if (controlButtonRef.current.textContent === "Start Camera") {
      startCameraStream();
    } else if (controlButtonRef.current.textContent === "Capture") {
      captureImage();
    } else if (controlButtonRef.current.textContent === "Submit") {
      submitAndPlayAnimation();
    }
  };

  const startCameraStream = () => {
    console.log("🎥 Requesting camera access...");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => {
              console.log("🎬 Video playing");
              if (overlayImageRef.current) {
                // Set className explicitly to ensure visibility
                overlayImageRef.current.className =
                  "fixed inset-0 w-full h-full object-fill z-[1000] block opacity-70";
              }
              if (controlButtonRef.current) controlButtonRef.current.textContent = "Capture";
            })
            .catch((error) => console.error("🔴 Video playback error:", error));
        }
      })
      .catch((error) => console.error("❌ Camera access error:", error));
  };

  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.videoWidth || videoRef.current.readyState < 2) {
      console.error("Video not ready!");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      localStorage.setItem("capturedImage", imageData);

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      }

      if (videoRef.current) videoRef.current.className += " hidden";
      if (overlayImageRef.current)
        overlayImageRef.current.className =
          "fixed inset-0 w-full h-full object-fill z-[1000] hidden opacity-70";
      useCapturedImageAsBackground();
      initSelectionBox();
      if (controlButtonRef.current) controlButtonRef.current.textContent = "Submit";
    }
  };

  const useCapturedImageAsBackground = () => {
    const imageData = localStorage.getItem("capturedImage");
    if (!imageData || !sceneRef.current) return;

    const texture = new THREE.TextureLoader().load(imageData, () => {
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const imgAspect = texture.image.width / texture.image.height;
      const screenAspect = window.innerWidth / window.innerHeight;
      const width = 20 * screenAspect;
      const height = width / imgAspect;

      const bgMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      bgMesh.position.z = -5;
      sceneRef.current.add(bgMesh);
      console.log("✅ Background applied successfully!");
    });
  };

  const initSelectionBox = () => {
    if (selectionBoxRef.current) return;

    selectionBoxRef.current = document.createElement("div");
    selectionBoxRef.current.className =
      "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 hidden";
    document.body.appendChild(selectionBoxRef.current);

    let startX: number, startY: number, isTouch = false;

    const startSelection = (x: number, y: number) => {
      startX = x;
      startY = y;
      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.left = `${startX}px`;
        selectionBoxRef.current.style.top = `${startY}px`;
        selectionBoxRef.current.style.width = "0px";
        selectionBoxRef.current.style.height = "0px";
        selectionBoxRef.current.className =
          "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20";
      }
    };

    const updateSelection = (x: number, y: number) => {
      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.width = `${Math.abs(x - startX)}px`;
        selectionBoxRef.current.style.height = `${Math.abs(y - startY)}px`;
        selectionBoxRef.current.style.left = `${Math.min(startX, x)}px`;
        selectionBoxRef.current.style.top = `${Math.min(startY, y)}px`;
      }
    };

    const endSelection = (x: number, y: number) => {
      if (selectionBoxRef.current)
        selectionBoxRef.current.className += " hidden";
      create3DModelFromSelection(startX, startY, x, y);
    };

    const handleMouseDown = (event: MouseEvent) => {
      isTouch = false;
      startSelection(event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isTouch && event.buttons === 1) {
        updateSelection(event.clientX, event.clientY);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isTouch) {
        endSelection(event.clientX, event.clientY);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      isTouch = true;
      const touch = event.touches[0];
      startSelection(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isTouch) {
        const touch = event.touches[0];
        updateSelection(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isTouch) {
        const touch = event.changedTouches[0];
        endSelection(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (selectionBoxRef.current) document.body.removeChild(selectionBoxRef.current);
    };
  };

  const screenToWorld = (x: number, y: number): THREE.Vector3 => {
    if (!cameraRef.current) return new THREE.Vector3();
    const vector = new THREE.Vector3(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1,
      0.5
    );
    vector.unproject(cameraRef.current);
    return cameraRef.current.position
      .clone()
      .add(vector.sub(cameraRef.current.position).normalize().multiplyScalar(-cameraRef.current.position.z / vector.z));
  };

  const create3DModelFromSelection = (startX: number, startY: number, endX: number, endY: number) => {
    if (!sceneRef.current) return;
  
    const worldStart = screenToWorld(startX, startY);
    const worldEnd = screenToWorld(endX, endY);
  
    const targetWidth = Math.abs(worldEnd.x - worldStart.x);
    const targetHeight = Math.abs(worldEnd.y - worldStart.y);
  
    // Define the prospective model's bounding box before loading
    const prospectiveMin = new THREE.Vector3(
      Math.min(worldStart.x, worldEnd.x),
      Math.min(worldStart.y, worldEnd.y),
      0
    );
    const prospectiveMax = new THREE.Vector3(
      Math.max(worldStart.x, worldEnd.x),
      Math.max(worldStart.y, worldEnd.y),
      0.3 // Assuming model depth
    );
    const prospectiveBox = new THREE.Box3(prospectiveMin, prospectiveMax);
  
    // Check for overlap with existing models
    const overlaps = modelsRef.current.some(({ model }) => {
      const box = new THREE.Box3().setFromObject(model);
      return prospectiveBox.intersectsBox(box);
    });
  
    if (overlaps) {
      console.log("🚫 Model creation skipped due to overlap with existing model.");
      return; // Skip creating the new model if it overlaps
    }
  
    new GLTFLoader().load("models/shadeBake.glb", (gltf: THREE.GLTF) => {
      const model = gltf.scene;
  
      new THREE.TextureLoader().load("images/pattern4.jpg", (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
  
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.computeBoundingBox();
            const repeatX = targetWidth / 2;
            const repeatY = targetHeight / 2;
            texture.repeat.set(repeatX, repeatY);
  
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.5,
              metalness: 0.3,
            });
          }
        });
  
        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize);
  
        const scaleX = targetWidth / modelSize.x;
        const scaleY = targetHeight / modelSize.y;
        model.scale.set(scaleX, scaleY, 0.3);
  
        box.setFromObject(model);
        const modelCenter = new THREE.Vector3();
        box.getCenter(modelCenter);
  
        model.position.set(
          (worldStart.x + worldEnd.x) / 2 - (modelCenter.x - model.position.x),
          (worldStart.y + worldEnd.y) / 2 - (modelCenter.y - model.position.y),
          0.1
        );
  
        sceneRef.current!.add(model);
        console.log("Model added successfully at position:", model.position);
  
        modelsRef.current.push({ model, gltf });
      });
    });
  };

  const submitAndPlayAnimation = () => {
    console.log("🚀 Submit button pressed!");
  };

  const playAllAnimations = () => {
    mixersRef.current = [];
    modelsRef.current.forEach((entry, index) => {
      const { model, gltf } = entry;
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixersRef.current.push(mixer);

        gltf.animations.forEach((clip, clipIndex) => {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat);
          action.play();
          console.log(`▶️ Animation ${clipIndex} started for model ${index}`);
          console.log(`Animation name: ${clip.name}, duration: ${clip.duration}`);
        });

        adjustCameraToModels();
      } else {
        console.warn(`⚠️ No animations found in GLTF for model ${index}!`);
      }
    });
  };

  const adjustCameraToModels = () => {
    if (modelsRef.current.length === 0 || !cameraRef.current) return;

    const center = new THREE.Vector3();
    modelsRef.current.forEach(({ model }) => {
      center.add(model.position);
    });
    center.divideScalar(modelsRef.current.length);

    cameraRef.current.position.set(center.x, center.y, 10);
    cameraRef.current.lookAt(center);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const deltaTime = 0.016; // ~60 FPS
    mixersRef.current.forEach((mixer) => mixer.update(deltaTime));
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  return null; // No JSX needed since everything is appended to the DOM directly
};

export default FilterPage;