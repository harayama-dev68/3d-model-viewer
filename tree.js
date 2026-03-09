import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";

const canvas = document.getElementById("viewer");
const dropZone = document.getElementById("drop-zone");
const status = document.getElementById("status");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a10);

const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
camera.position.set(2.4, 1.8, 2.8);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(3, 4, 2);
scene.add(dirLight);

const grid = new THREE.GridHelper(10, 20, 0x4a6299, 0x27314a);
grid.position.y = -0.001;
scene.add(grid);

let loadedObject = null;

function setStatus(text) {
  status.textContent = text;
}

function clearLoadedObject() {
  if (!loadedObject) return;
  scene.remove(loadedObject);
  loadedObject.traverse?.((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose?.());
      } else {
        obj.material.dispose?.();
      }
    }
  });
  loadedObject = null;
}

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;

  controls.target.copy(center);
  camera.near = Math.max(maxDim / 1000, 0.01);
  camera.far = Math.max(maxDim * 100, 100);

  const fitHeightDistance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.6;

  const direction = new THREE.Vector3(1, 0.7, 1).normalize();
  camera.position.copy(center).add(direction.multiplyScalar(distance));
  camera.updateProjectionMatrix();
  controls.update();
}

function defaultMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xb9c9ef, metalness: 0.1, roughness: 0.75 });
}

async function loadModelFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) throw new Error("拡張子が判別できません。");

  const dataUrl = URL.createObjectURL(file);

  try {
    switch (extension) {
      case "gltf":
      case "glb": {
        const gltf = await new GLTFLoader().loadAsync(dataUrl);
        return gltf.scene;
      }
      case "obj":
        return await new OBJLoader().loadAsync(dataUrl);
      case "fbx":
        return await new FBXLoader().loadAsync(dataUrl);
      case "stl": {
        const geometry = await new STLLoader().loadAsync(dataUrl);
        return new THREE.Mesh(geometry, defaultMaterial());
      }
      case "ply": {
        const geometry = await new PLYLoader().loadAsync(dataUrl);
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry, defaultMaterial());
      }
      case "3mf": {
        return await new ThreeMFLoader().loadAsync(dataUrl);
      }
      case "dae": {
        const collada = await new ColladaLoader().loadAsync(dataUrl);
        return collada.scene;
      }
      default:
        throw new Error(`未対応の形式です: .${extension}`);
    }
  } finally {
    URL.revokeObjectURL(dataUrl);
  }
}

function onDrop(event) {
  event.preventDefault();
  dropZone.classList.remove("drag-over");

  const [file] = event.dataTransfer.files;
  if (!file) return;

  setStatus(`読み込み中: ${file.name}`);

  loadModelFile(file)
    .then((object) => {
      clearLoadedObject();
      loadedObject = object;
      scene.add(loadedObject);
      frameObject(loadedObject);
      setStatus(`表示中: ${file.name}`);
    })
    .catch((error) => {
      console.error(error);
      setStatus(`読み込み失敗: ${error.message}`);
    });
}

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", onDrop);

window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = canvas;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
