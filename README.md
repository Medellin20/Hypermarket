# Hypermarket

Plateforme de courses en ligne qui regroupe les supermarchés de Cotonou.

## Stack technique

Un seul projet Next.js (App Router), avec React, Tailwind CSS et des routes API Next.js. Supabase est l'unique base de données.

## Démarrage local

1. Depuis `App`, copiez `.env.example` vers `.env` et configurez l'URL Supabase, la clé `anon` et la clé `service_role` (voir [App/SUPABASE.md](./App/SUPABASE.md)).
2. Depuis `App`, installez les dépendances avec `npm install`.
3. Lancez l'application avec `npm run dev`.

Pages et API sont servies ensemble sur `http://localhost:3000`.

## Déploiement Netlify

Connectez le dépôt Git au site Netlify. Le fichier `netlify.toml` à la racine définit
le dossier de base `App`, la commande `npm run build`, le dossier de publication
`.next`, Node.js 22 et le moteur Next.js de Netlify. Ce moteur est nécessaire pour
servir les pages et les routes `/api/*` ; un dépôt manuel du dossier `.next` ne
constitue pas un déploiement Next.js fonctionnel.

Dans les variables d'environnement du site Netlify, configurez
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
`SUPABASE_SERVICE_ROLE_KEY` pour la compilation et les fonctions. Ne mettez jamais
la clé `service_role` dans une variable `NEXT_PUBLIC_*`.

Relancez ensuite un déploiement depuis le dépôt, avec suppression du cache si
nécessaire. Vérifiez dans le journal que `@netlify/plugin-nextjs` s'exécute, puis
contrôlez `/`, `/connexion` et `/api/supermarkets` sur l'URL de production. Une
404 Netlify sur `/` indique un problème de publication ou de routage ; consultez
les journaux de compilation et les fichiers du déploiement publié.
