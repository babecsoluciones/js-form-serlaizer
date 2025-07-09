/**
 * formSerializer.js - Una librería para serializar elementos de formulario en un objeto JavaScript.
 *
 * Autor: Mario Ernesto Basurto Medrano
 * Versión: 1.0.1
 *
 * Esta librería permite serializar inputs, selects y textareas dentro de un contenedor
 * (un DIV o un FORM) en un objeto JavaScript, aplicando transformaciones específicas
 * basadas en las clases CSS de los campos.
 */

/** ejemplo
 * function obtenerDatosFormulario() {
 * // Llama a la función serialize de la librería formSerializer
 * const datosFormulario = formSerializer.serialize('miFormularioPrincipal');
 * console.log("Datos del Formulario Serializados:", datosFormulario);
 * // Aquí puedes enviar 'datosFormulario' a tu API o procesarlos.
 * }

 * function obtenerDatosDiv() {
 * // Llama a la función serialize de la librería formSerializer para un DIV
 * const datosDiv = formSerializer.serialize('miDivContenedor');
 * console.log("Datos del DIV Serializados:", datosDiv);
 * // Aquí puedes usar 'datosDiv' para lo que necesites.
 * }
 */

const formSerializer = {
    /**
     * Serializa todos los elementos de un formulario o DIV principal en un objeto JavaScript.
     *
     * @param {string} containerId - El ID del DIV principal o del formulario a serializar.
     * @returns {Object} Un objeto con los datos serializados, donde las claves son los atributos 'name'
     * de los elementos del formulario. Si el elemento no se encuentra, devuelve un objeto vacío.
     */
    serialize: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`formSerializer: El elemento con ID "${containerId}" no fue encontrado.`);
            return {};
        }

        const formData = {};
        const formElements = container.querySelectorAll(
            'input, select, textarea, [name]'
        );

        formElements.forEach((element) => {
            if (!element.name) {
                return;
            }

            let value = element.value;
            const name = element.name; // Usar const ya que 'name' no cambia.

            // IGNORAR CHECKBOXES NO SELECCIONADOS
            if (element.type === 'checkbox' && !element.checked) {
                return;
            }

            // IGNORAR RADIO BUTTONS NO SELECCIONADOS O YA PROCESADOS
            if (element.type === 'radio') {
                if (!element.checked || formData[element.name] !== undefined) {
                    return;
                }
                value = element.value;
            }

            // APLICAR FORMATOS
            if (element.classList.contains('format-float') || element.classList.contains('format-miles')) {
                value = value.replace(/,/g, '');
            }

            if (element.classList.contains('format-date')) {
                const dateTimeRegex = /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([apAP]\.?m\.?))?)?/;
                const match = value.match(dateTimeRegex);

                if (match) {
                    const [, day, month, year, hours, minutes, ampm] = match;
                    let formattedHours = hours ? parseInt(hours, 10) : null;
                    const formattedMinutes = minutes ? parseInt(minutes, 10) : null;

                    if (ampm) {
                        if (ampm.toLowerCase().includes('pm') && formattedHours < 12) {
                            formattedHours += 12;
                        } else if (ampm.toLowerCase().includes('am') && formattedHours === 12) {
                            formattedHours = 0;
                        }
                    }

                    let formattedDate = `${year}-${month}-${day}`;

                    if (formattedHours !== null && formattedMinutes !== null) {
                        const hourStr = String(formattedHours).padStart(2, '0');
                        const minuteStr = String(formattedMinutes).padStart(2, '0');
                        formattedDate += ` ${hourStr}:${minuteStr}`;
                    }
                    value = formattedDate;
                }
            }

            // --- Lógica de parseo y asignación para nombres complejos (arrays y objetos anidados) ---
            const nameParts = [];
            // Primero, reemplaza `[prop]` con `.prop` y `[]` con `._empty_array_` para simplificar el split por '.'
            // Luego, dividir por '.'
            const cleanedName = name.replace(/\[(\d+)\]/g, '.$1') // Convierte [0] a .0
                .replace(/\[([^\]]+)\]/g, '.$1') // Convierte [prop] a .prop
                .replace(/\[\]/g, '._empty_array_'); // Convierte [] a ._empty_array_

            cleanedName.split('.').forEach(part => {
                if (part === '_empty_array_') {
                    nameParts.push(''); // Usa una cadena vacía para representar el '[]'
                } else if (part) { // Evita partes vacías adicionales de split si hay puntos consecutivos, etc.
                    nameParts.push(part);
                }
            });

            let current = formData;

            for (let i = 0; i < nameParts.length; i++) {
                const part = nameParts[i];
                const isLastPart = (i === nameParts.length - 1);
                const isNumericIndex = /^\d+$/.test(part); // '0', '1', etc.
                const isEmptyArrayIndex = (part === ''); // Representa '[]'

                if (isLastPart) {
                    // Es la última parte del camino, asignamos el valor aquí.
                    if (isEmptyArrayIndex) { // Ej: 'colores[]' (la parte final es '')
                        const arrayKey = nameParts[i - 1]; // El nombre del array es la parte anterior
                        if (!current[arrayKey]) {
                            current[arrayKey] = [];
                        } else if (!Array.isArray(current[arrayKey])) {
                            current[arrayKey] = [current[arrayKey]]; // Convierte a array si ya tenía un valor simple
                        }
                        current[arrayKey].push(value); // Añadir el valor al array
                    } else if (isNumericIndex) { // Ej: 'items[0]' (la parte final es '0')
                        // El 'current' debe ser el array al que se le asigna el índice.
                        // Asegurarse de que 'current' es un array.
                        if (!Array.isArray(current)) {
                            console.warn(`formSerializer: Se esperaba un array en el camino para "${name}" en el índice ${part}, pero no se encontró. Ignorando elemento para evitar sobrescribir.`);
                            return; // Salir de esta iteración de forEach
                        }
                        current[parseInt(part, 10)] = value;
                    } else { // Ej: 'tCodTipoMaterial', 'medios[][tCodTipoMedio]' (donde 'tCodTipoMedio' es la última parte)
                        // Es una propiedad final.
                        // Si el patrón era 'array[][propiedad]', necesitamos añadir un objeto al array padre.
                        // Para detectar esto, buscamos 'array', luego una parte vacía ('') y luego 'propiedad'.
                        const parentArrayKey = (nameParts.length >= 3 && nameParts[i - 1] === '') ? nameParts[i - 2] : undefined;
                        const isObjectInArray = parentArrayKey !== undefined;

                        if (isObjectInArray) {
                            if (!formData[parentArrayKey]) {
                                formData[parentArrayKey] = [];
                            } else if (!Array.isArray(formData[parentArrayKey])) {
                                formData[parentArrayKey] = [formData[parentArrayKey]];
                            }
                            const newObject = {};
                            newObject[part] = value; // 'part' es 'tCodTipoMedio'
                            formData[parentArrayKey].push(newObject);
                        } else {
                            // Propiedad simple o parte final de un path regular (no array con [] al final)
                            if (current[part] !== undefined && !Array.isArray(current[part])) {
                                current[part] = [current[part]];
                            }
                            if (Array.isArray(current[part])) {
                                current[part].push(value);
                            } else {
                                current[part] = value;
                            }
                        }
                    }
                } else {
                    // No es la última parte, estamos construyendo el camino.
                    const nextPart = nameParts[i + 1];
                    const nextIsNumericIndex = /^\d+$/.test(nextPart);
                    const nextIsEmptyArrayIndex = (nextPart === '');

                    let targetKey = part;

                    if (!current[targetKey]) {
                        // Si la siguiente parte es un índice numérico o la parte vacía de '[]', inicializamos como array.
                        // De lo contrario, como objeto.
                        if (nextIsNumericIndex || nextIsEmptyArrayIndex) {
                            current[targetKey] = [];
                        } else {
                            current[targetKey] = {};
                        }
                    } else {
                        // Si ya existe, nos aseguramos de que el tipo sea consistente.
                        if (nextIsNumericIndex || nextIsEmptyArrayIndex) {
                            if (!Array.isArray(current[targetKey])) {
                                console.warn(`formSerializer: Conflicto de tipo. Se esperaba un array en el camino para "${name}" en la parte "${targetKey}", pero se encontró un objeto. Ignorando segmento para evitar sobrescribir.`);
                                return; // Salir de esta iteración de forEach
                            }
                        } else {
                            if (Array.isArray(current[targetKey])) {
                                console.warn(`formSerializer: Conflicto de tipo. Se esperaba un objeto en el camino para "${name}" en la parte "${targetKey}", pero se encontró un array. Esto podría causar problemas.`);
                            }
                        }
                    }
                    current = current[targetKey];
                }
            }
        });

        /**
         * Función auxiliar recursiva para limpiar arrays de nulls y undefineds.
         * También limpia objetos o arrays vacíos que puedan quedar después de la limpieza.
         * @param {any} obj - El objeto o array a limpiar.
         * @returns {any} El objeto o array limpio, o null si está vacío.
         */
        function cleanObject(obj) {
            if (Array.isArray(obj)) {
                const cleanedArray = obj.map(item => cleanObject(item)).filter(item => item !== null && item !== undefined);
                return cleanedArray.length > 0 ? cleanedArray : null; // Retorna null si el array queda vacío
            } else if (typeof obj === 'object' && obj !== null) {
                const cleanedObject = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const cleanedValue = cleanObject(obj[key]);
                        if (cleanedValue !== null && cleanedValue !== undefined) {
                            cleanedObject[key] = cleanedValue;
                        }
                    }
                }
                return Object.keys(cleanedObject).length > 0 ? cleanedObject : null; // Retorna null si el objeto queda vacío
            }
            return obj; // Retorna el valor si no es un objeto ni un array (ej. string, number, boolean)
        }

        // Limpiar el objeto formData antes de regresarlo
        const cleanedFormData = cleanObject(formData);
        return cleanedFormData || {}; // Asegura que siempre se retorne un objeto, incluso si queda vacío después de la limpieza.
    }
};