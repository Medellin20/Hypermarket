# Configurer Supabase

Le backend utilise PostgreSQL hébergé par Supabase. Il se connecte directement à PostgreSQL depuis le serveur Node.js ; le navigateur ne reçoit jamais d'identifiants de base de données.

## Mise en route

1. Créez un projet Supabase et récupérez une chaîne de connexion PostgreSQL dans **Project Settings → Database → Connection string**. Utilisez le pooler de connexions si l'environnement de déploiement le demande et gardez `sslmode=require`.
2. Dans **SQL Editor**, exécutez le contenu de [`backend/db/schema.sql`](./backend/db/schema.sql) pour créer les tables et index.
3. Copiez [`backend/.env.example`](./backend/.env.example) vers `backend/.env`, puis renseignez `DATABASE_URL` et une valeur longue, aléatoire et unique pour `JWT_SECRET`. Si le mot de passe PostgreSQL contient des caractères spéciaux, encodez-les pour la chaîne URI.
4. Installez les dépendances avec `npm install --prefix backend` et `npm install --prefix frontend`, puis démarrez l'application depuis `App` avec `npm run dev`.
5. Pour charger les données de démonstration dans un projet vide, lancez `npm run seed --prefix backend`.

Le script `seed` **vide les tables applicatives avant de les repeupler**. Ne l'exécutez jamais sur un projet contenant des données à conserver. Il crée aussi les comptes de démonstration `admin@hypermarket.bj` / `admin123` et `client@hypermarket.bj` / `client123` ; ces mots de passe sont publics et ne doivent pas être utilisés en production.

La configuration ne migre pas automatiquement d'éventuelles données déjà présentes dans l'ancienne base SQLite locale. Exportez et contrôlez ces données avant de les importer dans Supabase.

## Sécurité

- Ne versionnez jamais `backend/.env` et n'exposez pas `DATABASE_URL` ou une clé `service_role` au frontend.
- En production, utilisez un secret JWT distinct, un pooler TLS adapté et un rôle PostgreSQL dédié avec les seuls droits nécessaires.
- L'accès utilisé ici est une connexion PostgreSQL directe depuis le backend ; les politiques RLS de l'API Supabase ne filtrent pas automatiquement ces requêtes SQL.
- Consultez [`SECURITE-PARTENAIRES.md`](./SECURITE-PARTENAIRES.md) pour les exigences de sécurité de l'intégration et des futurs partenaires supermarchés.
