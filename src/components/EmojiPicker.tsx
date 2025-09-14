import { useTheme as useEmotionTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  AddReaction,
  AutoAwesome,
  Edit,
  EmojiEmotions,
  RemoveCircleOutline,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Tooltip,
} from "@mui/material";
import EmojiPicker, {
  Emoji,
  EmojiClickData,
  EmojiStyle,
  SuggestionMode,
  Theme,
} from "emoji-picker-react";
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import { CATEGORY_NAME_MAX_LENGTH, TASK_NAME_MAX_LENGTH } from "../constants";
import { UserContext } from "../contexts/UserContext";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { DialogBtn, fadeIn, reduceMotion } from "../styles";
import { ColorPalette } from "../theme/themeConfig";
import { getFontColor, showToast, systemInfo } from "../utils";
import { CustomDialogTitle } from "./DialogTitle";
import DisabledThemeProvider from "../contexts/DisabledThemeProvider";

interface EmojiPickerProps {
  emoji?: string;
  setEmoji: Dispatch<SetStateAction<string | null>>; // TODO: usar onEmojiChange en su lugar
  color?: string;
  name?: string;
  type?: "task" | "category";
}

export const CustomEmojiPicker = ({ emoji, setEmoji, color, name, type }: EmojiPickerProps) => {
  const { user, setUser } = useContext(UserContext);
  const { emojisStyle, settings } = user;
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(emoji || null);

  const isOnline = useOnlineStatus();
  const emotionTheme = useEmotionTheme();

  interface EmojiItem {
    unified: string;
    original: string;
    count: number;
  }

  const getFrequentlyUsedEmojis = (): string[] => {
    const frequentlyUsedEmojis: EmojiItem[] | null = JSON.parse(
      localStorage.getItem("epr_suggested") || "null",
    );

    if (!frequentlyUsedEmojis) {
      return [];
    }

    frequentlyUsedEmojis.sort((a, b) => b.count - a.count);
    const topEmojis: EmojiItem[] = frequentlyUsedEmojis.slice(0, 6);
    const topUnified: string[] = topEmojis.map((item) => item.unified);

    return topUnified;
  };

  // Cuando cambia el estado currentEmoji, actualizar el estado emoji del componente padre
  useEffect(() => {
    setEmoji(currentEmoji);
  }, [currentEmoji, setEmoji]);

  // Cuando la propiedad emoji cambia a una cadena vacía, establecer el estado currentEmoji a undefined
  useEffect(() => {
    if (emoji === "") {
      setCurrentEmoji(null);
    }
  }, [emoji]);

  // Función para alternar la visibilidad del EmojiPicker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prevState) => !prevState);
  };

  // Función manejadora para cuando se hace clic en un emoji en el EmojiPicker
  const handleEmojiClick = (e: EmojiClickData) => {
    toggleEmojiPicker();
    setCurrentEmoji(e.unified);
  };

  const handleRemoveEmoji = () => {
    toggleEmojiPicker();
    setCurrentEmoji(null);
  };

  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [session, setSession] = useState<LanguageModel | null>(null);

  // Crear Sesión al montar el componente para una primera carga más rápida
  useEffect(() => {
    const createSession = async () => {
      if ("LanguageModel" in window) {
        const session = await LanguageModel.create();
        setSession(session);
      }
    };
    createSession();
  }, []);

  // ‼ Esta característica solo funciona en Chrome (Dev / Canary) versión 127 o superior con algunas flags habilitadas y el modelo Gemini Nano instalado
  // https://developer.chrome.com/docs/ai/built-in
  async function useAI(): Promise<void> {
    const start = new Date().getTime();
    setIsAILoading(true);
    try {
      const sessionInstance: LanguageModel = session || (await LanguageModel.create());

      // chrome://flags/#text-safety-classifier debe estar deshabilitado para que este prompt funcione
      const response = await sessionInstance.prompt(
        `Responde con SOLO UN emoji que mejor represente esta tarea: "${name}". NO incluyas ningún otro texto, explicaciones o símbolos. Solo el ÚNICO emoji.`,
      );

      console.log("Respuesta completa de IA:", response);

      // esto no separa los emojis en caracteres individuales
      const emojiRegex =
        /\p{RI}\p{RI}|\p{Emoji}(\p{EMod}+|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?(\u{200D}\p{Emoji}(\p{EMod}+|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?)+|\p{EPres}(\p{EMod}+|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?|\p{Emoji}(\p{EMod}+|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})/gu;

      const extractedEmojis = response.trim().replace(/\*/g, "").match(emojiRegex) || [];

      // Eliminar duplicados
      const uniqueEmojis = [...new Set(extractedEmojis)];
      console.log("Emojis únicos:", uniqueEmojis);

      if (uniqueEmojis.length === 0) {
        setCurrentEmoji(null);
        showToast(
          <div>
            <b>No se encontró ningún emoji.</b> <br /> Por favor intenta con un nombre de {type} diferente.
          </div>,
          {
            type: "error",
          },
        );
        console.error("No se encontró ningún emoji.");
        return;
      }

      let emojiResponse = uniqueEmojis[0];

      // Verificar si el emoji necesita ser reemplazado
      const emojiMap: {
        [key: string]: string;
      } = {
        "☮": "✌️",
        "🎙": "🎙️",
        "🗣": "🗣️",
        "✈": "✈️",
        "🍽": "🍽️",
        "⌨": "⌨️",
        "🖱": "🖱️",
      };

      if (emojiResponse in emojiMap) {
        emojiResponse = emojiMap[emojiResponse];
        console.log("Emoji reemplazado con:", emojiResponse);
      }

      const unified = emojiToUnified(emojiResponse.replaceAll(":", ""));
      console.log("Emoji unificado:", unified);

      if (emojiRegex.test(emojiResponse)) {
        setIsAILoading(false);
        setCurrentEmoji(unified);
      } else {
        setCurrentEmoji(null);
        showToast(
          <div>
            <b>Emoji inválido.</b> <br /> Por favor intenta con un nombre de {type} diferente.
          </div>,
          {
            type: "error",
          },
        );
        console.error("Emoji inválido.", unified);
      }
    } catch (error) {
      setIsAILoading(false);
      setCurrentEmoji(null);
      console.error(error);
      showToast(
        <div>
          <b>Error al generar emoji.</b>
          <br />
          {String(error)}
        </div>,
        { type: "error", duration: 8000 },
      );
    } finally {
      setIsAILoading(false);
      const end = new Date().getTime();
      console.log(
        `%cTomó ${end - start}ms en generar.`,
        `color: ${end - start > 1500 ? "orange" : "lime"}`,
      );
    }
  }

  const emojiToUnified = (emoji: string): string => {
    return Array.from(emoji)
      .map((char) => char.codePointAt(0)?.toString(16).toUpperCase() || "")
      .join("-")
      .toLowerCase();
  };

  // fin del código de característica experimental de IA

  // Función para renderizar el contenido del Avatar basado en si se ha seleccionado un emoji o no
  const renderAvatarContent = () => {
    const fontColor = color ? getFontColor(color) : ColorPalette.fontLight;
    if (isAILoading) {
      return <CircularProgress size={40} thickness={5} sx={{ color: fontColor }} />;
    }
    if (currentEmoji) {
      const emojiSize =
        emojisStyle === EmojiStyle.NATIVE && systemInfo.os === "iOS"
          ? 64
          : emojisStyle === EmojiStyle.NATIVE
            ? 48
            : 64;

      return (
        <EmojiElement key={currentEmoji}>
          <Emoji size={emojiSize} emojiStyle={emojisStyle} unified={currentEmoji} />
        </EmojiElement>
      );
    } else {
      return (
        <AddReaction
          sx={{
            fontSize: "52px",
            color: fontColor,
            transition: ".3s all",
          }}
        />
      );
    }
  };

  useEffect(() => {
    setShowEmojiPicker(false);
  }, [user.settings.simpleEmojiPicker]);

  return (
    <>
      <EmojiContainer>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <EditBadge
              onClick={toggleEmojiPicker}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleEmojiPicker();
                }
              }}
            >
              <Edit />
            </EditBadge>
          }
        >
          <EmojiAvatar clr={color} onClick={toggleEmojiPicker}>
            {renderAvatarContent()}
          </EmojiAvatar>
        </Badge>
      </EmojiContainer>
      {"LanguageModel" in window && name !== undefined && (
        <Tooltip title={!name ? `Ingresa un nombre para el ${type} para encontrar emoji` : undefined}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <DisabledThemeProvider>
              <Button
                onClick={useAI}
                disabled={
                  name?.length < 3 ||
                  (type === "task"
                    ? name.length > TASK_NAME_MAX_LENGTH
                    : name.length > CATEGORY_NAME_MAX_LENGTH)
                }
              >
                <AutoAwesome /> &nbsp; Encontrar emoji con IA
              </Button>
            </DisabledThemeProvider>
          </div>
        </Tooltip>
      )}
      {/* Selector Simple de Emojis */}
      {showEmojiPicker && settings.simpleEmojiPicker && (
        <SimplePickerContainer>
          <Suspense fallback={<CircularProgress size={40} thickness={5} />}>
            <EmojiPicker
              style={{ border: "none" }}
              reactionsDefaultOpen
              reactions={getFrequentlyUsedEmojis()}
              emojiStyle={emojisStyle}
              onReactionClick={handleEmojiClick}
              allowExpandReactions={false}
              theme={emotionTheme.darkmode ? Theme.DARK : Theme.LIGHT}
              autoFocusSearch={false}
            />
          </Suspense>
          {currentEmoji && (
            <Button onClick={handleRemoveEmoji} fullWidth variant="outlined" color="error">
              <RemoveCircleOutline /> &nbsp; Eliminar Emoji
            </Button>
          )}
        </SimplePickerContainer>
      )}

      {showEmojiPicker && !settings.simpleEmojiPicker && (
        <>
          <Dialog
            open={showEmojiPicker}
            onClose={toggleEmojiPicker}
            slotProps={{
              paper: {
                style: {
                  padding: "12px",
                  borderRadius: "24px",
                  minWidth: "400px",
                },
              },
            }}
          >
            <CustomDialogTitle
              title="Elegir Emoji"
              subTitle={`Elige el emoji perfecto para tu ${type}.`}
              onClose={toggleEmojiPicker}
              icon={<AddReaction />}
            />
            <DialogContent sx={{ p: 0, m: 0 }}>
              {!isOnline && emojisStyle !== EmojiStyle.NATIVE && (
                <Box sx={{ mx: "14px", mb: "16px" }}>
                  <Alert severity="warning">
                    Los emojis pueden no cargarse correctamente sin conexión. Intenta cambiar al estilo de emoji nativo.
                  </Alert>
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    sx={{ mt: "14px" }}
                    onClick={() => {
                      setUser((prevUser) => ({
                        ...prevUser,
                        emojisStyle: EmojiStyle.NATIVE,
                      }));
                      setShowEmojiPicker(false);
                      setTimeout(() => setShowEmojiPicker(true), 100);
                    }}
                  >
                    <EmojiEmotions /> &nbsp; Cambiar a Emoji Nativo
                  </Button>
                </Box>
              )}
              <EmojiPickerContainer>
                <Suspense
                  fallback={
                    !settings.simpleEmojiPicker && (
                      <PickerLoader
                        pickerTheme={emotionTheme.darkmode ? "dark" : "light"}
                      ></PickerLoader>
                    )
                  }
                >
                  <EmojiPicker
                    width="100vw"
                    height="550px"
                    lazyLoadEmojis
                    emojiStyle={emojisStyle}
                    theme={emotionTheme.darkmode ? Theme.DARK : Theme.LIGHT}
                    suggestedEmojisMode={SuggestionMode.FREQUENT}
                    autoFocusSearch={false}
                    onEmojiClick={handleEmojiClick}
                    searchPlaceHolder="Buscar emoji"
                    previewConfig={{
                      defaultEmoji: "1f4dd",
                      defaultCaption: `Elige el emoji perfecto para tu ${type}`,
                    }}
                  />
                </Suspense>
              </EmojiPickerContainer>
            </DialogContent>
            <DialogActions>
              {currentEmoji && (
                <DialogBtn color="error" onClick={handleRemoveEmoji}>
                  <RemoveCircleOutline /> &nbsp; Eliminar Emoji
                </DialogBtn>
              )}
              {/* <DialogBtn onClick={() => n("#settings/Emoji")}>
                <SettingsRounded /> &nbsp; Configuración
              </DialogBtn> */}
              <DialogBtn onClick={toggleEmojiPicker}>Cancelar</DialogBtn>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

const EmojiContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 14px;
`;

const EmojiPickerContainer = styled(DialogContent)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 16px;
  animation: ${fadeIn} 0.4s ease-in;
  padding: 0;
  ${({ theme }) => reduceMotion(theme)}
`;

const SimplePickerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  margin: 16px;
  animation: ${fadeIn} 0.4s ease-in;
  padding: 0;
  ${({ theme }) => reduceMotion(theme)}
`;

const EmojiAvatar = styled(Avatar)<{ clr: string | undefined }>`
  background: ${({ clr, theme }) => clr || theme.primary};
  transition: 0.3s all;
  cursor: pointer;
  width: 96px;
  height: 96px;
`;

const EditBadge = styled(Avatar)`
  background: #9c9c9c81;
  backdrop-filter: blur(6px);
  cursor: pointer;
`;

interface PickerLoaderProps {
  pickerTheme: "light" | "dark" | undefined;
  width?: CSSProperties["width"] | undefined;
}

const PickerLoader = styled.div<PickerLoaderProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ width }) => width || "350px"};
  height: 500px;
  width: 100vw;
  padding: 8px;
  border-radius: 20px;
  background: transparent;
  border: ${({ pickerTheme }) => `1px solid ${pickerTheme === "dark" ? "#151617" : "#e7e7e7"}`};
`;

const EmojiElement = styled.div`
  animation: ${fadeIn} 0.4s ease-in;
  ${({ theme }) => reduceMotion(theme)}
`;