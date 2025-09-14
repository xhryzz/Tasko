import { keyframes, useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  AccessTimeFilledRounded,
  AddRounded,
  BugReportRounded,
  CategoryRounded,
  DeleteForeverRounded,
  DownloadDoneRounded,
  Favorite,
  FavoriteRounded,
  FiberManualRecord,
  GetAppRounded,
  GitHub,
  InstallDesktopRounded,
  InstallMobileRounded,
  IosShareRounded,
  Logout,
  PhoneIphoneRounded,
  PhonelinkRounded,
  SettingsRounded,
  StarRounded,
  TaskAltRounded,
  ThumbUpRounded,
} from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  SwipeableDrawer,
  Tooltip,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CustomDialogTitle, LogoutDialog, SettingsDialog } from ".";
import bmcLogoLight from "../assets/bmc-logo-light.svg";
import bmcLogo from "../assets/bmc-logo.svg";
import { defaultUser } from "../constants/defaultUser";
import { UserContext } from "../contexts/UserContext";
import { fetchBMCInfo } from "../services/bmcApi";
import { fetchGitHubInfo } from "../services/githubApi";
import { DialogBtn, UserAvatar, pulseAnimation, reduceMotion, ring } from "../styles";
import { ColorPalette } from "../theme/themeConfig";
import {
  getProfilePictureFromDB,
  shortRelativeTime,
  showToast,
  systemInfo,
  timeAgo,
} from "../utils";

