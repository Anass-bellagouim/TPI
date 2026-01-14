# TPI — Tribunal PDF Indexing Application

TPI est une application web conçue pour aider un **tribunal** à gérer, indexer et rechercher des documents judiciaires au format **PDF**.
Elle permet la centralisation des documents, le suivi de leur statut d’extraction et une gestion fine des accès selon les **rôles utilisateurs**.

---

## 📌 Contexte du projet (Stage)

Ce projet a été réalisé dans le cadre d’un **stage** au sein d’un tribunal.
Il couvre l’ensemble du cycle de développement logiciel :

* Analyse fonctionnelle et recueil des besoins
* Modélisation (UML + Merise / MCD)
* Conception UI/UX (Figma)
* Développement Backend (Laravel API)
* Développement Frontend (React + Vite)
* Tests fonctionnels et corrections de bugs
* Gestion de projet avec **Jira (Scrum & Kanban)** et planification via **diagramme de Gantt**

---

## ✨ Fonctionnalités principales

### 🔐 Authentification & Sécurité

* Connexion / Déconnexion
* Consultation du profil (Me)
* Changement de mot de passe
* Mot de passe oublié / Réinitialisation
* Authentification par **Bearer Token (Laravel Sanctum)**

### 📄 Gestion des documents PDF

* Importation de documents PDF
* Stockage des fichiers et métadonnées
* Indexation du contenu textuel
* Suivi du statut d’extraction :

  * `pending`
  * `processing`
  * `done`
  * `failed`
* Recherche multicritères
* Consultation des détails d’un document
* Téléchargement des fichiers PDF

### 🗂️ Référentiels (Lookups)

* Divisions
* Types d’affaires
* Juges

### 👥 Gestion administrative

* Gestion des employés (CRUD utilisateurs standards)
* Gestion des divisions, types d’affaires et juges
* Tableau de bord avec indicateurs (si activé)

---

## 👥 Rôles et permissions

### Utilisateur

* Authentification
* Import et recherche de documents
* Consultation des détails
* Téléchargement de PDF
* Consultation des référentiels

### Administrateur

* Toutes les permissions utilisateur
* Gestion des employés
* Gestion des divisions
* Gestion des types d’affaires
* Gestion des juges
* Accès au tableau de bord

### Super Administrateur

* Toutes les permissions administrateur
* Activation / désactivation des comptes
* Restrictions :

  * Un administrateur ne peut pas se désactiver lui-même
  * Un administrateur ne peut pas désactiver un Super Admin

---

## 🧱 Technologies utilisées

### Backend

* Laravel (API REST)
* Laravel Sanctum (Personal Access Tokens)
* MySQL
* Stockage local des fichiers PDF

### Frontend

* React.js + Vite
* React Router
* Axios
* Context API (AuthContext)
* Guards de routes (RequireAuth / RequireAdmin)

---

## 🗃️ Base de données (MySQL)

### Tables principales

* `users`
* `documents`
* `divisions`
* `case_types`
* `judges`
* `personal_access_tokens` (Sanctum)

### Table `documents` (champs clés)

* `file_path`
* `original_filename`
* `content_text`
* `status`
* `extract_status` (pending / processing / done / failed)
* `extract_error`

---

## 📄 Pages de l’application

### 🔐 Connexion

Authentification des utilisateurs.

### 🔑 Mot de passe oublié

Demande de réinitialisation du mot de passe.

### 📊 Tableau de bord

Vue globale et accès rapide aux fonctionnalités.

### 🔎 Recherche de documents

Recherche multicritères dans les documents indexés.

### 📄 Détails d’un document

Informations complètes avec option de téléchargement.

### ⬆️ Import de document

Ajout de documents PDF au système.

### 👥 Gestion des employés

Gestion des comptes utilisateurs (Admin).

### 🏢 Gestion des divisions

Administration des divisions judiciaires.

### ⚖️ Gestion des types d’affaires

Administration des types de dossiers.

### 👨‍⚖️ Gestion des juges

Administration des juges du tribunal.

---

## 📅 Gestion du projet

Le projet s’est déroulé sur **30 jours**, répartis en trois sprints :

### Sprint 1 – Analyse & Conception

* Analyse fonctionnelle
* Diagrammes UML
* Modélisation Merise (MCD)
* Maquettes UI/UX (Figma)

### Sprint 2 – Développement

* Backend (Laravel API)
* Frontend (React)
* Authentification et gestion des documents

### Sprint 3 – Tests & Documentation

* Tests fonctionnels
* Corrections
* Rédaction du rapport
* Préparation de la soutenance

---

## 📐 Diagrammes réalisés

* Diagramme de cas d’utilisation
* Diagramme de classes
* Diagrammes de séquence
* Diagramme d’état des documents
* Diagramme d’activité
* MCD (Merise)

---

## ⚙️ Installation et configuration (Local)

### Prérequis

* PHP 8.x
* Composer
* Node.js 18+
* MySQL
* Git

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

php artisan migrate --seed
php artisan storage:link
php artisan queue:work
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev -- --host
```

Variable d’environnement :

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 📝 Conclusion

TPI est une application complète et sécurisée permettant une gestion efficace des documents judiciaires.
Elle améliore l’organisation interne du tribunal, facilite la recherche documentaire et applique une gestion rigoureuse des accès utilisateurs.

Le projet a été mené selon une **méthodologie agile**, avec une structuration claire du travail et une séparation nette entre backend et frontend.

---

## 📜 Licence

Projet réalisé dans un **cadre académique (stage)**.
