import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Define interfaces for TypeScript type safety
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface BlindType {
  type: string;
  buttonImage: string;
}

interface Pattern {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
}

// Main React component for the filter page
const FilterPageAI: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [instruction, setInstruction] = useState("Click 'Start Camera' or upload an image to begin.");
  const [buttonText, setButtonText] = useState("Start Camera");

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowBoxRef = useRef<THREE.Mesh | null>(null);
  const cornerRefs = useRef<THREE.Mesh[]>([]);
  const shadeBakeRef = useRef<THREE.Group | null>(null);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const blindTypes: BlindType[] = [
    { type: "shadeBake", buttonImage: "/images/shadeBakeIcon.png" },
  ];

  const patterns: Pattern[] = [
    {
      name: "Beige",
      image: "/images/ICONSforMaterial/beige.png",
      price: "$10",
      filterTags: ["solid"],
    },
  ];

  const filteredPatterns = patterns.filter(
    (pattern) =>
      filters.length === 0 ||
      pattern.filterTags.some((tag) => filters.includes(tag))
  );

  useEffect(() => {
    setupThreeJS();
  }, []);

  const setupThreeJS = () => {
    if (!mountRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.01, 2000);
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleMouseDown = (event: MouseEvent) => {
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

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (cameraRef.current && rendererRef.current) {
        rendererRef.current.setSize(newWidth, newHeight);
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        updateCameraPosition(newWidth, newHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  };

  const updateCameraPosition = (width: number, height: number) => {
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

    const positions = cornerRefs.current.map((corner) =>
      new THREE.Vector3(corner.position.x, corner.position.y, 0)
    );

    const shape = new THREE.Shape();
    shape.moveTo(positions[0].x, positions[0].y);
    shape.lineTo(positions[1].x, positions[1].y);
    shape.lineTo(positions[2].x, positions[2].y);
    shape.lineTo(positions[3].x, positions[3].y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.4,
      transparent: true,
      side: THREE.DoubleSide,
    });

    scene.remove(windowBoxRef.current);
    windowBoxRef.current.geometry.dispose();
    if (Array.isArray(windowBoxRef.current.material)) {
      windowBoxRef.current.material.forEach(material => material.dispose());
    } else {
      windowBoxRef.current.material.dispose();
    }

    const newBox = new THREE.Mesh(geometry, material);
    newBox.position.z = 0.01;
    scene.add(newBox);
    windowBoxRef.current = newBox;
  };

  const createModelBoxWithShadeBake = (corners: THREE.Vector3[]) => {
    const scene = sceneRef.current;
    if (!scene || corners.length !== 4) {
      console.error("Cannot create model: Invalid scene or corners");
      return;
    }
  
    if (shadeBakeRef.current) {
      scene.remove(shadeBakeRef.current);
      shadeBakeRef.current = null;
    }
  
    const loader = new GLTFLoader();
    loader.load(
      "/3d/shadeBakeINV.glb",
      (gltf) => {
        const model = gltf.scene;
        shadeBakeRef.current = model;
  
        // Get model bounding box before scaling
        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize); // Original size of the model (x, y, z)
        const modelCenter = new THREE.Vector3();
        box.getCenter(modelCenter); // Original center of the model in its local space
  
        // Order corners: bottom-left, bottom-right, top-right, top-left
        const orderedCorners = [...corners];
        orderedCorners.sort((a, b) => a.y - b.y); // Sort by Y
        const bottomCorners = orderedCorners.slice(0, 2);
        const topCorners = orderedCorners.slice(2, 4);
        bottomCorners.sort((a, b) => a.x - b.x); // Sort bottom by X
        topCorners.sort((a, b) => a.x - b.x);    // Sort top by X
        const finalCorners = [
          bottomCorners[0], // Bottom-left
          bottomCorners[1], // Bottom-right
          topCorners[1],    // Top-right
          topCorners[0],    // Top-left
        ];
  
        // Calculate target width and height
        const targetWidth = finalCorners[1].x - finalCorners[0].x; // Bottom-right - Bottom-left
        const targetHeight = finalCorners[2].y - finalCorners[1].y; // Top-right - Bottom-right
  
        // Calculate scaling factors (non-uniform for X and Y)
        const scaleX = targetWidth / modelSize.x;
        const scaleY = targetHeight / modelSize.y;
        
        // Determine Z-scale based on the model's original depth and scene needs
        const baseZScale = Math.min(scaleX, scaleY); // Use smaller scale to avoid exaggeration
        const zScale = baseZScale * 0.1; // Scale Z proportionally but smaller (adjustable)
        model.scale.set(scaleX, scaleY, zScale); // Non-uniform scaling with controlled Z
  
        // Calculate the center of the quadrilateral in world space
        const quadCenter = new THREE.Vector3();
        finalCorners.forEach((corner) => quadCenter.add(corner));
        quadCenter.divideScalar(4);
  
        // Position the model so its center aligns with the quadrilateral's center
        model.position.copy(quadCenter);
  
        // Adjust for the model's local center offset after scaling
        const scaledCenterOffset = modelCenter.clone().multiply(model.scale);
        model.position.sub(scaledCenterOffset);
  
        // Set Z position dynamically based on camera distance
        const cameraDistance = cameraRef.current?.position.z || 1; // Default to 1 if camera not set
        model.position.z = cameraDistance * 0.01; // Position close to the background (adjustable)
  
        // Calculate rotation to align with quadrilateral
        const bottomEdge = new THREE.Vector3()
          .subVectors(finalCorners[1], finalCorners[0])
          .normalize();
        const horizontal = new THREE.Vector3(1, 0, 0); // Reference X-axis
        const angle = Math.acos(bottomEdge.dot(horizontal)) * Math.sign(bottomEdge.y);
        model.rotation.z = angle; // Rotate around Z-axis to align with bottom edge
  
        model.renderOrder = 2;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.renderOrder = 2;
            child.material.depthTest = true;
            child.material.depthWrite = true;
            child.material.side = THREE.DoubleSide;
          }
        });
  
        scene.add(model);
  
        // Add lighting
        if (!scene.getObjectByName("ambientLight")) {
          const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
          ambientLight.name = "ambientLight";
          scene.add(ambientLight);
        }
        if (!scene.getObjectByName("directionalLight")) {
          const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
          directionalLight.position.set(0, 0, 5);
          directionalLight.name = "directionalLight";
          scene.add(directionalLight);
        }
  
        rendererRef.current?.render(scene, cameraRef.current!);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setInstruction("Failed to load shade model.");
      }
    );
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          setButtonText("Capture");
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
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
        windowBoxRef.current.material.forEach((material) => material.dispose());
      } else {
        windowBoxRef.current.material.dispose();
      }
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      if (Array.isArray(corner.material)) {
        corner.material.forEach((material) => material.dispose());
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
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.4,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.z = 0.01;
    scene.add(box);
    windowBoxRef.current = box;

    const cornerGeometry = new THREE.SphereGeometry(0.01 * planeWidth, 16, 16);
    const cornerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
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
        sceneRef.current.background = texture;
        drawDefaultQuadrilateral(window.innerWidth, window.innerHeight);
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
    link.download = "window_with_blind.png";
    link.click();
  };

  const submitAndShowMenu = () => {
    setInstruction("Select a blind type and pattern, then click 'Save Image'.");
    setShowBlindMenu(true);
    setIsCustomizerView(true);

    const scene = sceneRef.current;
    const positions = cornerRefs.current.map((corner) =>
      new THREE.Vector3(corner.position.x, corner.position.y, 0)
    );

    createModelBoxWithShadeBake(positions);

    if (windowBoxRef.current) {
      scene.remove(windowBoxRef.current);
      windowBoxRef.current.geometry.dispose();
      if (Array.isArray(windowBoxRef.current.material)) {
        windowBoxRef.current.material.forEach((material) => material.dispose());
      } else {
        windowBoxRef.current.material.dispose();
      }
      windowBoxRef.current = null;
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      if (Array.isArray(corner.material)) {
        corner.material.forEach((material) => material.dispose());
      } else {
        corner.material.dispose();
      }
    });
    cornerRefs.current = [];
  };

  const selectBlindType = (type: string) => setSelectedBlindType(type);
  const selectPattern = (patternUrl: string) => setSelectedPattern(patternUrl);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)
    );
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundColor: capturedImage || isCustomizerView ? "#FFFFFF" : "transparent",
      }}
    >
      <div ref={mountRef} className="relative w-full h-auto min-h-screen">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-[10]"
        />
      </div>
      {instruction && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[100] text-brown-800 text-lg">
          {instruction}
        </div>
      )}
      <button
        onClick={handleButtonClick}
        className="fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100]"
      >
        {buttonText}
      </button>
      {!capturedImage && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100]"
        >
          Upload Image
        </button>
      )}
      {isCustomizerView && (
        <button
          onClick={saveImage}
          className="fixed bottom-16 right-5 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100]"
        >
          Save Image
        </button>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {showBlindMenu && isCustomizerView && (
        <div className="relative max-w-7xl mx-auto p-4 flex flex-col items-start justify-center gap-4 min-h-screen">
          <div className="w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700">Select Type of Blind</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5">
              {blindTypes.map(({ type, buttonImage }) => (
                <div
                  key={type}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => selectBlindType(type)}
                >
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="w-14 h-14 rounded shadow-md hover:scale-105 transition"
                  />
                  <div className="mt-1 text-gray-700 text-[11px]">{type}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700">Available Patterns</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5">
              {filteredPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => selectPattern(pattern.image)}
                >
                  <img
                    src={pattern.image}
                    alt={pattern.name}
                    className="w-12 h-12 rounded shadow-md hover:scale-105 transition"
                  />
                  <div className="flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
                    <span>{pattern.name}</span>
                    <span>{pattern.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPageAI;