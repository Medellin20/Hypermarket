# HyperMarket Cotonou — Dossier de Confiance Partenaires

**Sécurité des données, protection de la vie privée et conditions du pilote**
À l'attention des propriétaires et directions de supermarchés partenaires — Cotonou, Bénin — 20 octobre 2026
*Document de travail. Les pièces contractuelles (sections 5 et 6) sont des projets à faire valider par un conseil juridique au Bénin avant signature. Les champs entre [crochets] sont à compléter.*

---

## Sommaire du dossier

1. Lettre de présentation
2. Ce que HyperMarket demande — et ce qu'elle ne demandera jamais
3. Architecture et sécurité des données
4. Nos engagements de protection des données
5. Conditions du pilote (projet)
6. Projet d'accord de traitement des données
7. Liste de contrôle avant activation
8. Questions fréquentes du propriétaire

**Principe directeur, valable pour tout le dossier :** aucune connexion, aucun flux de données et aucune commande réelle ne seront activés tant que les contrôles de la liste de la section 7 n'auront pas été validés conjointement par HyperMarket et par le supermarché partenaire. La confiance ne se déclare pas ; elle se vérifie.

---

## 1. Lettre de présentation

À l'attention de la Direction de **[Nom du supermarché]**
**[Adresse]**, Cotonou

Madame, Monsieur,

HyperMarket Cotonou construit un service de commande en ligne et de livraison adossé aux supermarchés de Cotonou, en commençant par un pilote de 60 jours dans le quartier d'Akpakpa. Nous vous proposons d'être le supermarché partenaire de ce pilote.

Nous savons ce qu'une telle proposition vous demande réellement : vos prix, vos stocks, vos ventes et vos clients sont le cœur de votre entreprise. Aucun discours commercial ne suffit à protéger ces actifs — seuls des mécanismes techniques vérifiables, des engagements contractuels écrits et une discipline de règlement sans faille le peuvent.

Ce dossier rassemble donc, avant toute discussion commerciale :

- l'architecture technique de protection de vos données, et la manière dont elle empêche tout autre partenaire — y compris un concurrent direct — d'accéder à vos informations ;
- nos engagements écrits sur la propriété, l'usage et la restitution de vos données ;
- les conditions complètes du pilote, y compris la commission, le rythme de règlement et votre droit de sortie ;
- le projet d'accord de traitement des données qui nous liera, et la liste de contrôle que nous signerons ensemble avant l'activation.

Nous vous invitons à faire examiner ce dossier par votre propre conseil et par votre responsable informatique. Leurs questions sont les bienvenues : ce dossier est fait pour y répondre.

**[Nom du signataire]**
**[Fonction]** — HyperMarket Cotonou
**[Raison sociale / RCCM / IFU — à compléter]**
**[Téléphone / WhatsApp] — [E-mail]**

---

## 2. Ce que HyperMarket demande — et ce qu'elle ne demandera jamais

La protection commence par la limitation : nous ne collectons que ce que la commande exige.

| Données demandées (strict nécessaire) | Finalité unique |
|---|---|
| Catalogue des produits vendus via la plateforme : nom, marque, prix fixé par le magasin, stock disponible, photo | Affichage, commande, facturation |
| Commandes passées dans votre magasin via la plateforme : produits, quantités, montant | Préparation, livraison, règlement |
| Coordonnées du client *de la commande concernée* : nom, téléphone, adresse de livraison | Livraison de cette commande uniquement |
| Coordonnées bancaires / Mobile Money du magasin pour les reversements | Règlement des ventes, selon le rythme convenu |

**Ce que HyperMarket ne demandera jamais :**

- un accès direct et permanent à votre base de données ou à votre logiciel de caisse — toute synchronisation se fait par le portail partenaire, par fichier contrôlé ou par une interface dédiée et journalisée ;
- votre fichier clients historique, vos marges, vos prix d'achat ou vos conditions fournisseurs — ces informations ne regardent que vous ;
- vos identifiants, mots de passe ou codes d'accès à quelque système que ce soit ;
- une exclusivité sur votre magasin — l'exclusivité de zone du pilote vous est *accordée*, elle ne vous est pas *imposée* en retour.

---

## 3. Architecture et sécurité des données

