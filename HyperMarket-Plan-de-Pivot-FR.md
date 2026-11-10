# HyperMarket Cotonou — Plan de Pivot

**Ce qu'il faut changer avant le lancement**
À partir d'une analyse complète du dépôt GitHub (code de l'application + les quatre documents de stratégie), 20 octobre 2026
*Document de travail confidentiel — version française du Pivot Plan*

---

## 1. Résumé exécutif

Le concept d'origine — « tous les supermarchés du territoire sur une seule application, lancement sur tout Cotonou, commission de 10 %, livraison à la demande en 30 minutes » — échoue sur ses propres chiffres, avant même qu'un concurrent ait à intervenir :

1. **Le revenu n'existe pas dans le produit.** Le code ne contient ni commission, ni reversement aux supermarchés, ni règlement des comptes. Le tableau de bord admin comptabilise le montant total des commandes comme « chiffre d'affaires ».
2. **Les promotions annulent le revenu.** Une promotion de lancement de 10 % permanente (appliquée par le code à *toutes* les commandes, alors que le site promet « première commande uniquement »), plus une promotion de 15 % par catégorie, plus un bonus fidélité cumulable jusqu'à 5 %, plus 1 % de crédits — le tout face à une commission théorique de 10 %. Contribution nette par commande moyenne : **zéro à négative**.
3. **Le partenaire ne peut pas se permettre cet accord.** Les supermarchés fonctionnent avec une marge brute d'environ 18 à 21 % et un bénéfice net de seulement ~3 à 3,5 %. Demander à l'un d'eux de céder 10 % de commission, de financer 10 à 15 % de promotions et d'absorber le travail de préparation des commandes coûte plusieurs fois son bénéfice net total.

**Le pivot en une phrase :** cesser de lancer une plateforme multi-supermarchés à l'échelle du territoire, et lancer à la place un **service de livraison adossé à un seul supermarché et un seul quartier, dédié aux achats groupés programmés — commandé sur WhatsApp ou sur le web, avec un modèle économique qui partage les frais entre le magasin et le client, et une couche de protection des données qui permet au supermarché de dire oui en toute sécurité.**

Tout le reste de ce plan n'est que le détail de cette phrase.

---

## 2. Les sept pivots

### Pivot 1 — Périmètre : de plusieurs supermarchés à UN partenaire d'ancrage

| | Avant | Après |
|---|---|---|
| Périmètre de lancement | 2 à 5 supermarchés, plusieurs quartiers de Cotonou dans les données de démonstration | **1 supermarché, Akpakpa uniquement**, dans le cadre d'un pilote signé de 60 jours avec exclusivité de zone |
| Pourquoi | Un lancement multi-magasins multiplie les problèmes de catalogue, de stock et de livraison avant qu'un seul parcours de commande soit éprouvé, et grille tous les supermarchés de la zone d'un coup en cas d'échec | Un seul partenaire peut être intégré correctement (vrai catalogue, personnel formé, tests à blanc). Son propriétaire devient la référence qui ouvre les portes suivantes — dans le monde des supermarchés à Cotonou, la parole d'un propriétaire vaut plus que n'importe quel argumentaire |

**Changements requis :** critères de sélection du partenaire (espace de préparation en magasin, responsable qui veut ce canal, concentration sur les 500 produits principaux, capacité à confirmer les commandes rapidement). Le contrat prend la forme d'un *accord pilote* — l'engagement faible est l'argument de vente, pas une faiblesse.

### Pivot 2 — Clientèle : de « tout le monde » à trois paniers qui paient

L'économie du modèle ne respire qu'avec des paniers plus importants. Au panier supposé de 8 000 FCFA, la plateforme gagne quelques centaines de francs par commande ; entre 25 000 et 40 000, elle gagne sa vie. Cibler, dans l'ordre :

