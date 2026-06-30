export const NAV = {
  TITLE: "Similitudes de Vote",
  MAP: "Carte",
  PEOPLE: "Personnes",
  GROUPS: "Groupes",
  QUESTIONS: "Questions",
};

export const ERROR_DIALOG = {
  TITLE: "Erreur de connexion",
  DISMISS: "Ignorer",
  RETRY: "Réessayer",
};

export const CATEGORY_FILTER = {
  LABEL: "Catégorie",
  ALL: "Toutes les catégories",
};

export const PEOPLE_TABLE = {
  ID: "ID",
  FIRST_NAME: "Prénom",
  LAST_NAME: "Nom",
  GROUP: "Groupe",
  ROLE: "Rôle",
  COMMISSION: "Commission",
  CIRCONSCRIPTION: "Circonscription",
};

export const PERSON_INFO = {
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

export const SIMILAR_PEOPLE = {
  SHARED: "partagées",
};

export const GROUP_COMPARISON = {
  HEADING: "Comparaisons par groupe",
  TOOLTIP:
    "Mesure la similarité du profil de vote de cette personne avec chaque groupe. " +
    "La similarité est basée sur un chevauchement asymétrique pondéré avec lissage bayésien. " +
    "La confiance reflète le nombre de questions communes auxquelles il a été répondu.",
};

export const CATEGORY_ALIGNMENT = {
  HEADING: "Alignement par catégorie",
  TOOLTIP:
    "Mesure l'alignement de cette personne avec son propre groupe par rapport aux autres groupes " +
    "pour chaque catégorie. Positif = la personne correspond à son groupe, négatif = elle s'en démarque.",
};

export const PERSON_DETAIL = {
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

export const PEOPLE_SCATTER = {
  HEADING: "Personnes",
  MEMBERS_BC: "membres (barycentre)",
};

export const GROUPS_SCATTER = {
  HEADING: "Groupes",
};

export const METHODOLOGY = {
  ACCORDION_LABEL: "Méthodologie",
  WHAT_YOU_SEE_HEADING: "Ce que vous voyez",
  WHAT_YOU_SEE_BODY:
    "Cette carte utilise le **Positionnement multidimensionnel classique (MDS)** pour projeter " +
    "la structure complète de similarité en deux dimensions. Chaque point représente une personne " +
    "(ou un groupe), et la distance entre les points reflète leur dissimilarité selon la métrique " +
    "de similarité asymétrique pondérée personnalisée.",
  WHY_MDS_HEADING: "Pourquoi le MDS et non l'ACP ?",
  WHY_MDS_BODY:
    "L'ACP opère sur la matrice de réponses brutes et ignorerait la pondération asymétrique qui " +
    "rend l'accord Oui-Oui plus significatif que l'accord Non-Non. Le MDS travaille directement " +
    "sur la matrice de similarité, donc la disposition 2D reflète fidèlement *votre* métrique.",
  METRIC_HEADING: "La métrique de similarité",
  METRIC_INTRO: "La similarité entre deux personnes est un chevauchement asymétrique pondéré :",
  YES_YES_LABEL: "Oui-Oui",
  YES_YES_DESC: "accord : poids 1,0 (signal fort de conviction partagée)",
  NO_NO_LABEL: "Non-Non",
  NO_NO_DESC: "accord : poids 0,2 (signal plus faible — peuvent être en désaccord pour des raisons différentes)",
  DISAGREE_LABEL: "Désaccord",
  DISAGREE_DESC: "pénalité : −0,5",
  SHRINKAGE_BODY:
    "Le lissage bayésien (Bayesian shrinkage) mélange le score brut de chaque paire avec la moyenne " +
    "globale, pondéré par le nombre de questions qu'ils partagent (paramètre m=10). Cela évite des " +
    "scores anormalement élevés/faibles entre personnes qui se chevauchent à peine.",
  STRESS_HEADING: "Stress",
  STRESS_INTRO:
    "La valeur de **stress** mesure la perte d'information dans la projection 2D :",
  STRESS_GOOD: "Bon ajustement — la structure dominante est bien capturée",
  STRESS_FAIR: "Ajustement acceptable — les principaux motifs sont visibles, avec quelques distorsions",
  STRESS_POOR: "Mauvais ajustement — la réduction en 2D est significative ; à interpréter avec prudence",
  BARYCENTER_HEADING: "Barycentres des groupes",
  BARYCENTER_BODY:
    "Les grands marqueurs en forme de losange sur la carte des personnes montrent le **barycentre** " +
    "de chaque groupe — la position moyenne (x, y) de tous ses membres. Il ne s'agit pas d'une " +
    "analyse distincte ; c'est simplement le centre de gravité des points du groupe.",
  PER_CATEGORY_HEADING: "Vues par catégorie",
  PER_CATEGORY_BODY:
    "Lorsque vous sélectionnez une catégorie, un MDS distinct est calculé en utilisant uniquement " +
    "la similarité des questions de cette catégorie. La disposition peut changer considérablement " +
    "d'une catégorie à l'autre — des personnes qui se regroupent sur un sujet peuvent s'éloigner " +
    "sur un autre.",
};

export const PAGE = {
  TITLE: "Similitudes de Vote",
  DESCRIPTION: "Similitudes de Vote — Analysez les similitudes de vote à travers les groupes",
  NOSCRIPT: "Vous devez activer JavaScript pour utiliser cette application.",
};
