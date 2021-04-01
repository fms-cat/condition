import { LightEntity } from '../entities/LightEntity';
import { Material } from '../heck/Material';

export function setLightUniforms(
  material: Material,
  lights: LightEntity[],
  frameCount: number,
): void {
  const activeLights = lights.filter( ( light ) => (
    frameCount === light.lastUpdateFrame
  ) );

  material.addUniform(
    'lightCount',
    '1i',
    activeLights.length,
  );

  material.addUniformVector(
    'lightNearFar',
    '2fv',
    activeLights.map( ( light ) => [ light.camera.near, light.camera.far ] ).flat(),
  );

  material.addUniformVector(
    'lightPos',
    '3fv',
    activeLights.map( ( light ) => light.globalTransformCache.position.elements ).flat(),
  );

  material.addUniformVector(
    'lightColor',
    '3fv',
    activeLights.map( ( light ) => light.color ).flat(),
  );

  material.addUniformVector(
    'lightParams',
    '4fv',
    activeLights.map( ( light ) => [ light.spotness, 0.0, 0.0, 0.0 ] ).flat(),
  );

  material.addUniformMatrixVector(
    'lightPV',
    'Matrix4fv',
    activeLights.map( ( light ) => (
      light.camera.projectionMatrix.multiply(
        light.globalTransformCache.matrix.inverse!
      ).elements
    ) ).flat(),
  );

  material.addUniformTextureArray(
    'samplerShadow',
    activeLights.map( ( light ) => light.shadowMap.texture ),
  );
}
