'use strict'

/* Modelo de tipo Mongoose */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Definimos el Schema
var UserSchema = Schema ({
	name: String,
	surname: String,
	nick: String,
	email: String,
	password: String,
	role: String,
	image: String
});

// Exportamos el modulo que importa. 
// Llamada a Mongoose y explicitar el nombre y el esquema.
// Nombre en singular
module.exports = mongoose.model('User', UserSchema)
