import './style.css'
import "reflect-metadata";

import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import {setupCounter} from './counter.ts'
import {Framework} from './core/Framework.ts';
import {FrameworkConfig} from "./core/FrameworkConfig.ts";
import {TextureSamplerFilteringPreset} from "./core/rendering/enums.ts";
import {
  Color,
  type IFramework,
  type ISampler,
  type ITexture2D,
  Rect,
  SamplerDescriptor,
  SamplerFilter, TextureDescriptor, TextureFormat
} from "./api/index.ts";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

const frameworkConfig = new FrameworkConfig();
frameworkConfig.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
frameworkConfig.textureFiltering = TextureSamplerFilteringPreset.BILINEAR;
const framework : IFramework = new Framework(frameworkConfig);

const rect = new Rect(200, 200, 200, 200);
const texRect = new Rect(500, 200, 200, 200);
const texRect2 = new Rect(200, 500, 200, 200);
const color = Color.blue();
const whiteColor = Color.white();
let tex: ITexture2D;
let tex2 : ITexture2D;
let sampler: ISampler;
framework.addOnLoadContentListener(async () =>
{

  const texDesc = new TextureDescriptor();
  texDesc.generateMipmaps = true;
  texDesc.textureFormat = TextureFormat.RGBA_8_UNORM;

  tex = await framework.content.loadTexture2DAsync("/assets/test.png", texDesc);
  tex2 = await framework.content.loadTexture2DAsync("/assets/cat.jpg", texDesc);
});

framework.addOnInitializedListener(() => {
  const desc = new SamplerDescriptor();
  desc.minFilter = SamplerFilter.NEAREST;
  desc.magFilter = SamplerFilter.NEAREST;
  // desc.label = "Label";
  sampler = framework.graphicsDevice.createSampler(desc);
});

framework.addOnRenderListener(() =>
{
  let spriteBatch = framework.spriteBatch;

  spriteBatch.begin(undefined, sampler);
  spriteBatch.drawRect(rect, color);
  if(tex != null){
    spriteBatch.draw(tex, texRect, whiteColor);
  }
  if(tex2 != null){
    spriteBatch.draw(tex2, texRect2, whiteColor);
  }
  spriteBatch.end();
});

framework.initialize();
framework.renderer.clearColor = Color.lightPink();


// We need to load geometry and create vertex buffer and index buffer from it.
// const geometry = framework.geometryBuilder.quadGeometry();
// const vertexBuffer =
// const indexBuffer =

// Next we need to create unlit pipeline for geometry.

