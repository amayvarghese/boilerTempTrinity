import React, { useState, useEffect, useRef } from "react";
import * as THREE from "./three.js-r132/build/three.module.js"; // Adjust path as needed
import { GLTFLoader } from "./three.js-r132/examples/jsm/loaders/GLTFLoader.js";

interface ModelData {
  model: THREE.Group;
  gltf: any;
}

const FilterPage: React.FC = () => {
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(localStorage.getItem("capturedImage"));
  const [instruction, setInstruction] = useState<string>("Click 'Start Camera' to begin.");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const modelsRef = useRef<ModelData[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const hasSelectionBox = useRef(false);
  const lockedScaleRef = useRef<THREE.Vector3 | null>(null); // New ref for locked scale

  const blindTypes = [
    { type: "classicRoman", buttonImage: "/images/windowTypeIcons/image 12.png", modelUrl: "/models/classicRoman.glb" },
    { type: "roller", buttonImage: "/images/windowTypeIcons/image 11.png", modelUrl: "/models/plantationShutter.glb" },
    { type: "roman", buttonImage: "/images/windowTypeIcons/image 13.png", modelUrl: "/models/shadeBake.glb" },
    { type: "plantationShutter", buttonImage: "/images/windowTypeIcons/image 15.png", modelUrl: "/models/plantationShutter.glb" },
    { type: "solar", buttonImage: "/images/windowTypeIcons/image 14.png", modelUrl: "/models/shadeBake.glb" },
    { type: "aluminumSheet", buttonImage: "/images/windowTypeIcons/image 17.png", modelUrl: "/models/plantationShutter.glb" },
    { type: "cellularBlinds", buttonImage: "/images/windowTypeIcons/image 18.png", modelUrl: "/models/shadeBake.glb" },
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

  useEffect(() => {
    console.log("Initializing Three.js scene");
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    if (mountRef.current) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.zIndex = "20";
      console.log("Renderer mounted with size:", window.innerWidth, window.innerHeight);
    }

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        console.log("Resized to:", window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      console.log("Cleaning up Three.js");
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    console.log("Setting up DOM elements");
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
      "fixed bottom-16 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-olive-600 text-white rounded-lg shadow-md hover:bg-olive-700 focus:outline-none focus:ring-2 focus:ring-olive-500 z-[40] transition duration-300";
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.id = "saveButton";
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className =
      "fixed bottom-16 right-5 py-3 px-6 text-lg bg-olive-600 text-white rounded-lg shadow-md hover:bg-olive-700 focus:outline-none focus:ring-2 focus:ring-olive-500 z-[40] transition duration-300 hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    return () => {
      console.log("Cleaning up DOM elements");
      if (overlayImageRef.current && mountRef.current) mountRef.current.removeChild(overlayImageRef.current);
      if (videoRef.current && mountRef.current) mountRef.current.removeChild(videoRef.current);
      if (controlButtonRef.current) document.body.removeChild(controlButtonRef.current);
      if (saveButtonRef.current) document.body.removeChild(saveButtonRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    console.log("Button clicked:", controlButtonRef.current?.textContent);
    if (!controlButtonRef.current) return;
    if (controlButtonRef.current.textContent === "Start Camera") {
      startCameraStream();
      setInstruction("Point your camera and click 'Capture' to take a photo.");
    } else if (controlButtonRef.current.textContent === "Capture") {
      captureImage();
      setInstruction("Draw a box on the image to place the 3D model.");
    } else if (controlButtonRef.current.textContent === "Submit") {
      submitAndShowMenu();
      setInstruction("Select a blind type and pattern, then click 'Save Image' to download.");
    }
  };

  const startCameraStream = () => {
    console.log("Starting camera stream");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
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

  const captureImage = () => {
    console.log("Capturing image");
    if (!videoRef.current) return;
  
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    const displayedWidth = videoRef.current.offsetWidth;
    const displayedHeight = videoRef.current.offsetHeight;
    const videoAspect = videoWidth / videoHeight;
    const displayAspect = displayedWidth / displayedHeight;
  
    let sx, sy, sWidth, sHeight;
    if (videoAspect > displayAspect) {
      sHeight = videoHeight;
      sWidth = videoHeight * displayAspect;
      sx = (videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = videoWidth;
      sHeight = videoWidth / displayAspect;
      sx = 0;
      sy = (videoHeight - sHeight) / 2;
    }
  
    canvas.width = displayedWidth;
    canvas.height = displayedHeight;
    ctx.drawImage(videoRef.current, sx, sy, sWidth, sHeight, 0, 0, displayedWidth, displayedHeight);
  
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
      if (hasSelectionBox.current) {
        console.log("Selection box already exists, skipping");
        return;
      }
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
        const scaleZ = 0.3;
        model.scale.set(scaleX, scaleY, scaleZ);

        lockedScaleRef.current = new THREE.Vector3(scaleX, scaleY, scaleZ);

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
        console.log("3D model added with texture tiling set to 8x8 and scale locked");
      }, undefined, (error) => {
        console.error("Error loading texture:", error);
      });
    }, undefined, (error) => {
      console.error("Error loading model:", error);
    });
  };

  const saveImage = () => {
    console.log("Saving image");
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !capturedImage) return;

    setShowBlindMenu(false);
    if (controlButtonRef.current) controlButtonRef.current.style.display = "none";
    if (saveButtonRef.current) saveButtonRef.current.style.display = "none";

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = rendererRef.current.domElement.width;
      canvas.height = rendererRef.current.domElement.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const backgroundImg = new Image();
        backgroundImg.onload = () => {
          ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

          rendererRef.current.render(sceneRef.current!, cameraRef.current!);
          const renderData = rendererRef.current!.domElement.toDataURL("image/png");
          const renderImg = new Image();
          renderImg.onload = () => {
            ctx.drawImage(renderImg, 0, 0, canvas.width, canvas.height);

            const link = document.createElement("a");
            link.download = "custom_blind_image.png";
            link.href = canvas.toDataURL("image/png");
            link.click();

            setShowBlindMenu(true);
            if (controlButtonRef.current) controlButtonRef.current.style.display = "block";
            if (saveButtonRef.current) saveButtonRef.current.style.display = "block";
          };
          renderImg.src = renderData;
        };
        backgroundImg.src = capturedImage;
      }
    }, 100);
  };

  const submitAndShowMenu = () => {
    console.log("Submitting and showing menu");
    setShowBlindMenu(true);
    if (controlButtonRef.current) controlButtonRef.current.style.display = "none";
    if (saveButtonRef.current) saveButtonRef.current.className = saveButtonRef.current.className.replace(" hidden", "");
  };

  const selectBlindType = (type: string) => {
    console.log("Selected blind type:", type);
    setSelectedBlindType(type);
    if (modelsRef.current.length > 0) {
      updateExistingModel(type);
    }
  };

  const selectPattern = (patternUrl: string) => {
    console.log("Selected pattern:", patternUrl);
    setSelectedPattern(patternUrl);
    if (modelsRef.current.length > 0) {
      updateExistingModelPattern(patternUrl);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  const updateExistingModel = (type: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0 || !lockedScaleRef.current) return;

    console.log("Updating existing model with type:", type);
    const modelUrl = blindTypes.find((b) => b.type === type)?.modelUrl || "/models/shadeBake.glb";
    const { model } = modelsRef.current[0];
    const position = model.position.clone();

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

        newModel.scale.copy(lockedScaleRef.current);
        newModel.position.copy(position);

        sceneRef.current!.add(newModel);
        modelsRef.current[0] = { model: newModel, gltf };
        console.log("Model updated with locked scale and texture tiling set to 8x8");
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
      style={{ fontFamily: "Poppins, sans-serif", backgroundColor: "#F5F5DC" }}
    >
      <div
        ref={mountRef}
        className="relative w-full"
        style={{ height: "calc(100vh - 4rem)", maxHeight: "1132px" }}
      >
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}
      </div>

      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[50] text-brown-800 text-lg">
        {instruction}
      </div>

      {showBlindMenu && (
        <div className="menu-container w-full flex flex-col md:flex-row justify-between gap-4 p-4 md:absolute md:inset-0">
          <div className="blind-type-menu w-full md:w-1/6 bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-30">
            <h3 className="bg-gray-100 p-2 text-left text-sm text-brown-800 shadow h-12 flex items-center sticky top-0">Select Type of Blind</h3>
            <div className="blind-type-content flex flex-col gap-2 mx-5 my-5 overflow-y-auto max-h-[50vh] md:max-h-[calc(100vh-5rem)]">
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
                  <div className="button-text flex justify-center w-full mt-1 text-brown-800 text-[11px]">
                    <span className="text-center">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="patterns-menu w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-30">
            <div className="options-menu p-2 bg-gray-100 rounded shadow">
              <h3 className="mb-2 text-sm text-brown-800 text-left h-12 flex items-center sticky top-0 bg-gray-100">Filter Options</h3>
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
                      <span className="text-brown-800">{filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="scrollable-buttons flex flex-col flex-1 max-h-[50vh] md:max-h-[400px]">
              <h3 className="bg-gray-100 pt-[10px] pb-2 px-2 text-left text-sm text-brown-800 shadow h-12 flex items-center sticky top-0">Available Patterns</h3>
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
                    <div className="button-text flex justify-between w-full mt-0.5 text-brown-800 text-[11px]">
                      <span className="left-text truncate">{pattern.name}</span>
                      <span className="right-text">{pattern.price}</span>
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

export default FilterPage;