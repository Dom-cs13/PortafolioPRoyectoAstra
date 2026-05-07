# ASTRA | Advanced Simulation & Terrain Rendering

Este repositorio presenta el **BioSphere IDE**, el entorno visual interactivo diseñado para el motor de simulación ASTRA. 

## 🚀 Tecnologías Utilizadas
- **HTML5 & CSS3** - Para la estructura y el diseño visual con efectos "Glassmorphism" y temática espacial.
- **Vanilla JavaScript** - Lógica del sistema.
- **Three.js** - Renderizado 3D en tiempo real (modelo planetario, campo estelar estático, anillos y nebulosas).
- **GSAP (GreenSock)** - Animaciones avanzadas y orquestación con ScrollTrigger.

## 🛠️ Cómo ejecutar el proyecto localmente

El proyecto está compuesto enteramente por archivos estáticos, por lo que no es necesario transpilar ni instalar pesados paquetes de `node_modules`. Sin embargo, debido al uso de WebGL (Three.js), algunos navegadores bloquean la carga de recursos locales por políticas de seguridad (CORS). **Es altamente recomendable levantar un servidor web local para visualizarlo correctamente.**

### Opción 1: Usando la extensión "Live Server" en VS Code (Recomendada)
1. Descarga o clona este repositorio en tu computadora.
2. Abre la carpeta del proyecto en [Visual Studio Code](https://code.visualstudio.com/).
3. Ve a la sección de extensiones e instala **Live Server** (si no la tienes).
4. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.

### Opción 2: Usando Node.js (npx)
Si tienes [Node.js](https://nodejs.org/) instalado, puedes abrir una terminal en la carpeta del proyecto y ejecutar:
```bash
npx serve .
```
Luego visita la ruta `http://localhost:3000` (o la que se indique en la terminal) en tu navegador.

### Opción 3: Usando Python
Casi todas las instalaciones de Python traen un servidor web integrado. Abre tu terminal en la ruta del proyecto y ejecuta:
```bash
# Para Python 3
python -m http.server 8000
```
Entra a `http://localhost:8000` en tu navegador.

## 📦 Dependencias (Incluidas vía CDN)
No necesitas realizar descargas extra para que funcione el programa, las librerías base se importan automáticamente a través de CDN en la cabecera de `index.html`:
- [Three.js (r128)](https://cdnjs.com/libraries/three.js)
- [GSAP (3.12.5) y ScrollTrigger](https://gsap.com/)
- [Google Fonts](https://fonts.google.com/) (Rajdhani, Share Tech Mono, Cormorant Garamond)
