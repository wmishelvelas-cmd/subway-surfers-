# Plan de Cambios: Subway Surfers → Track Dash

## Cambios de Nombre del Proyecto

### 1. package.json
- Cambiar `name` de `"subway-surfers"` a `"track-dash"`
- Cambiar `description` a "Un juego de carreras por vías creado con HTML5 Canvas, CSS3 y JavaScript"
- Cambiar keywords: reemplazar `"subway-surfers"` por `"track-dash"` y agregar `"runner"`

### 2. index.html
- **Línea 5**: Cambiar `<title>Subway Surfers</title>` a `<title>Track Dash - Juego de Carreras</title>`
- **Línea 34**: Cambiar `<h1>SUBWAY SURFERS</h1>` a `<h1>TRACK DASH</h1>`
- **Línea 35**: Cambiar `<p class="subtitle">¡Corre por las vías del metro!</p>` a `<p class="subtitle">¡Corre y esquiva en las vías!</p>`

### 3. server.js
- **Línea 10**: Cambiar `console.log('🎮 Subway Surfers está corriendo...` a `console.log('🎮 Track Dash está corriendo...`

### 4. README.md
- **Título**: Cambiar `# 🎮 Subway Surfers - Juego Web` a `# 🎮 Track Dash - Juego Web`
- **Descripción**: Cambiar "Un juego tipo **Subway Surfers**..." a "Un juego de carreras por vías..."
- **Carpeta**: Cambiar `subway-surfers/` a `track-dash/` en el árbol de directorios
- Actualizar referencias a "Subway Surfers" en la documentación

### 5. QUICK_START.md
- Cambiar rutas de `subway-surfers` a `track-dash`
- Cambiar URL de GitHub Pages a `https://tu-usuario.github.io/track-dash`

### 6. INSTRUCCIONES_GITHUB.md
- Cambiar nombre del repositorio en ejemplos de `subway-surfers` a `track-dash`
- Cambiar URLs de GitHub
- Cambiar URLs de GitHub Pages

### 7. game.js (opcional)
- Línea inicial del comentario: cambiar si hay referencias a "Subway Surfers"

## Archivos a modificar:
- [x] package.json
- [x] index.html
- [x] server.js
- [x] README.md
- [x] QUICK_START.md
- [x] INSTRUCCIONES_GITHUB.md

## Git
Después de los cambios:
```bash
git add .
git commit -m "🎮 Renombrar proyecto a Track Dash"
git push origin main
```

## GitHub Pages URL
Cambiará de:
- `https://tu-usuario.github.io/subway-surfers`

A:
- `https://tu-usuario.github.io/track-dash`
