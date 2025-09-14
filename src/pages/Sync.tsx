import styled from "@emotion/styled";
import {
  AccessTimeRounded,
  CloudSyncRounded,
  QrCodeRounded,
  QrCodeScannerRounded,
  RestartAltRounded,
  SyncProblemRounded,
  WifiOffRounded,
  WifiTetheringRounded,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { TopBar } from "../components";
import QRCodeScannerDialog from "../components/QRCodeScannerDialog";
import { UserContext } from "../contexts/UserContext";
import { useResponsiveDisplay } from "../hooks/useResponsiveDisplay";
import { usePeerSync } from "../hooks/usePeerSync";
import type { OtherDataSyncOption, SyncStatus } from "../types/sync";
import { getFontColor, showToast, timeAgo } from "../utils";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import DisabledThemeProvider from "../contexts/DisabledThemeProvider";

export default function Sync() {
  const { user } = useContext(UserContext);

  const isMobile = useResponsiveDisplay();
  const isOnline = useOnlineStatus();
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  const {
    mode,
    setMode,
    hostPeerId,
    syncStatus,
    startHost,
    connectToHost,
    otherDataSyncOption,
    setOtherDataSyncOption,
    otherDataSource,
    resetAll,
  } = usePeerSync();

  const otherDataSyncOptionRef = useRef(otherDataSyncOption);

  useEffect(() => {
    otherDataSyncOptionRef.current = otherDataSyncOption;
  }, [otherDataSyncOption]);

  useEffect(() => {
    document.title = "Tasko - Sincronizar Datos";
  }, []);

  const handleScan = (text: string | null) => {
    if (!text) return;
    setScannerOpen(false);
    try {
      const scannedId = text.trim();
      setMode("scan");
      connectToHost(scannedId);
    } catch (err) {
      showToast("Error al escanear el código QR", { type: "error" });
      console.error("Error escaneando código QR:", err);
    }
  };

  const getOtherDataSourceLabel = (src: OtherDataSyncOption | null) => {
    if (!src) return null;

    if (src === "this_device") {
      return mode === "display" ? "Este Dispositivo" : "Dispositivo Anfitrión";
    }

    if (src === "other_device") {
      return mode === "display" ? "Otro Dispositivo" : "Este Dispositivo";
    }

    return null;
  };

  return (
    <>
      <TopBar title="Sincronizar Datos" />
      <MainContainer>
        {!mode && (
          <>
            <FeatureDescription>
              <CloudSyncRounded
                sx={{ fontSize: 40, color: (theme) => theme.palette.primary.main }}
              />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Sincronizar Datos Entre Dispositivos
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                Transfiere de forma segura tus tareas, categorías y otros datos entre dispositivos
                escaneando un único código QR usando una conexión peer-to-peer. Ningún dato se
                almacena o procesa en servidores externos.
              </Typography>
              {user.lastSyncedAt && (
                <Tooltip
                  title={new Intl.DateTimeFormat(navigator.language, {
                    dateStyle: "long",
                    timeStyle: "medium",
                  }).format(new Date(user.lastSyncedAt))}
                  placement="top"
                >
                  <LastSyncedText>
                    <AccessTimeRounded /> &nbsp; Última sincronización {timeAgo(new Date(user.lastSyncedAt))}
                  </LastSyncedText>
                </Tooltip>
              )}
              {!isOnline && (
                <Alert icon={<WifiOffRounded />} severity="error" sx={{ textAlign: "left", mt: 4 }}>
                  <AlertTitle>Sin conexión</AlertTitle>
                  Estás sin conexión. Ambos dispositivos deben estar en línea para iniciar una sincronización peer-to-peer.
                </Alert>
              )}
            </FeatureDescription>
            <ModeSelectionContainer>
              <DisabledThemeProvider>
                <SyncButton
                  variant="contained"
                  disabled={!isOnline}
                  onClick={() => {
                    setOtherDataSyncOption("this_device");
                    setMode("display");
                    startHost();
                  }}
                  startIcon={<QrCodeRounded />}
                >
                  Mostrar Código QR
                </SyncButton>
                <SyncButton
                  variant="outlined"
                  disabled={!isOnline}
                  onClick={() => {
                    setScannerOpen(true);
                  }}
                  startIcon={<QrCodeScannerRounded />}
                >
                  Escanear Código QR
                </SyncButton>
              </DisabledThemeProvider>
            </ModeSelectionContainer>
          </>
        )}

        {mode === "display" && (
          <StyledPaper>
            <ModeHeader>
              <WifiTetheringRounded /> Modo Anfitrión
            </ModeHeader>
            {hostPeerId ? (
              isSeverity(syncStatus.severity, "success") ? (
                <SyncSuccessScreen
                  syncStatus={syncStatus}
                  otherDataSource={otherDataSource}
                  getOtherDataSourceLabel={getOtherDataSourceLabel}
                  resetAll={resetAll}
                />
              ) : (
                <Stack spacing={2} alignItems="center">
                  <QRCode
                    value={hostPeerId}
                    size={300}
                    style={{ backgroundColor: "white", borderRadius: "8px", padding: "8px" }}
                  />
                  <QRCodeLabel>Escanea este código QR con otro dispositivo para sincronizar datos</QRCodeLabel>
                  <FormControl>
                    <StyledFormLabel id="sync-radio-buttons-group-label">
                      Sincronizar Configuración de la App & Otros Datos
                    </StyledFormLabel>
                    <RadioGroup
                      row={!isMobile}
                      aria-labelledby="sync-radio-buttons-group-label"
                      name="row-radio-buttons-group"
                      value={otherDataSyncOption}
                      onChange={(e) =>
                        setOtherDataSyncOption(e.target.value as OtherDataSyncOption)
                      }
                    >
                      <StyledFormControlLabel
                        value="this_device"
                        control={<Radio />}
                        label="Este Dispositivo"
                      />
                      <StyledFormControlLabel
                        value="other_device"
                        control={<Radio />}
                        label="Otro Dispositivo"
                      />
                      <StyledFormControlLabel
                        value="no_sync"
                        control={<Radio />}
                        label="No Sincronizar"
                      />
                    </RadioGroup>
                  </FormControl>
                  <Typography
                    sx={{
                      opacity: 0.8,
                      color: (theme) => (theme.palette.mode === "dark" ? "#ffffff" : "#000000"),
                    }}
                  >
                    Las tareas y categorías se sincronizarán automáticamente.
                  </Typography>
                  <SyncStatusAlert syncStatus={syncStatus} />
                  <SyncButton
                    variant="outlined"
                    onClick={resetAll}
                    color={isSeverity(syncStatus.severity, "error") ? "error" : "primary"}
                  >
                    {isSeverity(syncStatus.severity, "error") ? (
                      "Intentar de Nuevo"
                    ) : (
                      <>
                        <RestartAltRounded /> &nbsp; Reiniciar
                      </>
                    )}
                  </SyncButton>
                </Stack>
              )
            ) : (
              <LoadingContainer>
                <CircularProgress size={24} />
                <LoadingText>Inicializando...</LoadingText>
              </LoadingContainer>
            )}
          </StyledPaper>
        )}

        {mode === "scan" && (
          <StyledPaper>
            <ModeHeader>
              <QrCodeScannerRounded /> Modo Escaneo
            </ModeHeader>
            {isSeverity(syncStatus.severity, "success") ? (
              <SyncSuccessScreen
                syncStatus={syncStatus}
                otherDataSource={otherDataSource}
                getOtherDataSourceLabel={getOtherDataSourceLabel}
                resetAll={resetAll}
              />
            ) : (
              <Stack spacing={2} alignItems="center">
                <SyncStatusAlert syncStatus={syncStatus} />
                {(syncStatus.message === "Conectando al anfitrión..." ||
                  syncStatus.message === "Conectado, enviando tus datos...") && (
                  <LoadingContainer>
                    <CircularProgress size={24} />
                    <LoadingText>{syncStatus.message}</LoadingText>
                  </LoadingContainer>
                )}
                <SyncButton
                  variant="outlined"
                  onClick={resetAll}
                  color={isSeverity(syncStatus.severity, "error") ? "error" : "primary"}
                >
                  {isSeverity(syncStatus.severity, "error") ? (
                    "Intentar de Nuevo"
                  ) : (
                    <>
                      <RestartAltRounded /> &nbsp; Reiniciar
                    </>
                  )}
                </SyncButton>
              </Stack>
            )}
          </StyledPaper>
        )}

        <QRCodeScannerDialog
          subTitle="Escanea un código QR para sincronizar."
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(result) => {
            if (result && result[0]?.rawValue) handleScan(result[0].rawValue);
          }}
          onError={(err) => {
            console.error("Error de escaneo QR:", err);
            showToast("Error al escanear QR.", { type: "error" });
            setScannerOpen(false);
          }}
        />
      </MainContainer>
    </>
  );
}
export function SyncSuccessScreen({
  syncStatus,
  otherDataSource,
  getOtherDataSourceLabel,
  resetAll,
}: {
  syncStatus: SyncStatus;
  otherDataSource: OtherDataSyncOption | null;
  getOtherDataSourceLabel: (src: OtherDataSyncOption | null) => string | null;
  resetAll: () => void;
}) {
  return (
    <Stack spacing={2} alignItems="center">
      <StyledAlert severity={syncStatus.severity} icon={undefined}>
        <b>Sincronización Completada</b>
        <div>{syncStatus.message || "Inactivo"}</div>
      </StyledAlert>
      {otherDataSource && (
        <Typography
          sx={{
            fontSize: 12,
            opacity: 0.8,
            color: (theme) => (theme.palette.mode === "dark" ? "#ffffff" : "#000000"),
          }}
        >
          La configuración y otros datos{" "}
          {otherDataSource === "no_sync" ? (
            "no se sincronizaron."
          ) : (
            <>
              se importaron desde <b>{getOtherDataSourceLabel(otherDataSource)}.</b>
            </>
          )}
        </Typography>
      )}
      <SyncButton
        variant="outlined"
        onClick={resetAll}
        color={syncStatus.severity === "success" ? "success" : "primary"}
      >
        Hecho
      </SyncButton>
    </Stack>
  );
}

