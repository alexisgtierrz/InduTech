# 🏭 InduTech S.A. - Control de Inventarios

Sistema integral para la gestión de inventarios, que combina una calculadora dinámica de **Clasificación ABC** (basada en el principio de Pareto) y un **Simulador Operativo** para modelos de producción (EPQ) y gestión de riesgos (ROP).

## 🛠 Tecnologías Utilizadas

### Backend
* **Java 21+**
* **Spring Boot** (Framework principal)
* **Spring Data JPA** (Persistencia de datos)
* **Maven** (Gestión de dependencias)

### Frontend
* **React**
* **TypeScript**
* **Vite** (Build tool)
* **CSS3** (Estilos personalizados)

---

## 📋 Estructura del Proyecto

InduTech-Inventario/
├── back/     # Proyecto Spring Boot
└── front/    # Proyecto React

🚀 Guía de Inicio Rápido
Requisitos Previos
Antes de empezar, asegúrate de tener instalado:

Java JDK 21 o superior.

Maven.

Node.js (Versión 24+ recomendada) y NPM.

Un IDE de tu preferencia (IntelliJ IDEA para el backend, VS Code para el frontend).

1. Configuración del Backend (/back)
El backend se ejecutará por defecto en el puerto 8080.

  1. Abre una terminal en la carpeta back/.

  2. Compila el proyecto:

    Bash
    mvn clean install
    
  3. Ejecuta la aplicación:

    Bash
    mvn spring-boot:run
    
Nota: Si utilizas base de datos externa, asegúrate de configurar el application.properties en src/main/resources.

2. Configuración del Frontend (/front)
El frontend se ejecutará por defecto en el puerto 5173.

  1. Abre una terminal en la carpeta front/.

  2. Instala las dependencias:

    Bash
    npm install

  3. Inicia el servidor de desarrollo:

    Bash
    npm run dev
    
Abre tu navegador en la URL que indique la terminal (usualmente http://localhost:5173).

🔗 Endpoints Principales (API)
El backend expone los siguientes endpoints:

POST /api/inventory/calculate: Recibe los parámetros y devuelve métricas (EPQ, ROP, SS, etc.).

POST /api/inventory/abc: Clasifica una lista de ítems en categorías A, B y C.

POST /api/inventory/add: Persiste un nuevo producto en la base de datos.

GET /api/inventory/all: Retorna todos los productos almacenados.

💡 Resolución de Problemas

Puerto en uso: Si el puerto 8080 está ocupado, puedes cambiar el puerto del backend en application.properties usando server.port=8081.

Error de dependencias: Si npm run dev falla, borra la carpeta node_modules y ejecuta npm install nuevamente.
