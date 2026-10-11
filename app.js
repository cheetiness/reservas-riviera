let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaximo = null;
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const cajaPrecioMaximo = document.querySelector("#precioMaximo");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");
const botonVaciar = document.querySelector("#botonVaciar");
const cajaConfirmacion = document.querySelector("#cajaConfirmacion");
const botonSi = document.querySelector("#botonSi");
const botonNo = document.querySelector("#botonNo");
function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje visible " + tipo;
}
async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) {
      throw new Error("No fue posible cargar las experiencias");
    }
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}
function obtenerResultados() {
  let resultados = [...experiencias];
  if (categoriaActual !== "todas") {
    resultados = resultados.filter(
      (experiencia) => experiencia.categoria === categoriaActual,
    );
  }
  if (textoBusqueda !== "") {
    resultados = resultados.filter((experiencia) =>
      experiencia.nombre.toLowerCase().includes(textoBusqueda),
    );
  }
  if (precioMaximo !== null) {
    resultados = resultados.filter(
      (experiencia) => experiencia.precio <= precioMaximo,
    );
  }
  if (ordenActual === "ascendente") {
    resultados.sort((a, b) => a.precio - b.precio);
  }
  if (ordenActual === "descendente") {
    resultados.sort((a, b) => b.precio - a.precio);
  }
  return resultados;
}
function actualizarCatalogo() {
  const resultados = obtenerResultados();
  if (resultados.length === 0) {
    catalogo.innerHTML = `
 <p class="sin-resultados">No se encontraron experiencias</p>
 `;
    estado.textContent = "0 resultados";
    return;
  }
  catalogo.innerHTML = resultados
    .map(
      (experiencia) => `
 <article class="tarjeta">
 <div class="imagen">${experiencia.icono}</div>
 <div class="informacion">
 <span class="categoria">${experiencia.categoria}</span>
 <h3>${experiencia.nombre}</h3>
 <p>Cupo disponible: ${experiencia.cupo}</p>
 <p class="precio">$${experiencia.precio} MXN</p>
 <label>Personas:
 <input type="number" id="cantidad-${experiencia.id}"
 min="1" max="${experiencia.cupo}" value="1">
 </label>
 <button class="btn-reservar" data-id="${experiencia.id}">
 Agregar
 </button>
 </div>
 </article>
 `,
    )
    .join("");
  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}
function agregarEventosReservar() {
  const botonesReservar = document.querySelectorAll(".btn-reservar");
  botonesReservar.forEach((boton) => {
    boton.addEventListener("click", () => {
      const id = Number(boton.dataset.id);
      agregarReserva(id);
    });
  });
}
function agregarReserva(id) {
  const experiencia = experiencias.find((elemento) => elemento.id === id);
  const entradaCantidad = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(entradaCantidad.value);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    mostrarMensaje(
      "Escribe una cantidad válida de personas (1 o más).",
      "error",
    );
    return;
  }
  if (cantidad > experiencia.cupo) {
    mostrarMensaje(
      `El cupo máximo de ${experiencia.nombre} es de ${experiencia.cupo} personas.`,
      "error",
    );
    return;
  }
  const reservaExistente = reservas.find(
    (reserva) => reserva.experienciaId === id,
  );
  if (reservaExistente) {
    const nuevaCantidad = reservaExistente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      mostrarMensaje(
        `Ya tienes ${reservaExistente.cantidad} persona(s) en ` +
          `${experiencia.nombre}. Solo caben ${experiencia.cupo}.`,
        "error",
      );
      return;
    }
    reservaExistente.cantidad = nuevaCantidad;
    reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: experiencia.id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad: cantidad,
      subtotal: experiencia.precio * cantidad,
    });
  }
  mostrarMensaje(`Se agregó ${experiencia.nombre} a tu reservación.`, "exito");
  mostrarReservas();
}
function cambiarCantidad(id, cambio) {
  const reserva = reservas.find((elemento) => elemento.experienciaId === id);
  const experiencia = experiencias.find((elemento) => elemento.id === id);
  const nuevaCantidad = reserva.cantidad + cambio;

  if (nuevaCantidad < 1) {
    mostrarMensaje(
      "La cantidad mínima es 1. Usa el botón Eliminar para quitar la experiencia.",
      "error",
    );
    return;
  }
  if (nuevaCantidad > experiencia.cupo) {
    mostrarMensaje(
      `No se puede superar el cupo de ${experiencia.cupo} personas.`,
      "error",
    );
    return;
  }
  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mostrarReservas();
}
function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    return;
  }
  listaReservas.innerHTML = reservas
    .map(
      (reserva) => `
 <article class="item-reserva">
 <div>
 <strong>${reserva.nombre}</strong>
 <p>${reserva.cantidad} persona(s) × $${reserva.precio}</p>
 <div class="controles-cantidad">
 <button class="btn-cantidad btn-menos" data-id="${reserva.experienciaId}"
 aria-label="Disminuir personas en ${reserva.nombre}">-</button>
 <span>${reserva.cantidad}</span>
 <button class="btn-cantidad btn-mas" data-id="${reserva.experienciaId}"
 aria-label="Aumentar personas en ${reserva.nombre}">+</button>
 </div>
 </div>
 <div>
 <strong>$${reserva.subtotal} MXN</strong>
 <button class="btn-eliminar" data-id="${reserva.experienciaId}"
 aria-label="Eliminar ${reserva.nombre}">
 Eliminar
 </button>
 </div>
 </article>
 `,
    )
    .join("");
  const totalReserva = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.subtotal,
    0,
  );
  const personasReservadas = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.cantidad,
    0,
  );
  total.textContent = `$${totalReserva} MXN`;
  totalPersonas.textContent = personasReservadas;
  agregarEventosReservas();
}
function agregarEventosReservas() {
  document.querySelectorAll(".btn-menos").forEach((boton) => {
    boton.addEventListener("click", () => {
      cambiarCantidad(Number(boton.dataset.id), -1);
    });
  });

  document.querySelectorAll(".btn-mas").forEach((boton) => {
    boton.addEventListener("click", () => {
      cambiarCantidad(Number(boton.dataset.id), 1);
    });
  });
  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarReserva(Number(boton.dataset.id));
    });
  });
}
function eliminarReserva(id) {
  reservas = reservas.filter((reserva) => reserva.experienciaId !== id);
  mostrarMensaje("Se eliminó la experiencia de tu reservación.", "exito");
  mostrarReservas();
}
buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});
filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});
ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});
cajaPrecioMaximo.addEventListener("input", () => {
  const valor = cajaPrecioMaximo.value.trim();
  if (valor === "") {
    precioMaximo = null;
  } else {
    precioMaximo = Number(valor);
  }
  actualizarCatalogo();
});
botonVaciar.addEventListener("click", () => {
  if (reservas.length === 0) {
    mostrarMensaje("No hay nada que vaciar.", "error");
    return;
  }
  cajaConfirmacion.classList.remove("oculto");
});
botonSi.addEventListener("click", () => {
  reservas = [];
  cajaConfirmacion.classList.add("oculto");
  mostrarReservas();
  mostrarMensaje("Tu reservación quedó vacía.", "exito");
});
botonNo.addEventListener("click", () => {
  cajaConfirmacion.classList.add("oculto");
  mostrarMensaje("No se borró nada.", "exito");
});
cargarExperiencias();
