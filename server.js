const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Servir archivos estáticos
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Mapa para almacenar qué usuario ha seleccionado qué asiento
const seatOwners = {};
let selectedSeats = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Enviar los asientos actualmente seleccionados al usuario recién conectado
  socket.emit("currentSelectedSeats", selectedSeats);

  // Manejar la selección de asientos
  socket.on("seatSelected", (seat) => {
    if (!selectedSeats.includes(seat)) {
      selectedSeats.push(seat);
      seatOwners[seat] = socket.id; // Asignar el propietario del asiento
      io.emit("seatSelected", seat); // Emitir a todos los clientes
    } else {
      // Notificar al usuario que el asiento ya está ocupado
      socket.emit("seatOccupied", seat);
    }
  });

  // Manejar la deselección de asientos
  socket.on("seatDeselected", (seat) => {
    if (seatOwners[seat] === socket.id) {
      // Verificar si el usuario que intenta deseleccionar es el propietario
      selectedSeats = selectedSeats.filter((s) => s !== seat);
      delete seatOwners[seat]; // Eliminar el propietario del asiento
      io.emit("seatDeselected", seat); // Emitir a todos los clientes
    } else {
      // Notificar que no puede deseleccionar el asiento
      socket.emit("notOwner", seat);
    }
  });

  // Manejar desconexión
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Limpiar los asientos seleccionados por el usuario que se desconecta
    Object.keys(seatOwners).forEach((seat) => {
      if (seatOwners[seat] === socket.id) {
        selectedSeats = selectedSeats.filter((s) => s !== seat);
        delete seatOwners[seat];
        io.emit("seatDeselected", seat); // Emitir a todos los clientes
      }
    });
  });
});

// Escuchar en el puerto 3000 (o el puerto que prefieras)
server.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// // Servir archivos estáticos
// app.use(express.static("public"));

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Crear una estructura para 15 buses
// const busSeats = {};
// const numberOfBuses = 15;
// const seatsPerBus = 50;

// // Inicializar los buses y sus asientos
// for (let i = 1; i <= numberOfBuses; i++) {
//   busSeats[`bus${i}`] = { selectedSeats: [], seatOwners: {} };
// }

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   // Enviar los asientos actualmente seleccionados al usuario recién conectado
//   socket.emit("currentSelectedSeats", busSeats);

//   // Manejar la selección de asientos
//   socket.on("seatSelected", ({ busId, seat }) => {
//     if (!busSeats[busId].selectedSeats.includes(seat)) {
//       busSeats[busId].selectedSeats.push(seat);
//       busSeats[busId].seatOwners[seat] = socket.id; // Asignar el propietario del asiento
//       io.emit("seatSelected", { busId, seat }); // Emitir a todos los clientes
//     } else {
//       // Notificar al usuario que el asiento ya está ocupado
//       socket.emit("seatOccupied", { busId, seat });
//     }
//   });

//   // Manejar la deselección de asientos
//   socket.on("seatDeselected", ({ busId, seat }) => {
//     if (busSeats[busId].seatOwners[seat] === socket.id) {
//       // Verificar si el usuario que intenta deseleccionar es el propietario
//       busSeats[busId].selectedSeats = busSeats[busId].selectedSeats.filter(
//         (s) => s !== seat
//       );
//       delete busSeats[busId].seatOwners[seat]; // Eliminar el propietario del asiento
//       io.emit("seatDeselected", { busId, seat }); // Emitir a todos los clientes
//     } else {
//       // Notificar que no puede deseleccionar el asiento
//       socket.emit("notOwner", { busId, seat });
//     }
//   });

//   // Manejar desconexión
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//     // Limpiar los asientos seleccionados por el usuario que se desconecta
//     Object.keys(busSeats).forEach((busId) => {
//       Object.keys(busSeats[busId].seatOwners).forEach((seat) => {
//         if (busSeats[busId].seatOwners[seat] === socket.id) {
//           busSeats[busId].selectedSeats = busSeats[busId].selectedSeats.filter(
//             (s) => s !== seat
//           );
//           delete busSeats[busId].seatOwners[seat];
//           io.emit("seatDeselected", { busId, seat }); // Emitir a todos los clientes
//         }
//       });
//     });
//   });
// });

// // Escuchar en el puerto 3000 (o el puerto que prefieras)
// server.listen(3000, () => {
//   console.log("Servidor escuchando en http://localhost:3000");
// });
