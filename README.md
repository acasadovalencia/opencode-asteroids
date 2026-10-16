# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

En la **pantalla de selección** y en el **Game Over** los controles cambian:

| Tecla     | Acción                                            |
| --------- | ------------------------------------------------- |
| `←` `→`   | Cambiar de nave (selección)                       |
| `Espacio` | Empezar a jugar (selección) / reiniciar (Game Over) |
| `S`       | Volver a la selección de naves (solo en Game Over) |

## Skins

La apariencia de la nave es configurable. Al abrir el juego aparece una pantalla de **selección** con una vista previa grande y animada; con `←` `→` se cambia de nave y con `Espacio` se empieza a jugar. La nave elegida se aplica también a los **iconos de vida** del HUD y a la **llama del propulsor**, y queda guardada en `localStorage` (`asteroids.skin`), así que se recuerda en la siguiente partida.

Skins incluidas:

| Nombre    | Apariencia                                   |
| --------- | -------------------------------------------- |
| Clásica   | Contorno blanco (silueta original)           |
| Sólida    | Silueta rellena en blanco                    |
| Neón      | Contorno cian con halo                       |
| Dorada    | Contorno ámbar con halo y llama ámbar        |
| Esmeralda | Contorno verde wireframe                     |

Las skins son puramente cosméticas: la hitbox de la nave no cambia. Durante el power-up de **Velocidad**, cualquier skin recibe un halo cian para que el efecto siga siendo visible.

## Puntuación

| Asteroide      | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 300    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de **Velocidad**: al destruir un asteroide hay un 12% de probabilidad de que suelte un rayo cian. Al cogerlo, la nave se mueve el **doble de rápido durante 5 segundos** (el giro no cambia). Dura 10 s en el mapa si nadie lo coge, y se pierde al morir. El HUD muestra una barra descendiente con el tiempo que queda (parpadea en el último segundo).
- **Estrella fugaz**: asteroide especial que entra por un borde y cruza la pantalla en línea recta a ~3× la velocidad de un asteroide pequeño, con brillo ámbar y estela. Dura 5–8 s y luego se desvanece (parpadea en los últimos 1,5 s). Mata al chocar con la nave. Destruirla da **300 puntos**, pero no se parte en fragmentos ni suelta power-ups. Aparece cada 8–14 s (máximo una a la vez) y no bloquea el cambio de nivel.
