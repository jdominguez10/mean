'use strict' /**Para las novedades de Javascript*/ 

/** Protocolo HTTP */
const express = require('express');
/** Convertir las peticines en javascript*/
const bodyParser = require('body-parser');

const app = express();

// cargar rutas
const user_routes = require('./routes/user');


// middlewares

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
// cors

// rutas
app.use('/api', user_routes);

//exportar
module.exports = app;
