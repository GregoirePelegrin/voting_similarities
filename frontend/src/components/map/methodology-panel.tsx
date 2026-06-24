import React from "react";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const MethodologyPanel: React.FC = () => {
  return (
    <Accordion sx={{ bgcolor: "background.paper", mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Methodology
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ "& p": { mb: 2 }, "& h6": { mt: 1, mb: 0.5 } }}>
        <Typography variant="h6">What you're seeing</Typography>
        <Typography variant="body2">
          This map uses <strong>Classical Multidimensional Scaling (MDS)</strong> to project
          the full similarity structure into two dimensions. Each point represents a person (or
          group), and the distance between points reflects how dissimilar they are according to
          the custom weighted asymmetric similarity metric.
        </Typography>

        <Typography variant="h6">Why MDS, not PCA?</Typography>
        <Typography variant="body2">
          PCA operates on the raw answer matrix and would ignore the asymmetric weighting that
          makes Yes-Yes agreement more meaningful than No-No agreement. MDS works directly on
          the similarity matrix, so the 2D layout faithfully reflects <em>your</em> metric.
        </Typography>

        <Typography variant="h6">The similarity metric</Typography>
        <Typography variant="body2">
          The underlying similarity between two people is a weighted asymmetric overlap:
        </Typography>
        <Box sx={{ pl: 2, mb: 2 }}>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="Yes-Yes" size="small" sx={{ mr: 0.5, bgcolor: "rgba(74,144,217,0.2)", color: "#4A90D9" }} />
            agreement: weight 1.0 (strong signal of shared conviction)
          </Box>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="No-No" size="small" sx={{ mr: 0.5, bgcolor: "rgba(255,255,255,0.08)", color: "#9EAAB8" }} />
            agreement: weight 0.2 (weaker signal — may agree for different reasons)
          </Box>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="Disagree" size="small" sx={{ mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: "#E15759" }} />
            penalty: −0.5
          </Box>
        </Box>
        <Typography variant="body2">
          Bayesian shrinkage blends each pair's raw score with the global mean, weighted by how
          many questions they share (parameter m=10). This prevents spurious high/low scores
          between people who barely overlap.
        </Typography>

        <Typography variant="h6">Stress</Typography>
        <Typography variant="body2">
          The <strong>stress</strong> value measures how much information is lost in the 2D projection:
        </Typography>
        <Box sx={{ pl: 2, mb: 2 }}>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="< 10%" size="small" sx={{ mr: 0.5, bgcolor: "rgba(89,161,79,0.2)", color: "#59A14F" }} />
            Good fit — the dominant structure is well captured
          </Box>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="10–20%" size="small" sx={{ mr: 0.5, bgcolor: "rgba(237,201,72,0.2)", color: "#EDC948" }} />
            Fair fit — main patterns visible, some distortion
          </Box>
          <Box sx={{ typography: "body2", mb: 0.5, display: "flex", alignItems: "center" }}>
            <Chip label="≥ 20%" size="small" sx={{ mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: "#E15759" }} />
            Poor fit — 2D is a significant reduction; interpret with caution
          </Box>
        </Box>

        <Typography variant="h6">Group barycenters</Typography>
        <Typography variant="body2">
          The larger diamond markers on the people map show each group's <strong>barycenter</strong>{" "}
          — the mean (x, y) position of all members. This is not a separate analysis; it's
          simply the center of gravity of the group's points.
        </Typography>

        <Typography variant="h6">Per-category views</Typography>
        <Typography variant="body2">
          When you select a category, a separate MDS is computed using only the similarity from
          questions in that category. The layout may change significantly across categories —
          people who cluster together on one topic may spread apart on another.
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};

export default MethodologyPanel;
