const float PI = 3.14159265359;
const float EPSILON = 1E-3;

float doShadowMapping(
  vec3 L, // MUST NOT be normalized
  vec3 N, // have to be normalized
  vec4 tex,
  vec2 lightP, // lightPV * vec4( isect.position, 1.0 ), then its xy / w
  vec2 lightNearFar,
  float spotness
) {
  float depth = clamp( ( length( L ) - lightNearFar.x ) / ( lightNearFar.y - lightNearFar.x ), 0.0, 1.0 ); // linearstep

  L = normalize( L );
  float NdotL = clamp( dot( N, L ), EPSILON, 1.0 );

  float shadow = mix(
    1.0,
    smoothstep( 1.0, 0.5, length( lightP ) ),
    spotness
  );

  float bias = 0.0001 + 0.0001 * ( 1.0 - NdotL );
  depth -= bias;

  float variance = clamp( tex.y - tex.x * tex.x, 0.0, 1.0 );
  float md = depth - tex.x;
  float p = variance / ( variance + md * md );
  p = clamp( ( p - 0.2 ) / 0.8, 0.0, 1.0 ); // linearstep

  shadow *= mix(
    md < 0.0 ? 1.0 : p,
    1.0,
    smoothstep( 0.8, 1.0, max( abs( lightP.x ), abs( lightP.y ) ) ) // edgeclip
  );

  return shadow;
}

#pragma glslify: export(doShadowMapping)