function SyncStatusAlert({ syncStatus }: { syncStatus: SyncStatus }) {
  return (
    <StyledAlert
      severity={syncStatus.severity}
      //@ts-expect-error it works
      color={isSeverity(syncStatus.severity, "info") ? "primary" : undefined}
      icon={
        syncStatus.severity === "error" || syncStatus.severity === "warning" ? (
          <SyncProblemRounded />
        ) : undefined
      }
    >
      <AlertTitle>
        {syncStatus.severity === "error"
          ? "Error"
          : syncStatus.severity === "warning"
            ? "Advertencia"
            : "Estado"}
      </AlertTitle>
      {syncStatus.message || "Inactivo"}
    </StyledAlert>
  );
}

function isSeverity<T extends SyncStatus["severity"]>(
  sev: SyncStatus["severity"],
  value: T,
): sev is T {
  return sev === value;
}

const MainContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 20px;
  max-width: 600px !important;
`;

const FeatureDescription = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const ModeHeader = styled.h5`
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
  font-weight: 600;
  font-size: 1.4rem;
  text-align: center;
  margin: 0;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const LastSyncedText = styled(Typography)`
  color: ${({ theme }) => getFontColor(theme.secondary)};
  opacity: 0.9;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModeSelectionContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
`;

const StyledPaper = styled.div`
  padding: 24px;
  border-radius: 24px;
  background: ${({ theme }) => (theme.darkmode ? "#1f1f1f" : "#ffffff")};
  width: 100%;
  text-align: center;
`;

const QRCodeLabel = styled(Typography)`
  font-weight: 600;
  max-width: 310px;
  margin: 0;
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
`;

const SyncButton = styled(Button)`
  padding: 12px 24px;
  border-radius: 14px;
  font-weight: 600;
  min-width: 180px;
`;

const StyledAlert = styled(Alert)`
  width: 100%;
  max-width: 400px;
  text-align: left;
  & .MuiAlert-message {
    width: 100%;
  }
  @media (max-width: 768px) {
    max-width: 350px;
  }
`;

const LoadingText = styled(Typography)`
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
`;

const StyledFormLabel = styled(FormLabel)`
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
  opacity: 0.8;
  &.Mui-focused {
    color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
`;