"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  DataTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Path,
  Shape,
  MathUtils,
  RepeatWrapping,
  RGBAFormat,
} from "three";

export type SceneProgress = MutableRefObject<number>;
function LimestonePassage({ progress }: { progress: SceneProgress }) {
  const { camera } = useThree();
  const light = useRef<DirectionalLight>(null);
  const stone = useMemo(() => {
    // A small deterministic mineral grain map; no downloaded textures or per-frame allocations.
    const size = 128;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        const pore = grain - Math.floor(grain);
        const layer = Math.sin(y * 0.22 + Math.sin(x * 0.08)) * 3;
        const shade = Math.round(
          225 + pore * 22 + layer - (pore < 0.025 ? 30 : 0),
        );
        const index = (y * size + x) * 4;
        pixels[index] = shade;
        pixels[index + 1] = shade;
        pixels[index + 2] = shade;
        pixels[index + 3] = 255;
      }
    const texture = new DataTexture(pixels, size, size, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(0.65, 0.65);
    texture.needsUpdate = true;
    return texture;
  }, []);
  const geometry = useMemo(() => {
    const wall = new Shape();
    wall.moveTo(-12, -4);
    wall.lineTo(12, -4);
    wall.lineTo(12, 10);
    wall.lineTo(-12, 10);
    wall.closePath();
    const opening = new Path();
    opening.moveTo(-2.45, -4);
    opening.lineTo(-2.45, 1.2);
    opening.absarc(0, 1.2, 2.45, Math.PI, 0, true);
    opening.lineTo(2.45, -4);
    opening.closePath();
    wall.holes.push(opening);
    return new ExtrudeGeometry(wall, {
      depth: 0.9,
      bevelEnabled: true,
      bevelSize: 0.045,
      bevelThickness: 0.045,
      bevelSegments: 2,
      curveSegments: 40,
    });
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      stone.dispose();
    },
    [geometry, stone],
  );
  useFrame(() => {
    const p = progress.current;
    const dolly = Math.min(1, p / 0.78);
    camera.position.set(
      Math.sin(dolly * Math.PI) * 0.38,
      0.22 + dolly * 0.45,
      MathUtils.lerp(10, -5.4, dolly),
    );
    camera.lookAt(0, 0.7, -12);
    if (light.current) {
      light.current.position.set(MathUtils.lerp(-5, 8, p), 7, 5);
      light.current.intensity = MathUtils.lerp(2.5, 1.3, p);
    }
  });
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        ref={light}
        position={[-5, 7, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      {[0, -3.8].map((depth, index) => (
        <group key={depth} position={[0, 0, depth]}>
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
              color={index ? "#d6c6ab" : "#e7dece"}
              map={stone}
              bumpMap={stone}
              bumpScale={0.035}
              roughness={0.97}
              metalness={0}
            />
          </mesh>
          {[-2.5, -1.3, -0.1, 1.1].flatMap((y) =>
            [-1, 1].map((side) => (
              <mesh key={side + ":" + y} position={[side * 4.8, y, 0.925]}>
                <boxGeometry args={[4.6, 0.014, 0.01]} />
                <meshStandardMaterial color="#bfb29d" roughness={1} />
              </mesh>
            )),
          )}
          {Array.from({ length: 11 }, (_, i) => {
            const angle = ((i + 1) * Math.PI) / 12;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * 2.77,
                  1.2 + Math.sin(angle) * 2.77,
                  0.925,
                ]}
                rotation={[0, 0, angle]}
              >
                <boxGeometry args={[0.63, 0.016, 0.012]} />
                <meshStandardMaterial color="#bfb29d" roughness={1} />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.15, -1.3]}
        receiveShadow
      >
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial color="#c6ad85" map={stone} roughness={1} />
      </mesh>
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function ArchScene({
  progress,
  renderRef,
  onReady,
  onFailure,
}: {
  progress: SceneProgress;
  renderRef: MutableRefObject<(() => void) | null>;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <SceneBoundary onFailure={onFailure}>
      <Canvas
        aria-hidden="true"
        frameloop="demand"
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [0, 0.22, 10], fov: 49, near: 0.08, far: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        fallback={null}
        onCreated={({ gl, invalidate }) => {
          renderRef.current = invalidate;
          gl.domElement.addEventListener("webglcontextlost", onFailure, {
            once: true,
          });
          onReady();
        }}
      >
        <LimestonePassage progress={progress} />
      </Canvas>
    </SceneBoundary>
  );
}
