import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({container, backgroundColor : new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();

load();

async function load() {
    const model = await viewer.IFC.loadIfcUrl('./01.ifc');
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.context.renderer.postProduction.active = true;
}

window.ondblclick = () => viewer.IFC.selector.pickIfcItem();
window.onmousemove =() => viewer.IFC.selector.prePickIfcItem();