# Third-party notices

`ris-framework` is distributed under the Apache License 2.0 (see `LICENSE` and `NOTICE`). Copyright 2026 Luka Erkapic.

The published library bundles the browser build of [`ris-ktx2`](https://github.com/luka712/ris-ktx2-ts) so a consuming app does not import that package's Node loader. `ris-ktx2` is MIT licensed. Copyright (c) 2026 Luka Erkapic.

That browser build includes the Khronos libktx WebAssembly module (`libktx.js` and the wasm binary embedded in it), produced from [KTX-Software](https://github.com/KhronosGroup/KTX-Software). The Apache License 2.0 text is in `LICENSES/Apache-2.0.txt`.

## Khronos KTX-Software / libktx

Copyright 2010-2024 The Khronos Group Inc. and contributors.

SPDX-License-Identifier: Apache-2.0

https://github.com/KhronosGroup/KTX-Software

Upstream license overview (v4.3.2): https://github.com/KhronosGroup/KTX-Software/blob/v4.3.2/LICENSE.md

KTX-Software bundles other projects, including basis_universal. Those C/C++ sources are not redistributed as source here; they are compiled into the WebAssembly binary that `ris-ktx2` ships and this package bundles.

## Basis Universal

Copyright Binomial LLC.

SPDX-License-Identifier: Apache-2.0

https://github.com/BinomialLLC/basis_universal
