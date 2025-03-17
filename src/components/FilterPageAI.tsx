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

// Declare external numeric library for homography computation
declare const numeric: any;

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
    console.log("Component mounted, loading numeric.js");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js";
    script.async = true;
    script.onload = () => {
      console.log("numeric.js loaded successfully");
      setupThreeJS();
    };
    script.onerror = () => console.error("Failed to load numeric.js");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
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

    console.log("Renderer initialized and appended to mountRef");

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
    windowBoxRef.current.material.dispose();

    const newBox = new THREE.Mesh(geometry, material);
    newBox.position.z = 0.01;
    scene.add(newBox);
    windowBoxRef.current = newBox;
  };

  const computeHomography = (srcPoints: THREE.Vector2[], dstPoints: THREE.Vector2[]): number[] => {
    if (srcPoints.length !== 4 || dstPoints.length !== 4) {
      console.error("Homography requires exactly 4 points");
      return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    const A = [];
    const b = [];

    for (let i = 0; i < 4; i++) {
      const [sx, sy] = [srcPoints[i].x, srcPoints[i].y];
      const [dx, dy] = [dstPoints[i].x, dstPoints[i].y];
      A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
      A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
      b.push(dx);
      b.push(dy);
    }

    try {
      const solution = numeric.solve(A, b);
      return solution.concat(1);
    } catch (error) {
      console.error("Error computing homography:", error);
      return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
  };

  const extractRotationFromHomography = (h: number[]): THREE.Quaternion => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const fov = 45;
    const fx = (width / 2) / Math.tan((fov * Math.PI / 180) / 2);
    const fy = fx;
    const cx = width / 2;
    const cy = height / 2;

    const K = [
      [fx, 0, cx],
      [0, fy, cy],
      [0, 0, 1],
    ];
    const K_inv = numeric.inv(K);

    const H = [
      [h[0], h[1], h[2]],
      [h[3], h[4], h[5]],
      [h[6], h[7], h[8]],
    ];

    const R_approx = numeric.dot(K_inv, H);
    let r1 = [R_approx[0][0], R_approx[1][0], R_approx[2][0]];
    let r2 = [R_approx[0][1], R_approx[1][1], R_approx[2][1]];
    const r3 = [
      r1[1] * r2[2] - r1[2] * r2[1],
      r1[2] * r2[0] - r1[0] * r2[2],
      r1[0] * r2[1] - r1[1] * r2[0],
    ];

    const norm_r1 = Math.sqrt(r1.reduce((sum, v) => sum + v * v, 0)) || 1;
    const norm_r2 = Math.sqrt(r2.reduce((sum, v) => sum + v * v, 0)) || 1;
    const norm_r3 = Math.sqrt(r3.reduce((sum, v) => sum + v * v, 0)) || 1;

    r1 = r1.map((v) => v / norm_r1);
    r2 = r2.map((v) => v / norm_r2);
    const r3_normalized = r3.map((v) => v / norm_r3);

    const R = [
      [r1[0], r2[0], r3_normalized[0]],
      [r1[1], r2[1], r3_normalized[1]],
      [r1[2], r2[2], r3_normalized[2]],
    ];

    const matrix = new THREE.Matrix4().set(
      R[0][0], R[0][1], R[0][2], 0,
      R[1][0], R[1][1], R[1][2], 0,
      R[2][0], R[2][1], R[2][2], 0,
      0, 0, 0, 1
    );

    return new THREE.Quaternion().setFromRotationMatrix(matrix);
  };

  const createModelBoxWithShadeBake = (corners: THREE.Vector3[]) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera || corners.length !== 4) {
      console.error("Cannot create model: Invalid scene, camera, or corners");
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

        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize);
        const modelCenter = new THREE.Vector3();
        box.getCenter(modelCenter);
        console.log("Model Size:", modelSize);
        console.log("Model Center (local):", modelCenter);

        const modelCorners = [
          new THREE.Vector2(-modelSize.x / 2, -modelSize.y / 2),
          new THREE.Vector2(modelSize.x / 2, -modelSize.y / 2),
          new THREE.Vector2(modelSize.x / 2, modelSize.y / 2),
          new THREE.Vector2(-modelSize.x / 2, modelSize.y / 2),
        ];
        console.log("Model Corners:", modelCorners);

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const drawnCorners2D = corners.map((corner) => {
          const screenPos = corner.clone().project(camera);
          return new THREE.Vector2(
            (-screenPos.x + 1) * screenWidth / 2,
            (-screenPos.y + 1) * screenHeight / 2
          );
        });
        console.log("Drawn Corners (screen space):", drawnCorners2D);

        const sortedCorners2D = [...drawnCorners2D];
        sortedCorners2D.sort((a, b) => a.y - b.y);
        const bottomCorners = sortedCorners2D.slice(0, 2);
        const topCorners = sortedCorners2D.slice(2, 4);
        bottomCorners.sort((a, b) => a.x - b.x);
        topCorners.sort((a, b) => a.x - b.x);
        const orderedCorners2D = [
          bottomCorners[0],
          bottomCorners[1],
          topCorners[1],
          topCorners[0],
        ];
        console.log("Ordered Drawn Corners:", orderedCorners2D);

        const homography = computeHomography(modelCorners, orderedCorners2D);
        console.log("Homography Matrix:", homography);

        const quaternion = extractRotationFromHomography(homography);
        model.quaternion.copy(quaternion);

        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
        const eulerBefore = new THREE.Euler().setFromQuaternion(quaternion, "YXZ");
        console.log("Euler Before Orthogonalization:", {
          yaw: eulerBefore.y,
          pitch: eulerBefore.x,
          roll: eulerBefore.z,
        });

        const elements = rotationMatrix.elements;
        const R = [
          [elements[0], elements[4], elements[8]],
          [elements[1], elements[5], elements[9]],
          [elements[2], elements[6], elements[10]],
        ];
        const svdResult = numeric.svd(R);
        const correctedR = numeric.dot(svdResult.U, numeric.transpose(svdResult.V));

        rotationMatrix.set(
          correctedR[0][0], correctedR[0][1], correctedR[0][2], 0,
          correctedR[1][0], correctedR[1][1], correctedR[1][2], 0,
          correctedR[2][0], correctedR[2][1], correctedR[2][2], 0,
          0, 0, 0, 1
        );
        model.quaternion.setFromRotationMatrix(rotationMatrix);

        const eulerAfter = new THREE.Euler().setFromQuaternion(model.quaternion, "YXZ");
        console.log("Euler After Orthogonalization:", {
          yaw: eulerAfter.y,
          pitch: eulerAfter.x,
          roll: eulerAfter.z,
        });

        const targetWidth = Math.sqrt(
          Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)
        );
        const targetHeight = Math.sqrt(
          Math.pow(corners[3].x - corners[0].x, 2) + Math.pow(corners[3].y - corners[0].y, 2)
        );
        const scaleX = targetWidth / modelSize.x;
        const scaleY = targetHeight / modelSize.y;
        const scaleFactor = 1;
        model.scale.set(scaleX * 1.2, scaleY * scaleFactor, Math.min(scaleX, scaleY) * scaleFactor);
        console.log("Applied Scale:", model.scale);

        const quadCenter = new THREE.Vector3();
        corners.forEach((corner) => quadCenter.add(corner));
        quadCenter.divideScalar(4);
        model.position.copy(quadCenter);

        const offset = modelCenter.clone().applyQuaternion(model.quaternion).multiply(model.scale);
        model.position.sub(offset);
        model.position.z = 0.1;
        model.position.x += 0.25;
        model.position.y += 0.15;
        console.log("Model Position (adjusted):", model.position);

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

        rendererRef.current?.render(scene, camera);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setInstruction("Failed to load shade model.");
      }
    );
  };

  const handleButtonClick = () => {
    console.log("Button clicked:", buttonText);
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
      windowBoxRef.current.material.dispose();
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      corner.material.dispose();
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

  // Set image as scene background
  const setBackgroundImage = (imageData: string): Promise<void> => {
    return new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageData, (texture) => {
        sceneRef.current.background = texture; // Set as scene background
        drawDefaultQuadrilateral(window.innerWidth, window.innerHeight); // Draw quadrilateral
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
      windowBoxRef.current.material.dispose();
      windowBoxRef.current = null;
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      corner.material.dispose();
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