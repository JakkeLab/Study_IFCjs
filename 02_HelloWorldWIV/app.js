import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCFURNISHINGELEMENT,
    IFCDOOR,
    IFCWINDOW,
    IFCPLATE,
    IFCMEMBER
} from 'web-ifc';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({container, backgroundColor : new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();

const scene = viewer.context.getScene();
const pickable = viewer.context.items.pickableIfcModels;

loadIfc("./01.ifc");
let model;

async function loadIfc(url) {
    model = await viewer.IFC.loadIfcUrl(url);
    model.removeFromParent();
    togglePickable(model, false);
    
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;
    await setupAllCategories();

    // const project = await viewer.IFC.getSpatialStructure(model.modelID);
    // console.log(project);
    // createTreeMenu(project);
}

window.onmousemove = () => {
    viewer.IFC.selector.prePickIfcItem();
}

window.ondblclick = () => {
    const result = viewer.context.castRayIfc();
    console.log(result);
    if(result === null) return;
    
    const index = result.faceIndex;
    const subset = result.object;
    const id = viewer.IFC.loader.ifcManager.getExpressId(model.geometry, index);
    viewer.IFC.loader.ifcManager.removeFromSubset(
        subset.modelID,
        [id],
        subset.userData.cagetegory
    );

    updatePostproduction();
}


const categories = {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCFURNISHINGELEMENT,
    IFCDOOR,
    IFCWINDOW,
    IFCPLATE,
    IFCMEMBER
}

//Get the name of each categories
function getName(category) {
    const names = Object.keys(categories);
    return names.find(name => categories[name] === category);
}

// Gets the IDs of all the items of a specific category
async function getAll(category) {
    return viewer.IFC.loader.ifcManager.getAllItemsOfType(model.modelID, category);
}

const subsets = {};

async function setupAllCategories() {
    const allCategories = Object.values(categories);
    for(const cagetegory of allCategories) {
        setupCategory(cagetegory);
    }
}

async function setupCategory(category) {
    const subset = await newSubsetOfType(category);
    subset.userData.cagetegory = category.toString();
    subsets[category] = subset;
    togglePickable(subset, false);
    setupCheckbox(category);
}

function setupCheckbox(category) {
    const name = getName(category);
    const checkbox = document.getElementById(name);
    checkbox.addEventListener('change', () => {
        const subset = subsets[category]
        if(checkbox.checked) {
            scene.add(subset);
            togglePickable(subset, true);
        }
        else  {
            subset.removeFromParent();
            togglePickable(subset, false);
        }

        updatePostproduction();

    });
}

function updatePostproduction() {
    viewer.context.renderer.postProduction.update();
}

// Creates a new subset containing all elements of a category
async function newSubsetOfType(category) {
    const ids = await getAll(category);
    return viewer.IFC.loader.ifcManager.createSubset({
        modelID: 0,
        scene,
        ids,
        removePrevious: true,
        customID: category.toString()
    });
}

function togglePickable(mesh, isPickable) {
    const pickableModels = viewer.context.items.pickableIfcModels;

    if(isPickable) {
        pickableModels.push(mesh);
    } else {
        const index = pickable.indexOf(mesh);
        pickableModels.splice(index, 1);
    }
}

// // Spatial tree

// function createTreeMenu(ifcProject) {
//     const root = document.getElementById("tree-root");
//     removeAllChildren(root);
//     const ifcProjectNode = createNestedChild(root, ifcProject);
//     for(const child of ifcProject.children) {
//         constructTreeMenuNode(ifcProjectNode, child);
//     }

// }

// function constructTreeMenuNode(parent, node) {
//     const children = node.children;
//     if(children.length === 0) {
//         createSimpleChild(parent, node);
//         return;
//     }
//     const nodeElement = createNestedChild(parent, node);
//     for(const child of children) {
//         constructTreeMenuNode(nodeElement, child);
//     }
// }

// function createSimpleChild(parent, node) {
//     const content = nodeToString(node)
//     const childNode = document.createElement('li');
//     childNode.classList.add('leaf-node');
//     childNode.textContent = content;
//     parent.appendChild(childNode);

//     childNode.onmouseenter = () => {
//         viewer.IFC.selector.prepickIfcItemsByID(model.modelID, [node.expressID]);
//     }
// }

// function createNestedChild(parent, node) {
//     const content = nodeToString(node);
//     const root = document.createElement('li');
//     createTitle(root, content);
//     const childrenContainer = document.createElement('ul');
//     childrenContainer.classList.add('nested');
//     root.appendChild(childrenContainer);
//     parent.appendChild(root);
//     return childrenContainer;
// }

// function createTitle(parent, content) {
//     const title = document.createElement('span');
//     title.classList.add('caret');
//     title.onclick = () => {
//         title.parentElement.querySelector('.nested').classList.toggle('active');
//         title.classList.toggle('caret-down');
//     }

//     title.textContent = content;
//     parent.appendChild(title);
// }

// function nodeToString(node) {
//     return `${node.type} - ${node.expressID}`;
// }

// function removeAllChildren(element) {
//     while(element.firstChild) {
//         element.removeChild(element.firstChild);
//     }  
// }

// //Tree from w3school
// const toggler = document.getElementsByClassName("caret");
// let i;

// for (i = 0; i < toggler.length; i++) {
//   toggler[i].addEventListener("click", function() {
//     this.parentElement.querySelector(".nested").classList.toggle("active");
//     this.classList.toggle("caret-down");
//   });
// }

// // //Hightlight Object
// // window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

// // window.ondblclick = async () => {
// //     const found = await viewer.IFC.selector.pickIfcItem();
// //     const result = await viewer.IFC.loader.ifcManager.getItemProperties(found.modelID, found.id);
// //     console.log(result);
// // }