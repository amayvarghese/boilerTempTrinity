import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const BikeModel: React.FC = () => {
    const { scene, materials } = useGLTF("/Assembled_Bike.gltf");
    const modelRef = useRef<THREE.Group>(null);

    // Extract all parts of the model
    const [components, setComponents] = useState<string[]>([]);
    const [visibleComponents, setVisibleComponents] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (modelRef.current) {
            const allMeshes = modelRef.current.children.map((child) => child.name);
            setComponents(allMeshes);
            setVisibleComponents(
                allMeshes.reduce((acc, name) => ({ ...acc, [name]: true }), {})
            );
        }
    }, []);

    // Configurable state
    const [config, setConfig] = useState<{
        scale: number;
        globalColor: string;
        wireframe: boolean;
        partColors: { [key: string]: string };
    }>({
        scale: 1,
        globalColor: "#ff0000",
        wireframe: false,
        partColors: {},
    });

    // Centering the model
    useEffect(() => {
        if (modelRef.current) {
            const box = new THREE.Box3().setFromObject(modelRef.current);
            const center = box.getCenter(new THREE.Vector3());
            modelRef.current.position.sub(center);
        }
    }, []);

    // Update material properties dynamically
    useEffect(() => {
        Object.entries(materials).forEach(([key, material]) => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.color = new THREE.Color(config.partColors[key] || config.globalColor);
                material.wireframe = config.wireframe;
            }
        });
    }, [config.globalColor, config.wireframe, config.partColors, materials]);

    return (
        <div className="w-full h-[80vh] bg-gray flex flex-col items-center">
            {/* 3D Canvas */}
            <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Environment preset="city" />

                {/* Auto-center Model */}
                <Center>
                    <group ref={modelRef} scale={config.scale}>
                        {scene.children.map((child) => (
                            <primitive key={child.uuid} object={child} visible={visibleComponents[child.name]} />
                        ))}
                    </group>
                </Center>

                <OrbitControls />
            </Canvas>

            {/* Control Panel */}
            <div className="p-4 bg-gray-800 w-full flex flex-wrap justify-center gap-4 text-white">
                {/* Scale */}
                <label className=" hidden w-0 h-0 overflow-hidden items-center">
                    Scale:
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={config.scale}
                        onChange={(e) => setConfig({ ...config, scale: parseFloat(e.target.value) })}
                        className="ml-2 w-24"
                    />
                </label>

                {/* Global Color Picker */}
                <label className="flex items-center">
                    Global Color:
                    <input
                        type="color"
                        value={config.globalColor}
                        onChange={(e) => setConfig({ ...config, globalColor: e.target.value })}
                        className="ml-2"
                    />
                </label>

                {/* Wireframe Toggle */}
                <label className="flex items-center">
                    Wireframe:
                    <input
                        type="checkbox"
                        checked={config.wireframe}
                        onChange={(e) => setConfig({ ...config, wireframe: e.target.checked })}
                        className="ml-2"
                    />
                </label>
            </div>

            {/* Component Visibility & Color Controls */}
            <div className="p-4   bg-gray-800 w-full flex flex-wrap bg-black *: justify-center gap-4 text-white">
                <h2 className="w-full text-center text-lg font-bold">Toggle Components & Colors</h2>
                {components.map((component) => (
                    <div key={component} className="flex h-10 flex-col items-center">
                        <label className="flex items-center">
                            {component}:
                            <input
                                type="checkbox"
                                checked={visibleComponents[component]}
                                onChange={(e) =>
                                    setVisibleComponents({
                                        ...visibleComponents,
                                        [component]: e.target.checked,
                                    })
                                }
                                className="ml-2"
                            />
                        </label>
                        <input
                            type="color"
                            value={config.partColors[component] || "#ffffff"}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    partColors: { ...config.partColors, [component]: e.target.value },
                                })
                            }
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BikeModel;
