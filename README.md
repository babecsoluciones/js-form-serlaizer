# formSerializer.js

Una librería JavaScript ligera para serializar elementos de formulario (inputs, selects, textareas) dentro de un contenedor HTML (DIV o FORM) en un objeto JavaScript, aplicando transformaciones específicas basadas en las clases CSS de los campos.

## Autor

Mario Ernesto Basurto Medrano

## Versión

1.0.1

## Características

* Serializa campos de formulario por su atributo `name`.
* Soporta la creación de objetos anidados y arrays a partir de nombres de campo con notación de punto (`.`) y corchetes (`[]`).
* Ignora checkboxes y radio buttons no seleccionados.
* Aplica formatos de limpieza para números (ej. `format-float`, `format-miles`) y fechas (`format-date`).
* Maneja formatos de fecha `DD/MM/YYYY` y `DD/MM/YYYY HH:MM [AM/PM]`, convirtiéndolos a `YYYY-MM-DD` o `YYYY-MM-DD HH:MM` respectivamente.
* Limpia el objeto resultante de valores `null` o `undefined`, así como de arrays u objetos vacíos.

## Instalación

No se requiere instalación a través de gestores de paquetes. Simplemente descarga el archivo `formSerializer.js` e inclúyelo en tu proyecto HTML:


<script src="path/to/formSerializer.js"></script>

## Uso
La librería expone un objeto global formSerializer con un único método serialize(containerId).

formSerializer.serialize(containerId)
Serializa todos los elementos de formulario contenidos dentro de un elemento HTML con el id especificado.

containerId: (String) El ID del DIV principal o del formulario HTML que deseas serializar.

Retorna: (Object) Un objeto JavaScript con los datos serializados. Las claves del objeto corresponden a los atributos name de los elementos del formulario. Si el contenedor no se encuentra, devuelve un objeto vacío.

Ejemplos
Serializar un formulario completo

```html
<form id="miFormularioPrincipal">
    <input type="text" name="nombre" value="Juan Pérez">
    <input type="email" name="contacto.email" value="juan.perez@example.com">
    <input type="checkbox" name="intereses[]" value="programacion" checked>
    <input type="checkbox" name="intereses[]" value="diseño">
    <input type="radio" name="genero" value="masculino" checked>
    <input type="radio" name="genero" value="femenino">
    <input type="text" name="monto" class="format-float" value="1,234.56">
    <input type="text" name="fechaNacimiento" class="format-date" value="25/12/1990">
    <input type="text" name="evento.fechaHora" class="format-date" value="01/07/2025 10:30 AM">
    <select name="pais">
        <option value="MX">México</option>
        <option value="US" selected>Estados Unidos</option>
    </select>
    <textarea name="comentarios">Esto es un comentario.</textarea>

    <input type="text" name="medios[][tCodTipoMedio]" value="email">
    <input type="text" name="medios[][valor]" value="info@example.com">

    <input type="text" name="medios[][tCodTipoMedio]" value="telefono">
    <input type="text" name="medios[][valor]" value="5512345678">

    <input type="text" name="productos[0][id]" value="P001">
    <input type="text" name="productos[0][nombre]" value="Laptop">
    <input type="text" name="productos[1][id]" value="P002">
    <input type="text" name="productos[1][nombre]" value="Mouse">
</form>

<script>
    function obtenerDatosFormulario() {
        const datosFormulario = formSerializer.serialize('miFormularioPrincipal');
        console.log("Datos del Formulario Serializados:", datosFormulario);
        /*
        Salida esperada:
        {
            nombre: "Juan Pérez",
            contacto: {
                email: "juan.perez@example.com"
            },
            intereses: ["programacion"],
            genero: "masculino",
            monto: "1234.56",
            fechaNacimiento: "1990-12-25",
            evento: {
                fechaHora: "2025-07-01 10:30"
            },
            pais: "US",
            comentarios: "Esto es un comentario.",
            medios: [
                { tCodTipoMedio: "email", valor: "info@example.com" },
                { tCodTipoMedio: "telefono", valor: "5512345678" }
            ],
            productos: [
                { id: "P001", nombre: "Laptop" },
                { id: "P002", nombre: "Mouse" }
            ]
        }
        */
    }

    // Llama a la función al cargar la página o con un evento
    obtenerDatosFormulario();
</script>

```
## Serializar un DIV contenedor
```html
<div id="miDivContenedor">
    <input type="text" name="datos.usuario.primerNombre" value="Ana">
    <input type="text" name="datos.usuario.apellido" value="García">
    <select name="configuracion.tema">
        <option value="claro">Claro</option>
        <option value="oscuro" selected>Oscuro</option>
    </select>
</div>

<script>
    function obtenerDatosDiv() {
        const datosDiv = formSerializer.serialize('miDivContenedor');
        console.log("Datos del DIV Serializados:", datosDiv);
        /*
        Salida esperada:
        {
            datos: {
                usuario: {
                    primerNombre: "Ana",
                    apellido: "García"
                },
                configuracion: {
                    tema: "oscuro"
                }
            }
        }
        */
    }

    obtenerDatosDiv();
</script>
```

