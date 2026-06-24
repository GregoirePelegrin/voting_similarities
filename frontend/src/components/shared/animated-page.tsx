import React, { useEffect, useRef, useState } from "react";
import { Box, Fade } from "@mui/material";

interface AnimatedPageProps {
  children: React.ReactNode;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(false);

  useEffect(() => {
    if (!ref.current) {
      ref.current = true;
      setShow(true);
    }
  }, []);

  return (
    <Fade in={show} timeout={400}>
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>{children}</Box>
    </Fade>
  );
};

export default AnimatedPage;