### 3.1 Comment les données circulent

Le client commande sur WhatsApp ou sur le site HyperMarket. La commande arrive dans le **portail partenaire de votre magasin** — et nulle part ailleurs. Votre équipe confirme la disponibilité, prépare la commande, et le livreur la remet au client contre un code de confirmation. Le paiement du client est encaissé par un agrégateur de paiement béninois agréé ; HyperMarket calcule la répartition (vente, commission, livraison) dans un registre de règlement traçable, puis vous reverse votre part au rythme convenu, avec un relevé détaillé.

À aucun moment le navigateur du client, l'application ou un autre partenaire ne touche directement votre espace de données : tous les échanges passent par le serveur HyperMarket, qui vérifie, pour chaque opération, l'identité et les droits de l'utilisateur.

### 3.2 Hébergement cloud

- Base de données hébergée sur **Supabase** (PostgreSQL), infrastructure reposant sur des centres de données certifiés (SOC 2 Type II, ISO 27001 au niveau de l'infrastructure). *Précision d'honnêteté :* ces certifications couvrent l'infrastructure de l'hébergeur ; la sécurité de l'application elle-même relève de la responsabilité d'HyperMarket, selon le modèle de responsabilité partagée — c'est l'objet des sections 3.3 à 3.5.
- La région d'hébergement choisie est **[Union européenne — à confirmer dans l'accord signé]**. Elle est déclarée au partenaire ; tout transfert de données hors du Bénin est couvert par l'accord de la section 6 et par la déclaration auprès de l'APDP.
- Chiffrement des échanges en transit (TLS) ; chiffrement des données au repos et des sauvegardes par l'hébergeur.
- Environnements de **test et de production totalement séparés** ; les tests n'utilisent jamais vos données réelles.
- **Sauvegardes automatiques** et restauration à un instant donné sur le plan de production, avec un **test de restauration effectué et documenté avant l'activation**, puis renouvelé périodiquement.

### 3.3 Isolation entre partenaires — le point central

La plateforme accueillera demain vos concurrents. L'architecture est donc construite pour que cette cohabitation soit sans risque :

- chaque donnée partenaire (produit, prix, stock, commande, règlement) est rattachée à un seul supermarché, et ce rattachement est **vérifié côté serveur à chaque lecture, écriture, recherche et export** — jamais sur la seule base d'une information envoyée par l'utilisateur ;
- votre portail ne peut afficher que vos données ; un test d'accès croisé (tentative délibérée d'accéder aux données d'un autre partenaire) fait partie de la liste de contrôle d'activation (section 7) ;
- les comptes techniques sont distincts par partenaire et révocables individuellement ; une panne ou un incident chez un partenaire ne donne accès aux données d'aucun autre ;
- même au sein d'HyperMarket, l'accès à vos données est limité aux personnes qui en ont besoin pour exploiter le service, et chaque accès sensible est journalisé (section 3.5).

### 3.4 Comptes et accès

- Authentification par mot de passe robuste, haché (bcrypt) ; **double authentification (MFA) obligatoire** pour les comptes administrateurs HyperMarket et les responsables partenaires ;
- limitation des tentatives de connexion et alertes en cas d'échecs répétés ;
- comptes nominatifs, jamais partagés ; révocation immédiate en cas de départ ou de changement de fonction, chez HyperMarket comme chez le partenaire ;
- secrets et clés stockés dans un gestionnaire dédié, jamais dans le code source ni dans des documents partagés ; identifiants distincts par environnement et par partenaire, renouvelés périodiquement et immédiatement en cas de suspicion.

### 3.5 Journalisation et incidents

- **Journal d'audit horodaté** des connexions, consultations sensibles, exports, changements de prix et de droits : qui, quel partenaire, quelle action, quel résultat. Vous pouvez demander à tout moment l'historique des accès à vos données.
- Les journaux ne contiennent jamais de mots de passe, de clés ni de données de paiement.
- **Plan de réponse aux incidents écrit** : confinement, révocation des accès, préservation des preuves, évaluation d'impact, notification au partenaire concerné et, lorsque des données personnelles sont touchées, notification à l'**APDP** conformément au Code du numérique — sans délai injustifié.
- Surveillance des signaux anormaux : échecs d'authentification répétés, volumes inhabituels, accès hors horaires attendus.

