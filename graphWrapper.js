import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { World } from './graphEditor/world.js';
import { Graph } from './graphEditor/math/graph.js';
import { GraphEditor } from './graphEditor/graphEditor.js';
import { ViewPort } from './graphEditor/viewport.js';

export class GraphWrapper {
  constructor() {
    const PLANESIZE = 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.precision = 'highp';
    this.renderer.powerPreference = 'high-performance';
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.loader = new GLTFLoader();
    this.init(PLANESIZE);
  }

  async init(PLANESIZE) {
    await this.load(PLANESIZE);
  }

  async load(PLANESIZE) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x22aa55);
    let fov = 45;
    let aspect = 2;
    let near = 0.1;
    let far = 100000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this.camera.position.set(0, 600, 0);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    const planeGeometry = new THREE.PlaneGeometry(PLANESIZE, PLANESIZE);
    planeGeometry.translate(PLANESIZE / 2, PLANESIZE / 2, 0);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x22aa55 });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.position.set(-PLANESIZE / 2, 0, PLANESIZE / 2);
    this.plane.rotateX(-Math.PI * 0.5);
    this.plane.updateMatrixWorld();
    this.plane.visible = false;
    this.scene.add(this.plane);
    this.controls = null;
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
    document.body.appendChild(this.stats.dom);
    this.stats2 = new Stats();
    this.stats2.showPanel(1);
    this.stats2.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
    document.body.appendChild(this.stats2.dom);
    this.stats3 = new Stats();
    this.stats3.showPanel(2);
    this.stats3.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
    document.body.appendChild(this.stats3.dom);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';

    document.body.appendChild(this.labelRenderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    this.renderer.render(this.scene, this.camera);
    const model = await this.loader.loadAsync('models/tree.glb');
    model.scene.scale.set(30, 30, 30);
    this.tree = model.scene;
    const trafficLightModel = await this.loader.loadAsync('models/trafficLight.glb');
    trafficLightModel.scene.scale.set(10, 10, 10);
    this.trafficLight = trafficLightModel.scene;
    const graphString = localStorage.getItem('graph');
    const graphInfo = graphString ? JSON.parse(graphString) : null;

    this.graph = graphInfo ? Graph.load(graphInfo, this.scene) : new Graph([], [], this.scene);

    this.viewport = new ViewPort(this.renderer.domElement, this.camera, this.plane, PLANESIZE);
    this.models = { trafficLight: this.trafficLight, tree: this.tree };
    this.world = new World(this.graph, this.models, this.viewport, this.scene);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.graphEditor = new GraphEditor(
      this.scene,
      this.plane,
      this.camera,
      this.renderer,
      this.graph,
      this.viewport,
      this.controls.enabled,
    );
    window.graph = this.graph;
    window.viewport = this.viewport;
    window.graphEditor = this.graphEditor;
    window.renderer = this.renderer;
    window.world = this.world;

    this.showEditor = false;

    this.disposeBtn = document.getElementById('disposeBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.editorBtn = document.getElementById('editorBtn');

    this.disposeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.graphEditor.dispose();
    });
    this.saveBtn.addEventListener('click', () => this.graphEditor.save());
    this.editorBtn.addEventListener('click', () => this.toggleEditor());

    this.oldGraphHash = this.graph.hash();
    this.animate();
  }

  toggleEditor() {
    if (this.showEditor) {
      this.saveBtn.classList.add('hidden');
      this.disposeBtn.classList.add('hidden');
      this.editorBtn.innerHTML = 'Editor';
      this.showEditor = false;
      this.controls.enabled = true;
      this.graphEditor.toggleEnabled(this.showEditor);
    } else {
      this.saveBtn.classList.remove('hidden');
      this.disposeBtn.classList.remove('hidden');
      this.editorBtn.innerHTML = 'Close Editor';
      this.showEditor = true;
      this.controls.enabled = false;
      this.camera.position.set(0, 100, 0);
      this.camera.lookAt(0, 0, 0);
      this.graphEditor.toggleEnabled(this.showEditor);
    }
  }

  dispose() {
    this.scene.traverse(function (o) {
      if (o.geometry) {
        o.geometry.dispose();
      }

      if (o.material) {
        if (o.material.length) {
          for (let i = 0; i < o.material.length; ++i) {
            o.material[i].dispose();
          }
        } else {
          o.material.dispose();
        }
      }
    });
  }

  animate() {
    this.dispose();
    this.scene.children.length = 0;
    this.scene.add(this.ambientLight);

    this.stats.update();
    this.stats2.update();
    this.stats3.update();
    this.viewport.update();
    if (this.graph.hash() !== this.oldGraphHash) {
      this.world.generate();
      this.oldGraphHash = this.graph.hash();
    }

    let zoomFactor = (this.viewport.zoom / 100) * 0.5;
    this.world.draw(this.scene, zoomFactor);
    if (this.showEditor) {
      this.graphEditor.display(zoomFactor);
    }
    if (this.controls.enabled) {
      this.controls.update();
    }

    this.labelRenderer.render(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}
