---
title: Política de privacidad
description: Cómo gestiona TypeStar la información cuando juegas, con o sin cuenta. Sin analíticas y sin publicidad.
updated: "2026-10-12"
---

TypeStar es un juego de navegador gratuito. Puedes jugarlo sin iniciar sesión, y
no hay boletín ni publicidad. Iniciar sesión es opcional: solo hace falta para
mantener una cuenta entre dispositivos, y una clasificación es una incorporación
futura. Este aviso explica la información que toca el juego, y por qué.

## Quién es responsable

TypeStar lo publica **HappyPaul55**, que es el responsable del tratamiento de
todo lo descrito a continuación. Puedes ponerte en contacto con el responsable a
través de [happypaul55.com](https://www.happypaul55.com).

## Jugar sin cuenta

No necesitas una cuenta para jugar. Si nunca inicias sesión:

- No pedimos, almacenamos ni compartimos ningún dato personal.
- No instalamos cookies propias ni usamos analíticas, rastreadores ni píxeles
  publicitarios.
- No hay almacenamiento en el servidor de tu partida ni de tus puntuaciones. Las
  puntuaciones, los combos y los resultados permanecen en tu navegador solo
  durante la sesión.
- Tus preferencias de juego (dificultad, modo de partida, velocidad de
  reproducción y ajuste de sincronía) se guardan en el almacenamiento local de tu
  navegador. Nunca salen de tu dispositivo, y borrar los datos del navegador las
  elimina.

## Cuentas (opcional)

Si decides iniciar sesión, creamos una cuenta para ti y almacenamos:

- tu **dirección de correo electrónico**, que es cómo inicias sesión y la única
  forma en que podemos contactarte;
- una **sesión**, para que sigas con la sesión iniciada en ese navegador hasta que
  cierres sesión o esta caduque;
- tu **nombre de usuario** y nombre visible, si los configuras (el nombre de
  usuario es tu nombre público en las clasificaciones);
- cuándo se **creó** la cuenta;
- los **resultados de las partidas puntuadas** (ver más abajo).

El inicio de sesión usa un **enlace de un solo uso** enviado a tu correo; no hay
contraseña. El enlace es de un solo uso, caduca a los 15 minutos y se almacena
solo como hash. El correo de inicio de sesión es el único correo que enviamos.

Instalamos una **cookie de sesión** cuando has iniciado sesión. Es estrictamente
necesaria para mantenerte con la sesión iniciada, por lo que no requiere
consentimiento, y no se usa para rastrearte en otros sitios. Cerrar sesión o
eliminar tu cuenta la elimina.

## Puntuaciones y clasificaciones

Jugar sin cuenta mantiene tus puntuaciones solo en tu navegador. Cuando has
**iniciado sesión**, se guarda una partida puntuada para que pueda aparecer en
las clasificaciones:

- Almacenamos el **resultado** de la partida —la puntuación, la precisión, el
  combo y la dificultad, el modo de partida y la velocidad con que se jugó—
  asociado a tu cuenta y a la canción.
- Para calcular esa puntuación de forma justa, el navegador envía una grabación
  de las **entradas** de la partida (pulsaciones de teclas o muestras de tono,
  con sus tiempos) y un token de un solo uso. El servidor las reproduce con los
  tiempos de la propia canción para obtener la puntuación y luego **descarta la
  grabación**: solo se conserva el resultado.
- Tu **nombre de usuario y tus puntuaciones son públicos**: aparecen en la
  clasificación de la canción, en el flujo de puntuaciones recientes y en tu
  página de perfil en `/u/<handle>`. Tu dirección de correo electrónico nunca se
  muestra.
- Una partida cuya grabación no se valida se guarda igualmente, pero se marca
  como **no verificada** y se deja fuera de las clasificaciones.

Eliminar tu cuenta elimina también sus puntuaciones.

## El micrófono (canto)

Cantar es opcional, y el micrófono solo se usa para el modo de canto puntuado.
Si lo eliges, tu navegador solicita acceso al micrófono para poder comparar tu
tono con las notas de la canción. El audio se analiza en tu navegador, fotograma
a fotograma, y **nunca se graba, se almacena ni se envía a ningún sitio**: solo
la nota y la puntuación resultantes permanecen en tu dispositivo, durante esa
sesión. El micrófono se libera cuando paras o abandonas la página. Si lo
rechazas, puedes seguir cantando sin puntuación.

## Qué almacena el servidor

- Cuando se reproduce una canción, el servidor obtiene los subtítulos del vídeo
  de YouTube y guarda los **datos de sincronización** —las palabras y cuándo
  aparecen— para que las reproducciones posteriores carguen al instante. Es
  información pública sobre la canción, no sobre ti.
- Si tienes una cuenta, los datos de la cuenta y los resultados de las partidas
  puntuadas descritos arriba se almacenan en nuestra base de datos, alojada por
  Cloudflare (D1).
- El id del vídeo que eliges forma parte de la solicitud, así que los detalles
  técnicos habituales de esa solicitud los gestiona nuestro proveedor de
  alojamiento, Cloudflare, como se describe a continuación.

## Comprobaciones humanas para canciones nuevas

Las canciones que ya están en nuestra biblioteca se reproducen al instante sin
comprobación. La primera vez que pides una canción que no habíamos visto antes
—y cuando solicitas un enlace de inicio de sesión—, Cloudflare **Turnstile**
realiza una comprobación automática rápida para asegurarse de que la solicitud
proviene de una persona y no de un bot. Turnstile puede procesar señales técnicas
como tu dirección IP y las características de tu navegador, y puede instalar una
cookie de corta duración, según la propia política de privacidad de Cloudflare.
Solo se usa para evitar el abuso de los servicios de canciones e inicio de
sesión; las canciones en caché nunca activan una comprobación.

## Tus opciones

- **Acceso y portabilidad** — puedes ver los datos de tu cuenta en la
  [página de la cuenta](/account).
- **Eliminación** — la página de la cuenta te permite eliminar tu cuenta y todo
  lo almacenado con ella (correo, sesiones, nombre de usuario). Es inmediato y
  permanente.
- **Contacto** — para cualquier otra cosa, ponte en contacto con el responsable a
  través de [happypaul55.com](https://www.happypaul55.com).

## Terceros

- **Cloudflare** aloja el sitio, ejecuta el servicio de canciones, almacena en
  caché los datos de las canciones, guarda los datos de las cuentas (D1), entrega
  los correos de inicio de sesión (Email Sending) y proporciona la comprobación
  humana de Turnstile.
- **YouTube** proporciona la música y las imágenes. Cuando se juega una partida,
  el vídeo se inserta desde YouTube, por lo que YouTube (Google) puede instalar
  cookies y ver tu dirección IP y los detalles técnicos habituales de la
  solicitud, según su propia política de privacidad. No se solicitan datos de
  YouTube para navegar por el resto del sitio.

## Cambios

Si este aviso cambia, la fecha de «última actualización» que aparece al principio
de esta página cambiará con él.
