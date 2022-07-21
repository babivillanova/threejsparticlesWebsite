import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertexParticles.glsl";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { GUI } from 'dat.gui'
// import { AberrationShader } from './AberrationShader.js'

import forma from '../shape2.glb'  


export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1); 
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
   
    this.loader = new GLTFLoader();
    // this.dacroLoader = new DRACOLoader();
    // this.dracoLoader.setDecoderPath('../node_modules/three/examples/js/libs/draco/gltf/');
    
    // this.loader.setDRACOLoader(this.dracoLoader);
    this.container.appendChild(this.renderer.domElement);
   
  
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 20);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.loader.load(forma, (gltf) => {
      this.geometry = gltf.scene.children[0].geometry;
      this.geometry.center();

      //this.settings();
      this.addObjects();
      this.initpost();
      this.resize();
      this.setupResize();
      this.render();

    })
    
   
    
  }


  initpost(){
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.87, 0.01);

    


    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
  

    // this.effect1 = new ShaderPass(AberrationShader);
    // this.composer.addPass(this.effect1);
    this.composer.addPass(this.bloomPass);

  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      bloomThreshold: 0.2,
      bloomStrength: 3.5,
      bloomRadius: 0.15,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "bloomThreshold", 0.2, 1.4, 0.001);
    this.gui.add(this.settings, "bloomStrength", 0, 10, 0.01);
    this.gui.add(this.settings, "bloomRadius", 0, 10, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uColor1:{ value: new THREE.Color(0x612574) },
        uColor2:{ value: new THREE.Color(0x293583) },
        uColor3:{ value: new THREE.Color(0x1954ec) },
        resolution: { value: new THREE.Vector4() }
      },
      // wireframe: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,

      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.number = this.geometry.attributes.position.array.length;

    
    let randoms = new Float32Array(this.number/3)
    
    let colorRandoms = new Float32Array(this.number/3)

    for (let i = 0; i < this.number/3; i++) {
      randoms.set([Math.random()],i);
      colorRandoms.set([Math.random()],i);
    }
 
    
    this.geometry.setAttribute('randoms', new THREE.BufferAttribute(randoms, 1));
    this.geometry.setAttribute('colorRandoms', new THREE.BufferAttribute(colorRandoms, 1));

   
    // this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10);

    this.forma = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.forma);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    this.bloomPass.threshold = this.settings.bloomThreshold;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.radius = this.settings.bloomRadius;


    this.forma.rotation.y = - this.time/20;
    // this.forma.rotation.x = - this.time/20;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById("container")
});
