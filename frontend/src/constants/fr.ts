export const NAV = {
  TITLE: "Similitudes de Vote",
  MAP: "Carte",
  VOTERS: "Votants",
  GROUPS: "Groupes",
  QUESTIONS: "Questions",
};

export const ERROR_DIALOG = {
  TITLE: "Erreur de connexion",
  DISMISS: "Ignorer",
  RETRY: "Réessayer",
  API_CONNECTION: "API non disponible. Assurez-vous que le serveur est en marche"
};

export const CATEGORY_FILTER = {
  LABEL: "Catégorie",
  ALL: "Toutes les catégories",
};

export const VOTERS_TABLE = {
  ID: "ID",
  FIRST_NAME: "Prénom",
  LAST_NAME: "Nom",
  GROUP: "Groupe",
  ROLE: "Rôle",
  COMMISSION: "Commission",
  CIRCONSCRIPTION: "Circonscription",
};

export const VOTER_INFO = {
  ROLE: "Rôle :",
  COMMISSION: "Commission :",
  CIRCONSCRIPTION: "Circonscription :",
};

export const ANSWER_GRID = {
  HEADING: "Réponses",
  NO_ANSWER: "Pas de réponse",
  YES_SAME_GROUP: "Oui — comme le groupe",
  YES_DIFF_GROUP: "Oui — différent du groupe",
  NO_DIFF_GROUP: "Non — différent du groupe",
  NO_SAME_GROUP: "Non — comme le groupe",
  PASSED: "Adopté",
  NOT_PASSED: "Rejeté",
  YES_SAME: "Oui, comme le groupe",
  NO_SAME: "Non, comme le groupe",
  YES_DIFF: "Oui, différent",
  NO_DIFF: "Non, différent",
};

export const SIMILAR_VOTERS = {
  SHARED: "partagées",
};

export const GROUP_COMPARISON = {
  HEADING: "Comparaisons par groupe",
  TOOLTIP:
    "Mesure la similarité du profil de vote de ce votant avec chaque groupe. " +
    "La similarité est basée sur un chevauchement asymétrique pondéré avec lissage bayésien. " +
    "La confiance reflète le nombre de questions communes auxquelles il a été répondu.",
  SIMILARITY: "Similarité",
  CONFIDENCE: "Confiance"
};

export const CATEGORY_ALIGNMENT = {
  HEADING: "Alignement par catégorie",
  TOOLTIP:
    "Mesure l'alignement de ce votant avec son propre groupe par rapport aux autres groupes " +
    "pour chaque catégorie. Positif = le votant correspond à son groupe, négatif = il s'en démarque.",
};

export const VOTER_DETAIL = {
  MOST_SIMILAR: "Les plus proches",
  LEAST_SIMILAR: "Les moins proches",
  ANSWER_RATE: "Taux de réponse",
  GROUP_AVG: "Moy. groupe",
  MEMBERS: "membres",
};

export const GROUPS_TABLE = {
  NAME: "Nom",
  MEMBERS: "Membres",
  COHESIVITY: "Cohésion",
};

export const SIMILAR_GROUPS = {
  HEADING: "Groupes similaires",
};

export const DETERMINANT_CATEGORIES = {
  HEADING: "Catégories déterminantes",
  TOOLTIP:
    "Catégories classées par leur capacité à prédire l'identité de ce groupe. " +
    "Le gain d'information mesure à quel point connaître les réponses dans une catégorie " +
    "réduit l'incertitude sur l'appartenance au groupe.",
  UNCERTAINTY: "d'incertitude résolue",
  ACCURACY: "Précision :",
  MOST_CONFUSED: "Plus souvent confondu avec :",
};

export const CATEGORY_HEATMAP = {
  HEADING: "Similarité par catégorie",
  GROUP: "Groupe",
  NA: "N/A",
};

export const GROUP_DETAIL = {
  MEMBERS: "membres",
  ANSWER_RATE: "Taux de réponse",
};

export const QUESTIONS_TABLE = {
  ID: "ID",
  QUESTION: "Question",
  PASSED: "Adopté",
  NOT_PASSED: "Rejeté",
  CATEGORIES: "Catégories",
};

export const QUESTION_DETAIL = {
  PASSED: "Adopté",
  NOT_PASSED: "Rejeté",
  GROUP_BREAKDOWN: "Répartition par groupe",
  YES_LABEL: "Oui",
  NO_LABEL: "Non",
  MISSING_LABEL: "Abs.",
  Y_SHORT: "O",
  N_SHORT: "N",
  DASH_SHORT: "-",
  PCT_YES: "oui",
};

export const VOTERS_SCATTER = {
  HEADING: "Votants",
  MEMBERS_BC: "membres (barycentre)",
};

export const GROUPS_SCATTER = {
  HEADING: "Groupes",
};

