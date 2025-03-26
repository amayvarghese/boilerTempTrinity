import React from "react";
import DebugComponentBase from "../components/DebugComponent";
import * as THREE from "three";

interface DebugComponentProps {
  modelData: { model: THREE.Group; gltf?: any };
  position: { x: number; y: number; z: number };
}

const DebugComponent = DebugComponentBase as React.FC<DebugComponentProps>;

type DebugComponentPageProps = {
  preloadedModels: Map<string, { model: THREE.Group; gltf?: any }>;
};

const DebugComponentPage: React.FC<DebugComponentPageProps> = ({ preloadedModels }) => {
  const modelUrl = "/3d/Roman_shades_anim.glb";

  if (!preloadedModels) {
    return <div>Preloaded models not provided yet.</div>;
  }

  const modelData = preloadedModels.get(modelUrl);

  console.log("Available Preloaded Models:", Array.from(preloadedModels.keys()));
  console.log("Selected Model URL:", modelUrl);
  console.log("Model Data:", modelData);

  return (
    <>
      {modelData ? (
        <DebugComponent modelData={modelData} position={{ x: 0, y: 0, z: 0 }} />
      ) : (
        <div>Model not found or not preloaded for URL: {modelUrl}</div>
      )}
    </>
  );
};

export default DebugComponentPage;