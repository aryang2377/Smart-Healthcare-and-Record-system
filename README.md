# 🏥 CareSync — Smart Healthcare & Clinical Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/Templates-EJS%20%2B%20EJS--Mate-B4CA65?logo=ejs&logoColor=white)](https://ejs.co/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

> **CareSync** is a full-stack, enterprise-grade clinical management and digital outpatient platform built with **Node.js, Express, MongoDB Atlas, and EJS**. Designed with a modern dark clinical user interface, the platform connects **Patients**, **Healthcare Staff (Doctors & Front-Desk Receptionists)**, and **Hospital Administrators** into a unified, secure, role-governed healthcare ecosystem.

---

## 📋 Table of Contents

- [Key Portals & Features](#-key-portals--features)
  - [1. Patient Portal](#1-patient-portal-dashboard)
  - [2. Unified Healthcare Staff Portal](#2-unified-healthcare-staff-portal-staff)
  - [3. Hospital Administration Console](#3-hospital-administration-console-admin)
  - [4. Public Portals](#4-public-portals)
- [Clinical Workflow Architecture](#-clinical-workflow-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start & Installation](#-quick-start--installation)
- [Master Test & Evaluation Credentials](#-master-test--evaluation-credentials)
- [Project Directory Structure](#-project-directory-structure)
- [Route & Endpoint Reference](#-route--endpoint-reference)
- [Security & Data Governance](#-security--data-governance)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License & Authors](#-license--authors)

---

## 🌟 Key Portals & Features

### 1. Patient Portal (`/dashboard`)
* **Protected Slot Booking**: Select attending physicians, consultation dates, and real clinical time slots (e.g. `09:00 AM - 09:30 AM`, `10:00 AM - 10:30 AM`).
* **Live Visit Stage Tracking**: Real-time status indicators in the appointments ledger:
  - `Scheduled` / `Confirmed`
  - `Checked-In` *(Live notice: "Checked In — Waiting in Outpatient Lounge")*
  - `In-Consultation` *(Live notice: "In Consultation with Attending Doctor")*
  - `Completed`, `Cancelled`, `No-Show`
* **One-Click Cancellation**: Patients can cancel upcoming consultations with automatic in-app alerts dispatched to the attending doctor.
* **Electronic Health Records (EHR) Vault**: Confidential diagnostic test reports, lab analyses, and radiology scans issued exclusively by authorized doctors.
* **Digital Prescriptions**: Access all doctor-issued prescriptions with clinical diagnoses, medications, and a direct link to the printable clinical slip (`/prescriptions/:id`).
* **Chronological Consultation History**: Timeline of past completed consultations with clinical remarks and follow-up review dates.

### 2. Unified Healthcare Staff Portal (`/staff`)
* **Unified Console for Doctors & Receptionists**: A single, streamlined clinical dashboard (`/staff`) with strict backend **Role-Based Access Control (RBAC)**:
  - **Receptionist (Front-Desk Operations)**:
    - Checks in arriving patients (`Checked-In` with automated timestamp).
    - Manages live outpatient queue and marks `No-Show` or `Cancelled`.
    - Schedules walk-in consultations directly from the front desk.
    - Inspects dispatched prescriptions ledger and patient directories.
    - *Clinical restrictions*: Operational access only; cannot start consultations, issue prescriptions, or access AI clinical symptom triage.
  - **Attending Doctor (Clinical Authority)**:
    - Calls patient in to begin consultation (`In-Consultation` with automated timestamp).
    - Concludes consultation (`Completed`) with diagnostic findings and remarks.
    - Generates electronic prescriptions via the interactive **Digital Rx Pad** (`/staff/prescriptions/create`).
    - Uploads official diagnostic lab reports and radiology files directly into patient EHR files.
    - **AI Symptom Triage Leads (`/staff?tab=triage`)**: Real-time incoming patient inquiries where AI triage recommended this doctor's specialty, complete with reported symptoms, urgency score, emergency flags, and direct conversion to outpatient appointment or prescription.
    - Manages practice schedule: working days, OPD hours, slot duration, and consultation fees (`/staff/availability/update`).
* **Legacy Compatibility**: Accessing `/doctor`, `/doctor/login`, or `/doctor/apply` automatically routes to `/staff` endpoints with backward compatibility.

### 3. Hospital Administration Console (`/admin`)
* **Separation of Operational Governance vs Private EHR**: Administrative access is restricted to system operations, verification, and facility logistics; private doctor-patient consultation notes remain confidential.
* **9 Modular Consoles**:
  1. **Overview & Analytics**: Live system uptime, total patients, verified doctors, front-desk staff counts, appointment metrics, and EHR security audit.
  2. **Doctor Verification Desk**: Comprehensive credential review for pending applicants (`approvalStatus: "pending"` or `"needs_info"`). Actions:
     - **Approve & Activate**: Grants staff portal access; doctor becomes visible on public directory.
     - **Request Information (`needs_info`)**: Sends administrative notes and required document updates to the applicant.
     - **Reject Application (`rejected`)**: Records rejection reasons and restricts access.
  3. **Staff Management**: View, provision new Doctors or Receptionists, toggle active/inactive status, or remove accounts.
  4. **Patient Directory**: Complete registry of registered patient accounts and contact details.
  5. **Master Appointments Ledger**: Hospital-wide ledger with status filtering and administrative status overrides.
  6. **Departments & Specialties Management**: Create and manage clinical units (Cardiology, Dermatology, Orthopedics, etc.) with codes, floor locations, and senior consultants.
  7. **Security & Audit Logs**: Immutable chronological security and operational audit trail with timestamps, actions, actor names/roles, targets, and details.
  8. **AI Symptom Triage Inquiries (`/admin?tab=triage`)**: Hospital-wide audit of all patient AI symptom checks, emergency red-flags, requested specialties, and recommended doctor logs.
  9. **Clinics & Settings**: Facility identity, emergency helpline contacts, operating hours, and data governance policies.

### 4. Public Portals
* **Verified Doctor Directory (`/doctors`)**: Real-time directory displaying **only verified (`approved`) and active doctors** with consultation fees, experience, working hours, and department filters.
* **Clinical AI Symptom Checker (`/symptom`)**: Interactive intelligent triage, red-flag emergency detection, and real-time verified specialist matching across 14 clinical departments.
* **Digital Prescription Slip (`/prescriptions/:id`)**: Formal hospital-branded clinical slip formatted for digital viewing and physical `@media print` PDF generation.

---

## 🔄 Clinical Workflow Architecture

```
[ Doctor Applies ]  --->  [ Admin Reviews Credentials ]  --->  [ Doctor Approved & Active ]
  (/doctor/apply)             (/admin?tab=verification)            (Listed on /doctors)
                                                                            |
                                                                            v
[ Patient Prints Slip ] <-- [ Doctor Issues Rx Pad ] <-- [ Doctor In-Consultation ] <-- [ Patient Books Slot ]
  (/prescriptions/:id)        (/staff?tab=prescription)        (Status: In-Consultation)      (/dashboard)
                                                                            ^
                                                                            |
                                                               [ Receptionist Check-In ]
                                                                 (Status: Checked-In)
```

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
* **npm**: `v9.0.0` or higher (bundled with Node.js)
* **MongoDB**: A local MongoDB daemon running on `mongodb://localhost:27017` **OR** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster connection string.

---

## 🚀 Quick Start & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/aryang2377/Smart-Healthcare-and-Record-system.git
cd "Smart-Healthcare-and-Record-system"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (you can copy the provided `.env.example`):
```bash
# On Windows (PowerShell):
Copy-Item .env.example .env

# On Linux / macOS:
cp .env.example .env
```
Open `.env` and configure your local environment (such as `PORT` and `MONGODB_URI`).

### Step 4: Start the Server
For development with auto-reloading:
```bash
npm run dev
```
For standard production execution:
```bash
npm start
# or: node index.js
```

### Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost:4000
```
*(On first startup, the server automatically synchronizes verified medical faculty, receptionist accounts, standard hospital departments, and directory upload paths).*

---

## 👥 Master Test & Evaluation Credentials

The database is automatically pre-seeded and synchronized on startup with verified test credentials for attending physicians, front-desk receptionists, and outpatient accounts across all 14 clinical departments.

---

### 1. 🧑‍⚕️ Verified Attending Physicians (1 Specialist Per Department)
All doctors log in via the Unified Staff Portal at **[`/staff/login`](http://localhost:4000/staff/login)**.

#### Quick-Reference Physician Credentials
| Department / Speciality | Attending Doctor | Email Address | Password | Consultation Fee | OPD Timings & Days |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cardiology** | `Dr. Rajesh Sharma` | `doctor@caresync.health` | `Cardio#Sharma26` | ₹800 | Mon - Fri (09:00 AM - 02:00 PM) |
| **Dermatology** | `Dr. Priya Mehta` | `dr.priya@caresync.health` | `Derma#Mehta26` | ₹600 | Mon - Sat (10:00 AM - 04:00 PM) |
| **General Medicine** | `Dr. Amit Verma` | `dr.verma@caresync.health` | `GenMed#Verma26` | ₹500 | Mon - Sat (08:30 AM - 03:00 PM) |
| **Pediatrics** | `Dr. Neha Kapoor` | `dr.kapoor@caresync.health` | `Pedia#Kapoor26` | ₹650 | Mon - Fri (09:30 AM - 02:30 PM) |
| **Neurology** | `Dr. Rahul Singh` | `dr.singh@caresync.health` | `Neuro#Singh26` | ₹900 | Mon - Thu (10:00 AM - 03:30 PM) |
| **Orthopedics** | `Dr. Karan Malhotra` | `dr.malhotra@caresync.health` | `Ortho#Malhotra26` | ₹750 | Mon - Sat (09:00 AM - 02:00 PM) |
| **Gynecology & Obstetrics** | `Dr. Ananya Gupta` | `dr.ananya@caresync.health` | `Gynec#Gupta26` | ₹700 | Mon - Fri (10:00 AM - 04:00 PM) |
| **ENT (Otolaryngology)** | `Dr. Vikram Nair` | `dr.nair@caresync.health` | `Ent#Nair26` | ₹600 | Mon - Sat (11:00 AM - 05:00 PM) |
| **Gastroenterology** | `Dr. Alok Bansal` | `dr.bansal@caresync.health` | `Gastro#Bansal26` | ₹850 | Mon - Fri (09:00 AM - 03:00 PM) |
| **Pulmonology** | `Dr. Ritu Saxena` | `dr.saxena@caresync.health` | `Pulmo#Saxena26` | ₹750 | Mon - Fri (10:00 AM - 04:00 PM) |
| **Psychiatry** | `Dr. Sameer Joshi` | `dr.joshi@caresync.health` | `Psych#Joshi26` | ₹800 | Mon - Sat (12:00 PM - 06:00 PM) |
| **Ophthalmology** | `Dr. Meenakshi Sundaram` | `dr.sundaram@caresync.health` | `Eye#Sundaram26` | ₹650 | Mon - Sat (09:00 AM - 02:00 PM) |
| **Endocrinology** | `Dr. Sanjay Deshmukh` | `dr.deshmukh@caresync.health` | `Endo#Deshmukh26` | ₹850 | Tue - Sat (10:00 AM - 03:30 PM) |
| **Urology** | `Dr. Deepak Aggarwal` | `dr.aggarwal@caresync.health` | `Uro#Aggarwal26` | ₹900 | Mon - Fri (09:30 AM - 03:30 PM) |

---

#### Comprehensive Clinical Faculty Directory
| Doctor Name | Department & Location | Qualifications & Experience | Medical License & Authority | Consultation Details | Contact Phone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dr. Rajesh Sharma** | **Cardiology** (`CARD`)<br>Wing A, 2nd Floor | MBBS, MD (Cardiology), FACC<br>• *14 Years Experience* | `MCI-CARD-2024-8849`<br>National Medical Commission | Fee: **₹800**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43210` |
| **Dr. Priya Mehta** | **Dermatology** (`DERM`)<br>Wing B, 1st Floor | MBBS, MD (Dermatology & Venereology)<br>• *10 Years Experience* | `MCI-DERM-2023-4102`<br>Delhi Medical Council | Fee: **₹600**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43211` |
| **Dr. Amit Verma** | **General Medicine** (`GENMED`)<br>Outpatient Block, Ground Floor | MBBS, MD (Internal Medicine)<br>• *15 Years Experience* | `MCI-GENMED-2022-1984`<br>National Medical Commission | Fee: **₹500**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43212` |
| **Dr. Neha Kapoor** | **Pediatrics** (`PED`)<br>Wing C, 1st Floor | MBBS, MD (Pediatrics), DCH<br>• *9 Years Experience* | `MCI-PED-2024-6721`<br>Maharashtra Medical Council | Fee: **₹650**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43213` |
| **Dr. Rahul Singh** | **Neurology** (`NEUR`)<br>Wing A, 3rd Floor | MBBS, DM (Neurology)<br>• *12 Years Experience* | `MCI-NEUR-2021-3310`<br>National Medical Commission | Fee: **₹900**<br>Duration: 30 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43214` |
| **Dr. Karan Malhotra** | **Orthopedics** (`ORTH`)<br>Wing B, Ground Floor | MBBS, MS (Orthopedic Surgery), MCh<br>• *16 Years Experience* | `MCI-ORTH-2020-5542`<br>National Medical Commission | Fee: **₹750**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43215` |
| **Dr. Ananya Gupta** | **Gynecology & Obstetrics** (`OBGYN`)<br>Maternity Block, 2nd Floor | MBBS, MS (Obstetrics & Gynecology), DGO<br>• *11 Years Experience* | `MCI-GYN-2023-7891`<br>Delhi Medical Council | Fee: **₹700**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43216` |
| **Dr. Vikram Nair** | **ENT (Otolaryngology)** (`ENT`)<br>Wing C, 2nd Floor | MBBS, MS (ENT / Otorhinolaryngology)<br>• *13 Years Experience* | `MCI-ENT-2022-9012`<br>National Medical Commission | Fee: **₹600**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43217` |
| **Dr. Alok Bansal** | **Gastroenterology** (`GASTRO`)<br>Wing D, 1st Floor | MBBS, MD (Medicine), DM (Gastroenterology)<br>• *14 Years Experience* | `MCI-GASTRO-2021-4478`<br>National Medical Commission | Fee: **₹850**<br>Duration: 25 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43218` |
| **Dr. Ritu Saxena** | **Pulmonology** (`PULM`)<br>Wing D, 2nd Floor | MBBS, MD (Pulmonary Medicine), FCCP<br>• *12 Years Experience* | `MCI-PULM-2023-2289`<br>National Medical Commission | Fee: **₹750**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43219` |
| **Dr. Sameer Joshi** | **Psychiatry** (`PSYCH`)<br>Wing E, 3rd Floor | MBBS, MD (Psychiatry), DPM<br>• *10 Years Experience* | `MCI-PSYCH-2024-1134`<br>National Medical Commission | Fee: **₹800**<br>Duration: 30 mins<br>Break: 02:00 PM - 03:00 PM | `+91 98765 43220` |
| **Dr. Meenakshi Sundaram** | **Ophthalmology** (`OPHTH`)<br>Wing A, Ground Floor | MBBS, MS (Ophthalmology), FICO<br>• *15 Years Experience* | `MCI-OPHTH-2020-6677`<br>Tamil Nadu Medical Council | Fee: **₹650**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43221` |
| **Dr. Sanjay Deshmukh** | **Endocrinology** (`ENDO`)<br>Wing B, 2nd Floor | MBBS, MD (Medicine), DM (Endocrinology)<br>• *13 Years Experience* | `MCI-ENDO-2022-8820`<br>Maharashtra Medical Council | Fee: **₹850**<br>Duration: 20 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43222` |
| **Dr. Deepak Aggarwal** | **Urology** (`UROL`)<br>Wing C, Ground Floor | MBBS, MS (Surgery), MCh (Urology)<br>• *16 Years Experience* | `MCI-UROL-2021-3901`<br>Delhi Medical Council | Fee: **₹900**<br>Duration: 25 mins<br>Break: 01:00 PM - 02:00 PM | `+91 98765 43223` |

---

### 2. 👩‍💼 Front-Desk Receptionists (Unified Staff Portal)
Receptionists manage patient admissions, walk-in scheduling, and outpatient lounge check-ins via **[`/staff/login`](http://localhost:4000/staff/login)**.

| Desk / Shift | Receptionist Name | Email Address | Password | Shift Timing & Days | Contact Phone | Key Duties & Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Clinical Admissions & Check-in (Day)** | `Sarah Jenkins (Front Desk)` | `receptionist@caresync.health` | `Staff#Sarah26` | Mon - Sat<br>(08:00 AM - 03:00 PM) | `+91 98765 11223` | Patient check-ins (`Checked-In`), walk-in scheduling, live outpatient lounge queue, hospital-wide patient search. |
| **Outpatient Queue & Triage Desk (Evening)** | `David Miller (Front Desk)` | `reception@caresync.health` | `Staff#David26` | Mon - Sat<br>(02:00 PM - 09:00 PM) | `+91 98666 77788` | Queue triage, mark no-shows (`No-Show`) or cancellations, check walk-ins, verify prescription dispatch status. |

*Operational Boundaries: Receptionists retain hospital-wide patient directory visibility for registration, but cannot start medical consultations, issue digital prescriptions, upload clinical reports, or access doctor-only AI symptom triage leads.*

---

### 3. 👤 Registered Patient Account
Patients sign in via the Patient Portal at **[`/login`](http://localhost:4000/login)** to schedule consultations and view confidential health records.

| Field | Registered Outpatient Details |
| :--- | :--- |
| **Portal URL** | [`/login`](http://localhost:4000/login) |
| **Patient Full Name** | `John Doe` |
| **Email Address** | `john@gmail.com` |
| **Password** | `john12` |
| **Primary Phone** | `+91 98765 00001` |
| **Account Status** | Active Verified Outpatient |
| **Patient Features** | • Book appointments across all 14 clinical specialties with doctor selection and protected time slots.<br>• Real-time visit lifecycle tracking (`Scheduled` ➔ `Checked-In` ➔ `In-Consultation` ➔ `Completed`).<br>• Access private Electronic Health Records (EHR) diagnostic reports.<br>• Review doctor-issued digital prescriptions with one-click printable PDF slips (`/prescriptions/:id`).<br>• Complete chronological medical consultation history. |

---

### 4. 🏥 Hospital Departments & Clinical Units
The system maintains 14 standardized clinical departments synchronized with senior attending consultants and physical hospital wings:

| Code | Department Name | Head of Department | Floor / Location | Clinical Scope |
| :--- | :--- | :--- | :--- | :--- |
| `CARD` | **Cardiology** | Dr. Rajesh Sharma | Wing A, 2nd Floor | Cardiovascular diagnostics, ECG, echocardiography, hypertension clinics. |
| `DERM` | **Dermatology** | Dr. Priya Mehta | Wing B, 1st Floor | Clinical skin evaluations, allergy management, medical dermatological therapies. |
| `GENMED` | **General Medicine** | Dr. Amit Verma | Outpatient Block, Ground Floor | Primary healthcare, preventive evaluations, infection control, routine consultations. |
| `PED` | **Pediatrics** | Dr. Neha Kapoor | Wing C, 1st Floor | Child wellness, developmental screenings, pediatric infectious disease management. |
| `NEUR` | **Neurology** | Dr. Rahul Singh | Wing A, 3rd Floor | Neurological evaluations, headache disorders, stroke prevention, neuro-rehab. |
| `ORTH` | **Orthopedics** | Dr. Karan Malhotra | Wing B, Ground Floor | Musculoskeletal trauma, arthritis management, joint care, physical mobility support. |
| `OBGYN` | **Gynecology & Obstetrics** | Dr. Ananya Gupta | Maternity Block, 2nd Floor | Maternal care, women's wellness, prenatal screenings, reproductive health. |
| `ENT` | **ENT (Otolaryngology)** | Dr. Vikram Nair | Wing C, 2nd Floor | Ear, nose, throat diagnostics, audiology screening, sinus disease clinics. |
| `GASTRO` | **Gastroenterology** | Dr. Alok Bansal | Wing D, 1st Floor | Digestive health, liver disorders, endoscopy, acid peptic diseases, colon wellness. |
| `PULM` | **Pulmonology** | Dr. Ritu Saxena | Wing D, 2nd Floor | Respiratory health, asthma management, COPD therapies, pulmonary function testing. |
| `PSYCH` | **Psychiatry** | Dr. Sameer Joshi | Wing E, 3rd Floor | Behavioral health, anxiety management, mood disorders, psychiatric counseling. |
| `OPHTH` | **Ophthalmology** | Dr. Meenakshi Sundaram | Wing A, Ground Floor | Vision testing, retinal evaluation, corneal health, ocular medicine. |
| `ENDO` | **Endocrinology** | Dr. Sanjay Deshmukh | Wing B, 2nd Floor | Diabetology, thyroid dysfunctions, endocrine hormone balance, metabolic health. |
| `UROL` | **Urology** | Dr. Deepak Aggarwal | Wing C, Ground Floor | Urinary disorders, renal calculi evaluation, prostate clinics, bladder health. |

---

### 5. 🔐 Essential Clinical Access & Privacy Rules

> [!IMPORTANT]
> **Doctor Panel Patient Access Scoping**:
> In accordance with medical data privacy principles, a patient's records appear in an attending doctor's dashboard ([`/staff`](http://localhost:4000/staff)) Patient Directory, Digital Rx Pad dropdown, and Diagnostic Report Upload modal **if and only if** that patient has scheduled a consultation with that specific attending physician.
> Front-desk receptionists and System Administrators retain hospital-wide directory access for facility registration and emergency desk operations.

> [!TIP]
> **AI Symptom Triage Navigation**:
> The **AI Symptom Triage** console is integrated directly into the top navigation bar for both Attending Doctors (`/staff?tab=triage`) and Hospital Administrators (`/admin?tab=triage`).
> - **Doctor Triage View**: Displays only real incoming patient inquiries where AI triage recommended that doctor's clinical specialty, enabling instant 1-click consultation scheduling or digital prescription drafting.
> - **Admin Triage View**: Provides a hospital-wide audit of all patient triage submissions, emergency red-flags, matched doctors, and an interactive **Patient Clinical Dossier Modal** with zero fake test data.

---

## 📁 Project Directory Structure

```text
smart-health/
├── db/
│   ├── sample.js                 # Mongoose connection initialization
│   └── seed.js                   # Startup seeder (Admin, Doctors, Receptionists, Departments)
├── models/
│   ├── appointment.js            # Appointments schema (statuses, time slots, clinical notes)
│   ├── AuditLog.js               # Immutable audit trail schema (action, category, actor, target)
│   ├── Department.js             # Hospital departments and specialties schema
│   ├── Notification.js           # Real-time in-app notification schema
│   ├── Prescription.js           # Digital Rx schema (symptoms, diagnosis, regimen, advice)
│   ├── Report.js                 # Private EHR diagnostic reports schema
│   ├── SymptomTriage.js          # Clinical AI symptom triage schema (symptoms, urgency, matched doctors)
│   └── user.js                   # Users schema (Patient, Doctor, Receptionist, Admin)
├── public/
│   ├── css/
│   │   ├── dashboard.css         # Dark theme styles for Patient, Staff & Admin portals
│   │   ├── find doctors.css      # Verified doctor directory and filter styles
│   │   ├── login.css / register.css # Auth screen styling
│   │   ├── style.css             # Global dark clinical palette & typography
│   │   └── symptom.css           # AI Symptom Checker preview styles
│   ├── images/                   # Hospital logos, badges, and avatars
│   ├── js/
│   │   └── navbar.js             # Responsive mobile navigation drawer controller
│   └── uploads/                  # Private file storage
│       ├── doctor_docs/          # Uploaded medical licenses, degrees, and government IDs
│       └── reports/              # Uploaded patient diagnostic test reports
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs       # Main EJS wrapper (Navbar, Meta, Scripts, Footer)
│   ├── listings/
│   │   ├── admin-dashboard.ejs   # 8-module Hospital Administrator Console
│   │   ├── dashboard.ejs         # Patient Health Portal (Appointments, Records, Rx)
│   │   ├── doctor-dashboard.ejs  # Unified Staff Dashboard (Doctor & Receptionist RBAC)
│   │   ├── find doctors.ejs      # Verified public Doctor Directory
│   │   ├── footer.ejs            # Institutional clinical footer
│   │   ├── home.ejs              # Dark-themed clinical landing page
│   │   ├── navbar.ejs            # Dynamic role-aware navigation header
│   │   ├── prescription-view.ejs # Printable digital clinical prescription slip
│   │   ├── reports.ejs           # EHR overview vault
│   │   └── symptom.ejs           # AI Symptom Checker & Clinical Triage preview
│   ├── users/
│   │   ├── admin-login.ejs       # Admin secure login
│   │   ├── doctor-apply.ejs      # Multi-step Doctor onboarding & verification wizard
│   │   ├── doctor-login.ejs      # Legacy doctor login redirect
│   │   ├── doctor-pending.ejs    # Pending application status screen
│   │   ├── forgot.ejs            # Password reset recovery
│   │   ├── login.ejs             # Patient sign in
│   │   ├── register.ejs          # Patient registration
│   │   └── staff-login.ejs       # Unified Staff Sign In (Doctor & Receptionist)
│   └── error.ejs                 # Centralized styled error and 404 notice view
├── .env                          # Local environment variables (kept private)
├── .env.example                  # Environment template for git repository
├── constants.js                  # Application constants (DB name)
├── index.js                      # Core Express server, middlewares, and route controllers
├── package.json                  # Project metadata, scripts, and dependencies
└── README.md                     # Comprehensive project documentation
```

---

## 🛣️ Route & Endpoint Reference

### Public Routes
* `GET /` — Clinical home portal
* `GET /doctors` — Directory of verified (`approved`) and active medical specialists
* `GET /symptom` — Clinical AI Symptom Checker & Triage page
* `POST /api/symptom-check` — Intelligent clinical AI triage evaluation endpoint (urgency, emergency flags, matched specialists, database persistence)
* `GET /prescriptions/:id` — Official printable prescription slip (PDF & print view)
* `GET /forgot` — Credential recovery assistance

### Patient Routes
* `GET /login` & `POST /login` — Patient sign in
* `GET /register` & `POST /register` — Patient registration
* `GET /logout` — Clear session cookie and sign out
* `GET /dashboard` — Patient Portal (appointments, EHR, prescriptions, history)
* `POST /appointments` — Book consultation with protected time slot
* `POST /appointments/:id/cancel` — Cancel scheduled consultation

### Unified Staff Routes (`/staff` & `/doctor`)
* `GET /staff/login` & `POST /staff/login` — Unified staff sign in (Doctors & Receptionists)
* `GET /doctor/login` — Redirects to `/staff/login`
* `GET /doctor/apply` & `POST /doctor/apply` — Multi-step Doctor onboarding application
* `GET /staff` (or `/doctor`) — Unified Staff Dashboard
* `GET /staff?tab=triage` — Doctor AI Symptom Triage inquiries console *(Doctor only)*
* `POST /staff/triage/:id/status` — Update triage review status (`New`, `Reviewed`, `Archived`) *(Doctor only)*
* `POST /staff/appointments/:id/status` — Status transitions: `Checked-In`, `In-Consultation` *(Doctor only)*, `Completed` *(Doctor only)*, `Cancelled`, `No-Show`
* `POST /staff/prescriptions/create` — Issue prescription via Digital Rx Pad *(Doctor only)*
* `POST /staff/reports/upload` — Upload diagnostic document to patient file
* `POST /staff/availability/update` — Update practice hours, slots, and fees *(Doctor only)*

### Administrator Routes (`/admin`)
* `GET /admin/login` & `POST /admin/login` — Administrator authentication
* `GET /admin` — 8-module Hospital Administration Console
* `GET /admin?tab=triage` — Hospital-wide AI Symptom Triage Inquiries ledger with patient dossier modal
* `POST /admin/triage/:id/status` — Update triage lead status (`New`, `Reviewed`, `Archived`)
* `POST /admin/doctors/:id/approve` — Approve doctor application & activate public visibility
* `POST /admin/doctors/:id/request-info` — Request additional documents (`needs_info`)
* `POST /admin/doctors/:id/reject` — Reject doctor application (`rejected`)
* `POST /admin/staff/add` — Provision Doctor or Receptionist account
* `POST /admin/staff/:id/toggle-active` — Toggle staff account active/inactive
* `POST /admin/staff/:id/delete` — Delete staff account
* `POST /admin/departments/add` & `POST /admin/departments/:id/delete` — Department management
* `POST /admin/appointments/:id/status` — Administrative appointment status override

---

## 🔒 Security & Data Governance

* **Role-Based Access Control (RBAC)**: Enforced via `isLoggedIn`, `isStaffLoggedIn`, `isDoctorOnly`, and `isAdminLoggedIn` middlewares.
* **Confidential EHR Segregation**: Diagnostic reports and prescriptions are query-scoped to the patient and attending physician. System administrators manage facility operations without unrestricted access to private consultation notes.
* **Password Encryption**: All user passwords hashed using `bcrypt` with a minimum of 10 salt rounds.
* **Session Protection**: State maintained through HTTP-only signed JWT cookies (`SameSite` compliant).
* **Audit Logging**: Sensitive events (`AUTH`, `VERIFICATION`, `APPOINTMENT`, `CONSULTATION`, `PRESCRIPTION`, `STAFF`) write immutable logs to MongoDB with actor ID, action, target, and IP address.

---

## ❓ Troubleshooting & FAQ

#### Q: Port 4000 is already in use.
Change the port in your `.env` file:
```env
PORT=5000
```
Or kill the process currently occupying port 4000:
```powershell
# Windows (PowerShell):
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force
```

#### Q: MongoDB connection fails or times out.
* Verify your IP address is whitelisted in MongoDB Atlas Network Access (`0.0.0.0/0` for development).
* Ensure your `MONGODB_URI` string in `.env` contains valid credentials.
* If testing offline, ensure your local MongoDB daemon is running (`mongod`).

#### Q: Where are uploaded doctor licenses and reports stored?
* Medical documents are stored locally in `public/uploads/doctor_docs/` and `public/uploads/reports/`.
* These folders are automatically verified and created by `index.js` on startup.

---

## 👨‍💻 License & Authors

* **Project**: CareSync — Smart Healthcare & Record System
* **Authors / Developers**: **Aryan Gupta** & **Kasharika Uppal**
* **Repository**: [GitHub Repository](https://github.com/aryang2377/Smart-Healthcare-and-Record-system)
* **License**: [ISC License](https://opensource.org/licenses/ISC)
