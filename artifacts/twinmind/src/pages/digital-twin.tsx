import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html, Sparkles, Float, MeshDistortMaterial } from "@react-three/drei";
import { useGetServices } from "@workspace/api-client-react";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Geometry helpers ─────────────────────────────────────────────────────────
function getNodeGeometry(type: string) {
  switch (type.toLowerCase()) {
    case "database":     return new THREE.CylinderGeometry(0.8, 0.8, 2, 6);
    case "gateway":      return new THREE.OctahedronGeometry(1.3, 1);
    case "load_balancer":return new THREE.SphereGeometry(1.2, 32, 32);
    case "cache":        return new THREE.TorusKnotGeometry(0.65, 0.22, 128, 16);
    case "microservice": return new THREE.IcosahedronGeometry(1, 1);
    default:             return new THREE.BoxGeometry(1.5, 1.5, 1.5);
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "healthy":  return "#10b981";
    case "warning":  return "#f59e0b";
    case "critical": return "#ef4444";
    default:         return "#64748b";
  }
}

// ── Floating crystal shard (glitter piece) ────────────────────────────────────
function CrystalShard({ position, color, scale = 1, speed = 1 }: {
  position: [number, number, number];
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.12 * scale, 0), [scale]);
  const rotOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed + rotOffset;
    ref.current.rotation.x = t * 1.3;
    ref.current.rotation.y = t * 0.9;
    ref.current.rotation.z = t * 0.7;
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3;
  });

  return (
    <mesh ref={ref} position={position} geometry={geo}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        metalness={1}
        roughness={0}
        transparent
        opacity={0.85}
        iridescence={1}
        iridescenceIOR={2.5}
        reflectivity={1}
      />
    </mesh>
  );
}

// ── Glitter ring orbiting a node ──────────────────────────────────────────────
function GlitterRing({ position, color, radius = 2.5 }: {
  position: [number, number, number];
  color: string;
  radius?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shards = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    return {
      pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number],
      speed: 0.5 + Math.random() * 0.5,
      scale: 0.7 + Math.random() * 0.6,
    };
  }), [radius]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.15;
  });

  return (
    <group ref={groupRef} position={position}>
      {shards.map((s, i) => (
        <CrystalShard key={i} position={s.pos} color={color} scale={s.scale} speed={s.speed} />
      ))}
    </group>
  );
}

// ── Central glitter core ──────────────────────────────────────────────────────
function GlitterCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.3;
      coreRef.current.rotation.y = t * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.7;
      ringRef.current.rotation.x = 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.5;
      ring2Ref.current.rotation.y = 0.6;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Glowing core sphere */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshPhysicalMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={2}
          metalness={1}
          roughness={0}
          iridescence={1}
          iridescenceIOR={2.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner glitter sparkles bursting from core */}
      <Sparkles count={120} scale={5} size={3} speed={0.6} color="#00d4ff" noise={2} />
      <Sparkles count={80}  scale={4} size={2} speed={0.9} color="#a855f7" noise={3} />
      <Sparkles count={60}  scale={3} size={4} speed={0.4} color="#ffffff" noise={1.5} />

      {/* Orbiting rings */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.8, 0.06, 8, 80]} />
        <meshPhysicalMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} metalness={1} roughness={0} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.4, 0.04, 8, 80]} />
        <meshPhysicalMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} metalness={1} roughness={0} />
      </mesh>

      {/* Crystal shards floating around core */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 2 + Math.random() * 1.5;
        const y = (Math.random() - 0.5) * 3;
        return (
          <CrystalShard
            key={i}
            position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}
            color={i % 3 === 0 ? "#00d4ff" : i % 3 === 1 ? "#a855f7" : "#f0f0ff"}
            scale={1 + Math.random()}
            speed={0.4 + Math.random() * 0.6}
          />
        );
      })}
    </group>
  );
}

