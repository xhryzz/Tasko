import styled from "@emotion/styled";
import {
  CachedRounded,
  CloudOffRounded,
  CloudQueueRounded,
  ExpandMoreRounded,
  Google,
  Microsoft,
  RecordVoiceOverRounded,
  StopCircleRounded,
  VolumeDown,
  VolumeOff,
  VolumeUp,
  WifiOffRounded,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  IconButton,
  MenuItem,
  SelectChangeEvent,
  Slider,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import { Emoji } from "emoji-picker-react";
import { useContext, useEffect, useState } from "react";
import { defaultUser } from "../../../constants/defaultUser";
import { UserContext } from "../../../contexts/UserContext";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import type { AppSettings } from "../../../types/user";
import { getFontColor, systemInfo } from "../../../utils";
import CustomSwitch from "../CustomSwitch";
import {
  NoVoiceStyles,
  SectionHeading,
  StyledListSubheader,
  StyledSelect,
  VolumeSlider,
} from "../settings.styled";

export default function ReadAloudTab() {
  const { user, setUser } = useContext(UserContext);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceVolume, setVoiceVolume] = useState<number>(user.settings.voiceVolume);

  const [prevVoiceVol, setPrevVoiceVol] = useState<number>(user.settings.voiceVolume);
  const [isSampleReading, setIsSampleReading] = useState<boolean>(false);

  const muiTheme = useMuiTheme();
  const isOnline = useOnlineStatus();

  const readAloudEnabled = user.settings.enableReadAloud && "speechSynthesis" in window;

  // Cancelar síntesis de voz cuando se cambian los ajustes de voz
  useEffect(() => {
    if (!readAloudEnabled) {
      return;
    }
    setIsSampleReading(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [readAloudEnabled]);

  // Función para obtener las voces de síntesis de voz disponibles
  // https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
  const getAvailableVoices = (): SpeechSynthesisVoice[] => {
    if (!window.speechSynthesis) {
      return [];
    }

    const voices = window.speechSynthesis.getVoices() ?? [];
    const voiceInfoArray: SpeechSynthesisVoice[] = [];
    for (const voice of voices) {
      voiceInfoArray.push(voice);
    }
    return voiceInfoArray;
  };

  useEffect(() => {
    if (!readAloudEnabled) {
      return;
    }

    const loadVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices ?? []);
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [readAloudEnabled]);

  // Asegurar que las voces se carguen antes de llamar a getAvailableVoices
  if (readAloudEnabled) {
    window.speechSynthesis.onvoiceschanged = () => {
      const availableVoices = getAvailableVoices();
      setAvailableVoices(availableVoices ?? []);
    };
  }

  const handleVoiceChange = (event: SelectChangeEvent<unknown>) => {
    const voice = event.target.value as AppSettings["voice"];
    if (voice) {
      // Actualizar la configuración del usuario con la voz seleccionada
      setUser((prevUser) => ({
        ...prevUser,
        settings: {
          ...prevUser.settings,
          voice,
        },
      }));
    }
  };

  const filteredVoices: SpeechSynthesisVoice[] = availableVoices
    .filter(
      // eliminar voces duplicadas ya que iOS/macOS tiende a duplicarlas por alguna razón
      (value, index, self) =>
        index ===
        self.findIndex(
          (v) =>
            v.lang === value.lang &&
            v.default === value.default &&
            v.localService === value.localService &&
            v.name === value.name &&
            v.voiceURI === value.voiceURI,
        ),
    )
    .sort((a, b) => {
      // priorizar voces que coincidan con el idioma del usuario
      const aIsFromCountry = a.lang.startsWith(navigator.language);
      const bIsFromCountry = b.lang.startsWith(navigator.language);

      if (aIsFromCountry && !bIsFromCountry) {
        return -1;
      }
      if (!aIsFromCountry && bIsFromCountry) {
        return 1;
      }

      // Si ambas o ninguna coinciden con navigator.language, ordenar alfabéticamente por lang
      return a.lang.localeCompare(b.lang);
    });

  const getLanguageRegion = (lang: string) => {
    if (!lang) {
      return "";
    }
    const langParts = lang.split("-");
    if (langParts.length > 1) {
      try {
        return new Intl.DisplayNames([lang], { type: "region" }).of(langParts[1]);
      } catch (error) {
        console.error("Error:", error);
        // Devolver el idioma mismo si hay un error
        return lang;
      }
    } else {
      // Si la región no está especificada, devolver el idioma mismo
      return lang;
    }
  };

  // Función para manejar cambios en el volumen de voz después de soltar el mouse
  const handleVoiceVolCommitChange = (
    _event: Event | React.SyntheticEvent<Element, Event>,
    value: number | number[],
  ) => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        voiceVolume: value as number,
      },
    }));
  };

  // Función para manejar el clic en el botón de silenciar/activar sonido
  const handleMuteClick = () => {
    const vol = voiceVolume;
    // Guardar el volumen de voz anterior antes de silenciar
    setPrevVoiceVol(vol);
    const newVoiceVolume =
      vol === 0 ? (prevVoiceVol !== 0 ? prevVoiceVol : defaultUser.settings.voiceVolume) : 0;
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        voiceVolume: newVoiceVolume,
      },
    }));
    setVoiceVolume(newVoiceVolume);
  };

  const getFlagUnicodes = (countryCode: string): string => {
    // obtener la última parte del código de país (PL de pl-PL)
    const region = countryCode.split("-").pop()?.toUpperCase().slice(0, 2);

    if (!region || region.length !== 2) {
      throw new Error("Formato de código de país inválido");
    }
    // convertir cada letra en un símbolo de indicador regional
    const [codePointA, codePointB] = [...region].map((char) => char.charCodeAt(0) - 0x41 + 0x1f1e6);

    return `${codePointA.toString(16)}-${codePointB.toString(16)}`;
  };

  return (
    <>
      {!("speechSynthesis" in window) && (
        <Alert severity="error">
          <AlertTitle>Síntesis de Voz No Compatible</AlertTitle>
          Tu navegador no soporta texto a voz incorporado.
        </Alert>
      )}
      <CustomSwitch
        settingKey="enableReadAloud"
        header="Habilitar Lectura en Voz Alta"
        text="Carga voces y muestra Leer en Voz Alta en el menú de tareas."
        disabled={!("speechSynthesis" in window)}
      />
      <ReadAloudWrapper active={readAloudEnabled} disabled={!readAloudEnabled}>
        <SectionHeading>Reproducir Muestra</SectionHeading>
        <Button
          variant="contained"
          disabled={!("speechSynthesis" in window)}
          sx={{ color: getFontColor(muiTheme.palette.primary.main), mt: "8px" }}
          onClick={() => {
            if (!readAloudEnabled) return;
            window.speechSynthesis.cancel();
            if (isSampleReading) {
              window.speechSynthesis.pause();
            } else {
              const textToRead = "Este es un texto de muestra para probar la función de síntesis de voz.";
              const utterance = new SpeechSynthesisUtterance(textToRead);
              const voices = window.speechSynthesis.getVoices() ?? [];
              utterance.voice =
                voices.find((voice) => voice.name === user.settings.voice.split("::")[0]) ||
                voices[0];
              utterance.volume = voiceVolume;
              utterance.rate = 1;
              utterance.onend = () => {
                setIsSampleReading(false);
              };
              window.speechSynthesis.speak(utterance);
            }
            setIsSampleReading((prev) => !prev);
          }}
        >
          {isSampleReading ? <StopCircleRounded /> : <RecordVoiceOverRounded />} &nbsp; Reproducir Muestra
        </Button>
        <SectionHeading>Selección de Voz</SectionHeading>
        {filteredVoices.length !== 0 ? (
          <StyledSelect
            value={user.settings.voice}
            variant="outlined"
            disabled={!readAloudEnabled}
            onChange={handleVoiceChange}
            translate="no"
            IconComponent={ExpandMoreRounded}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 500,
                },
              },
            }}
            sx={{
              // fix: evitar que input oculto active cursor/teclado en este select
              "& .MuiSelect-nativeInput": {
                pointerEvents: "none",
              },
            }}
          >
            {(() => {
              // agrupar voces por coincidencia de idioma
              const matchingLanguageVoices = filteredVoices.filter((voice) =>
                voice.lang.startsWith(navigator.language),
              );
              const otherVoices = filteredVoices.filter(
                (voice) => !voice.lang.startsWith(navigator.language),
              );

              // función para renderizar un elemento de voz consistentemente
              const renderVoiceItem = (voice: SpeechSynthesisVoice) => (
                <MenuItem
                  key={`${voice.name}::${voice.lang}`}
                  value={`${voice.name}::${voice.lang}`}
                  translate="no"
                  disabled={voice.localService === false && !isOnline}
                  sx={{
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: voice.localService === false && !isOnline ? "not-allowed" : "pointer",
                  }}
                >
                  {voice.name.startsWith("Google") && <Google sx={{ mr: "8px" }} />}
                  {voice.name.startsWith("Microsoft") && <Microsoft sx={{ mr: "8px" }} />}
                  {voice.name.replace(/^(Google|Microsoft)\s*|\([^()]*\)/gi, "")}
                  <Chip
                    sx={{ fontWeight: 500, padding: "4px", ml: "8px" }}
                    label={getLanguageRegion(voice.lang || "")}
                    icon={
                      <span style={{ fontSize: "16px", alignItems: "center", display: "flex" }}>
                        <Emoji
                          unified={getFlagUnicodes(voice.lang)}
                          emojiStyle={user.emojisStyle}
                          size={18}
                        />
                      </span>
                    }
                  />
                  {voice.default && systemInfo.os !== "iOS" && systemInfo.os !== "macOS" && (
                    <span style={{ fontWeight: 600 }}>&nbsp; Predeterminada</span>
                  )}
                  {voice.localService === false && (
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                      {!isOnline ? (
                        <CloudOffRounded sx={{ fontSize: "18px" }} />
                      ) : (
                        <Tooltip title="Requiere Conexión a Internet" placement="left">
                          <CloudQueueRounded sx={{ fontSize: "18px" }} />
                        </Tooltip>
                      )}
                    </span>
                  )}
                </MenuItem>
              );

              // crear grupos de voces con encabezados
              const createVoiceGroup = (
                voices: SpeechSynthesisVoice[],
                headerText: string,
                headerId: string,
              ) => {
                if (voices.length === 0) return [];

                return [
                  <StyledListSubheader key={headerId}>{headerText}</StyledListSubheader>,
                  ...voices.map(renderVoiceItem),
                ];
              };

              // devolver todos los elementos del menú
              return [
                ...createVoiceGroup(
                  matchingLanguageVoices,
                  `Tu Idioma (${getLanguageRegion(navigator.language)})`,
                  "header-matching",
                ),
                ...createVoiceGroup(otherVoices, "Otros Idiomas", "header-other"),
              ];
            })()}
          </StyledSelect>
        ) : (
          <NoVoiceStyles>
            No hay estilos de voz disponibles.
            {user.settings.enableReadAloud && "speechSynthesis" in window && (
              <Tooltip title="Volver a buscar voces">
                <IconButton
                  size="large"
                  onClick={() => setAvailableVoices(getAvailableVoices() ?? [])}
                >
                  <CachedRounded fontSize="large" />
                </IconButton>
              </Tooltip>
            )}
          </NoVoiceStyles>
        )}
        {!isOnline && availableVoices.some((voice) => voice.localService === false) && (
          <Alert severity="warning" sx={{ mt: "8px" }} icon={<WifiOffRounded />}>
            <AlertTitle>Modo Sin Conexión</AlertTitle>
            Actualmente estás sin conexión. Algunas voces pueden requerir conexión a internet para funcionar.
          </Alert>
        )}
        <SectionHeading>Volumen de Voz</SectionHeading>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <VolumeSlider spacing={2} direction="row" alignItems="center">
            {/* <Tooltip title={voiceVolume ? "Silenciar" : "Activar sonido"}> */}
            <IconButton onClick={handleMuteClick}>
              {voiceVolume === 0 ? (
                <VolumeOff />
              ) : voiceVolume <= 0.4 ? (
                <VolumeDown />
              ) : (
                <VolumeUp />
              )}
            </IconButton>
            {/* </Tooltip> */}
            <Slider
              sx={{
                width: "100%",
              }}
              value={voiceVolume}
              onChange={(_event, value) => setVoiceVolume(value as number)}
              onChangeCommitted={handleVoiceVolCommitChange}
              min={0}
              max={1}
              step={0.01}
              aria-label="Control deslizante de volumen"
              valueLabelFormat={() => {
                const vol = Math.floor(voiceVolume * 100);
                return vol === 0 ? "Silenciado" : vol + "%";
              }}
              valueLabelDisplay="auto"
            />
          </VolumeSlider>
        </div>
      </ReadAloudWrapper>
    </>
  );
}

const ReadAloudWrapper = styled.fieldset<{ active: boolean }>`
  opacity: ${({ active }) => (active ? 1 : 0.6)};
  pointer-events: ${({ active }) => (active ? "auto" : "none")};
  border: none;
  margin: 0;
  padding: 0;

  button,
  input,
  select,
  textarea,
  a {
    pointer-events: ${({ active }) => (active ? "auto" : "none")};
    ${({ active }) => (!active ? "tab-index: -1;" : "")}
  }
`;