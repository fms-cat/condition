# Condition

"Condition" by FMS_Cat
A 64KB WebGL Intro
Appeared in Revision 2021, PC 64KB Intro Compo

[See the demo!](./pages/index.html)

![Condition](./pages/condition.png)

## `#define COMPROMISE 1`

I'm so embarrassed that this project contains so many dumb strategies about size / performance optimization because deadline matters.
You totally shouldn't reference this project to do something by yourself.

## Build

- You will need these stuff in your PATH:
  - [`shader_minifier.exe`](https://github.com/laurentlb/Shader_Minifier)
  - [`jsexe.exe`](https://www.pouet.net/)

```sh
yarn
yarn build
```

## Keyboard Controls

Only works in development build

- `Escape`: Panic
- `Space`: Play / Pause
- `Left`: Rewind 8 beats
- `Right`: Skip 8 beats

## Minification

[terser's](https://terser.org/docs/api-reference.html) mangler is spicy
you'll die instantly if you access to object properties using a string identifier
see `webpack.config.js` and `src/automaton-fxs/fxDefinitions.ts` for the funny jokes

jsexe is good
note that it cannot parse nowadays ecmascript though

shader minifier is way too spicy so I made a [separate document](./shader-minifier-tips.md)

libopus is cheating
