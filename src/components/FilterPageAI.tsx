import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import numeric from "numeric";

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

const FilterPageAI: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenCvReady, setIsOpenCvReady] = useState(false);

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
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowBoxRef = useRef<THREE.Mesh | null>(null);
  const windowGizmoRef = useRef<THREE.Group | null>(null);
  const cornerRefs = useRef<THREE.Mesh[]>([]);
  const shadeBakeRef = useRef<THREE.Group | null>(null);
  const matchingPlaneRef = useRef<THREE.Mesh | null>(null);
  const box3DRef = useRef<THREE.Mesh | null>(null);
  const modelBoxRef = useRef<THREE.Mesh | null>(null);

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
    const loadOpenCv = () => {
      if (window.cv && typeof window.cv.imread === "function") {
        console.log("OpenCV.js is fully loaded and ready");
        setIsOpenCvReady(true);
      } else {
        console.log("OpenCV.js not ready yet, loading...");
        const script = document.createElement("script");
        script.src = "https://docs.opencv.org/4.5.2/opencv.js";
        script.async = true;
        script.onload = () => {
          console.log("OpenCV.js script loaded");
          if (window.cv && typeof window.cv.imread === "function") {
            setIsOpenCvReady(true);
          } else {
            console.error("OpenCV.js loaded but imread not available");
          }
        };
        script.onerror = () => {
          console.error("Failed to load OpenCV.js");
          setNewProcess("opencv-error", "Failed to load OpenCV.js. Please refresh the page.");
        };
        document.body.appendChild(script);
      }
    };
    loadOpenCv();
  }, []);

  useEffect(() => {
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

    renderer.setClearColor(0x000000, 0);
    renderer.depthTest = true;
    renderer.depthWrite = true;

    mountRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${isCustomizerView ? 0 : 20};
      pointer-events: ${isCustomizerView ? "none" : "auto"};
    `;

    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
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
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      cornerRefs.current.forEach((corner) => {
        if (corner.userData.isDragging) {
          raycaster.setFromCamera(mouse, cameraRef.current!);
          const plane = backgroundPlaneRef.current!;
          const intersect = raycaster.intersectObject(plane);
          if (intersect.length > 0) {
            const newPosition = intersect[0].point;
            corner.position.set(newPosition.x, newPosition.y, 0.03);
            updateWindowBoxShape();
          }
        }
      });
    };

    const handleMouseUp = () => {
      cornerRefs.current.forEach((corner) => {
        corner.userData.isDragging = false;
      });
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
        if (backgroundPlaneRef.current && capturedImage) {
          adjustBackgroundPlane(newWidth, newHeight);
        }
        if (windowBoxRef.current) {
          adjustWindowBoxAndGizmo(newWidth, newHeight);
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
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCustomizerView, capturedImage]);

  const updateCameraPosition = (width: number, height: number) => {
    if (!cameraRef.current) return;
    const fovRad = cameraRef.current.fov * (Math.PI / 180);
    const distance = (height / 100 / 2) / Math.tan(fovRad / 2);
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
    backgroundPlaneRef.current.renderOrder = 0;
    updateCameraPosition(width, height);
  };

  const adjustWindowBoxAndGizmo = (width: number, height: number) => {
    if (!windowBoxRef.current || !windowGizmoRef.current || !backgroundPlaneRef.current) return;
    const plane = backgroundPlaneRef.current;
    const planeWidth = (plane.geometry as THREE.PlaneGeometry).parameters.width;
    const planeHeight = (plane.geometry as THREE.PlaneGeometry).parameters.height;

    const mappedCorners = cornerRefs.current.map((corner) => corner.position.clone());

    const shape = new THREE.Shape();
    shape.moveTo(mappedCorners[0].x, mappedCorners[0].y);
    shape.lineTo(mappedCorners[1].x, mappedCorners[1].y);
    shape.lineTo(mappedCorners[2].x, mappedCorners[2].y);
    shape.lineTo(mappedCorners[3].x, mappedCorners[3].y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    windowBoxRef.current.geometry.dispose();
    windowBoxRef.current.geometry = geometry;
    windowBoxRef.current.position.set(0, 0, 0.01);

    const planeCenterX = (mappedCorners[0].x + mappedCorners[2].x) / 2;
    const planeCenterY = (mappedCorners[0].y + mappedCorners[2].y) / 2;
    windowGizmoRef.current.position.set(planeCenterX, planeCenterY, 0.02);
  };

  const createMatchingPlane = (corners: THREE.Vector3[]) => {
    const scene = sceneRef.current;
    if (!scene || corners.length !== 4) return;

    if (matchingPlaneRef.current) {
      scene.remove(matchingPlaneRef.current);
      matchingPlaneRef.current.geometry.dispose();
      matchingPlaneRef.current.material.dispose();
      matchingPlaneRef.current = null;
    }

    const shape = new THREE.Shape();
    shape.moveTo(corners[0].x, corners[0].y);
    shape.lineTo(corners[1].x, corners[1].y);
    shape.lineTo(corners[2].x, corners[2].y);
    shape.lineTo(corners[3].x, corners[3].y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0.02;
    plane.renderOrder = 1;

    scene.add(plane);
    matchingPlaneRef.current = plane;

    console.log("Matching plane created with corners:", corners);
  };

  const create3DBox = (corners: THREE.Vector3[]) => {
    const scene = sceneRef.current;
    if (!scene || corners.length !== 4 || !cameraRef.current) return;

    if (box3DRef.current) {
      scene.remove(box3DRef.current);
      box3DRef.current.geometry.dispose();
      box3DRef.current.material.dispose();
      box3DRef.current = null;
    }

    const shape = new THREE.Shape();
    shape.moveTo(corners[0].x, corners[0].y);
    shape.lineTo(corners[1].x, corners[1].y);
    shape.lineTo(corners[2].x, corners[2].y);
    shape.lineTo(corners[3].x, corners[3].y);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      opacity: 0.7,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const box = new THREE.Mesh(geometry, material);
    const centerX = corners.reduce((sum, v) => sum + v.x, 0) / 4;
    const centerY = corners.reduce((sum, v) => sum + v.y, 0) / 4;
    box.position.set(centerX, centerY, 0.05);
    box.renderOrder = 1;

    scene.add(box);
    box3DRef.current = box;

    const width = Math.sqrt(
      Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)
    );
    const height = Math.sqrt(
      Math.pow(corners[3].x - corners[0].x, 2) + Math.pow(corners[3].y - corners[0].y, 2)
    );
    console.log("Green Box Dimensions: Width =", width, "Height =", height);

    if (!scene.getObjectByName("ambientLight")) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      ambientLight.name = "ambientLight";
      scene.add(ambientLight);
    }
    if (!scene.getObjectByName("directionalLight")) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 0, 5);
      directionalLight.name = "directionalLight";
      scene.add(directionalLight);
    }
  };

  const createModelBoxWithShadeBake = (corners: THREE.Vector3[]) => {
    const scene = sceneRef.current;
    if (!scene || corners.length !== 4 || !cameraRef.current) return;
  
    if (modelBoxRef.current) {
      scene.remove(modelBoxRef.current);
      if (modelBoxRef.current.geometry) modelBoxRef.current.geometry.dispose();
      if (modelBoxRef.current.material) modelBoxRef.current.material.dispose();
      modelBoxRef.current = null;
    }
    if (shadeBakeRef.current) {
      scene.remove(shadeBakeRef.current);
      shadeBakeRef.current = null;
    }
  
    // Tweakable rotation values (in radians)
    const pitchAdjustment = 0; // Rotation around X-axis (tilting up/down)
    const yawAdjustment = 0;   // Rotation around Y-axis (left/right in XZ plane)
    const rollAdjustment = 0;  // Rotation around Z-axis (tilting side to side)
  
    const loader = new GLTFLoader();
    loader.load(
      "/models/shadeBake.glb",
      (gltf) => {
        const model = gltf.scene;
        shadeBakeRef.current = model;
  
        const box = new THREE.Box3().setFromObject(model);
        const modelSize = new THREE.Vector3();
        box.getSize(modelSize);
        console.log("Original Model Size:", modelSize);
  
        const targetWidth = Math.sqrt(
          Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)
        );
        const targetHeight = Math.sqrt(
          Math.pow(corners[3].x - corners[0].x, 2) + Math.pow(corners[3].y - corners[0].y, 2)
        );
  
        const scaleX = targetWidth / modelSize.x;
        const scaleZ = targetHeight / modelSize.z;
        const scaleY = Math.min(scaleX, scaleZ);
        model.scale.set(scaleX, -scaleY, 1);
        console.log("Applied Scale:", scaleX, scaleY, scaleZ);
  
        const sourceCorners = [
          new THREE.Vector2(-modelSize.x / 2, -modelSize.z / 2),
          new THREE.Vector2(modelSize.x / 2, -modelSize.z / 2),
          new THREE.Vector2(modelSize.x / 2, modelSize.z / 2),
          new THREE.Vector2(-modelSize.x / 2, modelSize.z / 2),
        ];
  
        const targetCorners = corners.map((c) => new THREE.Vector2(c.x, c.y));
  
        let homography;
        try {
          homography = computeHomography(sourceCorners, targetCorners);
          console.log("Computed Homography:", homography);
        } catch (error) {
          console.error("Homography computation failed:", error);
          homography = null;
        }
  
        if (homography) {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              const geometry = child.geometry.clone();
              const positionAttribute = geometry.getAttribute("position");
              const vertices = positionAttribute.array;
  
              for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const y = vertices[i + 1];
                const z = vertices[i + 2];
  
                const srcPoint = new THREE.Vector2(x, z);
                const [newX, newY] = applyHomography(srcPoint, homography);
  
                vertices[i] = newX;
                vertices[i + 1] = y;
                vertices[i + 2] = newY;
              }
  
              positionAttribute.needsUpdate = true;
              geometry.computeVertexNormals();
              child.geometry = geometry;
            }
          });
        } else {
          console.warn("Using fallback: No deformation applied, only scaling and positioning.");
        }
  
        // Position the model at the center of the quadrilateral
        const centerX = corners.reduce((sum, v) => sum + v.x, 0) / 4;
        const centerY = corners.reduce((sum, v) => sum + v.y, 0) / 4;
        model.position.set(centerX, centerY-2.5, 0.5);
  
        // Base orientation from quadrilateral
        const vectorX = new THREE.Vector3()
          .subVectors(corners[1], corners[0])
          .normalize(); // X-axis: bottom edge
        const vectorY = new THREE.Vector3()
          .subVectors(corners[3], corners[0])
          .normalize(); // Y-axis: left edge
        const normal = new THREE.Vector3()
          .crossVectors(vectorX, vectorY)
          .normalize(); // Z-axis: normal to plane
  
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(vectorX, vectorY, normal);
        model.quaternion.setFromRotationMatrix(matrix);
  
        // Apply tweakable rotations (in local space)
        model.rotateX(pitchAdjustment); // Pitch: around local X-axis
        model.rotateY(yawAdjustment);   // Yaw: around local Y-axis
        model.rotateZ(rollAdjustment);  // Roll: around local Z-axis
  
        // Log the applied rotations for debugging
        console.log("Applied Rotations (radians):", {
          pitch: pitchAdjustment,
          yaw: yawAdjustment,
          roll: rollAdjustment,
        });
  
        // Ensure visibility
        model.renderOrder = 2;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.renderOrder = 2;
            if (child.material) {
              child.material.depthTest = true;
              child.material.depthWrite = true;
              child.material.side = THREE.DoubleSide;
            }
          }
        });
  
        scene.add(model);
        console.log("Model with shadeBake deformed and aligned with corners (scaled):", corners);
  
        if (!scene.getObjectByName("ambientLight")) {
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          ambientLight.name = "ambientLight";
          scene.add(ambientLight);
        }
        if (!scene.getObjectByName("directionalLight")) {
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
          directionalLight.position.set(0, 0, 5);
          directionalLight.name = "directionalLight";
          scene.add(directionalLight);
        }
  
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.render(scene, cameraRef.current);
        }
      },
      undefined,
      (error) => {
        console.error("Error loading shadeBake.glb:", error);
        setNewProcess("model-load-error", "Failed to load shade model.");
      }
    );
  };

  function computeHomography(srcPoints: THREE.Vector2[], dstPoints: THREE.Vector2[]): number[] {
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

    return solveLinearSystem(A, b).concat(1);
  }

  function applyHomography(point: THREE.Vector2, h: number[]): [number, number] {
    const [x, y] = [point.x, point.y];
    const w = h[6] * x + h[7] * y + h[8];
    if (Math.abs(w) < 1e-10) return [x, y];
    const newX = (h[0] * x + h[1] * y + h[2]) / w;
    const newY = (h[3] * x + h[4] * y + h[5]) / w;
    return [newX, newY];
  }

  function solveLinearSystem(A: number[][], b: number[]): number[] {
    if (typeof numeric === "undefined" || !numeric.solve) {
      console.error("numeric library not available, using identity fallback");
      return [1, 0, 0, 0, 1, 0, 0, 0];
    }
    try {
      const solution = numeric.solve(A, b);
      console.log("Linear system solved:", solution);
      return solution;
    } catch (error) {
      console.error("Error solving linear system:", error);
      return [1, 0, 0, 0, 1, 0, 0, 0];
    }
  }

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
    newBox.userData = windowBoxRef.current.userData;
    scene.add(newBox);
    windowBoxRef.current = newBox;

    createMatchingPlane(positions);
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
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className =
      "fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100]";
    controlButtonRef.current.disabled = !isOpenCvReady;
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    uploadButtonRef.current = document.createElement("button");
    uploadButtonRef.current.textContent = "Upload Image";
    uploadButtonRef.current.className =
      "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100]";
    uploadButtonRef.current.disabled = !isOpenCvReady;
    document.body.appendChild(uploadButtonRef.current);
    uploadButtonRef.current.addEventListener("click", () =>
      fileInputRef.current?.click()
    );

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className =
      "fixed bottom-16 right-5 py-3 px-6 text-lg bg-[#2F3526] text-white rounded-lg shadow-md hover:bg-[#3F4536] z-[100] hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    const backButton = document.createElement("button");
    backButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    `;
    backButton.className =
      "absolute top-5 left-5 p-2 bg-[#2F3526] text-white rounded-full shadow-md hover:bg-[#3F4536] z-[100]";
    document.body.appendChild(backButton);
    backButton.addEventListener("click", () => {
      window.location.href = "/";
    });

    return () => {
      if (overlayImageRef.current && mount) mount.removeChild(overlayImageRef.current);
      if (videoRef.current && mount) mount.removeChild(videoRef.current);
      [controlButtonRef, uploadButtonRef, saveButtonRef].forEach((ref) => {
        if (ref.current && document.body.contains(ref.current)) {
          document.body.removeChild(ref.current);
        }
      });
      if (backButton && document.body.contains(backButton)) {
        document.body.removeChild(backButton);
      }
    };
  }, [isOpenCvReady]);

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
        video: { facingMode: "environment" },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          overlayImageRef.current?.classList.remove("hidden");
          controlButtonRef.current!.textContent = "Capture";
          uploadButtonRef.current?.style.setProperty("display", "none");
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

  const detectWindowInImage = (imageData: string): Promise<{
    corners: [number, number][];
    angle: number;
    imgWidth: number;
    imgHeight: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!isOpenCvReady || !window.cv) {
        reject(new Error("OpenCV.js is not loaded yet"));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const src = window.cv.imread(canvas);

        const gray = new window.cv.Mat();
        const blurred = new window.cv.Mat();
        const edges = new window.cv.Mat();
        const contours = new window.cv.MatVector();
        const hierarchy = new window.cv.Mat();

        window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY, 0);
        window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0);
        window.cv.adaptiveThreshold(
          blurred,
          edges,
          255,
          window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          window.cv.THRESH_BINARY_INV,
          11,
          2
        );
        window.cv.Canny(edges, edges, 30, 100, 3, true);
        window.cv.dilate(
          edges,
          edges,
          window.cv.Mat.ones(3, 3, window.cv.CV_8U),
          new window.cv.Point(-1, -1),
          1
        );
        window.cv.findContours(
          edges,
          contours,
          hierarchy,
          window.cv.RETR_EXTERNAL,
          window.cv.CHAIN_APPROX_SIMPLE
        );

        let bestRect: any = null;
        let maxArea = 0;

        console.log(`Found ${contours.size()} contours`);

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = window.cv.contourArea(contour);
          const perimeter = window.cv.arcLength(contour, true);
          const approx = new window.cv.Mat();
          window.cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

          if (approx.rows === 4 && area > img.width * img.height * 0.02) {
            const rect = window.cv.minAreaRect(contour);
            const aspectRatio = rect.size.width / rect.size.height;
            console.log(`Contour ${i}: Area=${area}, AspectRatio=${aspectRatio}`);
            if (aspectRatio > 0.3 && aspectRatio < 3 && area > maxArea) {
              maxArea = area;
              bestRect = rect;
            }
          }
          approx.delete();
        }

        const getRectCorners = (rect: any): [number, number][] => {
          const center = rect.center;
          const width = rect.size.width;
          const height = rect.size.height;
          const angleRad = rect.angle * (Math.PI / 180);

          const cosA = Math.cos(angleRad);
          const sinA = Math.sin(angleRad);
          const halfW = width / 2;
          const halfH = height / 2;

          return [
            [-halfW, -halfH],
            [halfW, -halfH],
            [halfW, halfH],
            [-halfW, halfH],
          ].map(([x, y]) => {
            const rotX = x * cosA - y * sinA;
            const rotY = x * sinA + y * cosA;
            return [center.x + rotX, center.y + rotY];
          });
        };

        if (bestRect) {
          const corners = getRectCorners(bestRect);
          console.log("Detected window corners:", corners);
          resolve({
            corners,
            angle: bestRect.angle,
            imgWidth: img.width,
            imgHeight: img.height,
          });
        } else {
          console.log("No window detected, using fallback corners");
          const corners: [number, number][] = [
            [img.width * 0.2, img.height * 0.2],
            [img.width * 0.8, img.height * 0.2],
            [img.width * 0.8, img.height * 0.8],
            [img.width * 0.2, img.height * 0.8],
          ];
          resolve({
            corners,
            angle: 0,
            imgWidth: img.width,
            imgHeight: img.height,
          });
        }

        src.delete();
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageData;
    });
  };

  const drawWindowBoxAndGizmo = (
    corners: [number, number][],
    angle: number,
    imgWidth: number,
    imgHeight: number
  ) => {
    const scene = sceneRef.current;
    const plane = backgroundPlaneRef.current;
    if (!scene || !plane) {
      console.error("Scene or plane not ready for rendering box");
      return;
    }

    if (windowBoxRef.current) {
      scene.remove(windowBoxRef.current);
      windowBoxRef.current.geometry.dispose();
      windowBoxRef.current.material.dispose();
    }
    if (windowGizmoRef.current) {
      scene.remove(windowGizmoRef.current);
      windowGizmoRef.current.children.forEach((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      corner.material.dispose();
    });
    cornerRefs.current = [];

    const planeWidth = (plane.geometry as THREE.PlaneGeometry).parameters.width;
    const planeHeight = (plane.geometry as THREE.PlaneGeometry).parameters.height;
    const scaleX = planeWidth / imgWidth;
    const scaleY = planeHeight / imgHeight;

    const mappedCorners = corners.map(([x, y]) => {
      const planeX = x * scaleX - planeWidth / 2;
      const planeY = -(y * scaleY) + planeHeight / 2;
      return new THREE.Vector3(planeX, planeY, 0);
    });

    const shape = new THREE.Shape();
    shape.moveTo(mappedCorners[0].x, mappedCorners[0].y);
    shape.lineTo(mappedCorners[1].x, mappedCorners[1].y);
    shape.lineTo(mappedCorners[2].x, mappedCorners[2].y);
    shape.lineTo(mappedCorners[3].x, mappedCorners[3].y);
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
    box.userData = { corners, angle, imgWidth, imgHeight };
    scene.add(box);
    windowBoxRef.current = box;

    createMatchingPlane(mappedCorners);

    const cornerGeometry = new THREE.SphereGeometry(0.05 * planeWidth, 16, 16);
    const cornerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    mappedCorners.forEach((pos, index) => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      corner.position.set(pos.x, pos.y, 0.03);
      corner.userData = { index, isDragging: false };
      scene.add(corner);
      cornerRefs.current.push(corner);
    });

    const centerX = mappedCorners.reduce((sum, v) => sum + v.x, 0) / 4;
    const centerY = mappedCorners.reduce((sum, v) => sum + v.y, 0) / 4;
    const gizmo = new THREE.Group();
    const arrowGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1 * planeWidth, 0, 0),
    ]);
    const arrowMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
    const arrow = new THREE.Line(arrowGeometry, arrowMaterial);
    gizmo.add(arrow);
    gizmo.position.set(centerX, centerY, 0.02);
    gizmo.rotation.z = -(angle * Math.PI) / 180;
    scene.add(gizmo);
    windowGizmoRef.current = gizmo;

    console.log("Customizable quadrilateral box and corners added to scene");
  };

  const loadTextureAndCreatePlane = (
    imageData: string,
    width: number,
    height: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageData, (texture) => {
        if (backgroundPlaneRef.current) {
          sceneRef.current!.remove(backgroundPlaneRef.current);
          backgroundPlaneRef.current.geometry.dispose();
          backgroundPlaneRef.current.material.dispose();
        }

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
        plane.position.set(0, 0, -0.1);
        plane.renderOrder = 0;
        backgroundPlaneRef.current = plane;
        sceneRef.current!.add(plane);
        updateCameraPosition(width, height);
        console.log("Background plane added with dimensions:", planeWidth, planeHeight);
        resolve();
      });
    });
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    completeCurrentProcess();
    setNewProcess("capture", "Analyzing image for window...");

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL("image/png");

    setCapturedImage(imageData);
    localStorage.setItem("capturedImage", imageData);
    cleanupCameraStream();
    controlButtonRef.current!.textContent = "Submit";

    if (!isOpenCvReady) {
      setNewProcess("capture-failed", "OpenCV.js is not ready yet. Please wait and try again.");
      return;
    }

    try {
      await loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
      const { corners, angle, imgWidth, imgHeight } = await detectWindowInImage(imageData);
      drawWindowBoxAndGizmo(corners, angle, imgWidth, imgHeight);
      setNewProcess("capture-success", "Window detected! Adjust corners if needed, then click 'Submit'.");
    } catch (error) {
      console.error("Window detection failed:", error);
      setNewProcess("capture-failed", "No window detected, using fallback. Adjust corners if needed.");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    completeCurrentProcess();
    setNewProcess("upload", "Analyzing uploaded image for window...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      localStorage.setItem("capturedImage", imageData);
      controlButtonRef.current!.textContent = "Submit";
      uploadButtonRef.current?.style.setProperty("display", "none");

      if (!isOpenCvReady) {
        setNewProcess("upload-failed", "OpenCV.js is not ready yet. Please wait and try again.");
        return;
      }

      try {
        await loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
        const { corners, angle, imgWidth, imgHeight } = await detectWindowInImage(imageData);
        drawWindowBoxAndGizmo(corners, angle, imgWidth, imgHeight);
        setNewProcess("upload-success", "Window detected! Adjust corners if needed, then click 'Submit'.");
      } catch (error) {
        console.error("Window detection failed:", error);
        setNewProcess("upload-failed", "No window detected, using fallback. Adjust corners if needed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const cleanupCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.classList.add("hidden");
      }
      if (overlayImageRef.current) {
        overlayImageRef.current.classList.add("hidden");
      }
    }
  };

  const saveImage = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    triggerDownload(dataUrl);
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "window_detected_image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitAndShowMenu = () => {
    setNewProcess("customize", "Select a blind type and pattern, then click 'Save Image' to download.");
    setShowBlindMenu(true);
    setIsCustomizerView(true);

    const scene = sceneRef.current;
    const positions = cornerRefs.current.map((corner) =>
      new THREE.Vector3(corner.position.x, corner.position.y, 0)
    );

    create3DBox(positions);
    createModelBoxWithShadeBake(positions);

    if (windowBoxRef.current) {
      scene.remove(windowBoxRef.current);
      windowBoxRef.current.geometry.dispose();
      windowBoxRef.current.material.dispose();
      windowBoxRef.current = null;
    }
    if (windowGizmoRef.current) {
      scene.remove(windowGizmoRef.current);
      windowGizmoRef.current.children.forEach((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      windowGizmoRef.current = null;
    }
    if (matchingPlaneRef.current) {
      scene.remove(matchingPlaneRef.current);
      matchingPlaneRef.current.geometry.dispose();
      matchingPlaneRef.current.material.dispose();
      matchingPlaneRef.current = null;
    }
    cornerRefs.current.forEach((corner) => {
      scene.remove(corner);
      corner.geometry.dispose();
      corner.material.dispose();
    });
    cornerRefs.current = [];

    if (controlButtonRef.current && document.body.contains(controlButtonRef.current)) {
      document.body.removeChild(controlButtonRef.current);
    }
    if (uploadButtonRef.current && document.body.contains(uploadButtonRef.current)) {
      document.body.removeChild(uploadButtonRef.current);
    }
    if (saveButtonRef.current) {
      saveButtonRef.current.classList.remove("hidden");
    }
  };

  const selectBlindType = (type: string) => {
    setSelectedBlindType(type);
  };

  const selectPattern = (patternUrl: string) => {
    setSelectedPattern(patternUrl);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  return (
    <div
      className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage: !capturedImage && !isCustomizerView ? "url('/images/background.jpg')" : "none",
        backgroundColor: capturedImage || isCustomizerView ? "#FFFFFF" : "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div ref={mountRef} className="relative w-full h-auto min-h-screen" />
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
      {!isOpenCvReady && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-yellow-200 p-2 rounded shadow-md z-[100] text-black">
          Loading OpenCV.js, please wait...
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      {showBlindMenu && isCustomizerView && (
        <div className="relative max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen overflow-y-auto">
          <div className="w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
            <h3 className="bg-white p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
              Select Type of Blind
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {blindTypes.map(({ type, buttonImage }) => (
                <div
                  key={type}
                  className="flex flex-col items-center text-center cursor-pointer px-[5px]"
                  onClick={() => selectBlindType(type)}
                >
                  <img
                    src={buttonImage}
                    alt={`${type} Blind`}
                    className="w-14 h-14 rounded shadow-md hover:scale-105 transition object-cover"
                  />
                  <div className="mt-1 text-gray-700 text-[11px]">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center w-full md:w-3/4 relative">
            <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col">
              <div className="p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">
                  Filter Options
                </h3>
                <div className="grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {["solid", "pattern", "solar", "kids", "natural"].map((filter) => (
                    <div key={filter} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 border-2 border-gray-400 rounded-sm cursor-pointer"
                        />
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col flex-1 max-h-[300px] bg-white">
                <h3 className="bg-white pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">
                  Available Patterns
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => selectPattern(pattern.image)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="w-12 h-12 rounded shadow-md hover:scale-105 transition object-cover"
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
            <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="p-2 bg-white rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">
                  Filter Options
                </h3>
                <div className="grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {["solid", "pattern", "solar", "kids", "natural"].map((filter) => (
                    <div key={filter} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 border-2 border-gray-400 rounded-sm cursor-pointer"
                        />
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </label>
                    </div>
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
                      onClick={() => selectPattern(pattern.image)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="w-12 h-12 rounded shadow-md hover:scale-105 transition object-cover"
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
        </div>
      )}
    </div>
  );
};

export default FilterPageAI;