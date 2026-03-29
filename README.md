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

## Proposed Schema

Each interactive object has a `gltf_interaction` block inside its glTF `extras` field.

```json
"nodes":[
		{
			"extras":{
				"gltf_interaction":{
					"group":"cubes",
					"on_hover_cursor":"pointer",
					
					"on_click_animations":[
						{"name":"CubeH3","loop":false}
					]
				}
			},
			"mesh":0,
			"name":"Cube3",
			"translation":[
				-1.5519123077392578,
				0,
				0
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"cubes",
					"on_hover_cursor":"pointer",
					"on_hover_animations":[
						{"name":"CubeH2","loop":false}
					],
					"on_click_animations":[
						{"name":"CubeH2","loop":false}
					]
				}
			},
			"mesh":1,
			"name":"Cube2",
			"translation":[
				1.3801028728485107,
				-0.08543217182159424,
				0
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"cubes",
					"on_hover_cursor":"pointer",
					"on_click_animations":[
						{"name":"CubeMain","loop":false}
					]
				}
			},
			"mesh":2,
			"name":"CubeMain",
			"translation":[
				-4.614233016967773,
				0,
				0
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"cubes",
					"on_hover_cursor":"pointer",
					"on_hover_animations":[
						{"name":"CubeH1","loop":false}
					],
					"on_click_animations":[
						{"name":"CubeH1","loop":false}
					]
				}
			},
			"mesh":3,
			"name":"Cube1",
			"translation":[
				4.365303993225098,
				0,
				0
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"toruses",
					"on_scroll_mode":"scrub",
					"on_scroll_start":0.0,
					"on_scroll_end":1.0,
					"on_scroll_animations":[
						{"name":"TorusR1","loop":false}
					]
				}
			},
			"mesh":4,
			"name":"Torus1",
			"translation":[
				-1.5519123077392578,
				0,
				4.058365821838379
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"toruses",
					"on_scroll_mode":"scrub",
					"on_scroll_start":0.0,
					"on_scroll_end":1.0,
					"on_scroll_animations":[
						{"name":"TorusMain","loop":false}
					]
				}
			},
			"mesh":5,
			"name":"TorusMain",
			"translation":[
				-4.912131309509277,
				0,
				4.058365821838379
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"toruses",
					"on_scroll_mode":"scrub",
					"on_scroll_start":0.0,
					"on_scroll_end":1.0,
					"on_scroll_animations":[
						{"name":"TorusR2","loop":false}
					]
				}
			},
			"mesh":6,
			"name":"Torus2",
			"translation":[
				1.6511058807373047,
				0,
				4.058365821838379
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"toruses",
					"on_scroll_mode":"scrub",
					"on_scroll_start":0.0,
					"on_scroll_end":1.0,
					"on_scroll_animations":[
						{"name":"TorusR3","loop":false}
					]
				}
			},
			"mesh":7,
			"name":"Torus3",
			"translation":[
				4.488363265991211,
				0,
				4.058365821838379
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"spheres",
					"on_click_animations":[
						{"name":"SMain","loop":false}
					]
				}
			},
			"mesh":8,
			"name":"SphereMain",
			"translation":[
				-5.085437774658203,
				0,
				8.45125961303711
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"spheres",
					"on_click_animations":[
						{"name":"S1","loop":false}
					]
				}
			},
			"mesh":9,
			"name":"Sphere1",
			"translation":[
				-1.4914898872375488,
				0,
				8.45125961303711
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"spheres",
					"on_click_animations":[
						{"name":"S2","loop":false}
					]
				}
			},
			"mesh":10,
			"name":"Sphere2",
			"translation":[
				1.7400072813034058,
				0,
				8.45125961303711
			]
		},
		{
			"extras":{
				"gltf_interaction":{
					"group":"spheres",
					"on_click_animations":[
						{"name":"S3","loop":false}
					]
				}
			},
			"mesh":11,
			"name":"Sphere3",
			"translation":[
				4.582424640655518,
				0,
				8.45125961303711
			]
		}
	],
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

