# glTF Interaction Metadata — Demo

A working proof-of-concept for the GSoC 2026 proposal:

This demo shows that a glTF file can carry all interaction rules for a Three.js scene in its `extras` field. The JavaScript runtime reads everything from the file no animation name is written manually in the code.

---

## What this demonstrates

The scene contains **12 objects** in **3 groups**, each showing a different interaction type from the proposed schema.

| Group | Objects | Interaction | Schema fields used |
|---|---|---|---|
| `cubes` | CubeMain, Cube1–3 | **Hover** (per object) + **grouped click** (fires all animations related to cube at once) | `on_hover_animations`, `on_hover_cursor`, `on_click_animations` |
| `toruses` | TorusMain, Torus1–3 | **Scroll scrub** (full page range) | `on_scroll_mode`, `on_scroll_start`, `on_scroll_end`, `on_scroll_animations` |
| `spheres` | SphereMain, Sphere1–3 | **Click** (fires all 4 at once via group) | `on_click_animations` |

---

## Video Demo
---

https://github.com/user-attachments/assets/f4fba0d2-f85d-4343-b90d-262405c8bc5b

Note: Left Cube and Left Torus have static animations and have gltf_interaction block
---

## Schema

Each interactive object has a `gltf_interaction` block inside its glTF `extras` field.

```json
"extras": {
  "gltf_interaction": {
    "group": "cubes",

    "on_click_animations": [
      { "name": "CubeMain", "loop": false },
      { "name": "CubeH1",   "loop": true  }
    ],

    "on_hover_cursor": "pointer",
    "on_hover_animations": [
      { "name": "CubeH1", "loop": true }
    ],
    "on_hover_out_animations": [
      { "name": "CubeH1", "loop": false }
    ],

    "on_scroll_mode": "scrub",
    "on_scroll_start": 0.0,
    "on_scroll_end": 1.0,
    "on_scroll_animations": [
      { "name": "TorusR1" }
    ]
  }
}
```

**Key rules:**
- `group` — objects sharing a group key fire their click animations together. If absent, the object is isolated.
- `loop` — per animation entry. `true` → plays forever, `false` → plays once and holds last frame.
- Scroll animations have **no `loop` field** their animation time is driven directly by the scroll position.
- `on_scroll_mode` — `"scrub"` ties the animation frame to scroll position; `"trigger"` plays it once on entry.
- The `gltf_interaction` block itself is what marks an object as interactive. Objects without it are ignored.

---

## How the runtime works (`demo.js`)

The loader runs **one traversal** of the scene graph after the file loads. For each node with a `gltf_interaction` block, animations are sorted into five maps:

```
clickMap     { group → AnimationAction[] }   one click fires the whole group
hoverMap     node  → { actions, outActions, cursor }
scrollMap    { group → ScrollEntry[] }       each entry has action + range + mode
meshTagMap   mesh  → { node, group }         maps raycast hit back to its node
nodeGroupMap node  → group
```

After traversal, these maps are never written to again. The scroll listener, hover tick, and click handler all just read from them.

```js
// The entire setup is one traversal
gltf.scene.traverse(node => {
    if (!node.userData?.gltf_interaction) return;
    // sort into clickMap / hoverMap / scrollMap ...
});
```

---


---

- **Hover** cursor over the cubes changes types, hover animation plays
- **Click** Any cube fires all cube animations at once (grouped click)
- **Scroll** the page toruses play their animations to the scroll length/range
- **Click** any sphere — plays that sphere's animation (all spheres share the `"spheres"` group)

---

## Proposal context

The glTF `extras` field is part of the official glTF 2.0 spec and is ignored by all validators, viewers, and renderers. This project proposes a Blender add-on that lets artists declare these interaction rules directly in the Object Properties panel, so the metadata is written automatically on export no manual JSON editing required.

**Proposal:** [Declarative Web Interaction Metadata for glTF — GSoC 2026](https://github.com/DevAryanSin)

