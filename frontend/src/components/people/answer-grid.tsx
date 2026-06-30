import React, {useState} from "react";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {AnswerOut} from "../../api/types";
import {ANSWER_GRID} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

interface AnswerGridProps {
  answers: AnswerOut[];
}

const SEGMENT_COLORS = {
  missing: "#555555",
  yesSame: "#59A14F",
  yesDifferent: "#4A90D9",
  noSame: "#E15759",
  noDifferent: "#B07AA1",
};

function getSegmentColor(answer: AnswerOut): string {
  if (!answer.answered) return DATA_COLORS.missing;
  if (answer.value) {
    return answer.has_passed ? DATA_COLORS.yesSame : DATA_COLORS.yesDifferent;
  }
  return answer.has_passed ? DATA_COLORS.noDifferent : DATA_COLORS.noSame;
}

function getSegmentLabel(answer: AnswerOut): string {
  if (!answer.answered) return ANSWER_GRID.NO_ANSWER;
  if (answer.value) {
    return answer.has_passed ? ANSWER_GRID.YES_SAME_GROUP : ANSWER_GRID.YES_DIFF_GROUP;
  }
  return answer.has_passed ? ANSWER_GRID.NO_DIFF_GROUP : ANSWER_GRID.NO_SAME_GROUP;
}

function getSegmentTitle(answer: AnswerOut): string {
  const label = getSegmentLabel(answer);
  const outcome = answer.has_passed ? ANSWER_GRID.PASSED : ANSWER_GRID.NOT_PASSED;
  return answer.question_text
    ? `${answer.question_text} — ${label}${answer.answered ? ` · ${outcome}` : ""}`
    : `Q${answer.question_id}: ${label}`;
}

const AnswerGrid: React.FC<AnswerGridProps> = ({answers}) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!answers || answers.length === 0) return null;

  const hovered = hoveredIdx !== null ? answers[hoveredIdx] : null;

  return (
    <Card sx={{bgcolor: "background.paper"}}>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 2}}>
          <Typography variant="h6">{ANSWER_GRID.HEADING}</Typography>
          <Typography variant="caption" color="text.secondary">
            ({answers.filter((a) => a.answered).length} / {answers.length})
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
              key={a.question_id}
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
              onClick={() => navigate(`/questions/${a.question_id}`)}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{mt: 0.5, display: "block", minHeight: "1.5em"}}>
          {hovered ? getSegmentTitle(hovered) : "\u00A0"}
        </Typography>

        <Box sx={{display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap"}}>
          {[
            {color: DATA_COLORS.yesSame, label: ANSWER_GRID.YES_SAME},
            {color: DATA_COLORS.noSame, label: ANSWER_GRID.NO_SAME},
            {color: DATA_COLORS.yesDifferent, label: ANSWER_GRID.YES_DIFF},
            {color: DATA_COLORS.noDifferent, label: ANSWER_GRID.NO_DIFF},
            {color: DATA_COLORS.missing, label: ANSWER_GRID.NO_ANSWER},
          ].map((item) => (
            <Box key={item.label} sx={{display: "flex", alignItems: "center", gap: 0.5}}>
              <Box sx={{width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color}}/>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnswerGrid;
