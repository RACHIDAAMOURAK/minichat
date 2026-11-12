# MiniChat : démo « Web mobile : Messaging »

Chat temps réel (WebSocket / Socket.IO) avec notifications push (Service Worker + Web Push).
Projet réalisé dans le cadre du cours de développement d'applications mobiles.

## Prérequis
- [Node.js](https://nodejs.org) version 18 ou plus (vérifier avec `node -v`)
- Google Chrome ou Edge (recommandé)

## Lancer la démo

```
git clone https://github.com/RACHIDAAMOURAK/minichat.git
cd minichat
npm install
npm start
```
Sans Git : bouton vert **Code → Download ZIP**, décompresser, ouvrir un terminal dans le dossier, puis `npm install` et `npm start`.

Le terminal affiche `Serveur prêt : http://localhost:3000`.

## Tester
1. Ouvrir `http://localhost:3000` dans **deux onglets** avec deux pseudos différents.
2. Écrire dans un onglet : le message apparaît instantanément dans l'autre.
3. Dans un onglet, cliquer sur **🔔 Notifications** et accepter.
4. Passer sur un autre onglet (pour que le chat soit caché), puis envoyer un message depuis l'autre pseudo : une notification apparaît.
5. Arrêter le serveur (`Ctrl + C`) : le statut passe à « reconnexion… ». Relancer `npm start` puis recharger les onglets (`F5`).

## Tester sur smartphone
- **Chat seulement** : téléphone et PC sur le même Wi-Fi, ouvrir `http://IP_DU_PC:3000` (IP donnée par `ipconfig`).
- **Notifications push** : HTTPS obligatoire. Lancer `npx localtunnel --port 3000` dans un 2e terminal et ouvrir l'adresse https fournie.

## Problèmes fréquents
| Message | Solution |
|---|---|
| `npm n'est pas reconnu` | Installer Node.js, puis rouvrir le terminal |
| `Cannot find module` | Lancer `npm install` dans le bon dossier |
| `EADDRINUSE ... 3000` | Un autre serveur utilise le port : `set PORT=3001` puis `npm start` |
| Pas de notification | Autoriser les notifications dans Chrome (cadenas) et désactiver le mode « Ne pas déranger » de Windows |

## Structure
| Fichier | Rôle |
|---|---|
| `server.js` | Serveur Express + Socket.IO + web-push |
| `public/index.html` | Interface mobile et client WebSocket |
| `public/sw.js` | Service Worker (réception des push) |
| `public/manifest.json` | Application installable (PWA) |