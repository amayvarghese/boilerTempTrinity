import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Types and Constants
type Vector3D = { x: number; y: number; z: number };
type BlindType = {
  type: string;
  buttonImage: string;
  modelUrl: string;
  meshNameFabric?: string;
  meshNameWood?: string;
  rotation: Vector3D;
  baseScale: Vector3D;
  basePosition: Vector3D;
};
type Pattern = {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
  patternUrl: string;
};
type ModelData = { model: THREE.Group; gltf?: any };
type SelectionBoxParams = {
  targetWidth: number;
  targetHeight: number;
  worldStart: THREE.Vector3;
  worldEnd: THREE.Vector3;
};
type InitialModelParams = { scale: THREE.Vector3; position: THREE.Vector3 };

const BLIND_TYPES: BlindType[] = [
  { type: "classicRoman", buttonImage: "/images/blindTypes/romanBlindIcon.png", modelUrl: "/models/classicRomanNew.glb", meshNameFabric: "Cloth", meshNameWood:"Cube", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 3 }, basePosition: { x: -45, y: -25, z: 10 } },
  { type: "roller", buttonImage: "/images/blindTypes/rollerBlindIcon.png", modelUrl: "/3d/ROLLER_SHADES.glb", meshNameFabric: "ROLLER_SHADES",  meshNameWood:"Cube",rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.5, y: 2.1, z: 1 }, basePosition: { x: -45.5, y: -30, z: 5 } },
  { type: "roman", buttonImage: "/images/blindTypes/romanBlindIcon.png", modelUrl: "/3d/ROMAN_SHADES_01.glb", meshNameFabric: "polySurface1", meshNameWood: "polySurface3", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 1 }, basePosition: { x: -45, y: -20, z: 5 } },
  { type: "Sheet Blind", buttonImage: "/images/blindTypes/sheetBlindIcon.png", modelUrl: "/models/curtainBlindN.glb", meshNameFabric: "Cloth", meshNameWood: "Rod", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 2 }, basePosition: { x: -45, y: -28, z: 10 } },
  { type: "PlantationShutter", buttonImage: "/images/blindTypes/plantationShutterIcon.png", modelUrl: "/3d/PlantationShutter.glb", meshNameWood: "PLANTATION__SHUTTER", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.5, y: 2, z: 1 }, basePosition: { x: -46, y: -27, z: 5 } },
  { type: "VerticalBlind", buttonImage: "/images/blindTypes/verticalSheetBlindIcon.png", modelUrl: "/3d/VerticalSheet.glb", meshNameWood: "Wood", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.45, y: 2.1, z: 1 }, basePosition: { x: -45, y: -28, z: 5 } },
  { type: "zebraBlinds", buttonImage: "/images/blindTypes/zebraBlindIcon.png", modelUrl: "/3d/zebra_blinds.glb",  meshNameWood:"Cube", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 1 }, basePosition: { x: -45, y: -20, z: 5 } },
];

const PATTERNS: Pattern[] = [
  { name: "Beige", image: "/materials/beige.png", price: "$10", filterTags: ["solid"], patternUrl: "/materials/beige.png" },
  { name: "Blanche", image: "/materials/Blanche.png", price: "$67", filterTags: ["pattern"], patternUrl: "/materials/Blanche.png" },
  { name: "Cerrulean", image: "/materials/cerulean.png", price: "$10", filterTags: ["pattern"], patternUrl: "/materials/cerulean.png" },
  { name: "Chestnut", image: "/materials/chestnut.png", price: "$100", filterTags: ["kids", "pattern"], patternUrl: "/materials/chestnut.png" },
  { name: "Driftwood", image: "/materials/driftwood.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwood.png" },
  { name: "Driftwood Sand", image: "/materials/driftwoodsand.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwoodsand.png" },
  { name: "Iron", image: "/materials/iron.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/iron.png" },
  { name: "Ivory", image: "/materials/ivory.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/ivory.png" },
  { name: "Kaki", image: "/materials/kaki.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/kaki.png" }, // Fixed STARTfilterTags to filterTags
  { name: "Mocha", image: "/materials/mocha.png", price: "$45", filterTags: ["pattern", "natural"], patternUrl: "/materials/mocha.png" },
  { name: "Noir", image: "/materials/noir.png", price: "$150", filterTags: ["pattern", "natural"], patternUrl: "/materials/noir.png" },
  { name: "Oatmeal", image: "/materials/oatmeal.png", price: "$150", filterTags: ["natural", "pattern"], patternUrl: "/materials/oatmeal.png" },
  { name: "Slate", image: "/materials/slate.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/slate.png" },
  { name: "Silver", image: "/materials/SolarSilver.png", price: "$100", filterTags: ["solid", "solar"], patternUrl: "/materials/SolarSilver.png" },
  { name: "Steel", image: "/materials/steel.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/steel.png" },
  { name: "Taupe", image: "/materials/taupe.png", price: "$45", filterTags: ["pattern"], patternUrl: "/materials/taupe.png" },
  { name: "Taupe Solar", image: "/materials/taupeSolar.png", price: "$100", filterTags: ["solar"], patternUrl: "/materials/taupeSolar.png" },
  { name: "Tea Leaves Brown", image: "/materials/tealeaves_brown.png", price: "$150", filterTags: ["pattern"], patternUrl: "/materials/tealeaves_brown.png" },
  { name: "Tea Leaves White", image: "/materials/tealeaves_white.png", price: "$150", filterTags: ["patterned"], patternUrl: "/materials/tealeaves_white.png" },
  { name: "Toast", image: "/materials/toast.png", price: "$45", filterTags: ["pattern"], patternUrl: "/materials/toast.png" },
  { name: "White", image: "/materials/white.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/white.png" },
];