export const METHODOLOGY = {
  ACCORDION_LABEL: "Méthodologie",

  // ── Partie 1 : grand public ──

  WHAT_YOU_SEE_HEADING: "Ce que vous voyez",
  WHAT_YOU_SEE_BODY:
    "Chaque point sur cette carte représente un votant. La distance entre deux points reflète la " +
    "dissimilarité de leurs votes : **plus ils sont proches, plus leurs votes se ressemblent**.\n\n" +
    "Imaginez une pelote de laine en trois dimensions qu'on aplatit en deux dimensions — la " +
    "structure générale est conservée, mais certains rapports de distance sont forcément un peu " +
    "déformés. C'est pourquoi un indicateur de **stress** (voir plus bas) vous aide à juger de " +
    "la fiabilité de la carte.",

  WHY_SHAPE_HEADING: "Pourquoi cette forme ?",
  WHY_SHAPE_BODY:
    "Les méthodes classiques comme l'analyse en composantes principales (ACP) analysent les votes " +
    "question par question. Ici, on utilise directement les **distances entre votants**, calculées " +
    "à partir de leurs similarités. Cela permet de donner plus de poids à l'accord **Oui-Oui** " +
    "qu'à l'accord **Non-Non** : deux votants qui disent « oui » à la même motion partagent " +
    "probablement une vraie conviction, tandis que deux « non » peuvent venir de raisons très " +
    "différentes.\n\n" +
    "Le résultat : une carte où la proximité reflète la similarité réelle des comportements de vote, " +
    "et non une simple superposition de réponses brutes.",

  COLORS_HEADING: "Couleurs et groupes",
  COLORS_BODY:
    "Chaque point est coloré selon le groupe politique du votant. Les grands losanges sont les " +
    "**barycentres** : la position moyenne des membres de chaque groupe. Ils ne représentent pas " +
    "une analyse distincte, mais simplement le « centre de gravité » du groupe dans cet espace " +
    "de similarité.",

  LIMITS_HEADING: "Limites de cette représentation",
  LIMITS_BODY_SIMPLIFICATION:
    "La carte est une simplification. Une projection en deux dimensions ne peut pas capturer " +
    "parfaitement les relations de similarité entre des centaines de votants.",
  LIMITS_BODY_STRESS: "Le **stress** mesure cette perte d'information.",
  LIMITS_BODY_SAME_QUESTIONS:
    "Par ailleurs, la similarité entre deux votants est calculée uniquement sur les questions " +
    "auxquelles **tous deux ont répondu**. Les motions sans réponse sont ignorées dans leur " +
    "score.",

  // ── Partie 2 : technique ──

  TECH_DIVIDER_LABEL: "Détails techniques",

  METRIC_HEADING: "Métrique de similarité",
  METRIC_INTRO:
    "Pour chaque paire de votants, la similarité brute est calculée ainsi :\n\n" +
    "sim = ({w_yes} × Oui‑Oui + {w_no} × Non‑Non − {w_mismatch} × Désaccord) / ({w_yes} × Total)\n\n" +
    "où :",
  YES_YES_LABEL: "Oui-Oui",
  NO_NO_LABEL: "Non-Non",
  DISAGREE_LABEL: "Désaccord",
  YES_YES_DESC: "questions où les deux ont voté Oui — poids {w_yes}",
  NO_NO_DESC: "questions où les deux ont voté Non — poids {w_no}",
  DISAGREE_DESC: "questions où ils ont voté différemment — pénalité −{w_mismatch}",

  SHRINKAGE_HEADING: "Lissage bayésien (shrinkage)",
  SHRINKAGE_BODY:
    "Les paires de votants qui partagent peu de questions ont un score peu fiable. Un **lissage " +
    "bayésien** (shrinkage) mélange leur score brut avec la similarité moyenne de toutes les " +
    "paires, selon la formule :\n\n" +
    "confiance = questions partagées / (questions partagées + 10)\n" +
    "score lissé = confiance × score brut + (1 − confiance) × moyenne globale\n\n" +
    "Avec m = {m}, pour {m} questions partagées le score brut compte pour 50 % ; pour 90 questions, " +
    "il compte pour 90 %. Cela évite des extrêmes artificiels entre votants qui se chevauchent " +
    "à peine.",

  MDS_ALGO_HEADING: "Positionnement multidimensionnel (MDS)",
  MDS_ALGO_BODY:
    "L'algorithme utilisé est le **MDS classique (métrique)** dit de Torgerson, en trois étapes :\n\n" +
    "1. Conversion des similarités en distances\n" +
    "2. Double centrage de la matrice des distances au carré pour obtenir un produit scalaire\n" +
    "3. Décomposition en valeurs propres, dont on extrait les deux axes principaux\n\n" +
    "Le résultat préserve au mieux les distances originales en deux dimensions. " +
    "Mathématiquement, c'est équivalent à une ACP sur la matrice des distances, mais appliquée " +
    "aux similarités plutôt qu'aux réponses brutes.",

  STRESS_HEADING: "Stress",
  STRESS_INTRO:
    "Le **stress de Kruskal (Stress‑1)** mesure l'écart entre les distances originales et " +
    "les distances après projection en 2D :\n\n" +
    "stress = √( Σ(d_original − d_2D)² / Σ d_original² )\n\n" +
    "Valeurs indicatives :",
  STRESS_GOOD: "< {stress_good} % — la structure dominante est bien capturée",
  STRESS_FAIR: "{stress_good}–{stress_fair} % — les principaux motifs sont visibles, avec quelques distorsions",
  STRESS_POOR: "≥ {stress_fair} % — la réduction en 2D est significative ; à interpréter avec prudence",

  PER_CATEGORY_HEADING: "Vues par catégorie",
  PER_CATEGORY_BODY:
    "Lorsque vous sélectionnez une catégorie, un MDS distinct est calculé avec uniquement " +
    "les questions de cette catégorie. La disposition peut changer considérablement d'une " +
    "catégorie à l'autre — des votants proches sur un sujet peuvent s'éloigner sur un autre.",
};

export const PAGE = {
  TITLE: "Similitudes de Vote",
  DESCRIPTION: "Similitudes de Vote — Analysez les similitudes de vote à travers les groupes",
  NOSCRIPT: "Vous devez activer JavaScript pour utiliser cette application.",
};
