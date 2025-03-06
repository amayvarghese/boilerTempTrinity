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
  const [capturedImage, setCapturedImage] = useState<string | null>(localStorage.getItem("capturedImage"));
  const [instruction, setInstruction] = useState("Click 'Start Camera' to begin.");

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const selectionDataRef = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const containerObjectRef = useRef<THREE.Object3D | null>(null);
  const relativeModelDataRef = useRef<{ relX: number; relY: number; relWidth: number; relHeight: number } | null>(null);

  const CAPTURED_WIDTH = 2012, CAPTURED_HEIGHT = 1132;

  const blindTypes = [
    { type: "classicRoman", buttonImage: "/images/windowTypeIcons/image 12.png", modelUrl: "/models/shadeBake.glb" },
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

  const filteredPatterns = patterns.filter(p => filters.length === 0 || p.filterTags.some(tag => filters.includes(tag)));

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, CAPTURED_WIDTH / CAPTURED_HEIGHT, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    if (mountRef.current) {
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      mountRef.current.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;z-index:25;";
    }

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    light.castShadow = true;
    scene.add(light);

    const container = new THREE.Object3D();
    containerObjectRef.current = container;
    scene.add(container);

    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current && !showBlindMenu) {
        const { clientWidth: width, clientHeight: height } = mountRef.current;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      } else if (imageRef.current && showBlindMenu) {
        updateModelScaleAndPosition();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rendererRef.current && mountRef.current) mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current?.dispose();
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      window.removeEventListener("resize", handleResize);
    };
  }, [showBlindMenu]);

  useEffect(() => {
    overlayImageRef.current = document.createElement("img");
    overlayImageRef.current.src = "images/overlayFilter1.png";
    overlayImageRef.current.className = "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";
    mountRef.current?.appendChild(overlayImageRef.current);

    videoRef.current = document.createElement("video");
    videoRef.current.setAttribute("playsinline", "");
    videoRef.current.muted = true;
    videoRef.current.className = "absolute inset-0 w-full h-full object-cover z-[10]";
    mountRef.current?.appendChild(videoRef.current);

    controlButtonRef.current = document.createElement("button");
    controlButtonRef.current.id = "controlButton";
    controlButtonRef.current.textContent = "Start Camera";
    controlButtonRef.current.className = "fixed bottom-16 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-olive-600 text-white rounded-lg shadow-md hover:bg-olive-700 focus:outline-none focus:ring-2 focus:ring-olive-500 z-[40] transition duration-300";
    document.body.appendChild(controlButtonRef.current);
    controlButtonRef.current.addEventListener("click", handleButtonClick);

    saveButtonRef.current = document.createElement("button");
    saveButtonRef.current.id = "saveButton";
    saveButtonRef.current.textContent = "Save Image";
    saveButtonRef.current.className = "fixed bottom-16 right-5 py-3 px-6 text-lg bg-olive-600 text-white rounded-lg shadow-md hover:bg-olive-700 focus:outline-none focus:ring-2 focus:ring-olive-500 z-[40] transition duration-300 hidden";
    document.body.appendChild(saveButtonRef.current);
    saveButtonRef.current.addEventListener("click", saveImage);

    return () => {
      mountRef.current?.removeChild(overlayImageRef.current!);
      mountRef.current?.removeChild(videoRef.current!);
      document.body.removeChild(controlButtonRef.current!);
      document.body.removeChild(saveButtonRef.current!);
    };
  }, []);

  const handleButtonClick = () => {
    if (!controlButtonRef.current) return;
    const text = controlButtonRef.current.textContent;
    if (text === "Start Camera") {
      startCameraStream();
      setInstruction("Point your camera and click 'Capture' to take a photo.");
    } else if (text === "Capture") {
      captureImage();
      setInstruction("Draw a box on the image to place the 3D model.");
    } else if (text === "Submit") {
      submitAndShowMenu();
      setInstruction("Select a blind type and pattern, then click 'Save Image' to download.");
    }
  };

  const startCameraStream = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            overlayImageRef.current!.className = "absolute inset-0 w-full h-full object-fill z-[15] block opacity-70";
            controlButtonRef.current!.textContent = "Capture";
          });
        }
      })
      .catch(err => console.error(err));
  };

  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.videoWidth || !mountRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = CAPTURED_WIDTH;
    canvas.height = CAPTURED_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { videoWidth, videoHeight } = videoRef.current;
    const videoAspect = videoWidth / videoHeight, targetAspect = CAPTURED_WIDTH / CAPTURED_HEIGHT;
    let sx, sy, sWidth, sHeight;
    if (videoAspect > targetAspect) {
      sHeight = videoHeight;
      sWidth = videoHeight * targetAspect;
      sx = (videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = videoWidth;
      sHeight = videoWidth / targetAspect;
      sx = 0;
      sy = (videoHeight - sHeight) / 2;
    }

    ctx.drawImage(videoRef.current, sx, sy, sWidth, sHeight, 0, 0, CAPTURED_WIDTH, CAPTURED_HEIGHT);
    const imageData = canvas.toDataURL("image/png");
    localStorage.setItem("capturedImage", imageData);
    setCapturedImage(imageData);

    while (containerObjectRef.current!.children.length > 0) containerObjectRef.current!.remove(containerObjectRef.current!.children[0]);
    const { clientWidth: containerWidth, clientHeight: containerHeight } = mountRef.current;
    rendererRef.current!.setSize(containerWidth, containerHeight);
    cameraRef.current!.aspect = containerWidth / containerHeight;
    cameraRef.current!.updateProjectionMatrix();

    new THREE.TextureLoader().load(imageData, texture => {
      const fovRad = cameraRef.current!.fov * (Math.PI / 180);
      const heightAtZ = 2 * cameraRef.current!.position.z * Math.tan(fovRad / 2);
      const widthAtZ = heightAtZ * (containerWidth / containerHeight);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(widthAtZ, heightAtZ),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true })
      );
      plane.position.set(0, 0, 0);
      containerObjectRef.current!.add(plane);
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    });

    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    videoRef.current!.className += " hidden";
    overlayImageRef.current!.className = "absolute inset-0 w-full h-full object-fill z-[15] hidden opacity-70";
    initSelectionBox();
    controlButtonRef.current!.textContent = "Submit";
  };

  const initSelectionBox = () => {
    if (selectionBoxRef.current || hasSelectionBox.current) return;
    selectionBoxRef.current = document.createElement("div");
    selectionBoxRef.current.className = "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 hidden pointer-events-auto";
    selectionBoxRef.current.style.zIndex = "25";
    mountRef.current?.appendChild(selectionBoxRef.current);

    let startX: number, startY: number, isDragging = false;

    const handleStart = (x: number, y: number) => {
      if (hasSelectionBox.current) return;
      startX = x; startY = y;
      selectionBoxRef.current!.style.cssText = `left:${startX}px;top:${startY}px;width:0;height:0;${selectionBoxRef.current!.style.cssText}`;
      selectionBoxRef.current!.className = "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-auto";
      isDragging = true;
    };

    const handleMove = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      selectionBoxRef.current.style.width = `${Math.abs(x - startX)}px`;
      selectionBoxRef.current.style.height = `${Math.abs(y - startY)}px`;
      selectionBoxRef.current.style.left = `${Math.min(startX, x)}px`;
      selectionBoxRef.current.style.top = `${Math.min(startY, y)}px`;
    };

    const handleEnd = (x: number, y: number) => {
      if (!isDragging || !selectionBoxRef.current) return;
      selectionBoxRef.current.className += " hidden";
      hasSelectionBox.current = true;
      isDragging = false;
      selectionDataRef.current = { startX, startY, endX: x, endY: y };
      create3DModelFromSelection(startX, startY, x, y);
    };

    const mouseDown = (e: MouseEvent) => { if (!hasSelectionBox.current && e.button === 0) handleStart(e.clientX - mountRef.current!.getBoundingClientRect().left, e.clientY - mountRef.current!.getBoundingClientRect().top); };
    const mouseMove = (e: MouseEvent) => { if (isDragging) handleMove(e.clientX - mountRef.current!.getBoundingClientRect().left, e.clientY - mountRef.current!.getBoundingClientRect().top); };
    const mouseUp = (e: MouseEvent) => { if (isDragging) handleEnd(e.clientX - mountRef.current!.getBoundingClientRect().left, e.clientY - mountRef.current!.getBoundingClientRect().top); };
    const touchStart = (e: TouchEvent) => { e.preventDefault(); if (!hasSelectionBox.current) handleStart(e.touches[0].clientX - mountRef.current!.getBoundingClientRect().left, e.touches[0].clientY - mountRef.current!.getBoundingClientRect().top); };
    const touchMove = (e: TouchEvent) => { if (isDragging) { e.preventDefault(); handleMove(e.touches[0].clientX - mountRef.current!.getBoundingClientRect().left, e.touches[0].clientY - mountRef.current!.getBoundingClientRect().top); } };
    const touchEnd = (e: TouchEvent) => { if (isDragging) { e.preventDefault(); handleEnd(e.changedTouches[0].clientX - mountRef.current!.getBoundingClientRect().left, e.changedTouches[0].clientY - mountRef.current!.getBoundingClientRect().top); } };

    mountRef.current?.addEventListener("mousedown", mouseDown);
    mountRef.current?.addEventListener("mousemove", mouseMove);
    mountRef.current?.addEventListener("mouseup", mouseUp);
    mountRef.current?.addEventListener("touchstart", touchStart);
    mountRef.current?.addEventListener("touchmove", touchMove);
    mountRef.current?.addEventListener("touchend", touchEnd);

    return () => {
      mountRef.current?.removeEventListener("mousedown", mouseDown);
      mountRef.current?.removeEventListener("mousemove", mouseMove);
      mountRef.current?.removeEventListener("mouseup", mouseUp);
      mountRef.current?.removeEventListener("touchstart", touchStart);
      mountRef.current?.removeEventListener("touchmove", touchMove);
      mountRef.current?.removeEventListener("touchend", touchEnd);
      mountRef.current?.removeChild(selectionBoxRef.current!);
    };
  };

  const create3DModelFromSelection = (startX: number, startY: number, endX: number, endY: number) => {
    if (!sceneRef.current || modelsRef.current.length > 0 || !containerObjectRef.current) return;
    const width = Math.abs(endX - startX), height = Math.abs(endY - startY);
    const worldWidth = (width / CAPTURED_WIDTH) * 10, worldHeight = (height / CAPTURED_HEIGHT) * (10 * (CAPTURED_HEIGHT / CAPTURED_WIDTH));
    const worldX = (((startX + endX) / 2) / CAPTURED_WIDTH - 0.5) * 10, worldY = -(((startY + endY) / 2) / CAPTURED_HEIGHT - 0.5) * (10 * (CAPTURED_HEIGHT / CAPTURED_WIDTH));

    // Store relative position and size
    relativeModelDataRef.current = {
      relX: (startX + endX) / 2 / CAPTURED_WIDTH,
      relY: (startY + endY) / 2 / CAPTURED_HEIGHT,
      relWidth: width / CAPTURED_WIDTH,
      relHeight: height / CAPTURED_HEIGHT,
    };

    const modelUrl = selectedBlindType ? blindTypes.find(b => b.type === selectedBlindType)?.modelUrl || "/models/shadeBake.glb" : "/models/shadeBake.glb";
    new GLTFLoader().load(modelUrl, gltf => {
      const model = gltf.scene;
      new THREE.TextureLoader().load(selectedPattern || "images/pattern4.jpg", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        model.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.computeBoundingBox();
            mesh.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.3 });
            mesh.material.needsUpdate = true;
          }
        });
        const box = new THREE.Box3().setFromObject(model), modelSize = new THREE.Vector3();
        box.getSize(modelSize);
        model.scale.set(worldWidth / modelSize.x, worldHeight / modelSize.y, 0.3);
        model.position.set(worldX, worldY, 0.1);
        containerObjectRef.current!.add(model);
        modelsRef.current.push({ model, gltf });
        rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      });
    });
  };

  const updateModelScaleAndPosition = () => {
    if (!modelsRef.current.length || !imageRef.current || !relativeModelDataRef.current || !containerObjectRef.current) return;
    const model = modelsRef.current[0].model, { relX, relY, relWidth, relHeight } = relativeModelDataRef.current;
    const { clientWidth: containerWidth, clientHeight: containerHeight } = imageRef.current.parentElement!;
    const imageAspect = CAPTURED_WIDTH / CAPTURED_HEIGHT, containerAspect = containerWidth / containerHeight;
    const [displayedWidth, displayedHeight] = imageAspect > containerAspect ? [containerWidth, containerWidth / imageAspect] : [containerHeight * imageAspect, containerHeight];

    // Calculate new world dimensions based on relative size
    const worldWidth = relWidth * 10;
    const worldHeight = relHeight * (10 * (CAPTURED_HEIGHT / CAPTURED_WIDTH));
    const worldX = (relX - 0.5) * 10;
    const worldY = -(relY - 0.5) * (10 * (CAPTURED_HEIGHT / CAPTURED_WIDTH));

    // Scale container to match displayed size
    containerObjectRef.current.scale.set(displayedWidth / 10, displayedHeight / (10 * (CAPTURED_HEIGHT / CAPTURED_WIDTH)), 1);

    // Adjust model scale and position
    const box = new THREE.Box3().setFromObject(model), modelSize = new THREE.Vector3();
    box.getSize(modelSize);
    model.scale.set(worldWidth / modelSize.x, worldHeight / modelSize.y, 0.3);
    model.position.set(worldX, worldY, 0.1);

    if (cameraRef.current && rendererRef.current) {
      rendererRef.current.setSize(displayedWidth, displayedHeight);
      cameraRef.current.aspect = displayedWidth / displayedHeight;
      cameraRef.current.updateProjectionMatrix();
      const fov = cameraRef.current.fov * (Math.PI / 180), distance = Math.max(displayedWidth, displayedHeight) / (2 * Math.tan(fov / 2)) * 1.5;
      cameraRef.current.position.set(0, 0, distance);
      cameraRef.current.lookAt(0, 0, 0);
      rendererRef.current.render(sceneRef.current!, cameraRef.current!);
    }
  };

  const saveImage = () => {
    if (!capturedImage || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setShowBlindMenu(false);
    controlButtonRef.current!.style.display = saveButtonRef.current!.style.display = "none";
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = CAPTURED_WIDTH;
      canvas.height = CAPTURED_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, CAPTURED_WIDTH, CAPTURED_HEIGHT);
          rendererRef.current!.setSize(CAPTURED_WIDTH, CAPTURED_HEIGHT);
          rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
          const renderImg = new Image();
          renderImg.onload = () => {
            ctx.drawImage(renderImg, 0, 0, CAPTURED_WIDTH, CAPTURED_HEIGHT);
            const link = document.createElement("a");
            link.download = "custom_blind_image.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
            setShowBlindMenu(true);
            controlButtonRef.current!.style.display = saveButtonRef.current!.style.display = "block";
          };
          renderImg.src = rendererRef.current!.domElement.toDataURL("image/png");
        };
        img.src = capturedImage;
      }
    }, 100);
  };

  const submitAndShowMenu = () => {
    setShowBlindMenu(true);
    controlButtonRef.current!.style.display = "none";
    saveButtonRef.current!.className = saveButtonRef.current!.className.replace(" hidden", "");
    if (rendererRef.current && imageRef.current && canvasRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      canvasRef.current.appendChild(rendererRef.current.domElement);
      updateModelScaleAndPosition();
    }
  };

  const selectBlindType = (type: string) => { setSelectedBlindType(type); if (modelsRef.current.length > 0) updateExistingModel(type); };
  const selectPattern = (patternUrl: string) => { setSelectedPattern(patternUrl); if (modelsRef.current.length > 0) updateExistingModelPattern(patternUrl); };
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => e.target.checked ? [...prev, e.target.value] : prev.filter(tag => tag !== e.target.value));

  const updateExistingModel = (type: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0 || !containerObjectRef.current) return;
    const modelUrl = blindTypes.find(b => b.type === type)?.modelUrl || "/models/shadeBake.glb";
    const { model } = modelsRef.current[0], position = model.position.clone(), scale = model.scale.clone();
    containerObjectRef.current.remove(model);
    new GLTFLoader().load(modelUrl, gltf => {
      const newModel = gltf.scene;
      new THREE.TextureLoader().load(selectedPattern || "images/pattern4.jpg", texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        newModel.traverse(child => { if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.3 }); });
        newModel.scale.copy(scale);
        newModel.position.copy(position);
        containerObjectRef.current!.add(newModel);
        modelsRef.current[0] = { model: newModel, gltf };
        rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      });
    });
  };

  const updateExistingModelPattern = (patternUrl: string) => {
    if (!sceneRef.current || modelsRef.current.length === 0) return;
    new THREE.TextureLoader().load(patternUrl, texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      modelsRef.current[0].model.traverse(child => { if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.3 }); });
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    });
  };

  const animate = () => {
    requestAnimationFrame(animate);
    mixersRef.current.forEach(mixer => mixer.update(0.016));
    if (sceneRef.current && cameraRef.current && rendererRef.current) rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ fontFamily: "Poppins, sans-serif", backgroundColor: "#F5F5DC" }}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[50] text-brown-800 text-lg">{instruction}</div>
      {showBlindMenu && (
        <div className="container max-w-7xl mx-auto min-h-screen p-4 md:p-8">
          <section className="roman-shades flex flex-col md:flex-row items-start justify-center my-5 bg-gray-100 p-4 rounded gap-4">
            <div className="blind-type-menu w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col h-[calc(100%+5rem)]">
              <h3 className="bg-gray-100 p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Select Type of Blind</h3>
              <div className="blind-type-content grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                {blindTypes.map(({ type, buttonImage }) => (
                  <div key={type} className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]" onClick={() => selectBlindType(type)}>
                    <img src={buttonImage} alt={`${type} Blind`} className="button-image w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover" />
                    <div className="button-text flex justify-center w-full mt-1 text-gray-700 text-[11px]"><span>{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="central-content flex flex-col items-center w-full md:w-3/4 relative">
              <div className="backgroundImage relative w-full h-[calc(100%-4rem)]">
                <img ref={imageRef} src={capturedImage || ""} alt="Captured Image" className="main_bg relative w-full h-full object-contain z-20" />
                <canvas ref={canvasRef} className="blind_overlay absolute inset-0 w-full h-full z-30" style={{ minHeight: "400px" }} />
                <div className="hidden md:block viewport absolute top-0 right-0 w-1/3 h-[calc(100%+5rem)] bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
                  <div className="options-menu p-2 bg-gray-100 rounded shadow">
                    <h3 className="mb-2 text-sm text-gray-700 text-left h-12">Filter Options</h3>
                    <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                      {["red", "blue", "green", "smooth", "patterned"].map(filter => (
                        <div key={filter} className="option-row flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" value={filter} checked={filters.includes(filter)} onChange={handleFilterChange} className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer" />
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="scrollable-buttons flex flex-col flex-1 max-h-[400px]">
                    <h3 className="bg-gray-100 pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
                    <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                      {filteredPatterns.map((pattern, index) => (
                        <div key={index} className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition" onClick={() => selectPattern(pattern.patternUrl)}>
                          <img src={pattern.image} alt={pattern.name} className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover" />
                          <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]"><span className="left-text truncate">{pattern.name}</span><span className="right-text">{pattern.price}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col h-[calc(100%)] mt-4">
                <div className="options-menu p-2 bg-gray-100 rounded shadow">
                  <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
                  <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                    {["red", "blue", "green", "smooth", "patterned"].map(filter => (
                      <div key={filter} className="option-row flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" value={filter} checked={filters.includes(filter)} onChange={handleFilterChange} className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer" />
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="scrollable-buttons flex flex-col flex-1 max-h-[300px]">
                  <h3 className="bg-gray-100 pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
                  <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                    {filteredPatterns.map((pattern, index) => (
                      <div key={index} className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition" onClick={() => selectPattern(pattern.patternUrl)}>
                        <img src={pattern.image} alt={pattern.name} className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover" />
                        <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]"><span className="left-text truncate">{pattern.name}</span><span className="right-text">{pattern.price}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default FilterPageUI;