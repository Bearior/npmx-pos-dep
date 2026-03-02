"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  PointOfSale as PosIcon,
  Dashboard as DashboardIcon,
  Inventory2 as InventoryIcon,
  Receipt as OrdersIcon,
  Assessment as ReportsIcon,
  LocalOffer as DiscountIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "@/providers/AuthProvider";

const NAV_ITEMS = [
  { label: "POS Terminal", href: "/pos", icon: <PosIcon /> },
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon />, roles: ["admin", "manager"] },
  { label: "Orders", href: "/orders", icon: <OrdersIcon /> },
  { label: "Inventory", href: "/inventory", icon: <InventoryIcon />, roles: ["admin", "manager"] },
  { label: "Reports", href: "/reports", icon: <ReportsIcon />, roles: ["admin", "manager"] },
  { label: "Discounts", href: "/discounts", icon: <DiscountIcon />, roles: ["admin", "manager"] },
  { label: "Settings", href: "/settings", icon: <SettingsIcon />, roles: ["admin"] },
];

const DRAWER_WIDTH = 260;

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (profile && item.roles.includes(profile.role))
  );

  const drawerContent = (
    <Box className="flex flex-col h-full">
      {/* Brand */}
      <Box className="flex items-center justify-between px-5 py-4">
        <Typography variant="h6" fontWeight={700} color="primary">
          NPMX POS
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Nav */}
      <List className="flex-1 px-2 py-3">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "#fff",
                    "&:hover": { backgroundColor: "primary.dark" },
                    "& .MuiListItemIcon-root": { color: "#fff" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User info & logout */}
      <Box className="p-4">
        {profile && (
          <Box className="mb-3">
            <Typography variant="body2" fontWeight={600}>
              {profile.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" className="capitalize">
              {profile.role}
            </Typography>
          </Box>
        )}
        <ListItemButton
          onClick={signOut}
          sx={{ borderRadius: 2, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile toggle button – hidden when drawer is open */}
      {isMobile && !mobileOpen && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1300,
            bgcolor: "background.paper",
            boxShadow: 2,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
