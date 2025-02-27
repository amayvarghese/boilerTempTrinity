import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const BikeModel: React.FC = () => {
    const { scene, materials, nodes } = useGLTF("/Assembled Bike.gltf");
    const modelRef = useRef<THREE.Group>(null);

    // Log all nodes for debugging
    useEffect(() => {
        console.log("GLTF Nodes:", nodes);
    }, [nodes]);

    // Configurable state
    const [config, setConfig] = useState<{
        scale: number;
        wireframe: boolean;
        visibility: { [key: string]: boolean };
        colors: { [key: string]: string };
    }>({
        scale: 1,
        wireframe: false,
        visibility: Object.keys(nodes).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        colors: Object.keys(nodes).reduce((acc, key) => ({ ...acc, [key]: "#ffffff" }), {}),
    });

    // Centering and auto-resizing the model
    useEffect(() => {
        if (modelRef.current) {
            const box = new THREE.Box3().setFromObject(modelRef.current);
            const center = box.getCenter(new THREE.Vector3());
            modelRef.current.position.sub(center);
        }
    }, []);

    return (
        <div className="w-full relative h-screen overflow-none bg-gray flex flex-col ">
            {/* 3D Canvas */}
            <div className=" w-2/3 h-full">
                {/* 3D Canvas */}
                <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Environment preset="city" />

                    {/* Auto-center Model */}
                    <Center>
                        <group ref={modelRef} scale={config.scale}>
                            {Object.entries(nodes).map(([name, node]) => {
                                const material = (node as THREE.Mesh).material as THREE.MeshStandardMaterial;
                                if (material) material.color = new THREE.Color(config.colors[name]);

                                return (
                                    <primitive
                                        key={name}
                                        object={node}
                                        visible={config.visibility[name]}
                                    />
                                );
                            })}
                        </group>
                    </Center>

                    <OrbitControls />
                </Canvas>
            </div>


            {/* Control Panel */}
            <div className="p-4 absolute right-0 top-0   w-1/3 overflow-hidden h-screen  bg-black   flex flex-wrap justify-center gap-4 text-white">
                {/* Scale */}
                <label className="hidden items-center">
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

                {/* Node Visibility and Color Controls */}
                <div className="flex flex-col flex-grow w-full    bg-black overflow-scroll gap-2 pt-4">

                    {Object.keys(nodes).map((node) => (
                        <div key={node} className="flex w-full justify-between  items-center ">
                            <label className="flex w-full h-full items-center text-wrap ">
                                <input
                                    type="checkbox"

                                    checked={config.visibility[node]}
                                    onChange={() =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            visibility: {
                                                ...prev.visibility,
                                                [node]: !prev.visibility[node],
                                            },
                                        }))
                                    }
                                    className=" "
                                />
                                <div className="  my-auto  ">


                                    {node}
                                </div>
                            </label>
                            <input
                                type="color"
                                value={config.colors[node]}
                                onChange={(e) =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        colors: {
                                            ...prev.colors,
                                            [node]: e.target.value,
                                        },
                                    }))
                                }
                                className="ml-2 flex-none  "
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BikeModel;
