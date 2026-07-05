export const NAV = {
  CATEGORIES: "Catégories",
  GROUPS: "Groupes",
  MAP: "Carte",
  TITLE: "Similitudes de Vote",
  VOTERS: "Votants",
  VOTES: "Votes",
};

export const ERROR_DIALOG = {
  TITLE: "Erreur de connexion",
  DISMISS: "Ignorer",
  RETRY: "Réessayer",
  API_CONNECTION: "API non disponible. Assurez-vous que le serveur est en marche"
};

export const EMBEDDINGS = {
  NO_DATA_BODY:
    "Ces catégories ne partagent que {count} vote(s) commun(s), ce qui est insuffisant pour une analyse pertinente.",
};

export const CATEGORY_FILTER = {
  LABEL: "Catégories",
  ALL: "Toutes les catégories",
};

export function filterAnnotation(names: string[]): string | undefined {
  return names.length > 0 ? `Sur les questions ${names.join(" ET ")}` : undefined;
}

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
  ABSENT: "Absent·e",
  ABSTENTION: "Abstention",
  YES_SAME_GROUP: "Oui — comme le groupe",
  YES_DIFF_GROUP: "Oui — différent du groupe",
  NO_DIFF_GROUP: "Non — différent du groupe",
  NO_SAME_GROUP: "Non — comme le groupe",
  PASSED: "Adopté",
  NOT_PASSED: "Rejeté",
  YES_SAME: "Oui, a voté comme le groupe",
  NO_SAME: "Non, a voté comme le groupe",
  YES_DIFF: "Oui, a voté contre le groupe",
  NO_DIFF: "Non, a voté contre le groupe",
  YES_SAME_DESC: "Votant·e et groupe majoritaire ont voté Oui. La proposition a été adoptée.",
  NO_SAME_DESC: "Votant·e et groupe majoritaire ont voté Non. La proposition a été rejetée.",
  YES_DIFF_DESC: "Votant·e a voté Oui, mais la majorité du groupe a voté Non. La proposition a été adoptée.",
  NO_DIFF_DESC: "Votant·e a voté Non, mais la majorité du groupe a voté Oui. La proposition a été rejetée.",
  ABSTENTION_DESC: "Présent·e mais s'est abstenu·e (ni Oui ni Non).",
  ABSENT_DESC: "Non présent·e lors du vote.",
};

export const SIMILAR_VOTERS = {
  SHARED: "partagés",
  CONFIDENCE: "confiance",
};

export const GROUP_COMPARISON = {
  HEADING: "Comparaisons par groupe",
  TOOLTIP:
    "Mesure la similarité du profil de vote de ce votant avec chaque groupe. " +
    "La similarité est basée sur un chevauchement asymétrique pondéré avec lissage bayésien. " +
    "La confiance reflète le nombre de votes communs auxquels il a été répondu.",
  SIMILARITY: "Similarité",
  CONFIDENCE: "Confiance"
};

export const CATEGORY_ALIGNMENT = {
  HEADING: "Alignement par catégorie",
  TOOLTIP_LABEL: "Alignement",
  TOOLTIP:
    "Mesure l'alignement de ce votant avec son propre groupe par rapport aux autres groupes " +
    "pour chaque catégorie. Positif = le votant correspond à son groupe, négatif = il s'en démarque.",
  OWN_GROUP: "Groupe propre",
  AVG_OTHERS: "Moy. autres groupes",
};

export const VOTER_DETAIL = {
  MOST_SIMILAR: "Les plus proches",
  LEAST_SIMILAR: "Les moins proches",
  ANSWER_RATE: "Taux de réponse",
  PRESENCE_RATE: "Taux de présence",
  GROUP_AVG: "Moy. groupe réponse",
  GROUP_AVG_PRESENCE: "Moy. groupe présence",
  MEMBERS: "membres",
};

export const GROUPS_TABLE = {
  NAME: "Nom",
  MEMBERS: "Membres",
  COHESIVITY: "Cohésion",
  ANSWER_RATE: "Taux réponse",
  PRESENCE_RATE: "Taux présence",
};

export const CATEGORIES_TABLE = {
  NAME: "Nom",
  INFO_GAIN: "Gain d'information",
  VARIANCE: "Variance",
};

export const SIMILAR_GROUPS = {
  HEADING: "Groupes similaires",
  SHARED: "partagés",
  CONFIDENCE: "confiance",
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
  PRESENCE_RATE: "Taux de présence",
  COHESION: "Cohésion",
};