export const ProfileSidebar = () => {
  const { user, setUser } = useContext(UserContext);
  const { name, profilePicture, tasks, settings } = user;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [openLogoutDialog, setOpenLogoutDialog] = useState<boolean>(false);
  const [openSettings, setOpenSettings] = useState<boolean>(false);

  const [stars, setStars] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [issuesCount, setIssuesCount] = useState<number | null>(null);

  const [bmcSupporters, setBmcSupporters] = useState<number | null>(null);

  const theme = useTheme();
  const n = useNavigate();

  useEffect(() => {
    const fetchRepoInfo: () => Promise<void> = async () => {
      const { repoData, branchData } = await fetchGitHubInfo();
      setStars(repoData.stargazers_count);
      setLastUpdate(branchData.commit.commit.committer.date);
      setIssuesCount(repoData.open_issues_count);
    };

    const fetchBMC: () => Promise<void> = async () => {
      // Obtener datos de la API de Buy Me a Coffee
      const { supportersCount } = await fetchBMCInfo();
      // En caso de que falle la API de BMC
      if (supportersCount > 0) {
        setBmcSupporters(supportersCount);
      } else {
        console.error("No se encontraron seguidores de BMC.");
      }
    };

    fetchBMC();
    fetchRepoInfo();
  }, []);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadProfilePicture = async () => {
      const picture = await getProfilePictureFromDB(profilePicture);
      setAvatarSrc(picture);
    };
    loadProfilePicture();
  }, [profilePicture]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: ReadonlyArray<string>;
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  const [supportsPWA, setSupportsPWA] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  const [openInstalledDialog, setOpenInstalledDialog] = useState<boolean>(false);

  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const detectAppInstallation = () => {
      window.matchMedia("(display-mode: standalone)").addEventListener("change", (e) => {
        setIsAppInstalled(e.matches);
      });
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    detectAppInstallation();

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    };
  }, []);

  const installPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          // if ("setAppBadge" in navigator) {
          //   setUser((prevUser) => ({
          //     ...prevUser,
          //     settings: {
          //       ...prevUser.settings,
          //       appBadge: true,
          //     },
          //   }));
          // }

          // Mostrar un diálogo para informar al usuario que la app ahora se ejecuta como PWA en Windows
          if (systemInfo.os === "Windows") {
            setOpenInstalledDialog(true);
          } else {
            showToast("¡App instalada exitosamente!");
          }
          handleClose();
        }
        if (choiceResult.outcome === "dismissed") {
          showToast("Instalación cancelada.", { type: "error" });
        }
      });
    }
  };

  // const avatarButtonRef = useRef<HTMLButtonElement | null>(null);

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.repeat) return;
  //     if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
  //       e.preventDefault();
  //       if (open) {
  //         setAnchorEl(null);
  //       } else if (avatarButtonRef.current) {
  //         setAnchorEl(avatarButtonRef.current);
  //       }
  //     }
  //   };

  //   document.addEventListener("keydown", handleKeyDown);
  //   return () => document.removeEventListener("keydown", handleKeyDown);
  // }, [open]);

  return (
    <Container>
      <Tooltip title={<div translate={name ? "no" : "yes"}>{name || "Usuario"}</div>}>
        <IconButton
          aria-label="Barra lateral"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          sx={{ zIndex: 1 }}
        >
          <UserAvatar
            src={avatarSrc || undefined}
            alt={name || "Usuario"}
            hasimage={profilePicture !== null}
            pulse={
              user.name === defaultUser.name &&
              user.profilePicture === defaultUser.profilePicture &&
              JSON.stringify(user.settings) === JSON.stringify(defaultUser.settings)
            }
            size="52px"
            onError={() => {
              // Esto evita que el manejo de errores se llame innecesariamente cuando está sin conexión
              if (!navigator.onLine) return;
              setUser((prevUser) => ({
                ...prevUser,
                profilePicture: null,
              }));
              showToast("Error en la URL de la foto de perfil", { type: "error" });
              throw new Error("Error en la URL de la foto de perfil");
            }}
          >
            {name ? name[0].toUpperCase() : undefined}
          </UserAvatar>
        </IconButton>
      </Tooltip>
      <StyledSwipeableDrawer
        disableBackdropTransition={systemInfo.os !== "iOS"}
        disableDiscovery={systemInfo.os === "iOS"}
        id="basic-menu"
        anchor="right"
        open={open}
        onOpen={(e) => e.preventDefault()}
        onClose={handleClose}
      >
        <LogoContainer
          translate="no"
          onClick={() => {
            n("/");
            handleClose();
          }}
        >
          <Logo src="/logo192.png" alt="logo" />
        </LogoContainer>

        <MenuLink to="/">
          <StyledMenuItem onClick={handleClose}>
            <TaskAltRounded /> &nbsp; Tareas
            {tasks.filter((task) => !task.done).length > 0 && (
              <Tooltip title={`${tasks.filter((task) => !task.done).length} tareas por hacer`}>
                <MenuLabel>
                  {tasks.filter((task) => !task.done).length > 99
                    ? "99+"
                    : tasks.filter((task) => !task.done).length}
                </MenuLabel>
              </Tooltip>
            )}
          </StyledMenuItem>
        </MenuLink>

        <MenuLink to="/add">
          <StyledMenuItem onClick={handleClose}>
            <AddRounded /> &nbsp; Agregar Tarea
          </StyledMenuItem>
        </MenuLink>

        {settings.enableCategories !== undefined && settings.enableCategories && (
          <MenuLink to="/categories">
            <StyledMenuItem onClick={handleClose}>
              <CategoryRounded /> &nbsp; Categorías
            </StyledMenuItem>
          </MenuLink>
        )}

        <MenuLink to="/purge">
          <StyledMenuItem onClick={handleClose}>
            <DeleteForeverRounded /> &nbsp; Purgar Tareas
          </StyledMenuItem>
        </MenuLink>

        <MenuLink to="/transfer">
          <StyledMenuItem onClick={handleClose}>
            <GetAppRounded /> &nbsp; Transferir
          </StyledMenuItem>
        </MenuLink>

        <MenuLink to="/sync">
          <StyledMenuItem onClick={handleClose}>
            <PhonelinkRounded /> &nbsp; Sincronizar Dispositivos
            {user.lastSyncedAt && (
              <Tooltip title={`Última sincronización ${timeAgo(new Date(user.lastSyncedAt))}`}>
                <MenuLabel>
                  <span>
                    <AccessTimeFilledRounded style={{ fontSize: "16px" }} />
                    {shortRelativeTime(new Date(user.lastSyncedAt))}
                  </span>
                </MenuLabel>
              </Tooltip>
            )}
          </StyledMenuItem>
        </MenuLink>

        <StyledDivider />

        <MenuLink to="https://github.com/maciekt07/TodoApp">
  <StyledMenuItem translate="no">
    <GitHub className="GitHubIcon" /> &nbsp; Github
  </StyledMenuItem>
</MenuLink>

<MenuLink to="mailto:christian.martinezbx@gmail.com">
  <StyledMenuItem>
    <BugReportRounded className="BugReportRoundedIcon" /> &nbsp; Reportar Problema
  </StyledMenuItem>
</MenuLink>


<MenuLink to="https://www.paypal.com/paypalme/chriismartinezz">
  <StyledMenuItem className="bmcMenu">
    <BmcIcon className="bmc-icon" src={theme.darkmode ? bmcLogoLight : bmcLogo} /> &nbsp;
    Cómprame un café
  </StyledMenuItem>
</MenuLink>


        <StyledDivider />

        {supportsPWA && !isAppInstalled && (
          <StyledMenuItem tabIndex={0} onClick={installPWA}>
            {systemInfo.os === "Android" ? (
              <InstallMobileRounded />
            ) : (
              <InstallDesktopRounded className="InstallDesktopRoundedIcon" />
            )}
            &nbsp; Instalar App
          </StyledMenuItem>
        )}

        {systemInfo.browser === "Safari" &&
          systemInfo.os === "iOS" &&
          !window.matchMedia("(display-mode: standalone)").matches && (
            <StyledMenuItem
              tabIndex={0}
              onClick={() => {
                showToast(
                  <div style={{ display: "inline-block" }}>
                    Para instalar la app en iOS Safari, haz clic en{" "}
                    <IosShareRounded sx={{ verticalAlign: "middle", mb: "4px" }} /> y luego en{" "}
                    <span style={{ fontWeight: "bold" }}>Agregar a Inicio</span>.
                  </div>,
                  { type: "blank", duration: 8000 },
                );
                handleClose();
              }}
            >
              <PhoneIphoneRounded />
              &nbsp; Instalar App
            </StyledMenuItem>
          )}

        <StyledMenuItem
          tabIndex={0}
          onClick={() => {
            handleClose();
            setOpenLogoutDialog(true);
          }}
          sx={{ color: "#ff4040 !important" }}
        >
          <Logout className="LogoutIcon" /> &nbsp; Cerrar Sesión
        </StyledMenuItem>

        <ProfileOptionsBottom>
          <SettingsMenuItem
            tabIndex={0}
            onClick={() => {
              setOpenSettings(true);
              handleClose();
            }}
          >
            <SettingsRounded className="SettingsRoundedIcon" /> &nbsp; Configuración
            {JSON.stringify(settings) === JSON.stringify(defaultUser.settings) &&
              user.darkmode === defaultUser.darkmode &&
              user.theme === defaultUser.theme &&
              user.emojisStyle === defaultUser.emojisStyle && <PulseMenuLabel />}
          </SettingsMenuItem>

          <StyledDivider />
          <MenuLink to="/user">
            <ProfileMenuItem translate={name ? "no" : "yes"} onClick={handleClose}>
              <UserAvatar
                src={avatarSrc || undefined}
                hasimage={profilePicture !== null}
                size="44px"
              >
                {name ? name[0].toUpperCase() : undefined}
              </UserAvatar>
              <h4 style={{ margin: 0, fontWeight: 600 }}> {name || "Usuario"}</h4>{" "}
              {(name === null || name === "") && profilePicture === null && <PulseMenuLabel />}
            </ProfileMenuItem>
          </MenuLink>

          <StyledDivider />

          <CreditsContainer translate="no">
            <span style={{ display: "flex", alignItems: "center" }}>
              Hecho con &nbsp;
              <Favorite sx={{ fontSize: "14px" }} />
            </span>
            <span style={{ marginLeft: "6px", marginRight: "4px" }}>por</span>
            <a
              style={{ textDecoration: "none", color: "inherit" }}
              href="https://www.instagram.com/chriismartinezz/"
            >
              Christian Martinez
            </a>
          </CreditsContainer>

        </ProfileOptionsBottom>
      </StyledSwipeableDrawer>

      <Dialog open={openInstalledDialog} onClose={() => setOpenInstalledDialog(false)}>
        <CustomDialogTitle
          title="¡App instalada exitosamente!"
          subTitle="La app ahora se ejecuta como PWA."
          icon={<DownloadDoneRounded />}
          onClose={() => setOpenInstalledDialog(false)}
        />
        <DialogContent>
          Puedes acceder a ella desde tu pantalla de inicio, con soporte sin conexión y funciones como accesos directos y distintivos.
        </DialogContent>
        <DialogActions>
          <DialogBtn onClick={() => setOpenInstalledDialog(false)}>
            <ThumbUpRounded /> &nbsp; Entendido
          </DialogBtn>
        </DialogActions>
      </Dialog>
      <LogoutDialog open={openLogoutDialog} onClose={() => setOpenLogoutDialog(false)} />
      <SettingsDialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        handleOpen={() => setOpenSettings(true)}
      />
    </Container>
  );
};

const MenuLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const styles: React.CSSProperties = { borderRadius: "14px" };
  if (to.startsWith("/") || to === "") {
    return (
      // Componente Link de React Router para navegación interna
      <Link to={to} style={styles}>
        {children}
      </Link>
    );
  }
  // Renderizar una etiqueta anchor para navegación externa
  return (
    <a href={to} target="_blank" style={styles}>
      {children}
    </a>
  );
};

const PulseMenuLabel = () => {
  return (
    <StyledPulseMenuLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FiberManualRecord style={{ fontSize: "16px" }} />
      </div>
    </StyledPulseMenuLabel>
  );
};

// TODO: hacer que el avatar sea fijo en páginas con TopBar.tsx

const Container = styled.div`
  position: absolute;
  right: 16vw;
  top: 14px;
  z-index: 900;
  @media (max-width: 1024px) {
    right: 16px;
  }
  @media print {
    display: none;
  }
`;

const StyledSwipeableDrawer = styled(SwipeableDrawer)`
  & .MuiPaper-root {
    border-radius: 24px 0 0 0;
    min-width: 300px;
    box-shadow: none;
    padding: 4px 12px;
    color: ${({ theme }) => (theme.darkmode ? ColorPalette.fontLight : "#101727")};
    z-index: 999;

    @media (min-width: 1920px) {
      min-width: 310px;
    }

    @media (max-width: 1024px) {
      min-width: 270px;
    }

    @media (max-width: 600px) {
      min-width: 55vw;
    }

    ${({ theme }) => reduceMotion(theme)}
  }
`;

const LogoutAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.9) translateX(-2px);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const InstallAppAnimation = keyframes`
   0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(2px);
  }
  70% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(0);
  }
`;

const StyledMenuItem = styled(MenuItem)`
  /* margin: 0px 8px; */
  padding: 16px 12px;
  border-radius: 14px;
  box-shadow: none;
  font-weight: 500;
  gap: 6px;

  & svg,
  .bmc-icon {
    transition: 0.4s transform;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => (theme.darkmode ? "#fff" : "#000")};
    background: none;
  }

  &:hover {
    & svg.GitHubIcon {
      transform: rotateY(${2 * Math.PI}rad);
    }
    & svg.BugReportRoundedIcon {
      transform: rotate(45deg) scale(1.1) translateY(-10%);
    }

    & svg.InstallDesktopRoundedIcon {
      animation: ${InstallAppAnimation} 0.8s ease-in alternate;
    }

    & svg.LogoutIcon {
      animation: ${LogoutAnimation} 0.5s ease-in alternate;
    }

    & .bmc-icon {
      animation: ${ring} 2.5s ease-in alternate;
    }
  }

  /* deshabilitar todas las animaciones y transiciones cuando el usuario prefiere movimiento reducido */
  &,
  & svg,
  & .bmc-icon {
    ${({ theme }) => reduceMotion(theme, { transform: "none !important" })}
  }
`;

const SettingsMenuItem = styled(StyledMenuItem)`
  background: ${({ theme }) => (theme.darkmode ? "#1f1f1f" : "#101727")};
  color: ${ColorPalette.fontLight} !important;
  margin-top: 8px !important;
  &:hover {
    background: ${({ theme }) => (theme.darkmode ? "#1f1f1fb2" : "#101727b2")};
    & svg.SettingsRoundedIcon {
      transform: rotate(180deg);
    }
  }
  &:focus-visible {
    background: ${({ theme }) => (theme.darkmode ? "#1f1f1f" : "#101727")};
  }
`;

const ProfileMenuItem = styled(StyledMenuItem)`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => (theme.darkmode ? "#1f1f1f" : "#d7d7d7")};
  &:hover {
    background: ${({ theme }) => (theme.darkmode ? "#1f1f1fb2" : "#d7d7d7b2")};
  }
`;

const MenuLabel = styled.span<{ clr?: string }>`
  margin-left: auto;
  font-weight: 600;
  background: ${({ clr, theme }) => (clr || theme.primary) + "35"};
  color: ${({ clr, theme }) => clr || theme.primary};
  padding: 2px 12px;
  border-radius: 32px;
  font-size: 14px;
  & span {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
`;

const StyledDivider = styled(Divider)`
  margin: 8px 4px;
`;

const StyledPulseMenuLabel = styled(MenuLabel)`
  animation: ${({ theme }) => pulseAnimation(theme.primary, 6)} 1.2s infinite;
  padding: 6px;
  margin-right: 4px;
  ${({ theme }) => reduceMotion(theme)}
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-top: 8px;
  margin-bottom: 16px;
  gap: 12px;
  cursor: pointer;
`;

const Logo = styled.img`
  width: 52px;
  height: 52px;
  margin-left: 12px;
  border-radius: 14px;
`;

const LogoText = styled.h2`
  & span {
    color: #7764e8;
  }
`;

const BmcIcon = styled.img`
  width: 1em;
  height: 1em;
  font-size: 1.5rem;
`;

const ProfileOptionsBottom = styled.div`
  margin-top: auto;
  margin-bottom: ${window.matchMedia("(display-mode: standalone)").matches &&
  /Mobi/.test(navigator.userAgent)
    ? "38px"
    : "16px"};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CreditsContainer = styled.div`
  font-size: 12px;
  margin: 0;
  opacity: 0.8;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  & span {
    backdrop-filter: none !important;
  }
`;