1. **Les ménages en achats groupés mensuels (Akpakpa / Cotonou).** Les grandes courses du mois — riz, huile, packs d'eau, boissons, couches, produits d'entretien. Lourdes, planifiées, récurrentes. C'est la commande que les supermarchés et les livreurs peuvent réellement bien servir.
2. **La diaspora qui achète pour la famille à Cotonou.** Un client à Paris ou à Montréal paie en ligne (c'est là que le paiement par carte prend enfin son sens) et la famille est livrée à domicile. Exigence de confiance élevée, panier élevé, faible sensibilité au prix des frais.
3. **Le réapprovisionnement des petites entreprises (B2B).** Bureaux, bars, restaurants, hôtels, cliniques — des commandes récurrentes de 30 000 à plus de 100 000 FCFA, décidées par une seule personne, avec beaucoup moins de comparaison de prix que chez les ménages. Quarante commandes B2B par mois font plus pour le résultat que 400 commandes de ménages.

Abandonner le ciblage prioritaire des courses fraîches du quotidien : Dantokpa et les boutiques de quartier gagnent cette bataille sur le prix, la fraîcheur et la proximité, et un trajet en zem bat une application pour un réassort de 1 500 FCFA.

### Pivot 3 — Catalogue : de « tout le magasin » à une sélection de 300 à 500 références

| | Avant | Après |
|---|---|---|
| Catalogue | Toute la gamme du magasin sous-entendue ; les données de démonstration comptent 30 produits × 4 magasins avec des emojis au lieu de photos, saisis manuellement par un admin de la plateforme | **Les 300 à 500 meilleures références du magasin partenaire uniquement**, orientées produits lourds/encombrants et de base ; vraies photos ; champ code-barres ; import Excel/CSV géré par le magasin dans son portail |
| Stock | Un stock côté plateforme que les ventes en magasin ne réduisent jamais → faux dès le premier jour | Stock réservé à la commande, **le magasin confirme la disponibilité avant l'encaissement du paiement**, procédure de substitution validée sur WhatsApp |

Ajouter un rituel hebdomadaire, pas une fonctionnalité : un passage de vérification prix/stock de 30 minutes sur les 100 références principales, avec le magasin. La vérité du catalogue est une opération, pas une base de données.

### Pivot 4 — Argent : partager les frais, fermer la fuite

**Ancien modèle, par commande de 8 000 FCFA (tel que codé) :**

| Ligne | FCFA |
|---|---|
| Commission de 10 % (théorique — non implémentée) | +800 |
| Promotion de lancement de 10 %, toutes commandes, sans date de fin dans le code | −800 |
| *ou* promotion catégorie de 15 % (frais) | −1 200 |
| Bonus fidélité jusqu'à 5 % (cumulé) | jusqu'à −340 |
| Crédits fidélité gagnés (1 % du sous-total, dette future) | −80 |
| **Net avant frais de paiement, support et livraisons échouées** | **0 à −720** |

**Nouveau modèle, par commande :**

| Ligne | Panier 8 000 | Panier 25 000 |
|---|---|---|
| Commission supermarché — 5 % (taux pilote, revu selon des paliers de volume) | +400 | +1 250 |
| Frais de service client — 500 FCFA fixes (offerts uniquement sur les comptes B2B) | +500 | +500 |
| Frais d'agrégateur de paiement (~2,9 % FedaPay MoMo Bénin, sur le montant encaissé livraison incluse) | ≈ −275 | ≈ −770 |
| Livraison | Payée par le client, reversée au livreur ; la plateforme ne subventionne que le seuil de livraison offerte à partir de 25 000, sur sa marge | |
| **Contribution indicative avant charges fixes** | **≈ +625** | **≈ +980** |

Règles qui font tenir l'ensemble :

- **Discipline promotionnelle.** Première commande uniquement, plafonnée à 1 000 FCFA, financée à 50/50 entre la plateforme et le magasin, avec des dates de début *et* de fin que le code applique réellement. Aucune promotion ne peut jamais dépasser la commission du même panier.
- **La fidélité est reportée.** Crédits et bonus fidélité arrivent en phase 2, financés par la commission, jamais cumulés sur une promotion au lancement.
- **Seuil de rentabilité honnête.** Les charges fixes réelles du pilote sont d'environ 280 000 FCFA/mois (hébergement, connectivité, temps de support, marketing terrain, maintenance, temps de l'exploitant valorisé au minimum — pas zéro). Avec une contribution moyenne de ~550 à 650 FCFA par commande de ménage, le seuil se situe autour de **450 à 500 commandes/mois (~17/jour)**, et non les 140 annoncées. Les commandes B2B, à ~1 700 FCFA de contribution chacune, font baisser ce chiffre rapidement — c'est pour cela que le Pivot 2 les classe en priorité.