### 3.6 Paiements

- Les paiements en ligne sont traités par un **agrégateur béninois** (FedaPay ou Kkiapay, en cours d'évaluation comparative ; l'agrégateur retenu sera nommé dans l'accord signé). HyperMarket ne stocke **aucun** numéro de carte ni code Mobile Money.
- Le paiement n'est encaissé définitivement qu'après **confirmation de disponibilité par votre magasin** ; en cas d'indisponibilité, le client choisit une substitution ou est remboursé selon la procédure écrite.
- Chaque reversement est accompagné d'un **relevé** : commandes, montants, commission, ajustements — chaque franc est traçable de la commande au règlement.

---

## 4. Nos engagements de protection des données

HyperMarket s'engage, par écrit dans l'accord de la section 6, à :

1. **Propriété.** Vos données (catalogue, prix, ventes réalisées via la plateforme) restent votre propriété. Celles des clients restent soumises aux droits des personnes concernées.
2. **Finalité unique.** Vos données ne sont traitées que pour exécuter les commandes, les livraisons et les règlements liés à votre magasin.
3. **Aucune vente, aucun partage.** Vos données ne seront ni vendues, ni cédées, ni montrées à un autre partenaire, à un concurrent ou à un tiers à des fins commerciales.
4. **Aucun usage concurrentiel.** HyperMarket n'utilisera pas vos prix ou vos ventes pour conseiller, tarifer ou promouvoir un magasin concurrent.
5. **Vos clients restent vos clients.** Le nom de votre magasin figure sur la commande, le reçu et la livraison. Les données clients recueillies via vos commandes ne seront pas utilisées pour promouvoir un autre supermarché.
6. **Minimisation.** Seules les données de la section 2 sont collectées ; le livreur ne voit le téléphone et l'adresse du client que pour la durée de sa livraison.
7. **Conservation limitée.** Durées de conservation définies dans l'accord ; au-delà, les données sont supprimées ou anonymisées.
8. **Restitution et suppression.** À la fin du partenariat, vos données vous sont restituées dans un format courant, puis supprimées de nos systèmes, avec attestation écrite.
9. **Droits des personnes.** Les clients disposent de leurs droits d'accès, de rectification, d'opposition et d'effacement, conformément au Livre V du Code du numérique ; HyperMarket traite ces demandes et vous informe de celles qui concernent votre magasin.
10. **Conformité déclarée.** Le traitement fait l'objet d'une déclaration auprès de l'**APDP** (Autorité de Protection des Données à caractère Personnel) ; un responsable de la protection des données est nommé et joignable : **[Nom / contact — à compléter]**.

---

## 5. Conditions du pilote (projet)

| Élément | Condition proposée |
|---|---|
| Durée | 60 jours à compter de l'activation, renouvelable par écrit |
| Zone | Akpakpa (Cotonou) — exclusivité de zone accordée au magasin pendant le pilote |
| Commission | 5 % du montant des ventes réalisées via la plateforme pendant le pilote ; revue ensuite uniquement par écrit, selon des paliers de volume convenus |
| Frais de service client | 500 FCFA par commande, payés par le client, affichés avant validation |
| Livraison | Payée par le client, offerte à partir de 25 000 FCFA dans la zone ; deux créneaux programmés par jour |
| Prix | Fixés librement et uniquement par le magasin |
| Règlement | Reversement à J+2 ou hebdomadaire (au choix du magasin à la signature), relevé automatique à chaque période ; **un règlement en retard donne au magasin le droit de suspendre immédiatement le canal** |
| Abonnement | Aucun pendant le pilote |
| Préparation des commandes | Par le personnel du magasin, sur les créneaux convenus (ramassage groupé, confirmation sous 15 minutes au créneau) |
| Marketing de lancement | Matériel en magasin fourni par HyperMarket ; offre de lancement : première commande, 1 000 FCFA offerts à partir de 7 500 FCFA d'achat, financée à 50/50, dates fixes |
| Sortie | Chaque partie peut mettre fin au pilote avec un préavis de 7 jours, sans pénalité ; restitution et suppression des données selon la section 6 |
| Revue | Réunion hebdomadaire de 30 minutes : commandes, exécution, règlements, catalogue |

---

## 6. Projet d'accord de traitement des données

**Entre :** HyperMarket Cotonou — **[Raison sociale]**, RCCM **[n°]**, IFU **[n°]**, siège **[adresse]**, représentée par **[nom, fonction]** (ci-après « HyperMarket », le *sous-traitant* au sens du présent accord),
**Et :** **[Nom du supermarché]**, **[forme juridique]**, RCCM **[n°]**, siège **[adresse]**, représenté par **[nom, fonction]** (ci-après « le Partenaire », le *responsable de traitement* pour ses données).
Ensemble, « les Parties ». Le présent projet accompagne le contrat pilote ; en cas de contradiction sur les données, le présent accord prévaut.

**Article 1 — Objet.** Le présent accord organise le traitement des données confiées par le Partenaire à HyperMarket, et des données personnelles des clients recueillies à l'occasion des commandes, aux seules fins d'exploitation du service de commande et de livraison décrit au contrat pilote.

**Article 2 — Nature des données.** (a) Données du Partenaire : catalogue, prix, stocks, commandes et règlements du Partenaire. (b) Données personnelles clients : identité, téléphone, adresse de livraison et historique de commandes, limitées aux commandes du Partenaire. Aucune donnée de paiement (carte, codes) n'est stockée par HyperMarket.

**Article 3 — Propriété et finalité.** Les données du Partenaire restent sa propriété exclusive. HyperMarket ne les traite que sur instruction du contrat et du présent accord, pour les finalités de l'article 1. Toute autre utilisation — notamment commerciale, statistique nominative ou au bénéfice d'un tiers ou d'un autre partenaire — est interdite.

**Article 4 — Confidentialité et isolation.** HyperMarket applique l'isolation technique décrite à la section 3.3 du dossier (rattachement vérifié côté serveur, portail limité au Partenaire, comptes distincts). Le personnel d'HyperMarket autorisé est tenu à une obligation écrite de confidentialité. HyperMarket ne communique les données du Partenaire à aucun autre partenaire, y compris anonymisées de façon ré-identifiable.

**Article 5 — Sécurité.** HyperMarket met en œuvre les mesures techniques et organisationnelles de la section 3 (chiffrement en transit et au repos via l'hébergeur, MFA, limitation des tentatives, journal d'audit, sauvegardes testées, séparation des environnements, gestion des secrets). Ces mesures constituent un engagement contractuel ; toute réduction substantielle est notifiée au Partenaire avant application.

**Article 6 — Sous-traitants ultérieurs.** Liste au jour de la signature : hébergement base de données — Supabase ; paiements — **[FedaPay / Kkiapay — à nommer]** ; messagerie de notifications — **[WhatsApp Business / prestataire SMS — à nommer]** ; hébergement applicatif — **[à compléter]**. Tout nouveau sous-traitant touchant aux données du Partenaire est notifié au moins 10 jours à l'avance ; le Partenaire peut s'y opposer pour un motif légitime lié à la protection des données.

**Article 7 — Transferts.** La région d'hébergement est **[à compléter et à déclarer]**. HyperMarket informe le Partenaire de tout changement de région. Les Parties coopèrent pour la déclaration du traitement auprès de l'APDP et, le cas échéant, pour les formalités de transfert prévues par le Code du numérique.

**Article 8 — Droits des personnes.** HyperMarket assiste le Partenaire pour répondre aux demandes d'accès, de rectification, d'opposition et d'effacement des clients, dans les délais légaux, et transmet sans délai toute demande reçue directement.

**Article 9 — Violation de données.** HyperMarket notifie le Partenaire de toute violation de sécurité affectant ses données ou des données clients de ses commandes **dans les 48 heures** suivant sa constatation, avec la nature de l'incident, les catégories de données concernées et les mesures prises. Les Parties coopèrent pour la notification à l'APDP lorsque celle-ci est requise.

**Article 10 — Audit.** Le Partenaire peut, une fois par an et à tout moment en cas d'incident, demander la communication du journal des accès à ses données et un compte rendu des mesures de sécurité, et convenir d'un audit raisonnable, sur préavis de 15 jours, sans perturber le service.

**Article 11 — Conservation.** Commandes et règlements : conservés le temps des obligations comptables applicables ; données de catalogue : supprimées ou restituées à la fin du partenariat ; données personnelles clients : conservées **[durée à convenir, par ex. 24 mois]** après la dernière commande, puis anonymisées, sauf opposition de la personne.

**Article 12 — Fin du partenariat.** À la fin, pour quelque cause que ce soit : restitution des données du Partenaire dans un format courant sous 15 jours, puis suppression définitive sous 30 jours, attestée par écrit. Les règlements en cours restent dus selon le rythme convenu.

**Article 13 — Responsabilité.** Chaque Partie répond des dommages résultant du manquement à ses obligations au titre du présent accord, dans les conditions du contrat pilote. Aucune clause ne limite la responsabilité en cas de divulgation intentionnelle des données du Partenaire à un concurrent.

**Article 14 — Droit applicable et règlement des différends.** Droit béninois. À défaut d'accord amiable sous 30 jours, les tribunaux compétents de Cotonou sont saisis.

Fait à Cotonou, le **[date]**, en deux exemplaires.
Pour HyperMarket : **[nom, fonction, signature]** — Pour le Partenaire : **[nom, fonction, signature]**

---

## 7. Liste de contrôle avant activation

À valider et signer conjointement — **aucune activation sans cette liste complète** :

- ☐ Partenaire, propriétaire des données et contacts d'urgence identifiés des deux côtés
- ☐ Périmètre, finalités et champs de données approuvés (section 2)
- ☐ Comptes du portail créés : nominatifs, MFA activée, droits limités au magasin
- ☐ Test d'accès croisé effectué : le portail du Partenaire ne peut atteindre aucune donnée d'un autre magasin
- ☐ Agrégateur de paiement nommé, flux testé de bout en bout, remboursement test effectué
- ☐ Registre de règlement testé : une commande à blanc produit un relevé exact au franc près
- ☐ Sauvegarde et restauration testées et documentées
- ☐ Journal d'audit actif ; procédure de demande d'historique expliquée au Partenaire
- ☐ Déclaration APDP effectuée ; politique de confidentialité publiée ; responsable données nommé
- ☐ Plan d'incident et de notification (48 h) convenu, contacts échangés
- ☐ Accord de traitement des données et contrat pilote signés
- ☐ Dix commandes à blanc exécutées : confirmation du magasin en moins de 15 minutes, livraison dans le créneau

---

## 8. Questions fréquentes du propriétaire

**« Qui voit mes prix et mes ventes ? »** Vous, et uniquement les membres de l'équipe HyperMarket qui exploitent le service — chaque accès sensible est journalisé et vous pouvez demander cet historique. Aucun autre magasin, jamais.

**« Que se passe-t-il si je veux arrêter ? »** Préavis de 7 jours pendant le pilote, sans pénalité. Vos données vous sont restituées puis supprimées, avec attestation écrite. Vos règlements en cours sont payés au rythme convenu.

**« Et si HyperMarket fait faillite ? »** Vos données restent votre propriété et vous sont restituées ; les sommes collectées pour votre compte et non encore reversées vous sont dues. Le rythme de règlement court (J+2 ou hebdomadaire) limite volontairement l'exposition.

**« Mes clients verront-ils le nom HyperMarket ou le mien ? »** Le vôtre : sur la commande, le reçu et la livraison. HyperMarket est le service, votre magasin est la marque.

**« Devez-vous accéder à mon logiciel de caisse ? »** Non. Le catalogue se gère dans votre portail ou par fichier contrôlé. Une connexion technique ne serait envisagée que plus tard, par écrit, avec un compte en lecture seule limité aux champs convenus.

**« Qui paie en cas d'erreur de livraison ou de produit abîmé ? »** Les règles sont écrites dans le contrat pilote avant le lancement : responsabilité selon la cause (préparation, transport, information), avec un fonds de geste commercial pendant le pilote pour régler vite les petits litiges sans attendre la semaine suivante.

---

*Dossier préparé le 20 octobre 2026. Il accompagne le Plan de Pivot et la Feuille de Route Commerciale HyperMarket. Les sections 5 et 6 sont des projets contractuels : elles doivent être relues et validées par un conseil juridique au Bénin avant toute signature, et adaptées à la raison sociale définitive des parties.*
