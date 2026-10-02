import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const navigation = document.getElementById('cubeNavigation');
const navigationPanel = document.getElementById('navigationPanel');
const navigationToggle = document.getElementById('navigationToggle');
const stage = document.getElementById('cubeStage');
const canvas = document.getElementById('cubeCanvas');
const statusElement = document.getElementById('cubeStatus');
const faceLinks = [...document.querySelectorAll('.cube-face-link')];
const panels = [...document.querySelectorAll('.panel')];
const defaultVisible = ['about', 'education'];

let activeAction = null;
let pendingAction = null;
let confirmationDeadline = 0;
let isTurningToFace = false;
let isDragging = false;
let dragStart = null;
let previousTrackball = null;
let hoveredAction = null;
const turnTarget = new THREE.Quaternion();
const dragDelta = new THREE.Quaternion();
const inverseCubeRotation = new THREE.Quaternion();
const objectWorldRotation = new THREE.Quaternion();
const worldHitNormal = new THREE.Vector3();
const localHitNormal = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const trackballVector = new THREE.Vector3();
const previousTrackballVector = new THREE.Vector3();
const cubeMeshes = [];

function setCurrentFace(action) {
  activeAction = action;
  faceLinks.forEach((link) => {
    if ((link.dataset.section || link.dataset.action) === action) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function showSection(sectionId) {
  if (!document.getElementById(sectionId)) return;
  pendingAction = null;
  confirmationDeadline = 0;
  isTurningToFace = false;
  panels.forEach((panel) => {
    panel.classList.toggle('is-visible', panel.id === sectionId);
  });
  setCurrentFace(sectionId);
  statusElement.textContent = sectionId.toUpperCase();
  document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function revealAll() {
  pendingAction = null;
  confirmationDeadline = 0;
  isTurningToFace = false;
  panels.forEach((panel) => panel.classList.add('is-visible'));
  setCurrentFace('reveal-all');
  statusElement.textContent = 'ALL SECTIONS';
}

faceLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.detail === 0) {
      handleFaceAction(link.dataset.section || link.dataset.action);
    }
  });
  link.addEventListener('focus', () => setHoveredAction(link.dataset.section || link.dataset.action));
});

panels.forEach((panel) => {
  panel.classList.toggle('is-visible', defaultVisible.includes(panel.id));
});

function setNavigationCollapsed(collapsed) {
  navigation.classList.toggle('is-collapsed', collapsed);
  navigationToggle.setAttribute('aria-expanded', String(!collapsed));
  navigationToggle.setAttribute('aria-label', collapsed ? 'Show navigation' : 'Hide navigation');
  navigationPanel.setAttribute('aria-hidden', String(collapsed));
  navigationPanel.inert = collapsed;
  navigationToggle.querySelector('span').textContent = collapsed ? '\u2190' : '\u2192';
}

navigationToggle.addEventListener('click', () => {
  setNavigationCollapsed(!navigation.classList.contains('is-collapsed'));
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100e);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x07100e, 1);

const camera = new THREE.PerspectiveCamera(34, 1.48, 0.1, 100);
camera.position.set(5.4, 4.6, 10.4);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xe3f1eb, 0x21352e, 2.1));
const keyLight = new THREE.DirectionalLight(0xd7f5e6, 2.4);
keyLight.position.set(-5, 9, 7);
scene.add(keyLight);
const fillLight = new THREE.PointLight(0x77ae94, 32, 24);
fillLight.position.set(4, 5, -5);
scene.add(fillLight);

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x95b6a7,
  emissive: 0x162a22,
  roughness: 0.38,
  metalness: 0.32
});
const cellGeometry = new THREE.BoxGeometry(0.78, 0.78, 0.78);
const cellGap = 0.82;
const edgeIndex = 2;
const cellMeshes = [];