*Tous les chiffres sont des hypothèses de planification à valider pendant le pilote, pas des prévisions.*

### Pivot 5 — Livraison : du mensonge des 30 minutes aux créneaux programmés

| | Avant | Après |
|---|---|---|
| Promesse | Express ~30 min, standard ~90 min, quartiers de toute la ville au paiement | **Deux créneaux programmés par jour** au lancement (ex. commande avant 10 h 30 → livrée 12 h–14 h ; avant 16 h 30 → livrée 18 h–20 h), Akpakpa uniquement |
| Panier | Produits de plusieurs supermarchés dans une même commande, un seul forfait de 1 000 FCFA | **Un supermarché par commande — règle imposée dans le panier.** Une commande = un enlèvement = un trajet |
| Seuil de panier | Aucun | Minimum de 5 000 FCFA pour la livraison ; livraison offerte dès 25 000 FCFA dans la zone |
| Preuve | Clics de statut | Code de confirmation de livraison donné par le client au livreur ; paiement à la livraison réconcilié chaque jour |

Regrouper plusieurs commandes dans une même tournée de créneau est ce qui rend un forfait de livraison à 1 000 FCFA tenable : objectif de coût par dépôt en zone ≤600 FCFA à raison de 3 à 5 dépôts par tournée. L'express à la demande reviendra en phase 2, facturé à son coût réel, uniquement lorsque la densité de commandes le permettra.

### Pivot 6 — Canal : WhatsApp d'abord, le web ensuite

Au Bénin, le commerce se convertit sur WhatsApp, Facebook et TikTok — un site web qu'il faut découvrir, sur lequel il faut s'inscrire (e-mail + mot de passe) et dont il faut se souvenir perdra face à une conversation où les clients vivent déjà.

