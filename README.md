# Netix SIRH 2.0 — Système d'Information RH & Moteur de Paie Algérienne

> **Le SIRH d'élite pour l'Algérie : Moteur de paie certifié (Loi 90-11, CIDTA Art. 104, CNAS 9%/26%), Annuaire Collaborateurs 360°, Saisie en cascade temps réel, Contrats, Congés et Guide Réglementaire.**

[![Conformité](https://img.shields.io/badge/Loi%2090--11-Conforme-blue)](/guide)
[![Fiscalité](https://img.shields.io/badge/CIDTA-IRG%202024--2025-emerald)](/guide)
[![Tests Paie](https://img.shields.io/badge/Tests%20Golden-100%25%20Verts-brightgreen)](scripts/test-paie-golden.js)


---

## 0. Règle d'or absolue : Moteur de Paie Intouchable

Le moteur de calcul situé dans `lib/paieCalcul.ts` est validé et certifié conforme à la législation algérienne :
- **Cotisations CNAS** : 9% salariale (Art. 74 Loi n°83-11) et 26% patronale.
- **Base imposable IRG & Barème progressif** : Art. 104 du CIDTA (Loi de Finances 2022/2024) avec zone de transition et abattement légal de 40% (min 1 000 DA, max 1 500 DA).
- **Régularisations & Primes** : Catalogue national Hydrocanal de 402 rubriques.

La suite de tests golden protège l'intégrité du calcul :
```bash
npm run test:paie
```

---

## Architecture de l'Application (6 Entrées Unifiées)

Conformément au cahier des charges de refonte (`NETIX_VISION_REFONTE.md`) :

```
NETIX SIRH
├── 1. Accueil                  Tableau de bord actionnable & alertes d'échéances
├── 2. Équipe                   Annuaire collaborateurs & Contrats de travail (CDI/CDD)
├── 3. Paie                     Assistant de clôture mensuelle, Saisie, États & Déclarations
├── 4. Temps                    Congés légaux (Loi 90-11), Absences & Missions
├── 5. Talents                  Carrière, Échelons, Discipline & Formations
└── (Pied de menu)              Guide Réglementaire, Paramètres généraux & Profil
```

---

## Installation & Démarrage Local

### Prérequis
- **Node.js** 20.x ou 22.x LTS
- Un projet **Supabase** configuré (PostgreSQL)

### 1. Cloner le projet
```bash
git clone https://github.com/kheireddine178/netix-paie.git
cd netix-paie
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez le fichier d'exemple et renseignez vos clés Supabase :
```bash
cp .env.local.example .env.local
```

Variables requises dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### 4. Lancer les tests et le serveur de développement
```bash
# Vérifier la conformité du moteur de paie (10 profils golden)
npm run test:paie

# Lancer l'application
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## Commandes Disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Démarre le serveur local de développement Next.js |
| `npm run build` | Compile l'application pour la production |
| `npm run start` | Lance le serveur en mode production |
| `npm run test:paie` | **Exécute la suite de tests golden du moteur de paie** (10 profils) |
| `npm run lint` | Lance la vérification ESLint du code source |

---

## Documentation Complémentaire

- [Cahier de Refonte & Vision Produit](NETIX_VISION_REFONTE.md)
- [Audit Exhaustif des Routes](docs/AUDIT.md)
- [Règles pour Agents IA](AGENTS.md)
- [Schéma SQL de Base de Données](db/schema_sirh.sql)

---

*Netix SIRH — Conçu et développé pour la gestion des Ressources Humaines en Algérie.*
