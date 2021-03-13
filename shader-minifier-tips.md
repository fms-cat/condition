# shader-minifier-tips.md

[shader_minifier](https://github.com/laurentlb/Shader_Minifier) is good. The behavior is kinda [jej](https://www.youtube.com/watch?v=Wjhhs6GcUx0) though.
This tips should cover all the tips you have to care when you are using shader_minifier.

## Precisions

It will be handled automatically in shader-minifier-loader.

It doesn't accept `precision <precision> <type>;` for some reasons.
There are a workaround that put `//[` and `//]` around the line (shoutouts to [davidar](https://github.com/laurentlb/Shader_Minifier/issues/8#issuecomment-401582088)):

```glsl
//[
precision highp float;
//]
```

### Error Examples

```
Parse error: Error in <path>: Ln: 5 Col: 17
precision highp float;
                ^
Expecting: '('
```

### Issues

- https://github.com/laurentlb/Shader_Minifier/issues/8

(issue)

## Preprocessor Branches

Preprocessor branching often triggers issues on minified output. Use with cares.

The branch below should be accepted without problems:

```glsl
vec3 func() {
  vec3 ret;
#ifdef CONDITION
  ret = vec3( 1.0 );
#else
  ret = vec3( 0.0 );
#endif
  return ret;
}
```

For more details, see these issues below.

### Error Examples

```
ERROR: 0:9: 'r' : undeclared identifier
ERROR: 0:9: 'constructor' : not enough data provided for construction
```

```
ERROR: 0:30: 'm' : variable expected
ERROR: 0:30: 'return' : function return is not matching type:
```

```
ERROR: 0:25: 'ifdef' : unexpected end of file found in conditional block
```

### Issues

- https://github.com/laurentlb/Shader_Minifier/issues/27
- https://github.com/laurentlb/Shader_Minifier/issues/28

## Overloading

I don't think overloading is not working properly for most of cases.

### Error Examples

```
ERROR: 0:11: 't' : no matching overloaded function found
ERROR: 0:11: '=' : dimension mismatch
ERROR: 0:11: 'assign' : cannot convert from 'highp 3-component vector of float' to 'highp float'
```

## Variable Declarations

Variable declarations with same types (especially, uniforms) should be done at once.

```glsl
// uh
uniform float uHoge;
uniform float uFuga;
uniform vec3 uFoo;
uniform float uBar;
// -> uniform float uHoge,uFuga;uniform vec3 uFoo;uniform float uBar;

// better
uniform float uHoge;
uniform float uFuga;
uniform float uBar;
uniform vec3 uFoo;
// -> uniform float uHoge,uFuga,uBar;uniform vec3 uFoo;
```

## Preprocessor Constants

Defining constants should be performed using `const` rather than `#define`.

```glsl
// no
const float PI = 3.14159265;
const float TAU = 6.283185307;
// -> const float PI = 3.14159265;
//    const float TAU = 6.283185307;

// preferable
const float PI = 3.1415926535;
const float TAU = 6.283185307;
// -> const float e=3.14159,s=6.28319;
```

You might want to also avoid macros with arguments for the same reason.
