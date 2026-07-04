import React, {useState} from "react";
import {Card, CardContent, Typography, Box, Tooltip} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {AnswerOut} from "../../api/types";
import {ANSWER_GRID} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

interface AnswerGridProps {
  answers: AnswerOut[];
}

function getMajority(answer: AnswerOut): boolean | null {
  return answer.group_majority_yes ?? answer.has_passed;
}

function getSegmentColor(answer: AnswerOut): string {
  if (!answer.present) return DATA_COLORS.absent;
  if (!answer.answered) return DATA_COLORS.abstention;
  const majority = getMajority(answer);
  if (majority === null) return DATA_COLORS.abstention;
  if (answer.value) {
    return majority ? DATA_COLORS.yesSame : DATA_COLORS.yesDifferent;
  }
  return majority ? DATA_COLORS.noDifferent : DATA_COLORS.noSame;
}

function getSegmentLabel(answer: AnswerOut): string {
  if (!answer.present) return ANSWER_GRID.ABSENT;
  if (!answer.answered) return ANSWER_GRID.ABSTENTION;
  const majority = getMajority(answer);
  if (majority === null) return ANSWER_GRID.ABSTENTION;
  if (answer.value) {
    return majority ? ANSWER_GRID.YES_SAME_GROUP : ANSWER_GRID.YES_DIFF_GROUP;
  }
  return majority ? ANSWER_GRID.NO_DIFF_GROUP : ANSWER_GRID.NO_SAME_GROUP;
}

function getSegmentTitle(answer: AnswerOut): string {
  const label = getSegmentLabel(answer);
  const outcome = answer.has_passed ? ANSWER_GRID.PASSED : ANSWER_GRID.NOT_PASSED;
  return answer.vote_text
    ? `${answer.vote_text} — ${label}${answer.answered ? ` · ${outcome}` : ""}`
    : `V${answer.vote_id}: ${label}`;
}

const AnswerGrid: React.FC<AnswerGridProps> = ({answers}) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!answers || answers.length === 0) return null;

  const hovered = hoveredIdx !== null ? answers[hoveredIdx] : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 2}}>
          <Typography variant="h6">{ANSWER_GRID.HEADING}</Typography>
          <Typography variant="caption" color="text.secondary">
            {answers.filter((a) => a.answered).length} / {answers.filter((a) => a.present).length}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, 15px)",
            gap: "1px",
            cursor: "pointer",
          }}
        >
          {answers.map((a, idx) => (
            <Box
              key={a.vote_id}
              sx={{
                width: 15,
                height: 15,
                bgcolor: getSegmentColor(a),
                opacity: hoveredIdx === idx ? 1 : 0.85,
                transition: "opacity 0.15s",
                "&:hover": {opacity: 1},
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => navigate(`/votes/${a.vote_id}`)}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{mt: 0.5, display: "block", minHeight: "1.5em"}}>
          {hovered ? getSegmentTitle(hovered) : "\u00A0"}
        </Typography>

        <Box sx={{display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap"}}>
          {[
            {color: DATA_COLORS.yesSame, label: ANSWER_GRID.YES_SAME, desc: ANSWER_GRID.YES_SAME_DESC},
            {color: DATA_COLORS.noSame, label: ANSWER_GRID.NO_SAME, desc: ANSWER_GRID.NO_SAME_DESC},
            {color: DATA_COLORS.yesDifferent, label: ANSWER_GRID.YES_DIFF, desc: ANSWER_GRID.YES_DIFF_DESC},
            {color: DATA_COLORS.noDifferent, label: ANSWER_GRID.NO_DIFF, desc: ANSWER_GRID.NO_DIFF_DESC},
            {color: DATA_COLORS.abstention, label: ANSWER_GRID.ABSTENTION, desc: ANSWER_GRID.ABSTENTION_DESC},
            {color: DATA_COLORS.absent, label: ANSWER_GRID.ABSENT, desc: ANSWER_GRID.ABSENT_DESC},
          ].map((item) => (
            <Tooltip key={item.label} title={item.desc} arrow>
              <Box sx={{display: "flex", alignItems: "center", gap: 0.5, cursor: "help"}}>
                <Box sx={{width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color}}/>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnswerGrid;
