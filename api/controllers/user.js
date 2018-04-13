'use strict'
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
//agregar servicios
var jwt = require('../services/jwt');


function home(req, res){
    res.status(200).send({
        message: 'Hola mundo desde el servidor NodoJS'
    });
}


function pruebas(req, res){
        res.status(200).send({
            message: 'Acción de pruebas en el servidor de NodeJS'
        });
}

function saveUser(req, res){
   
        var params = req.body;
        var user = new User();
        
       
        if(params.name && params.surname && params.nick && params.email && params.password){
            
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            //Controlar los Usuarios duplicados
            User.find({ $or: [
                    {email: user.email.toLowerCase()},
                    {nick: user.nick.toLowerCase()}
            ]}).exec((err, users) => { 
                if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});
                if(users && users.length >= 1){
                    return res.status(200).send({message: 'El usuario ya esta registrado'});
                }else{

                    //Cifra los datos
                    bcrypt.hash(params.password, null, null, (err,hash) => {
                        user.password = hash;
                        user.save((err, userStored) => {
                            if(err) return res.status(500).send({menssage : 'Error al guardar el usuario'})
                            if(userStored){
                                res.status(200).send({user: userStored})
                            }else{
                                res.status(400).send({menssage : 'No se ha registrado el usuario'})
                            }
                        });

                    });


                }

            });


            
        }else{
            res.status(200).send({
                message: 'Envia todos los campos enecesarios!!'
            });

        }
}
function loginUser(req,res){
    var params = req.body;

    var email = params.email;
    var password = params.password;


    User.findOne({email : email}, (err, user) => {
            if(err){
                return res.status(500).send({message: 'Error en la petición'});
            }
            if(user){
                bcrypt.compare(password, user.password, (err, check) =>{
                    if(check){
                        if(params.gettoken){
                                //generar y devolver el token
                                //gemerar token
                                return res.status(200).send({token: jwt.createToken(user)});
                        }else{
                            //devolver datos de usuario
                             user.password = undefined;
                             return res.status(200).send({ message:'Login realizado correctamente', user});

                        } 

                    }else{
                        return res.status(404).send({message: 'El usuario no se ha podido identificar 1'})
                    }
                });
            }else{
                return res.status(404).send({message:'El usuario no se ha podido identificar 2'});

            }
    });


}


module.exports = {
	home, 
    pruebas,
    saveUser,
    loginUser
}

