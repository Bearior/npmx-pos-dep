"use client";

import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";

const DRAWER_WIDTH = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box className="flex min-h-screen">
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? "100%" : `calc(100% - ${DRAWER_WIDTH}px)`,
          p: { xs: 2, md: 3 },
          pt: { xs: 8, md: 3 },
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
