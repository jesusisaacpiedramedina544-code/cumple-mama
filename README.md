# Feliz cumpleaños mamá — regalo interactivo

Esta versión está pensada para celular y navegador.

## Qué hace

- Muestra un corazón 3D con partículas.
- Se puede girar con el dedo en la pantalla.
- Al acumular 3 vueltas aparece el mensaje:
  “Feliz cumpleaños mamá, Te amo mucho!!!”
- El fondo se desenfoca para resaltar las letras.
- Aparecen confeti y fuegos artificiales detrás del texto.

## Archivos

- `index.html`
- `style.css`
- `script.js`
- `manifest.json`
- `service-worker.js`
- `icon.svg`

## Cómo probarlo en PC

1. Abre la carpeta en VS Code.
2. Usa la extensión Live Server.
3. Abre `index.html`.
4. Arrastra el corazón con el mouse hasta darle 3 vueltas.

## Cómo pasarlo al celular

Opción recomendada:
1. Sube la carpeta a GitHub Pages, Netlify o Vercel.
2. Abre el enlace desde el celular de tu mamá.
3. En Chrome o Safari, usa “Agregar a pantalla de inicio”.

Nota importante:
Un archivo `.exe` no funciona en celular. Para celular conviene usarlo como página web instalable o PWA.

## Importante

La animación usa Three.js desde CDN, por lo que necesita internet al menos la primera vez que se abre.