// Utility Functions
const isMesh = (object: THREE.Object3D): object is THREE.Mesh => "isMesh" in object && (object.isMesh as boolean);

const FilterPageUI: React.FC = () => {
  // State and Refs (unchanged)
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeProcess, setActiveProcess] = useState<{ id: string; instruction: string; completed: boolean }>({
    id: "initial",
    instruction: "Click 'Start Camera' or upload an image to begin.",
    completed: false,
  });
  const [isSelectionBoxUsed, setIsSelectionBoxUsed] = useState(false);

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const redoButtonRef = useRef<HTMLButtonElement | null>(null);
  const levelIndicatorRef = useRef<HTMLDivElement | null>(null);
  const addWindowButtonRef = useRef<HTMLButtonElement | null>(null);
  const modelsRef = useRef<ModelData[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectionBoxParamsRef = useRef<SelectionBoxParams | null>(null);
  const initialModelParamsRef = useRef<InitialModelParams | null>(null);
  const preloadedModelsRef = useRef<Map<string, ModelData>>(new Map());
  const isProcessingRef = useRef<boolean>(false);
  const changeQueueRef = useRef<{ type: "blind" | "pattern"; value: string }[]>([]);
  const draggingModelRef = useRef<THREE.Group | null>(null);
  const overlayImage = useRef<HTMLImageElement | null>(null);

  const filteredPatterns = PATTERNS.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );
  const instruction = activeProcess && typeof activeProcess.completed === "boolean"
    ? (!activeProcess.completed ? activeProcess.instruction : "")
    : "";

  const setNewProcess = (id: string, instruction: string) =>
    setActiveProcess({ id, instruction, completed: false });
  const completeCurrentProcess = () =>
    setActiveProcess((prev) => ({ ...prev, completed: true }));

  // Debug initial state
  useEffect(() => {
    console.log("Initial capturedImage:", capturedImage);
    console.log("Initial isCustomizerView:", isCustomizerView);
    localStorage.removeItem("capturedImage");
  }, []);

  // Preload Overlay Image Once
  useEffect(() => {
    const img = new Image();
    img.src = "/images/overlayFilterUpdate.png";
    img.onload = () => (overlayImage.current = img);
  }, []);

  // Three.js Initialization and Cleanup
  useEffect(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    rendererRef.current = renderer;
    mountRef.current?.appendChild(renderer.domElement);

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    sceneRef.current.add(directionalLight);

    const secondaryLight = new THREE.DirectionalLight(0xffffff, 1);
    secondaryLight.position.set(-5, 5, -5);
    sceneRef.current.add(secondaryLight);

    animate();

    const handleResize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateCameraPosition(width, height);
      if (backgroundPlaneRef.current && capturedImage) adjustBackgroundPlane(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      cleanupThreeJs();
    };
  }, []);

  // Preload Models
  useEffect(() => {
    const preloadModels = async () => {
      setIsLoading(true);
      const loader = new GLTFLoader();
      try {
        await Promise.all(
          Array.from(new Set(BLIND_TYPES.map((b) => b.modelUrl))).map(
            (url) =>
              new Promise<void>((resolve, reject) =>
                loader.load(
                  url,
                  (gltf) => {
                    preloadedModelsRef.current.set(url, { model: gltf.scene.clone(), gltf });
                    resolve();
                  },
                  undefined,
                  (error) => reject(error)
                )
              )
          )
        );
      } catch (error) {
        console.error("Preloading failed:", error);
      }
      setIsLoading(false);
    };
    preloadModels();
  }, []);

  // UI Elements Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const addElement = <T extends HTMLElement>(
      tag: keyof HTMLElementTagNameMap,
      props: Record<string, any>,
      parent: HTMLElement = document.body
    ): T => {
      const el = Object.assign(document.createElement(tag), props) as T;
      parent.appendChild(el);
      return el;
    };

    videoRef.current = addElement<HTMLVideoElement>("video", { playsinline: true, muted: true, controls: false, className: "hidden" }, mount);
    canvasRef.current = addElement<HTMLCanvasElement>("canvas", { className: "absolute inset-0 w-full h-full object-cover z-[10]" }, mount);
    controlButtonRef.current = addElement<HTMLButtonElement>("button", { id: "controlButton", textContent: "Start Camera", className: "fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300" });
    controlButtonRef.current?.addEventListener("click", handleButtonClick);
    uploadButtonRef.current = addElement<HTMLButtonElement>("button", { id: "uploadButton", textContent: "Upload Image", className: "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300" });
    uploadButtonRef.current?.addEventListener("click", () => fileInputRef.current?.click());
    saveButtonRef.current = addElement<HTMLButtonElement>("button", { id: "saveButton", textContent: "Save Image", className: "fixed bottom-16 right-5 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300 hidden" });
    saveButtonRef.current?.addEventListener("click", saveImage);
    redoButtonRef.current = addElement<HTMLButtonElement>("button", { id: "redoButton", className: "fixed bottom-12 right-5 p-2 bg-[#2F3526] text-white rounded-full shadow-md hover:bg-[#3F4536] z-[100] transition duration-300 hidden" });
    redoButtonRef.current?.appendChild(addElement("img", { src: "/images/retryButtonImg.png", alt: "Redo Selection", className: "h-6 w-6" }));
    redoButtonRef.current?.addEventListener("click", handleRedoSelection);
    addWindowButtonRef.current = addElement<HTMLButtonElement>("button", { id: "addWindowButton", textContent: "Add Blind", className: "fixed bottom-12 left-5 py-2 px-4 text-md bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300 hidden" });
    addWindowButtonRef.current?.addEventListener("click", addAnotherWindow);
    addElement("button", { id: "backButton", innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>', className: "absolute top-5 left-5 p-2 bg-black text-white rounded-full shadow-md hover:bg-purple-900 z-[100] transition duration-300" }).addEventListener("click", () => window.location.href = "/");
    levelIndicatorRef.current = addElement<HTMLDivElement>("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-2 bg-red-500 rounded-full z-[100] hidden", style: { transition: "background-color 0.3s ease, border 0.3s ease" } }, mount);
    const mobileOverlayRef = addElement<HTMLDivElement>("div", { id: "mobileOverlay", className: "fixed inset-0 z-[35] pointer-events-none hidden md:hidden" }, mount);

    return () => {
      [videoRef, canvasRef, levelIndicatorRef].forEach((ref) => ref.current && mount.removeChild(ref.current));
      [controlButtonRef, uploadButtonRef, saveButtonRef, redoButtonRef, addWindowButtonRef].forEach((ref) => ref.current && document.body.removeChild(ref.current));
      mobileOverlayRef && mount.removeChild(mobileOverlayRef);
    };
  }, []);

  const updateCameraPosition = (width: number, height: number) => {
    if (!cameraRef.current) return;
    const distance = (height / 100 / 2) / Math.tan((cameraRef.current.fov * Math.PI / 180) / 2);
    cameraRef.current.aspect = width / height;
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
  };

  const adjustBackgroundPlane = (width: number, height: number) => {
    if (!backgroundPlaneRef.current || !cameraRef.current) return;
    const texture = (backgroundPlaneRef.current.material as THREE.MeshBasicMaterial).map;
    if (!texture) return;
    const aspect = width / height;
    const imgAspect = texture.image.width / texture.image.height;
    const [planeWidth, planeHeight] = imgAspect > aspect ? [width / 100, (width / 100) / imgAspect] : [(height / 100) * imgAspect, height / 100];
    backgroundPlaneRef.current.geometry.dispose();
    backgroundPlaneRef.current.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    backgroundPlaneRef.current.position.set(0, 0, -0.1);
    updateCameraPosition(width, height);
  };

  const startCameraStream = async () => {
    setNewProcess("camera", "Place the window like it aligns with the edges of the box");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { min: 1280, ideal: 1920, max: 3840 },
          height: { min: 720, ideal: 1080, max: 2160 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, max: 60 },
        },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current && canvasRef.current && controlButtonRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = window.innerWidth * window.devicePixelRatio;
          canvas.height = window.innerHeight * window.devicePixelRatio;
          canvas.style.width = `${window.innerWidth}px`;
          canvas.style.height = `${window.innerHeight}px`;
          canvas.classList.remove("hidden");
          adjustCanvasAspect();
          const drawFrame = () => {
            if (!videoRef.current || !canvasRef.current || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight; // Fixed typo here
            const canvasAspect = canvas.width / canvas.height;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (videoAspect > canvasAspect) {
              drawWidth = canvas.width;
              drawHeight = canvas.width / videoAspect;
              offsetX = 0;
              offsetY = (canvas.height - drawHeight) / 2;
            } else {
              drawWidth = canvas.height * videoAspect;
              drawHeight = canvas.height;
              offsetX = (canvas.width - drawWidth) / 2;
              offsetY = 0;
            }
            ctx.drawImage(videoRef.current, offsetX, offsetY, drawWidth, drawHeight);
            if (overlayImage.current) {
              ctx.globalAlpha = 0.7;
              ctx.drawImage(overlayImage.current, 0, 0, canvas.width, canvas.height);
              ctx.globalAlpha = 1.0;
            }
            requestAnimationFrame(drawFrame);
          };
          if (controlButtonRef.current) {
            controlButtonRef.current.textContent = "Capture";
            controlButtonRef.current.classList.remove("hidden");
            controlButtonRef.current.style.zIndex = "100";
          }
          uploadButtonRef.current?.style.setProperty("display", "none");
          levelIndicatorRef.current?.classList.remove("hidden");
          requestOrientationPermission();
          drawFrame();
        }).catch((err) => {
          console.error("Video play failed:", err);
          setNewProcess("camera-error", "Failed to start camera preview.");
        });
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setNewProcess("camera-error", "Failed to access camera. Please upload an image instead.");
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current || !videoRef.current) return;
    setNewProcess("capture", "Draw a box on the image to place the 3D model.");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.width = `${video.videoWidth}px`;
    canvas.style.height = `${video.videoHeight}px`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    console.log("Captured image data:", imageData.substring(0, 50));
    setCapturedImage(imageData);
    localStorage.setItem("capturedImage", imageData);
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    cleanupCameraStream();
    loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
    initSelectionBox();
    if (controlButtonRef.current) {
      controlButtonRef.current.textContent = "Submit";
      controlButtonRef.current.classList.remove("hidden");
    }
    levelIndicatorRef.current?.classList.add("hidden");
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    completeCurrentProcess();
  };

  const handleImageUpload = (file: File) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    setNewProcess("upload", "Draw a box on the image to place the 3D model.");
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      console.log("Uploaded image data:", imageData.substring(0, 50));
      setCapturedImage(imageData);
      localStorage.setItem("capturedImage", imageData);
      cleanupCameraStream();
      loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
      initSelectionBox();
      controlButtonRef.current!.textContent = "Submit";
      uploadButtonRef.current?.style.setProperty("display", "none");
      redoButtonRef.current?.classList.remove("hidden");
      completeCurrentProcess();
    };
    reader.readAsDataURL(file);
  };

  const loadTextureAndCreatePlane = (imageData: string, width: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = width / height;
      const imgAspect = texture.image.width / texture.image.height;
      const [planeWidth, planeHeight] = imgAspect > aspect ? [width / 100, (width / 100) / imgAspect] : [(height / 100) * imgAspect, height / 100];
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      if (backgroundPlaneRef.current) sceneRef.current.remove(backgroundPlaneRef.current);
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current.add(plane);
      updateCameraPosition(width, height);
    });
  };

  const initSelectionBox = () => {
    if (isSelectionBoxUsed || !mountRef.current || selectionBoxRef.current) return;
    selectionBoxRef.current = Object.assign(document.createElement("div"), {
      className: "absolute border-2 border-dashed border-[#2F3526] bg-[#2F3526] bg-opacity-20 pointer-events-auto",
      style: { zIndex: "25", transition: "none" },
    });
    mountRef.current.appendChild(selectionBoxRef.current);

    let startX = 0, startY = 0, isDragging = false;

    const startSelection = (e: MouseEvent | Touch) => {
      if (isSelectionBoxUsed) return;
      const rect = mountRef.current!.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      if (selectionBoxRef.current) {
        Object.assign(selectionBoxRef.current.style, { left: `${startX}px`, top: `${startY}px`, width: "0px", height: "0px", display: "block" });
        isDragging = true;
      }
    };

    const updateSelection = (e: MouseEvent | Touch) => {
      if (!isDragging || !selectionBoxRef.current) return;
      const rect = mountRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      requestAnimationFrame(() => {
        if (selectionBoxRef.current) {
          Object.assign(selectionBoxRef.current.style, {
            width: `${Math.abs(x - startX)}px`,
            height: `${Math.abs(y - startY)}px`,
            left: `${Math.min(startX, x)}px`,
            top: `${Math.min(startY, y)}px`,
          });
        }
      });
    };

    const endSelection = (e: MouseEvent | Touch) => {
      if (!isDragging || !selectionBoxRef.current) return;
      selectionBoxRef.current.style.display = "none";
      isDragging = false;
      const rect = mountRef.current!.getBoundingClientRect();
      createDefaultModel(startX, startY, e.clientX - rect.left, e.clientY - rect.top);
      setIsSelectionBoxUsed(true);
      cleanupSelectionBox();
    };

    const handlers = {
      mousedown: (e: MouseEvent) => { if (e.button === 0) startSelection(e); },
      mousemove: (e: MouseEvent) => updateSelection(e),
      mouseup: (e: MouseEvent) => endSelection(e),
      touchstart: (e: TouchEvent) => startSelection(e.touches[0]),
      touchmove: (e: TouchEvent) => updateSelection(e.touches[0]),
      touchend: (e: TouchEvent) => endSelection(e.changedTouches[0]),
    };

    Object.entries(handlers).forEach(([event, handler]) =>
      mountRef.current!.addEventListener(event, handler as EventListener, { passive: false })
    );

    const cleanupSelectionBox = () => {
      Object.entries(handlers).forEach(([event, handler]) =>
        mountRef.current?.removeEventListener(event, handler as EventListener)
      );
      if (selectionBoxRef.current && mountRef.current) {
        mountRef.current.removeChild(selectionBoxRef.current);
        selectionBoxRef.current = null;
      }
    };
  };

  const createDefaultModel = async (startX: number, startY: number, endX: number, endY: number) => {
    if (isProcessingRef.current || !sceneRef.current || !cameraRef.current) return;
    isProcessingRef.current = true;
    setIsLoading(true);

    const rect = mountRef.current!.getBoundingClientRect();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const adjustedStartY = isMobile ? startY - rect.top : startY;
    const adjustedEndY = isMobile ? endY - rect.top : endY;

    const worldStart = screenToWorld(startX, adjustedStartY, -0.1);
    const worldEnd = screenToWorld(endX, adjustedEndY, -0.1);

    selectionBoxParamsRef.current = {
      targetWidth: Math.abs(worldEnd.x - worldStart.x),
      targetHeight: Math.abs(worldEnd.y - worldStart.y),
      worldStart,
      worldEnd,
    };

    const defaultBlindType = BLIND_TYPES[0];
    let modelData = preloadedModelsRef.current.get(defaultBlindType.modelUrl);
    if (!modelData) {
      modelData = await loadModel(defaultBlindType.modelUrl);
      preloadedModelsRef.current.set(defaultBlindType.modelUrl, modelData);
    }

    const model = modelData.model.clone();
    applyTextureToModel(model, selectedPattern || "/materials/mocha.png", defaultBlindType);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const scale = new THREE.Vector3(
      selectionBoxParamsRef.current.targetWidth / size.x,
      selectionBoxParamsRef.current.targetHeight / size.y,
      0.01
    );
    model.scale.copy(scale);

    const targetX = (worldStart.x + worldEnd.x) / 2 - center.x * scale.x;
    const targetY = (worldStart.y + worldEnd.y) / 2 - center.y * scale.y;

    const yOffset = isMobile ? -0.5 : 0;
    model.position.set(targetX, targetY + yOffset, 0.1);
    initialModelParamsRef.current = { scale, position: model.position.clone() };

    model.traverse((child) => {
      if (isMesh(child)) child.visible = true;
    });

    model.userData.isDraggable = !isSubmitted;

    sceneRef.current.add(model);
    modelsRef.current.push({ model, gltf: modelData.gltf });
    if (!isCustomizerView) addWindowButtonRef.current?.classList.remove("hidden");

    fadeInModel(model);
    renderScene();

    isProcessingRef.current = false;
    setIsLoading(false);
    completeCurrentProcess();
    redoButtonRef.current?.classList.remove("hidden");
  };

  const addAnotherWindow = () => {
    if (modelsRef.current.length === 0) return;
    const sourceModel = modelsRef.current[modelsRef.current.length - 1].model;
    const modelData = preloadedModelsRef.current.get(BLIND_TYPES.find(b => b.type === selectedBlindType)?.modelUrl || BLIND_TYPES[0].modelUrl);
    if (!modelData) return;

    const newModel = modelData.model.clone();
    newModel.position.copy(sourceModel.position);
    newModel.position.x += 2;
    newModel.scale.copy(sourceModel.scale);
    newModel.userData.isDraggable = !isSubmitted;

    applyTextureToModel(newModel, selectedPattern || "/materials/mocha.png", BLIND_TYPES.find(b => b.type === selectedBlindType) || BLIND_TYPES[0]);
    sceneRef.current.add(newModel);
    modelsRef.current.push({ model: newModel, gltf: modelData.gltf });

    fadeInModel(newModel);
    renderScene();
  };

  const setupDragging = () => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current || isSubmitted) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const findParentModel = (object: THREE.Object3D): THREE.Group | null => {
      let current: THREE.Object3D | null = object;
      while (current) {
        const model = modelsRef.current.find(m => m.model === current);
        if (model) return model.model;
        current = current.parent;
      }
      return null;
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      mouse.x = ((e.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((e.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(modelsRef.current.map(m => m.model), true);
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const model = findParentModel(intersected);
        if (model && model.userData.isDraggable) {
          draggingModelRef.current = model;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingModelRef.current || !cameraRef.current) return;
      const worldPos = screenToWorld(
        e.clientX - mountRef.current!.getBoundingClientRect().left,
        e.clientY - mountRef.current!.getBoundingClientRect().top,
        0.1
      );
      draggingModelRef.current.position.set(worldPos.x, worldPos.y, 0.1);
      renderScene();
    };

    const onMouseUp = () => {
      draggingModelRef.current = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      mouse.x = ((touch.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((touch.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(modelsRef.current.map(m => m.model), true);
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const model = findParentModel(intersected);
        if (model && model.userData.isDraggable) {
          draggingModelRef.current = model;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingModelRef.current || !cameraRef.current) return;
      const touch = e.touches[0];
      const worldPos = screenToWorld(
        touch.clientX - mountRef.current!.getBoundingClientRect().left,
        touch.clientY - mountRef.current!.getBoundingClientRect().top,
        0.1
      );
      draggingModelRef.current.position.set(worldPos.x, worldPos.y, 0.1);
      renderScene();
    };

    const onTouchEnd = () => {
      draggingModelRef.current = null;
    };

    const canvas = rendererRef.current.domElement;
    canvas.addEventListener("mousedown", onMouseDown, { passive: false });
    canvas.addEventListener("mousemove", onMouseMove, { passive: false });
    canvas.addEventListener("mouseup", onMouseUp, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  };

  useEffect(() => {
    if (capturedImage && !isSelectionBoxUsed) initSelectionBox();
    const cleanupDragging = setupDragging();
    return () => {
      cleanupDragging?.();
    };
  }, [capturedImage, isSelectionBoxUsed, modelsRef.current.length, isSubmitted]);

  const selectBlindType = async (type: string) => {
    if (isProcessingRef.current) {
      changeQueueRef.current.push({ type: "blind", value: type });
      return;
    }
    setNewProcess("blind-select", "Loading blind type... Please wait.");
    isProcessingRef.current = true;
    setIsLoading(true);
    setSelectedBlindType(type);

    const blindType = BLIND_TYPES.find((b) => b.type === type);
    if (!blindType || !selectionBoxParamsRef.current || !initialModelParamsRef.current) return;

    const currentModels = modelsRef.current.map(({ model }) => ({
      position: model.position.clone(),
      isDraggable: model.userData.isDraggable || false,
    }));

    await cleanupCurrentModel();

    let modelData = preloadedModelsRef.current.get(blindType.modelUrl);
    if (!modelData) {
      modelData = await loadModel(blindType.modelUrl);
      preloadedModelsRef.current.set(blindType.modelUrl, modelData);
    }

    const updatedModels: ModelData[] = [];
    currentModels.forEach(({ position, isDraggable }) => {
      const newModel = modelData.model.clone();
      newModel.position.copy(position);
      if (initialModelParamsRef.current) {
        newModel.scale.copy(initialModelParamsRef.current.scale);
      }
      newModel.rotation.set(blindType.rotation.x, blindType.rotation.y, blindType.rotation.z);
      newModel.userData.isDraggable = isDraggable;
      applyTextureToModel(newModel, selectedPattern || "/materials/mocha.png", blindType);
      sceneRef.current.add(newModel);
      updatedModels.push({ model: newModel, gltf: modelData.gltf });
      fadeInModel(newModel);
    });

    if (updatedModels.length === 0) {
      const newModel = modelData.model.clone();
      if (initialModelParamsRef.current) {
        newModel.scale.copy(initialModelParamsRef.current.scale);
        newModel.position.copy(initialModelParamsRef.current.position);
      }
      newModel.rotation.set(blindType.rotation.x, blindType.rotation.y, blindType.rotation.z);
      applyTextureToModel(newModel, selectedPattern || "/materials/beige.png", blindType);
      sceneRef.current.add(newModel);
      updatedModels.push({ model: newModel, gltf: modelData.gltf }); // Fixed gtf to gltf
      fadeInModel(newModel);
    }

    modelsRef.current = updatedModels;
    if (!isCustomizerView) addWindowButtonRef.current?.classList.remove("hidden");

    renderScene();
    isProcessingRef.current = false;
    setIsLoading(false);
    completeCurrentProcess();
  };

  const selectPattern = async (patternUrl: string) => {
    setNewProcess("pattern-select", "Applying pattern... Please wait.");
    setSelectedPattern(patternUrl);
    if (modelsRef.current.length === 0) {
      changeQueueRef.current.push({ type: "pattern", value: patternUrl });
      if (selectionBoxParamsRef.current && initialModelParamsRef.current) await createDefaultModel(
        selectionBoxParamsRef.current.worldStart.x,
        selectionBoxParamsRef.current.worldStart.y,
        selectionBoxParamsRef.current.worldEnd.x,
        selectionBoxParamsRef.current.worldEnd.y
      );
      return;
    }
    setIsLoading(true);
    const blindType = BLIND_TYPES.find((b) => b.type === selectedBlindType) || BLIND_TYPES[0];
    modelsRef.current.forEach(({ model }) =>
      applyTextureToModel(model, patternUrl, blindType)
    );
    setIsLoading(false);
    completeCurrentProcess();
  };

  const saveImage = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !backgroundPlaneRef.current) {
      console.error("Required Three.js components are missing:", {
        renderer: rendererRef.current,
        scene: sceneRef.current,
        camera: cameraRef.current,
        backgroundPlane: backgroundPlaneRef.current,
      });
      setNewProcess("save-error", "Missing required components. Please try again.");
      return;
    }

    setNewProcess("save", "Saving image... Please wait.");
    if (!confirm("Would you like to save the customized image?")) return;

    setIsLoading(true);
    setShowBlindMenu(false);
    saveButtonRef.current?.classList.add("hidden");

    const originalModelData = modelsRef.current.map(({ model }) => ({
      model,
      scale: model.scale.clone(),
      position: model.position.clone(),
    }));
    const originalCameraPosition = cameraRef.current.position.clone();

    let effectiveCapturedImage = capturedImage || localStorage.getItem("capturedImage");

    const material = backgroundPlaneRef.current.material as THREE.MeshBasicMaterial;
    const texture = material.map;

    if (!texture || !texture.image || !effectiveCapturedImage) {
      console.error("Texture or captured image is invalid:", { texture, capturedImage: effectiveCapturedImage });
      setNewProcess("save-error", "No image captured or uploaded. Please capture or upload an image first.");
      restoreRenderer(originalModelData, originalCameraPosition);
      return;
    }

    const capturedWidth = texture.image.width;
    const capturedHeight = texture.image.height;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const widthScaleFactor = capturedWidth / screenWidth;
    const heightScaleFactor = capturedHeight / screenHeight;
    const scaleFactor = Math.min(widthScaleFactor, heightScaleFactor);
    originalModelData.forEach(({ model }) => {
      model.scale.multiplyScalar(scaleFactor);
      model.position.multiplyScalar(scaleFactor);
    });

    rendererRef.current.setSize(capturedWidth, capturedHeight);
    cameraRef.current.aspect = capturedWidth / capturedHeight;
    const distance = (screenHeight / 100 / 2) / Math.tan((cameraRef.current.fov * Math.PI / 180) / 2);
    cameraRef.current.position.set(0, 0, distance * (capturedHeight / screenHeight));
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
    adjustBackgroundPlane(capturedWidth, capturedHeight);

    rendererRef.current.clear();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const sceneDataUrl = rendererRef.current.domElement.toDataURL("image/png");

    if (!sceneDataUrl || sceneDataUrl === "data:,") {
      console.error("Failed to render scene to data URL");
      setNewProcess("save-error", "Failed to render the scene. Please try again.");
      restoreRenderer(originalModelData, originalCameraPosition);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = capturedWidth;
    canvas.height = capturedHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context for canvas");
      setNewProcess("save-error", "Canvas context unavailable. Please try again.");
      restoreRenderer(originalModelData, originalCameraPosition);
      return;
    }

    const loadImage = (src: string, description: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${description}: ${src}`));
        img.src = src;
      });

    try {
      const backgroundImg = await loadImage(effectiveCapturedImage, "Background image");
      ctx.drawImage(backgroundImg, 0, 0, capturedWidth, capturedHeight);

      const sceneImg = await loadImage(sceneDataUrl, "Scene image");
      ctx.drawImage(sceneImg, 0, 0, capturedWidth, capturedHeight);

      const logoImg = await loadImage("/images/baelogoN.png", "Logo image");
      const logoSize = capturedHeight * 0.1;
      const logoX = (capturedWidth - logoSize) / 2;
      const logoY = 16;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      const finalDataUrl = canvas.toDataURL("image/png");
      if (!finalDataUrl || finalDataUrl === "data:,") {
        throw new Error("Final data URL is empty");
      }

      const blob = await (await fetch(finalDataUrl)).blob();
      const file = new File([blob], "custom_blind_image.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Custom Blind Image",
            text: "Check out my custom blind design!",
          });
          setNewProcess("save-success", "Image shared! Check your gallery or downloads.");
        } catch (shareError) {
          console.warn("Sharing failed, falling back to download:", shareError);
          triggerDownload(finalDataUrl);
          setNewProcess("save-success", getDownloadSuccessMessage());
        }
      } else {
        triggerDownload(finalDataUrl);
        setNewProcess("save-success", getDownloadSuccessMessage());
      }
    } catch (error) {
      console.error("Error saving image:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setNewProcess("save-error", `Failed to save image: ${errorMessage}. Please try again.`);
    } finally {
      restoreRenderer(originalModelData, originalCameraPosition);
    }
  };

  const restoreRenderer = (originalModelData: { model: THREE.Group; scale: THREE.Vector3; position: THREE.Vector3 }[], originalCameraPosition: THREE.Vector3) => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.position.copy(originalCameraPosition);
      cameraRef.current.updateProjectionMatrix();
      adjustBackgroundPlane(window.innerWidth, window.innerHeight);
      originalModelData.forEach(({ model, scale, position }) => {
        model.scale.copy(scale);
        model.position.copy(position);
      });
      renderScene();
    }
    setShowBlindMenu(true);
    saveButtonRef.current?.classList.remove("hidden");
    setIsLoading(false);
    completeCurrentProcess();
  };

  const getDownloadSuccessMessage = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    return isIOS
      ? "Image downloaded! Open it in Downloads and tap 'Save to Photos'."
      : isAndroid
        ? "Image downloaded! Find it in your Downloads folder or Gallery."
        : "Image downloaded! Check your Downloads folder.";
  };

  const cleanupThreeJs = () => cameraStreamRef.current?.getTracks().forEach((track) => track.stop());

  const adjustCanvasAspect = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  };

  const cleanupCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.classList.add("hidden");
    }
  };

  const screenToWorld = (x: number, y: number, depth: number = -0.1) => {
    if (!cameraRef.current || !mountRef.current) return new THREE.Vector3();
    const rect = mountRef.current.getBoundingClientRect();
    const vector = new THREE.Vector3((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1, 0);
    vector.unproject(cameraRef.current);
    const dir = vector.sub(cameraRef.current.position).normalize();
    const distance = (depth - cameraRef.current.position.z) / dir.z;
    return cameraRef.current.position.clone().add(dir.multiplyScalar(distance));
  };

  const applyTextureToModel = (model: THREE.Group, patternUrl: string, blindType: BlindType) => {
    if (!model) return;
    const textureLoader = new THREE.TextureLoader();
    const applyMaterial = (textureUrl: string, normalUrl: string | null, repeat: number, normalScale: number, roughness: number, metalness: number, meshName?: string) => {
      const texture = textureLoader.load(textureUrl, undefined, undefined, (_) => console.error(`Texture load failed: ${textureUrl}`)); // Changed err to _ since it's unused
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.colorSpace = THREE.SRGBColorSpace;
      const materialProps: THREE.MeshStandardMaterialParameters = {
        map: texture,
        roughness,
        metalness,
      };
      if (normalUrl) {
        materialProps.normalMap = textureLoader.load(normalUrl, undefined, undefined, (_) => console.error(`Normal map load failed: ${normalUrl}`));
        materialProps.normalScale = new THREE.Vector2(normalScale, normalScale);
      }
      const material = new THREE.MeshStandardMaterial(materialProps);
      let applied = false;
      model.traverse((child) => {
        if (isMesh(child) && (!meshName || child.name === meshName)) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
            child.material = material;
          } else {
            child.material.dispose();
            child.material = material;
          }
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
          applied = true;
        }
      });
      if (!applied) console.warn(`No meshes found for ${meshName || 'all'} in model`);
    };

    if (!blindType.meshNameFabric && !blindType.meshNameWood) applyMaterial(patternUrl, null, 8, 0, 0.5, 0.1);
    else {
      if (blindType.meshNameFabric) applyMaterial(patternUrl, "/3d/normals/clothTex.jpg", 6, .5, 0.3, 0.1, blindType.meshNameFabric);
      if (blindType.meshNameWood) applyMaterial("/materials/iron.png", "/3d/normals/wood.jpg", 1, 0.5, .3, 0.1, blindType.meshNameWood);
    }
    renderScene();
  };

  const fadeInModel = (model: THREE.Group) => {
    let opacity = 0;
    const step = () => {
      opacity += 0.1;
      model.traverse((child) => {
        if (isMesh(child)) {
          (child.material as THREE.MeshStandardMaterial).opacity = opacity;
          (child.material as THREE.MeshStandardMaterial).transparent = opacity < 1;
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
      if (opacity < 1) requestAnimationFrame(step);
      else renderScene();
    };
    requestAnimationFrame(step);
  };

  const cleanupCurrentModel = async () => {
    await Promise.all(modelsRef.current.map(async (modelData) => {
      await new Promise<void>((resolve) => {
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          modelData.model.traverse((child) => {
            if (isMesh(child)) {
              (child.material as THREE.MeshStandardMaterial).opacity = opacity;
              (child.material as THREE.MeshStandardMaterial).transparent = true;
              (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          });
          if (opacity > 0) requestAnimationFrame(fadeOut);
          else resolve();
        };
        requestAnimationFrame(fadeOut);
      });
      sceneRef.current.remove(modelData.model);
    }));
    modelsRef.current = [];
    addWindowButtonRef.current?.classList.add("hidden");
    renderScene();
  };

  const loadModel = (modelUrl: string) => new Promise<ModelData>((resolve, reject) => {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => resolve({ model: gltf.scene, gltf }),
      undefined,
      (err) => reject(err)
    );
  });

  const renderScene = () => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    renderScene();
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = "custom_blind_image.png";
    link.href = dataUrl;
    link.click();
    setNewProcess("download", "Image downloaded! On iPhone, open it and tap 'Save to Photos'.");
  };

  const handleButtonClick = () => {
    const text = controlButtonRef.current?.textContent;
    if (text === "Start Camera") startCameraStream();
    else if (text === "Capture") captureImage();
    else if (text === "Submit") submitAndShowMenu();
  };

  const submitAndShowMenu = () => {
    setNewProcess("customize", "Select a blind type and pattern, then click 'Save Image' to download.");
    setShowBlindMenu(true);
    setIsCustomizerView(true);
    setIsSubmitted(true);

    controlButtonRef.current && document.body.removeChild(controlButtonRef.current);
    uploadButtonRef.current && document.body.removeChild(uploadButtonRef.current);
    redoButtonRef.current?.classList.add("hidden");
    saveButtonRef.current?.classList.remove("hidden");
    addWindowButtonRef.current?.classList.add("hidden");

    if (rendererRef.current && backgroundPlaneRef.current) {
      const texture = (backgroundPlaneRef.current.material as THREE.MeshBasicMaterial).map;
      if (texture) {
        const imgWidth = texture.image.width;
        const imgHeight = texture.image.height;
        const imgAspect = imgWidth / imgHeight;
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;

        let canvasWidth = imgWidth;
        let canvasHeight = imgHeight;

        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
          const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          canvasWidth = imgWidth * scale;
          canvasHeight = imgHeight * scale;
        }

        rendererRef.current.setSize(canvasWidth, canvasHeight);
        cameraRef.current!.aspect = canvasWidth / canvasHeight;
        cameraRef.current!.updateProjectionMatrix();

        const planeWidth = canvasWidth / 100;
        const planeHeight = canvasHeight / 100;
        backgroundPlaneRef.current.geometry.dispose();
        backgroundPlaneRef.current.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        backgroundPlaneRef.current.position.set(0, 0, -0.1);

        const distance = (canvasHeight / 100 / 2) / Math.tan((cameraRef.current!.fov * Math.PI / 180) / 2);
        cameraRef.current!.position.set(0, 0, distance);
        cameraRef.current!.lookAt(0, 0, 0);

        rendererRef.current.domElement.style.width = `${canvasWidth}px`;
        rendererRef.current.domElement.style.height = `${canvasHeight}px`;
        rendererRef.current.domElement.style.maxWidth = "100%";
        rendererRef.current.domElement.style.maxHeight = "100%";
        rendererRef.current.domElement.style.margin = "auto";
        rendererRef.current.domElement.style.display = "block";

        if (mountRef.current) {
          mountRef.current.style.overflowY = "auto";
          mountRef.current.style.display = "flex";
          mountRef.current.style.justifyContent = "center";
          mountRef.current.style.alignItems = "center";
          mountRef.current.style.minHeight = "100vh";
        }

        renderScene();
      }
    }

    const mobileOverlay = document.getElementById("mobileOverlay");
    if (mobileOverlay) {
      mobileOverlay.classList.remove("hidden");
      mobileOverlay.style.pointerEvents = "none";
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => e.target.checked ? [...prev, e.target.value] : prev.filter((tag) => tag !== e.target.value));

  const handleRedoSelection = async () => {
    await cleanupCurrentModel();
    setIsSelectionBoxUsed(false);
    setNewProcess("redo", "Draw a new box on the image to place the 3D model.");
  };

  const requestOrientationPermission = async () => {
    const request = (DeviceOrientationEvent as any).requestPermission;
    if (request) {
      try {
        if (await request() === "granted") window.addEventListener("deviceorientation", handleDeviceOrientation);
      } catch (err) {
        console.error("Orientation permission error:", err);
      }
    } else window.addEventListener("deviceorientation", handleDeviceOrientation);
  };

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (!levelIndicatorRef.current) return;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    const isLevel = Math.abs(beta) < 2 && Math.abs(gamma) < 2;
    levelIndicatorRef.current.style.backgroundColor = isLevel ? "white" : "red";
    levelIndicatorRef.current.style.border = isLevel ? "2px solid black" : "none";
  };

  // Render
  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        background: !capturedImage && !isCustomizerView ? "url('/images/unsplashMain.jpeg') center/cover no-repeat" : "#FFFFFF",
        touchAction: isCustomizerView ? "pan-y" : "auto",
      }}
    >
      <div
        ref={mountRef}
        className="relative w-full h-auto min-h-screen"
        style={{
          zIndex: isCustomizerView ? 0 : 20,
          touchAction: isCustomizerView ? "pan-y" : "auto",
        }}
      />
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
        <img src="/images/baelogoN.png" alt="Logo" className="w-24 h-24 object-contain" />
      </div>
      {instruction && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[100] text-brown-800 text-lg">
          {instruction}
        </div>
      )}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-[50] bg-black bg-opacity-50">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          completeCurrentProcess();
          handleImageUpload(file);
        }}
      />
      {showBlindMenu && isCustomizerView && (
        <div
          className="relative max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4 overflow-y-auto"
          style={{
            zIndex: 30,
            pointerEvents: "auto",
            touchAction: "pan-y",
            marginTop: "20px",
          }}
        >
          <div className="w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
              Select Type of Blind
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {BLIND_TYPES.map(({ type, buttonImage }) => (
                <div
                  key={type}
                  className="flex flex-col items-center text-center cursor-pointer px-[5px]"
                  onClick={() => selectBlindType(type)}
                  onTouchEnd={() => selectBlindType(type)}
                >
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="mt-1 text-gray-700 text-[11px]">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-3/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <div className="p-2 bg-white rounded shadow">
              <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mx-5 text-[13px]">
                {["solid", "pattern", "solar", "kids", "natural"].map((filter) => (
                  <label key={filter} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={filter}
                      checked={filters.includes(filter)}
                      onChange={handleFilterChange}
                      className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer"
                    />
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col flex-1 max-h-[400px] bg-white">
              <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
                Available Patterns
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                {filteredPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                    onClick={() => selectPattern(pattern.patternUrl)}
                    onTouchEnd={() => selectPattern(pattern.patternUrl)}
                  >
                    <img
                      src={pattern.image}
                      alt={pattern.name}
                      className="w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                    />
                    <div className="flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                      <span className="truncate">{pattern.name}</span>
                      <span>{pattern.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPageUI;