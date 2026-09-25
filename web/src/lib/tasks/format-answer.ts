// Эталонный ответ в виде короткой строки для преподавателя
import type { Answer } from "./schema";

function tolerance(a: { tolerance?: number; relativeTolerance?: number }): string {
  if (a.tolerance) return ` (допуск ±${a.tolerance})`;
  if (a.relativeTolerance) return ` (допуск ±${+(a.relativeTolerance * 100).toFixed(4)}%)`;
  return "";
}

export function formatAnswer(answer: Answer): string {
  switch (answer.type) {
    case "number":
      return `${answer.value}${tolerance(answer)}`;
    case "expression":
    case "interval":
      return answer.value;
    case "roots":
      return answer.values.length ? answer.values.join("; ") : "корней нет";
    case "tuple":
      return `(${answer.values.join("; ")})`;
    case "quantity":
      return `${answer.value} ${answer.unit}${tolerance(answer)}`;
    case "digits":
      return answer.ordered === false ? `${answer.value} (порядок не важен)` : answer.value;
    case "steps":
      return answer.final ? `итог: ${formatAnswer(answer.final)}` : "без итогового ответа";
  }
}
