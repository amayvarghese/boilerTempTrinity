import React, { useState, useEffect, useRef } from "react";
import * as THREE from "./three.js-r132/build/three.module.js";
import { GLTFLoader } from "./three.js-r132/examples/jsm/loaders/GLTFLoader.js";

interface ModelData {
  model: THREE.Group;
  gltf: any;
}

const FilterPageUI: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string>("Click 'Start Camera' or upload an image to begin.");
  const [isCustomizerView, setIsCustomizerView] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const modelsRef = useRef<ModelData[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const hasSelectionBox = useRef(false);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const blindTypes = [
    { type: "classicRoman", buttonImage: "/images/windowTypeIcons/image 12.png", modelUrl: "/models/classicRoman.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 3 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "roller", buttonImage: "/images/windowTypeIcons/image 11.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "roman", buttonImage: "/images/windowTypeIcons/image 13.png", modelUrl: "/models/shadeBake.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "plantationShutter", buttonImage: "/images/windowTypeIcons/image 15.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "solar", buttonImage: "/images/windowTypeIcons/image 14.png", modelUrl: "/models/shadeBake.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "aluminumSheet", buttonImage: "/images/windowTypeIcons/image 17.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "cellularBlinds", buttonImage: "/images/windowTypeIcons/image 18.png", modelUrl: "/models/shadeBake.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
  ];

  const patterns = [
    { name: "Semi Transparent", image: "/images/FabricP3.png", price: "200$", filterTags: ["smooth"], patternUrl: "/images/ICONSforMaterial/pattern2.png" },
    { name: "Red Pattern", image: "/images/FabricP0.png", price: "200$", filterTags: ["red", "patterned"], patternUrl: "/images/ICONSforMaterial/red.png" },
    { name: "Stripes Colorful", image: "/images/FabricP1.png", price: "200$", filterTags: ["patterned"], patternUrl: "/images/ICONSforMaterial/pattern3.png" },
    { name: "Texture 2", image: "/images/FabricP2.png", price: "Option B", filterTags: ["smooth"], patternUrl: "/images/ICONSforMaterial/pattern4.png" },
  ];

  const filteredPatterns = patterns.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );

  const setTemporaryInstruction = (text: string) => {
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
    }
    setInstruction(text);
    instructionTimeoutRef.current = setTimeout(() => {
      setInstruction("");
    }, 3000);
  };

  useEffect(() => {
    setTemporaryInstruction("Click 'Start Camera' or upload an image to begin.");

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = screenWidth / screenHeight;

    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    rendererRef.current = renderer;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.zIndex = "20";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    }

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const newAspect = newWidth / newHeight;
        rendererRef.current.setSize(newWidth, newHeight);
        cameraRef.current.aspect = newAspect;
        cameraRef.current.updateProjectionMatrix();
        updateCameraPosition(newWidth, newHeight);
        if (backgroundPlaneRef.current && capturedImage) {
          adjustBackgroundPlane(newWidth, newHeight);
        }
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const updateCameraPosition = (width: number, height: number) => {
    if (!cameraRef.current) return;
    const fovRad = cameraRef.current.fov * (Math.PI / 180);
    const distance = (height / 100 / 2) / Math.tan(fovRad / 2);
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const adjustBackgroundPlane = (width: number, height: number) => {
    if (!backgroundPlaneRef.current || !cameraRef.current) return;
    const texture = backgroundPlaneRef.current.material.map;
    if (!texture) return;

    const planeWidth = width / 100;
    const planeHeight = height / 100;
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    backgroundPlaneRef.current.geometry.dispose();
    backgroundPlaneRef.current.geometry = planeGeometry;
    backgroundPlaneRef.current.position.set(0, 0, -0.1);
    updateCameraPosition(width, height);
  };

  useEffect(() => {
    overlayImageRef.current = document.createElement("img");
    overlayImageRef.current.src = "images/overlayFilter1.png";
    overlayImageRef.current.className = "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";
    if (mountRef.current) mountRef.current.appendChild(overlayImageRef.current);

    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    videoRef.current.className = "absolute inset-0 w-full h-full object-cover z-[10]";
    if (mountRef.current) mountRef.current.appendChild(videoRef.current);

    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className =
      "fixed bottom-16 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[50] transition duration-300 opacity-100";
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    uploadButtonRef.current = document.createElement("button");
    uploadButtonRef.current.id = "uploadButton";
    uploadButtonRef.current.textContent = "Upload Image";
    uploadButtonRef.current.className =
      "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[50] transition duration-300 opacity-100";
    document.body.appendChild(uploadButtonRef.current);
    uploadButtonRef.current.addEventListener("click", () => fileInputRef.current?.click());

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.id = "saveButton";
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className =
      "fixed bottom-16 right-5 py-3 px-6 text-lg bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[50] transition duration-300 opacity-100 hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    return () => {
      if (overlayImageRef.current && mountRef.current) mountRef.current.removeChild(overlayImageRef.current);
      if (videoRef.current && mountRef.current) mountRef.current.removeChild(videoRef.current);
      if (controlButtonRef.current) document.body.removeChild(controlButtonRef.current);
      if (uploadButtonRef.current) document.body.removeChild(uploadButtonRef.current);
      if (saveButtonRef.current) document.body.removeChild(saveButtonRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    if (!controlButtonRef.current) return;
    if (controlButtonRef.current.textContent === "Start Camera") {
      startCameraStream();
      setTemporaryInstruction("Point your camera and click 'Capture' to take a photo.");
      if (uploadButtonRef.current) uploadButtonRef.current.style.display = "none";
    } else if (controlButtonRef.current.textContent === "Capture") {
      captureImage();
      setTemporaryInstruction("Draw a box on the image to place the 3D model.");
    } else if (controlButtonRef.current.textContent === "Submit") {
      submitAndShowMenu();
      setTemporaryInstruction("Select a blind type and pattern, then click 'Save Image' to download.");
    }
  };

  const startCameraStream = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: screenWidth },
          height: { ideal: screenHeight },
        },
      })
      .then((stream) => {
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            if (overlayImageRef.current) {
              overlayImageRef.current.className = "absolute inset-0 w-full h-full object-fill z-[15] block opacity-70";
            }
            if (controlButtonRef.current) controlButtonRef.current.textContent = "Capture";
          });
        }
      })
      .catch((err) => console.error("Camera stream error:", err));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        localStorage.setItem("capturedImage", imageData);
        setCapturedImage(imageData);
        loadUploadedImage(imageData);
        setTemporaryInstruction("Draw a box on the image to place the 3D model.");
        if (controlButtonRef.current) controlButtonRef.current.textContent = "Submit";
        if (uploadButtonRef.current) uploadButtonRef.current.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  };

  const loadUploadedImage = (imageData: string) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !mountRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    rendererRef.current.setSize(screenWidth, screenHeight);
    cameraRef.current.aspect = screenWidth / screenHeight;
    cameraRef.current.updateProjectionMatrix();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      const imgAspect = texture.image.width / texture.image.height;
      const screenAspect = screenWidth / screenHeight;

      let planeWidth = screenWidth / 100;
      let planeHeight = screenHeight / 100;
      if (imgAspect > screenAspect) {
        planeHeight = planeWidth / imgAspect;
      } else {
        planeWidth = planeHeight * imgAspect;
      }

      if (backgroundPlaneRef.current) sceneRef.current!.remove(backgroundPlaneRef.current);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current!.add(plane);
      updateCameraPosition(screenWidth, screenHeight);
      initSelectionBox();
    });
  };

  const captureImage = () => {
    if (!videoRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current || !mountRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    const canvas = document.createElement("canvas");
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate the correct source rectangle to preserve video aspect ratio
    const videoAspect = videoWidth / videoHeight;
    const screenAspect = screenWidth / screenHeight;
    let sx, sy, sWidth, sHeight;

    if (videoAspect > screenAspect) {
      // Video is wider than screen, crop sides
      sHeight = videoHeight;
      sWidth = sHeight * screenAspect;
      sx = (videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      // Video is taller than screen, crop top/bottom
      sWidth = videoWidth;
      sHeight = sWidth / screenAspect;
      sx = 0;
      sy = (videoHeight - sHeight) / 2;
    }

    // Draw the video frame, cropping to match screen aspect ratio
    ctx.drawImage(videoRef.current, sx, sy, sWidth, sHeight, 0, 0, screenWidth, screenHeight);

    const imageData = canvas.toDataURL("image/png");
    localStorage.setItem("capturedImage", imageData);
    setCapturedImage(imageData);

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    if (videoRef.current) videoRef.current.className += " hidden";
    if (overlayImageRef.current)
      overlayImageRef.current.className = "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";

    rendererRef.current.setSize(screenWidth, screenHeight);
    cameraRef.current.aspect = screenWidth / screenHeight;
    cameraRef.current.updateProjectionMatrix();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      if (backgroundPlaneRef.current) sceneRef.current!.remove(backgroundPlaneRef.current);

      const planeWidth = screenWidth / 100;
      const planeHeight = screenHeight / 100;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current!.add(plane);
      updateCameraPosition(screenWidth, screenHeight);
    });

    initSelectionBox();
    if (controlButtonRef.current) controlButtonRef.current.textContent = "Submit";
  };

  const initSelectionBox = () => {
    if (selectionBoxRef.current || hasSelectionBox.current) return;

    console.log("Initializing selection box");
    selectionBoxRef.current = document.createElement("div");
    selectionBoxRef.current.className = "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 hidden pointer-events-auto";
    selectionBoxRef.current.style.zIndex = "25";
    if (mountRef.current) mountRef.current.appendChild(selectionBoxRef.current);

    let startX: number, startY: number, isDragging = false;

    const startSelection = (x: number, y: number) => {
      if (hasSelectionBox.current) return;
      console.log("Starting selection at:", x, y);
      startX = x;
      startY = y;
      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.left = `${startX}px`;
        selectionBoxRef.current.style.top = `${startY}px`;
        selectionBoxRef.current.style.width = "0px";
        selectionBoxRef.current.style.height = "0px";
        selectionBoxRef.current.className = "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-auto";
        isDragging = true;
      }
    };

    const updateSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      console.log("Updating selection to:", x, y);
      selectionBoxRef.current.style.width = `${Math.abs(x - startX)}px`;
      selectionBoxRef.current.style.height = `${Math.abs(y - startY)}px`;
      selectionBoxRef.current.style.left = `${Math.min(startX, x)}px`;
      selectionBoxRef.current.style.top = `${Math.min(startY, y)}px`;
    };

    const endSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      console.log("Ending selection at:", x, y);
      selectionBoxRef.current.className += " hidden";
      hasSelectionBox.current = true;
      isDragging = false;
      create3DModelFromSelection(startX, startY, x, y);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (hasSelectionBox.current || event.button !== 0) return;
      const rect = mountRef.current!.getBoundingClientRect();
      startSelection(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const rect = mountRef.current!.getBoundingClientRect();
        updateSelection(event.clientX - rect.left, event.clientY - rect.top);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (isDragging) {
        const rect = mountRef.current!.getBoundingClientRect();
        endSelection(event.clientX - rect.left, event.clientY - rect.top);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (hasSelectionBox.current) return;
      event.preventDefault();
      const rect = mountRef.current!.getBoundingClientRect();
      const touch = event.touches[0];
      startSelection(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging) {
        event.preventDefault();
        const rect = mountRef.current!.getBoundingClientRect();
        const touch = event.touches[0];
        updateSelection(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isDragging) {
        event.preventDefault();
        const rect = mountRef.current!.getBoundingClientRect();
        const touch = event.changedTouches[0];
        endSelection(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    };

    if (mountRef.current) {
      mountRef.current.addEventListener("mousedown", handleMouseDown);
      mountRef.current.addEventListener("mousemove", handleMouseMove);
      mountRef.current.addEventListener("mouseup", handleMouseUp);
      mountRef.current.addEventListener("touchstart", handleTouchStart);
      mountRef.current.addEventListener("touchmove", handleTouchMove);
      mountRef.current.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener("mousedown", handleMouseDown);
        mountRef.current.removeEventListener("mousemove", handleMouseMove);
        mountRef.current.removeEventListener("mouseup", handleMouseUp);
        mountRef.current.removeEventListener("touchstart", handleTouchStart);
        mountRef.current.removeEventListener("touchmove", handleTouchMove);
        mountRef.current.removeEventListener("touchend", handleTouchEnd);
      }
      if (selectionBoxRef.current && mountRef.current) mountRef.current.removeChild(selectionBoxRef.current);
    };
  };

  const screenToWorld = (x: number, y: number): THREE.Vector3 => {
    if (!cameraRef.current || !mountRef.current) return new THREE.Vector3();
    const rect = mountRef.current.getBoundingClientRect();
    const vector = new THREE.Vector3(
      (x / rect.width) * 2 - 1,
      -(y / rect.height) * 2 + 1,
      0.5
    );
    vector.unproject(cameraRef.current);
    return cameraRef.current.position
      .clone()
      .add(vector.sub(cameraRef.current.position).normalize().multiplyScalar(-cameraRef.current.position.z / vector.z));
  };

  const create3DModelFromSelection = (startX: number, startY: number, endX: number, endY: number) => {
    if (!sceneRef.current || modelsRef.current.length > 0) return;

    console.log("Creating 3D model from selection");
    const worldStart = screenToWorld(startX, startY);
    const worldEnd = screenToWorld(endX, endY);

    const targetWidth = Math.abs(worldEnd.x - worldStart.x);
    const targetHeight = Math.abs(worldEnd.y - worldStart.y);

    const modelUrl = selectedBlindType
      ? blindTypes.find((b) => b.type === selectedBlindType)?.modelUrl || "/models/shadeBake.glb"
      : "/models/shadeBake.glb";

    new GLTFLoader().load(modelUrl, (gltf) => {
      const model = gltf.scene;

      new THREE.TextureLoader().load(selectedPattern || "images/pattern4.jpg", (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.computeBoundingBox();
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.5,
              metalness: 0.3,
            });
            mesh.material.needsUpdate = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize);

        const scaleX = targetWidth / modelSize.x;
        const scaleY = targetHeight / modelSize.y;
        model.scale.set(scaleX, scaleY, 0.01);

        box.setFromObject(model);
        const modelCenter = new THREE.Vector3();
        box.getCenter(modelCenter);

        model.position.set(
          (worldStart.x + worldEnd.x) / 2 - (modelCenter.x - model.position.x),
          (worldStart.y + worldEnd.y) / 2 - (modelCenter.y - model.position.y),
          0.1
        );

        sceneRef.current!.add(model);
        modelsRef.current.push({ model, gltf });
        console.log("3D model added with texture tiling set to 8x8");
      }, undefined, (error) => {
        console.error("Error loading texture:", error);
      });
    }, undefined, (error) => {
      console.error("Error loading model:", error);
    });
  };

  const saveImage = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !capturedImage) {
      console.error("Missing required elements for saving image");
      return;
    }

    setShowBlindMenu(false);
    if (controlButtonRef.current) controlButtonRef.current.style.display = "none";
    if (saveButtonRef.current) saveButtonRef.current.style.display = "none";

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    rendererRef.current.setSize(screenWidth, screenHeight);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    const canvas = document.createElement("canvas");
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const backgroundImg = new Image();
    const renderImg = new Image();
    const logoImg = new Image();

    const loadImage = (img: HTMLImageElement, src: string) =>
      new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
      });

    try {
      await loadImage(backgroundImg, capturedImage);
      ctx.drawImage(backgroundImg, 0, 0, screenWidth, screenHeight);

      renderImg.src = rendererRef.current.domElement.toDataURL("image/png");
      await loadImage(renderImg, renderImg.src);
      ctx.drawImage(renderImg, 0, 0, screenWidth, screenHeight);

      await loadImage(logoImg, "/images/baeLogo.png");
      const logoWidth = 96;
      const logoHeight = 96;
      const logoX = (screenWidth - logoWidth) / 2;
      const logoY = 16;
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      const link = document.createElement("a");
      link.download = "custom_blind_image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error saving image:", error);
    } finally {
      setShowBlindMenu(true);
      if (controlButtonRef.current) controlButtonRef.current.style.display = "block";
      if (saveButtonRef.current) saveButtonRef.current.style.display = "block";
    }
  };

  const submitAndShowMenu = () => {
    setShowBlindMenu(true);
    setIsCustomizerView(true);
    if (controlButtonRef.current) controlButtonRef.current.style.display = "none";
    if (saveButtonRef.current) saveButtonRef.current.className = saveButtonRef.current.className.replace(" hidden", "");
  };

  const selectBlindType = (type: string) => {
    console.log("Selected blind type:", type);
    setSelectedBlindType(type);
    if (modelsRef.current.length > 0) {
      updateExistingModel(type);
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const selectPattern = (patternUrl: string) => {
    console.log("Selected pattern:", patternUrl);
    setSelectedPattern(patternUrl);
    if (modelsRef.current.length > 0) {
      updateExistingModelPattern(patternUrl);
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  const updateExistingModel = (type: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0) return;

    console.log("Updating existing model with type:", type);
    const modelUrl = blindTypes.find((b) => b.type === type)?.modelUrl || "/models/shadeBake.glb";
    const { model } = modelsRef.current[0];
    const position = model.position.clone();
    const scale = model.scale.clone();

    sceneRef.current.remove(model);

    new GLTFLoader().load(modelUrl, (gltf) => {
      const newModel = gltf.scene;

      new THREE.TextureLoader().load(selectedPattern || "images/pattern4.jpg", (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);

        newModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.5,
              metalness: 0.3,
            });
            mesh.material.needsUpdate = true;
          }
        });

        newModel.scale.copy(scale);
        newModel.position.copy(position);

        sceneRef.current!.add(newModel);
        modelsRef.current[0] = { model: newModel, gltf };
        console.log("Model updated with texture tiling set to 8x8");
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }, undefined, (error) => {
        console.error("Error loading texture:", error);
      });
    }, undefined, (error) => {
      console.error("Error loading model:", error);
    });
  };

  const updateExistingModelPattern = (patternUrl: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0) return;

    console.log("Updating model pattern:", patternUrl);
    const { model } = modelsRef.current[0];

    new THREE.TextureLoader().load(patternUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.3,
          });
          mesh.material.needsUpdate = true;
        }
      });
      console.log("Pattern updated with tiling set to 8x8");
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }, undefined, (error) => {
      console.error("Error loading texture:", error);
    });
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const deltaTime = 0.016;
    mixersRef.current.forEach((mixer) => mixer.update(deltaTime));
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage: !capturedImage && !isCustomizerView ? "url('/images/background.jpg')" : "none",
        backgroundColor: capturedImage || isCustomizerView ? "#F5F5DC" : "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div ref={mountRef} className="relative w-full h-screen">
        {/* Three.js canvas is managed via mountRef */}
      </div>

      {/* Logo - Always visible, fixed position */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
        <img src="/images/baeLogo.png" alt="Logo" className="w-24 h-24 object-contain" />
      </div>

      {/* Instruction */}
      {instruction && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[50] text-brown-800 text-lg">
          {instruction}
        </div>
      )}

      {/* Hidden File Input for Upload */}
      <input
        type="file"
        id="imageUpload"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {showBlindMenu && isCustomizerView && (
        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4">
          <div className="blind-type-menu w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Select Type of Blind</h3>
            <div className="blind-type-content grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {blindTypes.map(({ type, buttonImage }) => (
                <div
                  key={type}
                  className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]"
                  onClick={() => selectBlindType(type)}
                >
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="button-image w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="button-text flex justify-center w-full mt-1 text-gray-700 text-[11px]">
                    <span className="text-center">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="central-content flex flex-col items-center w-full md:w-3/4 relative">
            <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
              <div className="options-menu p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {["red", "blue", "green", "smooth", "patterned"].map((filter) => (
                    <div key={filter} className="option-row flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer"
                        />
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="scrollable-buttons flex flex-col flex-1 max-h-[300px] bg-white">
                <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
                <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => selectPattern(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                        <span className="left-text truncate">{pattern.name}</span>
                        <span className="right-text">{pattern.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="options-menu p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {["red", "blue", "green", "smooth", "patterned"].map((filter) => (
                    <div key={filter} className="option-row flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer"
                        />
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="scrollable-buttons flex flex-col flex-1 max-h-[400px] bg-white">
                <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
                <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => selectPattern(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                        <span className="left-text truncate">{pattern.name}</span>
                        <span className="right-text">{pattern.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPageUI;