import React from "react";
import {Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip, Divider} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {METHODOLOGY} from "../../constants/fr";
import {APP_CONFIG} from "../../constants/config";
import type {ConfigSetOut} from "../../api/types";
import {DATA_COLORS} from "../../theme";
import rootStore from "../../stores/root-store";

function boldSplit(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function lineSplit(text: string) {
  return text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br/>}
      {boldSplit(line)}
    </React.Fragment>
  ));
}

const fmtWeight = (n: number) => n.toFixed(1).replace(".", ",");
const stressGoodPct = Math.round(APP_CONFIG.STRESS_THRESHOLD_GOOD * 100);
const stressFairPct = Math.round(APP_CONFIG.STRESS_THRESHOLD_FAIR * 100);

const MethodologyPanel: React.FC<{configSet: ConfigSetOut | null}> = ({configSet}) => {
  function interpolate(text: string): string {
    let result = text
      .replaceAll("{stress_good}", String(stressGoodPct))
      .replaceAll("{stress_fair}", String(stressFairPct));
    if (configSet) {
      result = result
        .replaceAll("{w_yes}", fmtWeight(configSet.w_yes))
        .replaceAll("{w_no}", fmtWeight(configSet.w_no))
        .replaceAll("{w_mismatch}", fmtWeight(configSet.w_mismatch))
        .replaceAll("{m}", String(configSet.m));
    }
    return result;
  }

  return (
    <Accordion sx={{bgcolor: "background.paper", mb: 2}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
        <Typography variant="subtitle1" sx={{fontWeight: 500}}>
          {METHODOLOGY.ACCORDION_LABEL}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{"& p": {mb: 2}, "& h6": {mt: 1, mb: 0.5}}}>

        {/* ── Partie 1 : grand public ── */}

        <Typography variant="h6">{METHODOLOGY.WHAT_YOU_SEE_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(METHODOLOGY.WHAT_YOU_SEE_BODY)}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.WHY_SHAPE_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(METHODOLOGY.WHY_SHAPE_BODY)}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.COLORS_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(METHODOLOGY.COLORS_BODY)}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.LIMITS_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(interpolate(METHODOLOGY.LIMITS_BODY_SIMPLIFICATION))}
        </Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(interpolate(METHODOLOGY.LIMITS_BODY_STRESS))}
        </Typography>
        <Box sx={{pl: 2, mb: 2}}>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`< ${stressGoodPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(89,161,79,0.2)", color: DATA_COLORS.positive}}/>
            {interpolate(METHODOLOGY.STRESS_GOOD)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`${stressGoodPct}–${stressFairPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(237,201,72,0.2)", color: DATA_COLORS.warning}}/>
            {interpolate(METHODOLOGY.STRESS_FAIR)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`≥ ${stressFairPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: DATA_COLORS.negative}}/>
            {interpolate(METHODOLOGY.STRESS_POOR)}
          </Box>
        </Box>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {boldSplit(interpolate(METHODOLOGY.LIMITS_BODY_SAME_QUESTIONS))}
        </Typography>

        {/* ── Partie 2 : technique ── */}

        <Divider sx={{my: 2}}/>
        <Typography variant="subtitle2" sx={{fontWeight: 600, mb: 1, color: "text.secondary"}}>
          {METHODOLOGY.TECH_DIVIDER_LABEL}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.METRIC_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {lineSplit(interpolate(METHODOLOGY.METRIC_INTRO))}
        </Typography>
        <Box sx={{pl: 2, mb: 2}}>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.YES_YES_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(74,144,217,0.2)", color: DATA_COLORS.primary}}/>
            {interpolate(METHODOLOGY.YES_YES_DESC)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.NO_NO_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(255,255,255,0.08)", color: DATA_COLORS.neutral}}/>
            {interpolate(METHODOLOGY.NO_NO_DESC)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.DISAGREE_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: DATA_COLORS.negative}}/>
            {interpolate(METHODOLOGY.DISAGREE_DESC)}
          </Box>
        </Box>

        {configSet && (
          <>
            <Typography variant="h6">{METHODOLOGY.CONFIGS_HEADING}</Typography>
            <Typography variant="body2" sx={{whiteSpace: "pre-line", mb: 1}}>
              {boldSplit(METHODOLOGY.CONFIGS_INTRO)}
            </Typography>
            <Box sx={{pl: 2, mb: 1, "& table": {borderCollapse: "collapse", width: "100%", typography: "body2"},
                      "& th, & td": {border: "1px solid rgba(255,255,255,0.15)", p: 0.75, textAlign: "center"}}}>
              <table>
                <thead>
                  <tr>
                    <th>{METHODOLOGY.CONFIGS_TABLE_NAME}</th>
                    <th>{METHODOLOGY.CONFIGS_TABLE_W_YES}</th>
                    <th>{METHODOLOGY.CONFIGS_TABLE_W_NO}</th>
                    <th>{METHODOLOGY.CONFIGS_TABLE_W_MISMATCH}</th>
                    <th>{METHODOLOGY.CONFIGS_TABLE_M}</th>
                  </tr>
                </thead>
                <tbody>
                  {rootStore.uiStore.configSets.map((s) => (
                    <tr key={s.id} style={{fontWeight: s.id === configSet?.id ? 700 : 400}}>
                      <td>{s.name}</td>
                      <td>{s.w_yes.toFixed(1)}</td>
                      <td>{s.w_no.toFixed(1)}</td>
                      <td>{s.w_mismatch.toFixed(1)}</td>
                      <td>{s.m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
              {boldSplit(METHODOLOGY.CONFIGS_OUTRO)}
            </Typography>
            <Typography variant="body2" sx={{whiteSpace: "pre-line", mt: 1}}>
              {boldSplit(interpolate(METHODOLOGY.CONFIGS_INTERPRETATION))}
            </Typography>
          </>
        )}

        <Typography variant="h6">{METHODOLOGY.SHRINKAGE_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {lineSplit(interpolate(METHODOLOGY.SHRINKAGE_BODY))}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.MDS_ALGO_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {lineSplit(METHODOLOGY.MDS_ALGO_BODY)}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.STRESS_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {lineSplit(METHODOLOGY.STRESS_INTRO)}
        </Typography>
        <Box sx={{pl: 2, mb: 2}}>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`< ${stressGoodPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(89,161,79,0.2)", color: DATA_COLORS.positive}}/>
            {interpolate(METHODOLOGY.STRESS_GOOD)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`${stressGoodPct}–${stressFairPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(237,201,72,0.2)", color: DATA_COLORS.warning}}/>
            {interpolate(METHODOLOGY.STRESS_FAIR)}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={`≥ ${stressFairPct}%`} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: DATA_COLORS.negative}}/>
            {interpolate(METHODOLOGY.STRESS_POOR)}
          </Box>
        </Box>

        <Typography variant="h6">{METHODOLOGY.PER_CATEGORY_HEADING}</Typography>
        <Typography variant="body2" sx={{whiteSpace: "pre-line"}}>
          {interpolate(METHODOLOGY.PER_CATEGORY_BODY)}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};

export default MethodologyPanel;
