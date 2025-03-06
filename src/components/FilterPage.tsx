  import React, { useState, useEffect, useRef } from "react";
  import * as THREE from "./three.js-r132/build/three.module.js"; // Adjust path as needed
  import { GLTFLoader } from "./three.js-r132/examples/jsm/loaders/GLTFLoader.js";

  interface ModelData {
    model: THREE.Group;
    gltf: any; // Use `any` since THREE.GLTF isn't fully typed here
  }

  const FilterPage: React.FC = () => {
    const [showBlindMenu, setShowBlindMenu] = useState(false);
    const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
    
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const selectionBoxRef = useRef<HTMLDivElement | null>(null);
    const overlayImageRef = useRef<HTMLImageElement | null>(null);
    const controlButtonRef = useRef<HTMLButtonElement | null>(null);
    const mixersRef = useRef<THREE.AnimationMixer[]>([]);
    const modelsRef = useRef<ModelData[]>([]);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    const capturedImage = localStorage.getItem("capturedImage");

    // Blind types data from BlindCustomizerThreeD
    const blindTypes = [
      { type: 'classicRoman', buttonImage: '/images/windowTypeIcons/image 12.png', modelUrl: '/models/shadeBake.glb' },
      { type: 'roller', buttonImage: '/images/windowTypeIcons/image 11.png', modelUrl: '/models/plantationShutter.glb' },
      { type: 'roman', buttonImage: '/images/windowTypeIcons/image 13.png', modelUrl: '/models/shadeBake.glb' },
      { type: 'plantationShutter', buttonImage: '/images/windowTypeIcons/image 15.png', modelUrl: '/models/plantationShutter.glb' },
      { type: 'solar', buttonImage: '/images/windowTypeIcons/image 14.png', modelUrl: '/models/shadeBake.glb' },
      { type: 'aluminumSheet', buttonImage: '/images/windowTypeIcons/image 17.png', modelUrl: '/models/plantationShutter.glb' },
      { type: 'cellularBlinds', buttonImage: '/images/windowTypeIcons/image 18.png', modelUrl: '/models/shadeBake.glb' },
    ];

    // Initialize Three.js scene, camera, and renderer
    useEffect(() => {
      const initScene = () => {
        sceneRef.current = new THREE.Scene();
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(rendererRef.current.domElement);

        sceneRef.current.add(new THREE.AmbientLight(0xffffff, 1));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 1);
        directionalLight.castShadow = true;
        sceneRef.current.add(directionalLight);

        cameraRef.current = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        cameraRef.current.position.set(0, 0, 10);

        if (capturedImage) {
          useCapturedImageAsBackground();
          initSelectionBox();
        }

        animate();
      };

      initScene();

      return () => {
        if (rendererRef.current && rendererRef.current.domElement) {
          document.body.removeChild(rendererRef.current.domElement);
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, [capturedImage]);

    // Handle DOM elements and events with Tailwind styling
    useEffect(() => {
      overlayImageRef.current = document.createElement("img");
      overlayImageRef.current.src = "images/overlayFilter1.png";
      overlayImageRef.current.id = "overlayImage";
      overlayImageRef.current.className =
        "fixed inset-0 w-full h-full object-fill z-[1000] hidden opacity-70";
      document.body.appendChild(overlayImageRef.current);

      videoRef.current = document.createElement("video");
      videoRef.current.setAttribute("playsinline", "");
      videoRef.current.muted = true;
      videoRef.current.className =
        "absolute inset-0 w-full h-full object-cover z-[999]";
      document.body.appendChild(videoRef.current);

      controlButtonRef.current = document.createElement("button");
      controlButtonRef.current.id = "controlButton";
      controlButtonRef.current.textContent = "Start Camera";
      controlButtonRef.current.className =
        "fixed bottom-5 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[1000] transition duration-300";
      controlButtonRef.current.addEventListener("click", handleButtonClick);
      document.body.appendChild(controlButtonRef.current);

      const handleResize = () => {
        if (videoRef.current) {
          videoRef.current.style.width = `${window.innerWidth}px`;
          videoRef.current.style.height = `${window.innerHeight}px`;
        }
        if (overlayImageRef.current) {
          overlayImageRef.current.style.width = `${window.innerWidth}px`;
          overlayImageRef.current.style.height = `${window.innerHeight}px`;
        }
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        if (overlayImageRef.current) document.body.removeChild(overlayImageRef.current);
        if (videoRef.current) document.body.removeChild(videoRef.current);
        if (controlButtonRef.current) document.body.removeChild(controlButtonRef.current);
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const handleButtonClick = () => {
      if (!controlButtonRef.current) return;
      if (controlButtonRef.current.textContent === "Start Camera") {
        startCameraStream();
      } else if (controlButtonRef.current.textContent === "Capture") {
        captureImage();
      } else if (controlButtonRef.current.textContent === "Submit") {
        submitAndShowMenu();
      }
    };

    const startCameraStream = () => {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          cameraStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().then(() => {
              if (overlayImageRef.current) {
                overlayImageRef.current.className =
                  "fixed inset-0 w-full h-full object-fill z-[1000] block opacity-70";
              }
              if (controlButtonRef.current) controlButtonRef.current.textContent = "Capture";
            });
          }
        });
    };

    const captureImage = () => {
      if (!videoRef.current || !videoRef.current.videoWidth) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");
        localStorage.setItem("capturedImage", imageData);

        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          if (videoRef.current) videoRef.current.srcObject = null;
        }

        if (videoRef.current) videoRef.current.className += " hidden";
        if (overlayImageRef.current)
          overlayImageRef.current.className =
            "fixed inset-0 w-full h-full object-fill z-[1000] hidden opacity-70";
        useCapturedImageAsBackground();
        initSelectionBox();
        if (controlButtonRef.current) controlButtonRef.current.textContent = "Submit";
      }
    };

    const useCapturedImageAsBackground = () => {
      const imageData = localStorage.getItem("capturedImage");
      if (!imageData || !sceneRef.current) return;

      const texture = new THREE.TextureLoader().load(imageData, () => {
        const imgAspect = texture.image.width / texture.image.height;
        const screenAspect = window.innerWidth / window.innerHeight;
        const width = 20 * screenAspect;
        const height = width / imgAspect;

        const bgMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({ map: texture })
        );
        bgMesh.position.z = -5;
        sceneRef.current.add(bgMesh);
      });
    };

    const initSelectionBox = () => {
      if (selectionBoxRef.current) return;

      selectionBoxRef.current = document.createElement("div");
      selectionBoxRef.current.className =
        "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20 hidden";
      document.body.appendChild(selectionBoxRef.current);

      let startX: number, startY: number, isTouch = false;

      const startSelection = (x: number, y: number) => {
        startX = x;
        startY = y;
        if (selectionBoxRef.current) {
          selectionBoxRef.current.style.left = `${startX}px`;
          selectionBoxRef.current.style.top = `${startY}px`;
          selectionBoxRef.current.style.width = "0px";
          selectionBoxRef.current.style.height = "0px";
          selectionBoxRef.current.className =
            "absolute border-2 border-dashed border-blue-500 bg-blue-200 bg-opacity-20";
        }
      };

      const updateSelection = (x: number, y: number) => {
        if (selectionBoxRef.current) {
          selectionBoxRef.current.style.width = `${Math.abs(x - startX)}px`;
          selectionBoxRef.current.style.height = `${Math.abs(y - startY)}px`;
          selectionBoxRef.current.style.left = `${Math.min(startX, x)}px`;
          selectionBoxRef.current.style.top = `${Math.min(startY, y)}px`;
        }
      };

      const endSelection = (x: number, y: number) => {
        if (selectionBoxRef.current)
          selectionBoxRef.current.className += " hidden";
        create3DModelFromSelection(startX, startY, x, y);
      };

      const handleMouseDown = (event: MouseEvent) => {
        isTouch = false;
        startSelection(event.clientX, event.clientY);
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!isTouch && event.buttons === 1) {
          updateSelection(event.clientX, event.clientY);
        }
      };

      const handleMouseUp = (event: MouseEvent) => {
        if (!isTouch) {
          endSelection(event.clientX, event.clientY);
        }
      };

      const handleTouchStart = (event: TouchEvent) => {
        isTouch = true;
        const touch = event.touches[0];
        startSelection(touch.clientX, touch.clientY);
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (isTouch) {
          const touch = event.touches[0];
          updateSelection(touch.clientX, touch.clientY);
        }
      };

      const handleTouchEnd = (event: TouchEvent) => {
        if (isTouch) {
          const touch = event.changedTouches[0];
          endSelection(touch.clientX, touch.clientY);
        }
      };

      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchstart", handleTouchStart);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        if (selectionBoxRef.current) document.body.removeChild(selectionBoxRef.current);
      };
    };

    const screenToWorld = (x: number, y: number): THREE.Vector3 => {
      if (!cameraRef.current) return new THREE.Vector3();
      const vector = new THREE.Vector3(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
      );
      vector.unproject(cameraRef.current);
      return cameraRef.current.position
        .clone()
        .add(vector.sub(cameraRef.current.position).normalize().multiplyScalar(-cameraRef.current.position.z / vector.z));
    };

    const create3DModelFromSelection = (startX: number, startY: number, endX: number, endY: number) => {
      if (!sceneRef.current) return;

      const worldStart = screenToWorld(startX, startY);
      const worldEnd = screenToWorld(endX, endY);

      const targetWidth = Math.abs(worldEnd.x - worldStart.x);
      const targetHeight = Math.abs(worldEnd.y - worldStart.y);

      const prospectiveMin = new THREE.Vector3(
        Math.min(worldStart.x, worldEnd.x),
        Math.min(worldStart.y, worldEnd.y),
        0
      );
      const prospectiveMax = new THREE.Vector3(
        Math.max(worldStart.x, worldEnd.x),
        Math.max(worldStart.y, worldEnd.y),
        0.3
      );
      const prospectiveBox = new THREE.Box3(prospectiveMin, prospectiveMax);

      const overlaps = modelsRef.current.some(({ model }) => {
        const box = new THREE.Box3().setFromObject(model);
        return prospectiveBox.intersectsBox(box);
      });

      if (overlaps) {
        console.log("🚫 Model creation skipped due to overlap with existing model.");
        return;
      }

      const modelUrl = selectedBlindType
        ? blindTypes.find(b => b.type === selectedBlindType)?.modelUrl || '/models/shadeBake.glb'
        : '/models/shadeBake.glb';

      new GLTFLoader().load(modelUrl, (gltf) => {
        const model = gltf.scene;

        new THREE.TextureLoader().load("images/pattern4.jpg", (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry.computeBoundingBox();
              const repeatX = targetWidth / 2;
              const repeatY = targetHeight / 2;
              texture.repeat.set(repeatX, repeatY);

              mesh.material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.5,
                metalness: 0.3,
              });
            }
          });

          const box = new THREE.Box3().setFromObject(model);
          const modelSize = new THREE.Vector3();
          box.getSize(modelSize);

          const scaleX = targetWidth / modelSize.x;
          const scaleY = targetHeight / modelSize.y;
          model.scale.set(scaleX, scaleY, 0.3);

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
        });
      });
    };

    const submitAndShowMenu = () => {
      setShowBlindMenu(true);
      if (controlButtonRef.current) controlButtonRef.current.textContent = "Submit"; // Keep button for further actions if needed
    };

    const selectBlindType = (type: string) => {
      setSelectedBlindType(type);
      updateExistingModels(type);
      setShowBlindMenu(false); // Hide menu after selection
    };

    const updateExistingModels = (type: string) => {
      if (!sceneRef.current) return;

      const modelUrl = blindTypes.find(b => b.type === type)?.modelUrl || '/models/shadeBake.glb';

      modelsRef.current.forEach(({ model }, index) => {
        const position = model.position.clone();
        const scale = model.scale.clone();

        sceneRef.current!.remove(model);

        new GLTFLoader().load(modelUrl, (gltf) => {
          const newModel = gltf.scene;

          new THREE.TextureLoader().load("images/pattern4.jpg", (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            newModel.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.geometry.computeBoundingBox();
                texture.repeat.set(scale.x * 2, scale.y * 2); // Adjust texture repeat based on scale

                mesh.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  roughness: 0.5,
                  metalness: 0.3,
                });
              }
            });

            newModel.scale.copy(scale);
            newModel.position.copy(position);

            sceneRef.current!.add(newModel);
            modelsRef.current[index] = { model: newModel, gltf };
          });
        });
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
      <>
        {showBlindMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg w-3/4 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Select Type of Blind</h3>
              <div className="grid grid-cols-2 gap-4">
                {blindTypes.map(({ type, buttonImage }) => (
                  <div
                    key={type}
                    className="flex flex-col items-center text-center cursor-pointer"
                    onClick={() => selectBlindType(type)}
                  >
                    <img
                      src={buttonImage}
                      alt={`${type} Blind`}
                      className="w-16 h-16 rounded shadow-md hover:scale-105 transition"
                    />
                    <span className="mt-2 text-sm">
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={() => setShowBlindMenu(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  export default FilterPage;