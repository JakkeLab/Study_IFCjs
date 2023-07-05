import { AmbientLight, AxesHelper, DirectionalLight, GridHelper, PerspectiveCamera, Raycaster, Scene, WebGLRenderer, Vector2, MeshLambertMaterial } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IFCLoader } from "web-ifc-three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
import { IFCBUILDING,
         IFCBUILDINGSTOREY } from "web-ifc";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 2);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

//Sets up the renderer, fetching the canvas of the HTML
const canvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
controls.update();
renderer.render(scene, camera);
requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
(size.width = window.innerWidth), (size.height = window.innerHeight);
camera.aspect = size.width / size.height;
camera.updateProjectionMatrix();
renderer.setSize(size.width, size.height);
});

// IFC loading
const loader = new IFCLoader();
loader.ifcManager.setWasmPath("wasm/");

let model;

const input = document.getElementById('file-input');
input.addEventListener('change', async () => {
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    model = await loader.loadAsync(url);
    scene.add(model);
    await editFloorName();
});

async function editFloorName() {
    const storeysIds = await loader.ifcManager.getAllItemsOfType(model.modelID, IFCBUILDINGSTOREY, false);
    const firstStoreyId = storeysIds[0]
    const storey = await loader.ifcManager.getItemProperties(model.modelID, firstStoreyId);
    console.log(storey);

    const result = prompt("Introduce the new name for the storey.");
    storey.LongName.value = result;
    loader.ifcManager.ifcAPI.WriteLine(model.modelID, storey);

    const data = await loader.ifcManager.ifcAPI.ExportFileAsIFC(model.modelID);
    const blob = new Blob([data]);
    const file = new File([blob], "modified.ifc");

    const link = document.createElement('a');
    link.download = 'modified.ifc';
    link.href = URL.createObjectURL(file);
    document.body.appendChild(link);
    link.click();

    link.remove();
}