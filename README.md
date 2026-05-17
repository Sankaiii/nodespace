# ◈ NodeSpace

Espace de travail visuel à fiches, synchronisé avec GitHub.  
Inspiré de Blender Shader Editor · Miro · Obsidian.

---

## Fonctionnalités

- **Canvas infini** avec navigation style Blender (clic-molette = pan, scroll = zoom)
- **Fiches (bulles)** avec titre, texte, couleur de contour personnalisable
- **Connexions** entre fiches (cliquer sur les points blancs latéraux)
- **Profils multiples** (onglets) — chacun a son propre canvas
- **Sauvegarde GitHub** : `Ctrl+S` → commit automatique dans ton dépôt `nodespace-data`
- **Chargement hors ligne** : le store local (localStorage) garde la dernière version
- **Thème clair / sombre** (automatique selon le système, modifiable)
- **Fond** : points · quadrillé · lignes · vide (clic-droit sur le fond)
- **Recherche** : `Ctrl+T` → focus caméra sur la fiche trouvée

---

## Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Shift+A` | Ajouter une fiche à la position du curseur |
| `Double-clic` | Éditer une fiche |
| `Ctrl+S` | Sauvegarder sur GitHub |
| `Ctrl+T` | Ouvrir la recherche |
| `Suppr` | Supprimer la fiche / connexion sélectionnée |
| `Clic-molette` + glisser | Déplacer la vue |
| `Scroll` | Zoomer / dézoomer |
| `Clic-droit` sur une fiche | Menu contextuel (couleur, réduire, supprimer) |
| `Clic-droit` sur le fond | Changer le fond / ajouter ici |

---

## Déploiement en 5 minutes

### 1. Fork / clone ce repo

```bash
git clone https://github.com/TON_USERNAME/nodespace.git
cd nodespace
npm install
```

### 2. Tester en local

```bash
npm run dev
# → http://localhost:5173
```

### 3. Déployer sur GitHub Pages

1. Pousse le code sur `main` :
   ```bash
   git add . && git commit -m "init" && git push origin main
   ```

2. Dans **Settings → Pages** de ton repo, sélectionne :
   - Source : **Deploy from a branch**
   - Branch : **gh-pages** / **(root)**

3. Le workflow GitHub Actions se lance automatiquement à chaque push sur `main`.  
   Ton app sera disponible sur :
   ```
   https://TON_USERNAME.github.io/nodespace/
   ```

> ℹ️ La première fois, GitHub Actions génère la branche `gh-pages`.  
> Attends ~2 minutes après le premier push.

---

## Connexion GitHub (authentification)

NodeSpace utilise un **Personal Access Token (PAT)** GitHub.  
Aucun serveur backend, aucun compte NodeSpace — le token reste dans ton navigateur.

1. Va sur [github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=repo&description=NodeSpace)
2. Coche le scope **`repo`** (accès lecture/écriture aux dépôts privés)
3. Génère et copie le token (`ghp_xxxx…`)
4. Colle-le dans NodeSpace au premier lancement

Le token est stocké dans le **localStorage** de ton navigateur — il n'est jamais envoyé ailleurs que l'API officielle `api.github.com`.

---

## Stockage des données

À la première connexion, NodeSpace crée automatiquement un **dépôt privé** `nodespace-data` sur ton compte GitHub.

Structure :
```
nodespace-data/
└── profiles/
    ├── perso/
    │   └── canvas.json   ← tes fiches + connexions
    ├── travail/
    │   └── canvas.json
    └── ...
```

Chaque `Ctrl+S` crée un commit avec un message automatique.  
Tu as donc un **historique Git complet** de toutes tes modifications.

---

## Stack technique

| Partie | Technologie |
|--------|-------------|
| Framework | React 18 + TypeScript |
| Canvas | [React Flow](https://reactflow.dev) v11 |
| State | Zustand (avec persist middleware) |
| Style | Tailwind CSS + CSS variables |
| Build | Vite |
| Auth & stockage | GitHub REST API (PAT) |
| Déploiement | GitHub Pages via GitHub Actions |

---

## Développement local

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run preview  # prévisualiser le build
```

---

## Roadmap

- [ ] Mode offline complet avec sync au retour en ligne
- [ ] Tags `#projet` sur les fiches
- [ ] Vue liste (alternative au canvas)
- [ ] Export PDF / PNG du canvas
- [ ] Liens `[[wiki]]` entre fiches
- [ ] Plugin IA pour suggérer des connexions

---

*Made with ◈ by souanpt*
