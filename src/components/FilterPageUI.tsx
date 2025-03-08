import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Interfaces for type safety
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface BlindType {
  type: string;
  buttonImage: string;
  modelUrl: string;
  meshName?: string;
  rotation: Vector3D;
  baseScale: Vector3D;
  basePosition: Vector3D;
}

interface Pattern {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
  patternUrl: string;
}

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

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const blindTypes: BlindType[] = [
    { type: "classicRoman", buttonImage: "/images/windowTypeIcons/image 12.png", modelUrl: "/models/classicRoman.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 3 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "roller", buttonImage: "/images/windowTypeIcons/image 11.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "roman", buttonImage: "/images/windowTypeIcons/image 13.png", modelUrl: "/models/shadeBake.glb", meshName: "polySurface1", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "plantationShutter", buttonImage: "/images/windowTypeIcons/image 15.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "solar", buttonImage: "/images/windowTypeIcons/image 14.png", modelUrl: "/models/shadeBake.glb", meshName: "polySurface1", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "aluminumSheet", buttonImage: "/images/windowTypeIcons/image 17.png", modelUrl: "/models/plantationShutter.glb", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
    { type: "cellularBlinds", buttonImage: "/images/windowTypeIcons/image 18.png", modelUrl: "/models/shadeBake.glb", meshName: "polySurface1", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.6, y: 2, z: 1 }, basePosition: { x: 0, y: 0, z: 0.1 } },
  ];

  const patterns: Pattern[] = [
    { name: "Beige", image: "/images/ICONSforMaterial/beige.png", price: "200$", filterTags: ["smooth"], patternUrl: "/images/ICONSforMaterial/beige.png" },
    { name: "Sunday Blue", image: "/images/ICONSforMaterial/blue1.png", price: "200$", filterTags: ["blue", "smooth"], patternUrl: "/images/ICONSforMaterial/blue1.png" },
    { name: "Stripes Colorful", image: "/images/ICONSforMaterial/pattern4.png", price: "200$", filterTags: ["patterned"], patternUrl: "/images/ICONSforMaterial/pattern4.png" },
    { name: "Navy Blue", image: "/images/ICONSforMaterial/blue2.png", price: "Option B", filterTags: ["smooth"], patternUrl: "/images/ICONSforMaterial/blue2.png" },
    { name: "Green", image: "/images/ICONSforMaterial/green.png", price: "200$", filterTags: ["green", "smooth"], patternUrl: "/images/ICONSforMaterial/green.png" },
    { name: "Caramel Cream", image: "/images/ICONSforMaterial/kaki.png", price: "200$", filterTags: ["smooth"], patternUrl: "/images/ICONSforMaterial/kaki.png" },
    { name: "Circle Mandala", image: "/images/ICONSforMaterial/patterncir.png", price: "200$", filterTags: ["patterned"], patternUrl: "/images/ICONSforMaterial/patterncir.png" },
    { name: "Leaf Pattern", image: "/images/ICONSforMaterial/patternleaf.png", price: "Option B", filterTags: ["blue", "smooth"], patternUrl: "/images/ICONSforMaterial/patternleaf.png" },
  ];

  const filteredPatterns = patterns.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );

  const setTemporaryInstruction = (text: string) => {
    if (instructionTimeoutRef.current) clearTimeout(instructionTimeoutRef.current);
    setInstruction(text);
    instructionTimeoutRef.current = setTimeout(() => setInstruction(""), 3000);
  };

  useEffect(() => {
    setTemporaryInstruction("Click 'Start Camera' or upload an image to begin.");

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    rendererRef.current = renderer;

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, {
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "20",
        width: "100%",
        height: "100%",
      });
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    sceneRef.current.add(directionalLight);

    animate();

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (cameraRef.current && rendererRef.current) {
        rendererRef.current.setSize(newWidth, newHeight);
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        updateCameraPosition(newWidth, newHeight);
        if (backgroundPlaneRef.current && capturedImage) {
          adjustBackgroundPlane(newWidth, newHeight);
        }
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cleanupThreeJs();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const cleanupThreeJs = () => {
    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (instructionTimeoutRef.current) clearTimeout(instructionTimeoutRef.current);
  };

  const updateCameraPosition = (width: number, height: number) => {
    if (!cameraRef.current) return;
    const fovRad = cameraRef.current.fov * (Math.PI / 180);
    const distance = (height / 100 / 2) / Math.tan(fovRad / 2);
    cameraRef.current.aspect = width / height;
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
  };

  const adjustBackgroundPlane = (width: number, height: number) => {
    if (!backgroundPlaneRef.current || !cameraRef.current) return;
    const material = backgroundPlaneRef.current.material as THREE.MeshBasicMaterial;
    const texture = material.map;
    if (!texture) return;

    const screenAspect = width / height;
    const imgAspect = texture.image.width / texture.image.height;

    let planeWidth = width / 100;
    let planeHeight = height / 100;
    if (imgAspect > screenAspect) {
      planeHeight = planeWidth / imgAspect;
    } else {
      planeWidth = planeHeight * imgAspect;
    }

    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    backgroundPlaneRef.current.geometry.dispose();
    backgroundPlaneRef.current.geometry = planeGeometry;
    backgroundPlaneRef.current.position.set(0, 0, -0.1);
    updateCameraPosition(width, height);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    overlayImageRef.current = document.createElement("img");
    overlayImageRef.current.src = "images/overlayFilter1.png";
    overlayImageRef.current.className = "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";
    mount.appendChild(overlayImageRef.current);

    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    videoRef.current.className = "absolute inset-0 w-full h-full object-cover z-[10]";
    mount.appendChild(videoRef.current);

    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className = "fixed bottom-16 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300 opacity-100";
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    uploadButtonRef.current = document.createElement("button");
    uploadButtonRef.current.id = "uploadButton";
    uploadButtonRef.current.textContent = "Upload Image";
    uploadButtonRef.current.className = "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300 opacity-100";
    document.body.appendChild(uploadButtonRef.current);
    uploadButtonRef.current.addEventListener("click", () => fileInputRef.current?.click());

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.id = "saveButton";
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className = "fixed bottom-16 right-5 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300 opacity-100 hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    return () => {
      if (overlayImageRef.current && mount) mount.removeChild(overlayImageRef.current);
      if (videoRef.current && mount) mount.removeChild(videoRef.current);
      [controlButtonRef, uploadButtonRef, saveButtonRef].forEach(ref => {
        if (ref.current && document.body.contains(ref.current)) {
          document.body.removeChild(ref.current);
        }
      });
    };
  }, []);

  const handleButtonClick = () => {
    const button = controlButtonRef.current;
    if (!button) return;

    switch (button.textContent) {
      case "Start Camera":
        startCameraStream();
        setTemporaryInstruction("Point your camera and click 'Capture' to take a photo.");
        uploadButtonRef.current?.style.setProperty("display", "none");
        break;
      case "Capture":
        captureImage();
        setTemporaryInstruction("Draw a box on the image to place the 3D model.");
        break;
      case "Submit":
        submitAndShowMenu();
        setTemporaryInstruction("Select a blind type and pattern, then click 'Save Image' to download.");
        break;
    }
  };

  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          videoRef.current!.onloadedmetadata = () => adjustVideoAspect();
          overlayImageRef.current?.classList.remove("hidden");
          controlButtonRef.current!.textContent = "Capture";
          updateCameraPosition(window.innerWidth, window.innerHeight);
        });
      }
    } catch (err) {
      console.error("Camera stream error:", err);
      setTemporaryInstruction("Failed to access camera. Please upload an image instead.");
    }
  };

  const adjustVideoAspect = () => {
    if (!videoRef.current) return;
    const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
    const screenAspect = window.innerWidth / window.innerHeight;
    videoRef.current.style.width = videoAspect > screenAspect ? "100%" : "auto";
    videoRef.current.style.height = videoAspect > screenAspect ? "auto" : "100%";
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      localStorage.setItem("capturedImage", imageData);
      setCapturedImage(imageData);
      loadUploadedImage(imageData);
      setTemporaryInstruction("Draw a box on the image to place the 3D model.");
      controlButtonRef.current!.textContent = "Submit";
      uploadButtonRef.current?.style.setProperty("display", "none");
    };
    reader.readAsDataURL(file);
  };

  const loadUploadedImage = (imageData: string) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const { innerWidth: width, innerHeight: height } = window;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    loadTextureAndCreatePlane(imageData, width, height);
    initSelectionBox();
  };

  const captureImage = () => {
    if (!videoRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL("image/png");
    localStorage.setItem("capturedImage", imageData);
    setCapturedImage(imageData);

    cleanupCameraStream();
    loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
    initSelectionBox();
    controlButtonRef.current!.textContent = "Submit";
  };

  const cleanupCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      videoRef.current!.srcObject = null;
      videoRef.current!.classList.add("hidden");
      overlayImageRef.current?.classList.add("hidden");
    }
  };

  const loadTextureAndCreatePlane = (imageData: string, width: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      if (backgroundPlaneRef.current) {
        sceneRef.current!.remove(backgroundPlaneRef.current);
        backgroundPlaneRef.current.geometry.dispose();
        const material = backgroundPlaneRef.current.material;
        if (Array.isArray(material)) {
          material.forEach(mat => mat.dispose());
        } else {
          material.dispose();
        }
      }

      texture.colorSpace = THREE.SRGBColorSpace;

      const screenAspect = width / height;
      const imgAspect = texture.image.width / texture.image.height;
      let planeWidth = width / 100;
      let planeHeight = height / 100;
      if (imgAspect > screenAspect) {
        planeHeight = planeWidth / imgAspect;
      } else {
        planeWidth = planeHeight * imgAspect;
      }

      const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), planeMaterial);
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current!.add(plane);
      updateCameraPosition(width, height);
    });
  };

  const initSelectionBox = () => {
    if (selectionBoxRef.current || hasSelectionBox.current || !mountRef.current) return;

    selectionBoxRef.current = document.createElement("div");
    selectionBoxRef.current.className = "absolute border-2 border-dashed border-[#2F3526] bg-[#2F3526] bg-opacity-20 hidden pointer-events-auto";
    selectionBoxRef.current.style.zIndex = "25";
    mountRef.current.appendChild(selectionBoxRef.current);

    let startX = 0, startY = 0, isDragging = false;

    const startSelection = (x: number, y: number) => {
      if (hasSelectionBox.current) return;
      startX = x;
      startY = y;
      if (selectionBoxRef.current) {
        Object.assign(selectionBoxRef.current.style, {
          left: `${startX}px`,
          top: `${startY}px`,
          width: "0px",
          height: "0px",
        });
        selectionBoxRef.current.classList.remove("hidden");
        isDragging = true;
      }
    };

    const updateSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      Object.assign(selectionBoxRef.current.style, {
        width: `${Math.abs(x - startX)}px`,
        height: `${Math.abs(y - startY)}px`,
        left: `${Math.min(startX, x)}px`,
        top: `${Math.min(startY, y)}px`,
      });
    };

    const endSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      selectionBoxRef.current.classList.add("hidden");
      hasSelectionBox.current = true;
      isDragging = false;
      create3DModelFromSelection(startX, startY, x, y);
    };

    const eventHandlers = {
      mousedown: (e: MouseEvent) => !hasSelectionBox.current && e.button === 0 && startSelection(e.offsetX, e.offsetY),
      mousemove: (e: MouseEvent) => isDragging && updateSelection(e.offsetX, e.offsetY),
      mouseup: (e: MouseEvent) => isDragging && endSelection(e.offsetX, e.offsetY),
      touchstart: (e: TouchEvent) => {
        e.preventDefault();
        if (!hasSelectionBox.current) {
          const touch = e.touches[0];
          const rect = mountRef.current!.getBoundingClientRect();
          startSelection(touch.clientX - rect.left, touch.clientY - rect.top);
        }
      },
      touchmove: (e: TouchEvent) => {
        if (isDragging) {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = mountRef.current!.getBoundingClientRect();
          updateSelection(touch.clientX - rect.left, touch.clientY - rect.top);
        }
      },
      touchend: (e: TouchEvent) => {
        if (isDragging) {
          e.preventDefault();
          const touch = e.changedTouches[0];
          const rect = mountRef.current!.getBoundingClientRect();
          endSelection(touch.clientX - rect.left, touch.clientY - rect.top);
        }
      },
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => mountRef.current!.addEventListener(event, handler as EventListener));
    return () => Object.entries(eventHandlers).forEach(([event, handler]) => mountRef.current!.removeEventListener(event, handler as EventListener));
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
    const dir = vector.sub(cameraRef.current.position).normalize();
    const distance = -cameraRef.current.position.z / dir.z;
    return cameraRef.current.position.clone().add(dir.multiplyScalar(distance));
  };

  const create3DModelFromSelection = (startX: number, startY: number, endX: number, endY: number) => {
    if (!sceneRef.current || modelsRef.current.length > 0) return;

    const worldStart = screenToWorld(startX, startY);
    const worldEnd = screenToWorld(endX, endY);
    const targetWidth = Math.abs(worldEnd.x - worldStart.x);
    const targetHeight = Math.abs(worldEnd.y - worldStart.y);

    const blindType = selectedBlindType ? blindTypes.find(b => b.type === selectedBlindType) : blindTypes[0];
    const modelUrl = blindType?.modelUrl || "/models/shadeBake.glb";
    const meshName = blindType?.meshName;
    loadModel(modelUrl, targetWidth, targetHeight, worldStart, worldEnd, meshName);
  };

  const loadModel = (
    modelUrl: string,
    targetWidth: number,
    targetHeight: number,
    worldStart: THREE.Vector3,
    worldEnd: THREE.Vector3,
    meshName?: string
  ) => {
    new GLTFLoader().load(modelUrl, (gltf) => {
      const model = gltf.scene;
      applyTextureToModel(model, selectedPattern || "/images/ICONSforMaterial/pattern4.png", meshName, () => {
        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize);

        model.scale.set(targetWidth / modelSize.x, targetHeight / modelSize.y, 0.01);

        const modelCenter = box.setFromObject(model).getCenter(new THREE.Vector3());
        model.position.set(
          (worldStart.x + worldEnd.x) / 2 - (modelCenter.x - model.position.x),
          (worldStart.y + worldEnd.y) / 2 - (modelCenter.y - model.position.y),
          0.1
        );

        sceneRef.current!.add(model);
        modelsRef.current.push({ model, gltf });
      });
    });
  };

  const applyTextureToModel = (
    model: THREE.Group,
    patternUrl: string,
    meshName: string | undefined,
    callback: () => void
  ) => {
    new THREE.TextureLoader().load(patternUrl, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      texture.colorSpace = THREE.SRGBColorSpace;

      const newMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.1,
      });

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.computeBoundingBox();
          if (meshName) {
            if (mesh.name === meshName) {
              mesh.material = newMaterial;
              mesh.material.needsUpdate = true;
            }
          } else {
            mesh.material = newMaterial;
            mesh.material.needsUpdate = true;
          }
        }
      });
      callback();
    });
  };

  const saveImage = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !capturedImage) return;

    setShowBlindMenu(false);
    saveButtonRef.current?.style.setProperty("display", "none");

    const { innerWidth: width, innerHeight: height } = window;
    rendererRef.current.setSize(width, height);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    const canvas = document.createElement("canvas");
    const material = backgroundPlaneRef.current?.material as THREE.MeshBasicMaterial | undefined;
    const texture = material?.map;
    canvas.width = texture?.image.width || width;
    canvas.height = texture?.image.height || height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [backgroundImg, renderImg, logoImg] = [new Image(), new Image(), new Image()];
    const loadImage = (img: HTMLImageElement, src: string) => new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = src;
    });

    try {
      await loadImage(backgroundImg, capturedImage);
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

      renderImg.src = rendererRef.current.domElement.toDataURL("image/png");
      await loadImage(renderImg, renderImg.src);
      ctx.drawImage(renderImg, 0, 0, canvas.width, canvas.height);

      await loadImage(logoImg, "/images/baelogoN.png");
      ctx.drawImage(logoImg, (canvas.width - 96) / 2, 16, 96, 96);

      const link = document.createElement("a");
      link.download = "custom_blind_image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error saving image:", error);
    } finally {
      setShowBlindMenu(true);
      saveButtonRef.current?.style.setProperty("display", "block");
    }
  };

  const submitAndShowMenu = () => {
    setShowBlindMenu(true);
    setIsCustomizerView(true);
    if (controlButtonRef.current && document.body.contains(controlButtonRef.current)) {
      document.body.removeChild(controlButtonRef.current);
      controlButtonRef.current = null;
    }
    if (uploadButtonRef.current && document.body.contains(uploadButtonRef.current)) {
      document.body.removeChild(uploadButtonRef.current);
      uploadButtonRef.current = null;
    }
    saveButtonRef.current?.classList.remove("hidden");
    // Ensure the body remains scrollable
    document.body.style.overflow = "auto";
    // Allow touch scrolling over the Three.js canvas
    if (rendererRef.current) {
      rendererRef.current.domElement.style.pointerEvents = "none";
    }
  };

  const selectBlindType = (type: string) => {
    setSelectedBlindType(type);
    if (modelsRef.current.length > 0) updateExistingModel(type);
    renderScene();
  };

  const selectPattern = (patternUrl: string) => {
    setSelectedPattern(patternUrl);
    if (modelsRef.current.length > 0) updateExistingModelPattern(patternUrl);
    renderScene();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => e.target.checked ? [...prev, value] : prev.filter(tag => tag !== value));
  };

  const updateExistingModel = (type: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0) return;

    const { model } = modelsRef.current[0];
    const position = model.position.clone();
    const scale = model.scale.clone();
    sceneRef.current.remove(model);

    const blindType = blindTypes.find(b => b.type === type);
    const modelUrl = blindType?.modelUrl || "/models/shadeBake.glb";
    const meshName = blindType?.meshName;

    new GLTFLoader().load(modelUrl, (gltf) => {
      const newModel = gltf.scene;
      applyTextureToModel(newModel, selectedPattern || "/images/ICONSforMaterial/pattern4.png", meshName, () => {
        newModel.scale.copy(scale);
        newModel.position.copy(position);
        sceneRef.current!.add(newModel);
        modelsRef.current[0] = { model: newModel, gltf };
        renderScene();
      });
    });
  };

  const updateExistingModelPattern = (patternUrl: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0) return;
    const blindType = selectedBlindType ? blindTypes.find(b => b.type === selectedBlindType) : blindTypes[0];
    const meshName = blindType?.meshName;
    applyTextureToModel(modelsRef.current[0].model, patternUrl, meshName, renderScene);
  };

  const renderScene = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    mixersRef.current.forEach(mixer => mixer.update(0.016));
    renderScene();
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage: !capturedImage && !isCustomizerView ? "url('/images/background.jpg')" : "none",
        backgroundColor: capturedImage || isCustomizerView ? "#F5F5DC" : "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div ref={mountRef} className="relative w-full h-screen" />
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
        <img src="/images/baelogoN.png" alt="Logo" className="w-24 h-24 object-contain" />
      </div>
      {instruction && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[100] text-brown-800 text-lg">
          {instruction}
        </div>
      )}
      <input
        type="file"
        id="imageUpload"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {showBlindMenu && isCustomizerView && (
        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen overflow-y-auto">
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