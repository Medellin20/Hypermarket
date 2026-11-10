# Hypermarket

Plateforme de courses en ligne qui regroupe les supermarchés de Cotonou.

## Stack technique

Un seul projet Next.js (App Router), avec React, Tailwind CSS et des routes API Next.js. Supabase est l'unique base de données.

## Démarrage local

1. Depuis `App`, copiez `.env.example` vers `.env` et configurez l'URL Supabase, la clé `anon` et la clé `service_role` (voir [App/SUPABASE.md](./App/SUPABASE.md)).
2. Depuis `App`, installez les dépendances avec `npm install`.
3. Lancez l'application avec `npm run dev`.

Pages et API sont servies ensemble sur `http://localhost:3000`.
