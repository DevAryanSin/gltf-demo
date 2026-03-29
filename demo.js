import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141419);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 4);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Populated once during traversal. All interaction handlers read from these.

const clickMap     = {};        // { group: AnimationAction[] }   — click fires the whole group
const hoverMap     = new Map(); // node → { actions, outActions, cursor } — per-node
const scrollMap    = {};        // { group: ScrollEntry[] }        — each entry holds action + range
const meshTagMap   = new Map(); // mesh → { node, group }          — maps raycast hit back to its node
const nodeGroupMap = new Map(); // node → group                    — used by click to find the group key


let hoveredNode = null;
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2(-9999, -9999); 
const clock     = new THREE.Clock();
let mixer;


new GLTFLoader().load('./demo.gltf', (gltf) => {
    scene.add(gltf.scene);

    // interactions will play 
    const actionsByName = {};
    if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.play();
            action.paused = true;
            actionsByName[clip.name] = action;
        });
    }

    // Converts a [{name, loop}] schema array into configured AnimationActions.
    const resolve = (list) => {
        if (!Array.isArray(list)) return [];
        return list.flatMap(({ name, loop }) => {
            const action = actionsByName[name];
            if (!action) return [];
            if (loop) {
                action.setLoop(THREE.LoopRepeat, Infinity);
            } else {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
            }
            return [action];
        });
    };

    // glTF traversal 
    // objects are sorted into the maps above
    gltf.scene.traverse(node => {
        if (!node.userData?.gltf_interaction) return;

        const idx   = node.userData.gltf_interaction;
        const group = idx.group || node.uuid; 

        // Scroll 
        if (Array.isArray(idx.on_scroll_animations) && idx.on_scroll_animations.length) {
            const start = idx.on_scroll_start ?? 0.0;
            const end   = idx.on_scroll_end   ?? 1.0;
            const mode  = idx.on_scroll_mode  || 'scrub';
            if (!scrollMap[group]) scrollMap[group] = [];
            idx.on_scroll_animations.forEach(({ name }) => {
                const action = actionsByName[name];
                if (action) scrollMap[group].push({ action, start, end, mode, triggered: false });
            });
        }

        // Click 
        const clickActions = resolve(idx.on_click_animations);
        if (clickActions.length) {
            if (!clickMap[group]) clickMap[group] = [];
            clickMap[group].push(...clickActions);
        }

        // Hover and on_hover_cursor
        const hoverActions    = resolve(idx.on_hover_animations);
        const hoverOutActions = resolve(idx.on_hover_out_animations);
        const cursor          = idx.on_hover_cursor || 'pointer';
        if (hoverActions.length || hoverOutActions.length) {
            hoverMap.set(node, { actions: hoverActions, outActions: hoverOutActions, cursor });
        }

        // Register meshes for raycasting
        if (clickActions.length || hoverActions.length) {
            nodeGroupMap.set(node, group);
            node.traverse(child => {
                if (child.isMesh) meshTagMap.set(child, { node, group });
            });
        }
    });


}, undefined, console.error);


// Scroll with scrub or trigger

window.addEventListener('scroll', () => {
    const scrollTop    = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    if (scrollHeight <= clientHeight) return;

    const ratio = scrollTop / (scrollHeight - clientHeight); 

    Object.values(scrollMap).forEach((entries) => {
        entries.forEach((entry) => {
            const { action, start, end, mode } = entry;
            const inRange = ratio >= start && ratio <= end;
            // Define scrub and trigger modes
            if (mode === 'scrub') {
                const t = Math.max(0, Math.min(1, (ratio - start) / (end - start)));
                action.time   = t * action.getClip().duration;
                action.paused = true;
            } else if (mode === 'trigger') {
                if (inRange && !entry.triggered) {
                    action.reset().setLoop(THREE.LoopOnce).play();
                    entry.triggered = true;
                } else if (!inRange) {
                    entry.triggered = false;
                }
            }
        });
    });
});


// Hover and click

const canvas = renderer.domElement;

canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
    pointer.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
});

canvas.addEventListener('pointerleave', () => {
    if (hoveredNode) {
        hoverMap.get(hoveredNode)?.outActions.forEach(a => a.reset().play());
    }
    hoveredNode = null;
    document.body.style.cursor = 'auto';
    pointer.set(-9999, -9999);
});

let downPos = null;
canvas.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const dx = e.clientX - downPos.x, dy = e.clientY - downPos.y;
    if (dx * dx + dy * dy < 25 && hoveredNode) {
        const group = nodeGroupMap.get(hoveredNode);
        const groupActions = group ? (clickMap[group] ?? []) : [];
        groupActions.forEach(a => a.reset().play());
    }
    downPos = null;
});

function tickHover() {
    raycaster.setFromCamera(pointer, camera);
    const meshes = [...meshTagMap.keys()];
    const hit = raycaster.intersectObjects(meshes, true)[0];
    const hitNode = hit ? meshTagMap.get(hit.object)?.node ?? null : null;

    if (hitNode !== hoveredNode) {
        if (hoveredNode) hoverMap.get(hoveredNode)?.outActions.forEach(a => a.reset().play());
        if (hitNode)     hoverMap.get(hitNode)?.actions.forEach(a => a.reset().play());
        hoveredNode = hitNode;
        const hoverData = hitNode ? hoverMap.get(hitNode) : null;
        const cursor = hoverData ? hoverData.cursor : 'auto';
        document.body.style.cursor = cursor;
        renderer.domElement.style.cursor = cursor;
    }
}


//Render Loop

function animate() {
    requestAnimationFrame(animate);
    tickHover();
    if (mixer) mixer.update(clock.getDelta()); 
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
