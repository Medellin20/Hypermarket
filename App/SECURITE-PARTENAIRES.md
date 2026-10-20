# Socle de sécurité des connexions partenaires

Ce document définit les exigences minimales à respecter avant de connecter HyperMarket aux systèmes d'un supermarché. Il sert de base aux échanges techniques, à l'évaluation du partenaire et aux engagements contractuels. Une connexion ne doit pas être activée tant que les contrôles applicables ne sont pas validés.

> **État actuel du projet :** la persistance applicative est configurée pour PostgreSQL hébergé par Supabase. Les connexions aux bases de données des supermarchés ne sont pas encore implémentées. Les exigences ci-dessous décrivent le socle à mettre en place ; elles ne signifient pas que les connexions partenaires sont déjà actives.

## 1. Architecture et accès aux données

1. **Privilégier une API partenaire documentée** ou un mécanisme d'échange de fichiers sécurisé. Ne demander un accès direct à une base de données que si aucune interface plus sûre n'est disponible et après accord des deux équipes techniques.
2. **Ne jamais connecter le navigateur ou l'application frontend directement à une base partenaire.** Les échanges passent par le backend HyperMarket.
3. **Isoler les intégrations :** utiliser un connecteur et une configuration distincts par partenaire. Une panne ou un incident chez un partenaire ne doit pas donner accès aux données d'un autre.
4. **Limiter les données échangées** aux champs nécessaires au service convenu (par exemple catalogue, prix, disponibilité et statut de commande). Ne pas aspirer une base complète.
5. **Définir le sens des échanges et la source de référence** pour chaque donnée : lecture seule par défaut ; toute écriture dans le système du partenaire nécessite une autorisation explicite et un mécanisme de rapprochement.
6. **Séparer les environnements** de développement, de test et de production. Les environnements de test utilisent des données fictives ou anonymisées et des comptes distincts.
7. **Pour Supabase, garder la chaîne de connexion PostgreSQL côté backend uniquement.** Ne jamais exposer `DATABASE_URL`, le mot de passe de base de données ou une clé `service_role` dans le frontend. Utiliser TLS et le pooler de connexions recommandé pour l'hébergement.
8. **Configurer les permissions PostgreSQL explicitement.** L'accès direct PostgreSQL depuis le backend ne passe pas par les politiques RLS de l'API Supabase ; utiliser un rôle dédié aux permissions minimales, et ne pas supposer que RLS protège les requêtes faites avec un rôle privilégié.

## 2. Identités, authentification et autorisations

1. Fournir à chaque partenaire une identité technique propre, nominative au système et révocable ; ne jamais partager un compte entre partenaires.
2. Accorder le **moindre privilège** : compte de base de données en lecture seule, limité au schéma, aux tables ou aux vues nécessaires. Interdire les droits d'administration, de création de comptes et de modification du schéma.
3. Pour les API, utiliser un mécanisme convenu et robuste (par exemple OAuth 2.0 avec credentials de service, ou certificats mutuels). Refuser les identifiants par défaut et les clés permanentes sans expiration ni rotation.
4. Protéger les comptes d'administration HyperMarket par authentification multifacteur (MFA), contrôle d'accès par rôle et révocation immédiate lors d'un départ ou d'un changement de fonction.
5. Vérifier l'autorisation pour chaque opération et chaque partenaire côté serveur. Un identifiant de partenaire fourni par le client ne constitue jamais une preuve d'autorisation.
6. Prévoir la révocation d'urgence des comptes, clés et certificats, avec un contact technique joignable de chaque côté.

## 3. Réseau et protection des secrets

1. Chiffrer tous les échanges sur des canaux sécurisés (TLS à jour ; VPN ou réseau privé lorsque cela est adapté). Refuser les certificats invalides et ne pas désactiver leur vérification.
2. Restreindre les connexions entrantes et sortantes aux adresses, ports, services et environnements explicitement autorisés. Ne pas exposer une base de données sur Internet.
3. Stocker mots de passe, clés et certificats dans un gestionnaire de secrets adapté à la production ; ne jamais les placer dans le code, le dépôt, les journaux, les tickets ou le frontend.
4. Utiliser des secrets distincts par environnement et partenaire. Limiter leur durée de vie, tracer leur accès et les renouveler selon un calendrier convenu ou immédiatement en cas de suspicion de compromission.
5. Réduire la surface exposée du backend : n'ouvrir que les routes nécessaires, appliquer des limites de débit et configurer des délais d'expiration et des limites de taille pour les requêtes.

## 4. Données et sécurité applicative