// ── Glittery connection lines ─────────────────────────────────────────────────
function GlitterLine({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // Scatter tiny gems along the line
  const gems = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const t = (i + 1) / 6;
      return new THREE.Vector3().lerpVectors(start, end, t);
    });
  }, [start, end]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      (child as THREE.Mesh).material && ((child as any).material.opacity = 0.4 + Math.sin(t * 2 + i) * 0.4);
    });
  });

  return (
    <>
      <Line
        points={[start, end]}
        color={color}
        opacity={0.2}
        transparent
        lineWidth={1}
      />
      <group ref={groupRef}>
        {gems.map((pos, i) => (
          <mesh key={i} position={pos}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshPhysicalMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              metalness={1}
              roughness={0}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ── Main node with glitter halo ───────────────────────────────────────────────
function InfrastructureNode({
  service, position, onClick,
}: {
  service: any;
  position: [number, number, number];
  onClick: (s: any) => void;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const matRef   = useRef<THREE.MeshPhysicalMaterial>(null);
  const geometry = useMemo(() => getNodeGeometry(service.type), [service.type]);
  const color    = getStatusColor(service.status);
  const [hovered, setHovered] = useState(false);

  const sparkleColor = service.status === "healthy"  ? "#10b981" :
                       service.status === "warning"   ? "#f59e0b" : "#ef4444";

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y += 0.006;
    meshRef.current.rotation.x += 0.002;

    if (service.status === "healthy") {
      meshRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.25;
    } else if (service.status === "warning") {
      meshRef.current.position.y = position[1] + Math.sin(t * 5) * 0.1;
      const s = 1 + Math.sin(t * 5) * 0.06;
      meshRef.current.scale.set(s, s, s);
    } else {
      meshRef.current.position.y = position[1] + Math.sin(t * 18) * 0.06;
      if (matRef.current) matRef.current.emissiveIntensity = 0.6 + Math.sin(t * 10) * 0.6;
    }

    if (glowRef.current) {
      const gs = 1.3 + Math.sin(t * 2 + position[0]) * 0.1;
      glowRef.current.scale.set(gs, gs, gs);
    }
  });

  return (
    <group position={position}>
      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Main node */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => { e.stopPropagation(); onClick(service); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <meshPhysicalMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.2 : 0.5}
          metalness={1}
          roughness={0}
          iridescence={1}
          iridescenceIOR={2.4}
          clearcoat={1}
          clearcoatRoughness={0}
          reflectivity={1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Per-node sparkle cloud */}
      <Sparkles
        count={hovered ? 50 : 30}
        scale={2.5}
        size={hovered ? 3 : 1.8}
        speed={0.5}
        color={sparkleColor}
        noise={1}
      />

      {/* Orbiting crystal ring (smaller for non-gateway nodes) */}
      <GlitterRing
        position={[0, 0, 0]}
        color={color}
        radius={service.type === "gateway" ? 3.2 : 2.0}
      />

      {/* Label */}
      <Html position={[0, -2.6, 0]} center className="pointer-events-none select-none">
        <div className="bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border border-white/10 backdrop-blur-md">
          {service.name}
        </div>
      </Html>
    </group>
  );
}

// ── Connections ───────────────────────────────────────────────────────────────
function Connections({ nodes }: { nodes: any[] }) {
  const pairs = useMemo(() => {
    const arr: Array<{ a: THREE.Vector3; b: THREE.Vector3; color: string }> = [];
    const colors = ["#00d4ff", "#a855f7", "#10b981", "#f59e0b"];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.65) {
          arr.push({
            a: new THREE.Vector3(...nodes[i].pos),
            b: new THREE.Vector3(...nodes[j].pos),
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    }
    // Gateway always connects to first 4 nodes
    const gw = nodes.find(n => n.service.type === "gateway");
    if (gw) {
      nodes.filter(n => n.service.type !== "gateway").slice(0, 4).forEach(n => {
        arr.push({ a: new THREE.Vector3(...gw.pos), b: new THREE.Vector3(...n.pos), color: "#00d4ff" });
      });
    }
    return arr;
  }, [nodes]);

  return (
    <>
      {pairs.map((p, i) => (
        <GlitterLine key={i} start={p.a} end={p.b} color={p.color} />
      ))}
    </>
  );
}

// ── Scene-wide ambient glitter field ─────────────────────────────────────────
function AmbientGlitter() {
  return (
    <>
      <Sparkles count={300} scale={30} size={1.5} speed={0.2} color="#ffffff" noise={4} />
      <Sparkles count={150} scale={25} size={2.5} speed={0.15} color="#00d4ff" noise={3} />
      <Sparkles count={100} scale={20} size={2}   speed={0.3}  color="#a855f7" noise={5} />
      <Sparkles count={80}  scale={22} size={3}   speed={0.1}  color="#f0c0ff" noise={2} />
    </>
  );
}

// ── Rotating outer crystal shell ──────────────────────────────────────────────
function CrystalShell() {
  const ref = useRef<THREE.Group>(null);
  const shards = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => {
      const phi   = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;
      const r = 13;
      return {
        pos: [
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi),
        ] as [number, number, number],
        color: ["#00d4ff", "#a855f7", "#ffffff", "#f0c0ff", "#10b981"][i % 5],
        scale: 0.8 + Math.random() * 1.4,
        speed: 0.2 + Math.random() * 0.4,
      };
    }), []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.06;
    ref.current.rotation.x = state.clock.getElapsedTime() * 0.03;
  });

  return (
    <group ref={ref}>
      {shards.map((s, i) => (
        <CrystalShard key={i} position={s.pos} color={s.color} scale={s.scale} speed={s.speed} />
      ))}
    </group>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DigitalTwin() {
  const { data: services = [] } = useGetServices({ query: { refetchInterval: 5000 } });
  const [selectedService, setSelectedService] = useState<any>(null);

  const nodes = useMemo(() => {
    return services.map((service, i) => {
      if (service.type === "gateway")      return { service, pos: [0, 9, 0]  as [number, number, number] };
      if (service.type === "load_balancer") return { service, pos: [0, 4.5, 0] as [number, number, number] };

      const phi   = Math.acos(-1 + (2 * i) / services.length);
      const theta = Math.sqrt(services.length * Math.PI) * phi;
      const r = 8;
      return {
        service,
        pos: [
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi),
        ] as [number, number, number],
      };
    });
  }, [services]);

  return (
    <div className="relative w-full h-full bg-[#050810]">

      {/* HUD */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Digital Twin</h1>
        <p className="text-sm text-cyan-400 font-mono mt-1 animate-pulse">✦ Live Glitter Topology ✦</p>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <Card className="bg-black/50 backdrop-blur-md border-white/10 w-48">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]" /><span className="text-xs text-white">Healthy</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400  shadow-[0_0_12px_#f59e0b]" /><span className="text-xs text-white">Warning</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500   shadow-[0_0_12px_#ef4444] animate-pulse" /><span className="text-xs text-white">Critical</span></div>
            <div className="border-t border-white/10 pt-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 shadow-[0_0_10px_#a855f7]" />
              <span className="text-xs text-white/60">Glitter Core</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tip */}
      <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
        <p className="text-[10px] text-white/30 font-mono">drag · scroll · click node</p>
      </div>

      {selectedService && (
        <div className="absolute bottom-6 left-6 z-10">
          <Card className="bg-black/80 backdrop-blur-xl border-cyan-500/40 w-80 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-lg flex items-center justify-between text-white">
                {selectedService.name}
                <Badge
                  variant="outline"
                  className={`uppercase text-xs ${
                    selectedService.status === "healthy"  ? "text-emerald-400 border-emerald-400/50" :
                    selectedService.status === "warning"  ? "text-amber-400  border-amber-400/50"   :
                    "text-rose-400 border-rose-400/50 animate-pulse"
                  }`}
                >
                  {selectedService.status}
                </Badge>
              </CardTitle>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{selectedService.type}</div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              {[
                ["CPU",     `${selectedService.cpuUsage}%`],
                ["Memory",  `${selectedService.memoryUsage}%`],
                ["Latency", `${selectedService.latency}ms`],
                ["Replicas",`${selectedService.replicas}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] text-white/40 uppercase tracking-widest">{k}</div>
                  <div className="font-mono text-white text-sm">{v}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 6, 22], fov: 58 }}
        onPointerMissed={() => setSelectedService(null)}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#050810"]} />
        <fog attach="fog" args={["#050810", 18, 55]} />

        {/* Ambient glitter field */}
        <AmbientGlitter />

        {/* Dense star backdrop */}
        <Stars radius={120} depth={60} count={8000} factor={5} saturation={0.3} fade speed={0.4} />

        {/* Lights */}
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 0]}  intensity={8}  color="#00d4ff" distance={30} decay={2} />
        <pointLight position={[10, 10, 5]}  intensity={4} color="#a855f7" distance={25} decay={2} />
        <pointLight position={[-10, -8, -5]} intensity={3} color="#10b981" distance={20} decay={2} />
        <pointLight position={[0, -10, 10]}  intensity={2} color="#f59e0b" distance={15} decay={2} />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate
          autoRotateSpeed={0.35}
          minDistance={8}
          maxDistance={40}
        />

        {/* Central glitter core */}
        <GlitterCore />

        {/* Outer spinning crystal shell */}
        <CrystalShell />

        {/* Infrastructure nodes */}
        {nodes.map((node) => (
          <InfrastructureNode
            key={node.service.id}
            service={node.service}
            position={node.pos}
            onClick={setSelectedService}
          />
        ))}

        {/* Glitter connection lines */}
        {nodes.length > 1 && <Connections nodes={nodes} />}
      </Canvas>
    </div>
  );
}
