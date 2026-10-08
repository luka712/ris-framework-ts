# Changelog

## 0.1.0

- Initial release setup. `development` publishes a prerelease on the npm `next` tag. `main` publishes this version on `latest`.
- The package entry is compiled JavaScript and declarations in `dist`. Consumers import `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and the types formerly published as `ris-framework-api` from `ris-framework` without compiling this repository. Built-in shaders and the browser KTX2 loader are included in that JavaScript.
- `ris-framework-api` is merged into this package under `src/api`. `ris-ktx2` is the only KTX dependency and also provides the KTX2 types; `ris-ktx2-api` is no longer used.
- `FrameworkConfiguration` adds `alpha` and `powerPreference`. `PowerPreferenceType` is exported from the package entry.
- The package license is Apache License 2.0. Copyright 2026 Luka Erkapic.
