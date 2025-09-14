const recentGreetings: Set<number> = new Set();
export const maxRecentGreetings = 8; // Número de saludos recientes a rastrear

const hoursLeft = 24 - new Date().getHours();

const greetingsText: string[] = [
  "¡Hagamos que hoy cuente! **1f680**",
  "¡Termina tus tareas y conquista el día!",
  "¡Aprovecha el poder de la productividad!",
  "Fija tus metas, cúmplelas, repite.",
  "¡Hoy es una nueva oportunidad para ser productivo!",
  "Haz que cada momento cuente.",
  "Mantente organizado, mantente adelante.",
  "¡Toma el control de tu día!",
  "Una tarea a la vez, ¡tú puedes!",
  "La productividad es la clave del éxito. **1f511**",
  "¡Convirtamos planes en logros!",
  "Comienza pequeño, logra grandes cosas.",
  "Sé eficiente, sé productivo.",
  "¡Aprovecha el poder de la productividad!",
  "¡Prepárate para hacer que las cosas sucedan!",
  "¡Es hora de marcar esas tareas! **2705**",
  "¡Comienza tu día con un plan! **1f5d3-fe0f**",
  "Mantén el enfoque, mantén la productividad.",
  "Desbloquea tu potencial de productividad. **1f513**",
  "¡Convierte tu lista de pendientes en una lista de completados! **1f4dd**",
  `¡Que tengas un maravilloso ${new Date().toLocaleDateString("es", {
    weekday: "long",
  })}!`,
  `¡Feliz ${new Date().toLocaleDateString("es", {
    month: "long",
  })}! Un gran mes para la productividad!`,
  hoursLeft > 4
    ? `Quedan ${hoursLeft} horas en el día. ¡Úsalas sabiamente!`
    : `Solo quedan ${hoursLeft} horas en el día`,
];

/**
 * Devuelve un mensaje de saludo aleatorio para inspirar productividad.
 * @returns {string} Un mensaje de saludo aleatorio con código opcional de emoji.
 */
export const getRandomGreeting = (): string => {
  // Función para obtener un nuevo saludo que no se haya usado recientemente
  const getUniqueGreeting = (): string => {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * greetingsText.length);
    } while (recentGreetings.has(randomIndex));

    // Actualizar saludos recientes
    recentGreetings.add(randomIndex);
    if (recentGreetings.size > maxRecentGreetings) {
      const firstEntry = Array.from(recentGreetings).shift();
      if (firstEntry !== undefined) {
        recentGreetings.delete(firstEntry);
      }
    }

    return greetingsText[randomIndex];
  };

  return getUniqueGreeting();
};