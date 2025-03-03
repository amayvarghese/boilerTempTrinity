import React, { useEffect, useRef } from "react";
import * as THREE from "./three.js-r132/build/three.module.js";
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

  // Handle DOM elements and events
  useEffect(() => {
    // Overlay Image
    overlayImageRef.current = document.createElement("img");
    overlayImageRef.current.src = "images/overlayFilter1.png";
    overlayImageRef.current.id = "overlayImage";
    styleOverlay(overlayImageRef.current);
    document.body.appendChild(overlayImageRef.current);

    // Video Element
    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    Object.assign(videoRef.current.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "999",
      objectFit: "cover",
      display: "block",
    });
    document.body.appendChild(videoRef.current);

    // Control Button
    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    styleButton(controlButtonRef.current);
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

  const styleButton = (button: HTMLButtonElement) => {
    Object.assign(button.style, {
      position: "absolute",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "15px 30px",
      fontSize: "18px",
      backgroundColor: "blue",
      color: "white",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      zIndex: "1000",
      display: "inline-block",
    });
  };

  const styleOverlay = (image: HTMLImageElement) => {
    Object.assign(image.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      objectFit: "fill",
      zIndex: "1000",
      display: "none",
    });
  };

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
              if (overlayImageRef.current) overlayImageRef.current.style.display = "block";
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

      if (videoRef.current) videoRef.current.style.display = "none";
      if (overlayImageRef.current) overlayImageRef.current.style.display = "none";
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
    Object.assign(selectionBoxRef.current.style, {
      position: "absolute",
      border: "2px dashed blue",
      background: "rgba(0, 0, 255, 0.2)",
      display: "none",
    });
    document.body.appendChild(selectionBoxRef.current);

    let startX: number, startY: number, isTouch = false;

    const startSelection = (x: number, y: number) => {
      startX = x;
      startY = y;
      if (selectionBoxRef.current) {
        Object.assign(selectionBoxRef.current.style, {
          left: `${startX}px`,
          top: `${startY}px`,
          width: "0px",
          height: "0px",
          display: "block",
        });
      }
    };

    const updateSelection = (x: number, y: number) => {
      if (selectionBoxRef.current) {
        Object.assign(selectionBoxRef.current.style, {
          width: `${Math.abs(x - startX)}px`,
          height: `${Math.abs(y - startY)}px`,
          left: `${Math.min(startX, x)}px`,
          top: `${Math.min(startY, y)}px`,
        });
      }
    };

    const endSelection = (x: number, y: number) => {
      if (selectionBoxRef.current) selectionBoxRef.current.style.display = "none";
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
        model.scale.set(scaleX, scaleY, 1);

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
    if (modelsRef.current.length > 0) {
      playAllAnimations();
      if (controlButtonRef.current) controlButtonRef.current.style.display = "none";
    } else {
      console.warn("No models available to animate!");
      alert("Please create at least one 3D model by drawing a selection box.");
    }
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