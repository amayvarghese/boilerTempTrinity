import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Interfaces
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface BlindType {
  type: string;
  buttonImage: string;
  modelUrl: string;
  meshNameFabric?: string; // Optional mesh name for fabric
  meshNameWood?: string;   // Optional mesh name for wood
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
  gltf?: any;
}

interface SelectionBoxParams {
  targetWidth: number;
  targetHeight: number;
  worldStart: THREE.Vector3;
  worldEnd: THREE.Vector3;
}

interface InitialModelParams {
  scale: THREE.Vector3;
  position: THREE.Vector3;
}

const isMesh = (object: THREE.Object3D): object is THREE.Mesh => {
  return (object as THREE.Mesh).isMesh === true;
};

const FilterPageUI: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeProcess, setActiveProcess] = useState<{
    id: string;
    instruction: string;
    completed: boolean;
  } | null>({
    id: "initial",
    instruction: "Click 'Start Camera' or upload an image to begin.",
    completed: false,
  });

  const instruction =
    activeProcess && !activeProcess.completed ? activeProcess.instruction : "";

  const setNewProcess = (id: string, instruction: string) => {
    setActiveProcess({ id, instruction, completed: false });
  };

  const completeCurrentProcess = () => {
    setActiveProcess((prev) => (prev ? { ...prev, completed: true } : null));
  };

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
  const redoButtonRef = useRef<HTMLButtonElement | null>(null);
  const levelIndicatorRef = useRef<HTMLDivElement | null>(null);
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const defaultModelRef = useRef<ModelData | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const hasSelectionBox = useRef(false);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionBoxParamsRef = useRef<SelectionBoxParams | null>(null);
  const initialModelParamsRef = useRef<InitialModelParams | null>(null);
  const selectionBoxCleanupRef = useRef<(() => void) | null>(null);
  const isProcessingRef = useRef(false);
  const changeQueueRef = useRef<{ type: "blind" | "pattern"; value: string }[]>([]);
  const preloadedModelsRef = useRef<Map<string, ModelData>>(new Map());
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);

  const blindTypes: BlindType[] = [
    {
      type: 'classicRoman',
      buttonImage: '/images/blindTypes/romanBlindIcon.png',
      modelUrl: '/3d/classicRoman.glb',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.55, y: 2, z: 3 },
      basePosition: { x: -45, y: -25, z: 10 },
    },
    {
      type: 'roller',
      buttonImage: '/images/blindTypes/rollerBlindIcon.png',
      modelUrl: '/3d/ROLLER_SHADES.glb',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.5, y: 2.1, z: 1 },
      basePosition: { x: -45.5, y: -30, z: 5 },
    },
    {
      type: 'roman',
      buttonImage: '/images/blindTypes/romanBlindIcon.png',
      modelUrl: '/3d/ROMAN_SHADES_01.glb',
      meshNameFabric: 'polySurface1',
      meshNameWood: 'polySurface3',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.55, y: 2, z: 1 },
      basePosition: { x: -45, y: -20, z: 5 },
    },
    {
      type: 'Sheet Blind',
      buttonImage: '/images/blindTypes/sheetBlindIcon.png',
      modelUrl: '/3d/sheetBlind.glb',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.55, y: 2, z: 1 },
      basePosition: { x: -45, y: -28, z: 10 },
    },
    {
      type: 'PlantationShutter',
      buttonImage: '/images/blindTypes/plantationShutterIcon.png',
      modelUrl: '/3d/PlantationShutter.glb',
      meshNameWood: 'shutterWood',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.5, y: 2, z: 1 },
      basePosition: { x: -46, y: -27, z: 5 },
    },
    {
      type: 'VerticalBlind',
      buttonImage: '/images/blindTypes/verticalSheetBlindIcon.png',
      modelUrl: '/3d/vertical_sheet_blinds_02.glb',
      meshNameWood: 'polySurface32.001',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.45, y: 2.1, z: 1 },
      basePosition: { x: -45, y: -28, z: 5 },
    },
    {
      type: 'zebraBlinds',
      buttonImage: '/images/blindTypes/zebraBlindIcon.png',
      modelUrl: '/3d/zebra_blinds.glb',
      meshNameWood: 'zebra_blinds',
      rotation: { x: 0, y: 0, z: 0 },
      baseScale: { x: 1.55, y: 2, z: 1 },
      basePosition: { x: -45, y: -20, z: 5 },
    },
  ];

  const patterns: Pattern[] = [
    {
      name: "Beige",
      image: "/materials/beige.png",
      price: "$10",
      filterTags: ["solid"],
      patternUrl: "/materials/beige.png",
    },
    {
      name: "Blanche",
      image: "/materials/Blanche.png",
      price: "$67",
      filterTags: ["pattern"],
      patternUrl: "/materials/Blanche.png",
    },
    {
      name: "Cerrulean",
      image: "/materials/cerulean.png",
      price: "$10",
      filterTags: ["pattern"],
      patternUrl: "/materials/cerulean.png",
    },
    {
      name: "Chestnut",
      image: "/materials/chestnut.png",
      price: "$100",
      filterTags: ["kids", "pattern"],
      patternUrl: "/materials/chestnut.png",
    },
    {
      name: "Driftwood",
      image: "/materials/driftwood.png",
      price: "$100",
      filterTags: ["pattern"],
      patternUrl: "/materials/driftwood.png",
    },
    {
      name: "Driftwood Sand",
      image: "/materials/driftwoodsand.png",
      price: "$100",
      filterTags: ["pattern"],
      patternUrl: "/materials/driftwoodsand.png",
    },
    {
      name: "Iron",
      image: "/materials/iron.png",
      price: "$30",
      filterTags: ["solid"],
      patternUrl: "/materials/iron.png",
    },
    {
      name: "Ivory",
      image: "/materials/ivory.png",
      price: "$30",
      filterTags: ["solid"],
      patternUrl: "/materials/ivory.png",
    },
    {
      name: "Kaki",
      image: "/materials/kaki.png",
      price: "$30",
      filterTags: ["solid"],
      patternUrl: "/materials/kaki.png",
    },
    {
      name: "Mocha",
      image: "/materials/mocha.png",
      price: "$45",
      filterTags: ["pattern", "natural"],
      patternUrl: "/materials/mocha.png",
    },
    {
      name: "Noir",
      image: "/materials/noir.png",
      price: "$150",
      filterTags: ["pattern", "natural"],
      patternUrl: "/materials/noir.png",
    },
    {
      name: "Oatmeal",
      image: "/materials/oatmeal.png",
      price: "$150",
      filterTags: ["natural", "pattern"],
      patternUrl: "/materials/oatmeal.png",
    },
    {
      name: "Slate",
      image: "/materials/slate.png",
      price: "$100",
      filterTags: ["pattern"],
      patternUrl: "/materials/slate.png",
    },
    {
      name: "Silver",
      image: "/materials/SolarSilver.png",
      price: "$100",
      filterTags: ["solid", "solar"],
      patternUrl: "/materials/SolarSilver.png",
    },
    {
      name: "Steel",
      image: "/materials/steel.png",
      price: "$30",
      filterTags: ["solid"],
      patternUrl: "/materials/steel.png",
    },
    {
      name: "Taupe",
      image: "/materials/taupe.png",
      price: "$45",
      filterTags: ["pattern"],
      patternUrl: "/materials/taupe.png",
    },
    {
      name: "Taupe",
      image: "/materials/taupeSolar.png",
      price: "$100",
      filterTags: ["solar"],
      patternUrl: "/materials/taupeSolar.png",
    },
    {
      name: "Tea Leaves Brown",
      image: "/materials/tealeaves_brown.png",
      price: "$150",
      filterTags: ["pattern", "pattern"],
      patternUrl: "/materials/tealeaves_brown.png",
    },
    {
      name: "Tea Leaves White",
      image: "/materials/tealeaves_white.png",
      price: "$150",
      filterTags: ["patterned"],
      patternUrl: "/materials/tealeaves_white.png",
    },
    {
      name: "Toast",
      image: "/materials/toast.png",
      price: "$45",
      filterTags: ["pattern"],
      patternUrl: "/materials/toast.png",
    },
    {
      name: "White",
      image: "/materials/white.png",
      price: "$30",
      filterTags: ["solid"],
      patternUrl: "/materials/white.png",
    },
  ];

  const filteredPatterns = patterns.filter(
    (pattern) =>
      filters.length === 0 ||
      pattern.filterTags.some((tag) => filters.includes(tag))
  );

  useEffect(() => {
    const preloadModels = async () => {
      setIsLoading(true);
      const uniqueModelUrls = Array.from(
        new Set(blindTypes.map((b) => b.modelUrl))
      );
      const loader = new GLTFLoader();
      await Promise.all(
        uniqueModelUrls.map(
          (url) =>
            new Promise<void>((resolve) => {
              loader.load(
                url,
                (gltf) => {
                  const model = gltf.scene.clone();
                  preloadedModelsRef.current.set(url, { model, gltf });
                  resolve();
                },
                undefined,
                (error) => {
                  console.error(`Failed to preload model: ${url}`, error);
                  resolve();
                }
              );
            })
        )
      );
      setIsLoading(false);
    };
    preloadModels();
  }, []);

  useEffect(() => {
    if (!mountRef.current) {
      console.error("Mount ref is not available during initialization");
      return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      45,
      screenWidth / screenHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${isCustomizerView ? 0 : 20};
      pointer-events: ${isCustomizerView ? "none" : "auto"};
      touch-action: ${isCustomizerView ? "auto" : "none"};
    `;

    // Enhanced lighting for normal map visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Softer ambient light
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
    directionalLight.position.set(5, 10, 5); // Adjusted position for better angle
    directionalLight.castShadow = true;
    sceneRef.current.add(directionalLight);

    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.8);
    secondaryLight.position.set(-5, 5, -5);
    sceneRef.current.add(secondaryLight);

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
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [isCustomizerView]);

  const cleanupThreeJs = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
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
    overlayImageRef.current.src = "images/overlayFilter.png";
    overlayImageRef.current.className =
      "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";
    mount.appendChild(overlayImageRef.current);

    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    videoRef.current.className =
      "absolute inset-0 w-full h-full object-cover z-[10]";
    mount.appendChild(videoRef.current);

    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className =
      "fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white font-poppins-light rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300";
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    uploadButtonRef.current = document.createElement("button");
    uploadButtonRef.current.id = "uploadButton";
    uploadButtonRef.current.textContent = "Upload Image";
    uploadButtonRef.current.className =
      "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300";
    document.body.appendChild(uploadButtonRef.current);
    uploadButtonRef.current.addEventListener("click", () =>
      fileInputRef.current?.click()
    );

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.id = "saveButton";
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className =
      "fixed bottom-16 right-5 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300 hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    redoButtonRef.current = document.createElement("button");
    redoButtonRef.current.id = "redoButton";
    redoButtonRef.current.className =
      "fixed bottom-12 right-5 p-2 bg-[#2F3526] text-white rounded-full shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300 hidden";
    const redoIcon = document.createElement("img");
    redoIcon.src = "/images/retryButtonImg.png";
    redoIcon.alt = "Redo Selection";
    redoIcon.className = "h-6 w-6";
    redoButtonRef.current.appendChild(redoIcon);
    document.body.appendChild(redoButtonRef.current);
    redoButtonRef.current.addEventListener("click", handleRedoSelection);

    const backButton = document.createElement("button");
    backButton.id = "backButton";
    backButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    `;
    backButton.className =
      "absolute top-5 left-5 p-2 bg-[#2F3526] text-white rounded-full shadow-md hover:bg-[#3F4536] focus:outline-none focus:ring-2 focus:ring-[#2F3526] z-[100] transition duration-300";
    document.body.appendChild(backButton);
    backButton.addEventListener("click", () => {
      window.location.href = "/";
    });

    levelIndicatorRef.current = document.createElement("div");
    levelIndicatorRef.current.className =
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-2 bg-red-500 rounded-full z-[100] hidden";
    levelIndicatorRef.current.style.transition = "background-color 0.3s ease, border 0.3s ease";
    levelIndicatorRef.current.style.border = "none";
    mount.appendChild(levelIndicatorRef.current);

    return () => {
      if (overlayImageRef.current && mount)
        mount.removeChild(overlayImageRef.current);
      if (videoRef.current && mount) mount.removeChild(videoRef.current);
      if (levelIndicatorRef.current && mount)
        mount.removeChild(levelIndicatorRef.current);
      [controlButtonRef, uploadButtonRef, saveButtonRef, redoButtonRef].forEach(
        (ref) => {
          if (ref.current && document.body.contains(ref.current)) {
            document.body.removeChild(ref.current);
          }
        }
      );
      if (backButton && document.body.contains(backButton)) {
        document.body.removeChild(backButton);
      }
    };
  }, []);

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (!levelIndicatorRef.current) return;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    const threshold = 2;
    if (Math.abs(beta) < threshold && Math.abs(gamma) < threshold) {
      levelIndicatorRef.current.style.backgroundColor = "white";
      levelIndicatorRef.current.style.border = "2px solid black";
    } else {
      levelIndicatorRef.current.style.backgroundColor = "red";
      levelIndicatorRef.current.style.border = "none";
    }
  };

  const requestOrientationPermission = async () => {
    const DeviceOrientationEventWithPermission = DeviceOrientationEvent as any;
    if (
      typeof DeviceOrientationEventWithPermission.requestPermission === "function"
    ) {
      try {
        const permission =
          await DeviceOrientationEventWithPermission.requestPermission();
        if (permission === "granted") {
          window.addEventListener("deviceorientation", handleDeviceOrientation);
        }
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
      }
    } else {
      window.addEventListener("deviceorientation", handleDeviceOrientation);
    }
  };

  const handleButtonClick = () => {
    const button = controlButtonRef.current;
    if (!button) return;

    switch (button.textContent) {
      case "Start Camera":
        startCameraStream();
        break;
      case "Capture":
        captureImage();
        break;
      case "Submit":
        submitAndShowMenu();
        break;
    }
  };

  const startCameraStream = async () => {
    setNewProcess("camera", "Point your camera and click 'Capture' to take a photo.");
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
          uploadButtonRef.current?.style.setProperty("display", "none");
          if (levelIndicatorRef.current) {
            levelIndicatorRef.current.classList.remove("hidden");
            levelIndicatorRef.current.style.display = "block";
          }
          requestOrientationPermission();
        });
      }
    } catch (err) {
      console.error("Camera stream error:", err);
      setNewProcess(
        "camera-error",
        "Failed to access camera. Please upload an image instead."
      );
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

    completeCurrentProcess();
    setNewProcess("upload", "Draw a box on the image to place the 3D model.");

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      localStorage.setItem("capturedImage", imageData);
      setCapturedImage(imageData);
      loadUploadedImage(imageData);
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
    if (
      !videoRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current
    )
      return;

    completeCurrentProcess();
    setNewProcess("capture", "Draw a box on the image to place the 3D model.");

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
    if (levelIndicatorRef.current) {
      levelIndicatorRef.current.classList.add("hidden");
      levelIndicatorRef.current.style.display = "none";
    }
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
  };

  const cleanupCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      videoRef.current!.srcObject = null;
      videoRef.current!.classList.add("hidden");
      overlayImageRef.current?.classList.add("hidden");
    }
  };

  const loadTextureAndCreatePlane = (
    imageData: string,
    width: number,
    height: number
  ) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      if (backgroundPlaneRef.current) {
        sceneRef.current!.remove(backgroundPlaneRef.current);
        backgroundPlaneRef.current.geometry.dispose();
        const material = backgroundPlaneRef.current.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
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

      const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        planeMaterial
      );
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current!.add(plane);
      updateCameraPosition(width, height);

      setCapturedImage(imageData);
      localStorage.setItem("capturedImage", imageData);
    });
  };

  const initSelectionBox = () => {
    if (selectionBoxRef.current || hasSelectionBox.current || !mountRef.current)
      return;

    selectionBoxRef.current = document.createElement("div");
    selectionBoxRef.current.className =
      "absolute border-2 border-dashed border-[#2F3526] bg-[#2F3526] bg-opacity-20 pointer-events-auto";
    selectionBoxRef.current.style.zIndex = "25";
    selectionBoxRef.current.style.transition = "none";
    mountRef.current.appendChild(selectionBoxRef.current);

    let startX = 0,
      startY = 0,
      isDragging = false;

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
          display: "block",
        });
        isDragging = true;
      }
    };

    const updateSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;

      const rect = mountRef.current!.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(x, rect.width));
      const currentY = Math.max(0, Math.min(y, rect.height));

      requestAnimationFrame(() => {
        if (selectionBoxRef.current) {
          selectionBoxRef.current.style.width = `${Math.abs(
            currentX - startX
          )}px`;
          selectionBoxRef.current.style.height = `${Math.abs(
            currentY - startY
          )}px`;
          selectionBoxRef.current.style.left = `${Math.min(startX, currentX)}px`;
          selectionBoxRef.current.style.top = `${Math.min(startY, currentY)}px`;
        }
      });

      lastMousePosition.current = { x: currentX, y: currentY };
    };

    const endSelection = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      selectionBoxRef.current.style.display = "none";
      hasSelectionBox.current = true;
      isDragging = false;
      createDefaultModel(startX, startY, x, y);
    };

    const eventHandlers = {
      mousedown: (e: MouseEvent) => {
        if (!hasSelectionBox.current && e.button === 0) {
          e.preventDefault();
          e.stopPropagation();
          const rect = mountRef.current!.getBoundingClientRect();
          startSelection(e.clientX - rect.left, e.clientY - rect.top);
        }
      },
      mousemove: (e: MouseEvent) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          const rect = mountRef.current!.getBoundingClientRect();
          updateSelection(e.clientX - rect.left, e.clientY - rect.top);
        }
      },
      mouseup: (e: MouseEvent) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          const rect = mountRef.current!.getBoundingClientRect();
          endSelection(e.clientX - rect.left, e.clientY - rect.top);
        }
      },
      touchstart: (e: TouchEvent) => {
        if (!hasSelectionBox.current) {
          e.preventDefault();
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

    Object.entries(eventHandlers).forEach(([event, handler]) =>
      mountRef.current!.addEventListener(event, handler as EventListener, {
        passive: false,
      })
    );

    selectionBoxCleanupRef.current = () => {
      Object.entries(eventHandlers).forEach(([event, handler]) =>
        mountRef.current!.removeEventListener(event, handler as EventListener)
      );
    };

    return selectionBoxCleanupRef.current;
  };

  const screenToWorld = (x: number, y: number): THREE.Vector3 => {
    if (!cameraRef.current || !mountRef.current)
      return new THREE.Vector3();
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

  const createDefaultModel = async (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    if (!sceneRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsLoading(true);

    if (defaultModelRef.current) {
      await cleanupCurrentModel();
    }

    const worldStart = screenToWorld(startX, startY);
    const worldEnd = screenToWorld(endX, endY);
    const targetWidth = Math.abs(worldEnd.x - worldStart.x);
    const targetHeight = Math.abs(worldEnd.y - worldStart.y);

    selectionBoxParamsRef.current = { targetWidth, targetHeight, worldStart, worldEnd };

    const defaultModelUrl = "/3d/sheetBlind.glb";
    const defaultBlindType = blindTypes.find(b => b.modelUrl === defaultModelUrl) || blindTypes[0];

    if (!selectedPattern) {
      setSelectedPattern("/materials/beige.png");
    }

    const preloaded = preloadedModelsRef.current.get(defaultModelUrl) as
      | ModelData
      | undefined;
    const { model, gltf } = preloaded
      ? { model: preloaded.model.clone(), gltf: preloaded.gltf }
      : await loadModel(defaultModelUrl);

    applyTextureToModel(
      model,
      selectedPattern || "/materials/beige.png",
      defaultBlindType
    );
    const box = new THREE.Box3().setFromObject(model);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    const scaleX = targetWidth / modelSize.x;
    const scaleY = targetHeight / modelSize.y;
    const scaleZ = 0.01;
    model.scale.set(scaleX, scaleY, scaleZ);

    const modelCenter = box
      .setFromObject(model)
      .getCenter(new THREE.Vector3());
    const positionX =
      (worldStart.x + worldEnd.x) / 2 - (modelCenter.x - model.position.x);
    const positionY =
      (worldStart.y + worldEnd.y) / 2 - (modelCenter.y - model.position.y);
    const positionZ = 0.1;
    model.position.set(positionX, positionY, positionZ);

    initialModelParamsRef.current = {
      scale: new THREE.Vector3(scaleX, scaleY, scaleZ),
      position: new THREE.Vector3(positionX, positionY, positionZ),
    };

    sceneRef.current.add(model);
    defaultModelRef.current = { model, gltf };
    fadeInModel(model);

    isProcessingRef.current = false;
    setIsLoading(false);
    processNextChange();

    if (defaultModelRef.current) {
      completeCurrentProcess();
      redoButtonRef.current?.classList.remove("hidden");
    }
  };

  const cleanupCurrentModel = async () => {
    if (defaultModelRef.current && sceneRef.current) {
      const { model } = defaultModelRef.current;
      await fadeOutModel(model);
      sceneRef.current.remove(model);
      if (
        !preloadedModelsRef.current.has(
          blindTypes.find((b) => b.type === selectedBlindType)?.modelUrl || ""
        )
      ) {
        disposeModel(model);
      }
      defaultModelRef.current = null;
      renderScene();
    }
  };

  const fadeInModel = (model: THREE.Group) => {
    let opacity = 0;
    const fadeIn = () => {
      opacity += 0.1;
      model.traverse((child) => {
        if (isMesh(child)) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = opacity;
          material.transparent = true;
          material.needsUpdate = true;
        }
      });
      if (opacity < 1) {
        requestAnimationFrame(fadeIn);
      } else {
        model.traverse((child) => {
          if (isMesh(child)) {
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.opacity = 1;
            material.transparent = false;
            material.needsUpdate = true;
          }
        });
        renderScene();
      }
    };
    requestAnimationFrame(fadeIn);
  };

  const fadeOutModel = (model: THREE.Group): Promise<void> => {
    return new Promise((resolve) => {
      let opacity = 1;
      const fadeOut = () => {
        opacity -= 0.1;
        model.traverse((child) => {
          if (isMesh(child)) {
            const mesh = child as THREE.Mesh;
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.opacity = opacity;
            material.transparent = true;
            material.needsUpdate = true;
          }
        });
        if (opacity > 0) {
          requestAnimationFrame(fadeOut);
          renderScene();
        } else {
          resolve();
        }
      };
      requestAnimationFrame(fadeOut);
    });
  };

  const updateModelProperties = (model: THREE.Group, blindType: BlindType) => {
    if (!initialModelParamsRef.current) return;
    const { scale, position } = initialModelParamsRef.current;
    model.scale.copy(scale);
    model.position.copy(position);
    model.rotation.set(
      blindType.rotation.x,
      blindType.rotation.y,
      blindType.rotation.z
    );
  };

  const applyTextureToModel = (
    model: THREE.Group,
    patternUrl: string,
    blindType: BlindType
  ) => {
    const textureLoader = new THREE.TextureLoader();

    if (!blindType.meshNameFabric && !blindType.meshNameWood) {
      const patternTexture = textureLoader.load(patternUrl);
      patternTexture.wrapS = patternTexture.wrapT = THREE.RepeatWrapping;
      patternTexture.repeat.set(8, 8);
      patternTexture.colorSpace = THREE.SRGBColorSpace;

      const patternMaterial = new THREE.MeshStandardMaterial({
        map: patternTexture,
        roughness: 0.5,
        metalness: 0.1,
        transparent: false,
        opacity: 1,
      });

      model.traverse((child: THREE.Object3D) => {
        if (isMesh(child)) {
          const mesh = child as THREE.Mesh;
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
          mesh.material = patternMaterial;
          mesh.material.needsUpdate = true;
        }
      });
    } else {
      if (blindType.meshNameFabric) {
        const fabricTexture = textureLoader.load(patternUrl);
        fabricTexture.wrapS = fabricTexture.wrapT = THREE.RepeatWrapping;
        fabricTexture.repeat.set(8, 8);
        fabricTexture.colorSpace = THREE.SRGBColorSpace;

        const fabricNormalTexture = textureLoader.load('/3d/normals/RollerNormal.jpg');
        fabricNormalTexture.wrapS = fabricNormalTexture.wrapT = THREE.RepeatWrapping;
        fabricNormalTexture.repeat.set(4, 4);

        const fabricMaterial = new THREE.MeshStandardMaterial({
          map: fabricTexture,
          normalMap: fabricNormalTexture,
          normalScale: new THREE.Vector2(3, 3),
          roughness: 0.3,
          metalness: 0.1,
          transparent: false,
          opacity: 1,
        });

        model.traverse((child: THREE.Object3D) => {
          if (isMesh(child) && child.name === blindType.meshNameFabric) {
            const mesh = child as THREE.Mesh;
            if (mesh.material instanceof THREE.Material) {
              mesh.material.dispose();
            }
            mesh.material = fabricMaterial;
            mesh.material.needsUpdate = true;
          }
        });
      }

      if (blindType.meshNameWood) {
        const beigeTexture = textureLoader.load("/materials/beige.png");
        beigeTexture.wrapS = beigeTexture.wrapT = THREE.RepeatWrapping;
        beigeTexture.repeat.set(4, 4);
        beigeTexture.colorSpace = THREE.SRGBColorSpace;

        const woodNormalTexture = textureLoader.load('/3d/normals/wood_normal.jpg');
        woodNormalTexture.wrapS = woodNormalTexture.wrapT = THREE.RepeatWrapping;
        woodNormalTexture.repeat.set(0.3, 0.3);

        const woodMaterial = new THREE.MeshStandardMaterial({
          map: beigeTexture,
          normalMap: woodNormalTexture,
          normalScale: new THREE.Vector2(0.5, 0.5),
          roughness: 1,
          metalness: 0,
          transparent: false,
          opacity: 1,
        });

        model.traverse((child: THREE.Object3D) => {
          if (isMesh(child) && child.name === blindType.meshNameWood) {
            const mesh = child as THREE.Mesh;
            if (mesh.material instanceof THREE.Material) {
              mesh.material.dispose();
            }
            mesh.material = woodMaterial;
            mesh.material.needsUpdate = true;
          }
        });
      }
    }

    renderScene();
  };

  const disposeModel = (model: THREE.Group) => {
    model.traverse((child) => {
      if (isMesh(child)) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else {
          material.dispose();
        }
      }
    });
  };

  const saveImage = async () => {
    if (
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !backgroundPlaneRef.current
    ) {
      setNewProcess(
        "save-error",
        "Rendering setup incomplete. Please try again."
      );
      return;
    }

    setNewProcess("save", "Saving image... Please wait.");

    const permission = confirm("Would you like to save the customized image?");
    if (!permission) {
      setNewProcess("save-cancelled", "Save cancelled.");
      return;
    }

    setIsLoading(true);
    setShowBlindMenu(false);
    saveButtonRef.current?.classList.add("hidden");

    try {
      const material = backgroundPlaneRef.current.material as THREE.MeshBasicMaterial;
      const texture = material.map;
      const originalWidth = texture?.image.width || window.innerWidth;
      const originalHeight = texture?.image.height || window.innerHeight;

      rendererRef.current.setSize(originalWidth, originalHeight);
      cameraRef.current.aspect = originalWidth / originalHeight;
      cameraRef.current.updateProjectionMatrix();
      adjustBackgroundPlane(originalWidth, originalHeight);
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      const canvas = document.createElement("canvas");
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D context");

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = (err) =>
            reject(new Error(`Failed to load image: ${src}, Error: ${err}`));
          img.src = src;
        });
      };

      let backgroundSrc = capturedImage;
      if (!backgroundSrc && texture) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = texture.image.width;
        tempCanvas.height = texture.image.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(texture.image, 0, 0);
          backgroundSrc = tempCanvas.toDataURL("image/png");
        }
      }

      if (!backgroundSrc)
        throw new Error("No background image source available.");

      const backgroundImg = await loadImage(backgroundSrc);
      ctx.drawImage(backgroundImg, 0, 0, originalWidth, originalHeight);

      const renderData = rendererRef.current.domElement.toDataURL("image/png");
      const renderImg = await loadImage(renderData);
      ctx.drawImage(renderImg, 0, 0, originalWidth, originalHeight);

      const logoImg = await loadImage("/images/baelogoN.png");
      const logoSize = Math.min(originalWidth, originalHeight) * 0.1;
      const logoX = (originalWidth - logoSize) / 2;
      const logoY = 16;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      const dataUrl = canvas.toDataURL("image/png");

      if (navigator.share) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "custom_blind_image.png", {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Custom Blind Image",
              text: "Check out my custom blind design!",
            });
            setNewProcess(
              "share-success",
              "Image shared successfully! Check Photos or your share destination."
            );
          } catch (shareError) {
            console.warn("Web Share API failed:", shareError);
            triggerDownload(dataUrl);
          }
        } else {
          triggerDownload(dataUrl);
        }
      } else {
        triggerDownload(dataUrl);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      setNewProcess(
        "save-error",
        "Failed to save image. Check console for details."
      );
    } finally {
      const { innerWidth, innerHeight } = window;
      rendererRef.current.setSize(innerWidth, innerHeight);
      cameraRef.current.aspect = innerWidth / innerHeight;
      cameraRef.current.updateProjectionMatrix();
      adjustBackgroundPlane(innerWidth, innerHeight);

      setShowBlindMenu(true);
      saveButtonRef.current?.classList.remove("hidden");
      setIsLoading(false);
      completeCurrentProcess();
    }
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = "custom_blind_image.png";
    link.href = dataUrl;
    link.click();
    setNewProcess(
      "download",
      "Image downloaded! On iPhone, open it and tap 'Save to Photos'."
    );
  };

  const submitAndShowMenu = () => {
    setNewProcess(
      "customize",
      "Select a blind type and pattern, then click 'Save Image' to download."
    );
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
    redoButtonRef.current?.classList.add("hidden");
    saveButtonRef.current?.classList.remove("hidden");
    document.body.style.overflow = "auto";
    document.body.style.touchAction = "auto";
    cleanupThreeJs();
    if (selectionBoxCleanupRef.current) {
      selectionBoxCleanupRef.current();
      selectionBoxCleanupRef.current = null;
    }
  };

  const loadModel = (modelUrl: string): Promise<ModelData> => {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          resolve({ model, gltf });
        },
        undefined,
        (error) => reject(error)
      );
    });
  };

  const processNextChange = async () => {
    if (isProcessingRef.current || changeQueueRef.current.length === 0) return;

    const nextChange = changeQueueRef.current.shift()!;
    if (nextChange.type === "blind") {
      await selectBlindType(nextChange.value);
    } else if (nextChange.type === "pattern") {
      await selectPattern(nextChange.value);
    }
  };

  const selectBlindType = async (type: string) => {
    if (isProcessingRef.current) {
      changeQueueRef.current.push({ type: "blind", value: type });
      return;
    }

    setNewProcess("blind-select", "Loading blind type... Please wait.");

    isProcessingRef.current = true;
    setIsLoading(true);
    setSelectedBlindType(type);

    if (!selectionBoxParamsRef.current || !initialModelParamsRef.current) {
      changeQueueRef.current.push({ type: "blind", value: type });
      isProcessingRef.current = false;
      setIsLoading(false);
      return;
    }

    const blindType = blindTypes.find((b) => b.type === type);
    if (!blindType) {
      console.error("Blind type not found:", type);
      isProcessingRef.current = false;
      setIsLoading(false);
      return;
    }

    await cleanupCurrentModel();
    const preloaded = preloadedModelsRef.current.get(blindType.modelUrl) as
      | ModelData
      | undefined;
    const { model, gltf } = preloaded
      ? { model: preloaded.model.clone(), gltf: preloaded.gltf }
      : await loadModel(blindType.modelUrl);

    updateModelProperties(model, blindType);
    applyTextureToModel(
      model,
      selectedPattern || "/materials/beige.png",
      blindType
    );
    sceneRef.current!.add(model);
    defaultModelRef.current = { model, gltf };
    fadeInModel(model);

    isProcessingRef.current = false;
    setIsLoading(false);
    processNextChange();
    completeCurrentProcess();
  };

  const selectPattern = async (patternUrl: string) => {
    setNewProcess("pattern-select", "Applying pattern... Please wait.");
    setSelectedPattern(patternUrl);

    if (!defaultModelRef.current || !sceneRef.current) {
      changeQueueRef.current.push({ type: "pattern", value: patternUrl });
      if (selectionBoxParamsRef.current && initialModelParamsRef.current) {
        await createDefaultModel(
          selectionBoxParamsRef.current.worldStart.x,
          selectionBoxParamsRef.current.worldStart.y,
          selectionBoxParamsRef.current.worldEnd.x,
          selectionBoxParamsRef.current.worldEnd.y
        );
      }
      return;
    }

    setIsLoading(true);
    const currentBlindType =
      blindTypes.find((b) => b.type === selectedBlindType) || blindTypes[0];
    applyTextureToModel(defaultModelRef.current.model, patternUrl, currentBlindType);

    setIsLoading(false);
    completeCurrentProcess();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)
    );
  };

  const handleRedoSelection = async () => {
    if (defaultModelRef.current) {
      await cleanupCurrentModel();
    }
    hasSelectionBox.current = false;
    redoButtonRef.current?.classList.add("hidden");
    setNewProcess("redo", "Draw a new box on the image to place the 3D model.");
  };

  const renderScene = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    mixersRef.current.forEach((mixer) => mixer.update(0.016));
    renderScene();
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage:
          !capturedImage && !isCustomizerView
            ? "url('/images/background.jpg')"
            : "none",
        backgroundColor:
          capturedImage || isCustomizerView ? "#FFFFFF" : "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        ref={mountRef}
        className="relative w-full h-auto min-h-screen"
        style={{ zIndex: isCustomizerView ? 0 : 20 }}
      />
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
        <img
          src="/images/baelogoN.png"
          alt="Logo"
          className="w-24 h-24 object-contain"
        />
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
        id="imageUpload"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {showBlindMenu && isCustomizerView && (
        <div
          className="relative max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen overflow-y-auto"
          style={{
            zIndex: 30,
            position: "relative",
            pointerEvents: "auto",
            touchAction: "auto",
          }}
        >
          <div className="blind-type-menu w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
              Select Type of Blind
            </h3>
            <div className="blind-type-content grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {blindTypes.map(({ type, buttonImage }) => (
                <div
                  key={type}
                  className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]"
                  onClick={() => selectBlindType(type)}
                  onTouchEnd={() => selectBlindType(type)}
                >
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="button-image w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="button-text flex justify-center w-full mt-1 text-gray-700 text-[11px]">
                    <span className="text-center">
                      {type.charAt(0).toUpperCase() +
                        type.slice(1).replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="central-content flex flex-col items-center w-full md:w-3/4 relative">
            <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
              <div className="options-menu p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">
                  Filter Options
                </h3>
                <div className="grid-container grid grid-cols-2clf gap-2 mx-5 text-[13px]">
                  {["red", "blue", "green", "smooth", "patterned"].map(
                    (filter) => (
                      <div
                        key={filter}
                        className="option-row flex items-center gap-2"
                      >
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
                    )
                  )}
                </div>
              </div>
              <div className="scrollable-buttons flex flex-col flex-1 max-h-[300px] bg-white">
                <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
                  Available Patterns
                </h3>
                <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => selectPattern(pattern.patternUrl)}
                      onTouchEnd={() => selectPattern(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                        <span className="left-text truncate">
                          {pattern.name}
                        </span>
                        <span className="right-text">{pattern.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="options-menu p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">
                  Filter Options
                </h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {["solid", "pattern", "solar", "kids", "natural"].map(
                    (filter) => (
                      <div
                        key={filter}
                        className="option-row flex items-center gap-2"
                      >
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
                    )
                  )}
                </div>
              </div>
              <div className="scrollable-buttons flex flex-col flex-1 max-h-[400px] bg-white">
                <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
                  Available Patterns
                </h3>
                <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => selectPattern(pattern.patternUrl)}
                      onTouchEnd={() => selectPattern(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                        <span className="left-text truncate">
                          {pattern.name}
                        </span>
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