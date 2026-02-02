# AntiGravity - Plataforma Avanzada de Transporte

AntiGravity es una aplicación de transporte de próxima generación diseñada para ofrecer una experiencia justa, transparente y eficiente tanto para pasajeros como para conductores. A diferencia de las plataformas tradicionales, AntiGravity empodera a los usuarios con negociación de precios en tiempo real y selección directa de conductores.

## 🚀 Características Clave

*   **Negociación en Tiempo Real**: Los pasajeros proponen un precio; los conductores pueden aceptar o contraofertar.
*   **Selección de Conductor**: Los pasajeros eligen a su conductor basándose en la calificación, el vehículo y el tiempo de llegada (ETA).
*   **Mapas Interactivos**: Seguimiento en vivo de conductores y progreso del viaje usando Mapbox.
*   **Ciclo Completo del Viaje**: Desde la solicitud hasta la finalización, incluyendo actualizaciones de estado y calificación.
*   **Seguro y Verificado**: Verificación integrada para conductores (Licencia, Seguro) y seguimiento seguro del viaje.

## 🛠 Tecnologías

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion
*   **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
*   **Mapas**: Mapbox GL JS
*   **Componentes UI**: shadcn/ui, Lucide Icons

## 🏁 Primeros Pasos

### Requisitos Previos

*   Node.js (v18 o superior)
*   npm
*   Un proyecto de Supabase
*   Un token público de Mapbox

### Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/daveymena/gravity-drive.git
    cd gravity-drive
    ```

2.  **Instalar Dependencias**
    ```bash
    npm install
    ```

3.  **Configuración del Entorno**
    Crea un archivo `.env` en el directorio raíz:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_de_supabase
    VITE_MAPBOX_TOKEN=tu_token_de_mapbox
    ```

4.  **Configuración de la Base de Datos**
    Ejecuta el SQL de migración proporcionado en `supabase/migrations/` en tu Editor SQL de Supabase para configurar las tablas de Viajes, Ofertas, Documentos y Pagos.

5.  **Ejecutar Localmente**
    ```bash
    npm run dev
    ```

## 📱 Flujo de la Aplicación

### Para Pasajeros
1.  **Solicitar**: Ingresa el destino y ofrece un precio.
2.  **Negociar**: Recibe ofertas de conductores cercanos.
3.  **Seleccionar**: Elige un conductor basado en precio/calificación.
4.  **Rastrear**: Observa la llegada del conductor y sigue el viaje.
5.  **Pagar y Calificar**: Completa el viaje y califica el servicio.

### Para Conductores
1.  **Conectarse**: Cambia el estado a "En Línea" para recibir solicitudes.
2.  **Ofertar**: Acepta ofertas o propón tarifas más altas.
3.  **Conducir**: Navega al punto de recogida y al destino.
4.  **Ganar**: Revisa tus ganancias diarias y estadísticas.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de enviar un Pull Request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