export const VOTES_TABLE = {
  ID: "ID",
  VOTE: "Vote",
  PASSED: "Adopté",
  NOT_PASSED: "Rejeté",
  CATEGORIES: "Catégories",
};

export const VOTE_DETAIL = {
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
  X_LABEL: "Dimension 1",
  Y_LABEL: "Dimension 2",
};

export const GROUPS_SCATTER = {
  HEADING: "Groupes",
  X_LABEL: "Dimension 1",
  Y_LABEL: "Dimension 2",
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
    "Par ailleurs, la similarité entre deux votants est calculée uniquement sur les votes " +
    "auxquels **tous deux ont répondu**. Les motions sans réponse sont ignorées dans leur " +
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
  YES_YES_DESC: "votes où les deux ont voté Oui — poids {w_yes}",
  NO_NO_DESC: "votes où les deux ont voté Non — poids {w_no}",
  DISAGREE_DESC: "votes où ils ont voté différemment — pénalité −{w_mismatch}",

  SHRINKAGE_HEADING: "Lissage bayésien (shrinkage)",
  SHRINKAGE_BODY:
    "Les paires de votants qui partagent peu de questions ont un score peu fiable. Un **lissage " +
    "bayésien** (shrinkage) mélange leur score brut avec la similarité moyenne de toutes les " +
    "paires, selon la formule :\n\n" +
    "confiance = votes partagés / (votes partagés + 10)\n" +
    "score lissé = confiance × score brut + (1 − confiance) × moyenne globale\n\n" +
    "Avec m = {m}, pour {m} votes partagés le score brut compte pour 50 % ; pour 90 questions, " +
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
    "les votes de cette catégorie. La disposition peut changer considérablement d'une " +
    "catégorie à l'autre — des votants proches sur un sujet peuvent s'éloigner sur un autre.",

  CONFIGS_HEADING: "Configuration des similarités",
  CONFIGS_INTRO:
    "Dans le sélecteur en haut à droite, vous pouvez choisir parmi plusieurs **modes de calcul** " +
    "de la similarité. Chaque mode pondère différemment les accords et désaccords :",
  CONFIGS_W_YES: "poids des votes « Oui » communs",
  CONFIGS_W_NO: "poids des votes « Non » communs",
  CONFIGS_W_MISMATCH: "pénalité en cas de désaccord",
  CONFIGS_M: "paramètre de lissage (m)",
  CONFIGS_TABLE_NAME: "Nom",
  CONFIGS_TABLE_W_YES: "Oui-Oui",
  CONFIGS_TABLE_W_NO: "Non-Non",
  CONFIGS_TABLE_W_MISMATCH: "Désaccord",
  CONFIGS_TABLE_M: "m",
  CONFIGS_OUTRO:
    "Le mode **Defaut** correspond aux poids de base : il valorise les « Oui » communs et " +
    "pénalise modérément les désaccords. Le mode **Bipartisan** traite les « Non » à égalité " +
    "avec les « Oui », ce qui rapproche les groupes d'opposition. Le mode **Offensif** ignore les " +
    "« Non » et ne retient que les « Oui » communs, révélant des affinités plus marquées.",
  CONFIGS_INTERPRETATION:
    "Changer de mode modifie ce que signifie « être proche » sur la carte. " +
    "Plus le poids {w_yes} est élevé, plus l'analyse se concentre sur les votes « Oui » " +
    "communs — deux votants qui partagent une même conviction affirmée se ressemblent davantage. " +
    "Augmenter le poids {w_no} rend les « Non » communs aussi significatifs que les « Oui », " +
    "ce qui peut rapprocher des groupes qui s'opposent sur les votes positifs mais " +
    "s'accordent sur les refus. Une pénalité {w_mismatch} forte écarte davantage les votants " +
    "dès qu'ils divergent, rendant les dissimilarités plus saillantes. " +
    "Enfin, le paramètre de lissage {m} contrôle la fiabilité minimale : plus il est élevé, " +
    "plus il faut de votes partagés pour qu'un score soit considéré comme fiable, ce qui " +
    "réduit le bruit mais peut atténuer des signaux faibles.",
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
        "« catégorie de vote » et la variable « groupe d'appartenance ». " +
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
        "sur tous les votes. Un score faible révèle des divergences internes au groupe.",
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
        "Un lissage bayésien (shrinkage) fiabilise le score quand le nombre de votes " +
        "communs est faible. La confiance indique la proportion de votes partagés.",
    },
    CATEGORY_ALIGNMENT: {
      heading: "Alignement par catégorie",
      body:
        "Compare, pour chaque catégorie de votes, la similarité du votant avec son " +
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
