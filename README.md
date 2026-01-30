# TPI — Tribunal de Première Instance

## 📌 Présentation générale

**TPI (Tribunal de Première Instance)** est une application web destinée à la gestion, l’archivage et la recherche des documents judiciaires au format **PDF** au sein d’un tribunal de première instance.

L’application permet la centralisation des documents, l’indexation de leur contenu textuel, le suivi de l’état d’extraction et une gestion sécurisée des accès selon les rôles utilisateurs.

---

## 🎯 Objectifs du projet

- Centraliser les documents judiciaires numériques  
- Faciliter la recherche multicritère des documents  
- Automatiser l’extraction du texte des fichiers PDF  
- Suivre le cycle de vie des documents  
- Garantir la sécurité et la confidentialité des données  

---

## 🏛️ Contexte du projet (Stage)

Ce projet a été réalisé dans le cadre d’un **stage professionnel au sein d’un Tribunal de Première Instance**.  
Il couvre l’ensemble du cycle de développement logiciel :

- Analyse fonctionnelle et recueil des besoins  
- Modélisation UML et Merise (MCD)  
- Conception UI/UX  
- Développement Backend et Frontend  
- Tests fonctionnels  
- Documentation et rédaction du rapport  

---

## ✨ Fonctionnalités principales

### 🔐 Authentification et sécurité
- Connexion / Déconnexion  
- Consultation du profil utilisateur  
- Changement de mot de passe  
- Mot de passe oublié et réinitialisation  
- Authentification sécurisée par **Bearer Token (Laravel Sanctum)**  

### 📄 Gestion des documents judiciaires
- Importation de documents PDF  
- Archivage sécurisé  
- Extraction automatique du texte  
- Suivi du statut d’extraction :
  - `pending`
  - `processing`
  - `done`
  - `failed`
- Recherche multicritère  
- Consultation des détails d’un document  
- Téléchargement des fichiers PDF  

### 🗂️ Référentiels
- Gestion des divisions  
- Gestion des types d’affaires  
- Gestion des juges  

### 👥 Administration
- Gestion des employés  
- Gestion des rôles et permissions  
- Activation et désactivation des comptes  
- Tableau de bord administratif  

---

## 👥 Rôles et permissions

### Utilisateur
- Importer et rechercher des documents  
- Consulter et télécharger les PDF  
- Modifier son mot de passe  
- Consulter les référentiels  

### Administrateur
- Toutes les permissions utilisateur  
- Gestion des employés  
- Gestion des divisions, types d’affaires et juges  
- Supervision des documents  
- Accès au tableau de bord  

### Super Administrateur
- Toutes les permissions administrateur  
- Gestion avancée des comptes  
- Contrôle des accès et des rôles  

---

## 🧱 Technologies utilisées

### Backend
- Laravel (API REST)  
- Laravel Sanctum  
- MySQL  
- Stockage local des fichiers  
- Queue Worker pour l’extraction du texte  

### Frontend
- React.js + Vite  
- React Router  
- Axios  
- Context API  
- Guards de routes (RequireAuth / RequireAdmin)  

---

## 🗃️ Base de données (MySQL)

### Tables principales
- `employees`  
- `documents`  
- `divisions`  
- `case_types`  
- `judges`  
- `activity_logs`  
- `personal_access_tokens`  

---

## 🖼️ Captures d’écran

> Les images doivent être placées dans `docs/screens/`

### Page de connexion
![Login](docs/screens/login.png)

### Mot de passe oublié
![Forgot Password](docs/screens/forgot-password.png)

### Tableau de bord
![Dashboard](docs/screens/dashboard.png)

### Recherche des documents
![Search Documents](docs/screens/documents-search.png)

### Détails d’un document
![Document Details](docs/screens/document-details.png)

### Ajout d’un document
![Upload Document](docs/screens/document-upload.png)

### Gestion des employés
![Employees](docs/screens/admin-employees.png)

### Gestion des divisions
![Divisions](docs/screens/admin-divisions.png)

### Gestion des types d’affaires
![Case Types](docs/screens/admin-case-types.png)

### Gestion des juges
![Judges](docs/screens/admin-judges.png)

---

## 📐 Diagrammes réalisés

- Diagramme de cas d’utilisation  
- Diagramme de classes  
- Diagrammes de séquence  
- Diagramme d’activités  
- Diagramme d’états des documents  
- MCD (Merise)  

---

## 📅 Gestion du projet

Durée du projet : **30 jours**

### Sprint 1 — Analyse et conception
- Analyse fonctionnelle  
- Modélisation UML et Merise  
- Conception UI/UX  

### Sprint 2 — Développement
- Backend Laravel  
- Frontend React  
- Authentification et gestion documentaire  

### Sprint 3 — Tests et documentation
- Tests fonctionnels  
- Corrections des anomalies  
- Rédaction du rapport et préparation de la soutenance  

---

## ⚙️ Installation locale

### Prérequis
- PHP 8.x  
- Composer  
- Node.js 18+  
- MySQL  
- Git  

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan queue:work
php artisan serve
