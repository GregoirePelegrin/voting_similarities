import React, { useState } from "react";
import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { AnswerOut } from "../../api/types";

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
  if (!answer.answered) return SEGMENT_COLORS.missing;
  if (answer.value) {
    return answer.has_passed ? SEGMENT_COLORS.yesSame : SEGMENT_COLORS.yesDifferent;
  }
  return answer.has_passed ? SEGMENT_COLORS.noDifferent : SEGMENT_COLORS.noSame;
}

function getSegmentLabel(answer: AnswerOut): string {
  if (!answer.answered) return "No answer";
  if (answer.value) {
    return answer.has_passed ? "Yes — same as group" : "Yes — different from group";
  }
  return answer.has_passed ? "No — different from group" : "No — same as group";
}

const AnswerGrid: React.FC<AnswerGridProps> = observer(({ answers }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!answers || answers.length === 0) return null;

  const segmentWidth = 100 / answers.length;

  return (
    <Card sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="h6">Answers</Typography>
          <Typography variant="caption" color="text.secondary">
            ({answers.length} questions)
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            height: 24,
            borderRadius: 1,
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {answers.map((a, idx) => {
            const color = getSegmentColor(a);
            const label = getSegmentLabel(a);
            const outcome = a.has_passed ? "Passed" : "Not passed";
            const title = a.question_text
              ? `${a.question_text} — ${label}${a.answered ? ` · ${outcome}` : ""}`
              : `Q${a.question_id}: ${label}`;

            return (
              <Tooltip key={a.question_id} title={title} arrow placement="top">
                <Box
                  sx={{
                    width: `${segmentWidth}%`,
                    minWidth: 1,
                    bgcolor: color,
                    opacity: hoveredIdx === idx ? 1 : 0.85,
                    transition: "opacity 0.15s",
                    "&:hover": { opacity: 1 },
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => navigate(`/questions/${a.question_id}`)}
                />
              </Tooltip>
            );
          })}
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
          {[
            { color: SEGMENT_COLORS.yesSame, label: "Yes, same as group" },
            { color: SEGMENT_COLORS.noSame, label: "No, same as group" },
            { color: SEGMENT_COLORS.yesDifferent, label: "Yes, different" },
            { color: SEGMENT_COLORS.noDifferent, label: "No, different" },
            { color: SEGMENT_COLORS.missing, label: "No answer" },
          ].map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color }} />
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});

export default AnswerGrid;