for (let x = -edgeIndex; x <= edgeIndex; x += 1) {
  for (let y = -edgeIndex; y <= edgeIndex; y += 1) {
    for (let z = -edgeIndex; z <= edgeIndex; z += 1) {
      const boundaryNormal = new THREE.Vector3(
        Math.abs(x) === edgeIndex ? Math.sign(x) : 0,
        Math.abs(y) === edgeIndex ? Math.sign(y) : 0,
        Math.abs(z) === edgeIndex ? Math.sign(z) : 0
      );
      if (boundaryNormal.lengthSq() === 0) continue;

      boundaryNormal.normalize();
      const mesh = new THREE.Mesh(cellGeometry, cubeMaterial);
      const basePosition = new THREE.Vector3(x, y, z).multiplyScalar(cellGap);
      mesh.position.copy(basePosition);
      cubeGroup.add(mesh);
      cellMeshes.push({ mesh, basePosition, boundaryNormal });
      cubeMeshes.push(mesh);
    }
  }
}

function createFaceLabel(text) {
  const labelCanvas = document.createElement('canvas');
  const context = labelCanvas.getContext('2d');
  const fontSize = 88;
  context.font = `600 ${fontSize}px Georgia`;
  const textWidth = Math.ceil(context.measureText(text.toUpperCase()).width);
  labelCanvas.width = textWidth + 20;
  labelCanvas.height = 108;
  context.font = `600 ${fontSize}px Georgia`;
  context.shadowColor = 'rgba(0, 0, 0, 0.95)';
  context.shadowBlur = 8;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.fillStyle = '#f5f7f5';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.toUpperCase(), labelCanvas.width / 2, labelCanvas.height / 2);
  const alphaData = context.getImageData(0, 0, labelCanvas.width, labelCanvas.height).data;
  const textMask = new Uint8Array(labelCanvas.width * labelCanvas.height);
  for (let pixel = 0; pixel < textMask.length; pixel += 1) {
    textMask[pixel] = alphaData[pixel * 4 + 3] > 180 ? 1 : 0;
  }

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.4, 3.4 * labelCanvas.height / labelCanvas.width, 1);
  sprite.userData.label = text.toUpperCase();
  sprite.userData.baseScale = sprite.scale.clone();
  sprite.userData.textMask = textMask;
  sprite.userData.maskWidth = labelCanvas.width;
  sprite.userData.maskHeight = labelCanvas.height;
  return sprite;
}

const faceDefinitions = [
  { action: 'education', label: 'Education', normal: new THREE.Vector3(0, 1, 0) },
  { action: 'skills', label: 'Skills', normal: new THREE.Vector3(0, -1, 0) },
  { action: 'contact', label: 'Contact', normal: new THREE.Vector3(-1, 0, 0) },
  { action: 'projects', label: 'Projects', normal: new THREE.Vector3(1, 0, 0) },
  { action: 'about', label: 'About', normal: new THREE.Vector3(0, 0, 1) },
  { action: 'reveal-all', label: 'Know More', normal: new THREE.Vector3(0, 0, -1) }
];

const faceLabels = [];
const faceLabelByAction = new Map();
faceDefinitions.forEach((definition) => {
  const sprite = createFaceLabel(definition.label);
  sprite.position.copy(definition.normal).multiplyScalar(2.42);
  sprite.userData.action = definition.action;
  cubeGroup.add(sprite);
  const face = { ...definition, sprite, baseScale: sprite.scale.clone() };
  faceLabels.push(face);
  faceLabelByAction.set(definition.action, face);
});

const cursorDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.13, 18, 14),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
cursorDot.visible = false;
scene.add(cursorDot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cursorPlane = new THREE.Plane();
const cursorTarget = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const planePoint = new THREE.Vector3();
const projectedPoint = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const worldNormal = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const activeWaveDirection = new THREE.Vector3(1, 0, 0);
const targetWaveDirection = new THREE.Vector3(1, 0, 0);
const rotationAxis = new THREE.Vector3(0.2, 1, 0.1).normalize();
const targetRotationAxis = rotationAxis.clone();
let stageRect;
let nextWaveAt = 0;
let nextRotationAt = 0;

function updateLayout() {
  stageRect = stage.getBoundingClientRect();
  camera.aspect = stageRect.width / stageRect.height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stageRect.width, stageRect.height, false);
}

function chooseWaveDirection() {
  targetWaveDirection.set(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2)
  ).normalize();
}

