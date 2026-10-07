# Datita digital de Paco

Directorio de herramientas de diseño experimental, con búsqueda por técnicas, filtros y un shader interactivo compartido.

## Publicación en GitHub Pages

La web es estática. El workflow `.github/workflows/pages.yml` genera el HTML con Python y publica únicamente `dist/` cada vez que se actualiza la rama `main`.

En Settings → Pages, seleccionar **GitHub Actions** como fuente de publicación. El repositorio debe ser público para usar Pages con una cuenta GitHub Free.

Los enlaces de imágenes, fuentes y módulos son relativos, por lo que funcionan tanto en un dominio raíz como en la ruta de un repositorio.

## Editar la colección

1. Editar `dist/tools.json` y guardar las imágenes en `dist/images/`.
2. Ejecutar `python3 scripts/build.py`.
3. Guardar los cambios en `main` para publicar.

El comportamiento y los estilos están en `dist/app.mjs`, `dist/filtering.mjs`, `dist/filter-menus.mjs` y `dist/style.css`.

## Shader

El shader usa Shaders 4.0.0. Su código fuente y la licencia de la biblioteca están en `scripts/shader/`. El módulo ya compilado se incluye en `dist/paco-shader.mjs`.

Para recompilarlo:

```sh
cd scripts/shader
npm install
npm run build
```

El navegador necesita WebGPU para mostrar el shader. La web y sus filtros siguen funcionando sin él.
