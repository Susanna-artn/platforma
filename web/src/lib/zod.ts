// zod с русскими сообщениями об ошибках по умолчанию
import { z } from "zod";

z.config(z.locales.ru());
z.config({
  customError: (issue) =>
    issue.code === "invalid_type" && issue.input === undefined ? "Обязательное поле" : undefined,
});

export { z };