function chooseRotationDirection() {
  targetRotationAxis.set(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2)
  ).normalize();
}

function setHoveredAction(action) {
  hoveredAction = action;
  faceLabels.forEach((face) => {
    const scale = face.baseScale;
    const multiplier = face.action === action ? 1.2 : 1;
    face.sprite.scale.set(scale.x * multiplier, scale.y * multiplier, scale.z);
  });

  if (pendingAction) {
    statusElement.textContent = isTurningToFace
      ? `TURNING ${pendingAction.replace('-', ' ').toUpperCase()}`
      : `CLICK ${pendingAction.replace('-', ' ').toUpperCase()} AGAIN TO OPEN`;
  } else if (action) {
    const face = faceDefinitions.find((item) => item.action === action);
    statusElement.textContent = `HOVER: ${face.label.toUpperCase()}`;
  } else {
    statusElement.textContent = activeAction === 'reveal-all' ? 'ALL SECTIONS' : 'MOVE TO EXPLORE';
  }
}

function faceAtPointer(event) {
  stageRect = stage.getBoundingClientRect();
  pointer.x = ((event.clientX - stageRect.left) / stageRect.width) * 2 - 1;
  pointer.y = -((event.clientY - stageRect.top) / stageRect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(cubeMeshes, false)[0];
  if (!hit?.face) return null;

  worldHitNormal.copy(hit.face.normal).applyQuaternion(hit.object.getWorldQuaternion(objectWorldRotation));
  inverseCubeRotation.copy(cubeGroup.quaternion).invert();
  localHitNormal.copy(worldHitNormal).applyQuaternion(inverseCubeRotation).normalize();

  return faceDefinitions.reduce((closest, face) => {
    const score = localHitNormal.dot(face.normal);
    return score > closest.score ? { face, score } : closest;
  }, { face: null, score: -Infinity }).face;
}

function updateCursor(event) {
  stageRect = stage.getBoundingClientRect();
  pointer.x = ((event.clientX - stageRect.left) / stageRect.width) * 2 - 1;
  pointer.y = -((event.clientY - stageRect.top) / stageRect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  camera.getWorldDirection(planeNormal);
  camera.getWorldPosition(cameraPosition);
  planePoint.copy(cameraPosition).addScaledVector(planeNormal, 5.5);
  cursorPlane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
  if (raycaster.ray.intersectPlane(cursorPlane, cursorTarget)) {
    cursorDot.visible = true;
    cursorDot.position.lerp(cursorTarget, 0.32);
  }

  faceLabels.forEach((face) => face.sprite.scale.copy(face.baseScale));
  const labelHits = raycaster.intersectObjects(faceLabels.map((face) => face.sprite), false);
  const hoveredLabel = labelHits.find((hit) => {
    const { textMask, maskWidth, maskHeight } = hit.object.userData;
    const pixelX = Math.floor(hit.uv.x * maskWidth);
    const pixelY = Math.floor((1 - hit.uv.y) * maskHeight);
    if (pixelX < 0 || pixelX >= maskWidth || pixelY < 0 || pixelY >= maskHeight) return false;
    return textMask[pixelY * maskWidth + pixelX] === 1;
  });
  const nextHoveredAction = hoveredLabel?.object.userData.action ?? null;
  if (nextHoveredAction !== hoveredAction) setHoveredAction(nextHoveredAction);
}

stage.addEventListener('pointermove', updateCursor);
stage.addEventListener('pointerleave', () => {
  cursorDot.visible = false;
  setHoveredAction(null);
});

function handleFaceAction(action) {
  if (isTurningToFace) return;

  if (pendingAction === action && Date.now() <= confirmationDeadline) {
    if (action === 'reveal-all') revealAll();
    else showSection(action);
    return;
  }

  const face = faceDefinitions.find((item) => item.action === action);
  if (!face) return;

  pendingAction = action;
  confirmationDeadline = 0;
  setCurrentFace(action);
  cameraDirection.copy(camera.position).normalize();
  turnTarget.setFromUnitVectors(face.normal, cameraDirection);
  isTurningToFace = cubeGroup.quaternion.angleTo(turnTarget) > 0.025;

  if (!isTurningToFace) {
    confirmationDeadline = Date.now() + 8000;
    statusElement.textContent = `CLICK ${face.label.toUpperCase()} AGAIN TO OPEN`;
  } else {
    statusElement.textContent = `TURNING ${face.label.toUpperCase()}`;
  }
}

function getTrackballPoint(event, output) {
  const bounds = stage.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  const y = 1 - ((event.clientY - bounds.top) / bounds.height) * 2;
  const distance = x * x + y * y;
  output.set(x, y, distance < 1 ? Math.sqrt(1 - distance) : 0).normalize();
  output.applyQuaternion(camera.quaternion).normalize();
}

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  isDragging = false;
  getTrackballPoint(event, previousTrackballVector);
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener('pointermove', (event) => {
  if (!dragStart) return;
  const movement = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
  if (movement > 5) {
    isDragging = true;
    pendingAction = null;
    confirmationDeadline = 0;
    isTurningToFace = false;
    activeAction = null;
    faceLinks.forEach((link) => link.removeAttribute('aria-current'));
    statusElement.textContent = 'DRAG TO SPIN';
  }
  if (!isDragging) return;

  getTrackballPoint(event, trackballVector);
  dragDelta.setFromUnitVectors(previousTrackballVector, trackballVector);
  cubeGroup.quaternion.premultiply(dragDelta).normalize();
  previousTrackballVector.copy(trackballVector);
});

stage.addEventListener('pointerup', (event) => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return;
  if (!isDragging) {
    const face = faceAtPointer(event);
    if (face) handleFaceAction(face.action);
  }
  dragStart = null;
  isDragging = false;
});

stage.addEventListener('pointercancel', () => {
  dragStart = null;
  isDragging = false;
});

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  if (!pendingAction && elapsed >= nextWaveAt) {
    chooseWaveDirection();
    nextWaveAt = elapsed + THREE.MathUtils.randFloat(4, 7);
  }
  if (!pendingAction && elapsed >= nextRotationAt) {
    chooseRotationDirection();
    nextRotationAt = elapsed + THREE.MathUtils.randFloat(5, 9);
  }

  activeWaveDirection.lerp(targetWaveDirection, 1 - Math.exp(-delta * 0.35)).normalize();
  rotationAxis.lerp(targetRotationAxis, 1 - Math.exp(-delta * 0.2)).normalize();

  if (isTurningToFace) {
    cubeGroup.quaternion.slerp(turnTarget, 1 - Math.exp(-delta * 1.8)).normalize();
    if (cubeGroup.quaternion.angleTo(turnTarget) < 0.025) {
      cubeGroup.quaternion.copy(turnTarget);
      isTurningToFace = false;
      confirmationDeadline = Date.now() + 8000;
      const face = faceDefinitions.find((item) => item.action === pendingAction);
      statusElement.textContent = `CLICK ${face.label.toUpperCase()} AGAIN TO OPEN`;
    }
  } else if (!pendingAction && !isDragging) {
    cubeGroup.rotateOnAxis(rotationAxis, delta * 0.16);
  }

  if (pendingAction && !isTurningToFace && Date.now() > confirmationDeadline) {
    pendingAction = null;
    confirmationDeadline = 0;
    statusElement.textContent = 'MOVE TO EXPLORE';
  }

  cellMeshes.forEach(({ mesh, basePosition, boundaryNormal }) => {
    const phase = basePosition.dot(activeWaveDirection) * 1.45 + elapsed * 1.8;
    const displacement = Math.sin(phase) * 0.11;
    mesh.position.copy(basePosition).addScaledVector(boundaryNormal, displacement);
  });

  faceLabels.forEach((face) => {
    face.sprite.getWorldPosition(projectedPoint);
    worldNormal.copy(face.normal).applyQuaternion(cubeGroup.quaternion);
    toCamera.copy(camera.position).sub(projectedPoint).normalize();
    face.sprite.visible = worldNormal.dot(toCamera) > 0.12;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

setNavigationCollapsed(false);
updateLayout();
window.addEventListener('resize', updateLayout);
animate();