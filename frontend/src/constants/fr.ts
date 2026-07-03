export const NAV = {
  TITLE: "Similitudes de Vote",
  MAP: "Carte",
  VOTERS: "Votants",
  GROUPS: "Groupes",
  CATEGORIES: "Catégories",
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
  TOOLTIP_LABEL: "Alignement",
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

export const CATEGORIES_TABLE = {
  NAME: "Nom",
  INFO_GAIN: "Gain d'information",
  VARIANCE: "Variance",
};

export const SIMILAR_GROUPS = {
  HEADING: "Groupes similaires",
};

export const DETERMINANT_CATEGORIES = {
  HEADING: "Catégories déterminantes",
  TOOLTIP:
    "Catégories classées par leur capacité à prédire l'identité de ce groupe. " +
    "Le gain d'information mesure à quel point connaître les réponses dans une catégorie " +
    "réduit l'incertitude sur l'appartenance au groupe. " +
    "La divergence KL mesure à quel point la distribution des votes du groupe se distingue de la moyenne.",
  PRECISION_LABEL: "précision",
  KL_DIVERGENCE: "Divergence KL",
  MOST_CONFUSED: "Plus souvent confondu avec",
};

export const CATEGORY_HEATMAP = {
  HEADING: "Similarité par catégorie",
  GROUP: "Groupe",
  NA: "N/A",
};

export const SORT = {
  LABEL: "Trier",
  BY_VALUE: "Valeur",
  BY_NAME: "Nom",
};

export const GROUP_DETAIL = {
  MEMBERS: "membres",
  ANSWER_RATE: "Taux de réponse",
  COHESION: "Cohésion",
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

export const METRICS = {
  CATEGORIES_LIST: {
    INFO_GAIN: {
      heading: "Gain d'information",
      body:
        "Le gain d'information mesure à quel point connaître les réponses d'un votant dans " +
        "une catégorie donnée réduit l'incertitude sur son appartenance à un groupe. " +
        "Il est calculé via l'information mutuelle normalisée (NMI) entre la variable " +
        "« catégorie de question » et la variable « groupe d'appartenance ». " +
        "Plus le score est élevé, plus la catégorie est discriminante : les groupes " +
        "ont tendance à voter différemment sur ces questions. " +
        "La variance indique la dispersion de ce pouvoir discriminant entre les groupes.",
    },
  },
  GROUPS_LIST: {
    COHESIVITY: {
      heading: "Cohésion",
      body:
        "La cohésion mesure la similarité moyenne des votes entre les membres d'un même groupe. " +
        "Un score de 100 % signifie que tous les membres votent exactement de la même manière " +
        "sur toutes les questions. Un score faible révèle des divergences internes au groupe.",
    },
  },
  VOTER_DETAIL: {
    GROUP_COMPARISON: {
      heading: "Comparaisons par groupe",
      body:
        "Pour chaque groupe, on calcule la similarité entre le profil de vote du votant " +
        "et la moyenne du groupe. La similarité est asymétrique : on pondère davantage " +
        "les accords « Oui‑Oui » que les « Non‑Non », car deux « oui » sur une même motion " +
        "reflètent une conviction partagée plus forte. " +
        "Un lissage bayésien (shrinkage) fiabilise le score quand le nombre de questions " +
        "communes est faible. La confiance indique la proportion de questions partagées.",
    },
    CATEGORY_ALIGNMENT: {
      heading: "Alignement par catégorie",
      body:
        "Compare, pour chaque catégorie de questions, la similarité du votant avec son " +
        "propre groupe par rapport à sa similarité moyenne avec les autres groupes. " +
        "Un alignement positif signifie que le votant vote davantage comme son groupe " +
        "que comme les autres groupes. Négatif, il s'en démarque.",
    },
  },
  GROUP_DETAIL: {
    DETERMINANT_CATEGORIES: {
      heading: "Catégories déterminantes",
      body:
        "Pour chaque catégorie, on mesure sa capacité à prédire l'appartenance à ce groupe. " +
        "La précision est le taux de bonnes prédictions : si la catégorie prédit que le " +
        "votant appartient au groupe, quelle est la probabilité que ce soit correct ? " +
        "La divergence KL quantifie à quel point la distribution des votes du groupe " +
        "se distingue de la moyenne de tous les votants. " +
        "Le gain d'information (Info. Gain) représente la réduction d'incertitude sur " +
        "l'appartenance au groupe lorsque l'on connaît les réponses dans cette catégorie.",
    },
    SIMILAR_GROUPS: {
      heading: "Groupes similaires",
      body:
        "Similarité moyenne entre les membres de ce groupe et ceux d'un autre groupe. " +
        "Le score est symétrique et utilise la même métrique que pour les votants : " +
        "les accords « Oui‑Oui » comptent plus que les « Non‑Non », et un lissage " +
        "bayésien est appliqué pour fiabiliser les comparaisons.",
    },
    CATEGORY_HEATMAP: {
      heading: "Similarité par catégorie",
      body:
        "Matrice montrant la similarité entre ce groupe et chaque autre groupe, " +
        "catégorie par catégorie. Les cellules sont colorées de rouge (peu similaire) " +
        "à vert (très similaire). Cela permet d'identifier sur quels thèmes les groupes " +
        "se rapprochent ou s'éloignent.",
    },
  },
};
