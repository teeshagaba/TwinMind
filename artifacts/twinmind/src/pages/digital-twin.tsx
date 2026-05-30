import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html } from "@react-three/drei";
import { useGetServices } from "@workspace/api-client-react";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Node Geometries based on type
function getNodeGeometry(type: string) {
  switch (type.toLowerCase()) {
    case "database": return new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
    case "gateway": return new THREE.OctahedronGeometry(1.2);
    case "load_balancer": return new THREE.SphereGeometry(1.2, 16, 16);
    case "cache": return new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8);
    case "microservice": return new THREE.IcosahedronGeometry(1);
    default: return new THREE.BoxGeometry(1.5, 1.5, 1.5); // server
  }
}

// Color based on status
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "healthy": return "#10b981"; // emerald
    case "warning": return "#f59e0b"; // amber
    case "critical": return "#ef4444"; // rose
    default: return "#64748b"; // slate
  }
}

function InfrastructureNode({ 
  service, 
  position, 
  onClick 
}: { 
  service: any; 
  position: [number, number, number];
  onClick: (s: any) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const geometry = useMemo(() => getNodeGeometry(service.type), [service.type]);
  const color = getStatusColor(service.status);
  
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Basic rotation
    meshRef.current.rotation.y += 0.005;
    
    // Status-based animation
    const time = state.clock.getElapsedTime();
    if (service.status === "healthy") {
      meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.2;
    } else if (service.status === "warning") {
      meshRef.current.position.y = position[1] + Math.sin(time * 5) * 0.1;
      const scale = 1 + Math.sin(time * 5) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    } else if (service.status === "critical") {
      meshRef.current.position.y = position[1] + Math.sin(time * 20) * 0.05;
      meshRef.current.position.x = position[0] + Math.sin(time * 15) * 0.05;
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = 0.5 + Math.sin(time * 10) * 0.5;
      }
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef} 
        geometry={geometry}
        onClick={(e) => { e.stopPropagation(); onClick(service); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <meshPhysicalMaterial 
          ref={materialRef}
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
        />
      </mesh>
      
      <Html position={[0, -2, 0]} center className="pointer-events-none">
        <div className="bg-black/80 text-white px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap border border-white/10 backdrop-blur-md">
          {service.name}
        </div>
      </Html>
    </group>
  );
}

function Connections({ nodes }: { nodes: any[] }) {
  // Simple random connections for visual effect
  const lines = useMemo(() => {
    const arr = [];
    for(let i=0; i<nodes.length; i++) {
      for(let j=i+1; j<nodes.length; j++) {
        // Connect ~30% of nodes
        if(Math.random() > 0.7) {
           arr.push([nodes[i].pos, nodes[j].pos]);
        }
      }
    }
    // Ensure gateway connects to something
    const gateway = nodes.find(n => n.service.type === 'gateway');
    if (gateway) {
      nodes.filter(n => n.service.type !== 'gateway').slice(0, 3).forEach(n => {
        arr.push([gateway.pos, n.pos]);
      });
    }
    return arr;
  }, [nodes]);

  return (
    <>
      {lines.map((line, i) => (
        <Line 
          key={i} 
          points={line} 
          color="#1e3a5f" 
          opacity={0.3} 
          transparent 
          lineWidth={1}
        />
      ))}
    </>
  );
}

export default function DigitalTwin() {
  const { data: services = [] } = useGetServices({ query: { refetchInterval: 5000 } });
  const [selectedService, setSelectedService] = useState<any>(null);

  // Distribute nodes in 3D space
  const nodes = useMemo(() => {
    return services.map((service, i) => {
      // Golden spiral distribution
      const phi = Math.acos(-1 + (2 * i) / services.length);
      const theta = Math.sqrt(services.length * Math.PI) * phi;
      const r = 8; // radius
      const pos: [number, number, number] = [
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi)
      ];
      // Special placement for gateway/LB
      if (service.type === 'gateway') return { service, pos: [0, 8, 0] as [number, number, number] };
      if (service.type === 'load_balancer') return { service, pos: [0, 4, 0] as [number, number, number] };
      
      return { service, pos };
    });
  }, [services]);

  return (
    <div className="relative w-full h-full bg-[#0a0f1e]">
      
      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Digital Twin</h1>
        <p className="text-sm text-primary font-mono mt-1">Live 3D Topology View</p>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <Card className="bg-card/50 backdrop-blur-md border-border/50 w-48">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> <span className="text-xs text-white">Healthy</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> <span className="text-xs text-white">Warning</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse" /> <span className="text-xs text-white">Critical</span></div>
          </CardContent>
        </Card>
      </div>

      {selectedService && (
        <div className="absolute bottom-6 left-6 z-10">
          <Card className="bg-card/80 backdrop-blur-xl border-primary/50 w-80 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center justify-between text-white">
                {selectedService.name}
                <Badge variant="outline" className={`uppercase ${
                  selectedService.status === 'healthy' ? 'text-emerald-500 border-emerald-500/50' : 
                  selectedService.status === 'warning' ? 'text-amber-500 border-amber-500/50' : 
                  'text-rose-500 border-rose-500/50 animate-pulse'
                }`}>
                  {selectedService.status}
                </Badge>
              </CardTitle>
              <div className="text-xs font-mono text-muted-foreground uppercase">{selectedService.type}</div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">CPU</div>
                <div className="font-mono text-white">{selectedService.cpuUsage}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Memory</div>
                <div className="font-mono text-white">{selectedService.memoryUsage}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Latency</div>
                <div className="font-mono text-white">{selectedService.latency}ms</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Replicas</div>
                <div className="font-mono text-white">{selectedService.replicas}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 5, 20], fov: 60 }} onPointerMissed={() => setSelectedService(null)}>
        <color attach="background" args={["#0a0f1e"]} />
        <fog attach="fog" args={["#0a0f1e", 10, 40]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
        
        {nodes.map((node, i) => (
          <InfrastructureNode 
            key={node.service.id} 
            service={node.service} 
            position={node.pos} 
            onClick={setSelectedService} 
          />
        ))}
        
        {nodes.length > 0 && <Connections nodes={nodes} />}
      </Canvas>
    </div>
  );
}
