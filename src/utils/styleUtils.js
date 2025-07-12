export const getVariantClasses = (variants = {}, styles = {}) => {
  return Object.entries(variants)
    .map(([key, value]) => {
      // Собираем имя класса по шаблону: "variant-ИмяВарианта-ЗначениеВарианта"
      // Например, "variant-direction-row"
      const className = styles[`variant-${key}-${value}`];
      return className || '';
    })
    .filter(Boolean) // Убираем пустые значения, если класс не найден
    .join(' ');
};