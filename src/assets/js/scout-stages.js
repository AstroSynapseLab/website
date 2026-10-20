// RoboZET scout, stage by stage: interactive 3D model (research/robo-zet).
// Loaded only on that page via the `scripts` front-matter key.
// Markup hooks: [data-scout-model] root, [data-scout-view] viewport,
// [data-scout-stage] buttons, [data-scout-info] text panels, [data-scout-toggle] checkboxes.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initScoutModel() {
  const root = document.querySelector("[data-scout-model]");
  if (!root) return;

  const viewElement = root.querySelector("[data-scout-view]");
  const labelsElement = root.querySelector("[data-scout-labels]");
  const fallback = root.querySelector("[data-scout-fallback]");
  const stageButtons = [...root.querySelectorAll("[data-scout-stage]")];
  const infoPanels = [...root.querySelectorAll("[data-scout-info]")];
  const stepButtons = [...root.querySelectorAll("[data-scout-step]")];
  const stepperLabel = root.querySelector("[data-scout-stepper-label]");
  const dots = [...root.querySelectorAll("[data-scout-dots] i")];
  const toggle = (name) => root.querySelector(`[data-scout-toggle="${name}"]`);
  const toggles = {
    labels: toggle("labels"),
    pantograph: toggle("pantograph"),
    wire: toggle("wire"),
    fov: toggle("fov"),
    body: toggle("body"),
    spin: toggle("spin"),
    rotate: toggle("rotate"),
  };

  /* ---------- renderer, camera, lights ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    fallback.hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  viewElement.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(6.4, 3.4, 6.0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.5, 0);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 0.8;
  // Wheel zoom only once the viewport has been clicked, so the page keeps scrolling normally.
  controls.enableZoom = false;
  viewElement.addEventListener("focusin", () => (controls.enableZoom = true));
  viewElement.addEventListener("focusout", () => (controls.enableZoom = false));

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.75));
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.95);
  sunLight.position.set(4, 8, 3);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 30 });
  scene.add(sunLight);

  const materials = {
    steel: new THREE.MeshStandardMaterial({ color: 0x6b7178, metalness: 0.55, roughness: 0.5 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x3b4046, metalness: 0.5, roughness: 0.6 }),
    tire: new THREE.MeshStandardMaterial({ color: 0xe6e4df, metalness: 0.2, roughness: 0.6 }),
    hub: new THREE.MeshStandardMaterial({ color: 0x55595e, metalness: 0.4, roughness: 0.6 }),
    pivot: new THREE.MeshStandardMaterial({ color: 0xc23b2e, metalness: 0.2, roughness: 0.5 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.35 }),
    zetBlue: new THREE.MeshStandardMaterial({ color: 0x1c5cc0, metalness: 0.25, roughness: 0.38 }),
    skirtBlack: new THREE.MeshStandardMaterial({ color: 0x1d2025, metalness: 0.2, roughness: 0.6 }),
    maskWhite: new THREE.MeshStandardMaterial({ color: 0xf3f4f2, metalness: 0.15, roughness: 0.4 }),
    roofGrey: new THREE.MeshStandardMaterial({ color: 0xb9c0c7, metalness: 0.3, roughness: 0.5 }),
    windscreen: new THREE.MeshStandardMaterial({ color: 0x0b0f15, metalness: 0.85, roughness: 0.14 }),
    ledStrip: new THREE.MeshStandardMaterial({ color: 0x9fdcff, emissive: 0x58c8ff, emissiveIntensity: 0.9 }),
    bezel: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.8, roughness: 0.3 }),
    seam: new THREE.MeshStandardMaterial({ color: 0x164a9c, metalness: 0.25, roughness: 0.45 }),
    estopYellow: new THREE.MeshStandardMaterial({ color: 0xf2c200, metalness: 0.1, roughness: 0.5 }),
    sideGlass: new THREE.MeshStandardMaterial({ color: 0x111a24, metalness: 0.6, roughness: 0.15 }),
    sensorBody: new THREE.MeshStandardMaterial({ color: 0x1b1d20, metalness: 0.3, roughness: 0.35 }),
    sensorAccent: new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.8, roughness: 0.15, emissive: 0xff9900, emissiveIntensity: 0 }),
    insulator: new THREE.MeshStandardMaterial({ color: 0x8a2f24, metalness: 0.1, roughness: 0.5 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.2, roughness: 0.7 }),
    headLight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 0.9 }),
    redLight: new THREE.MeshStandardMaterial({ color: 0xff3322, emissive: 0xff2211, emissiveIntensity: 0.7 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x5b4632, metalness: 0.7, roughness: 0.4 }),
    pole: new THREE.MeshStandardMaterial({ color: 0x7d858c, metalness: 0.5, roughness: 0.5 }),
  };

  function addBox(parent, width, height, depth, material, posX, posY, posZ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radius, length, material, posX, posY, posZ, axis, segments) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments || 32), material);
    if (axis === "x") mesh.rotation.z = Math.PI / 2;
    if (axis === "z") mesh.rotation.x = Math.PI / 2;
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const upAxis = new THREE.Vector3(0, 1, 0);
  function placeTube(mesh, startPoint, endPoint) {
    const start = new THREE.Vector3(...startPoint);
    const end = new THREE.Vector3(...endPoint);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.scale.set(1, start.distanceTo(end), 1);
    mesh.quaternion.setFromUnitVectors(upAxis, end.sub(start).normalize());
  }

  function addTube(parent, startPoint, endPoint, radius, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), material);
    mesh.castShadow = true;
    placeTube(mesh, startPoint, endPoint);
    parent.add(mesh);
    return mesh;
  }

  /* ---------- ground + track ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const styles = getComputedStyle(root);
  const gridHelper = new THREE.GridHelper(28, 56, styles.getPropertyValue("--scout-grid-a").trim(), styles.getPropertyValue("--scout-grid-b").trim());
  gridHelper.material.transparent = true;
  gridHelper.position.y = 0.001;
  scene.add(gridHelper);

  const railGauge = 1.0;
  [-railGauge / 2, railGauge / 2].forEach((railZ) => {
    addBox(scene, 16, 0.05, 0.07, materials.rail, 0, 0.025, railZ);
  });

  /* ---------- Tatra T3 bogie ---------- */
  const bogie = new THREE.Group();
  scene.add(bogie);

  const wheelRadius = 0.35;
  const halfWheelbase = 0.95;
  const wheelsets = [];

  function buildWheel(parent, sideZ) {
    const outward = Math.sign(sideZ);
    addCylinder(parent, wheelRadius, 0.11, materials.tire, 0, 0, sideZ, "z", 48);
    addCylinder(parent, wheelRadius + 0.025, 0.025, materials.tire, 0, 0, sideZ - outward * 0.065, "z", 48);
    addCylinder(parent, wheelRadius * 0.72, 0.115, materials.hub, 0, 0, sideZ, "z", 24);
    addCylinder(parent, 0.085, 0.16, materials.darkSteel, 0, 0, sideZ + outward * 0.02, "z", 6);
    for (let spokeIndex = 0; spokeIndex < 10; spokeIndex++) {
      const angle = (spokeIndex / 10) * Math.PI * 2;
      const spoke = addBox(parent, 0.02, wheelRadius * 0.55, 0.02, materials.darkSteel, Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, sideZ + outward * 0.06);
      spoke.rotation.z = angle - Math.PI / 2;
    }
  }

  [-halfWheelbase, halfWheelbase].forEach((axleX) => {
    const wheelset = new THREE.Group();
    wheelset.position.set(axleX, wheelRadius + 0.02, 0);
    addCylinder(wheelset, 0.06, railGauge + 0.1, materials.darkSteel, 0, 0, 0, "z");
    buildWheel(wheelset, -railGauge / 2);
    buildWheel(wheelset, railGauge / 2);
    bogie.add(wheelset);
    wheelsets.push(wheelset);
    // gearbox on axle
    addBox(bogie, 0.26, 0.3, 0.26, materials.steel, axleX * 0.9, wheelRadius + 0.05, 0);
  });

  // inside side frames with axle arms
  [-0.33, 0.33].forEach((frameZ) => {
    addBox(bogie, 2.15, 0.16, 0.12, materials.steel, 0, 0.42, frameZ);
    addBox(bogie, 2.15, 0.04, 0.2, materials.darkSteel, 0, 0.51, frameZ);
    [-halfWheelbase, halfWheelbase].forEach((axleX) => {
      addCylinder(bogie, 0.11, 0.14, materials.steel, axleX, wheelRadius + 0.02, frameZ, "z");
    });
  });

  // magnetic track brakes over rails
  [-railGauge / 2, railGauge / 2].forEach((brakeZ) => {
    addBox(bogie, 1.0, 0.08, 0.09, materials.darkSteel, 0, 0.1, brakeZ);
    addTube(bogie, [-0.4, 0.14, brakeZ], [-0.4, 0.38, brakeZ * 0.7], 0.018, materials.steel);
    addTube(bogie, [0.4, 0.14, brakeZ], [0.4, 0.38, brakeZ * 0.7], 0.018, materials.steel);
  });

  // longitudinal traction motors
  [-0.45, 0.45].forEach((motorX) => {
    addCylinder(bogie, 0.15, 0.5, materials.darkSteel, motorX, 0.38, 0, "x");
    addCylinder(bogie, 0.155, 0.04, materials.steel, motorX + Math.sign(motorX) * 0.25, 0.38, 0, "x");
  });

  // bolster, spring stack, pivot
  addBox(bogie, 0.42, 0.14, 0.95, materials.steel, 0, 0.58, 0);
  for (let coilIndex = 0; coilIndex < 4; coilIndex++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 10, 32), materials.darkSteel);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0, 0.68 + coilIndex * 0.04, 0);
    coil.castShadow = true;
    bogie.add(coil);
  }
  addCylinder(bogie, 0.1, 0.14, materials.pivot, 0, 0.82, 0);
  addCylinder(bogie, 0.2, 0.06, materials.pivot, 0, 0.9, 0);

  /* ---------- curved robot body: lofted superellipse sections ---------- */
  const scoutBody = new THREE.Group();
  scene.add(scoutBody);

  const bodyHalfLength = 1.8;
  const bodyWidth = 1.44;
  const skirtBottom = 0.45;
  const beltLine = 0.72;
  const roofHeight = 1.95;
  const noseLength = 0.95;
  const creaseHeight = 1.08;
  const spineHeight = 0.025;
  const topExponent = 3.0;
  const bottomExponent = 5.0;

  function sectionAt(posX) {
    const endProgress = THREE.MathUtils.clamp((Math.abs(posX) - (bodyHalfLength - noseLength)) / noseLength, 0, 1);
    const topY = roofHeight - 0.62 * Math.pow(endProgress, 1.5);
    const bottomY = skirtBottom + 0.05 * Math.pow(endProgress, 2);
    const widthShrink = Math.pow(Math.max(1 - Math.pow(endProgress, 3.2), 0), 1 / 3.2);
    const heightShrink = Math.pow(Math.max(1 - Math.pow(endProgress, 6), 0), 1 / 6);
    return {
      centerY: (topY + bottomY) / 2,
      halfHeight: ((topY - bottomY) / 2) * heightShrink,
      halfWidth: (bodyWidth / 2) * widthShrink,
    };
  }

  // sharp shoulder crease: the side flares out slightly at crease height, like a sports-car swage line
  function creaseFactor(posY) {
    return 1 + 0.05 * Math.max(0, 1 - Math.abs(posY - creaseHeight) / 0.28);
  }

  function sectionContains(posX, posY, posZ) {
    const section = sectionAt(posX);
    if (section.halfHeight <= 0 || section.halfWidth <= 0) return false;
    const verticalRatio = (posY - section.centerY) / section.halfHeight;
    const exponent = verticalRatio >= 0 ? topExponent : bottomExponent;
    return Math.pow(Math.abs(posZ / (section.halfWidth * creaseFactor(posY))), exponent) + Math.pow(Math.abs(verticalRatio), exponent) <= 1;
  }

  // distance from the centre to the nose surface along x, at a given height and lateral offset
  function noseDepth(posY, posZ) {
    let insideX = 0;
    let outsideX = bodyHalfLength;
    for (let iteration = 0; iteration < 32; iteration++) {
      const middleX = (insideX + outsideX) / 2;
      if (sectionContains(middleX, posY, posZ)) insideX = middleX;
      else outsideX = middleX;
    }
    return insideX;
  }

  function sideSurfaceZ(posX, posY) {
    const section = sectionAt(posX);
    const verticalRatio = Math.abs((posY - section.centerY) / section.halfHeight);
    const exponent = posY >= section.centerY ? topExponent : bottomExponent;
    const remainder = 1 - Math.pow(verticalRatio, exponent);
    return remainder <= 0 ? 0 : section.halfWidth * creaseFactor(posY) * Math.pow(remainder, 1 / exponent);
  }

  function roofTopY(posX) {
    const section = sectionAt(posX);
    return section.centerY + section.halfHeight + spineHeight;
  }

  function buildBodyGeometry() {
    const lengthSegments = 180;
    const aroundSegments = 160;
    const positions = [];
    const indices = [];
    for (let lengthIndex = 0; lengthIndex <= lengthSegments; lengthIndex++) {
      const along = -1 + (2 * lengthIndex) / lengthSegments;
      const posX = bodyHalfLength * Math.sin((along * Math.PI) / 2);
      const section = sectionAt(posX);
      for (let aroundIndex = 0; aroundIndex < aroundSegments; aroundIndex++) {
        const angle = (aroundIndex / aroundSegments) * Math.PI * 2;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const exponent = sine >= 0 ? topExponent : bottomExponent;
        let posY = section.centerY + section.halfHeight * Math.sign(sine) * Math.pow(Math.abs(sine), 2 / exponent);
        const posZ = section.halfWidth * creaseFactor(posY) * Math.sign(cosine) * Math.pow(Math.abs(cosine), 2 / exponent);
        // dorsal spine along the roof centre
        if (sine > 0) posY += spineHeight * Math.max(0, 1 - Math.abs(posZ) / 0.32) * Math.min(section.halfHeight / 0.4, 1);
        positions.push(posX, posY, posZ);
      }
    }
    for (let lengthIndex = 0; lengthIndex < lengthSegments; lengthIndex++) {
      for (let aroundIndex = 0; aroundIndex < aroundSegments; aroundIndex++) {
        const nextAround = (aroundIndex + 1) % aroundSegments;
        const current = lengthIndex * aroundSegments;
        const next = (lengthIndex + 1) * aroundSegments;
        indices.push(current + aroundIndex, next + aroundIndex, current + nextAround);
        indices.push(current + nextAround, next + aroundIndex, next + nextAround);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  // Paint zones (ZET blue, black skirt, white mask, black visor, side panel, light lines) are drawn per pixel.
  const zoneShaderCode = `
float sdRoundBox(vec2 point, vec2 halfSize, float radius) {
  vec2 corner = abs(point) - halfSize + radius;
  return length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - radius;
}
void bodyZone(vec3 point, vec3 surfaceNormal, out vec3 zoneColor, out float zoneRough, out float zoneMetal, out float zoneGlow) {
  float absX = abs(point.x);
  zoneColor = vec3(0.110, 0.361, 0.753); zoneRough = 0.3; zoneMetal = 0.35; zoneGlow = 0.0;
  if (point.y < ${beltLine.toFixed(3)}) { zoneColor = vec3(0.10, 0.11, 0.13); zoneRough = 0.55; zoneMetal = 0.2; }
  float visorProgress = clamp((point.y - 1.06) / 0.8, 0.0, 1.0);
  float visorStart = ${(bodyHalfLength - 0.58).toFixed(3)} - 0.32 * visorProgress * visorProgress;
  float visorBottom = 1.06 + 0.16 * (1.0 - smoothstep(visorStart, visorStart + 0.35, absX));
  bool inVisor = absX > visorStart && point.y > visorBottom && point.y < 1.9;
  if (inVisor) { zoneColor = vec3(0.04, 0.055, 0.075); zoneRough = 0.12; zoneMetal = 0.85; }
  bool onSide = abs(surfaceNormal.z) > 0.5;
  float intakeSlant = absX - (point.y - 0.74) * 0.9;
  if (onSide && point.y > 0.75 && point.y < 1.0 && intakeSlant > 0.82 && intakeSlant < 1.06) {
    zoneColor = fract(point.y * 36.0) < 0.4 ? vec3(0.16, 0.17, 0.19) : vec3(0.03, 0.035, 0.045); zoneRough = 0.6; zoneMetal = 0.2;
  }
  float maskStart = ${(bodyHalfLength - 0.42).toFixed(3)} - 0.22 * clamp((1.0 - point.y) / 0.28, 0.0, 1.0);
  if (absX > maskStart && point.y >= ${beltLine.toFixed(3)} && point.y < 1.0) { zoneColor = vec3(0.95, 0.955, 0.95); zoneRough = 0.35; zoneMetal = 0.15; }
  float panelDistance = sdRoundBox(vec2(absX + (point.y - 1.5) * 0.55, point.y - 1.5), vec2(0.95, 0.25), 0.1);
  if (onSide && panelDistance < 0.0) { zoneColor = vec3(0.04, 0.055, 0.075); zoneRough = 0.12; zoneMetal = 0.85; }
  if (abs(point.y - 0.8) < 0.009) { zoneColor = vec3(0.6, 0.85, 1.0); zoneGlow = 1.0; }
  if (inVisor && abs(point.y - (visorBottom + 0.05)) < 0.008 && absX > visorStart + 0.12) { zoneColor = vec3(0.6, 0.85, 1.0); zoneGlow = 1.0; }
}
`;

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.35 });
  bodyMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBodyPosition;\nvarying vec3 vBodyNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBodyPosition = position;\nvBodyNormal = normal;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBodyPosition;\nvarying vec3 vBodyNormal;\n" + zoneShaderCode)
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nvec3 zoneColor; float zoneRough; float zoneMetal; float zoneGlow;\nbodyZone(vBodyPosition, normalize(vBodyNormal), zoneColor, zoneRough, zoneMetal, zoneGlow);\ndiffuseColor.rgb = zoneColor;",
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = zoneRough;")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = zoneMetal;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += zoneGlow * vec3(0.35, 0.78, 1.0);");
  };

  const bodyMesh = new THREE.Mesh(buildBodyGeometry(), bodyMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  scoutBody.add(bodyMesh);

  /* ---------- placing parts on the curved surface ---------- */
  function noseNormal(posY, posZ, direction) {
    const delta = 0.01;
    const slopeY = (noseDepth(posY + delta, posZ) - noseDepth(posY - delta, posZ)) / (2 * delta);
    const slopeZ = (noseDepth(posY, posZ + delta) - noseDepth(posY, posZ - delta)) / (2 * delta);
    return new THREE.Vector3(direction, -slopeY, -slopeZ).normalize();
  }

  function placeOnNose(mesh, posY, posZ, direction, outset, faceAxis) {
    const normal = noseNormal(posY, posZ, direction);
    mesh.position.set(direction * noseDepth(posY, posZ), posY, posZ).addScaledVector(normal, outset);
    if (faceAxis.z === 1) {
      const right = new THREE.Vector3().crossVectors(upAxis, normal).normalize();
      const up = new THREE.Vector3().crossVectors(normal, right).normalize();
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
    } else {
      mesh.quaternion.setFromUnitVectors(faceAxis, normal);
    }
    scoutBody.add(mesh);
    return mesh;
  }

  function makePebble(radiusX, radiusY, radiusZ, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material);
    mesh.scale.set(radiusX, radiusY, radiusZ);
    mesh.castShadow = true;
    return mesh;
  }

  const faceForward = new THREE.Vector3(0, 0, 1);
  const sensorPoints = {};

  [1, -1].forEach((direction) => {
    // headlight blades on the white mask
    [-1, 1].forEach((side) => {
      const tilt = side * direction > 0 ? -0.3 : 0.3;
      placeOnNose(makePebble(0.18, 0.024, 0.012, materials.sensorBody), 0.88, side * 0.42, direction, 0.006, faceForward).rotateZ(tilt);
      placeOnNose(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.011, 0.01), direction > 0 ? materials.headLight : materials.redLight), 0.88, side * 0.42, direction, 0.016, faceForward).rotateZ(tilt);
    });

    // camera cluster on the black visor: stereo pair + wide centre
    const cameraHeight = 1.5;
    [-0.22, 0, 0.22].forEach((cameraZ) => {
      const lensRadius = cameraZ === 0 ? 0.042 : 0.033;
      placeOnNose(makePebble(0.075, 0.052, 0.018, materials.sensorBody), cameraHeight, cameraZ, direction, 0.008, faceForward);
      placeOnNose(new THREE.Mesh(new THREE.CylinderGeometry(lensRadius, lensRadius, 0.02, 24), materials.sensorAccent), cameraHeight, cameraZ, direction, 0.02, upAxis);
      placeOnNose(new THREE.Mesh(new THREE.TorusGeometry(lensRadius + 0.007, 0.006, 8, 24), materials.bezel), cameraHeight, cameraZ, direction, 0.028, faceForward);
    });
    sensorPoints[direction > 0 ? "frontCameras" : "rearCameras"] = new THREE.Vector3(direction * (noseDepth(cameraHeight, 0) + 0.04), cameraHeight, 0);

    // status display high on the visor
    const displayCanvas = document.createElement("canvas");
    displayCanvas.width = 512;
    displayCanvas.height = 64;
    const displayContext = displayCanvas.getContext("2d");
    displayContext.fillStyle = "#050505";
    displayContext.fillRect(0, 0, 512, 64);
    displayContext.fillStyle = "#ffb000";
    displayContext.font = "500 36px 'IBM Plex Mono', ui-monospace, monospace";
    displayContext.textBaseline = "middle";
    displayContext.fillText("S1", 18, 34);
    displayContext.textAlign = "center";
    displayContext.fillText("ROBOZET SCOUT", 290, 34);
    const displayTexture = new THREE.CanvasTexture(displayCanvas);
    displayTexture.encoding = THREE.sRGBEncoding;
    placeOnNose(new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.058), new THREE.MeshBasicMaterial({ map: displayTexture })), 1.64, 0, direction, 0.03, faceForward);

    // corner camera pods on the flanks (replace mirrors)
    [-1, 1].forEach((side) => {
      const podX = direction * (bodyHalfLength - 0.42);
      const podY = 1.42;
      const podZ = side * (sideSurfaceZ(podX, podY) + 0.02);
      const pod = makePebble(0.11, 0.05, 0.035, materials.sensorBody);
      pod.position.set(podX, podY, podZ);
      scoutBody.add(pod);
      addCylinder(scoutBody, 0.026, 0.02, materials.sensorAccent, podX, podY, podZ + side * 0.03, "z", 16);
      if (direction > 0 && side > 0) sensorPoints.mirrorCamera = new THREE.Vector3(podX, podY, podZ + 0.05);
    });

    // ultrasonic sensors and corner radars in the skirt
    [-0.27, -0.09, 0.09, 0.27].forEach((sensorZ) => {
      placeOnNose(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.016, 16), materials.bezel), 0.6, sensorZ, direction, 0.004, upAxis);
    });
    if (direction > 0) sensorPoints.ultrasonic = new THREE.Vector3(noseDepth(0.6, 0) + 0.02, 0.6, 0);
    [-1, 1].forEach((side) => {
      const radar = placeOnNose(makePebble(0.07, 0.04, 0.014, materials.sensorAccent), 0.6, side * 0.48, direction, 0.006, faceForward);
      if (direction > 0 && side > 0) sensorPoints.radar = radar.position.clone();
    });
  });

  // front splitters and side skirt blades (carbon)
  [1, -1].forEach((direction) => {
    const splitter = makePebble(0.1, 0.014, 0.6, materials.carbon);
    splitter.position.set(direction * (noseDepth(0.52, 0) - 0.03), 0.49, 0);
    scoutBody.add(splitter);
  });
  [-1, 1].forEach((side) => {
    const blade = makePebble(0.55, 0.016, 0.04, materials.carbon);
    blade.position.set(0, 0.5, side * (sideSurfaceZ(0, 0.52) + 0.015));
    scoutBody.add(blade);
  });

  // side camera pods and emergency stops
  [-1, 1].forEach((side) => {
    const cameraX = 0.75;
    const cameraY = 1.84;
    const cameraZ = side * (sideSurfaceZ(cameraX, cameraY) + 0.015);
    const sidePod = makePebble(0.06, 0.035, 0.03, materials.sensorBody);
    sidePod.position.set(cameraX, cameraY, cameraZ);
    scoutBody.add(sidePod);
    addCylinder(scoutBody, 0.018, 0.02, materials.sensorAccent, cameraX, cameraY, cameraZ + side * 0.025, "z", 16);
    if (side > 0) sensorPoints.sideCamera = new THREE.Vector3(cameraX, cameraY, cameraZ + 0.04);

    const estopX = side * 1.15;
    const estopY = 0.6;
    const estopZ = side * sideSurfaceZ(estopX, estopY);
    addBox(scoutBody, 0.1, 0.1, 0.02, materials.estopYellow, estopX, estopY, estopZ + side * 0.008);
    addCylinder(scoutBody, 0.033, 0.04, materials.pivot, estopX, estopY, estopZ + side * 0.03, "z", 20);
    if (side > 0) sensorPoints.estop = new THREE.Vector3(estopX, estopY, estopZ + 0.06);
  });

  // roof fairings (pebble pods)
  [
    [-0.95, 0.4, 0.09, 0.46],
    [-0.25, 0.55, 0.06, 0.5],
  ].forEach(([podX, radiusX, radiusY, radiusZ]) => {
    const pod = makePebble(radiusX, radiusY, radiusZ, materials.roofGrey);
    pod.position.set(podX, roofTopY(podX) - 0.01, 0);
    scoutBody.add(pod);
  });

  // roof lidar near the front
  const lidarX = 0.95;
  const lidarBaseY = roofTopY(lidarX);
  addCylinder(scoutBody, 0.075, 0.05, materials.sensorBody, lidarX, lidarBaseY + 0.02, 0, null, 32);
  addCylinder(scoutBody, 0.065, 0.07, materials.sensorAccent, lidarX, lidarBaseY + 0.08, 0, null, 32);
  const lidarCap = makePebble(0.072, 0.03, 0.072, materials.sensorBody);
  lidarCap.position.set(lidarX, lidarBaseY + 0.12, 0);
  scoutBody.add(lidarCap);
  sensorPoints.lidar = new THREE.Vector3(lidarX, lidarBaseY + 0.16, 0);

  // GNSS antenna on the rear fairing
  const gnssDome = makePebble(0.08, 0.03, 0.08, materials.maskWhite);
  gnssDome.position.set(-0.95, roofTopY(-0.95) + 0.09, 0.22);
  scoutBody.add(gnssDome);
  sensorPoints.gnss = new THREE.Vector3(-0.95, roofTopY(-0.95) + 0.12, 0.22);

  /* ---------- pantograph (single arm) ---------- */
  const pantograph = new THREE.Group();
  scene.add(pantograph);
  const pantoBaseY = roofHeight + 0.12;
  const hingeX = 0;
  const loweredHeadY = pantoBaseY + 0.32;

  const pantoBase = makePebble(0.42, 0.035, 0.44, materials.steel);
  pantoBase.position.set(-0.3, pantoBaseY, 0);
  pantograph.add(pantoBase);
  [
    [-0.62, -0.35],
    [-0.62, 0.35],
    [0.02, -0.35],
    [0.02, 0.35],
  ].forEach(([insulatorX, insulatorZ]) => {
    addCylinder(pantograph, 0.035, 0.1, materials.insulator, insulatorX, pantoBaseY - 0.05, insulatorZ, null, 12);
  });
  addCylinder(pantograph, 0.05, 0.25, materials.darkSteel, -0.4, pantoBaseY + 0.06, 0, "x", 16);

  const lowerArmTubes = [-0.28, 0.28].map((offsetZ) => ({ offsetZ, mesh: addTube(pantograph, [0, 0, 0], [0, 1, 0], 0.028, materials.steel) }));
  const tieRod = addTube(pantograph, [0, 0, 0], [0, 1, 0], 0.012, materials.darkSteel);
  const upperArmTubes = [-0.12, 0.12].map((offsetZ) => ({ offsetZ, mesh: addTube(pantograph, [0, 0, 0], [0, 1, 0], 0.02, materials.steel) }));
  const kneeJoint = addCylinder(pantograph, 0.04, 0.62, materials.darkSteel, 0, 0, 0, "z", 16);

  const panHead = new THREE.Group();
  pantograph.add(panHead);
  addBox(panHead, 0.07, 0.035, 1.05, materials.steel, 0, 0, 0);
  addBox(panHead, 0.05, 0.02, 0.9, materials.carbon, 0, 0.027, 0);
  [-1, 1].forEach((side) => {
    addTube(panHead, [0, 0, side * 0.52], [0, -0.1, side * 0.68], 0.012, materials.steel);
    addTube(panHead, [0, 0.02, side * 0.2], [0, -0.08, side * 0.12], 0.01, materials.steel);
  });

  let pantoHeadY = loweredHeadY;

  function updatePantograph(headY) {
    const armLength = 1.75;
    const hinge = new THREE.Vector2(hingeX, pantoBaseY + 0.06);
    const sinAngle = THREE.MathUtils.clamp((headY - 0.05 - hinge.y) / (2 * armLength), 0.02, 0.999);
    const cosAngle = Math.sqrt(1 - sinAngle * sinAngle);
    const knee = new THREE.Vector2(hinge.x - armLength * cosAngle, hinge.y + armLength * sinAngle);
    const head = new THREE.Vector2(hinge.x, hinge.y + 2 * armLength * sinAngle);

    lowerArmTubes.forEach(({ offsetZ, mesh }) => placeTube(mesh, [hinge.x, hinge.y, offsetZ], [knee.x, knee.y, offsetZ * 0.3]));
    upperArmTubes.forEach(({ offsetZ, mesh }) => placeTube(mesh, [knee.x, knee.y, offsetZ], [head.x, head.y, offsetZ * 0.5]));
    const rodEnd = knee.clone().lerp(head, 0.12);
    placeTube(tieRod, [hinge.x - 0.2, hinge.y - 0.03, 0], [rodEnd.x, rodEnd.y - 0.04, 0]);
    kneeJoint.position.set(knee.x, knee.y, 0);
    panHead.position.set(head.x, head.y + 0.02, 0);
  }
  updatePantograph(pantoHeadY);

  /* ---------- overhead line ---------- */
  const overheadLine = new THREE.Group();
  scene.add(overheadLine);
  const wireHeight = 5.6;
  addCylinder(overheadLine, 0.011, 18, materials.wire, 0, wireHeight, 0, "x", 8);
  [-4.5, 5.5].forEach((spanX) => {
    [-1, 1].forEach((side) => addCylinder(overheadLine, 0.08, 7, materials.pole, spanX, 3.5, side * 3.2, null, 16));
    addTube(overheadLine, [spanX, 6.2, -3.2], [spanX, 6.2, 3.2], 0.008, materials.wire);
    addTube(overheadLine, [spanX, 6.2, 0], [spanX, wireHeight, 0], 0.008, materials.wire);
    addCylinder(overheadLine, 0.03, 0.08, materials.insulator, spanX, 6.0, 0, null, 10);
  });

  /* ---------- front camera view cone ---------- */
  const coneLength = 6;
  const coneHalfAngle = THREE.MathUtils.degToRad(35);
  const coneGeometry = new THREE.ConeGeometry(coneLength * Math.tan(coneHalfAngle), coneLength, 40, 1, true);
  coneGeometry.translate(0, -coneLength / 2, 0);
  coneGeometry.rotateZ(Math.PI / 2);
  const fovCone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color: 0x7cf4e0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  fovCone.scale.y = 0.55;
  fovCone.position.copy(sensorPoints.frontCameras);
  scene.add(fovCone);

  /* ---------- extra materials for the earlier stages ---------- */
  function makeHazardTexture() {
    const hazardCanvas = document.createElement("canvas");
    hazardCanvas.width = 256;
    hazardCanvas.height = 32;
    const hazardContext = hazardCanvas.getContext("2d");
    hazardContext.fillStyle = "#f2c200";
    hazardContext.fillRect(0, 0, 256, 32);
    hazardContext.fillStyle = "#1a1a1a";
    for (let stripeX = -32; stripeX < 288; stripeX += 32) {
      hazardContext.beginPath();
      hazardContext.moveTo(stripeX, 32);
      hazardContext.lineTo(stripeX + 16, 32);
      hazardContext.lineTo(stripeX + 32, 0);
      hazardContext.lineTo(stripeX + 16, 0);
      hazardContext.fill();
    }
    const hazardTexture = new THREE.CanvasTexture(hazardCanvas);
    hazardTexture.encoding = THREE.sRGBEncoding;
    return hazardTexture;
  }

  Object.assign(materials, {
    deckPlate: new THREE.MeshStandardMaterial({ color: 0x4a5058, metalness: 0.6, roughness: 0.55 }),
    aluminium: new THREE.MeshStandardMaterial({ color: 0xb9bec4, metalness: 0.75, roughness: 0.35 }),
    battery: new THREE.MeshStandardMaterial({ color: 0x2f4d6b, metalness: 0.2, roughness: 0.5 }),
    caseGrey: new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.1, roughness: 0.7 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.1, roughness: 0.8 }),
    hazard: new THREE.MeshStandardMaterial({ map: makeHazardTexture(), metalness: 0.1, roughness: 0.6 }),
    amberLight: new THREE.MeshStandardMaterial({ color: 0xffb000, emissive: 0xff9900, emissiveIntensity: 0.8 }),
    shellWhite: new THREE.MeshStandardMaterial({ color: 0xf1f1ee, metalness: 0.1, roughness: 0.5 }),
    shellGlass: new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.6, roughness: 0.1 }),
  });

  function buildLidarUnit(parent, posX, posY, posZ) {
    addCylinder(parent, 0.06, 0.04, materials.sensorBody, posX, posY, posZ, null, 24);
    addCylinder(parent, 0.055, 0.06, materials.sensorAccent, posX, posY + 0.05, posZ, null, 24);
    addCylinder(parent, 0.06, 0.02, materials.sensorBody, posX, posY + 0.09, posZ, null, 24);
  }

  function buildBeaconUnit(parent, posX, posY, posZ) {
    addCylinder(parent, 0.045, 0.06, materials.sensorBody, posX, posY, posZ, null, 16);
    addCylinder(parent, 0.04, 0.08, materials.amberLight, posX, posY + 0.07, posZ, null, 16);
  }

  /* ---------- stage 1: crude test rig ---------- */
  const rigGroup = new THREE.Group();
  scene.add(rigGroup);
  const rigPoints = {};

  (function buildTestRig() {
    const deckY = 0.96;
    // adapter channels on the bolster, steel deck plate, bolt heads
    [-0.22, 0.22].forEach((channelX) => addBox(rigGroup, 0.1, 0.06, 1.2, materials.steel, channelX, deckY - 0.05, 0));
    addBox(rigGroup, 2.5, 0.04, 1.3, materials.deckPlate, 0, deckY, 0);
    [-1.15, -0.4, 0.4, 1.15].forEach((boltX) =>
      [-0.58, 0.58].forEach((boltZ) => {
        addCylinder(rigGroup, 0.016, 0.016, materials.bezel, boltX, deckY + 0.028, boltZ, null, 6);
      }),
    );

    // hazard-striped bumpers with work lights
    [-1, 1].forEach((direction) => {
      addBox(rigGroup, 0.1, 0.16, 1.42, materials.hazard, direction * 1.3, deckY - 0.03, 0);
      [-0.45, 0.45].forEach((lightZ) => addBox(rigGroup, 0.03, 0.07, 0.16, direction > 0 ? materials.headLight : materials.redLight, direction * 1.365, deckY - 0.02, lightZ));
    });

    // handrail along both sides
    [-1, 1].forEach((side) => {
      const railZ = side * 0.62;
      const railY = deckY + 0.42;
      [-1.15, -0.3, 0.55].forEach((postX) => addTube(rigGroup, [postX, deckY, railZ], [postX, railY, railZ], 0.016, materials.steel));
      addTube(rigGroup, [-1.15, railY, railZ], [0.55, railY, railZ], 0.016, materials.steel);
    });

    // two battery packs with terminals
    [-0.3, 0.3].forEach((packZ) => {
      addBox(rigGroup, 0.45, 0.28, 0.5, materials.battery, -0.82, deckY + 0.16, packZ);
      addBox(rigGroup, 0.3, 0.05, 0.002, materials.shellWhite, -0.82, deckY + 0.2, packZ + Math.sign(packZ) * 0.252);
      addCylinder(rigGroup, 0.02, 0.03, materials.redLight, -0.92, deckY + 0.315, packZ, null, 12);
      addCylinder(rigGroup, 0.02, 0.03, materials.cable, -0.72, deckY + 0.315, packZ, null, 12);
    });
    rigPoints.battery = new THREE.Vector3(-0.82, deckY + 0.35, -0.55);

    // rugged compute case (GPU + data recorder) with latches and handle
    addBox(rigGroup, 0.6, 0.3, 0.46, materials.caseGrey, -0.12, deckY + 0.17, 0.3);
    [-0.2, 0.2].forEach((latchX) => addBox(rigGroup, 0.06, 0.05, 0.02, materials.bezel, -0.12 + latchX, deckY + 0.24, 0.54));
    addTube(rigGroup, [-0.27, deckY + 0.33, 0.3], [0.03, deckY + 0.33, 0.3], 0.012, materials.cable);
    rigPoints.compute = new THREE.Vector3(-0.12, deckY + 0.36, 0.3);

    // motor controller with heatsink fins
    addBox(rigGroup, 0.5, 0.14, 0.36, materials.steel, -0.12, deckY + 0.09, -0.32);
    for (let finIndex = 0; finIndex < 9; finIndex++) {
      addBox(rigGroup, 0.012, 0.06, 0.34, materials.aluminium, -0.34 + finIndex * 0.055, deckY + 0.19, -0.32);
    }
    rigPoints.controller = new THREE.Vector3(-0.12, deckY + 0.24, -0.5);

    // cable runs to the mast
    addTube(rigGroup, [0.18, deckY + 0.04, 0.3], [0.95, deckY + 0.04, 0.05], 0.014, materials.cable);
    addTube(rigGroup, [0.13, deckY + 0.04, -0.32], [0.95, deckY + 0.04, -0.05], 0.014, materials.cable);
    addTube(rigGroup, [-0.6, deckY + 0.04, 0], [-0.42, deckY + 0.04, 0.2], 0.014, materials.cable);

    // aluminium profile mast with braces and camera crossbar at cab height
    const mastX = 1.0;
    const crossbarY = 2.3;
    addBox(rigGroup, 0.045, crossbarY - deckY, 0.045, materials.aluminium, mastX, (crossbarY + deckY) / 2, 0);
    [-1, 1].forEach((side) => addTube(rigGroup, [0.45, deckY, side * 0.48], [mastX, 1.85, 0], 0.018, materials.aluminium));
    addTube(rigGroup, [mastX + 0.25, deckY, 0], [mastX, 1.6, 0], 0.018, materials.aluminium);
    addBox(rigGroup, 0.045, 0.045, 1.0, materials.aluminium, mastX, crossbarY, 0);
    [-0.32, 0, 0.32].forEach((cameraZ) => {
      addBox(rigGroup, 0.11, 0.07, 0.09, materials.sensorBody, mastX + 0.075, crossbarY - 0.02, cameraZ);
      addCylinder(rigGroup, 0.026, 0.03, materials.sensorAccent, mastX + 0.14, crossbarY - 0.02, cameraZ, "x", 20);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.005, 8, 20), materials.bezel);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(mastX + 0.155, crossbarY - 0.02, cameraZ);
      rigGroup.add(ring);
    });
    rigPoints.camera = new THREE.Vector3(mastX + 0.16, crossbarY - 0.02, 0);
    buildLidarUnit(rigGroup, mastX, crossbarY + 0.045, 0);
    rigPoints.lidar = new THREE.Vector3(mastX, crossbarY + 0.15, 0);

    // GNSS antenna on its own post
    addTube(rigGroup, [0.55, deckY + 0.42, -0.62], [0.55, 1.75, -0.62], 0.012, materials.aluminium);
    addCylinder(rigGroup, 0.07, 0.025, materials.shellWhite, 0.55, 1.76, -0.62, null, 20);
    rigPoints.gnss = new THREE.Vector3(0.55, 1.8, -0.62);

    // rear camera and beacon on the rear post
    addTube(rigGroup, [-1.2, deckY, 0], [-1.2, deckY + 0.55, 0], 0.016, materials.aluminium);
    addBox(rigGroup, 0.09, 0.06, 0.08, materials.sensorBody, -1.24, deckY + 0.5, 0);
    addCylinder(rigGroup, 0.022, 0.02, materials.sensorAccent, -1.29, deckY + 0.5, 0, "x", 16);
    buildBeaconUnit(rigGroup, -1.2, deckY + 0.58, 0);
    rigPoints.rearCamera = new THREE.Vector3(-1.3, deckY + 0.5, 0);

    // emergency stops on both sides
    [-1, 1].forEach((side) => {
      addBox(rigGroup, 0.1, 0.1, 0.1, materials.estopYellow, 0.2, deckY + 0.07, side * 0.58);
      addCylinder(rigGroup, 0.035, 0.035, materials.pivot, 0.2, deckY + 0.14, side * 0.58, null, 20);
    });
    rigPoints.estop = new THREE.Vector3(0.2, deckY + 0.17, 0.58);

    // wheel encoder on an axle end for odometry
    addCylinder(rigGroup, 0.05, 0.05, materials.sensorBody, 0.95, wheelRadius + 0.02, 0.7, "z", 20);
    addTube(rigGroup, [0.95, wheelRadius + 0.07, 0.7], [0.95, deckY - 0.02, 0.62], 0.01, materials.cable);
    rigPoints.encoder = new THREE.Vector3(0.95, wheelRadius + 0.02, 0.74);
    rigPoints.bumper = new THREE.Vector3(1.36, deckY - 0.05, 0.6);
  })();

  /* ---------- stage 2: enclosed field prototype ---------- */
  const fieldGroup = new THREE.Group();
  scene.add(fieldGroup);
  const fieldPoints = {};
  const fieldRoof = 1.66;

  (function buildFieldPrototype() {
    const deckY = 0.96;
    const shellLength = 1.6;
    const shoulder = 1.18;
    const noseInset = 1.25;
    const shellDepth = 1.46;
    const profile = new THREE.Shape();
    profile.moveTo(-shellLength, deckY);
    profile.lineTo(shellLength, deckY);
    profile.lineTo(shellLength, shoulder);
    profile.lineTo(noseInset, fieldRoof);
    profile.lineTo(-noseInset, fieldRoof);
    profile.lineTo(-shellLength, shoulder);
    profile.closePath();
    const shellGeometry = new THREE.ExtrudeGeometry(profile, { depth: shellDepth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
    shellGeometry.translate(0, 0, -shellDepth / 2);
    const shell = new THREE.Mesh(shellGeometry, materials.shellWhite);
    shell.castShadow = true;
    shell.receiveShadow = true;
    fieldGroup.add(shell);
    addBox(fieldGroup, shellLength * 2 + 0.08, 0.2, shellDepth + 0.08, materials.zetBlue, 0, deckY + 0.08, 0);
    addBox(fieldGroup, shellLength * 2 + 0.09, 0.025, shellDepth + 0.09, materials.amberLight, 0, deckY - 0.02, 0);

    const slopeDx = shellLength - noseInset;
    const slopeDy = fieldRoof - shoulder;
    const slopeLength = Math.hypot(slopeDx, slopeDy);
    const slopeAngle = Math.atan2(slopeDx, slopeDy);
    [1, -1].forEach((direction) => {
      const sensorWindow = addBox(fieldGroup, 0.02, slopeLength * 0.8, shellDepth * 0.82, materials.shellGlass, direction * ((shellLength + noseInset) / 2 + 0.03), (shoulder + fieldRoof) / 2 + 0.02, 0);
      sensorWindow.rotation.z = direction * slopeAngle;
      [-0.4, -0.13, 0.13, 0.4].forEach((cameraZ) => {
        addCylinder(fieldGroup, 0.03, 0.02, materials.sensorAccent, direction * ((shellLength + noseInset) / 2 + 0.045), (shoulder + fieldRoof) / 2 + 0.03, cameraZ, "x", 16);
      });
      fieldPoints[direction > 0 ? "frontCameras" : "rearCameras"] = new THREE.Vector3(direction * ((shellLength + noseInset) / 2 + 0.06), (shoulder + fieldRoof) / 2 + 0.03, 0);
      const lightMaterial = direction > 0 ? materials.headLight : materials.redLight;
      [-0.5, 0.5].forEach((lightZ) => addBox(fieldGroup, 0.02, 0.06, 0.24, lightMaterial, direction * (shellLength + 0.035), shoulder - 0.06, lightZ));
      addBox(fieldGroup, 0.02, 0.1, 0.3, materials.sensorAccent, direction * (shellLength + 0.035), deckY + 0.08, 0);
    });
    fieldPoints.radar = new THREE.Vector3(shellLength + 0.05, deckY + 0.08, 0);

    [-1, 1].forEach((side) => {
      for (let ventIndex = 0; ventIndex < 6; ventIndex++) {
        addBox(fieldGroup, 0.05, 0.18, 0.02, materials.darkSteel, -0.6 + ventIndex * 0.09, deckY + 0.42, side * (shellDepth / 2 + 0.035));
      }
      addBox(fieldGroup, 0.5, 0.12, 0.02, materials.zetBlue, 0.6, deckY + 0.45, side * (shellDepth / 2 + 0.035));
    });

    buildLidarUnit(fieldGroup, 0.85, fieldRoof + 0.03, 0);
    fieldPoints.lidar = new THREE.Vector3(0.85, fieldRoof + 0.16, 0);
    buildBeaconUnit(fieldGroup, -0.95, fieldRoof + 0.03, 0.42);
    buildBeaconUnit(fieldGroup, 0.95, fieldRoof + 0.03, -0.42);
    addCylinder(fieldGroup, 0.07, 0.02, materials.sensorBody, -0.95, fieldRoof + 0.04, -0.35, null, 20);
    fieldPoints.gnss = new THREE.Vector3(-0.95, fieldRoof + 0.07, -0.35);
  })();

  /* ---------- stages (text lives in the HTML; this is the 3D side) ---------- */
  const stages = [
    {
      name: "Test rig",
      group: rigGroup,
      camera: rigPoints.camera,
      pantograph: false,
      pantoOffset: 0,
      labels: [
        { text: "3 cameras at cab height", point: rigPoints.camera, shift: [0.3, 0.15, 0] },
        { text: "360° lidar", point: rigPoints.lidar, shift: [0, 0.2, 0] },
        { text: "GNSS antenna", point: rigPoints.gnss, shift: [0, 0.15, -0.1] },
        { text: "Compute + data recorder", point: rigPoints.compute, shift: [0, 0.15, 0.2] },
        { text: "Battery packs", point: rigPoints.battery, shift: [-0.1, 0.1, -0.15] },
        { text: "Motor controller", point: rigPoints.controller, shift: [0.1, 0.1, -0.2] },
        { text: "E-stop", point: rigPoints.estop, shift: [0, 0.12, 0.15] },
        { text: "Rear camera + beacon", point: rigPoints.rearCamera, shift: [-0.2, 0.2, 0] },
        { text: "Wheel encoder", point: rigPoints.encoder, shift: [0, -0.2, 0.2] },
        { text: "Safety bumper", point: rigPoints.bumper, shift: [0.15, -0.1, 0.2] },
      ],
    },
    {
      name: "Field prototype",
      group: fieldGroup,
      camera: fieldPoints.frontCameras,
      pantograph: true,
      pantoOffset: fieldRoof + 0.11 - pantoBaseY,
      labels: [
        { text: "Front camera band", point: fieldPoints.frontCameras, shift: [0.3, 0.15, 0] },
        { text: "Rear camera band", point: fieldPoints.rearCameras, shift: [-0.3, 0.15, 0] },
        { text: "Roof lidar", point: fieldPoints.lidar, shift: [0.1, 0.2, 0] },
        { text: "Radar", point: fieldPoints.radar, shift: [0.25, -0.05, 0.2] },
        { text: "GNSS antenna", point: fieldPoints.gnss, shift: [-0.1, 0.2, 0] },
        { text: "Pantograph, line power", point: null, shift: [0.25, 0.1, 0] },
      ],
    },
    {
      name: "Final scout",
      group: scoutBody,
      camera: sensorPoints.frontCameras,
      pantograph: true,
      pantoOffset: 0,
      labels: [
        { text: "Stereo + wide cameras", point: sensorPoints.frontCameras, shift: [0.35, 0.15, 0] },
        { text: "Rear cameras", point: sensorPoints.rearCameras, shift: [-0.3, 0.2, 0] },
        { text: "360° lidar", point: sensorPoints.lidar, shift: [0, 0.3, 0] },
        { text: "Corner camera", point: sensorPoints.mirrorCamera, shift: [0.1, 0.15, 0.2] },
        { text: "Ultrasonic", point: sensorPoints.ultrasonic, shift: [0.3, -0.05, -0.3] },
        { text: "E-stop", point: sensorPoints.estop, shift: [0, -0.15, 0.2] },
        { text: "Corner radar", point: sensorPoints.radar, shift: [0.3, -0.1, 0.2] },
        { text: "Side camera", point: sensorPoints.sideCamera, shift: [0, 0.15, 0.3] },
        { text: "GNSS antenna", point: sensorPoints.gnss, shift: [-0.2, 0.3, 0] },
        { text: "Pantograph, line power", point: null, shift: [0.25, 0.1, 0] },
      ],
    },
  ];

  /* ---------- labels ---------- */
  stages.forEach((stage) =>
    stage.labels.forEach((label) => {
      label.chip = document.createElement("div");
      label.chip.className = "scout-model__label";
      label.chip.textContent = label.text;
      label.chip.hidden = true;
      labelsElement.appendChild(label.chip);
    }),
  );

  let activeStage = stages[0];
  const projected = new THREE.Vector3();

  function updateLabels() {
    const width = viewElement.clientWidth;
    const height = viewElement.clientHeight;
    stages.forEach((stage) =>
      stage.labels.forEach((label) => {
        const visible = toggles.labels.checked && toggles.body.checked && stage === activeStage && (label.point || stage.pantograph);
        if (!visible) {
          label.chip.hidden = true;
          return;
        }
        const anchor = label.point ? label.point : new THREE.Vector3(0, pantoHeadY + stage.pantoOffset, 0.55);
        projected.set(anchor.x + label.shift[0], anchor.y + label.shift[1], anchor.z + label.shift[2]).project(camera);
        const onScreen = projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05;
        label.chip.hidden = !onScreen;
        label.chip.style.transform = `translate(${(projected.x * 0.5 + 0.5) * width}px, ${(-projected.y * 0.5 + 0.5) * height}px) translateY(-50%)`;
      }),
    );
  }

  /* ---------- UI ---------- */
  const stageIndexOf = () => stages.indexOf(activeStage);

  function selectStage(stageIndex) {
    activeStage = stages[stageIndex];
    stageButtons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === stageIndex)));
    infoPanels.forEach((panel) => (panel.hidden = Number(panel.dataset.scoutInfo) !== stageIndex));
    stepperLabel.innerHTML = `Stage ${stageIndex + 1} of ${stages.length} · <b>${activeStage.name}</b>`;
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === stageIndex));
    stepButtons.forEach((button) => {
      const step = Number(button.dataset.scoutStep);
      button.disabled = stageIndex + step < 0 || stageIndex + step >= stages.length;
    });
    toggles.pantograph.disabled = !activeStage.pantograph;
    toggles.pantograph.closest("label").classList.toggle("is-disabled", !activeStage.pantograph);
    fovCone.position.copy(activeStage.camera);
    pantograph.position.y = activeStage.pantoOffset;
    applyState();
  }

  function applyState() {
    stages.forEach((stage) => {
      stage.group.visible = toggles.body.checked && stage === activeStage;
    });
    pantograph.visible = activeStage.pantograph && toggles.body.checked;
    fovCone.visible = toggles.fov.checked && toggles.body.checked;
    overheadLine.visible = toggles.wire.checked;
    materials.sensorAccent.emissiveIntensity = toggles.labels.checked ? 0.55 : 0;
  }

  stageButtons.forEach((button) => button.addEventListener("click", () => selectStage(Number(button.dataset.scoutStage))));
  stepButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const next = stageIndexOf() + Number(button.dataset.scoutStep);
      selectStage(Math.min(Math.max(next, 0), stages.length - 1));
    }),
  );
  [toggles.labels, toggles.wire, toggles.fov, toggles.body].forEach((input) => input.addEventListener("change", applyState));
  toggles.rotate.addEventListener("change", () => {
    controls.autoRotate = toggles.rotate.checked;
  });
  root.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.target.closest("input")) return;
    if (keyEvent.key === "ArrowRight") selectStage(Math.min(stageIndexOf() + 1, stages.length - 1));
    if (keyEvent.key === "ArrowLeft") selectStage(Math.max(stageIndexOf() - 1, 0));
  });

  selectStage(0);

  /* ---------- sizing + render loop (runs only while the model is on screen) ---------- */
  function resizeRenderer() {
    const width = viewElement.clientWidth;
    const height = viewElement.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resizeRenderer).observe(viewElement);
  resizeRenderer();

  let running = false;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    const targetHeadY = toggles.pantograph.checked ? wireHeight - 0.03 - activeStage.pantoOffset : loweredHeadY;
    if (Math.abs(targetHeadY - pantoHeadY) > 0.001) {
      pantoHeadY = prefersReducedMotion ? targetHeadY : pantoHeadY + (targetHeadY - pantoHeadY) * 0.06;
      updatePantograph(pantoHeadY);
    }
    if (toggles.spin.checked) {
      wheelsets.forEach((wheelset) => {
        wheelset.rotation.z -= 0.03;
      });
    }
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
  }

  const visibility = new IntersectionObserver(
    ([entry]) => {
      const shouldRun = entry.isIntersecting;
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) animate();
    },
    { rootMargin: "200px 0px" },
  );
  visibility.observe(viewElement);
}

initScoutModel();
