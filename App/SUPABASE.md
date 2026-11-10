# Configurer Supabase

Supabase est l'unique base de données persistante de l'application. Le serveur Express accède aux tables par l'API Supabase et gère les sessions avec Supabase Auth ; le navigateur ne reçoit jamais la clé `service_role`. Le panier conservé dans le navigateur n'est pas une base de données.

## Mise en route

1. Créez un projet Supabase et récupérez l'URL du projet, la clé `anon` et la clé `service_role` dans **Project Settings → API**.
2. Dans **SQL Editor**, exécutez le contenu de [`server/db/schema.sql`](./server/db/schema.sql) pour créer les tables, index et fonctions RPC nécessaires.
3. Copiez `.env.example` en `.env`, puis renseignez `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. Gardez la clé `service_role` côté serveur et ne la versionnez jamais.
4. Depuis le dossier `App`, installez les dépendances avec `npm install`, puis lancez `npm run dev`. Les pages et l'API sont disponibles ensemble sur `http://localhost:3000`.
5. Pour charger les données de démonstration dans un projet vide, lancez `npm run seed`.

Le script `seed` **vide les tables applicatives et supprime les utilisateurs Auth liés avant de les repeupler**. Ne l'exécutez jamais sur un projet contenant des données à conserver. Il crée aussi les comptes de démonstration `admin@hypermarket.bj` / `admin123` et `client@hypermarket.bj` / `client123` ; ces mots de passe sont publics et ne doivent pas être utilisés en production.

Les anciens comptes avec mot de passe local ne sont pas automatiquement transférés vers Supabase Auth. Les utilisateurs concernés doivent recréer leur compte ou réinitialiser leur accès. Les anciens fichiers SQLite locaux, s'ils existent, ne sont pas utilisés ni migrés automatiquement.

## Sécurité

- Ne versionnez jamais `.env` et n'exposez jamais `SUPABASE_SERVICE_ROLE_KEY` au navigateur : cette clé contourne les politiques RLS.
- Toutes les opérations de données privilégiées sont effectuées côté serveur. Les fonctions RPC d'écriture transactionnelle sont réservées au rôle `service_role`.
- Consultez les politiques RLS avant d'ajouter un accès direct depuis le client ; ne mettez pas la clé `service_role` dans une variable accessible au navigateur.
- Consultez [`SECURITE-PARTENAIRES.md`](./SECURITE-PARTENAIRES.md) pour les exigences de sécurité de l'intégration et des futurs partenaires supermarchés.
