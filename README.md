# TPI — Tribunal PDF Indexing Application

TPI est une application web développée pour la gestion, l’indexation
et la recherche de documents judiciaires au format PDF.
Elle permet aux utilisateurs d’un tribunal de centraliser les documents,
de les rechercher facilement et de gérer les accès selon les rôles.

---

## 📌 Contexte du projet

Ce projet a été réalisé dans le cadre d’un **stage** au sein d’un tribunal.
Il couvre l’ensemble du cycle de développement d’une application :
analyse, conception, développement, tests et documentation.

La gestion du projet a été assurée à l’aide de **Jira (Scrum & Kanban)**,
avec une planification globale réalisée via un **diagramme de Gantt**.

---

## 🧱 Technologies utilisées

### Backend
- Laravel (API REST)
- Authentification par token (Sanctum)
- MySQL
- Stockage local des fichiers PDF

### Frontend
- React.js + Vite
- React Router
- Axios
- Context API (AuthContext)

---

## 👥 Rôles et permissions

### Utilisateur
- Authentification
- Recherche de documents
- Consultation des détails
- Téléchargement de documents PDF
- Consultation des référentiels (divisions, types d’affaires, juges)

### Administrateur
- Toutes les permissions utilisateur
- Gestion des employés
- Gestion des divisions
- Gestion des types d’affaires
- Gestion des juges

### Super Administrateur
- Toutes les permissions administrateur
- Activation / désactivation des comptes

---

## ✨ Fonctionnalités principales

- Authentification sécurisée
- Gestion des documents PDF
- Recherche multicritères
- Suivi du statut des documents
- Gestion des utilisateurs et référentiels
- Interface simple et intuitive

---

## 📄 Pages de l’application (avec captures d’écran)

### 🔐 Page de connexion
Permet aux utilisateurs de s’authentifier pour accéder à l’application.

![Login](docs/screens/login.png)

---

### 🔑 Mot de passe oublié
Permet à l’utilisateur de demander la réinitialisation de son mot de passe.

![Forgot Password](docs/screens/forgot-password.png)

---

### 📊 Tableau de bord
Affiche une vue globale de l’application et un accès rapide aux fonctionnalités.

![Dashboard](docs/screens/dashboard.png)

---

### 🔎 Recherche des documents
Permet de rechercher les documents selon différents critères.

![Search Documents](docs/screens/documents-search.png)

---

### 📄 Détails d’un document
Affiche les informations détaillées d’un document avec possibilité de téléchargement.

![Document Details](docs/screens/document-details.png)

---

### ⬆️ Ajout d’un document
Permet l’importation de documents PDF dans le système.

![Upload Document](docs/screens/document-upload.png)

---

### 👥 Gestion des employés
Interface réservée à l’administrateur pour gérer les comptes utilisateurs.

![Employees](docs/screens/admin-employees.png)

---

### ➕ Ajout d’un employé
Permet à l’administrateur d’ajouter un nouvel employé.

![Add Employee](docs/screens/add-employees.png)

---

### 🏢 Gestion des divisions
Gestion des divisions judiciaires.

![Divisions](docs/screens/admin-divisions.png)

---

### ⚖️ Gestion des types d’affaires
Gestion des types de dossiers judiciaires.

![Case Types](docs/screens/admin-case-types.png)

---

### 👨‍⚖️ Gestion des juges
Gestion des juges du tribunal.

![Judges](docs/screens/admin-judges.png)

---

## 📅 Gestion du projet

Le projet a été planifié sur une durée de **30 jours**, répartis en trois sprints :

- **Sprint 1 : Analyse & Conception**
  - Analyse fonctionnelle
  - Diagrammes UML
  - Modélisation des données (Merise)
  - Maquettes UI/UX (Figma)

- **Sprint 2 : Développement**
  - Backend (Laravel)
  - Frontend (React)
  - Authentification et gestion des documents

- **Sprint 3 : Tests & Documentation**
  - Tests fonctionnels
  - Corrections
  - Rédaction du rapport
  - Préparation de la soutenance

---

## 📌 Diagrammes réalisés

- Diagramme de cas d’utilisation
- Diagramme de classes
- Diagrammes de séquence
- Diagramme d’état des documents
- Diagramme d’activité
- MCD (Merise)

---

## 📝 Conclusion

Cette application permet une gestion efficace et sécurisée des documents
judiciaires tout en facilitant le travail quotidien des utilisateurs.
Le projet a été mené en respectant une méthodologie agile et une
organisation structurée du travail.

---

## 📜 Licence
Projet réalisé dans un cadre académique (stage).
