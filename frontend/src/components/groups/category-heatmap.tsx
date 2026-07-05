import React from "react";
import {Card, CardContent, Typography, Box, Tooltip} from "@mui/material";
import {observer} from "mobx-react-lite";
import {SimilarGroupOut} from "../../api/types";
import rootStore from "../../stores/root-store";
import {CATEGORY_HEATMAP} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";
import {redGreyGreenGradient} from "../../utils/colors";

interface CategoryHeatmapProps {
  similarGroups: SimilarGroupOut[];
  groupColor: string;
  categoriesLabel?: string;
}

const CategoryHeatmap: React.FC<CategoryHeatmapProps> = observer(({similarGroups, groupColor, categoriesLabel}) => {
  const {categoriesStore} = rootStore;

  const rows = similarGroups
    .map((sg) => {
      const catSims: Record<string, number> = {};
      if (sg.per_category) {
        for (const [cid, sim] of Object.entries(sg.per_category)) {
          const catId = Number(cid);
          if (!Number.isInteger(catId)) continue;
          const cat = categoriesStore.categories.find((c) => c.id === catId);
          catSims[cat?.name ?? cid] = sim;
        }
      }
      return {name: sg.name_short || sg.name, color: sg.color, ...catSims};
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (rows.length === 0) return null;

  const catNames = Object.keys(rows[0]).filter((k) => k !== "name" && k !== "color").sort();

  return (
    <Card>
      <CardContent>
        <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 2}}>
          <Typography variant="h6">{CATEGORY_HEATMAP.HEADING}</Typography>
          {categoriesLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ml: "auto", fontStyle: "italic"}}>
              {categoriesLabel}
            </Typography>
          )}
        </Box>
        <Box sx={{overflowX: "auto"}}>
          <Box sx={{minWidth: Math.max(600, catNames.length * 60)}}>
            <table style={{width: "100%", borderCollapse: "collapse"}}>
              <thead>
              <tr>
                <th style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  color: DATA_COLORS.neutral,
                  fontSize: 12
                }}>{CATEGORY_HEATMAP.GROUP}</th>
                {catNames.map((cn) => (
                  <th key={cn} style={{
                    textAlign: "center",
                    padding: "8px 4px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    color: DATA_COLORS.neutral,
                    fontSize: 11,
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    maxWidth: 40
                  }}>
                    {cn}
                  </th>
                ))}
              </tr>
              </thead>
              <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td style={{padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                      <Box sx={{width: 8, height: 8, borderRadius: "50%", bgcolor: row.color}}/>
                      <Typography variant="caption">{row.name}</Typography>
                    </Box>
                  </td>
                  {catNames.map((cn) => {
                    const val = (row as any)[cn] as number | undefined;
                    return (
                      <td key={cn} style={{
                        textAlign: "center",
                        padding: "4px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)"
                      }}>
                        <Tooltip
                          title={val != null ? `${(val * 100).toFixed(1)}%` : CATEGORY_HEATMAP.NA}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              bgcolor: val != null ? redGreyGreenGradient(val) : "rgba(255,255,255,0.03)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto",
                              cursor: "default",
                            }}
                          >
                            {val != null && (
                              <Typography variant="caption" sx={{
                                fontSize: 9,
                                fontVariantNumeric: "tabular-nums"
                              }}>
                                {(val * 100).toFixed(0)}
                              </Typography>
                            )}
                          </Box>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
              </tbody>
            </table>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

export default CategoryHeatmap;