- **WhatsApp Business est la vitrine principale :** catalogue, prise de commande, confirmation par le magasin, validation des substitutions, suivi de livraison, re-commande (« répéter ma dernière commande » tient en un message).
- **Le site web reste** comme catalogue public, vitrine de la diaspora (paiement par carte depuis l'étranger) et actif de crédibilité à montrer aux partenaires et à la presse.
- Les notifications passent sur WhatsApp/SMS. Les notifications dans l'application, seules, n'atteignent personne.

### Pivot 7 — Confiance : de l'admin tout-puissant à une couche de protection des données

L'application actuelle ne connaît que deux rôles — client et admin tout-puissant — et aucun compte supermarché. Pour un supermarché, ses prix, ses ventes et ses données clients *sont* l'entreprise ; la couche de confiance est donc une fonctionnalité du produit, pas une décoration juridique :

- **Isolation des données partenaires dans l'architecture cloud :** chaque enregistrement partenaire est verrouillé côté serveur par supermarché ; un partenaire ne peut jamais voir les prix, les ventes ou les clients d'un autre ; identifiants de base de données distincts au moindre privilège ; environnements de test et de production totalement séparés ; secrets dans un coffre géré ; sauvegardes avec restauration à un instant donné *et restauration réellement testée*.
- **Sécurité des comptes :** MFA obligatoire pour les admins et les responsables partenaires, limitation des tentatives de connexion et en-têtes de sécurité (absents aujourd'hui), sessions plus courtes et révocables, et un **journal d'audit immuable** de qui a consulté, exporté ou modifié les données partenaires ou clients.
- **Conformité vie privée au Bénin :** traitement de données personnelles déclaré à l'**APDP** au titre du Livre V du Code du numérique (loi 2017-20), responsable de la protection des données nommé, export/suppression des données dans l'application, durées de conservation définies, procédure de notification de violation à l'APDP, et livreurs ne voyant le numéro et l'adresse du client que pendant la durée de leur livraison (contact masqué lorsque c'est possible).
- **Accord de traitement des données signé avec le supermarché :** ses données lui appartiennent ; elles ne sont traitées que pour exécuter les commandes ; jamais vendues, jamais utilisées au bénéfice d'un concurrent ; restituées ou supprimées en cas de sortie. Plus un accord de confidentialité et le contrat pilote.
- **Le Dossier de Confiance :** un court dossier de sécurité en français (architecture, isolation, sauvegardes, processus incident, garantie de règlement) remis en main propre au propriétaire lors de la réunion de présentation. La confiance se montre par des documents et des mécanismes, elle ne se proclame pas comme un slogan.

La transparence des règlements fait partie de ce pivot : rythme de reversement fixe (J+2 ou hebdomadaire), relevé automatique par période, chaque franc traçable de la commande au reversement. Les supermarchés pardonnent une livraison en retard plus facilement qu'un franc inexpliqué.

---

## 3. Liste Construire / Corriger / Abandonner

**CONSTRUIRE avant le pilote (indispensable)**
1. Registre de commissions et de règlements (répartition par commande, relevés de reversement, réconciliation du paiement à la livraison)
2. Rôle partenaire + portail partenaire (son catalogue, ses commandes, ses règlements — rien d'autre de visible)
3. Règle « un supermarché par commande » dans le panier ; créneaux de livraison programmés avec heures limites
4. Intégration d'un agrégateur de paiement — FedaPay et/ou Kkiapay (tous deux béninois ; comparer sandbox, frais et fiabilité des reversements), encaissement après confirmation du magasin
5. Règles de promotion corrigées dans le code (première commande uniquement, plafond, dates appliquées, financement partagé enregistré)
6. Import de catalogue CSV/Excel + vraies photos produits + champ code-barres
7. Notifications WhatsApp de commande et de statut ; procédure de validation des substitutions
8. Couche de confiance : journal d'audit, MFA, limitation des tentatives, isolation partenaire testée en conditions d'attaque croisée
9. Pack juridique : déclaration APDP, politique de confidentialité, accord de traitement des données + contrat pilote, conditions clients

**CORRIGER**
- Réservation de stock à la commande ; étape de confirmation par le magasin avant l'encaissement
- CORS ouvert, en-têtes de sécurité manquants, jetons de 7 jours non révocables, mots de passe de démonstration publics (admin123/client123) — tout doit être fermé avant toute URL publique
- Projets Supabase test/production séparés ; test de restauration documenté

**ABANDONNER / REPORTER (phase 2 au plus tôt)**
- Paiement BTC, multi-devises, plans 3D des magasins, application mobile native, livraison express 30 minutes, cumul fidélité, deuxième supermarché, deuxième ville

---

## 4. Les 90 jours, version pivotée

| Phase | Semaines | Travail | Preuve de sortie |
|---|---|---|---|
| 1. Correction de l'argent | 1–2 | Registre commissions/règlements, discipline promotionnelle, règle du panier, créneaux | Une commande test est réglée au franc près dans un relevé |
| 2. Confiance + portail | 3–6 | Portail partenaire, isolation + audit + MFA, intégration paiements, import catalogue, flux WhatsApp, pack juridique + dépôt APDP | Le test d'accès croisé entre partenaires passe ; paiement sandbox de bout en bout |
| 3. Signature + intégration | 5–8 (en chevauchement) | Présentation avec le Dossier de Confiance → signer UN magasin d'ancrage à Akpakpa ; intégrer les 300 à 500 meilleures références avec photos ; former le préparateur et le responsable du magasin ; 10 commandes à blanc | Le magasin confirme et prépare une commande à blanc en moins de 15 minutes |
| 4. Pilote en direct | 9–12 | Lancement doux auprès d'une liste de clients amorcée (clients du magasin, groupes WhatsApp, bureaux proches) ; deux créneaux/jour ; règlement hebdomadaire ; revue hebdomadaire avec le magasin | Tableau de bord ci-dessous |

Besoin de trésorerie indicatif du pilote (estimations, à chiffrer proprement) : développement complémentaire externalisé ≈ 400 000 à 800 000 FCFA en plus de l'application existante ; fonctionnement mensuel ≈ 250 000 à 350 000 FCFA ; trois mois de marge jusqu'à la décision du pilote ≈ **1,5 à 2,5 M FCFA tout compris**. L'avertissement des documents d'origine reste valable : les devis de développement en dessous du marché sont la façon dont les projets finissent avec du code inutilisable — payer par étapes (30/40/30) contre des démonstrations fonctionnelles.

---

## 5. Tableau de bord du pilote — et critères d'arrêt

**Objectifs au jour 60 du pilote en direct :**

| Indicateur | Objectif |
|---|---|
| Commandes exécutées exactement comme commandées | ≥ 95 % |
| Livraisons dans le créneau promis | ≥ 90 % |
| Exactitude du stock, 100 références principales | ≥ 98 % |
| Réachat (clients passant une 2e commande) | ≥ 30 % |
| Contribution par commande | ≥ 0 au jour 45, positive au jour 75 |
| Règlements payés à temps | 100 % |

**Déclencheurs d'arrêt / de repli :** si deux objectifs ou plus sont manqués au jour 60, ne *pas* signer d'autres supermarchés et ne *pas* dépenser en marketing. Soit corriger l'opération défaillante avec le même partenaire, soit replier vers le modèle de secours — un service d'achats concierge sur WhatsApp, léger et humain (sans coût de plateforme), qui conserve les clients et la relation partenaire pendant que la plateforme est reconstruite. Annoncer le passage à l'échelle sur un pilote cassé est la seule faute impardonnable : les supermarchés d'Akpakpa se parlent entre eux.

---

## 6. Dix premières actions (cette semaine)

1. ☐ Geler toute communication de lancement public — rien ne sort avec les anciennes promesses (express 30 min, −10 % pour tous, crypto).
2. ☐ Supprimer/corriger les comptes de démonstration admin et client et renouveler tous les secrets avant que le code ou l'URL soit partagé davantage.
3. ☐ Arrêter la liste des magasins d'ancrage cibles à Akpakpa (5 candidats, classés) — les visiter d'abord comme client ; noter espace de préparation, gamme, prix.
4. ☐ Adopter la nouvelle répartition des frais (5 % magasin + 500 FCFA de frais de service) et la discipline promotionnelle comme politique écrite ; briefer le mainteneur du code.
5. ☐ Commander la liste « Construire » (section 3) sous forme de devis par étapes — démonstration à chaque étape, code source livré progressivement.
6. ☐ Ouvrir des comptes sandbox chez FedaPay et Kkiapay ; faire passer le même paiement test chez les deux.
7. ☐ Rédiger le Dossier de Confiance et le contrat pilote (en français) — c'est le document de présentation, à construire avant la présentation, pas après.
8. ☐ Engager la déclaration APDP et rédiger la politique de confidentialité.
9. ☐ Mettre en place WhatsApp Business pour le service ; définir les modèles de messages de re-commande et de substitution.
10. ☐ Budgéter le pilote honnêtement (≈1,5 à 2,5 M FCFA jusqu'au point de décision) — si l'argent n'est pas là, lancer d'abord le modèle concierge de secours et le laisser financer la plateforme.

---

*Sources : analyse du dépôt (code, schéma, données de démo, quatre PDF) — github.com/Medellin20/Hypermarket, commit 22d2bd5, 20 oct. 2026. Marges supermarchés : brute ≈18–19 %, nette ≈3–3,5 % (cas Pick n Pay) ; distribution alimentaire sud-africaine ≈21,4 % (Trade Intelligence, S1 2024). FedaPay, commission MoMo Bénin publiée : 2,9 %. Données personnelles : Code du numérique du Bénin (loi 2017-20, Livre V), APDP. Chiffres « indicatifs » = hypothèses à valider en pilote.*
