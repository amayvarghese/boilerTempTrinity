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
  depthFactor?: number;
};
type Pattern = {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
  patternUrl: string;
};
type ModelData = { model: THREE.Group; gltf?: any };

const BLIND_TYPES: BlindType[] = [
  { type: "Roller Blind", buttonImage: "/images/blindTypes/rollerBlindIcon.png", modelUrl: "/models/shadeBakeNew.glb", depthFactor: 0 },
  { type: "Roman Blind", buttonImage: "/images/blindTypes/romanBlindIcon.png", modelUrl: "/models/Black_Blind.glb", depthFactor: 0 },
  { type: "Classic Roman", buttonImage: "/images/blindTypes/classicRomanIcon.png", modelUrl: "/models/Gray_2_Blind.glb", depthFactor: 0 },
  { type: "Zebra Blind", buttonImage: "/images/blindTypes/zebraBlindIcon.png", modelUrl: "/models/zebra_02.glb", depthFactor: 0 },
  { type: "Vertical Sheet", buttonImage: "/images/blindTypes/verticalSheetBlindIcon.png", modelUrl: "/models/verticalSheetBlind.glb", depthFactor: 0 },
  { type: "Plantation Shutter", buttonImage: "/images/blindTypes/plantationShutterIcon.png", modelUrl: "/models/plantationShutterNew.glb", depthFactor: 0 },
  { type: "Sheet Blind", buttonImage: "/images/blindTypes/sheetBlindIcon.png", modelUrl: "/models/SheetBlindNew.glb", depthFactor: 0 },
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

// Utility Functions
const isMesh = (object: THREE.Object3D): object is THREE.Mesh => "isMesh" in object && (object.isMesh as boolean);

const FilterPageAI: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string>(BLIND_TYPES[0].type);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instruction, setInstruction] = useState("Click 'Start Camera' or upload an image to begin.");
  const [buttonText, setButtonText] = useState("Start Camera");
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowBoxRef = useRef<THREE.Mesh | null>(null);
  const cornerRefs = useRef<THREE.Mesh[]>([]);
  const modelRef = useRef<THREE.Group | null>(null);
  const preloadedModelsRef = useRef<Map<string, ModelData>>(new Map());
  const quadParamsRef = useRef<{
    corners: THREE.Vector3[];
    normal: THREE.Vector3;
    center: THREE.Vector3;
    cameraPosition: THREE.Vector3;
  } | null>(null);
  const touchStartRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const filteredPatterns = PATTERNS.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );

  useEffect(() => {
    setupThreeJS();
    preloadModels();
  }, []);

  const setupThreeJS = () => {
    if (!mountRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.01, 2000);
    cameraRef.current = camera;
    updateCameraPosition(screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    sceneRef.current.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      if (isCustomizerView) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(cornerRefs.current);
      if (intersects.length > 0) {
        const selectedCorner = intersects[0].object as THREE.Mesh;
        selectedCorner.userData.isDragging = true;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      if (isCustomizerView) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(sceneRef.current.children);
      if (intersects.length > 0) {
        cornerRefs.current.forEach((corner) => {
          if (corner.userData.isDragging) {
            const newPosition = intersects[0].point;
            corner.position.set(newPosition.x, newPosition.y, 0.03);
            updateWindowBoxShape();
          }
        });
      }
    };

    const handleMouseUp = () => {
      cornerRefs.current.forEach((corner) => (corner.userData.isDragging = false));
    };

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      if (isCustomizerView || event.touches.length !== 1) return;
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(cornerRefs.current);
      if (intersects.length > 0) {
        const selectedCorner = intersects[0].object as THREE.Mesh;
        selectedCorner.userData.isDragging = true;
        touchStartRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      if (isCustomizerView || !touchStartRef.current) return;
      const touch = Array.from(event.touches).find(t => t.identifier === touchStartRef.current!.id);
      if (!touch) return;
      
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(sceneRef.current.children);
      if (intersects.length > 0) {
        cornerRefs.current.forEach((corner) => {
          if (corner.userData.isDragging) {
            const newPosition = intersects[0].point;
            corner.position.set(newPosition.x, newPosition.y, 0.03);
            updateWindowBoxShape();
          }
        });
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      cornerRefs.current.forEach((corner) => (corner.userData.isDragging = false));
      touchStartRef.current = null;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (cameraRef.current && rendererRef.current) {
        let renderWidth = newWidth;
        let renderHeight = newHeight;
        if (imageAspectRatio > newWidth / newHeight) {
          renderHeight = newWidth / imageAspectRatio;
        } else {
          renderWidth = newHeight * imageAspectRatio;
        }
        rendererRef.current.setSize(renderWidth, renderHeight);
        cameraRef.current.aspect = renderWidth / renderHeight;
        cameraRef.current.updateProjectionMatrix();
        updateCameraPosition(renderHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
    };
  };

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
                  const model = gltf.scene.clone();
                  const bbox = new THREE.Box3().setFromObject(model);
                  const center = new THREE.Vector3();
                  bbox.getCenter(center);
                  model.position.sub(center);
                  preloadedModelsRef.current.set(blind.modelUrl, { model, gltf });
                  resolve();
                },
                undefined,
                (error) => reject(error)
              )
            )
        )
      );
    } catch (error) {
      console.error("[Preload] Model preloading failed:", error);
    }
    setIsLoading(false);
  };

  const updateCameraPosition = (height: number) => {
    if (!cameraRef.current) return;
    const fovRad = cameraRef.current.fov * (Math.PI / 180);
    const distance = (height / 100 / 2) / Math.tan(fovRad / 2);
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
  };

  const updateWindowBoxShape = () => {
    const scene = sceneRef.current;
    if (!scene || !windowBoxRef.current || cornerRefs.current.length !== 4) return;

    const positions = cornerRefs.current.map((corner) => new THREE.Vector3(corner.position.x, corner.position.y, 0));

    const shape = new THREE.Shape();
    shape.moveTo(positions[0].x, positions[0].y);
    shape.lineTo(positions[1].x, positions[1].y);
    shape.lineTo(positions[2].x, positions[2].y);
    shape.lineTo(positions[3].x, positions[3].y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.4, transparent: true, side: THREE.DoubleSide });

    scene.remove(windowBoxRef.current);
    windowBoxRef.current.geometry.dispose();
    if (Array.isArray(windowBoxRef.current.material)) {
      windowBoxRef.current.material.forEach((mat) => mat.dispose());
    } else {
      windowBoxRef.current.material.dispose();
    }

    const newBox = new THREE.Mesh(geometry, material);
    newBox.position.z = 0.01;
    scene.add(newBox);
    windowBoxRef.current = newBox;
  };

  const createModelBox = (corners: THREE.Vector3[], modelUrl: string, isInitial: boolean = false) => {
    const scene = sceneRef.current;
    if (!scene || corners.length !== 4 || !cameraRef.current) return;

    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
    }

    const modelData = preloadedModelsRef.current.get(modelUrl);
    if (!modelData) return;

    const blindType = BLIND_TYPES.find((b) => b.modelUrl === modelUrl) || BLIND_TYPES[0];
    const model = modelData.model.clone();
    modelRef.current = model;

    const orderedCorners = [...corners];
    orderedCorners.sort((a, b) => a.y - b.y);
    const bottomCorners = orderedCorners.slice(0, 2);
    const topCorners = orderedCorners.slice(2, 4);
    bottomCorners.sort((a, b) => a.x - b.x);
    topCorners.sort((a, b) => a.x - b.x);
    const quadCorners = [bottomCorners[0], bottomCorners[1], topCorners[1], topCorners[0]];

    const quadCenter = new THREE.Vector3();
    quadCorners.forEach((corner) => quadCenter.add(corner));
    quadCenter.divideScalar(4);

    const v1 = new THREE.Vector3().subVectors(quadCorners[1], quadCorners[0]);
    const v2 = new THREE.Vector3().subVectors(quadCorners[3], quadCorners[0]);
    const quadNormal = new THREE.Vector3().crossVectors(v1, v2).normalize();

    const quadWidth = quadCorners[1].distanceTo(quadCorners[0]);
    const quadHeight = quadCorners[0].distanceTo(quadCorners[3]);

    const box = new THREE.Box3().setFromObject(model);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    model.traverse((child) => {
      if (isMesh(child) && child.geometry) {
        const geometry = child.geometry.clone();
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        let min = bbox.min.clone();
        let max = bbox.max.clone();

        let width = max.x - min.x || 0.01;
        let height = max.y - min.y || 0.01;
        let depth = max.z - min.z || 0.01;

        const dims = { x: width, y: height, z: depth };
        const sortedDims = Object.entries(dims).sort((a, b) => b[1] - a[1]);
        if (sortedDims[0][0] === 'z' && sortedDims[1][0] === 'x') {
          geometry.rotateX(Math.PI / 2);
          geometry.computeBoundingBox();
          min = geometry.boundingBox!.min.clone();
          max = geometry.boundingBox!.max.clone();
          width = max.x - min.x || 0.01;
          height = max.y - min.y || 0.01;
          depth = max.z - min.z || 0.01;
        } else if (sortedDims[0][0] === 'z' && sortedDims[1][0] === 'y') {
          geometry.rotateY(Math.PI / 2);
          geometry.computeBoundingBox();
          min = geometry.boundingBox!.min.clone();
          max = geometry.boundingBox!.max.clone();
          width = max.x - min.x || 0.01;
          height = max.y - min.y || 0.01;
          depth = max.z - min.z || 0.01;
        }

        const fitScale = Math.min(quadWidth / width, quadHeight / height);
        geometry.scale(fitScale, fitScale, fitScale);
        min.multiplyScalar(fitScale);
        max.multiplyScalar(fitScale);
        width *= fitScale;
        height *= fitScale;
        depth *= fitScale;

        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;

        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);

          const uNorm = (x - min.x) / width;
          const vNorm = (y - min.y) / height;
          const depthVal = (z - min.z) / depth;

          const uClamped = Math.max(0, Math.min(1, uNorm));
          const vClamped = Math.max(0, Math.min(1, vNorm));

          const bottom = quadCorners[0].clone().lerp(quadCorners[1], uClamped);
          const top = quadCorners[3].clone().lerp(quadCorners[2], uClamped);
          const newPos = bottom.clone().lerp(top, vClamped);

          const bottomWidth = quadCorners[1].distanceTo(quadCorners[0]);
          const topWidth = quadCorners[2].distanceTo(quadCorners[3]);
          const depthScale = bottomWidth === 0 ? 1 : 1 - (vClamped * (1 - topWidth / bottomWidth) * 0.5);
          newPos.z = quadCenter.z + (depthVal - 0.5) * depth * depthScale;

          positions.setXYZ(i, newPos.x, newPos.y, newPos.z);
          if (uvs) uvs.setXY(i, uClamped, vClamped);
        }

        positions.needsUpdate = true;
        if (uvs) uvs.needsUpdate = true;
        geometry.computeVertexNormals();
        child.geometry = geometry;
      }
    });

    applyTextureToModel(model, selectedPattern || PATTERNS[0].patternUrl, blindType);

    const modelNormal = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(modelNormal, quadNormal);
    model.quaternion.copy(quaternion);
    model.position.copy(quadCenter);
    model.position.z += 0.1;

    const cameraDistance = cameraRef.current.position.z - quadCenter.z;
    cameraRef.current.position.set(quadCenter.x, quadCenter.y, quadCenter.z + cameraDistance);
    cameraRef.current.lookAt(quadCenter);
    cameraRef.current.updateProjectionMatrix();

    if (isInitial) {
      quadParamsRef.current = {
        corners: quadCorners.map((corner) => corner.clone()),
        normal: quadNormal.clone(),
        center: quadCenter.clone(),
        cameraPosition: cameraRef.current.position.clone(),
      };
    } else if (quadParamsRef.current) {
      model.position.copy(quadParamsRef.current.center);
      model.quaternion.copy(quaternion);
      model.position.z += 0.1;
      cameraRef.current.position.copy(quadParamsRef.current.cameraPosition);
      cameraRef.current.lookAt(quadParamsRef.current.center);
      cameraRef.current.updateProjectionMatrix();
    }

    model.renderOrder = 2;
    model.traverse((child) => {
      if (isMesh(child)) {
        child.renderOrder = 2;
        child.visible = true;
      }
    });

    scene.add(model);
    renderScene();
  };

  const applyTextureToModel = (model: THREE.Group, patternUrl: string, blindType: BlindType) => {
    const textureLoader = new THREE.TextureLoader();
    const applyMaterial = (
      textureUrl: string,
      normalUrl: string | null,
      repeat: number,
      normalScale: number,
      roughness: number,
      metalness: number,
      meshName?: string
    ) => {
      const texture = textureLoader.load(textureUrl);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.colorSpace = THREE.SRGBColorSpace;
      const materialProps: THREE.MeshStandardMaterialParameters = {
        map: texture,
        roughness,
        metalness,
        side: THREE.DoubleSide,
      };
      if (normalUrl) {
        materialProps.normalMap = textureLoader.load(normalUrl);
        materialProps.normalScale = new THREE.Vector2(normalScale, normalScale);
      }
      const material = new THREE.MeshStandardMaterial(materialProps);
      model.traverse((child) => {
        if (isMesh(child) && (!meshName || child.name === meshName)) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(() => material);
          } else {
            child.material = material;
          }
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
    };

    if (!blindType.meshNameFabric && !blindType.meshNameWood) {
      applyMaterial(patternUrl, null, 4, 0, 0.5, 0.1);
    } else {
      if (blindType.meshNameFabric) applyMaterial(patternUrl, "/3d/normals/clothTex.jpg", 6, 0.5, 0.3, 0.1, blindType.meshNameFabric);
      if (blindType.meshNameWood) applyMaterial("/materials/beige.png", "/3d/normals/wood.jpg", 1, 0.5, 0.3, 0.1, blindType.meshNameWood);
    }
    renderScene();
  };

  const handleButtonClick = () => {
    switch (buttonText) {
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
    setInstruction("Point your camera and click 'Capture'.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => setButtonText("Capture"));
      }
    } catch (err) {
      console.error("[startCameraStream] Camera error:", err);
      setInstruction("Failed to access camera. Upload an image instead.");
    }
  };

  const drawDefaultQuadrilateral = (width: number, height: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (windowBoxRef.current) {
      scene.remove(windowBoxRef.current);
      windowBoxRef.current.geometry.dispose();
      if (Array.isArray(windowBoxRef.current.material)) {
        windowBoxRef.current.material.forEach((mat) => mat.dispose());
      } else {
        windowBoxRef.current.material.dispose();
      }
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      if (Array.isArray(corner.material)) {
        corner.material.forEach((mat) => mat.dispose());
      } else {
        corner.material.dispose();
      }
    });
    cornerRefs.current = [];

    const planeWidth = width / 100;
    const planeHeight = height / 100;
    const defaultCorners = [
      new THREE.Vector3(-planeWidth * 0.3, -planeHeight * 0.3, 0),
      new THREE.Vector3(planeWidth * 0.3, -planeHeight * 0.3, 0),
      new THREE.Vector3(planeWidth * 0.3, planeHeight * 0.3, 0),
      new THREE.Vector3(-planeWidth * 0.3, planeHeight * 0.3, 0),
    ];

    const shape = new THREE.Shape();
    shape.moveTo(defaultCorners[0].x, defaultCorners[0].y);
    shape.lineTo(defaultCorners[1].x, defaultCorners[1].y);
    shape.lineTo(defaultCorners[2].x, defaultCorners[2].y);
    shape.lineTo(defaultCorners[3].x, defaultCorners[3].y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
    const box = new THREE.Mesh(geometry, material);
    box.position.z = 0.01;
    scene.add(box);
    windowBoxRef.current = box;

    const cornerGeometry = new THREE.SphereGeometry(0.03 * planeWidth, 16, 16);
    const cornerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    defaultCorners.forEach((pos) => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      corner.position.set(pos.x, pos.y, 0.03);
      corner.userData = { isDragging: false };
      scene.add(corner);
      cornerRefs.current.push(corner);
    });
  };

  const setBackgroundImage = (imageData: string): Promise<void> => {
    return new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageData, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        
        const imageAspect = texture.image.width / texture.image.height;
        setImageAspectRatio(imageAspect);
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        let renderWidth = screenWidth;
        let renderHeight = screenHeight;
        
        if (imageAspect > screenWidth / screenHeight) {
          renderHeight = screenWidth / imageAspect;
        } else {
          renderWidth = screenHeight * imageAspect;
        }
        
        if (rendererRef.current) {
          rendererRef.current.setSize(renderWidth, renderHeight);
          rendererRef.current.domElement.style.margin = 'auto';
          rendererRef.current.domElement.style.display = 'block';
        }
        if (cameraRef.current) {
          cameraRef.current.aspect = renderWidth / renderHeight;
          cameraRef.current.updateProjectionMatrix();
          updateCameraPosition(renderHeight);
        }
        
        sceneRef.current.background = texture;
        drawDefaultQuadrilateral(renderWidth, renderHeight);
        resolve();
      });
    });
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    setInstruction("Adjust the quadrilateral, then click 'Submit'.");
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL("image/png");

    setCapturedImage(imageData);
    cleanupCameraStream();
    setButtonText("Submit");

    await setBackgroundImage(imageData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setInstruction("Adjust the quadrilateral, then click 'Submit'.");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setButtonText("Submit");
      await setBackgroundImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const cleanupCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  const saveImage = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "custom_blind_image.png";
    link.click();
  };

  const submitAndShowMenu = () => {
    setInstruction("Select a blind type and pattern, then click 'Save Image'.");
    setShowBlindMenu(true);
    setIsCustomizerView(true);
    setButtonText("");

    const positions = cornerRefs.current.map((corner) => new THREE.Vector3(corner.position.x, corner.position.y, 0));
    createModelBox(positions, BLIND_TYPES.find((b) => b.type === selectedBlindType)!.modelUrl, true);

    if (windowBoxRef.current) {
      sceneRef.current.remove(windowBoxRef.current);
      windowBoxRef.current = null;
    }
    cornerRefs.current.forEach((corner) => sceneRef.current.remove(corner));
    cornerRefs.current = [];
  };

  const selectBlindType = (type: string) => {
    setSelectedBlindType(type);
    if (isCustomizerView && quadParamsRef.current) {
      const blindType = BLIND_TYPES.find((b) => b.type === type);
      if (blindType) {
        createModelBox(quadParamsRef.current.corners, blindType.modelUrl, false);
      }
    }
  };

  const selectPattern = (patternUrl: string) => {
    setSelectedPattern(patternUrl);
    if (modelRef.current) {
      applyTextureToModel(modelRef.current, patternUrl, BLIND_TYPES.find((b) => b.type === selectedBlindType) || BLIND_TYPES[0]);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  const renderScene = () => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handleBackClick = () => {
    window.location.href = "/";
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        background: !capturedImage && !isCustomizerView ? "url('/images/unsplashMain.jpeg') center/cover no-repeat" : "#FFFFFF",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={mountRef} className="relative w-full h-auto min-h-screen" style={{ touchAction: 'none' }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover z-[10]" />
      </div>
      <button
        onClick={handleBackClick}
        className="absolute top-5 left-5 p-2 bg-black text-white rounded-full shadow-md hover:bg-purple-900 z-[100] transition duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
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
      {!isCustomizerView && buttonText && (
        <button
          onClick={handleButtonClick}
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300"
        >
          {buttonText}
        </button>
      )}
      {!capturedImage && buttonText === "Start Camera" && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300"
        >
          Upload Image
        </button>
      )}
      {isCustomizerView && (
        <button
          onClick={saveImage}
          className="fixed bottom-16 right-5 py-3 px-6 text-lg bg-black text-white rounded-lg shadow-md hover:bg-purple-900 z-[100] transition duration-300"
        >
          Save Image
        </button>
      )}
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
      {showBlindMenu && isCustomizerView && (
        <div className="relative max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen">
          <div className="w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Select Type of Blind</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {BLIND_TYPES.map(({ type, buttonImage }) => (
                <div key={type} className="flex flex-col items-center text-center cursor-pointer px-[5px]" onClick={() => selectBlindType(type)}>
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="mt-1 text-gray-700 text-[11px]">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</div>
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
              <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                {filteredPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                    onClick={() => selectPattern(pattern.patternUrl)}
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

export default FilterPageAI;