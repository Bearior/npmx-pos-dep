"use client";

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ message = "Loading…", fullScreen = false }: Props) {
  return (
    <Box
      className="flex flex-col items-center justify-center"
      sx={{ minHeight: fullScreen ? "100vh" : 300 }}
    >
      <CircularProgress color="primary" size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
}
