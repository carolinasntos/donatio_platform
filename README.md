# Donatio AML Platform

Sistema web para la gestión de cumplimiento **AML / LFPIORPI** en organizaciones de la sociedad civil (OSC) que reciben donativos.

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

Clonar el repositorio:

```bash
git clone https://github.com/your-repository/donatio-platform.git
cd donatio-platform

Instalar dependencias
npm install

.env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key

npm run dev