1. Définir avant l'intégration les catégories de données, leur finalité, leur propriétaire, leur durée de conservation et les personnes autorisées à y accéder.
2. Protéger les données sensibles par chiffrement en transit et au repos, y compris les sauvegardes, selon les capacités de l'infrastructure et une gestion séparée des clés.
3. Utiliser des requêtes paramétrées ; valider et normaliser les entrées ; encoder les sorties ; ne jamais construire une requête SQL en concaténant des données reçues.
4. Valider les réponses de l'intégration (format, champs, types, taille et fraîcheur). Rejeter les données inattendues et traiter les erreurs sans divulguer d'identifiants ni de détails internes.
5. Séparer strictement les données par partenaire à chaque lecture, écriture, recherche, export et tâche en arrière-plan. Tester explicitement les tentatives d'accès inter-partenaire.
6. Ne pas journaliser les mots de passe, tokens, clés, données de paiement ni données personnelles non nécessaires. Masquer les identifiants et données sensibles dans les journaux.
7. Utiliser des bibliothèques maintenues, appliquer les mises à jour de sécurité et faire examiner les changements touchant l'authentification, les autorisations et les intégrations.

## 5. Sauvegardes, disponibilité et continuité

1. Définir avec chaque partenaire les objectifs de disponibilité, les fenêtres de maintenance, les limites d'appels et les modalités de support.
2. Rendre les synchronisations idempotentes, détecter les doublons et erreurs, et prévoir une reprise contrôlée après interruption sans écraser de données valides.
3. Appliquer des délais d'attente, des tentatives limitées avec temporisation et des mécanismes de protection contre les pannes en cascade.
4. Sauvegarder les données HyperMarket de façon chiffrée, limiter l'accès aux sauvegardes et tester régulièrement leur restauration.
5. Définir une procédure de suspension d'une intégration en cas de données incohérentes, de comportement anormal ou d'incident de sécurité.

## 6. Journalisation, surveillance et incidents

1. Conserver une piste d'audit horodatée des connexions, opérations sensibles, changements de droits et synchronisations : acteur ou compte de service, partenaire concerné, action, résultat et identifiant de corrélation.
2. Protéger les journaux contre l'accès non autorisé et l'altération ; limiter leur conservation à une durée définie. Les journaux ne doivent pas contenir de secrets.
3. Surveiller les échecs d'authentification, changements inhabituels de volume, erreurs répétées, accès hors horaires attendus et anomalies de synchronisation.
4. Documenter un plan de réponse aux incidents : contacts des deux parties, confinement, révocation des accès, préservation des preuves, évaluation de l'impact, notification et retour à la normale.
5. Informer le partenaire dans les délais prévus au contrat et par la réglementation applicable en cas d'incident affectant ses données ou son service.

## 7. Engagements à convenir avec chaque partenaire

Avant la mise en production, formaliser par écrit :

- les systèmes, environnements, données et finalités autorisés ;
- le propriétaire et le responsable opérationnel de chaque donnée ;
- le protocole, les mécanismes d'authentification, les plages réseau et les contacts techniques ;
- les responsabilités de sécurité de chaque partie, les sous-traitants éventuels et les règles de confidentialité ;
- les délais de conservation, de suppression, d'export et de restitution des données à la fin du partenariat ;
- les engagements de disponibilité, de support, de maintenance et de correction des vulnérabilités ;
- les délais et canaux de notification des incidents ;
- les modalités d'audit raisonnables et la fréquence de revue des accès.

Les obligations relatives aux données personnelles doivent être évaluées selon les lois applicables au Bénin et aux pays où résident les partenaires ou les utilisateurs. En cas de doute, obtenir un avis juridique avant le transfert ou le traitement.

## 8. Liste de contrôle avant activation

- [ ] Partenaire, propriétaire des données et contacts d'urgence identifiés.
- [ ] Périmètre, finalités et champs nécessaires approuvés par les deux parties.
- [ ] API ou canal sécurisé retenu ; accès direct à la base justifié si applicable.
- [ ] Compte dédié, permissions minimales et accès de production distincts des tests.
- [ ] TLS vérifié ; règles réseau limitées aux destinations nécessaires.
- [ ] Secrets stockés hors du dépôt et procédure de rotation/révocation testée.
- [ ] Séparation des données entre partenaires testée.
- [ ] Journaux d'audit, alertes, délais d'attente et limites d'appels configurés.
- [ ] Procédure de reprise, sauvegarde et réponse aux incidents documentée.
- [ ] Accord écrit signé ; responsables techniques et opérationnels ont validé la mise en production.
