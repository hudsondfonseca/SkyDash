# Sky Dash ship sprites

Each file is an individual transparent SVG asset authored as crisp-edged pixel art; no reference image is embedded or used as a full sprite.

| Category | Files | Native canvas |
|---|---|---|
| Common enemies | `enemies/{scout,bomber,kamikaze,defender,sniper,drone}.svg` | 128 × 96 px, viewBox `0 0 128 96` |
| Sub-bosses | `subbosses/{deflector,interceptor,scythe}.svg` | 128 × 96 px, viewBox `0 0 128 96` |
| Bosses | `bosses/{dreadnought,carrier,destroyer}.svg` | 128 × 96 px, viewBox `0 0 128 96` |

`sprite-renderer.js` maps each type to its corresponding asset and scales it into the existing entity width/height. Collision boxes and combat attributes remain controlled by `entities.js`. Engine flames animate in Canvas behind each sprite.
