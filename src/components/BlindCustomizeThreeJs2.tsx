import { relative } from "path";
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
  normalFabric?: string; // Added for fabric normal map
  normalWood?: string;   // Added for wood normal map
  instances: ModelInstanceConfig[];
};
type ModelInstanceConfig = {
  position: Vector3D;
  scale: Vector3D;
  rotation: Vector3D;
};
type Pattern = {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
  patternUrl: string;
};
type ModelData = { model: THREE.Group; gltf?: any; mixer?: THREE.AnimationMixer; action?: THREE.AnimationAction };

const BLIND_TYPES: BlindType[] = [
  {
    type: "classicRoman",
    buttonImage: "/images/blindTypes/romanBlindIcon.png",
    modelUrl: "/3d/animated/classicRomanAnim.glb",
    instances: [
      { position: { x: -45, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "roller",
    buttonImage: "/images/blindTypes/rollerBlindIcon.png",
    modelUrl: "/3d/animated/rollerBlindAnim.glb",
    meshNameFabric: "ROLLER_SHADES",
    meshNameWood: "Cube",
    instances: [
      { position: { x: -45, y: -55, z: 10 }, scale: { x: 1.45, y: 2.8, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 10 }, scale: { x: 1.45, y: 2.8, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 10 }, scale: { x: 1.45, y: 2.8, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "roman",
    buttonImage: "/images/blindTypes/romanBlindIcon.png",
    modelUrl: "/3d/animated/romanBlindAnim.glb",
    meshNameFabric: "polySurface1",
    meshNameWood: "polySurface3",
    instances: [
      { position: { x: -45, y: -55, z: 10 }, scale: { x: 1.45, y: 2.85, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 10 }, scale: { x: 1.45, y: 2.85, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 10 }, scale: { x: 1.45, y: 2.85, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "Sheet Blind",
    buttonImage: "/images/blindTypes/sheetBlindIcon.png",
    modelUrl: "/3d/animated/SheetBlindAnim.glb",
    meshNameFabric: "Cloth",
    meshNameWood: "Rod",
    instances: [
      { position: { x: -45, y: -55, z: 15 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 15 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 15 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "PlantationShutter",
    buttonImage: "/images/blindTypes/plantationShutterIcon.png",
    modelUrl: "/3d/PLANTATION__SHUTTER.glb",
    meshNameWood: "Wood",
    instances: [
      { position: { x: -46, y: -55, z: 5 }, scale: { x: 150, y: 190, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27, y: -55, z: 5 }, scale: { x: 150, y: 190, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 5 }, scale: { x: 150, y: 190, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "VerticalSheet",
    buttonImage: "/images/blindTypes/verticalSheetBlindIcon.png",
    modelUrl: "/3d/VerticalSheet.glb",
    meshNameWood: "Wood",
    instances: [
      { position: { x: -45, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
  {
    type: "zebraBlinds",
    buttonImage: "/images/blindTypes/zebraBlindIcon.png",
    modelUrl: "/3d/animated/zebraBlindAnim.glb",
    meshNameWood: "zebra_blinds",
    instances: [
      { position: { x: -45, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 27.5, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 100, y: -55, z: 10 }, scale: { x: 1.45, y: 2.75, z: 2 }, rotation: { x: 0, y: 0, z: 0 } },
    ],
  },
];

const PATTERNS: Pattern[] = [
  { name: "Beige", image: "/materials/beige.png", price: "$10", filterTags: ["solid"], patternUrl: "/materials/beige.png" },
  { name: "Blanche", image: "/materials/Blanche.png", price: "$67", filterTags: ["pattern"], patternUrl: "/materials/Blanche.png" },
  { name: "White", image: "/materials/white.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/white.png" },
  { name: "Beige", image: "/materials/beige.png", price: "$10", filterTags: ["solid"], patternUrl: "/materials/beige.png" },
  { name: "Blanche", image: "/materials/Blanche.png", price: "$67", filterTags: ["pattern"], patternUrl: "/materials/Blanche.png" },
  { name: "Cerrulean", image: "/materials/cerulean.png", price: "$10", filterTags: ["pattern"], patternUrl: "/materials/cerulean.png" },
  { name: "Chestnut", image: "/materials/chestnut.png", price: "$100", filterTags: ["kids", "pattern"], patternUrl: "/materials/chestnut.png" },
  { name: "Driftwood", image: "/materials/driftwood.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwood.png" },
  { name: "Driftwood Sand", image: "/materials/driftwoodsand.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwoodsand.png" },
  { name: "Iron", image: "/materials/iron.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/iron.png" },
  { name: "Ivory", image: "/materials/ivory.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/ivory.png" },
  { name: "Kaki", image: "/materials/kaki.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/kaki.png" },
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

const BlindCustomizeThreeJs2: React.FC = () => {
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("#F5F5DC");
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRefs = useRef<ModelData[]>([]);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const solidColorLayerRef = useRef<HTMLDivElement>(null);
  const preloadedModelsRef = useRef<Map<string, ModelData>>(new Map());
  const playForwardButtonRef = useRef<HTMLButtonElement | null>(null);
  const playReverseButtonRef = useRef<HTMLButtonElement | null>(null);

  const fixedHeight = 600;
  const mobileHeightFactor = 0.75;
  const imageAspectRatio = 4 / 3;

  const filteredPatterns = PATTERNS.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );

  const isMesh = (object: THREE.Object3D): object is THREE.Mesh =>
    "isMesh" in object && (object.isMesh as boolean);

  // Preload models (unchanged)
  useEffect(() => {
    const preloadModels = async () => {
      setIsLoading(true);
      const loader = new GLTFLoader();
      try {
        await Promise.all(
          BLIND_TYPES.map(
            (blind) =>
              new Promise<void>((resolve, reject) =>
                loader.load(
                  blind.modelUrl,
                  (gltf) => {
                    const mixer = new THREE.AnimationMixer(gltf.scene);
                    preloadedModelsRef.current.set(blind.modelUrl, { model: gltf.scene.clone(), gltf, mixer });
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


  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !solidColorLayerRef.current) return;

    const isMobile = window.innerWidth < 768;
    const containerWidth = Math.min(window.innerWidth, solidColorLayerRef.current.getBoundingClientRect().width);
    let currentHeight = isMobile ? (containerWidth / imageAspectRatio) * mobileHeightFactor : fixedHeight;

    const aspectRatio = containerWidth / currentHeight;
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(containerWidth, currentHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/images/ROOM2.png",
      (texture) => {
        const planeWidth = containerWidth;
        const planeHeight = currentHeight;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
        const plane = new THREE.Mesh(geometry, material);
        backgroundPlaneRef.current = plane;
        plane.position.set(0, 0, -1);
        sceneRef.current.add(plane);

        const fovRad = camera.fov * (Math.PI / 180);
        const distance = planeHeight / (2 * Math.tan(fovRad / 2));
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
      },
      undefined,
      (error) => console.error("Error loading background texture:", error)
    );

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 1.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight.position.set(0, 5, 5);
    sceneRef.current.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = 1 / 60;
      modelRefs.current.forEach((modelData) => {
        if (modelData.mixer) modelData.mixer.update(delta);
      });
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!solidColorLayerRef.current || !rendererRef.current || !cameraRef.current) return;
      const isMobileResize = window.innerWidth < 768;
      const newWidth = Math.min(window.innerWidth, solidColorLayerRef.current.getBoundingClientRect().width);
      let newHeight = isMobileResize ? (newWidth / imageAspectRatio) * mobileHeightFactor : fixedHeight;

      rendererRef.current.setSize(newWidth, newHeight);
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();

      if (backgroundPlaneRef.current) {
        const planeGeometry = new THREE.PlaneGeometry(newWidth, newHeight);
        backgroundPlaneRef.current.geometry.dispose();
        backgroundPlaneRef.current.geometry = planeGeometry;
      }

      const fovRad = cameraRef.current.fov * (Math.PI / 180);
      const distance = newHeight / (2 * Math.tan(fovRad / 2));
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);

      if (modelRefs.current.length > 0 && selectedBlindType) {
        const blindType = BLIND_TYPES.find((b) => b.type === selectedBlindType);
        const scaleFactor = newWidth / 300;
        modelRefs.current.forEach((modelData, index) => {
          const config = blindType!.instances[index];
          modelData.model.position.set(
            config.position.x * scaleFactor,
            config.position.y * (newHeight / 300),
            config.position.z
          );
          modelData.model.scale.set(
            config.scale.x * scaleFactor,
            config.scale.y * scaleFactor,
            config.scale.z * scaleFactor
          );
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      cleanupModels();
    };
  }, []);

  // Animation control buttons
  useEffect(() => {
    const mount = document.body;
    const addElement = <T extends HTMLElement>(
      tag: keyof HTMLElementTagNameMap,
      props: Record<string, any>,
      parent: HTMLElement = mount
    ): T => {
      const el = Object.assign(document.createElement(tag), props) as T;
      parent.appendChild(el);
      return el;
    };

    playForwardButtonRef.current = addElement<HTMLButtonElement>("button", {
      id: "playForwardButton",
      className: "fixed bottom-20 left-10 py-2 px-4 text-lg bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden",
    });
    playForwardButtonRef.current.appendChild(
      addElement("img", { src: "/images/rollDF.png", alt: "Play Forward", className: "w-6 h-6 pointer-events-none select-none", draggable: false })
    );

    playReverseButtonRef.current = addElement<HTMLButtonElement>("button", {
      id: "playReverseButton",
      className: "fixed bottom-8 left-10 py-2 px-4 text-lg bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden",
    });
    playReverseButtonRef.current.appendChild(
      addElement("img", { src: "/images/rollDownF.png", alt: "Play Reverse", className: "w-6 h-6 pointer-events-none select-none", draggable: false })
    );

    if (selectedBlindType) {
      playForwardButtonRef.current?.classList.remove("hidden");
      playReverseButtonRef.current?.classList.remove("hidden");
    }

    return () => {
      [playForwardButtonRef, playReverseButtonRef].forEach((ref) => ref.current && mount.removeChild(ref.current));
    };
  }, [selectedBlindType]);

  const handlePlayForward = (e: Event) => {
    e.preventDefault();
    modelRefs.current.forEach((modelData) => {
      if (modelData.action) {
        modelData.action.timeScale = 1;
        modelData.action.paused = false;
        if (!modelData.action.isRunning()) modelData.action.reset().play();
      }
    });
  };

  const handlePlayReverse = (e: Event) => {
    e.preventDefault();
    modelRefs.current.forEach((modelData) => {
      if (modelData.action) {
        modelData.action.timeScale = -1;
        modelData.action.paused = false;
        if (!modelData.action.isRunning()) modelData.action.reset().play();
      }
    });
  };

  const handlePause = (e: Event) => {
    e.preventDefault();
    modelRefs.current.forEach((modelData) => {
      if (modelData.action) modelData.action.paused = true;
    });
  };

  useEffect(() => {
    const forwardBtn = playForwardButtonRef.current;
    const reverseBtn = playReverseButtonRef.current;

    if (forwardBtn) {
      forwardBtn.addEventListener("mousedown", handlePlayForward, { passive: false });
      forwardBtn.addEventListener("mouseup", handlePause, { passive: false });
      forwardBtn.addEventListener("touchstart", handlePlayForward, { passive: false });
      forwardBtn.addEventListener("touchend", handlePause, { passive: false });
      forwardBtn.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    if (reverseBtn) {
      reverseBtn.addEventListener("mousedown", handlePlayReverse, { passive: false });
      reverseBtn.addEventListener("mouseup", handlePause, { passive: false });
      reverseBtn.addEventListener("touchstart", handlePlayReverse, { passive: false });
      reverseBtn.addEventListener("touchend", handlePause, { passive: false });
      reverseBtn.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    const setImageStyles = (btn: HTMLButtonElement | null) => {
      const img = btn?.querySelector("img");
      if (img) {
        img.style.pointerEvents = "none";
        img.style.userSelect = "none";
        img.setAttribute("draggable", "false");
      }
    };

    setImageStyles(forwardBtn);
    setImageStyles(reverseBtn);

    return () => {
      if (forwardBtn) {
        forwardBtn.removeEventListener("mousedown", handlePlayForward);
        forwardBtn.removeEventListener("mouseup", handlePause);
        forwardBtn.removeEventListener("touchstart", handlePlayForward);
        forwardBtn.removeEventListener("touchend", handlePause);
        forwardBtn.removeEventListener("touchmove", (e) => e.preventDefault());
      }
      if (reverseBtn) {
        reverseBtn.removeEventListener("mousedown", handlePlayReverse);
        reverseBtn.removeEventListener("mouseup", handlePause);
        reverseBtn.removeEventListener("touchstart", handlePlayReverse);
        reverseBtn.removeEventListener("touchend", handlePause);
        reverseBtn.removeEventListener("touchmove", (e) => e.preventDefault());
      }
    };
  }, [modelRefs.current.length]);

  // Local storage handling
  useEffect(() => {
    const savedType = localStorage.getItem("selectedBlindType");
    if (savedType) setSelectedBlindType(savedType);
  }, []);

  useEffect(() => {
    if (selectedBlindType) localStorage.setItem("selectedBlindType", selectedBlindType);
    else localStorage.removeItem("selectedBlindType");
  }, [selectedBlindType]);

  useEffect(() => {
    const savedColor = localStorage.getItem("backgroundColor");
    if (savedColor) setBackgroundColor(savedColor);
  }, []);

  useEffect(() => {
    localStorage.setItem("backgroundColor", backgroundColor);
  }, [backgroundColor]);

  // Select blind type with multiple instances
const selectBlindType = async (type: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedBlindType(type);

    const blindType = BLIND_TYPES.find((b) => b.type === type);
    if (!blindType) return;

    await cleanupModels();

    const modelData = preloadedModelsRef.current.get(blindType.modelUrl);
    if (!modelData) {
      console.error(`Model not preloaded for ${type}`);
      setIsLoading(false);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const containerWidth = Math.min(window.innerWidth, solidColorLayerRef.current!.getBoundingClientRect().width);
    const scaleFactor = containerWidth / 300;

    modelRefs.current = blindType.instances.map((config) => {
      const model = modelData.model.clone();
      const mixer = new THREE.AnimationMixer(model);
      const newModelData: ModelData = { model, gltf: modelData.gltf, mixer };

      model.position.set(
        config.position.x * scaleFactor,
        config.position.y * scaleFactor,
        config.position.z
      );
      model.scale.set(
        config.scale.x * scaleFactor,
        config.scale.y * scaleFactor,
        config.scale.z * scaleFactor
      );
      model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
      sceneRef.current.add(model);
      applyTextureToModel(model, selectedPattern || (blindType.meshNameFabric ? "/materials/mocha.png" : "/materials/beige.png"), blindType);

      if (modelData.gltf?.animations?.length) {
        const animationClip = modelData.gltf.animations[0];
        if (animationClip) {
          const action = mixer.clipAction(animationClip);
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
          action.paused = true;
          newModelData.action = action;
        }
      }

      return newModelData;
    });

    renderScene();
    setIsLoading(false);
  };

  const handleButtonClick = (patternUrl: string) => {
    setSelectedPattern(patternUrl);
    if (modelRefs.current.length > 0 && selectedBlindType) {
      const blindType = BLIND_TYPES.find((b) => b.type === selectedBlindType)!;
      modelRefs.current.forEach((modelData) => applyTextureToModel(modelData.model, patternUrl, blindType));
    }
  };

  const applyTextureToModel = (model: THREE.Group, patternUrl: string, blindType: BlindType) => {
    const textureLoader = new THREE.TextureLoader();
    const applyMaterial = (
      textureUrl: string,
      normalUrl: string | null, // Updated to handle normal maps
      repeat: number,
      normalScale: number,
      roughness: number,
      metalness: number,
      meshName?: string
    ) => {
      const texture = textureLoader.load(
        textureUrl,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeat, repeat);
          tex.colorSpace = THREE.SRGBColorSpace;

          const materialProps: THREE.MeshStandardMaterialParameters = {
            map: tex,
            roughness,
            metalness,
          };
          if (normalUrl) {
            const normalTexture = textureLoader.load(normalUrl);
            materialProps.normalMap = normalTexture;
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
          if (!applied) console.warn(`No meshes found for ${meshName || "all"} in model`);
          renderScene();
        },
        undefined,
        (err) => console.error(`Texture load failed: ${textureUrl}`, err)
      );
    };

    if (!blindType.meshNameFabric && !blindType.meshNameWood) {
      applyMaterial(patternUrl, null, 8, 0, 0.5, 0.1);
    } else {
      if (blindType.meshNameFabric) {
        applyMaterial(
          patternUrl,
          blindType.normalFabric || "/3d/normals/clothTex.jpg", // Use specified normalFabric or default
          8,
          1,
          0.3,
          0.1,
          blindType.meshNameFabric
        );
      }
      if (blindType.meshNameWood) {
        applyMaterial(
          "/materials/beige.png",
          blindType.normalWood || "/3d/normals/wood.jpg", // Use specified normalWood or default
          4,
          0.5,
          1,
          0,
          blindType.meshNameWood
        );
      }
    }
  };

  const cleanupModels = async () => {
    if (modelRefs.current.length > 0) {
      modelRefs.current.forEach((modelData) => {
        modelData.model.traverse((child) => {
          if (isMesh(child)) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
            child.geometry.dispose();
          }
        });
        if (modelData.mixer) modelData.mixer.stopAllAction();
        sceneRef.current.remove(modelData.model);
      });
      modelRefs.current = [];
      renderScene();
    }
  };

  const renderScene = () => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .full-screen-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          min-height: 100vh;
          background-color: #e5e7eb;
          z-index: 10;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .menu-section {
          background: linear-gradient(135deg, #ffffff, #f9fafb);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 16px;
          padding: 16px;
        }
        .menu-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          border-bottom: 2px solid #cbaa51;
          padding-bottom: 4px;
        }
        .patterns-scroll-container {
          max-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbaa51 #f9fafb;
        }
        .patterns-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .patterns-scroll-container::-webkit-scrollbar-thumb {
          background-color: #cbaa51;
          border-radius: 4px;
        }
        .patterns-scroll-container::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        @media (min-width: 768px) {
          .patterns-scroll-container {
            max-height: none;
            overflow-y: visible;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="full-screen-container text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="container max-w-7xl mx-auto py-6">
          <section className="roman-shades flex flex-col md:flex-row items-start justify-center gap-4">
            {/* Desktop Layout */}
            <div className="hidden md:block fixed top-0 left-0 w-1/5 min-h-screen bg-white shadow-2xl z-[40] overflow-hidden border-r border-gray-200">
              <div className="flex flex-col min-h-screen pt-16 px-6 pb-6 bg-gradient-to-b from-white to-gray-50">
                <div className="mb-8 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-[#cbaa51] to-[#e0c373] bg-clip-text text-transparent">
                    Customize Blinds
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-6">
                  <div className="relative">
                    <button onClick={() => toggleSection("filters")} className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200">
                      <span className="font-semibold text-base">Filter Options</span>
                      <svg className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "filters" ? "rotate-180" : ""} text-[#cbaa51]`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSection === "filters" && (
                      <div className="mt-3 p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto animate-fadeIn">
                        {["solid", "pattern", "kids", "natural", "solar"].map((tag) => (
                          <label key={tag} className="flex items-center space-x-3 text-sm text-gray-700 py-2 hover:bg-gray-50 rounded-md transition-colors duration-200">
                            <input type="checkbox" value={tag} checked={filters.includes(tag)} onChange={handleFilterChange} className="form-checkbox h-5 w-5 text-[#cbaa51] rounded focus:ring-2 focus:ring-[#cbaa51]/50 transition-colors duration-200" />
                            <span className="capitalize font-medium">{tag}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => toggleSection("blindType")} className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200">
                      <span className="font-semibold text-base">Select Blind Type</span>
                      <svg className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "blindType" ? "rotate-180" : ""} text-[#cbaa51]`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSection === "blindType" && (
                      <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto animate-fadeIn">
                        {BLIND_TYPES.map(({ type, buttonImage }) => (
                          <div key={type} className="flex flex-col items-center">
                            <button onClick={() => selectBlindType(type)} className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${selectedBlindType === type ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-lg" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}`}>
                              <img src={buttonImage} alt={type} className="w-16 h-16 object-contain" />
                            </button>
                            <span className="mt-2 text-xs text-center text-gray-600 font-medium">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => toggleSection("patterns")} className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200">
                      <span className="font-semibold text-base">Available Patterns</span>
                      <svg className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "patterns" ? "rotate-180" : ""} text-[#cbaa51]`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSection === "patterns" && (
                      <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto animate-fadeIn">
                        {filteredPatterns.map(({ name, image, price, patternUrl }) => (
                          <div key={name} className="flex flex-col items-center">
                            <button onClick={() => handleButtonClick(patternUrl)} className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${selectedPattern === patternUrl ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-lg" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}`}>
                              <img src={image} alt={name} className="w-16 h-16 object-contain" />
                            </button>
                            <span className="mt-2 text-xs text-center text-gray-600 font-medium">{name}</span>
                            <span className="text-xs text-gray-500 font-light">{price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Central Content */}
            <div className="central-content flex flex-col items-center w-full md:ml-[20%] md:w-[80%]">
              <div className="backgroundImage relative w-full max-w-full overflow-hidden" style={{ height: window.innerWidth < 768 ? `${(window.innerWidth / imageAspectRatio) * mobileHeightFactor}px` : `${fixedHeight}px` }}>
                <div ref={solidColorLayerRef} className="solid-color-layer absolute inset-0 z-10" style={{ backgroundColor, opacity: 0.5 }}></div>
                <canvas ref={canvasRef} className="main_bg absolute top-0 left-0 w-full h-full object-contain z-20" style={{ maxWidth: "100vw" }} />
              </div>
              <div className="color_picker_container flex items-center justify-start w-full h-16 px-4">
                <label htmlFor="colorPicker" className="mr-2 text-sm text-gray-700">Background Color:</label>
                <input
                  type="color"
                  id="colorPicker"
                  value={backgroundColor}
                  className="w-20 h-12 border-none cursor-pointer bg-transparent"
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
              {/* Mobile Menus */}
              <div className="md:hidden w-full px-4 space-y-6">
                {/* Filter Options */}
                <div className="menu-section">
                  <h3 className="menu-title">Filter Options</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["solid", "natural", "solar", "pattern", "kids"].map((filter) => (
                      <label key={filter} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 text-[#cbaa51] border-gray-300 rounded focus:ring-[#cbaa51] focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">{filter}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Select Blind Type */}
                <div className="menu-section">
                  <h3 className="menu-title">Select Blind Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {BLIND_TYPES.map(({ type, buttonImage }) => (
                      <div key={type} className="flex flex-col items-center">
                        <button
                          onClick={() => selectBlindType(type)}
                          className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${selectedBlindType === type ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
                        >
                          <img src={buttonImage} alt={type} className="w-12 h-12 object-contain" />
                        </button>
                        <span className="mt-2 text-xs text-center text-gray-600 font-medium">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Available Patterns with Scroll */}
                <div className="menu-section">
                  <h3 className="menu-title">Available Patterns</h3>
                  <div className="patterns-scroll-container">
                    <div className="grid grid-cols-2 gap-4">
                      {filteredPatterns.map((pattern, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <button
                            onClick={() => handleButtonClick(pattern.patternUrl)}
                            className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${selectedPattern === pattern.patternUrl ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
                          >
                            <img src={pattern.image} alt={pattern.name} className="w-12 h-12 object-contain rounded" />
                          </button>
                          <div className="mt-2 text-center">
                            <span className="text-xs text-gray-600 font-medium block">{pattern.name}</span>
                            <span className="text-xs text-gray-500 font-light">{pattern.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {isLoading && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="text-white text-lg">Loading...</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlindCustomizeThreeJs2;