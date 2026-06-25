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

    return (
      <Card sx={{ bgcolor: "background.paper", p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="h6">Category Alignment</Typography>
          <Tooltip title="How well each category aligns this person with their own group versus other groups. Positive = fits their group, negative = differs from their group. Scale is fixed from -1 to +1.">
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex" }}>
          <Box sx={{ minWidth: 180, mr: 2 }}>
            {alignments.map((a) => (
              <Box
                key={a.category_id}
                sx={{
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.category_name}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ position: "relative", mb: 0.5, height: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ position: "absolute", left: 0, top: 0 }}>-1</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0 }}>0</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ position: "absolute", right: 0, top: 0 }}>+1</Typography>
            </Box>

            {alignments.map((a) => {
              const width = Math.abs(a.alignment) * 50;
              const isPositive = a.alignment >= 0;

              return (
                <Box key={a.category_id} sx={{ position: "relative", height: 28, mb: 0.5 }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: "50%",
                      width: 1,
                      height: "100%",
                      bgcolor: "rgba(255,255,255,0.15)",
                    }}
                  />
                  <Tooltip title={`${a.category_name}: ${a.alignment >= 0 ? "+" : ""}${a.alignment.toFixed(3)}`}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        ...(isPositive
                          ? { left: "50%", width: `${width}%`, borderRadius: "0 3px 3px 0" }
                          : { right: "50%", width: `${width}%`, borderRadius: "3px 0 0 3px" }),
                        height: 20,
                        bgcolor: isPositive ? "#59A14F" : "#E15759",
                        opacity: 0.8,
                        transition: "width 0.4s ease-out",
                      }}
                    />
                  </Tooltip>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ minWidth: 55, ml: 1 }}>
            {alignments.map((a) => {
              const isPositive = a.alignment >= 0;
              return (
                <Box
                  key={a.category_id}
                  sx={{ height: 28, display: "flex", alignItems: "center", mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: isPositive ? "#59A14F" : "#E15759",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {isPositive ? "+" : ""}
                    {a.alignment.toFixed(2)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>
    );
  }
);

export default CategoryAlignmentCard;
