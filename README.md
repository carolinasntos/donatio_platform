# Donatio Platform

Plataforma web para la gestión transparente de donaciones entre donadores y organizaciones de la sociedad civil, con monitoreo de cumplimiento regulatorio.

La plataforma permite administrar donantes, donativos, expedientes documentales y alertas regulatorias para ayudar a las OSC a cumplir con la **Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI)** en México.

---

# Características principales

- Registro y gestión de **donantes**
- Registro y seguimiento de **donativos**
- **Cálculo automático de acumulación de donativos** en ventana móvil de 6 meses
- **Detección automática de umbrales regulatorios**:
  - Identificación reforzada: **1605 UMAs**
  - Obligación de aviso al SAT: **3210 UMAs**
- **Expediente digital KYC** por donante
- **Verificación documental**
- **Alertas AML**
- **Gestión de avisos SAT**
- **Configuración dinámica de UMAs**
- **Chatbot AML** para consultas sobre cumplimiento
- **Dashboard de métricas para AppleSeed**
- - Registro de donadores y organizaciones
- Gestión de documentos de verificación
- Registro y monitoreo de donaciones
- Cálculo de acumulados en periodos de 6 meses
- Generación de alertas regulatorias
- Dashboard de métricas para AppleSeed

---

# Arquitectura

La aplicación utiliza una arquitectura moderna serverless.

React (Vite)
│
▼
Supabase
├─ PostgreSQL (Base de datos)
├─ Auth (Autenticación)
└─ Storage (Documentos KYC)

Tecnologías utilizadas:

- **React**
- **Vite**
- **Supabase**
- **PostgreSQL**
- **TailwindCSS**
- **Lucide Icons**

---

# Requisitos

- Node.js 18 o superior
- npm

---

# Instalación

```bash
git git clone https://github.com/carolinasntos/donatio_platform.git #Clonar el repositorio

cd donatio-platform #Entrar a la carpeta del proyecto

npm install #Instalar dependencias

.env.local
VITE_SUPABASE_ANON_KEY=sb_publishable_tKeTHzvmY_tVwsN2tT6O_Q_Q1QczR5c

npm run dev #Ejecutar el proyecto

```

---

## Database

Main tables:

- donors
- organizations
- donations
- donor_documents
- compliance_cases
- alerts

---

## API Endpoints

POST /donations
GET /organizations
GET /alerts
