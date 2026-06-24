import React from "react";
import { Card, Typography, Box, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CategoryAlignmentOut } from "../../api/types";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface CategoryAlignmentCardProps {
  alignments: CategoryAlignmentOut[];
}

const CategoryAlignmentCard: React.FC<CategoryAlignmentCardProps> = observer(
  ({ alignments }) => {
    if (!alignments || alignments.length === 0) return null;

    const maxAbs = Math.max(...alignments.map((a) => Math.abs(a.alignment)), 0.01);

    return (
      <Card sx={{ bgcolor: "background.paper", p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="h6">Category Alignment</Typography>
          <Tooltip title="How well each category aligns this person with their own group versus other groups. Positive = fits their group, negative = differs from their group.">
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          </Tooltip>
        </Box>

        {alignments.map((a) => {
          const width = (Math.abs(a.alignment) / maxAbs) * 50;
          const isPositive = a.alignment >= 0;

          return (
            <Box key={a.category_id} sx={{ mb: 1.5 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {a.category_name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flex: 1, position: "relative", height: 12 }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: "50%",
                      width: 1,
                      height: "100%",
                      bgcolor: "rgba(255,255,255,0.2)",
                    }}
                  />
                  {isPositive ? (
                    <Box
                      sx={{
                        position: "absolute",
                        left: "50%",
                        width: `${width}%`,
                        height: "100%",
                        bgcolor: "#59A14F",
                        borderRadius: "0 4px 4px 0",
                        opacity: 0.8,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        right: "50%",
                        width: `${width}%`,
                        height: "100%",
                        bgcolor: "#E15759",
                        borderRadius: "4px 0 0 4px",
                        opacity: 0.8,
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    minWidth: 50,
                    textAlign: "right",
                    color: isPositive ? "#59A14F" : "#E15759",
                    fontWeight: 500,
                  }}
                >
                  {a.alignment >= 0 ? "+" : ""}
                  {a.alignment.toFixed(3)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Card>
    );
  }
);

export default CategoryAlignmentCard;