## Formatos Soportados
Aplica clases CSS a tus elementos input para activar las transformaciones:

format-float: Elimina comas (,) de un valor numérico. Útil para campos de moneda o decimales.

Ejemplo: value="1,234.56" se convierte en "1234.56".

format-miles: Similar a format-float, elimina comas (,).

Ejemplo: value="10,000" se convierte en "10000".

format-date: Transforma fechas de DD/MM/YYYY o DD/MM/YYYY HH:MM [AM/PM] a formato YYYY-MM-DD o YYYY-MM-DD HH:MM.

Ejemplo: value="25/12/1990" se convierte en "1990-12-25".

Ejemplo: value="01/07/2025 03:45 PM" se convierte en "2025-07-01 15:45".

## Estructuras de Nombre de Campo Soportadas
La librería es capaz de crear objetos anidados y arrays basados en la notación de los atributos name:

Propiedades simples: name="nombreCampo"

JavaScript

```html
{ nombreCampo: "valor" }
Objetos anidados: name="objeto.propiedad" o name="objeto[propiedad]"

```
JavaScript
```html
{ objeto: { propiedad: "valor" } }
Arrays simples (con [] al final): name="miArray[]"
```
Si hay múltiples elementos con el mismo name="miArray[]", se recolectan en un array.

```html

<input type="checkbox" name="intereses[]" value="leer" checked>
<input type="checkbox" name="intereses[]" value="escribir" checked>
```
JavaScript

{ intereses: ["leer", "escribir"] }
Arrays con índices numéricos: name="miArray[0]", name="miArray[1]"

HTML

<input type="text" name="elementos[0]" value="Primero">
<input type="text" name="elementos[1]" value="Segundo">
JavaScript

{ elementos: ["Primero", "Segundo"] }
Arrays de objetos anidados (usando [][]): name="arrayObjetos[][propiedad]"

Esta notación permite agrupar campos relacionados en objetos dentro de un array, donde cada [] vacío indica un nuevo objeto en el array. Es importante que los campos que formen un mismo objeto consecutivo tengan la misma parte arrayObjetos[][].

```html
<input type="text" name="productos[][id]" value="P001">
<input type="text" name="productos[][nombre]" value="Laptop">
<input type="text" name="productos[][id]" value="P002">
<input type="text" name="productos[][nombre]" value="Monitor">
```
JavaScript

{
    productos: [
        { id: "P001", nombre: "Laptop" },
        { id: "P002", nombre: "Monitor" }
    ]
}
Nota: Para que esta característica funcione correctamente, los campos que pertenecen al mismo objeto dentro del array deben estar agrupados consecutivamente en el HTML.

## Contribuciones
Las contribuciones son bienvenidas. Si encuentras un error o tienes una sugerencia de mejora, por favor abre un 'issue' o envía un 'pull request' en el repositorio de GitHub.
