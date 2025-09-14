import { Box, Divider, FormGroup, FormLabel, Link, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import baner from "../../../assets/baner.webp";
import { Inventory2Rounded } from "@mui/icons-material";
import { systemInfo } from "../../../utils";

export default function AboutTab() {
  const [storageUsage, setStorageUsage] = useState<number | undefined>(undefined);

  useEffect(() => {
    const getStorageUsage = async () => {
      const storageUsage = await navigator.storage.estimate();
      setStorageUsage(storageUsage.usage);
    };
    getStorageUsage();
  }, []);

  return (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        📝 Una aplicación de tareas sencilla creada con React.js y MUI, con muchas funciones, incluyendo
        compartir tareas mediante enlace, sincronización P2P usando WebRTC, personalización de temas y uso
        sin conexión como una Progressive Web App (PWA).
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mt: 2 }}>
        Creado por <Link href="https://github.com/maciekt07https://www.instagram.com/chriismartinezz/">chriismartinezz</Link> <br />
        Puedes hacerme una donación:{" "}
        <Link href="https://www.paypal.com/paypalme/chriismartinezz" target="_blank" rel="noopener noreferrer">
          PayPal
        </Link>
      </Typography>
      {storageUsage !== undefined && storageUsage !== 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <FormGroup>
            <FormLabel sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Inventory2Rounded sx={{ fontSize: "18px" }} />
              Uso de Almacenamiento
            </FormLabel>
            <Box sx={{ mt: "2px" }}>
              {storageUsage ? `${(storageUsage / 1024 / 1024).toFixed(2)} MB` : "0 MB"}
              {systemInfo.os === "iOS" && " / 50 MB"}
            </Box>
          </FormGroup>
        </>
      )}
    </>
  );
}
